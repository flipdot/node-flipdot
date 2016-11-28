# node-flipdot [![Build Status](https://travis-ci.org/flipdot/node-flipdot.svg?branch=master)](https://travis-ci.org/flipdot/node-flipdot) ![Dependency Status](https://david-dm.org/flipdot/node-flipdot.svg) ![npm version](https://img.shields.io/npm/v/flipdot.svg)

A web based client API for the flipdot hackerspace Kassel.

```
npm install flipdot
```

## Features

### Current Hackers
Get current visitors:
```JavaScript
import * as fd from "flipdot";
let status = await fd.getSpaceStatus();
```

### Power Consumption
Get current power consumption in Watts:
```JavaScript
import * as fd from "flipdot";
let data = await fd.getPowerConsumption();
console.dir(data);
```
Outputs (for example):
```JavaScript
{
	timestamp: Tue Jan 27 2015 22:00:00 GMT+0100 (W. Europe Standard Time),
	consumption: 9001
}
```

### Zahnarztlampe
**Note:** This functionality is only available when the client is in the network of flipdot Kassel.
```JavaScript
fd.setZahnarztlampeColor({ r: 128, g: 0, b: 255 });
```

### Radiator Control
**Note:** This functionality is only available when the client is in the network of flipdot Kassel.
```JavaScript
let temp = await fd.getCurrentTemperature();
console.log("It is currently %d %s", temp.value, temp.unit);

temp = await fd.getTargetTemperature();
console.log("The radiator is set to %d %s", temp.value, temp.unit);

await fd.setTargetTemperature(20);
console.log("The radiator is now set to %d °C", 20);
```

### TypeScript usage
Just do this:
```TypeScript
import * as flipdot from "flipdot";
// compile using:
// tsc --module CommonJS --target ES2015
```
TypeScript 2 required. The type definitions will be fetched from the npm package. It just works.
