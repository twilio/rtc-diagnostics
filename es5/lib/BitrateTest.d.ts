/// <reference types="node" />
import { EventEmitter } from 'events';
import { DiagnosticError } from './errors/DiagnosticError';
import { TimeMeasurement } from './types';
import { RTCIceCandidateStats, RTCIceCandidateStatsReport, RTCSelectedIceCandidatePairStats } from './utils/candidate';
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
    on(event: BitrateTest.Events.Bitrate, listener: (bitrate: number) => any): this;
    /**
     * Raised when the test encounters an error.
     * When this happens, the test will immediately stop and emit [[BitrateTest.Events.End]].
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
 * BitrateTest uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
 * connected via a [Twilio Network Traversal Service](https://www.twilio.com/docs/stun-turn).
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 * See [[BitrateTest.Options.iceServers]] for information how to use Twilio NTS.
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
     * The options passed to [[BitrateTest]] constructor.
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
     * RTC configuration that will be used when initializing a RTCPeerConnection
     */
    private _rtcConfiguration;
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
     * times out, it means something has timed out our BitrateTest.
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
     * Construct a [[BitrateTest]] instance. The test will start immediately.
     * Test should be allowed to run for a minimum of 8 seconds. To stop the test, call [[BitrateTest.stop]].
     * @constructor
     * @param options
     */
    constructor(options: BitrateTest.ExtendedOptions);
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
     * Options that may be passed to [[BitrateTest]] constructor for internal testing.
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
     * Options passed to [[BitrateTest]] constructor.
     */
    interface Options {
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
    interface Report {
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
export declare function testBitrate(options: BitrateTest.Options): BitrateTest;
