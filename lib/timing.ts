/**
 * Timing measurements that provides operational milestones
 */
export interface TimeMeasurement {
  /**
   * Number milliseconds elapsed for this measurement
   */
  duration?: number;

  /**
   * A millisecond timestamp the represents the end of a process
   */
  end?: number;

  /**
   * A millisecond timestamp the represents the start of a process
   */
  start: number;
}

/**
 * Represents network related time measurements
 */
export interface NetworkTiming {

  /**
   * Measurements for DNS lookups
   */
  dnsLookup?: TimeMeasurement;

  /**
   * Millisecond timestamp for when a first packet was received
   */
  firstPacket?: number | undefined;

  /**
   * Measurements for establishing TLS connection
   */
  ice?: TimeMeasurement;

  /**
   * Measurements for establishing a connection
   */
  peerConnection?: TimeMeasurement;

  /**
   * Measurements for TLS handshake
   */
  tls?: TimeMeasurement;
}
