import { EventEmitter } from 'events';
import { DiagnosticError } from '../errors';
import {
  connectionPolyfill as connection,
  NetworkInformation,
} from '../polyfills/connection';
import { RTCCall } from './RTCCall';

export declare interface NetworkTest {
  emit(event: NetworkTest.Events.End, report: NetworkTest.Report): boolean;
  emit(event: NetworkTest.Events.Error, error: DiagnosticError): boolean;

  on(event: NetworkTest.Events.End, listener: (report: NetworkTest.Report) => any): this;
  on(event: NetworkTest.Events.Error, listener: (error: DiagnosticError) => any): this;
}

/**
 * This function assumes that you are passing an array of valid Twilio ICE
 * servers to it.
 * @param iceServers
 * @param protocol
 */
export const filterIceServerUrls = (
  iceServers: NetworkTest.Options['iceServers'],
  protocol?: 'tcp' | 'udp',
  serverType?: 'stun' | 'turn',
): NetworkTest.Options['iceServers'] => iceServers.reduce((
  reduction: NetworkTest.Options['iceServers'],
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
export class NetworkTest extends EventEmitter {
  static defaultOptions: NetworkTest.Options = {
    connection,
    iceServers: [],
    serverType: 'stun' as const,
    timeoutMs: 5000,
  };
  static testMessage = 'Ahoy, world!';
  static testName = 'network-connectivity' as const;

  private _endTime: number | null = null;
  private _errors: DiagnosticError[] = [];
  private _options: NetworkTest.Options;
  private _peerConnectionConfig: RTCConfiguration;
  private _rtcCall: RTCCall | null = null;
  private _startTime: number;

  constructor(options: Partial<NetworkTest.Options> = {}) {
    super();

    this._options = { ...NetworkTest.defaultOptions, ...options };

    this._startTime = Date.now();
    this._peerConnectionConfig = {
      iceServers: filterIceServerUrls(
        this._options.iceServers,
        this._options.protocol,
        this._options.serverType,
      ),
      iceTransportPolicy: this._options.serverType === 'turn'
        ? 'relay'
        : 'all',
    };

    this._startTest();
  }

  /**
   * Stop the `NetworkTest`. This performs cleanup on the [[RTCCall]] and
   * emits a report for the test.
   * @param didPass
   */
  stop(didPass: boolean) {
    if (this._rtcCall) {
      this._rtcCall.close();
    }

    const networkInformation = this._options.connection || {};

    this._endTime = Date.now();

    // We are unable to use the spread operator here on `networkInformation`,
    // the values will always be `undefined`.
    const report: NetworkTest.Report = {
      didPass,
      downlink: networkInformation.downlink,
      downlinkMax: networkInformation.downlinkMax,
      effectiveType: networkInformation.effectiveType,
      endTime: this._endTime,
      errors: this._errors,
      rtt: networkInformation.rtt,
      saveData: networkInformation.saveData,
      startTime: this._startTime,
      testName: NetworkTest.testName,
      type: networkInformation.type,
    };

    this.emit(NetworkTest.Events.End, report);
  }

  /**
   * Adds the error to the internal list of errors that have occured, which will
   * be included in the final test report.
   * @param error
   */
  private _onError(error: DiagnosticError) {
    this._errors.push(error);
    this.emit(NetworkTest.Events.Error, error);
  }

  /**
   * Starts the test by connecting the two [[RTCPeerConnection]] ends of the
   * [[RTCCall]] and then attempting to send a message from one end to the
   * other. If this process takes
   */
  private async _startTest() {
    try {
      this._rtcCall = new RTCCall({
        peerConnectionConfig: this._peerConnectionConfig,
        peerConnectionFactory: this._options.peerConnectionFactory,
      });

      // Set up a promise that resolves when we receive the correct message
      // on the receiving PeerConnection
      const receivedMessage = new Promise((resolve, reject) => {
        if (!this._rtcCall) {
          reject(new DiagnosticError(undefined, 'RTCCall is `null`.'));
          return;
        }
        this._rtcCall.on(RTCCall.Events.Message, message => {
          if (message.data === NetworkTest.testMessage) {
            resolve();
          }
        });
      });

      // Set up a promise that rejects after the timeout period.
      const timeout = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new DiagnosticError(
            undefined,
            'NetworkTest timeout, the PeerConnection did not receive the ' +
            'message.',
          ));
        }, this._options.timeoutMs);
      });

      // We race between two promises:
      // an async function that will resolve once we connect and we send and
      // receive a message,
      // and
      // the timeout promise signifying the test has timed out.

      // If an error occurs during the runtime of the async function, i.e.
      // while we are establishing a connection, sending a message, or waiting
      // for the message to be recieved, this rejection is forwarded to the
      // [[_onError]] handler of the NetworkTest.
      await Promise.race([
        (async () => {
          if (!this._rtcCall) {
            throw new DiagnosticError(undefined, 'RTCCall is `null`.');
          }
          await this._rtcCall.establishConnection();
          this._rtcCall.send(NetworkTest.testMessage);
          await receivedMessage;
        })(),
        timeout,
      ]);

      // If none of the Promises reject, then we successfully received the
      // `testMessage`.
      this.stop(true);
    } catch (error) {
      if (error instanceof DiagnosticError) {
        this._onError(error);
      } else if (
        typeof DOMException !== 'undefined' && error instanceof DOMException
      ) {
        // Could be thrown by the PeerConnections during the call
        // `rtcCall.establishConnection`.
        this._onError(new DiagnosticError(
          error,
          'A `DOMException` occurred.',
        ));
      }
      this.stop(false);
    }
  }
}

export namespace NetworkTest {
  /**
   * Possible options for the [[NetworkTest]].
   */
  export interface Options {
    /**
     * A `NetworkInformation` connection. Used for mocking.
     * @private
     */
    connection?: NetworkInformation;
    /**
     * A list of `RTCIceServer` credentials for the two `RTCPeerConnection`s to
     * use.
     */
    iceServers: RTCIceServer[];
    /**
     * A `PeerConnection` factory to be used, mainly for Mocking.
     * @private
     */
    peerConnectionFactory?: typeof RTCPeerConnection;
    /**
     * The protocol to use when connecting the `RTCPeerConnection`s.
     * Effectively, we just filter the `iceServers` parameter for URLs that fit
     * this protocol.
     */
    protocol?: 'tcp' | 'udp';
    /**
     * The ICE server type to use. If we use `turn`, we may also need `stun`.
     * Using `turn` forces `relay`.
     */
    serverType?: 'stun' | 'turn';
    /**
     * Timeout in milliseconds. This causes a [[DiagnosticError]] if the test is
     * unable to connect and send and receive a message within this timeout.
     */
    timeoutMs: number;
  }
  /**
   * Events that the [[NetworkTest]] will emit.
   * @event
   */
  export enum Events {
    /**
     * The event that is fired at the end of the test, successful or not.
     * The listener is called with parameter [[NetworkTest.Report]].
     * @event
     */
    End = 'end',
    /**
     * The event that is fired when the test encounters an error, fatal or not.
     * The listener is called with parameter [[DiagnosticError]].
     * @event
     */
    Error = 'error',
  }
  /**
   * A test report that is emitted with the [[NetworkTest.End]] event.
   */
  export interface Report {
    /**
     * Whether or not the [[NetworkTest]] has passed.
     */
    didPass: boolean;
    /**
     * NetworkInformation downlink
     */
    downlink?: number;
    /**
     * NetworkInformation downlinkMax
     */
    downlinkMax?: number;
    /**
     * NetworkInformation effectiveType
     */
    effectiveType?: string;
    /**
     * The timestamp when the [[NetworkTest]] ended.
     */
    endTime: number;
    /**
     * Any error that occured during the run-time of the test.
     */
    errors: DiagnosticError[];
    /**
     * NetworkInformation rtt
     */
    rtt?: number;
    /**
     * NetworkInformation saveData
     */
    saveData?: boolean;
    /**
     * When the [[NetworkTest]] starts, set on construction.
     */
    startTime: number;
    /**
     * The name of the [[NetworkTest]].
     */
    testName: typeof NetworkTest.testName;
    /**
     * NetworkInformation type
     */
    type?: string;
  }
}

/**
 * Helper function that instanciates a [[NetworkTest]] and returns a promise
 * that resolves when the [[NetworkTest]] ends, and rejects if it errors.
 * @param options the options to pass to the [[NetworkTest]].
 */
export const testNetwork = (
  options?: Partial<NetworkTest.Options>,
): Promise<NetworkTest.Report> => {
  return new Promise((resolve, reject) => {
    const networkTest = new NetworkTest(options);
    networkTest.on(NetworkTest.Events.Error, error => reject(error));
    networkTest.on(NetworkTest.Events.End, report => resolve(report));
  });
};
