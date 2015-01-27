/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/request/request.d.ts" />

import request = require("request");

module flipdot
{
	var spaceStatusURL = "http://flipdot.org/spacestatus/status.json";
	var powerConsumptionURL = "http://infragelb.de/flipdot-power/";

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

	export interface ICallback<T>
	{
		(err: any, status: T): void;
	}


	/**
	 * Retrieves the current status of the hackerspace.
	 * @param {ISpaceStatusCallback} callback The callback of the async operation.
	 */
	export function requestDoorStatus(callback: ICallback<ISpaceStatus>): void
	{
		callback = callback || ((err, status) => {});
		var hadError = false;

		request(spaceStatusURL, (err, res, body) => {
			if(!err && res.statusCode == 200)
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.

				var currentStatus = null;
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

	export function requestPowerConsumption(callback: ICallback<IPowerConsumption>): void
	{
		callback = callback || ((err, status) => {});
		var hadError = false;

		request(powerConsumptionURL, (err, res, body) => {
			if(!err && res.statusCode == 200)
			{
				if(hadError) // If request calls the callback although it already reported an error
					return; // avoid calling the callback twice.

				var currentConsumption = null;
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

		var dateStr = splitted[0].trim();
		var timeStr = splitted[1].trim();
		var consumptionStr = splitted[2].trim();

		var dateSplit = dateStr.split(".");
		var timeSplit = timeStr.split(":");

		if(dateSplit.length !== 3 || timeSplit.length !== 3)
			throw new Error("Invalid API response (malformed date/time).");

		var timestamp = new Date(
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
}

export = flipdot;
