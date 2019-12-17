/**
 * @module RTCCall
 * @internalapi
 */

import { EventEmitter } from 'events';

export enum CallId {
  Recipient = 'recipient',
  Sender = 'sender',
}

export enum RTCCallEvents {
  Close = 'close',
  IceCandidate = 'iceCandidate',
  Message = 'message',
  Open = 'open',
}

export interface RTCCallOptions {
  peerConnectionConfig: RTCConfiguration;
}

export class RTCCall extends EventEmitter {
  private _recipient: RTCPeerConnection;
  private _sendDataChannel: RTCDataChannel;
  private _sender: RTCPeerConnection;

  constructor(options: RTCCallOptions) {
    super();

    this._sender = new RTCPeerConnection(options.peerConnectionConfig);
    this._recipient = new RTCPeerConnection(options.peerConnectionConfig);

    this._recipient.ondatachannel = ({ channel: receiveChannel }) => {
      receiveChannel.onmessage = message => {
        this.emit(RTCCallEvents.Message, message);
      };
      receiveChannel.onopen = e => {
        this.emit(RTCCallEvents.Open, CallId.Recipient, e);
      };
      receiveChannel.onclose = e => {
        this.emit(RTCCallEvents.Close, CallId.Recipient, e);
      };
    };

    this._sendDataChannel = this._sender.createDataChannel('sendDataChannel');
    this._sendDataChannel.onopen = e => {
      this.emit(RTCCallEvents.Open, CallId.Sender, e);
    };
    this._sendDataChannel.onclose = e => {
      this.emit(RTCCallEvents.Close, CallId.Sender, e);
    }

    this._sender.onicecandidate = e => {
      this.emit(RTCCallEvents.IceCandidate, e);
      if (e.candidate) {
        this._recipient.addIceCandidate(e.candidate);
      }
    };

    this._recipient.onicecandidate = e => {
      this.emit(RTCCallEvents.IceCandidate, e);
      if (e.candidate) {
        this._sender.addIceCandidate(e.candidate);
      }
    };

    this._establishConnection();
  }

  close() {
    if (this._sender) {
      this._sender.close();
    }
    if (this._recipient) {
      this._recipient.close();
    }
  }

  send(data: string) {
    this._sendDataChannel.send(data);
  }

  private async _establishConnection() {
    const senderDesc = await this._sender.createOffer();
    await this._sender.setLocalDescription(senderDesc);
    await this._recipient.setRemoteDescription(senderDesc);

    const recipientDesc = await this._recipient.createAnswer();
    await this._recipient.setLocalDescription(recipientDesc);
    await this._sender.setRemoteDescription(recipientDesc);
  }
}
