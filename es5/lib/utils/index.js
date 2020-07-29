"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
/**
 * @internalapi
 * Determine whether audio is silent or not by analyzing an array of volume values.
 * @param volumes An array of volume values to to analyze.
 * @returns Whether audio is silent or not.
 */
function detectSilence(volumes) {
    // TODO Come up with a better algorithm for deciding if the volume values
    // resulting in a success
    // Loops over every sample, checks to see if it was completely silent by
    // checking if the average of the amplitudes is 0, and returns whether or
    // not more than 50% of the samples were silent.
    return !(volumes && volumes.length > 3 &&
        (volumes.filter(function (v) { return v > 0; }).length / volumes.length) > 0.5);
}
exports.detectSilence = detectSilence;
/**
 * @internalapi
 * Reject a promise after a specified timeout
 * @param promiseOrArray The promise to timeout.
 * @param timeoutMs The amount of time after which to reject the promise.
 */
function waitForPromise(promise, timeoutMs) {
    var timer;
    var timeoutPromise = new Promise(function (_, reject) {
        timer = setTimeout(function () { return reject(new errors_1.PromiseTimedOutError()); }, timeoutMs);
    });
    return Promise.race([
        promise,
        timeoutPromise,
    ]).finally(function () {
        clearTimeout(timer);
    });
}
exports.waitForPromise = waitForPromise;
//# sourceMappingURL=index.js.map