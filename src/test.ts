// This file should compile.

import {
	getPowerConsumption,
	getSpaceStatus,
	setOrangeLightStatus,
	LightStatus,
	getCurrentTemperature,
	getTargetTemperature,
	setTargetTemperature
} from "./lib";

async function testAwait() {
	var res = await getPowerConsumption();
	console.log(`Watts: ${res.consumption}`);

	var res2 = await getSpaceStatus();
	console.log(`Open?: ${res2.open}`);
	console.log(`Visitor count: ${res2.unknown_users + res2.known_users.length}`);

	await setOrangeLightStatus(LightStatus.On);

	var temp = await getCurrentTemperature();
	console.log("It is currently %d %s", temp.value, temp.unit);

	temp = await getTargetTemperature();
	console.log("The radiator is set to %d %s", temp.value, temp.unit);

	await setTargetTemperature(20);
}
testAwait();
