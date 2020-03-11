import { UnsupportedError } from '../errors';

/**
 * @internalapi
 * Common error message for when `enumerateDevices` is not supported.
 */
export const enumerateDevicesUnsupportedMessage: string =
  'The function `enumerateDevices` is not supported.';

/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const EnumerateDevicesUnsupportedError: UnsupportedError =
  new UnsupportedError(enumerateDevicesUnsupportedMessage);

/**
 * @internalapi
 * Provide a polyfill for `navigator.mediaDevices.enumerateDevices` so that we
 * will not encounter a fatal-error upon trying to use it.
 */
export const enumerateDevicesPolyfill: typeof navigator.mediaDevices.enumerateDevices | undefined =
  typeof navigator !== 'undefined' &&
  navigator.mediaDevices &&
  navigator.mediaDevices.enumerateDevices
    ? navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices)
    : undefined;

/**
 * @internalapi
 * Firefox does not have a device ID that is "default". To get that device ID,
 * we need to enumerate all the devices and grab the first of each "kind".
 */
export async function getDefaultDevices(): Promise<Partial<Record<
  MediaDeviceKind,
  MediaDeviceInfo
>>> {
  const defaultDeviceIds: Partial<Record<
    MediaDeviceKind,
    MediaDeviceInfo
  >> = {};

  if (enumerateDevicesPolyfill) {
    for (const device of (await enumerateDevicesPolyfill()).reverse()) {
      defaultDeviceIds[device.kind] = device;
    }
  }

  return defaultDeviceIds;
}
