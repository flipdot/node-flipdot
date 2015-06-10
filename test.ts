///<reference path="./index.ts" />

/*
	This file should compile.
*/

import {
    getPowerConsumption,
    getSpaceStatus,
    setOrangeLightStatus,
    LightStatus,
    getCurrentTemperature,
    getTargetTemperature,
    setTargetTemperature
} from "./index";

getPowerConsumption((err, res) => {
    if(err) return console.error(err);
    console.log(`Watts: ${res.consumption}`);
});

getSpaceStatus((err, res) => {
    if(err) return console.error(err);
    console.log(`Open?: ${res.open}`);
    console.log(`Visitor count: ${res.unknown_users + res.known_users.length}`);
});

setOrangeLightStatus(LightStatus.on, err => {
    if(err) return console.error(err);
    console.log("Done");
});

getCurrentTemperature((err, temp) => {
	if(err) return console.error(err);
    console.log("It is currently %d %s", temp.value, temp.unit);
});

getTargetTemperature((err, temp) => {
	if(err) return console.error(err);
    console.log("The radiator is set to %d %s", temp.value, temp.unit);
});

setTargetTemperature(20, (err) => {
	if(err) return console.error(err);
    console.log("The radiator is now set to %d °C", 20);
});
