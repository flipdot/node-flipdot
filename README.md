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
// TODO
