///<reference path="./flipdot.ts" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
/*
    This file should compile.
*/
var flipdot_1 = require("./flipdot");
function testAwait() {
    var res = yield flipdot_1.getPowerConsumption();
    console.log("Watts: " + res.consumption);
    var res2 = yield flipdot_1.getSpaceStatus();
    console.log("Open?: " + res2.open);
    console.log("Visitor count: " + (res2.unknown_users + res2.known_users.length));
    yield flipdot_1.setOrangeLightStatus(flipdot_1.LightStatus.on);
    var temp = yield flipdot_1.getCurrentTemperature();
    console.log("It is currently %d %s", temp.value, temp.unit);
    temp = yield flipdot_1.getTargetTemperature();
    console.log("The radiator is set to %d %s", temp.value, temp.unit);
    yield flipdot_1.setTargetTemperature(20);
}
testAwait();
