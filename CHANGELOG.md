1.0.1 (Jan 30, 2023)
====================

Bug Fixes
---------

* Fixed a bug on iOS 16 Safari where the user could not play back the audio recorded during an audio output test. This is due to the following [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=249250). (VIDEO-11571)

1.0.0 (Nov 3, 2020)
===================

1.0.0-beta2 has been promoted to 1.0.0 GA. RTC Diagnostics SDK will use [Semantic Versioning 2.0.0](https://semver.org/#semantic-versioning-200) for all future changes.


1.0.0-beta2 (Sept 25, 2020)
=========================

New Features
------------

* Support for Video Diagnostics is introduced with the addition of `VideoInputTest` and `testVideoInputDevice`. This test helps to diagnose possible issues with video input devices by capturing a video stream from a user and displaying it on a video element for the user to confirm. See the [API Docs](https://twilio.github.io/rtc-diagnostics/classes/videoinputtest.html) for details.

  **Example Usage**
  ```ts
  import {
    DiagnosticError,
    testVideoInputDevice,
    VideoInputTest,
  } from '@twilio/rtc-diagnostics';

  const videoEl: HTMLMediaElement = document.getElementById(...);
  const test: VideoInputTest = testVideoInputDevice({
    element: videoEl,
  });
  test.on(VideoInputTest.Events.End, (report: VideoInputTest.Report) => { ... });
  test.on(VideoInputTest.Events.Error, (error: DiagnosticError) => { ... });
  ```

  As soon as the test object is instantiated, an attempt to capture the user video stream will be performed and if successful then the stream will be bound to the video element. When the test is stopped, either by timeout or manually, then the video element is paused and the stream is removed from it.

Changes
-------

* The audio device tests `InputTest` and `OutputTest` no longer perform any analysis on volume data. With this change, `InputTest.Report.didPass` and `OutputTest.Report.didPass` are no longer available and `InputTest.stop()` and `OutputTest.stop()` no longer accept a `pass: boolean` parameter. Your application will need to analyze the volume levels in the `Report.values` property to determine whether or not the volume levels are acceptable.

* The following classes and methods have been changed

  | Old                | New                          |
  |:-------------------|:-----------------------------|
  | `InputTest`        | `AudioInputTest`             |
  | `OutputTest`       | `AudioOutputTest`            |
  | `BitrateTest`      | `MediaConnectionBitrateTest` |
  | `testInputDevice`  | `testAudioInputDevice`       |
  | `testOutputDevice` | `testAudioOutputDevice`      |
  | `testBitrate`      | `testMediaConnectionBitrate` |

* `MediaConnectionBitrateTest` now uses TURN server on only one of the Peer Connections. With this change, you need to provide a STUN server in addition to the TURN server configurations. See `MediaConnectionBitrateTest.Options.iceServers` for details.

* `MediaConnectionBitrateTest` no longer perform any analysis on bitrate data and `MediaConnectionBitrateTest.Report.didPass` is no longer available. Your application will need to analyze the bitrate values in `MediaConnectionBitrateTest.Report.values` and `MediaConnectionBitrateTest.Report.averageBitrate` properties to determine whether or not the values are acceptable.

* `MediaConnectionBitrateTest` now emits warnings when certain criteria are met. See [WarningNames](https://twilio.github.io/rtc-diagnostics/enums/warningname.html) and [minBitrateThreshold](https://twilio.github.io/rtc-diagnostics/interfaces/mediaconnectionbitratetest.options.html#minbitratethreshold) for details.

  Example usage:
  ```ts
  import { MediaConnectionBitrateTest, testMediaConnectionBitrate, WarningName } from '@twilio/rtc-diagnostics';

  const test = testMediaConnectionBitrate({ iceServers: [...], minBitrateThreshold: 500 });

  test.on(MediaConnectionBitrateTest.Events.Warning, (warningName: WarningName) => {
    // The application can listen for specific warnings...
    if (warningName === WarningName.LowBitrate) {
      // update the ui
    }

    // ...or access all active warnings.
    test.activeWarnings.values().forEach(...);
  });

  test.on(MediaConnectionBitrateTest.Events.WarningCleared, (warningName: WarningName) => {
    // The application can listen for specific warnings...
    if (warningName === WarningName.LowBitrate) {
      // update the ui
    }

    // ...or access all active warnings.
    test.activeWarnings.values().forEach(...);
  });
  ```

* `DiagnosticError` can now be imported directly. Example:

  ```ts
  import {
    DiagnosticError,
    MediaConnectionBitrateTest,
    testMediaConnectionBitrate,
  } from '@twilio/rtc-diagnostics';

  const test = testMediaConnectionBitrate(...);

  test.on(MediaConnectionBitrateTest.Events.Error, (error: DiagnosticError) => {
    console.log(error);
  });
  ```

* Updated test names to `audio-input-test`, `audio-output-test`, and `media-connection-bitrate-test` for consistency.

* Removed unused `promise-timed-out` and `invalid-option` error.

1.0.0-beta1 (July 29, 2020)
============================

New Features
-------------

### Audio recording feature in `InputTest`.

`InputTest` now supports the ability to record the audio captured from the input device, and provides a recording URL which can be used to play back audio. This feature is disabled by default and can be enabled by setting [InputTest.Options.enableRecording](https://twilio.github.io/rtc-diagnostics/interfaces/inputtest.options.html#enablerecording) to `true`. When enabled, the recording URL is available via [InputTest.Report.recordingUrl](https://twilio.github.io/rtc-diagnostics/interfaces/inputtest.report.html#recordingurl) property.

Example usage:
```ts
const inputTest: InputTest = testInputDevice({ enableRecording: true });
inputTest.on(InputTest.Events.End, (report: InputTest.Report) => {
  const audioEl = new Audio();
  audioEl.src = report.recordingUrl;
  audioEl.play();

  // Revoke the url if no longer needed
  URL.revokeObjectURL(report.recordingUrl);
});
```

### `LowAudioLevel` detection and warning in `InputTest`.

During the runtime of the test, if low audio levels are detected from the captured input device, the test will emit a `warning` event. The test will emit a `warning-cleared` event when nominal audio levels are detected only after the `low-audio-level` `warning` has been fired.

After the `low-audio-level` warning has been raised, it will not be raised again until it has been cleared.

Example usage:
```ts
import { InputTest, testInputDevice, WarningName } from '@twilio/rtc-diagnostics';

const inputDeviceTest = testInputDevice();

inputDeviceTest.on(InputTest.Events.Warning, (warningName: WarningName) => {
  // The application can listen for specific warnings...
  if (warningName === WarningName.LowAudioLevel) {
    // update the ui to show the input device may not be working
  }

  // ...or access all active warnings.
  inputDeviceTest.activeWarnings.values().forEach(...);
});

inputDeviceTest.on(InputTest.Events.WarningCleared, (warningName: WarningName) => {
  // The application can listen for specific warnings...
  if (warningName === WarningName.LowAudioLevel) {
    // update the ui to show that the input device may be working again
  }

  // ...or access all active warnings.
  inputDeviceTest.activeWarnings.values().forEach(...);
});
```

Changes
-------

* Added a new DiagnosticError, `TimeoutError`, which is emitted when a BitrateTest times out (15 seconds).

* Added ICE Candidate related statistics in the [BitrateTest.Report](https://twilio.github.io/rtc-diagnostics/interfaces/bitratetest.report.html) object.

  **Example Usage**
  ```ts
  bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
    console.log(report);
  });
  ```

  **Example Report Data**
  ```js
  {
    "iceCandidateStats": [...],

    "selectedIceCandidatePairStats": {
      "localCandidate": {...},
      "remoteCandidate": {...}
    },

    // Other report properties...
  }
  ```

* Removed network related timings and warnings. It is recommended to use `twilio-client.js` [preflight timing APIs](https://github.com/twilio/twilio-client.js/blob/preflight/PREFLIGHT.md) instead for more accurate timing information. With this change, the following are no longer available:
  - `bitrateTest.on('warning', handler(warning))`
  - `BitrateTest.Report.warnings`
  - `BitrateTest.Report.networkTiming`

Bug Fixes
---------

* Fixed an issue where output device test doesn't fail after providing a deviceId on browsers that doesn't support [setSinkId](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId);

1.0.0-preview3 (June 17, 2020)
==============================

Inital release and open source of project RTC Diagnostics SDK. This SDK provides developers with tools to diagnose potential problems before utilizing other Twilio SDKs such as Voice SDK.

The initial feature set revolves around the Voice SDK and includes the ability to test audio input and output devices, as well as measuring network bitrate capabilities for WebRTC `PeerConnection`s.
