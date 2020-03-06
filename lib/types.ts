// Typescript doesn't yet support `setSinkId`, so we want to add it to the
// existing definition.
/**
 * @internalapi
 */
export interface AudioElement extends HTMLAudioElement {
  setSinkId?: (sinkId: string) => Promise<void>;
}

/**
 * @internalapi
 */
export interface TimeMeasurement {
  duration: number;
  end: number;
  start: number;
}
