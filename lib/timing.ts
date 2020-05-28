/**
 * @internalapi
 * Timing measurements that provides operational milestones.
 */
export interface TimeMeasurement {
  /**
   * Number in milliseconds elapsed for this measurement.
   */
  duration?: number;

  /**
   * A millisecond timestamp that represents the end of a process.
   */
  end?: number;

  /**
   * A millisecond timestamp that represents the start of a process.
   */
  start: number;
}

/**
 * @internalapi
 * Represents network related time measurements.
 */
export interface NetworkTiming {
  /**
   * A millisecond timestamp for when the first packet was received by the remote RTCPeerConnection.
   * See [[BitrateTest]] for more information on how data packets are transmitted between RTCPeerConnections.
   */
  firstPacket?: number;

  /**
   * Measurements for establishing ICE connection.
   * This is measured from ICE connection `checking` to `connected` state.
   * See [RTCPeerConnection.iceConnectionState](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState) for more information.
   */
  ice?: TimeMeasurement;

  /**
   * Measurements for establishing a PeerConnection.
   * This is measured from PeerConnection `connecting` to `connected` state.
   * See [RTCPeerConnection.connectionState](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState) for more information.
   */
  peerConnection?: TimeMeasurement;
}
