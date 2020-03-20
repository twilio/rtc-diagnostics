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
/**
 * Helper type that allows us to mark a subset of an interface's keys as
 * required.
 * @internalapi
 */
export declare type SubsetRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
