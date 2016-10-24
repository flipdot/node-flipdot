import * as request from "request";

const spaceStatusURL = "http://flipdot.org/spacestatus/status.json";
const powerConsumptionURL = "http://infragelb.de/flipdot-power/";

const hutschienenHost = "hutschienenpi.fd";
const hutschienenPort = 8080;

const canBusBase = `http://${hutschienenHost}:${hutschienenPort}`;
const hutshieneClientName = "Hutschiene";
const radiatorClientName = "theemin";

export interface SpaceStatus {
	open: boolean;
	known_users: User[];
	unknown_users: number;

	temperature_setpoint: number;
	temperature_realvalue: number;
	heater_valve: number;
}

export interface PowerConsumption {
	/**
	 * Power consumption in Watts
	 * @type {number}
	 */
	consumption: number;
	timestamp: Date;
}

export interface User {
	nick: string;
}

export interface Temperature {
	value: number;
	unit: string;
}

/**
  * @deprecated The light does not exist any more.
 */
export const enum LightStatus {
	Off = 0,
	On = 1
}

type RequestFunction = (url: string, callback: (err: any, res: any, body: any) => void) => void;
type ParseFunction = (body: string) => void;
type Parser<T> = ((body: string) => [any | null, T | null]);

function wrapWithTry<T>(fn: () => T): [Error | null, T | null] {
	try {
		return [null, fn()];
	} catch (ex) {
		return [ex, null];
	}
}

function doAndParseRequest<T>(request: RequestFunction, parser: Parser<T> | null, url: string): Promise<T | null> {
	return new Promise<T | null>((resolve, reject) => {
		let hadError = false;
		request(url, (err, res, body) => {
			if (!err && isSuccess(res)) {
				if (hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.

				let [err, finalResult] = parser !== null ? parser(body) : [null, null];
				return err ? reject(err) : resolve(finalResult);
			}
			if (!!err) {
				hadError = true;
				reject(err);
			}
		});
	});
}

/**
 * Switches the orange light on or off.
 * @deprecated The light does not exist any more.
 */
export function setOrangeLightStatus(status: LightStatus): Promise<void> {
	let statusString = status == LightStatus.On ? "true" : "false";
	let orangeLightUrl = getCANUrl(hutshieneClientName, "OrangeLight");
	let statusUrl = `${orangeLightUrl}?state=${statusString}`;

	return doAndParseRequest<void>(
		request.post,
		null,
		statusUrl);
}

/**
 * Gets the current temperature as measured by the sensor of the radiator control.
 */
export function getCurrentTemperature(): Promise<Temperature> {
	let serviceUrl = getCANUrl(radiatorClientName, "GetActTemp");

	return doAndParseRequest<Temperature>(
		request.get,
		body => wrapWithTry(() => parseTemperature(body)),
		serviceUrl);
}

/**
 * Gets the temperature that the radiator is set to.
 */
export function getTargetTemperature(): Promise<Temperature> {
	let serviceUrl = getCANUrl(radiatorClientName, "GetTargetTemp");

	return doAndParseRequest<Temperature>(
		request.get,
		body => wrapWithTry(() => parseTemperature(body)),
		serviceUrl);
}

/**
 * Sets the target temperature of the radiator.
 * @param {number} temperature The target temperature in celsius.
 */
export function setTargetTemperature(temperature: number): Promise<void> {
	// TODO: TEST THIS
	let opUrl = getCANUrl(radiatorClientName, "SetTargetTemp");
	let serviceUrl = `${opUrl}?temp=${temperature}`;

	return doAndParseRequest<void>(
		request.post,
		null,
		serviceUrl);
}

/**
 * Retrieves the current status of the hackerspace.
 * @param {ISpaceStatusCallback} callback The callback of the async operation.
 */
export function getSpaceStatus(): Promise<SpaceStatus> {
	return doAndParseRequest<SpaceStatus>(
		request.get,
		body => wrapWithTry(() => {
			let status = JSON.parse(body);
			return fixStatus(status);
		}),
		spaceStatusURL);
}

/**
 * Get current power consumption in Watts.
 */
export function getPowerConsumption(): Promise<PowerConsumption> {
	return doAndParseRequest<PowerConsumption>(
		request.get,
		body => wrapWithTry(() => parsePowerConsumption(body)),
		powerConsumptionURL);
}

/**
 * Internal method to normalize the return value of the API.
 * @param  {ISpaceStatus} status The original return value.
 * @return {ISpaceStatus}        The normalized result.
 */
function fixStatus(status: SpaceStatus): SpaceStatus {
	return {
		open: status.open || false,
		known_users: status.known_users || [],
		unknown_users: status.unknown_users || 0,
		temperature_setpoint: status.temperature_setpoint || 0,
		temperature_realvalue: status.temperature_realvalue || 0,
		heater_valve: status.heater_valve || 0
	};
}

function parsePowerConsumption(apiResponse: string): PowerConsumption {
	if (!apiResponse || apiResponse.trim() == "")
		throw new Error("Empty API response.");

	var splitted = apiResponse.trim().split(",");
	if (!splitted || splitted.length !== 3)
		throw new Error("Invalid API response (malformed CSV).");

	// 27.01.2015,21:47:48,00438

	let dateStr = splitted[0].trim();
	let timeStr = splitted[1].trim();
	let consumptionStr = splitted[2].trim();

	let dateSplit = dateStr.split(".");
	let timeSplit = timeStr.split(":");

	if (dateSplit.length !== 3 || timeSplit.length !== 3)
		throw new Error("Invalid API response (malformed date/time).");

	// constructor for months takes 0-based months
	let timestamp = new Date(parseInt(dateSplit[2]), parseInt(dateSplit[1]) - 1, parseInt(dateSplit[0]),
								parseInt(timeSplit[0]), parseInt(timeSplit[1]), parseInt(timeSplit[2]), 0);

	return {
		timestamp: timestamp,
		consumption: parseInt(consumptionStr) /* may catch parse error here to throw specific exception */
	};
}

/**
 * Parses a temperature response of the radiator client.
 */
function parseTemperature(responseBody: string): Temperature {
	if (!responseBody || responseBody.trim() === "")
		throw new Error("Got empty response from CAN client");

	let temp = responseBody.trim().toLowerCase();
	return {
		value: parseInt(temp),
		unit: "°C"
	};
}

function getCANUrl(clientName: string, operation: string = ""): string {
	if (operation !== "")
		operation = "/" + operation;
	return `${canBusBase}/${clientName}${operation}`;
}

function isSuccess(res: any): boolean {
	if (!res || !res.statusCode)
		return false;
	return res.statusCode >= 200 && res.statusCode < 300;
}
