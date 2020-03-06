import { EventEmitter } from 'events';
import { NetworkTiming } from '../timing';
import { waitForPromise } from '../utils/TimeoutPromise';

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
  emit(
    event: TestCall.Event.Close,
    peerConnection: RTCPeerConnection,
    rtcEvent: Event,
  ): boolean;
  /**
   * This event is emitted when the `RTCPeerConnection` receives an ICE
   * candidate.
   * @param event [[TestCall.Event.IceCandidate]]
   * @param peerConnection The `RTCPeerConnection` that received the ICE event.
   * @param iceEvent The ICE candidate event.
   * @returns `true` if the event had listeners, `false` otherwise.
   * @private
   */
  emit(
    event: TestCall.Event.IceCandidate,
    peerConnection: RTCPeerConnection,
    iceEvent: RTCPeerConnectionIceEvent,
  ): boolean;
  /**
   * This event is emitted when the `RTCPeerConnection` receives a message on
   * its `RTCDataChannel`.
   * @param event [[TestCall.Event.Message]]
   * @param messageEvent The message event received by the `RTCPeerConnection`.
   * @returns `true` if the event had listeners, `false` otherwise.
   * @private
   */
  emit(
    event: TestCall.Event.Message,
    messageEvent: MessageEvent,
  ): boolean;
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
  emit(
    event: TestCall.Event.Open,
    peerConnection: RTCPeerConnection,
    rtcEvent: Event,
  ): boolean;

  /**
   * Raised when one of the two `RTCPeerConnection`s has their `RTCDataChannel`
   * closed.
   * @param event [[TestCall.Event.Close]]
   * @param listener A callback that expects the following parameters:
   * - An `RTCPeerConnection` that represents the connection that had its
   * `RTCDataChannel` closed.
   * @returns This [[TestCall]] instance.
   */
  on(
    event: TestCall.Event.Close,
    listener: (peerConnection: RTCPeerConnection) => any,
  ): this;
  /**
   * Raised when one of the two `RTCPeerConnection`s receives an ICE candidate.
   * @param event [[TestCall.Event.IceCandidate]]
   * @param listener A callback that expects the following parameters:
   * - The `RTCPeerConnection` that received the event.
   * - An `RTCPeerConnectionIceEvent` that the `RTCPeerConnection` received.
   * @returns This [[TestCall]] instance.
   */
  on(
    event: TestCall.Event.IceCandidate,
    listener: (
      peerConnection: RTCPeerConnection,
      iceEvent: RTCPeerConnectionIceEvent,
    ) => any,
  ): this;
  /**
   * Raised when the recipient-designated `RTCPeerConnection` receives a message
   * from the sender.
   * @param event [[TestCall.Event.Message]]
   * @param listener A callback that expects the following parameters:
   * - A `MessageEvent` that the `RTCPeerConnection`'s `RTCDataChannel` receives
   * @returns This [[TestCall]] instance.
   */
  on(
    event: TestCall.Event.Message,
    listener: (message: MessageEvent) => any,
  ): this;
  /**
   * Raised when one fo the two `RTCPeerConnection`s receives an open event from
   * their `RTCDataChannel`.
   * @param event [[TestCall.Event.Open]]
   * @param listener A callback that expects the following parameters:
   * - An `RTCPeerConnection` that represents the connection that had its
   * `RTCDataChannel` opened.
   * @returns This [[TestCall]] instance.
   */
  on(
    event: TestCall.Event.Open,
    listener: (peerConnection: RTCPeerConnection) => any,
  ): this;
}

/**
 * Creates two PeerConnections that attempt to connect to each other through
 * any ICE servers given by the parameter
 * [[TestCall.Options.peerConnectionConfig]].
 * Provides a `send` helper function to send data from the `sender` to the
 * `receiver`.
 * @private
 */
export class TestCall extends EventEmitter {
  /**
   * Network event time measurements.
   */
  private _networkTiming: NetworkTiming = {};
  /**
   * The recipient-designated `RTCPeerConnection`, will receive a message
   * from the [[_sender]].
   */
  private _recipient: RTCPeerConnection;
  /**
   * The `RTCDataChannel` belonging to the sender-designated
   * `RTCPeerConnection`.
   */
  private _sendDataChannel: RTCDataChannel;
  /**
   * The sender-designated `RTCPeerConnection`, will send a message to the
   * [[_recipient]].
   */
  private _sender: RTCPeerConnection;
  /**
   * The timeout before failing.
   */
  private _timeoutDuration: number;

  /**
   * Constructor for the [[TestCall]] helper class. Creates the two
   * `RTCPeerConnection`s and maintains their connection to each other.
   */
  constructor(config: TestCall.Config) {
    super();

    this._timeoutDuration = config.timeoutDuration;

    const peerConnectionFactory: typeof RTCPeerConnection =
      config.peerConnectionFactory || RTCPeerConnection;

    this._sender = new peerConnectionFactory(config.peerConnectionConfig);
    this._recipient = new peerConnectionFactory(config.peerConnectionConfig);

    // Set up data channels and listeners on the recipient and the sender.
    this._recipient.ondatachannel = ({
      channel,
    }: {
      channel: RTCDataChannel;
    }): void => {
      channel.onmessage = (messageEvent: MessageEvent): void => {
        this.emit(TestCall.Event.Message, messageEvent);
      };
      channel.onopen = (event: Event): void => {
        this.emit(TestCall.Event.Open, this._recipient, event);
      };
      channel.onclose = (event: Event): void => {
        this.emit(TestCall.Event.Close, this._recipient, event);
      };
    };

    this._sendDataChannel = this._sender.createDataChannel('sendDataChannel');
    this._sendDataChannel.onopen = (event: Event): void => {
      this.emit(TestCall.Event.Open, this._sender, event);
    };
    this._sendDataChannel.onclose = (event: Event): void => {
      this.emit(TestCall.Event.Close, this._sender, event);
    };

    // Forward ICE candidates
    this._bindPeerConnectionIceCandidateHandler(
      this._sender,
      this._recipient,
    );
    this._bindPeerConnectionIceCandidateHandler(
      this._recipient,
      this._sender,
    );

    this._bindPeerConnectionTimeHandlers(this._sender);
  }

  /**
   * Close the `sender` and `recipient` PCs.
   */
  close(): void {
    if (this._sender) {
      this._sender.close();
    }
    if (this._recipient) {
      this._recipient.close();
    }
  }

  /**
   * Create offers and answers for the PCs and set them. This starts the
   * ICE connection process between the two.
   */
  async establishConnection(): Promise<void> {
    // Set up a promise that resolves when the data channel is open
    const waitForDataChannelOpen: Array<Promise<void>> = [
      this._sender,
      this._recipient,
    ].map((peerConnection: RTCPeerConnection) => new Promise(
      (resolve: () => void): void => {
        this.on(TestCall.Event.Open, (connectedPeerConnection: RTCPeerConnection): void => {
          if (peerConnection === connectedPeerConnection) {
            resolve();
          }
        });
      },
    ));

    // Create the offer on the sender
    const senderDesc: RTCSessionDescriptionInit =
      await this._sender.createOffer();
    await Promise.all([
      // Set this description for the local and remote legs
      this._sender.setLocalDescription(senderDesc),
      this._recipient.setRemoteDescription(senderDesc),
    ]);

    // Create the answer from the recipient
    const recipientDesc: RTCSessionDescriptionInit =
      await this._recipient.createAnswer();
    await Promise.all([
      // Set this description for the local and remote legs
      this._recipient.setLocalDescription(recipientDesc),
      this._sender.setRemoteDescription(recipientDesc),
    ]);

    // Once the offer and answer are set, the connection should start and
    // eventually be established between the two PCs
    // We can wait for the data channel to open on both sides to be sure
    await Promise.all(waitForDataChannelOpen.map((promise: Promise<void>) =>
      waitForPromise(promise, this._timeoutDuration)));
  }

  /**
   * Returns all recorded network time measurements.
   */
  getNetworkTiming(): NetworkTiming {
    return this._networkTiming;
  }

  /**
   * Helper function for sending data
   * @param data a string of characters that will be sent from one end of the
   * [[TestCall]] to the other, specifically from [[TestCall._sender]] to
   * [[TestCall._recipient]].
   */
  send(data: string): void {
    this._sendDataChannel.send(data);
  }

  /**
   * Bind the ice candidate handler to the peer connection.
   * @param peerConnectionFrom The peer connection to bind the ice candidate
   * handler to.
   * @param peerConnectionTo The peer connection to forward the ice candidate
   * to.
   */
  private _bindPeerConnectionIceCandidateHandler(
    peerConnectionFrom: RTCPeerConnection,
    peerConnectionTo: RTCPeerConnection,
  ): void {
    peerConnectionFrom.onicecandidate = (iceEvent: RTCPeerConnectionIceEvent) => {
      if (
        iceEvent.candidate &&
        iceEvent.candidate.candidate &&
        iceEvent.candidate.candidate.indexOf('relay') !== -1
      ) {
        this.emit(TestCall.Event.IceCandidate, peerConnectionFrom, iceEvent);
        peerConnectionTo.addIceCandidate(iceEvent.candidate);
      }
    };
  }

  /**
   * Bind time measuring event handlers.
   * @param peerConnection The peer connection to bind the time measuring
   * event handlers to.
   */
  private _bindPeerConnectionTimeHandlers(peerConnection: RTCPeerConnection): void {
    peerConnection.onconnectionstatechange = (): void => {
      this._networkTiming.peerConnection =
        this._networkTiming.peerConnection || { start: 0 };
      switch (peerConnection.connectionState) {
        case 'connecting':
          this._networkTiming.peerConnection.start = Date.now();
          break;
        case 'connected':
          this._networkTiming.peerConnection.end = Date.now();
          this._networkTiming.peerConnection.duration =
            this._networkTiming.peerConnection.end -
            this._networkTiming.peerConnection.start;
          break;
      }
    };

    peerConnection.oniceconnectionstatechange = (): void => {
      this._networkTiming.ice = this._networkTiming.ice || { start: 0 };
      switch (peerConnection.iceConnectionState) {
        case 'checking':
          this._networkTiming.ice.start = Date.now();
          break;
        case 'connected':
          this._networkTiming.ice.end = Date.now();
          this._networkTiming.ice.duration =
            this._networkTiming.ice.end - this._networkTiming.ice.start;
          break;
      }
    };
  }
}

export namespace TestCall {
  /**
   * Events that the [[TestCall]] helper class may emit as the `PeerConnection`s
   * communicate with each other.
   */
  export enum Event {
    Close = 'close',
    IceCandidate = 'iceCandidate',
    Message = 'message',
    Open = 'open',
  }
  /**
   * Options for the [[TestCall]] class.
   */
  export interface Config {
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
  export enum CallId {
    Recipient = 'recipient',
    Sender = 'sender',
  }
}
