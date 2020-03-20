import { BitrateTest, testBitrate } from './BitrateTest';
import { InputTest, testInputDevice } from './InputTest';
import { NetworkTest, testNetwork } from './NetworkTest';
import { OutputTest, testOutputDevice } from './OutputTest';
/**
 * @internalapi
 * Tell Typescript that we would like to modify the `Twilio` object on the
 * `window` global.
 */
declare global {
    interface Window {
        Twilio: Object & {
            Diagnostics?: any;
        };
    }
}
/**
 * Expose the tests if installed as a npm module for both TS and JS
 */
export { BitrateTest, InputTest, NetworkTest, OutputTest, testBitrate, testInputDevice, testNetwork, testOutputDevice, };
