# Twilio RTC Diagnostics SDK
The RTC Diagnostics SDK provides tools that help the developer in determining Voice & Video calling readiness. The SDK provides methods that assist in identifying potential issues and provides mechanisms to estimate expected audio quality.

* [API Docs](https://twilio.github.io/sdk-diagnostics/globals.html)
* Quickstart (Coming soon)
* Changelog (Coming soon)

Installation
------------

### Building the project locally

```bash
# Clone repository
git clone git@github.com:twilio/sdk-diagnostics.git
cd sdk-diagnostics

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
npm install /local-path-to-repo/sdk-diagnostics
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

Usage
------------
The following is an example for running bitrate test. For more information, please refer to the [API Docs](https://twilio.github.io/sdk-diagnostics/globals.html)

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

License
-------
See [LICENSE.md](LICENSE.md)
