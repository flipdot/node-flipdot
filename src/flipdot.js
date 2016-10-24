/// <reference path="typings/tsd.d.ts" />
var request = require("request");
var flipdot;
(function (flipdot) {
    var spaceStatusURL = "http://flipdot.org/spacestatus/status.json";
    var powerConsumptionURL = "http://infragelb.de/flipdot-power/";
    var hutschienenHost = "hutschienenpi.fd";
    var hutschienenPort = 8080;
    var canBusBase = "http://" + hutschienenHost + ":" + hutschienenPort;
    var hutshieneClientName = "Hutschiene";
    var radiatorClientName = "theemin";
    (function (LightStatus) {
        LightStatus[LightStatus["off"] = 0] = "off";
        LightStatus[LightStatus["on"] = 1] = "on";
    })(flipdot.LightStatus || (flipdot.LightStatus = {}));
    var LightStatus = flipdot.LightStatus;
    function wrapWithTry(fn) {
        try {
            return [null, fn()];
        }
        catch (ex) {
            return [ex, null];
        }
    }
    function doAndParseRequest(request, parser, url) {
        return new Promise(function (resolve, reject) {
            var hadError = false;
            request(url, function (err, res, body) {
                if (!err && isSuccess(res)) {
                    if (hadError)
                        return; // avoid calling the callback twice.
                    var _a = parser ? parser(body) : [null, null], err_1 = _a[0], res_1 = _a[1];
                    return err_1 ? reject(err_1) : resolve(res_1);
                }
                if (!!err) {
                    hadError = true;
                    reject(err);
                }
            });
        });
    }
    /**
     * Switches the orange light on or off.
     */
    function setOrangeLightStatus(status) {
        var statusString = status == LightStatus.on ? "true" : "false";
        var orangeLightUrl = getCANUrl(hutshieneClientName, "OrangeLight");
        var statusUrl = orangeLightUrl + "?state=" + statusString;
        return doAndParseRequest(request.post, null, statusUrl);
    }
    flipdot.setOrangeLightStatus = setOrangeLightStatus;
    /**
     * Gets the current temperature as measured by the sensor of the radiator control.
     */
    function getCurrentTemperature() {
        var serviceUrl = getCANUrl(radiatorClientName, "GetActTemp");
        return doAndParseRequest(request.get, function (body) { return wrapWithTry(function () { return parseTemperature(body); }); }, serviceUrl);
    }
    flipdot.getCurrentTemperature = getCurrentTemperature;
    /**
     * Gets the temperature that the radiator is set to.
     */
    function getTargetTemperature() {
        var serviceUrl = getCANUrl(radiatorClientName, "GetTargetTemp");
        return doAndParseRequest(request.get, function (body) { return wrapWithTry(function () { return parseTemperature(body); }); }, serviceUrl);
    }
    flipdot.getTargetTemperature = getTargetTemperature;
    /**
     * Sets the target temperature of the radiator.
     * @param {number} temperature The target temperature in celsius.
     */
    function setTargetTemperature(temperature) {
        // TODO: TEST THIS
        var opUrl = getCANUrl(radiatorClientName, "SetTargetTemp");
        var serviceUrl = opUrl + "?temp=" + temperature;
        return doAndParseRequest(request.post, null, serviceUrl);
    }
    flipdot.setTargetTemperature = setTargetTemperature;
    /**
     * Retrieves the current status of the hackerspace.
     * @param {ISpaceStatusCallback} callback The callback of the async operation.
     */
    function getSpaceStatus() {
        return doAndParseRequest(request.get, function (body) { return wrapWithTry(function () {
            var status = JSON.parse(body);
            return fixStatus(status);
        }); }, spaceStatusURL);
    }
    flipdot.getSpaceStatus = getSpaceStatus;
    /**
     * Get current power consumption in Watts.
     */
    function getPowerConsumption() {
        return doAndParseRequest(request.get, function (body) { return wrapWithTry(function () { return parsePowerConsumption(body); }); }, powerConsumptionURL);
    }
    flipdot.getPowerConsumption = getPowerConsumption;
    /**
     * Internal method to normalize the return value of the API.
     * @param  {ISpaceStatus} status The original return value.
     * @return {ISpaceStatus}        The normalized result.
     */
    function fixStatus(status) {
        return {
            open: status.open || false,
            known_users: status.known_users || [],
            unknown_users: status.unknown_users || 0,
            temperature_setpoint: status.temperature_setpoint || 0,
            temperature_realvalue: status.temperature_realvalue || 0,
            heater_valve: status.heater_valve || 0
        };
    }
    function parsePowerConsumption(apiResponse) {
        if (!apiResponse || apiResponse.trim() == "")
            throw new Error("Empty API response.");
        var splitted = apiResponse.trim().split(",");
        if (!splitted || splitted.length !== 3)
            throw new Error("Invalid API response (malformed CSV).");
        // 27.01.2015,21:47:48,00438
        var dateStr = splitted[0].trim();
        var timeStr = splitted[1].trim();
        var consumptionStr = splitted[2].trim();
        var dateSplit = dateStr.split(".");
        var timeSplit = timeStr.split(":");
        if (dateSplit.length !== 3 || timeSplit.length !== 3)
            throw new Error("Invalid API response (malformed date/time).");
        // constructor for months takes 0-based months
        var timestamp = new Date(parseInt(dateSplit[2]), parseInt(dateSplit[1]) - 1, parseInt(dateSplit[0]), parseInt(timeSplit[0]), parseInt(timeSplit[1]), parseInt(timeSplit[2]), 0);
        return {
            timestamp: timestamp,
            consumption: parseInt(consumptionStr) /* may catch parse error here to throw specific exception */
        };
    }
    /**
     * Parses a temperature response of the radiator client.
     */
    function parseTemperature(responseBody) {
        if (!responseBody || responseBody.trim() === "")
            throw new Error("Got empty response from CAN client");
        var temp = responseBody.trim().toLowerCase();
        return {
            value: parseInt(temp),
            unit: "°C"
        };
    }
    function getCANUrl(clientName, operation) {
        if (operation === void 0) { operation = ""; }
        if (operation !== "")
            operation = "/" + operation;
        return canBusBase + "/" + clientName + operation;
    }
    function isSuccess(res) {
        if (!res || !res.statusCode)
            return false;
        return res.statusCode >= 200 && res.statusCode < 300;
    }
})(flipdot || (flipdot = {}));
module.exports = flipdot;
