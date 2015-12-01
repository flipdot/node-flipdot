# node-flipdot [![Build Status](https://travis-ci.org/flipdot/node-flipdot.svg?branch=master)](https://travis-ci.org/flipdot/node-flipdot) ![Dependency Status](https://david-dm.org/flipdot/node-flipdot.svg) ![npm version](https://img.shields.io/npm/v/flipdot.svg)

A web based client API for the flipdot hackerspace Kassel.

```
npm install flipdot
```

## Features

### Current Hackers
Get current visitors:
```JavaScript
var flipdot = require("flipdot");
let status = await getSpaceStatus();
```

### Power Consumption
Get current power consumption in Watts:
```JavaScript
var flipdot = require("flipdot");
let data = await flipdot.getPowerConsumption();
console.dir(data);
```
Outputs (for example):
```JavaScript
{
	timestamp: Tue Jan 27 2015 22:00:00 GMT+0100 (W. Europe Standard Time),
	consumption: 9001
}
```

### Orange Light
**Note:** This functionality is only available when the client is in the network of flipdot Kassel.
```JavaScript
await flipdot.setOrangeLightStatus(flipdot.LightStatus.on);
console.log("The orange light should now be on.");
```

### Radiator Control
**Note:** This functionality is only available when the client is in the network of flipdot Kassel.
```JavaScript
let temp = await flipdot.getCurrentTemperature();
console.log("It is currently %d %s", temp.value, temp.unit);

temp = await flipdot.getTargetTemperature(function(err, temp) {
console.log("The radiator is set to %d %s", temp.value, temp.unit);

await flipdot.setTargetTemperature(20);
console.log("The radiator is now set to %d °C", 20);
```

#### TODO
- Open door using SSH private key


### TypeScript usage

`npm install flipdot`

```TypeScript
/// <reference path="./node_modules/flipdot/build/flipdot.d.ts" />
import * as flipdot from "flipdot";
// use flipdot here
// tsc --module CommonJS --target ES6 file.ts
```
