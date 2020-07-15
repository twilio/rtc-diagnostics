// Typescript doesn't yet support `setSinkId`, so we want to add it to the
// existing definition.
/**
 * @internalapi
 */
export interface AudioElement extends HTMLAudioElement {
  setSinkId?: (sinkId: string) => Promise<void>;
  sinkId?: string;
}

/**
 * @internalapi
 */
export interface TimeMeasurement {
  duration: number;
  end: number;
  start: number;
}

/**
 * Helper type that allows us to mark a subset of an interface's keys as
 * required.
 * @internalapi
 */
export type SubsetRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * @internalapi
 * Volume statistics to track in the audio device tests.
 */
export interface VolumeStats {
  /**
   * The maximum volume value recorded during the test.
   */
  max?: number;
  /**
   * The smallest non-zero volume value encountered.
   */
  min?: number;
  /**
   * The timestamps of the recorded values. For example, the 0th indexed
   * timestamp correlates to when the 0th indexed volume value was recorded.
   */
  timestamps: number[];
  /**
   * The recorded volume values encountered during the test.
   */
  values: number[];
}
