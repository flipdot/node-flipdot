# node-flipdot [![Build Status](https://travis-ci.org/flipdot/node-flipdot.svg?branch=master)](https://travis-ci.org/flipdot/node-flipdot) ![Dependency Status](https://david-dm.org/flipdot/node-flipdot.svg)

A web based client API for the flipdot hackerspace Kassel.

## Features

### Current Hackers
Get current visitors:
```JavaScript
var flipdot = require("flipdot");
flipdot.requestSpaceStatus(function(err, status) {
	console.dir(!!err ? err : status);
});
```

### Power Consumption
Get current power consumption in Watts:
```JavaScript
var flipdot = require("flipdot");
flipdot.requestPowerConsumption(function(err, data) {
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
