/// <reference path="typings/node/node.d.ts" />
/// <reference path="typings/request/request.d.ts" />

import request = require("request");

var spaceStatusURL = "http://flipdot.org/spacestatus/status.json";

module flipdot
{
	export interface ISpaceStatus
	{
		open: boolean;
		known_users: IUser[];
		unknown_users: number;
	}

	export interface IUser
	{
		nick: string;
	}

	export interface ISpaceStatusCallback
	{
		(err: any, data: ISpaceStatus) => void;
	}

	export function requestDoorStatus(cb: ISpaceStatusCallback)
	{
		cb = cb || ((err, data) => {});

		request(spaceStatusURL, (err, res, body) => {
			if(!err && res.statusCode == 200)
			{
				var currentStatus = null;
				try
				{
					currentStatus = JSON.parse(body);
				}
				catch(ex)
				{
					cb(ex, null);
					return;
				}
				currentStatus = fixStatus(currentStatus);
				cb(null, currentStatus);
			}
		});
	}

	function fixStatus(status: ISpaceStatus): ISpaceStatus
	{
		return {
			open: status.open || false,
			known_users: status.known_users || [],
			unknown_users: status.unknown_users || 0
		};
	}
}

export = flipdot;
