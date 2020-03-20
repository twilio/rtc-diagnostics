/// <reference types="node" />
import { EventEmitter } from 'events';
import { DiagnosticError } from './errors/DiagnosticError';
import { NetworkTiming, TimeMeasurement } from './timing';
export declare interface BitrateTest {
    /**
     * Raised every second with a `bitrate` parameter in kbps which represents the connection's bitrate since the last time this event was raised.
     * @param event [[BitrateTest.Events.Bitrate]].
     * @param listener A callback with a `bitrate`(kbps) parameter since the last time this event was raised.
     * @returns This [[BitrateTest]] instance.
     * @event
     */
    on(event: BitrateTest.Events.Bitrate, listener: (bitrate: number) => any): this;
    /**
     * Raised when the test encounters an error.
     * @param event [[BitrateTest.Events.Error]].
     * @param listener A callback with a [[DiagnosticError]] parameter.
     * @returns This [[BitrateTest]] instance.
     * @event
     */
    on(event: BitrateTest.Events.Error, listener: (error: DiagnosticError) => any): this;
    /**
     * Raised upon completion of the test.
     * @param event [[BitrateTest.Events.End]].
     * @param listener A callback with a [[BitrateTest.Report]] parameter.
     * @returns This [[BitrateTest]] instance.
     * @event
     */
    on(event: BitrateTest.Events.End, listener: (report: BitrateTest.Report) => any): this;
}
/**
 * Runs bitrate related tests while connected to a TURN server.
 * The events defined in the enum [[Events]] are emitted as the test runs.
 */
export declare class BitrateTest extends EventEmitter {
    /**
     * Name of this test
     */
    static readonly testName: string;
    /**
     * Interval id for checking bitrate
     */
    private _checkBitrateIntervalId;
    /**
     * Errors detected during the test
     */
    private _errors;
    /**
     * Number of bytes received the last time it was checked
     */
    private _lastBytesChecked;
    /**
     * Last timestamp when the bytes received was checked
     */
    private _lastCheckedTimestamp;
    /**
     * Network related timing for this test
     */
    private _networkTiming;
    /**
     * The RTCPeerConnection that will receive data
     */
    private _pcReceiver;
    /**
     * The RTCPeerConnection that will send data
     */
    private _pcSender;
    /**
     * RTC configuration that will be used when initializing a RTCPeerConnection
     */
    private _rtcConfiguration;
    /**
     * RTCDataChannel to use for sending data
     */
    private _rtcDataChannel;
    /**
     * Interval id for sending data
     */
    private _sendDataIntervalId;
    /**
     * Timing measurements for this test
     */
    private _testTiming;
    /**
     * Total number of bytes received by the receiver RTCPeerConnection
     */
    private _totalBytesReceived;
    /**
     * Bitrate (kbps) values collected during the test
     */
    private _values;
    /**
     * Construct a [[BitrateTest]] instance.
     * @constructor
     * @param options
     */
    constructor(options: BitrateTest.Options);
    /**
     * Stops the current test.
     */
    stop(): void;
    /**
     * Calculate bitrate by comparing bytes received between current time and the last time it was checked
     */
    private _checkBitrate;
    /**
     * Generate and returns the report for this test
     */
    private _getReport;
    /**
     * Called when an error is detected
     * @param message - Message that describes the error
     * @param error - The error object
     * @param isFatal - Whether this is a fatal error
     */
    private _onError;
    /**
     * Called when a local candidate is gathered
     * @param remotePc - The remote RTCPeerConnection
     */
    private _onIceCandidate;
    /**
     * Called when a message is received
     * @param event
     */
    private _onMessageReceived;
    /**
     * Called when an answer is created by the receiver
     * @param answer - The answer session description created by the receiver RTCPeerConnection
     */
    private _onReceiverAnswerCreated;
    /**
     * Called when an offer has been created by the sender
     * @param offer - The offer session description created by the sender RTCPeerConnection
     */
    private _onSenderOfferCreated;
    /**
     * Send packets using data channel
     */
    private _sendData;
    /**
     * Setup data channel for sending data
     */
    private _setupDataChannel;
    /**
     * Setup network related event listeners on a PeerConnection
     * @param pc
     */
    private _setupNetworkListeners;
    /**
     * Starts the test.
     */
    private _startTest;
}
export declare namespace BitrateTest {
    /**
     * Possible events that a [[BitrateTest]] might emit. See [[BitrateTest.on]].
     */
    enum Events {
        Bitrate = "bitrate",
        End = "end",
        Error = "error"
    }
    /**
     * Options passed to [[BitrateTest]] constructor.
     */
    interface Options {
        /**
         * The array of [RTCIceServer](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) configurations to use.
         * You need to provide TURN server configurations to ensure that your network bitrate is tested.
         * You you can use [Twilio's Network Traversal Service](https://www.twilio.com/stun-turn) to get TURN credentials.
         */
        iceServers: RTCIceServer[];
    }
    /**
     * Represents the report generated from a [[BitrateTest]].
     */
    interface Report {
        /**
         * Average bitrate calculated during the test.
         */
        averageBitrate: number;
        /**
         * Whether or not the test passed. This is `false` if there are errors that occurred or if there are no bitrate values collected during the test.
         */
        didPass: boolean;
        /**
         * Any errors that occurred during the test.
         */
        errors: DiagnosticError[];
        /**
         * Network related time measurements.
         */
        networkTiming: NetworkTiming;
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
 * Tests your bitrate while connected to a TURN server.
 */
export declare function testBitrate(options: BitrateTest.Options): BitrateTest;
