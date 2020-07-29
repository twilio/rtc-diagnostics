import { UnsupportedError } from '../errors';
/**
 * @internalapi
 * Common error message for when `enumerateDevices` is not supported.
 */
export declare const enumerateDevicesUnsupportedMessage: string;
/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
export declare const EnumerateDevicesUnsupportedError: UnsupportedError;
/**
 * @internalapi
 * Provide a polyfill for `navigator.mediaDevices.enumerateDevices` so that we
 * will not encounter a fatal-error upon trying to use it.
 */
export declare const enumerateDevicesPolyfill: typeof navigator.mediaDevices.enumerateDevices | undefined;
/**
 * @internalapi
 * Firefox does not have a device ID that is "default". To get that device ID,
 * we need to enumerate all the devices and grab the first of each "kind".
 */
export declare function getDefaultDevices(devices: MediaDeviceInfo[]): Partial<Record<MediaDeviceKind, MediaDeviceInfo>>;
