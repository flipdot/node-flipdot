///<reference path="./index.ts" />

/*
	This file should compile.
*/

import { requestPowerConsumption, requestSpaceStatus, setOrangeLightStatus, LightStatus } from "./index";

requestPowerConsumption((err, res) => {
    if(err) return console.error(err);
    console.log(`Watts: ${res.consumption}`);
});

requestSpaceStatus((err, res) => {
    if(err) return console.error(err);
    console.log(`Open?: ${res.open}`);
    console.log(`Visitor count: ${res.unknown_users + res.known_users.length}`);
});

setOrangeLightStatus(LightStatus.on, err => {
    if(err) return console.error(err);
    console.log("Done");
});
