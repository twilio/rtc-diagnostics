import { EventEmitter } from 'events';
import { DiagnosticError } from './errors/DiagnosticError';
import { NetworkTiming, TimeMeasurement } from './timing';

const MAX_NUMBER_OF_PACKETS_TO_SEND = 100;
const BYTES_KEEP_BUFFERED = 1024 * MAX_NUMBER_OF_PACKETS_TO_SEND;

const CHECK_BITRATE_INTERVAL = 1000;
const SEND_DATA_INTERVAL = 1;
const TEST_PACKET = Array(1024).fill('h').join('');

/**
 * A {@link BitrateTest} runs bitrate-related tests while connected to a TURN server.
 * @publicapi
 */
class BitrateTest extends EventEmitter {
  /**
   * Name of this test
   */
  static readonly testName: string = 'bitrate-test';

  /**
   * Interval id for checking bitrate
   */
  private _checkBitrateIntervalId: NodeJS.Timer | undefined;

  /**
   * Errors detected during the test
   */
  private _errors: DiagnosticError[] = [];

  /**
   * Number of bytes received the last time it was checked
   */
  private _lastBytesChecked: number = 0;

  /**
   * Last timestamp when the bytes received was checked
   */
  private _lastCheckedTimestamp: number = 0;

  /**
   * Network related timing for this test
   */
  private _networkTiming: NetworkTiming = {};

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
   * Interval id for sending data
   */
  private _sendDataIntervalId: NodeJS.Timer | undefined;

  /**
   * Timing measurements for this test
   */
  private _testTiming: TimeMeasurement = { start: 0 };

  /**
   * Total number of bytes received by the receiver RTCPeerConnection
   */
  private _totalBytesReceived: number = 0;

  /**
   * Bitrate (kbps) values collected during the test
   */
  private _values: number[] = [];

  /**
   * Construct a {@link BitrateTest} instance
   * @constructor
   * @param options
   */
  constructor(options: BitrateTest.Options) {
    super();

    options = options || {};
    this._rtcConfiguration.iceServers = options.iceServers;

    this._pcReceiver = new RTCPeerConnection(this._rtcConfiguration);
    this._pcSender = new RTCPeerConnection(this._rtcConfiguration);

    this._pcReceiver.onicecandidate = (event: RTCPeerConnectionIceEvent) => this._onIceCandidate(this._pcSender, event);
    this._pcSender.onicecandidate = (event: RTCPeerConnectionIceEvent) => this._onIceCandidate(this._pcReceiver, event);

    this._setupNetworkListeners(this._pcSender);

    // Return before starting the test to allow consumer
    // to listen and capture errors
    setTimeout(() => {
      this._setupDataChannel();
      this._startTest();
    });
  }

  /**
   * Stops the current test
   */
  stop(): void {
    clearInterval(this._sendDataIntervalId!);
    clearInterval(this._checkBitrateIntervalId!);

    this._pcSender.close();
    this._pcReceiver.close();

    this._testTiming.end = Date.now();
    this._testTiming.duration = this._testTiming.end - this._testTiming.start;

    this.emit('end', this._getReport());
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
    this.emit('bitrate', bitrate);
  }

  /**
   * Generate and returns the report for this test
   */
  private _getReport(): BitrateTest.Report {
    const averageBitrate = this._values
      .reduce((total: number, value: number) => total += value, 0) / this._values.length;
    return {
      averageBitrate: isNaN(averageBitrate) ? 0 : averageBitrate,
      didPass: !this._errors.length && !!this._values.length,
      errors: this._errors,
      networkTiming: this._networkTiming,
      testName: BitrateTest.testName,
      testTiming: this._testTiming,
      values: this._values,
    };
  }

  /**
   * Called when an error is detected
   * @param message - Message that describes the error
   * @param error - The error object
   * @param isFatal - Whether this is a fatal error
   */
  private _onError(message: string, error?: DOMError, isFatal?: boolean): void {
    const diagnosticError = new DiagnosticError(error, message);
    this._errors.push(diagnosticError);
    this.emit('error', diagnosticError);

    if (isFatal) {
      this.stop();
    }
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

    if (!this._networkTiming.firstPacket) {
      this._networkTiming.firstPacket = Date.now();
    }
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
      this._onError('Unable to set local or remote description from createAnswer', error, true));
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
      this._onError('Unable to set local or remote description from createOffer', error, true));
  }

  /**
   * Send packets using data channel
   */
  private _sendData(): void {
    if (!this._rtcDataChannel || this._rtcDataChannel.readyState !== 'open') {
      return;
    }
    for (let i = 0; i < MAX_NUMBER_OF_PACKETS_TO_SEND; ++i) {
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
      this._onError('Error creating data channel', e, true);
      return;
    }

    this._rtcDataChannel.onopen = () => {
      this._sendDataIntervalId = setInterval(() => this._sendData(), SEND_DATA_INTERVAL);
      this._checkBitrateIntervalId = setInterval(() => this._checkBitrate(), CHECK_BITRATE_INTERVAL);
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
    // PeerConnection state
    pc.onconnectionstatechange = () => {
      this._networkTiming.peerConnection = this._networkTiming.peerConnection || { start: 0 };

      if (pc.connectionState === 'connecting') {
        this._networkTiming.peerConnection.start = Date.now();
      } else if (pc.connectionState === 'connected') {
        this._networkTiming.peerConnection.end = Date.now();

        const { start, end } = this._networkTiming.peerConnection;
        this._networkTiming.peerConnection.duration = end - start;
      }
    };

    // ICE Connection state
    pc.oniceconnectionstatechange = () => {
      this._networkTiming.ice = this._networkTiming.ice || { start: 0 };

      if (pc.iceConnectionState === 'checking') {
        this._networkTiming.ice.start = Date.now();
      } else if (pc.iceConnectionState === 'connected') {
        this._networkTiming.ice.end = Date.now();

        const { start, end } = this._networkTiming.ice;
        this._networkTiming.ice.duration = end - start;
      }
    };
  }

  /**
   * Starts the test
   */
  private _startTest(): void {
    this._testTiming.start = Date.now();

    if (!this._rtcConfiguration.iceServers) {
      return this._onError('No iceServers found', undefined, true);
    }

    this._pcSender.createOffer()
      .then((offer: RTCSessionDescriptionInit) => this._onSenderOfferCreated(offer))
      .then(() => {
        return this._pcReceiver.createAnswer()
          .then((answer: RTCSessionDescriptionInit) => this._onReceiverAnswerCreated(answer))
          .catch((error: Error) => this._onError('Unable to create answer', error, true));
      }).catch((error: Error) => this._onError('Unable to create offer', error, true));
  }
}

namespace BitrateTest {
  /**
   * Options passed to {@link BitrateTest} constructor
   */
  export interface Options {
    /**
     * The array of ICE server configurations to use
     */
    iceServers: RTCIceServer[];
  }

  /**
   * Represents the report generated from the {@link BitrateTest}
   */
  export interface Report {
    /**
     * Average bitrate calculated during the test
     */
    averageBitrate: number;

    /**
     * Whether the test passed
     */
    didPass: boolean;

    /**
     * Errors detected during the test
     */
    errors: DiagnosticError[];

    /**
     * Network related timing measurements
     */
    networkTiming: NetworkTiming;

    /**
     * The name of the test
     */
    testName: string;

    /**
     * Timing measurements of the test
     */
    testTiming: TimeMeasurement;

    /**
     * Bitrate values collected during the test
     */
    values: number[];
  }
}

/**
 * Create a new {@link BitrateTest} instance and runs bitrate-related tests
 * @param options
 */
export const testBitrate = (options: BitrateTest.Options): BitrateTest => {
  return new BitrateTest(options);
};

export default BitrateTest;
