import { EventEmitter } from 'events';

export declare interface RTCCall {
  emit(event: RTCCall.Events.Close, id: RTCCall.CallId, ev: Event): boolean;
  emit(event: RTCCall.Events.IceCandidate, e: RTCPeerConnectionIceEvent): boolean;
  emit(event: RTCCall.Events.Message, message: MessageEvent): boolean;
  emit(event: RTCCall.Events.Open, id: RTCCall.CallId, ev: Event): boolean;

  on(event: RTCCall.Events.Close, listener: (id: RTCCall.CallId) => any): this;
  on(event: RTCCall.Events.IceCandidate, listener: (e: RTCPeerConnectionIceEvent) => any): this;
  on(event: RTCCall.Events.Message, listener: (message: MessageEvent) => any): this;
  on(event: RTCCall.Events.Open, listener: (id: RTCCall.CallId) => any): this;
}

/**
 * Creates two PeerConnections that attempt to connect to each other through
 * any ICE servers given by the parameter
 * [[RTCCall.Options.peerConnectionConfig]].
 */
export class RTCCall extends EventEmitter {
  private _recipient: RTCPeerConnection;
  private _sendDataChannel: RTCDataChannel;
  private _sender: RTCPeerConnection;

  /**
   * Constructor for the [[RTCCall]] helper class. Creates the two
   * `RTCPeerConnection`s and maintains their connection to each other.
   * Provides a `send` helper function to send data from the `sender` to the
   * `receiver`.
   */
  constructor(options: RTCCall.Options) {
    super();

    const peerConnectionFactory =
      options.peerConnectionFactory || RTCPeerConnection;

    this._sender = new peerConnectionFactory(options.peerConnectionConfig);
    this._recipient = new peerConnectionFactory(options.peerConnectionConfig);

    // Set up data channels and listeners on the recipient and the sender.
    this._recipient.ondatachannel = ({ channel: receiveChannel }) => {
      receiveChannel.onmessage = message => {
        this.emit(RTCCall.Events.Message, message);
      };
      receiveChannel.onopen = e => {
        this.emit(RTCCall.Events.Open, RTCCall.CallId.Recipient, e);
      };
      receiveChannel.onclose = e => {
        this.emit(RTCCall.Events.Close, RTCCall.CallId.Recipient, e);
      };
    };

    this._sendDataChannel = this._sender.createDataChannel('sendDataChannel');
    this._sendDataChannel.onopen = e => {
      this.emit(RTCCall.Events.Open, RTCCall.CallId.Sender, e);
    };
    this._sendDataChannel.onclose = e => {
      this.emit(RTCCall.Events.Close, RTCCall.CallId.Sender, e);
    };

    // Forward ICE candidates
    this._sender.onicecandidate = e => {
      this.emit(RTCCall.Events.IceCandidate, e);
      if (e.candidate) {
        this._recipient.addIceCandidate(e.candidate);
      }
    };
    this._recipient.onicecandidate = e => {
      this.emit(RTCCall.Events.IceCandidate, e);
      if (e.candidate) {
        this._sender.addIceCandidate(e.candidate);
      }
    };
  }

  /**
   * Close the `sender` and `recipient` PCs.
   */
  close() {
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
  async establishConnection() {
    // Set up a promise that resolves when the data channel of both
    // PCs is open.
    const connected = Promise.all([
      new Promise(receiveResolve => {
        this.on(RTCCall.Events.Open, id => {
          if (id === RTCCall.CallId.Recipient) {
            receiveResolve();
          }
        });
      }),
      new Promise(sendResolve => {
        this.on(RTCCall.Events.Open, id => {
          if (id === RTCCall.CallId.Sender) {
            sendResolve();
          }
        });
      }),
    ]);

    // Create the offer on the sender
    const senderDesc = await this._sender.createOffer();
    await Promise.all([
      // Set this description for the local and remote legs
      this._sender.setLocalDescription(senderDesc),
      this._recipient.setRemoteDescription(senderDesc),
    ]);

    // Create the answer from the recipient
    const recipientDesc = await this._recipient.createAnswer();
    await Promise.all([
      // Set this description for the local and remote legs
      this._recipient.setLocalDescription(recipientDesc),
      this._sender.setRemoteDescription(recipientDesc),
    ]);

    // Once the offer and answer are set, the connection should start and
    // eventually be established between the two PCs
    // We can wait for the data channel to open on both sides to be sure
    await connected;
  }

  /**
   * Helper function for sending data
   * @param data
   */
  send(data: string) {
    this._sendDataChannel.send(data);
  }
}

export namespace RTCCall {
  /**
   * Events that the [[RTCCall]] helper class may emit as the `PeerConnection`s
   * communicate with each other.
   */
  export enum Events {
    /**
     * Fired when the PCs are closed.
     * @event
     */
    Close = 'close',
    /**
     * Fired when the PCs forward an ICE candidate to each other.
     * @event
     */
    IceCandidate = 'iceCandidate',
    /**
     * Fired when a message is received by the `recipient` PC.
     * @event
     */
    Message = 'message',
    /**
     * Fired when the data channel is opened.
     * @event
     */
    Open = 'open',
  }
  /**
   * Options for the [[RTCCall]] class.
   */
  export interface Options {
    /**
     * Configurations to pass to the `PeerConnection` class.
     */
    peerConnectionConfig: RTCConfiguration;
    /**
     * Used to mock the peer connection.
     * @private
     */
    peerConnectionFactory?: typeof RTCPeerConnection;
  }
  /**
   * Used in conjunction with the events fired from this class to determine
   * which leg of the call is connected.
   * For example, the [[RTCCall.Events.Open]] event fires with the information
   * `Recipient` or `Sender` signifying which side of the data channel was just
   * opened.
   */
  export enum CallId {
    Recipient = 'recipient',
    Sender = 'sender',
  }
}
