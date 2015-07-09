/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/request/request.d.ts" />

import * as request from "request";

module flipdot
{
	const spaceStatusURL = "http://flipdot.org/spacestatus/status.json";
	const powerConsumptionURL = "http://infragelb.de/flipdot-power/";

	const hutschienenHost = "hutschienenpi.fd";
	const hutschienenPort = 8080;

	const canBusBase = `http://${hutschienenHost}:${hutschienenPort}`;
	const hutshieneClientName = "Hutschiene";
	const radiatorClientName = "theemin";

	export interface ISpaceStatus
	{
		open: boolean;
		known_users: IUser[];
		unknown_users: number;
	}

	export interface IPowerConsumption
	{
		/**
		 * Power consumption in Watts
		 * @type {number}
		 */
		consumption: number;
		timestamp: Date;
	}

	export interface IUser
	{
		nick: string;
	}

	export interface ITemperature
	{
		value: number;
		unit: string;
	}

	export interface ICallback<T>
	{
		(err: any, status: T): void;
	}

	export enum LightStatus
	{
		off = 0,
		on = 1
	}

	/**
	 * Switches the orange light on or off.
	 */
	export function setOrangeLightStatus(status: LightStatus, callback: ICallback<void>): void
	{
		callback = callback || ((err, status) => {});
		let hadError = false;

		let statusString = status == LightStatus.on ? "true" : "false";
		let orangeLightUrl = getCANUrl(hutshieneClientName, "OrangeLight");
		let statusUrl = `${orangeLightUrl}?state=${statusString}`;

		request.post(statusUrl, (err, res, body) => {
			if(!err && isSuccess(res))
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.
				callback(null, null);
			}
			else if(!!err)
			{
				hadError = true;
				callback(err, null);
			}
		});
	}

	/**
	 * Gets the current temperature as measured by the sensor of the radiator control.
	 */
	export function getCurrentTemperature(callback: ICallback<ITemperature>): void
	{
		callback = callback || ((err, status) => {});
		let hadError = false;
		let serviceUrl = getCANUrl(radiatorClientName, "getActTemp");

		request.get(serviceUrl, (err, res, body) => {
			if(!err && isSuccess(res))
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.
				callback(null, parseTemperature(body));
			}
			else if(!!err)
			{
				hadError = true;
				callback(err, null);
			}
		});
	}

	/**
	 * Gets the temperature that the radiator is set to.
	 */
	export function getTargetTemperature(callback: ICallback<ITemperature>): void
	{
		callback = callback || ((err, status) => {});
		let hadError = false;
		let serviceUrl = getCANUrl(radiatorClientName, "getTargetTemp");

		request.get(serviceUrl, (err, res, body) => {
			if(!err && isSuccess(res))
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.
				callback(null, parseTemperature(body));
			}
			else if(!!err)
			{
				hadError = true;
				callback(err, null);
			}
		});
	}

	/**
	 * Sets the target temperature of the radiator.
	 * @param {number} temperature The target temperature in celsius.
	 */	
	export function setTargetTemperature(temperature: number, callback: ICallback<void>): void
	{
		callback = callback || ((err, status) => {});
		let hadError = false;

		/*
		 "Param xx: ((soll)*2) in hex. Alle Hexwerte in Kleinbuchstaben.
		  z.B. Soll = 20C. 20*2 = 40; 40=28h" (wtf)
		*/
		let targetTemp = (temperature * 2).toString(16);
		// TODO: TEST THIS
		// TODO: Append hex-Postfix? (h)
		// TODO: Padleft with 0?
		// TODO: HTTP parameter name?
		let opUrl = getCANUrl(radiatorClientName, "SetTargetTemp");
		let serviceUrl = `${opUrl}?temp=${targetTemp}`;

		request.post(serviceUrl, (err, res, body) => {
			if(!err && isSuccess(res))
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.
				callback(null, null);
			}
			else if(!!err)
			{
				hadError = true;
				callback(err, null);
			}
		});
	}
	
	/**
	 * @deprecated Use getSpaceStatus instead
	 * Retrieves the current status of the hackerspace.
	 * @param {ISpaceStatusCallback} callback The callback of the async operation.
	 */
	export let requestSpaceStatus = getSpaceStatus;
	
	/**
	 * Retrieves the current status of the hackerspace.
	 * @param {ISpaceStatusCallback} callback The callback of the async operation.
	 */
	export function getSpaceStatus(callback: ICallback<ISpaceStatus>): void
	{
		callback = callback || ((err, status) => {});
		let hadError = false;

		request(spaceStatusURL, (err, res, body) => {
			if(!err && isSuccess(res))
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.

				let currentStatus = null;
				try
				{
					currentStatus = JSON.parse(body);
				}
				catch(ex)
				{
					callback(ex, null);
					return;
				}
				currentStatus = fixStatus(currentStatus);
				callback(null, currentStatus);
			}
			else if(!!err)
			{
				hadError = true;
				callback(err, null);
			}
		});
	}
	
	/**
	 * @deprecated Use getPowerConsumption instead.
	 * Get current power consumption in Watts.
	 */
	export let requestPowerConsumption = getPowerConsumption;

	/**
	 * Get current power consumption in Watts.
	 */
	export function getPowerConsumption(callback: ICallback<IPowerConsumption>): void
	{
		callback = callback || ((err, status) => {});
		let hadError = false;

		request(powerConsumptionURL, (err, res, body) => {
			if(!err && isSuccess(res))
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.

				let currentConsumption = null;
				try
				{
					currentConsumption = parsePowerConsumption(body);
				}
				catch(ex)
				{
					callback(ex, null);
					return;
				}
				callback(null, currentConsumption);
			}
			else if(!!err)
			{
				hadError = true;
				callback(err, null);
			}
		});
	}

	/**
	 * Internal method to normalize the return value of the API.
	 * @param  {ISpaceStatus} status The original return value.
	 * @return {ISpaceStatus}        The normalized result.
	 */
	function fixStatus(status: ISpaceStatus): ISpaceStatus
	{
		return {
			open: status.open || false,
			known_users: status.known_users || [],
			unknown_users: status.unknown_users || 0
		};
	}

	function parsePowerConsumption(apiResponse: string): IPowerConsumption
	{
		if(!apiResponse || apiResponse.trim() == "")
			throw new Error("Empty API response.");

		var splitted = apiResponse.trim().split(",");
		if(!splitted || splitted.length !== 3)
			throw new Error("Invalid API response (malformed CSV).");

		// 27.01.2015,21:47:48,00438

		let dateStr = splitted[0].trim();
		let timeStr = splitted[1].trim();
		let consumptionStr = splitted[2].trim();

		let dateSplit = dateStr.split(".");
		let timeSplit = timeStr.split(":");

		if(dateSplit.length !== 3 || timeSplit.length !== 3)
			throw new Error("Invalid API response (malformed date/time).");

		let timestamp = new Date(
									parseInt(dateSplit[2]), /* may catch parse error here to throw specific exception */
									parseInt(dateSplit[1]) - 1, /* constructor takes 0-based months */
									parseInt(dateSplit[0]),
									parseInt(timeSplit[0]),
									parseInt(timeSplit[1]),
									parseInt(timeSplit[2]),
									0
								);

		return {
			timestamp: timestamp,
			consumption: parseInt(consumptionStr) /* may catch parse error here to throw specific exception */
		};
	}

	/**
	 * Parses a temperature response of the radiator client.
	 */
	function parseTemperature(responseBody: string): ITemperature
	{
		if (!responseBody || responseBody.trim() === "")
			throw "Got empty response from CAN client";
		let temp = responseBody.trim().toLowerCase();
		return {
			/* "Angabe in 1/100C" */
			value: parseInt(temp) / 100,
			unit: "°C"
		};
	}

	function getCANUrl(clientName: string, operation: string = ""): string
	{
		if (operation !== "")
			operation = "/" + operation;
		return `${canBusBase}/${clientName}${operation}`;
	}
	
	function isSuccess(res): boolean
	{
		if (!res || !res.statusCode)
			return false;
		return res.statusCode >= 200 && res.statusCode < 300;
	}
}

export = flipdot;
