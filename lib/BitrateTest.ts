import { EventEmitter } from 'events';
import { BYTES_KEEP_BUFFERED, MAX_NUMBER_PACKETS, MIN_BITRATE_THRESHOLD, TEST_PACKET } from './constants';
import { DiagnosticError } from './errors/DiagnosticError';
import { TimeMeasurement } from './types';
import {
  getRTCIceCandidateStatsReport,
  RTCIceCandidateStats,
  RTCIceCandidateStatsReport,
  RTCSelectedIceCandidatePairStats,
} from './utils/candidate';

export declare interface BitrateTest {
  /**
   * Raised every second with a `bitrate` parameter in kbps which represents the connection's bitrate since the last time this event was raised.
   * The bitrate value is limited by either your downlink or uplink, whichever is lower.
   * For example, if your downlink and uplink is 50mbps and 10mbps respectively, bitrate value will not exceed 10mbps.
   * @param event [[BitrateTest.Events.Bitrate]].
   * @param listener A callback with a `bitrate`(kbps) parameter since the last time this event was raised.
   * @returns This [[BitrateTest]] instance.
   * @event
   */
  on(
    event: BitrateTest.Events.Bitrate,
    listener: (bitrate: number) => any,
  ): this;

  /**
   * Raised when the test encounters an error.
   * When this happens, the test will immediately stop and emit [[BitrateTest.Events.End]].
   * @param event [[BitrateTest.Events.Error]].
   * @param listener A callback with a [[DiagnosticError]] parameter.
   * @returns This [[BitrateTest]] instance.
   * @event
   */
  on(
    event: BitrateTest.Events.Error,
    listener: (error: DiagnosticError) => any,
  ): this;

  /**
   * Raised upon completion of the test.
   * @param event [[BitrateTest.Events.End]].
   * @param listener A callback with a [[BitrateTest.Report]] parameter.
   * @returns This [[BitrateTest]] instance.
   * @event
   */
  on(
    event: BitrateTest.Events.End,
    listener: (report: BitrateTest.Report) => any,
  ): this;
}

/**
 * BitrateTest uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
 * connected via a [Twilio Network Traversal Service](https://www.twilio.com/docs/stun-turn).
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 * See [[BitrateTest.Options.iceServers]] for information how to use Twilio NTS.
 */
export class BitrateTest extends EventEmitter {
  /**
   * Name of this test
   */
  static readonly testName: string = 'bitrate-test';

  /**
   * Interval id for checking bitrate
   */
  private _checkBitrateIntervalId: NodeJS.Timer | undefined;

  /**
   * A timestamp of when the test ends.
   */
  private _endTime: number | null = null;

  /**
   * Errors detected during the test
   */
  private _errors: DiagnosticError[] = [];

  /**
   * An array of WebRTC stats for the ICE candidates gathered when connecting to media.
   */
  private _iceCandidateStats: RTCIceCandidateStats[] = [];

  /**
   * Number of bytes received the last time it was checked
   */
  private _lastBytesChecked: number = 0;

  /**
   * Last timestamp when the bytes received was checked
   */
  private _lastCheckedTimestamp: number = 0;

  /**
   * The options passed to [[BitrateTest]] constructor.
   */
  private _options: BitrateTest.ExtendedOptions;

  /**
   * The RTCPeerConnection that will receive data
   */
  private _pcReceiver: RTCPeerConnection;

  /**
   * The RTCPeerConnection that will send data
   */
  private _pcSender: RTCPeerConnection;

  /**
   * RTC configuration that will be used when initializing a RTCPeerConnection
   */
  private _rtcConfiguration: RTCConfiguration = {};

  /**
   * RTCDataChannel to use for sending data
   */
  private _rtcDataChannel: RTCDataChannel | undefined;

  /**
   * A WebRTC stats for the ICE candidate pair used to connect to media, if candidates were selected.
   */
  private _selectedIceCandidatePairStats: RTCSelectedIceCandidatePairStats | undefined;

  /**
   * Interval id for sending data
   */
  private _sendDataIntervalId: NodeJS.Timer | undefined;

  /**
   * A timestamp of when the test starts. This is set during initialization of the test
   * and not when the test succesfully starts.
   */
  private _startTime: number;

  /**
   * Total number of bytes received by the receiver RTCPeerConnection
   */
  private _totalBytesReceived: number = 0;

  /**
   * Bitrate (kbps) values collected during the test
   */
  private _values: number[] = [];

  /**
   * Construct a [[BitrateTest]] instance. The test will start immediately.
   * Test should be allowed to run for a minimum of 8 seconds. To stop the test, call [[BitrateTest.stop]].
   * @constructor
   * @param options
   */
  constructor(options: BitrateTest.ExtendedOptions) {
    super();

    this._options = { ...options };
    this._rtcConfiguration.iceServers = this._options.iceServers;

    this._pcReceiver = new RTCPeerConnection(this._rtcConfiguration);
    this._pcSender = new RTCPeerConnection(this._rtcConfiguration);

    this._pcReceiver.onicecandidate = (event: RTCPeerConnectionIceEvent) => this._onIceCandidate(this._pcSender, event);
    this._pcSender.onicecandidate = (event: RTCPeerConnectionIceEvent) => this._onIceCandidate(this._pcReceiver, event);

    this._setupNetworkListeners(this._pcSender);

    this._startTime = Date.now();

    // Return before starting the test to allow consumer
    // to listen and capture errors
    setTimeout(() => {
      this._setupDataChannel();
      this._startTest();
    });
  }

  /**
   * Stops the current test.
   */
  stop(): void {
    clearInterval(this._sendDataIntervalId!);
    clearInterval(this._checkBitrateIntervalId!);

    this._pcSender.close();
    this._pcReceiver.close();
    this._endTime = Date.now();

    this.emit(BitrateTest.Events.End, this._getReport());
  }

  /**
   * Calculate bitrate by comparing bytes received between current time and the last time it was checked
   */
  private _checkBitrate(): void {
    // No data yet
    if (!this._lastCheckedTimestamp || !this._lastBytesChecked) {
      this._lastCheckedTimestamp = Date.now();
      this._lastBytesChecked = this._totalBytesReceived;
      return;
    }

    // Calculate bitrate in kbps
    const now = Date.now();
    const bitrate = 8 * (this._totalBytesReceived - this._lastBytesChecked) / (now - this._lastCheckedTimestamp);

    this._lastCheckedTimestamp = now;
    this._lastBytesChecked = this._totalBytesReceived;
    this._values.push(bitrate);
    this.emit(BitrateTest.Events.Bitrate, bitrate);
  }

  /**
   * Generate and returns the report for this test
   */
  private _getReport(): BitrateTest.Report {
    let averageBitrate = this._values
      .reduce((total: number, value: number) => total += value, 0) / this._values.length;
    averageBitrate = isNaN(averageBitrate) ? 0 : averageBitrate;

    const testTiming: TimeMeasurement = { start: this._startTime };
    if (this._endTime) {
      testTiming.end = this._endTime;
      testTiming.duration = this._endTime - this._startTime;
    }

    const report: BitrateTest.Report = {
      averageBitrate,
      didPass: !this._errors.length && !!this._values.length && averageBitrate >= MIN_BITRATE_THRESHOLD,
      errors: this._errors,
      iceCandidateStats: this._iceCandidateStats,
      testName: BitrateTest.testName,
      testTiming,
      values: this._values,
    };

    if (this._selectedIceCandidatePairStats) {
      report.selectedIceCandidatePairStats = this._selectedIceCandidatePairStats;
    }

    return report;
  }

  /**
   * Called when an error is detected
   * @param message - Message that describes the error
   * @param error - The error object
   * @param isFatal - Whether this is a fatal error
   */
  private _onError(message: string, error?: DOMError): void {
    const diagnosticError = new DiagnosticError(error, message);
    this._errors.push(diagnosticError);
    this.emit(BitrateTest.Events.Error, diagnosticError);
    this.stop();
  }

  /**
   * Called when a local candidate is gathered
   * @param remotePc - The remote RTCPeerConnection
   */
  private _onIceCandidate(remotePc: RTCPeerConnection, event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      const candidate = event.candidate.candidate;
      if (candidate.indexOf('relay') !== -1) {
        remotePc.addIceCandidate(event.candidate)
          .catch((error: DOMError) => this._onError('Unable to add candidate', error));
      }
    }
  }

  /**
   * Called when a message is received
   * @param event
   */
  private _onMessageReceived(event: MessageEvent) {
    this._totalBytesReceived += event.data.length;
  }

  /**
   * Called when an answer is created by the receiver
   * @param answer - The answer session description created by the receiver RTCPeerConnection
   */
  private _onReceiverAnswerCreated(answer: RTCSessionDescriptionInit): Promise<void | [void, void]> {
    return Promise.all([
      this._pcReceiver.setLocalDescription(answer),
      this._pcSender.setRemoteDescription(answer),
    ]).catch((error: DOMError) =>
      this._onError('Unable to set local or remote description from createAnswer', error));
  }

  /**
   * Called when an offer has been created by the sender
   * @param offer - The offer session description created by the sender RTCPeerConnection
   */
  private _onSenderOfferCreated(offer: RTCSessionDescriptionInit): Promise<void | [void, void]> {
    return Promise.all([
      this._pcSender.setLocalDescription(offer),
      this._pcReceiver.setRemoteDescription(offer),
    ]).catch((error: DOMError) =>
      this._onError('Unable to set local or remote description from createOffer', error));
  }

  /**
   * Send packets using data channel
   */
  private _sendData(): void {
    if (!this._rtcDataChannel || this._rtcDataChannel.readyState !== 'open') {
      return;
    }
    for (let i = 0; i < MAX_NUMBER_PACKETS; ++i) {
      if (this._rtcDataChannel.bufferedAmount >= BYTES_KEEP_BUFFERED) {
        break;
      }
      this._rtcDataChannel.send(TEST_PACKET);
    }
  }

  /**
   * Setup data channel for sending data
   */
  private _setupDataChannel(): void {
    try {
      this._rtcDataChannel = this._pcSender.createDataChannel('sender');
    } catch (e) {
      this._onError('Error creating data channel', e);
      return;
    }

    this._rtcDataChannel.onopen = () => {
      this._sendDataIntervalId = setInterval(() => this._sendData(), 1);
      this._checkBitrateIntervalId = setInterval(() => this._checkBitrate(), 1000);
    };

    this._pcReceiver.ondatachannel = (dataChannelEvent: RTCDataChannelEvent) => {
      dataChannelEvent.channel.onmessage = (event: MessageEvent) => this._onMessageReceived(event);
    };
  }

  /**
   * Setup network related event listeners on a PeerConnection
   * @param pc
   */
  private _setupNetworkListeners(pc: RTCPeerConnection) {
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected') {
        (this._options.getRTCIceCandidateStatsReport || getRTCIceCandidateStatsReport)(this._pcSender)
          .then((statsReport: RTCIceCandidateStatsReport) => {
            this._iceCandidateStats = statsReport.iceCandidateStats;
            this._selectedIceCandidatePairStats = statsReport.selectedIceCandidatePairStats;
          })
          .catch((error: DOMError) => {
            this._onError('Unable to generate WebRTC stats report', error);
          });
      }
    };
  }

  /**
   * Starts the test.
   */
  private _startTest(): void {
    if (!this._rtcConfiguration.iceServers) {
      return this._onError('No iceServers found', undefined);
    }

    this._pcSender.createOffer()
      .then((offer: RTCSessionDescriptionInit) => this._onSenderOfferCreated(offer))
      .then(() => {
        return this._pcReceiver.createAnswer()
          .then((answer: RTCSessionDescriptionInit) => this._onReceiverAnswerCreated(answer))
          .catch((error: Error) => this._onError('Unable to create answer', error));
      }).catch((error: Error) => this._onError('Unable to create offer', error));
  }
}

export namespace BitrateTest {
  /**
   * Possible events that a [[BitrateTest]] might emit. See [[BitrateTest.on]].
   */
  export enum Events {
    Bitrate = 'bitrate',
    End = 'end',
    Error = 'error',
  }

  /**
   * Options that may be passed to [[BitrateTest]] constructor for internal testing.
   * @internalapi
   */
  export interface ExtendedOptions extends Options {
    /**
     * A function that generates a WebRTC stats report containing relevant information about ICE candidates for
     * the given [PeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
     */
    getRTCIceCandidateStatsReport?: (peerConnection: RTCPeerConnection) => Promise<RTCIceCandidateStatsReport>;
  }

  /**
   * Options passed to [[BitrateTest]] constructor.
   */
  export interface Options {
    /**
     * The array of [RTCIceServer](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) configurations to use.
     * You need to provide TURN server configurations to ensure that your network bitrate is tested.
     * You you can use [Twilio's Network Traversal Service](https://www.twilio.com/stun-turn) to get TURN credentials.
     *
     * The following example demonstrates how to use the [twilio npm module](https://www.npmjs.com/package/twilio) to generate
     * credentials with a ttl of 120 seconds, using UDP protocol, and specifying ashburn as the
     * [edge location](https://www.twilio.com/docs/global-infrastructure/edge-locations).
     *
     * ```ts
     * import Client from 'twilio';
     * import { testBitrate } from '@twilio/rtc-diagnostics';
     *
     * // Generate the STUN and TURN server credentials with a ttl of 120 seconds
     * const client = Client(twilioAccountSid, authToken);
     * const token = await client.tokens.create({ ttl: 120 });
     *
     * // Filter for TURN servers.
     * // Use the following filters if you want to use UDP, TCP, or TLS
     * // UDP: turn:global.turn.twilio.com:3478?transport=udp
     * // TCP: turn:global.turn.twilio.com:3478?transport=tcp
     * // TLS: turn:global.turn.twilio.com:443?transport=tcp
     * let { urls, username, credential } = token.iceServers
     *   .find(item => item.url === 'turn:global.turn.twilio.com:3478?transport=udp');
     *
     * // By default, global will be used as the default edge location.
     * // You can replace global with a specific edge name.
     * urls = urls.replace('global', 'ashburn');
     *
     * // Use the TURN credentials using the iceServers parameter
     * const bitrateTest = testBitrate({ iceServers: [{ urls, username, credential }] });
     * ```
     * Note, for production code, the above code should not be executed client side as it requires the authToken which must be treated like a private key.
     */
    iceServers: RTCIceServer[];
  }

  /**
   * Represents the report generated from a [[BitrateTest]].
   */
  export interface Report {
    /**
     * Average bitrate calculated during the test.
     */
    averageBitrate: number;

    /**
     * Whether or not the test passed.
     * The test is considered to be passing if there were no errors detected and average bitrate is greater than the minimum bitrate required to make a call.
     * See [Network Bandwidth Requirements](https://www.twilio.com/docs/voice/client/javascript/voice-client-js-and-mobile-sdks-network-connectivity-requirements#network-bandwidth-requirements)
     */
    didPass: boolean;

    /**
     * Any errors that occurred during the test.
     */
    errors: DiagnosticError[];

    /**
     * An array of WebRTC stats for the ICE candidates gathered when connecting to media.
     */
    iceCandidateStats: RTCIceCandidateStats[];

    /**
     * A WebRTC stats for the ICE candidate pair used to connect to media, if candidates were selected.
     */
    selectedIceCandidatePairStats?: RTCSelectedIceCandidatePairStats;

    /**
     * The name of the test.
     */
    testName: string;

    /**
     * Time measurements of test run time.
     */
    testTiming: TimeMeasurement;

    /**
     * Bitrate values collected during the test.
     */
    values: number[];
  }
}

/**
 * The test uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) connected via a Twilio TURN server.
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 *
 * Example:
 * ```ts
 *   import { testBitrate } from '@twilio/rtc-diagnostics';
 *
 *   const bitrateTest = testBitrate({
 *     iceServers: [{
 *       credential: 'bar',
 *       username: 'foo',
 *       urls: 'turn:global.turn.twilio.com:3478?transport=udp',
 *     }],
 *   });
 *
 *   bitrateTest.on('bitrate', (bitrate) => {
 *     console.log(bitrate);
 *   });
 *
 *   bitrateTest.on('error', (error) => {
 *     console.log(error);
 *   });
 *
 *   bitrateTest.on('end', (report) => {
 *     console.log(report);
 *   });
 *
 *   // Run the test for 15 seconds
 *   setTimeout(() => {
 *     bitrateTest.stop();
 *   }, 15000);
 * ```
 * See [[BitrateTest.Options.iceServers]] for details on how to obtain TURN credentials.
 */
export function testBitrate(options: BitrateTest.Options): BitrateTest {
  return new BitrateTest(options);
}
