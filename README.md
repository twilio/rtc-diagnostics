# RTC Diagnostics SDK
The RTC Diagnostics SDK provides functions to test input and output devices (microphone, speaker, camera) as well as functionality to confirm that you meet the network bandwidth requirements required to make a voice call or join a video room.

This SDK requires the use of Twilio NTS or your own STUN/TURN servers to perform the network tests. Using Twilio NTS will mirror how Twilio uses STUN/TURN in Programmable Video when connecting to a Twilio Video Room and will incur charges as per [NTS pricing](https://www.twilio.com/stun-turn/pricing).

## Features
* Input audio device tests
* Input video device tests
* Output audio device tests
* Bandwidth requirements tests

## Prerequisites
* A Twilio account. Sign up for free [here](https://www.twilio.com/try-twilio)
* Node.js v12+
* NPM v6+ (comes installed with newer Node versions)

## Installation

### Building the project locally

```bash
# Clone repository
git clone git@github.com:twilio/rtc-diagnostics.git
cd rtc-diagnostics

# Install dependencies
npm install

# Build the artifacts under dist folder
npm run build
```

In order to run integration tests, you'll need to copy over the `credentials.example.json` file
to `credentials.json` in the same folder, and replace the empty fields with valid values.

### NPM
You can install directly from npm.
```
npm install @twilio/rtc-diagnostics --save
```

Or install from a local directory.
```
npm install /local-path-to-repo/rtc-diagnostics
```

Using this method, you can import `rtc-diagnostics` like so:
```ts
import { testMediaConnectionBitrate } from '@twilio/rtc-diagnostics';
```

### Script tag
You can also include `rtc-diagnostics.js` directly in your web app using a `<script>` tag.
 ```html
 <script src="https://my-server-path/rtc-diagnostics.js"></script>
 ```

 Using this method, `rtc-diagnostics.js` will set a browser global:
 ```ts
 const { testMediaConnectionBitrate } = Twilio.Diagnostics;
 ```

## Usage
The following are examples for running tests. For more information, please refer to the [API Docs](https://twilio.github.io/rtc-diagnostics/globals.html)

### MediaConnectionBitrateTest Example
```ts
import { testMediaConnectionBitrate } from '@twilio/rtc-diagnostics';

const mediaConnectionBitrateTest = testMediaConnectionBitrate({
 iceServers: [{
   credential: 'bar',
   username: 'foo',
   urls: 'turn:global.turn.twilio.com:3478?transport=udp',
 }],
});

mediaConnectionBitrateTest.on('bitrate', (bitrate) => {
 console.log(bitrate);
});

mediaConnectionBitrateTest.on('error', (error) => {
 console.log(error);
});

mediaConnectionBitrateTest.on('end', (report) => {
 console.log(report);
});

setTimeout(() => {
 mediaConnectionBitrateTest.stop();
}, 10000);
```
See `MediaConnectionBitrateTest.Options` for more information for how to obtain the `urls values`

### AudioInputTest Example
```ts
import { testAudioInputDevice, AudioInputTest } from '@twilio/rtc-diagnostics';

const audioInputDeviceTest = testAudioInputDevice({
  deviceId: ...,
});

audioInputDeviceTest.on(AudioInputTest.Events.Volume, (volume) => {
  console.log(volume);
});

audioInputDeviceTest.on(AudioInputTest.Events.Error, (error) => {
  console.error(error);
});

audioInputDeviceTest.on(AudioInputTest.Events.End, (report) => {
  console.log(report);
});

setTimeout(() => {
  audioInputDeviceTest.stop();
}, 10000);
```

### VideoInputTest Example
```ts
import { testVideoInputDevice, VideoInputTest } from '@twilio/rtc-diagnostics';

const videoInputDeviceTest = testVideoInputDevice({ element: videoElement });

videoInputDeviceTest.on(VideoInputTest.Events.Error, (error) => {
  console.error(error);
});

videoInputDeviceTest.on(VideoInputTest.Events.End, (report) => {
  console.log(report);
});

setTimeout(() => {
  videoInputDeviceTest.stop();
}, 10000);
```

### AudioOutputTest Example
```ts
import { testAudioOutputDevice, AudioOutputTest } from '@twilio/rtc-diagnostics';

const audioOutputDeviceTest = testAudioOutputDevice({
  deviceId: ...,
});

audioOutputDeviceTest.on(AudioOutputTest.Events.Volume, (volume) => {
  console.log(volume);
});

audioOutputDeviceTest.on(AudioOutputTest.Events.Error, (error) => {
  console.error(error);
});

audioOutputDeviceTest.on(AudioOutputTest.Events.End, (report) => {
  console.log(report);
});

setTimeout(() => {
  audioOutputDeviceTest.stop();
}, 10000);
```

## Related
* [Twilio Voice Client JS SDK](https://github.com/twilio/twilio-client.js)
* [Twilio Voice Client JS Quickstart](https://github.com/TwilioDevEd/client-quickstart-js)
* [Twilio Video JS SDK](https://github.com/twilio/twilio-video.js)
* [Twilio Video JS Quickstart](https://github.com/twilio/video-quickstart-js)
* [Twilio Client connectivity requirements](https://www.twilio.com/docs/voice/client/javascript/voice-client-js-and-mobile-sdks-network-connectivity-requirements)

## License
See [LICENSE.md](LICENSE.md)
