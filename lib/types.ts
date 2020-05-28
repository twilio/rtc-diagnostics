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
