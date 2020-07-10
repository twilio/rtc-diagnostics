1.0.0-preview4 (In progress)
=============================

Changes
-------

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

* Removed network related timings and warnings. It is recommended to use `twilio-client.js` [preflight timing APIs](https://github.com/twilio/twilio-client.js/blob/preflight/PREFLIGHT.md) instead for a more accurate timing information. With this change, the following are no longer available:
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
