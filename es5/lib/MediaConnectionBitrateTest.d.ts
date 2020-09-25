/// <reference types="node" />
import { EventEmitter } from 'events';
import { WarningName } from './constants';
import { DiagnosticError } from './errors/DiagnosticError';
import { TimeMeasurement } from './types';
import { RTCIceCandidateStats, RTCIceCandidateStatsReport, RTCSelectedIceCandidatePairStats } from './utils/candidate';
export declare interface MediaConnectionBitrateTest {
    /**
     * Raised every second with a `bitrate` parameter in kbps which represents the connection's bitrate since the last time this event was raised.
     * The bitrate value is limited by either your downlink or uplink, whichever is lower.
     * For example, if your downlink and uplink is 50mbps and 10mbps respectively, bitrate value will not exceed 10mbps.
     * @param event [[MediaConnectionBitrateTest.Events.Bitrate]].
     * @param listener A callback with a `bitrate`(kbps) parameter since the last time this event was raised.
     * @returns This [[MediaConnectionBitrateTest]] instance.
     * @event
     */
    on(event: MediaConnectionBitrateTest.Events.Bitrate, listener: (bitrate: number) => any): this;
    /**
     * Raised when the test encounters an error.
     * When this happens, the test will immediately stop and emit [[MediaConnectionBitrateTest.Events.End]].
     * @param event [[MediaConnectionBitrateTest.Events.Error]].
     * @param listener A callback with a [[DiagnosticError]] parameter.
     * @returns This [[MediaConnectionBitrateTest]] instance.
     * @event
     */
    on(event: MediaConnectionBitrateTest.Events.Error, listener: (error: DiagnosticError) => any): this;
    /**
     * Raised upon completion of the test.
     * @param event [[MediaConnectionBitrateTest.Events.End]].
     * @param listener A callback with a [[MediaConnectionBitrateTest.Report]] parameter.
     * @returns This [[MediaConnectionBitrateTest]] instance.
     * @event
     */
    on(event: MediaConnectionBitrateTest.Events.End, listener: (report: MediaConnectionBitrateTest.Report) => any): this;
    /**
     * Raised when the test encounters a non-fatal warning during its run-time.
     * @param event [[MediaConnectionBitrateTest.Events.Warning]].
     * @param listener A callback with a [[WarningName]] parameter.
     * @returns This [[MediaConnectionBitrateTest]] instance.
     * @event
     */
    on(event: MediaConnectionBitrateTest.Events.Warning, listener: (warningName: WarningName) => any): this;
    /**
     * Raised when the test clears a previously encountered non-fatal warning during its run-time.
     * @param event [[MediaConnectionBitrateTest.Events.WarningCleared]].
     * @param listener A callback with a [[WarningName]] parameter.
     * @returns This [[MediaConnectionBitrateTest]] instance.
     * @event
     */
    on(event: MediaConnectionBitrateTest.Events.WarningCleared, listener: (warningName: WarningName) => any): this;
}
/**
 * MediaConnectionBitrateTest uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
 * connected via a [Twilio Network Traversal Service](https://www.twilio.com/docs/stun-turn).
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 * See [[MediaConnectionBitrateTest.Options.iceServers]] for information how to use Twilio NTS.
 */
export declare class MediaConnectionBitrateTest extends EventEmitter {
    /**
     * Name of this test
     */
    static readonly testName: string;
    /**
     * Active warnings to keep track of.
     */
    readonly activeWarnings: Set<WarningName>;
    /**
     * Interval id for checking bitrate
     */
    private _checkBitrateIntervalId;
    /**
     * A timestamp of when the test ends.
     */
    private _endTime;
    /**
     * Errors detected during the test
     */
    private _errors;
    /**
     * An array of WebRTC stats for the ICE candidates gathered when connecting to media.
     */
    private _iceCandidateStats;
    /**
     * Number of bytes received the last time it was checked
     */
    private _lastBytesChecked;
    /**
     * Last timestamp when the bytes received was checked
     */
    private _lastCheckedTimestamp;
    /**
     * The options passed to [[MediaConnectionBitrateTest]] constructor.
     */
    private _options;
    /**
     * The RTCPeerConnection that will receive data
     */
    private _pcReceiver;
    /**
     * The RTCPeerConnection that will send data
     */
    private _pcSender;
    /**
     * RTCDataChannel to use for sending data
     */
    private _rtcDataChannel;
    /**
     * A WebRTC stats for the ICE candidate pair used to connect to media, if candidates were selected.
     */
    private _selectedIceCandidatePairStats;
    /**
     * Interval id for sending data
     */
    private _sendDataIntervalId;
    /**
     * A timestamp of when the test starts. This is set during initialization of the test
     * and not when the test succesfully starts.
     */
    private _startTime;
    /**
     * Timeout reference that should be cleared when we receive any data. If this
     * times out, it means something has timed out our [[MediaConnectionBitrateTest]].
     */
    private _timeout;
    /**
     * Total number of bytes received by the receiver RTCPeerConnection
     */
    private _totalBytesReceived;
    /**
     * Bitrate (kbps) values collected during the test
     */
    private _values;
    /**
     * Construct a [[MediaConnectionBitrateTest]] instance. The test will start immediately.
     * Test should be allowed to run for a minimum of 8 seconds. To stop the test, call [[MediaConnectionBitrateTest.stop]].
     * @constructor
     * @param options
     */
    constructor(options: MediaConnectionBitrateTest.ExtendedOptions);
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
     * Check current bitrate values and emit warnings
     * if [[WarningName.LowBitrate]] criteria are met.
     */
    private _maybeEmitWarning;
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
export declare namespace MediaConnectionBitrateTest {
    /**
     * Possible events that a [[MediaConnectionBitrateTest]] might emit. See [[MediaConnectionBitrateTest.on]].
     */
    enum Events {
        Bitrate = "bitrate",
        End = "end",
        Error = "error",
        Warning = "warning",
        WarningCleared = "warning-cleared"
    }
    /**
     * Options that may be passed to [[MediaConnectionBitrateTest]] constructor for internal testing.
     * @internalapi
     */
    interface ExtendedOptions extends Options {
        /**
         * A function that generates a WebRTC stats report containing relevant information about ICE candidates for
         * the given [PeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
         */
        getRTCIceCandidateStatsReport?: (peerConnection: RTCPeerConnection) => Promise<RTCIceCandidateStatsReport>;
    }
    /**
     * Options passed to [[MediaConnectionBitrateTest]] constructor.
     */
    interface Options {
        /**
         * The array of [RTCIceServer](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) configurations to use.
         * You need to provide STUN and TURN server configurations to ensure that your network bitrate is tested.
         * You can use [Twilio's Network Traversal Service](https://www.twilio.com/stun-turn) to get STUN and TURN server configurations.
         *
         * The following example demonstrates how to use the [twilio npm module](https://www.npmjs.com/package/twilio) to generate
         * credentials with a ttl of 120 seconds, using UDP protocol, and specifying ashburn as the
         * [edge location](https://www.twilio.com/docs/global-infrastructure/edge-locations).
         *
         * ```ts
         * import Client from 'twilio';
         * import { testMediaConnectionBitrate } from '@twilio/rtc-diagnostics';
         *
         * // Generate the STUN and TURN server credentials with a ttl of 120 seconds
         * const client = Client(twilioAccountSid, authToken);
         * const token = await client.tokens.create({ ttl: 120 });
         * const iceServers = [];
         *
         * // Grab STUN server
         * iceServers.push({ urls: token.iceServers.find(item => item.urls.includes('stun:global.stun.twilio.com')).urls });
         *
         * // Grab TURN servers.
         * // Use the following filters if you want to use UDP, TCP, or TLS
         * // UDP: turn:global.turn.twilio.com:3478?transport=udp
         * // TCP: turn:global.turn.twilio.com:3478?transport=tcp
         * // TLS: turn:global.turn.twilio.com:443?transport=tcp
         * let { urls, username, credential } = token.iceServers
         *   .find(item => item.url === 'turn:global.turn.twilio.com:3478?transport=udp');
         * iceServers.push({ urls, username, credential });
         *
         * // By default, global will be used as the default edge location.
         * // You can replace global with a specific edge name.
         * iceServers.forEach(iceServer => {
         *   iceServer.urls = iceServer.urls.replace('global', 'ashburn');
         * });
         *
         * // Use the TURN credentials using the iceServers parameter
         * const mediaConnectionBitrateTest = testMediaConnectionBitrate({ iceServers });
         * ```
         * Note, for production code, the above code should not be executed client side as it requires the authToken which must be treated like a private key.
         */
        iceServers: RTCIceServer[];
        /**
         * The minimum bitrate in kilobits per second expected to be available.
         * This value is used to determine when to raise [[WarningName.LowBitrate]] warning.
         * @default 100
         */
        minBitrateThreshold?: number;
    }
    /**
     * Represents the report generated from a [[MediaConnectionBitrateTest]].
     */
    interface Report {
        /**
         * Average bitrate calculated during the test.
         */
        averageBitrate: number;
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
        testName: typeof MediaConnectionBitrateTest.testName;
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
 *   import { testMediaConnectionBitrate } from '@twilio/rtc-diagnostics';
 *
 *   const mediaConnectionBitrateTest = testMediaConnectionBitrate({
 *     iceServers: [{
 *       urls: 'stun:global.stun.twilio.com:3478?transport=udp',
 *     }, {
 *       credential: 'bar',
 *       username: 'foo',
 *       urls: 'turn:global.turn.twilio.com:3478?transport=udp',
 *     }],
 *   });
 *
 *   mediaConnectionBitrateTest.on('bitrate', (bitrate) => {
 *     console.log(bitrate);
 *   });
 *
 *   mediaConnectionBitrateTest.on('error', (error) => {
 *     console.log(error);
 *   });
 *
 *   mediaConnectionBitrateTest.on('end', (report) => {
 *     console.log(report);
 *   });
 *
 *   // Run the test for 15 seconds
 *   setTimeout(() => {
 *     mediaConnectionBitrateTest.stop();
 *   }, 15000);
 * ```
 * See [[MediaConnectionBitrateTest.Options.iceServers]] for details on how to obtain STUN and TURN server configurations.
 */
export declare function testMediaConnectionBitrate(options: MediaConnectionBitrateTest.Options): MediaConnectionBitrateTest;
