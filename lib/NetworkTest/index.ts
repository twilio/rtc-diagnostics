import { EventEmitter } from 'events';
import { RTCCall } from './RTCCall';

export interface NetworkTestOptions {
  iceServers: RTCIceServer[];
  protocol?: 'tcp' | 'udp';
  region: string;
  serverType?: 'stun' | 'turn';
}

/**
 * This function assumes that you are passing an array of valid Twilio ICE
 * servers to it.
 * @param iceServers
 * @param protocol
 */
const filterIceServerUrls = (
  iceServers: NetworkTestOptions['iceServers'],
  protocol?: 'tcp' | 'udp',
  serverType?: 'stun' | 'turn',
): NetworkTestOptions['iceServers'] => iceServers.reduce((
  reduction: NetworkTestOptions['iceServers'],
  iceServer: RTCIceServer,
) => {
  const urls = Array.isArray(iceServer.urls)
    ? iceServer.urls
    : [iceServer.urls];
  return urls.every(url =>
      (!serverType || url.startsWith(serverType)) &&
      (!protocol || url.endsWith(protocol)),
    )
      ? [...reduction, iceServer]
      : reduction;
}, []);

/**
 * Network test class that parses input options and creates an [[RTCCall]] with
 * those options. This test can be used to test connectivity to any set of
 * given ICE servers, and is optionally able to filter those servers by
 * TCP or UDP protocol, and by STUN or TURN.
 *
 * This class also summarizes the events of the [[RTCCall]] it uses internally
 * and emits them.
 */
class NetworkTest extends EventEmitter {
  static defaultOptions = {
    iceServers: [],
    region: 'gll',
    serverType: 'stun' as const,
  };

  options: NetworkTestOptions;

  private _peerConnectionConfig: RTCConfiguration;
  private _rtcCall: RTCCall;

  constructor(options?: Partial<NetworkTestOptions>) {
    super();

    this.options = { ...NetworkTest.defaultOptions, ...(options || {}) };

    this._peerConnectionConfig = {
      iceServers: filterIceServerUrls(
        this.options.iceServers,
        this.options.protocol,
        this.options.serverType,
      ),
      iceTransportPolicy: this.options.serverType === 'turn' ? 'relay' : 'all',
    };

    this._rtcCall = new RTCCall({ peerConnectionConfig: this._peerConnectionConfig });
    this._rtcCall.on
  }
}

export const testNetwork = async (options?: Partial<NetworkTestOptions>) => {
  const networkTest = new NetworkTest(options);
  return networkTest;
};
