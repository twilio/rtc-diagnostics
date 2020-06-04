# Voice Diagnostics SDK
The Voice Diagnostics SDK provides functions to test input and output audio devices, and the functionality to test network bandwidth requirements towards Twilio’s servers.

This SDK requires the use of Twilio NTS to perform the network tests. Using NTS will incur charges as per [NTS pricing](https://www.twilio.com/stun-turn/pricing).

## Features
* Input audio device tests include volume calculation and silence detection
* Output audio device tests by playing a sound file to the selected device
* Bandwidth requirements tests

## Prerequisites
* A Twilio account. Sign up for free [here](https://www.twilio.com/try-twilio)
* Node.js v10+
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
import { testBitrate } from '@twilio/rtc-diagnostics';
```

### Script tag
You can also include `rtc-diagnostics.js` directly in your web app using a `<script>` tag.
 ```html
 <script src="https://my-server-path/rtc-diagnostics.js"></script>
 ```

 Using this method, `rtc-diagnostics.js` will set a browser global:
 ```ts
 const { testBitrate } = Twilio.Diagnostics;
 ```

## Usage
The following are examples for running tests. For more information, please refer to the [API Docs](https://twilio.github.io/rtc-diagnostics/globals.html)

### BitrateTest Example
```ts
import { testBitrate } from '@twilio/rtc-diagnostics';

const bitrateTest = testBitrate({
 iceServers: [{
   credential: 'bar',
   username: 'foo',
   urls: 'turn:global.turn.twilio.com:3478?transport=udp',
 }],
});

bitrateTest.on('bitrate', (bitrate) => {
 console.log(bitrate);
});

bitrateTest.on('error', (error) => {
 console.log(error);
});

bitrateTest.on('end', (report) => {
 console.log(report);
});

setTimeout(() => {
 bitrateTest.stop();
}, 10000);
```

### InputTest Example
```ts
import { testInputDevice, InputTest } from '@twilio/rtc-diagnostics';

const outputDeviceTest = testInputDevice({
  deviceId: ...,
});

inputDeviceTest.on(InputTest.Events.Volume, (volume) => {
  console.log(volume);
});

inputDeviceTest.on(InputTest.Events.Error, (error) => {
  console.error(error);
});

inputDeviceTest.on(InputTest.Events.End, (report) => {
  console.log(report);
});

setTimeout(() => {
  inputDeviceTest.stop();
}, 10000);
```

### OutputTest Example
```ts
import { testOutputDevice, OutputTest } from '@twilio/rtc-diagnostics';

const outputDeviceTest = testOutputDevice({
  deviceId: ...,
});

outputDeviceTest.on(InputTest.Events.Volume, (volume) => {
  console.log(volume);
});

outputDeviceTest.on(InputTest.Events.Error, (error) => {
  console.error(error);
});

outputDeviceTest.on(InputTest.Events.End, (report) => {
  console.log(report);
});

setTimeout(() => {
  outputDeviceTest.stop();
}, 10000);
```

## Related
* [Twilio Diagnostics React App](https://github.com/twilio/rtc-diagnostics-react-app)
* [Twilio Voice Client JS SDK](https://github.com/twilio/twilio-client.js)
* [Twilio Voice Client JS Quickstart](https://github.com/TwilioDevEd/client-quickstart-js)
* [Twilio Client connectivity requirements](https://www.twilio.com/docs/voice/client/javascript/voice-client-js-and-mobile-sdks-network-connectivity-requirements)

## License
See [LICENSE.md](LICENSE.md)
