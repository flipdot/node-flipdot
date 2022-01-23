import fetch, { Response } from "node-fetch";
import { createSocket } from "dgram";

const spaceStatusURL = "http://flipdot.org/spacestatus/status.json";
const powerConsumptionURL = "http://infragelb.de/flipdot-power/";

const hutschienenHost = "hutschienenpi.fd";
const hutschienenPort = 8080;

const zahnarztlampeAddress = "192.168.3.102";
const zahnarztlampePort = 2390;

const canBusBase = `http://${hutschienenHost}:${hutschienenPort}`;
const hutshieneClientName = "Hutschiene";
const radiatorClientName = "theemin";

const upp4Socket = createSocket("udp4");

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

export interface Color {
	r: number;
	g: number;
	b: number;
}

export function setZahnarztlampeColor(color: Color): void {
	const clampedColor = fixColor(color);
	const str = clampedColor.r + ":" + clampedColor.g + ":" + clampedColor.b;
	upp4Socket.send(str, zahnarztlampePort, zahnarztlampeAddress);
}

function fixColor(color: Color): Color {
	return {
		r: Math.min(255, Math.max(0, color.r)),
		g: Math.min(255, Math.max(0, color.g)),
		b: Math.min(255, Math.max(0, color.b)),
	};
}

/**
 * Gets the current temperature as measured by the sensor of the radiator control.
 */
export async function getCurrentTemperature(): Promise<Temperature> {
	const serviceUrl = getCANUrl(radiatorClientName, "GetActTemp");
	const res = await fetch(serviceUrl);
	throwIfNotOkay(res);
	const currentTemp = await res.text();
	return parseTemperature(currentTemp);
}

/**
 * Gets the temperature that the radiator is set to.
 */
export async function getTargetTemperature(): Promise<Temperature> {
	const serviceUrl = getCANUrl(radiatorClientName, "GetTargetTemp");
	const res = await fetch(serviceUrl);
	throwIfNotOkay(res);
	const targetTemp = await res.text();
	return parseTemperature(targetTemp);
}

/**
 * Sets the target temperature of the radiator.
 * @param {number} temperature The target temperature in celsius.
 */
export function setTargetTemperature(temperature: number): Promise<Response> {
	// TODO: TEST THIS
	const opUrl = getCANUrl(radiatorClientName, "SetTargetTemp");
	const serviceUrl = `${opUrl}?temp=${temperature}`;

	return fetch(serviceUrl, { method: "POST" });
}

/**
 * Retrieves the current status of the hackerspace.
 */
export async function getSpaceStatus(): Promise<SpaceStatus> {
	const res = await fetch(spaceStatusURL);
	throwIfNotOkay(res);
	const status = await res.json();
	return fixStatus(status as SpaceStatus);
}

/**
 * Get current power consumption in Watts.
 */
export async function getPowerConsumption(): Promise<PowerConsumption> {
	const res = await fetch(powerConsumptionURL);
	throwIfNotOkay(res);
	const consumption = await res.text();
	return parsePowerConsumption(consumption);
}

/**
 * Internal method to normalize the return value of the API.
 * @param  {SpaceStatus} status The original return value.
 * @return {SpaceStatus}        The normalized result.
 */
function fixStatus(status: SpaceStatus): SpaceStatus {
	return {
		open: status.open || false,
		known_users: status.known_users || [],
		unknown_users: status.unknown_users || 0,
		temperature_setpoint: status.temperature_setpoint || 0,
		temperature_realvalue: status.temperature_realvalue || 0,
		heater_valve: status.heater_valve || 0,
	};
}

function parsePowerConsumption(apiResponse: string): PowerConsumption {
	if (!apiResponse || apiResponse.trim() == "")
		throw new Error("Empty API response.");

	var splitted = apiResponse.trim().split(",");
	if (!splitted || splitted.length !== 3)
		throw new Error("Invalid API response (malformed CSV).");

	// 27.01.2015,21:47:48,00438

	const dateStr = splitted[0].trim();
	const timeStr = splitted[1].trim();
	const consumptionStr = splitted[2].trim();

	const dateSplit = dateStr.split(".");
	const timeSplit = timeStr.split(":");

	if (dateSplit.length !== 3 || timeSplit.length !== 3)
		throw new Error("Invalid API response (malformed date/time).");

	// constructor for months takes 0-based months
	const timestamp = new Date(
		parseInt(dateSplit[2]),
		parseInt(dateSplit[1]) - 1,
		parseInt(dateSplit[0]),
		parseInt(timeSplit[0]),
		parseInt(timeSplit[1]),
		parseInt(timeSplit[2]),
		0
	);

	return {
		timestamp,
		consumption:
			parseInt(
				consumptionStr
			) /* may catch parse error here to throw specific exception */,
	};
}

/**
 * Parses a temperature response of the radiator client.
 */
function parseTemperature(responseBody: string): Temperature {
	if (!responseBody || responseBody.trim() === "")
		throw new Error("Got empty response from CAN client");

	const temp = responseBody.trim().toLowerCase();
	return {
		value: parseInt(temp),
		unit: "°C",
	};
}

function getCANUrl(clientName: string, operation: string = ""): string {
	if (operation !== "") operation = "/" + operation;
	return `${canBusBase}/${clientName}${operation}`;
}

function throwIfNotOkay(res: Response): never | void {
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}
