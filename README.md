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
flipdot.getSpaceStatus(function(err, status) {
	console.dir(!!err ? err : status);
});
```

### Power Consumption
Get current power consumption in Watts:
```JavaScript
var flipdot = require("flipdot");
flipdot.getPowerConsumption(function(err, data) {
	console.dir(!!err ? err : data);
});
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
flipdot.setOrangeLightStatus(flipdot.LightStatus.on, function(err) {
    if(err) return console.error(err);
    console.log("The orange light should now be on.");
});
```

### Radiator Control
**Note:** This functionality is only available when the client is in the network of flipdot Kassel.
```JavaScript
flipdot.getCurrentTemperature(function(err, temp) {
	if(err) return console.error(err);
    console.log("It is currently %d %s", temp.value, temp.unit);
});

flipdot.getTargetTemperature(function(err, temp) {
	if(err) return console.error(err);
    console.log("The radiator is set to %d %s", temp.value, temp.unit);
});

flipdot.setTargetTemperature(20, function(err) {
	if(err) return console.error(err);
    console.log("The radiator is now set to %d °C", 20);
});
```

#### TODO
- Open door using SSH private key

### Q Sample
```JavaScript
var flipdot = require("flipdot");
var Q = require("q");

var getPowerConsumption = Q.denodeify(flipdot.getPowerConsumption);
var getSpaceStatus = Q.denodeify(flipdot.getSpaceStatus);

Q.all([
	getPowerConsumption(),
	getSpaceStatus()
]).done(function(results) {
	console.log("power consumption:")
	console.dir(results[0]);
	console.log("space status:")
	console.dir(results[1]);
});
```

### TypeScript usage

`npm install flipdot`

```TypeScript
/// <reference path="./node_modules/flipdot/build/flipdot.d.ts" />
import * as flipdot from "flipdot";
// use flipdot here
// tsc --module CommonJS --target ES5 file.ts
```
