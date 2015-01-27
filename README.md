# node-flipdot

A web based client API for the flipdot hackerspace Kassel.

## Features
Get current visitors

```JavaScript
var flipdot = require("flipdot");
flipdot.requestDoorStatus(function(err, status) {
	console.dir(!!err ? err : status);
});
```

Get current power consumption in Watts.
```JavaScript
var flipdot = require("flipdot");
flipdot.requestPowerConsumption(function(err, status) {
	console.dir(!!err ? err : status);
});
```
Outputs (for example):
```JavaScript
{
	timestamp: Tue Jan 27 2015 22:00:00 GMT+0100 (W. Europe Standard Time),
	consumption: 9001
}
```
