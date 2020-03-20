/// <reference types="node" />
import { EventEmitter } from 'events';
import { NetworkTiming } from '../timing';
/**
 * @internalapi
 */
export declare interface TestCall {
    /**
     * This event is emitted when the `RTCPeerConnection`'s `RTCDataChannel` is
     * closed.
     * @param event [[TestCall.Event.Close]]
     * @param peerConnection The `RTCPeerConnection` that had its `RTCDataChannel`
     * closed.
     * @param rtcEvent The close event.
     * @private
     */
    emit(event: TestCall.Event.Close, peerConnection: RTCPeerConnection, rtcEvent: Event): boolean;
    /**
     * This event is emitted when the `RTCPeerConnection` receives an ICE
     * candidate.
     * @param event [[TestCall.Event.IceCandidate]]
     * @param peerConnection The `RTCPeerConnection` that received the ICE event.
     * @param iceEvent The ICE candidate event.
     * @returns `true` if the event had listeners, `false` otherwise.
     * @private
     */
    emit(event: TestCall.Event.IceCandidate, peerConnection: RTCPeerConnection, iceEvent: RTCPeerConnectionIceEvent): boolean;
    /**
     * This event is emitted when the `RTCPeerConnection` receives a message on
     * its `RTCDataChannel`.
     * @param event [[TestCall.Event.Message]]
     * @param messageEvent The message event received by the `RTCPeerConnection`.
     * @returns `true` if the event had listeners, `false` otherwise.
     * @private
     */
    emit(event: TestCall.Event.Message, messageEvent: MessageEvent): boolean;
    /**
     * This event is emitted when the `RTCPeerConnection`'s `RTCDataChannel` is
     * opened.
     * @param event [[TestCall.Event.Open]]
     * @param peerConnection The `RTCPeerConnection` that received an open event
     * from its `RTCDataChannel`.
     * @param rtcEvent The open event.
     * @returns `true` if the event had listeners, `false` otherwise.
     * @private
     */
    emit(event: TestCall.Event.Open, peerConnection: RTCPeerConnection, rtcEvent: Event): boolean;
    /**
     * Raised when one of the two `RTCPeerConnection`s has their `RTCDataChannel`
     * closed.
     * @param event [[TestCall.Event.Close]]
     * @param listener A callback that expects the following parameters:
     * - An `RTCPeerConnection` that represents the connection that had its
     * `RTCDataChannel` closed.
     * @returns This [[TestCall]] instance.
     */
    on(event: TestCall.Event.Close, listener: (peerConnection: RTCPeerConnection) => any): this;
    /**
     * Raised when one of the two `RTCPeerConnection`s receives an ICE candidate.
     * @param event [[TestCall.Event.IceCandidate]]
     * @param listener A callback that expects the following parameters:
     * - The `RTCPeerConnection` that received the event.
     * - An `RTCPeerConnectionIceEvent` that the `RTCPeerConnection` received.
     * @returns This [[TestCall]] instance.
     */
    on(event: TestCall.Event.IceCandidate, listener: (peerConnection: RTCPeerConnection, iceEvent: RTCPeerConnectionIceEvent) => any): this;
    /**
     * Raised when the recipient-designated `RTCPeerConnection` receives a message
     * from the sender.
     * @param event [[TestCall.Event.Message]]
     * @param listener A callback that expects the following parameters:
     * - A `MessageEvent` that the `RTCPeerConnection`'s `RTCDataChannel` receives
     * @returns This [[TestCall]] instance.
     */
    on(event: TestCall.Event.Message, listener: (message: MessageEvent) => any): this;
    /**
     * Raised when one fo the two `RTCPeerConnection`s receives an open event from
     * their `RTCDataChannel`.
     * @param event [[TestCall.Event.Open]]
     * @param listener A callback that expects the following parameters:
     * - An `RTCPeerConnection` that represents the connection that had its
     * `RTCDataChannel` opened.
     * @returns This [[TestCall]] instance.
     */
    on(event: TestCall.Event.Open, listener: (peerConnection: RTCPeerConnection) => any): this;
}
/**
 * Creates two PeerConnections that attempt to connect to each other through
 * any ICE servers given by the parameter
 * [[TestCall.Options.peerConnectionConfig]].
 * Provides a `send` helper function to send data from the `sender` to the
 * `receiver`.
 * @private
 */
export declare class TestCall extends EventEmitter {
    /**
     * Network event time measurements.
     */
    private _networkTiming;
    /**
     * The recipient-designated `RTCPeerConnection`, will receive a message
     * from the [[_sender]].
     */
    private _recipient;
    /**
     * The `RTCDataChannel` belonging to the sender-designated
     * `RTCPeerConnection`.
     */
    private _sendDataChannel;
    /**
     * The sender-designated `RTCPeerConnection`, will send a message to the
     * [[_recipient]].
     */
    private _sender;
    /**
     * The timeout before failing.
     */
    private _timeoutDuration;
    /**
     * Constructor for the [[TestCall]] helper class. Creates the two
     * `RTCPeerConnection`s and maintains their connection to each other.
     */
    constructor(config: TestCall.Config);
    /**
     * Close the `sender` and `recipient` PCs.
     */
    close(): void;
    /**
     * Create offers and answers for the PCs and set them. This starts the
     * ICE connection process between the two.
     */
    establishConnection(): Promise<void>;
    /**
     * Returns all recorded network time measurements.
     */
    getNetworkTiming(): NetworkTiming;
    /**
     * Helper function for sending data
     * @param data a string of characters that will be sent from one end of the
     * [[TestCall]] to the other, specifically from [[TestCall._sender]] to
     * [[TestCall._recipient]].
     */
    send(data: string): void;
    /**
     * Bind the ice candidate handler to the peer connection.
     * @param peerConnectionFrom The peer connection to bind the ice candidate
     * handler to.
     * @param peerConnectionTo The peer connection to forward the ice candidate
     * to.
     */
    private _bindPeerConnectionIceCandidateHandler;
    /**
     * Bind time measuring event handlers.
     * @param peerConnection The peer connection to bind the time measuring
     * event handlers to.
     */
    private _bindPeerConnectionTimeHandlers;
}
export declare namespace TestCall {
    /**
     * Events that the [[TestCall]] helper class may emit as the `PeerConnection`s
     * communicate with each other.
     */
    enum Event {
        Close = "close",
        IceCandidate = "iceCandidate",
        Message = "message",
        Open = "open"
    }
    /**
     * Options for the [[TestCall]] class.
     */
    interface Config {
        /**
         * Configurations to pass to the `PeerConnection` class.
         */
        peerConnectionConfig: RTCConfiguration;
        /**
         * Used to mock the peer connection.
         * @private
         */
        peerConnectionFactory?: typeof RTCPeerConnection;
        /**
         * Timeout for the `RTCDataChannel`.
         */
        timeoutDuration: number;
    }
    /**
     * Used in conjunction with the events raised from this class to determine
     * which leg of the call is connected.
     * For example, the [[TestCall.Events.Open]] event is raised with the information
     * `Recipient` or `Sender` signifying which side of the data channel was just
     * opened.
     */
    enum CallId {
        Recipient = "recipient",
        Sender = "sender"
    }
}
