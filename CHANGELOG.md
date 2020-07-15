# 1.0.0-preview4 (In Progress)

## New Features

* ### `LowAudioLevel` detection and warning in `InputTest`.

  During the runtime of the test, if low audio levels are detected from the captured input device, the test will emit a `warning` event. The test will emit a `warning-cleared` event when nominal audio levels are detected only after the `low-audio-level` `warning` has been fired.

  After the `low-audio-level` warning has been raised, it will not be raised again until it has been cleared.

  Example usage:
  ```ts
  import { InputTest, testInputDevice, WarningName } from '@twilio/rtc-diagnostics';

  const inputDeviceTest = testInputDevice();

  inputDeviceTest.on(InputTest.Events.Warning, (warning: WarningName) => {
    // The application can listen for specific warnings...
    if (warning === WarningName.LowAudioLevel) {
      // update the ui to show the input device may not be working
    }

    // ...or access all active warnings.
    inputDeviceTest.activeWarnings.values().forEach(...);
  });

  inputDeviceTest.on(InputTest.Events.WarningCleared, (warningType: WarningName) => {
    // The application can listen for specific warnings...
    if (warning === WarningName.LowAudioLevel) {
      // update the ui to show that the input device may be working again
    }

    // ...or access all active warnings.
    inputDeviceTest.activeWarnings.values().forEach(...);
  });
  ```

## Bug Fixes

* Fixed an issue where output device test doesn't fail after providing a deviceId on browsers that doesn't support [setSinkId](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId);

# 1.0.0-preview3 (June 17, 2020)

Inital release and open source of project RTC Diagnostics SDK. This SDK provides developers with tools to diagnose potential problems before utilizing other Twilio SDKs such as Voice SDK.

The initial feature set revolves around the Voice SDK and includes the ability to test audio input and output devices, as well as measuring network bitrate capabilities for WebRTC `PeerConnection`s.
