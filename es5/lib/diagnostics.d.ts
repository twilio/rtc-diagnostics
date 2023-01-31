import { AudioInputTest, testAudioInputDevice } from './AudioInputTest';
import { AudioOutputTest, testAudioOutputDevice } from './AudioOutputTest';
import { ErrorName, WarningName } from './constants';
import { DiagnosticError } from './errors/DiagnosticError';
import { MediaConnectionBitrateTest, testMediaConnectionBitrate } from './MediaConnectionBitrateTest';
import { VideoResolution } from './types';
import { testVideoInputDevice, VideoInputTest } from './VideoInputTest';
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
export { AudioInputTest, AudioOutputTest, DiagnosticError, MediaConnectionBitrateTest, ErrorName, testAudioInputDevice, testAudioOutputDevice, testMediaConnectionBitrate, testVideoInputDevice, VideoInputTest, VideoResolution, WarningName, };
