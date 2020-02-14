import {
  DiagnosticError,
  InvalidOptionError,
} from '../errors';
import {
  enumerateDevices,
  EnumerateDevicesUnsupportedError,
} from '../polyfills';

/**
 * Helper type for audio device validation.
 */
interface AudioDeviceValidatorOptions {
  enumerateDevices?: typeof navigator.mediaDevices.enumerateDevices;
  kind?: MediaDeviceKind;
}

/**
 * Return a function that validates an audio device by ID. It will returns a
 * `string` representing why the ID is invalid, or nothing if it is valid. Will
 * throw if `enumerateDevices` is not supported by the system.
 * @param options Options to pass to the validator. A mock `enumerateDevices`
 * may be passed here, as well as a `kind` may be passed here if there is a
 * desire to check the `kind` of audio device.
 * @returns A function that takes a `string` representing the audio device ID to
 * be validated and returns a Promise resolving a `string` representing the
 * invalid message or `undefined` if the audio device is valid.
 */
export function createAudioDeviceValidator(
  options: AudioDeviceValidatorOptions = {},
): Validator {
  const opts: AudioDeviceValidatorOptions = { enumerateDevices, ...options };

  /**
   * The audio device validator that will be returned.
   * @param deviceId The device ID to be validated.
   * @returns A Promise that resolves with a `string` representing why the
   * device ID is invalid, or `undefined` if it is valid.
   */
  return async (deviceId: string | undefined): Promise<string | undefined> => {
    const devices: MediaDeviceInfo[] | undefined =
      opts.enumerateDevices && await opts.enumerateDevices();

    if (!devices) {
      throw EnumerateDevicesUnsupportedError;
    }

    if (!devices.length) {
      return 'No audio devices available.';
    }

    // `deviceId` as `undefined` is a valid value as this will cause
    // `getUserMedia` to just get the default device
    if (deviceId === undefined) {
      deviceId = 'default';
    }

    let device: MediaDeviceInfo | undefined;
    for (const currentDevice of devices) {
      if (currentDevice.deviceId === deviceId) {
        device = currentDevice;
      }
    }

    if (!device) {
      return `Device ID "${deviceId}" not found within list of available devices.`;
    }

    if (opts.kind && device.kind !== opts.kind) {
      return `Device ID "${device.deviceId}" is not the correct "kind",`
        + ` is "${device.kind}" but expected "${opts.kind}".`;
    }
  };
}

/**
 * Validate a time-based parameter, i.e. duration or poll interval.
 * @param time the duration of time to validate
 * @returns a possibly undefined string, if the time is valid it will return
 * undefined, otherwise an error message
 */
export function validateTime(time: number): string | undefined {
  if (time < 0) {
    return 'Time must always be non-negative.';
  }
}

/**
 * Helper types for the validation process.
 */
type Validator = (option: any) =>
  (string | undefined) | // A non-async validator
  Promise<string | undefined>; // A async validator
export type ValidityRecord<T> = Partial<Record<keyof T, InvalidOptionError>>;

/**
 * Validate input options to the [[InputTest]]. TODO
 * @param validators TODO
 * @returns A Promise that resolves TODO
 */
export async function validateOptions<T extends Record<string, any>>(
  inputOptions: T,
  validators: Partial<Record<keyof T, Validator>>,
): Promise<ValidityRecord<T> | undefined> {
  // Create a validity record to return once all the validators finish running.
  const validity: ValidityRecord<T> = {};

  // Each validator could be an async function, but they can be run in parallel.
  // As they finish, fill the validity record.
  await Promise.all(Object.entries(validators).map(
    ([option, validator]: [keyof T, Validator | undefined]): Promise<void> =>
      (async (): Promise<void> => {
        if (validator) {
          try {
            const invalidReason: string | undefined =
              await validator(inputOptions[option]);
            if (invalidReason) {
              validity[option] = new InvalidOptionError(
                option.toString(),
                invalidReason,
              );
            }
          } catch (error) {
            // Each validator might throw a DOMError or DOMException, or even
            // possibly a DiagnosticError.
            if (error instanceof DiagnosticError) {
              validity[option] = new InvalidOptionError(
                option.toString(),
                `A "DiagnosticError" occurred when trying to validate the option "${option}".`,
                error,
              );
            } else if (
              typeof DOMError !== 'undefined' && error instanceof DOMError
            ) {
              validity[option] = new InvalidOptionError(
                option.toString(),
                `A "DOMError" occurred when trying to validate the option "${option}".`,
                error,
              );
            } else if (
              typeof DOMException !== 'undefined' && error instanceof DOMException
            ) {
              validity[option] = new InvalidOptionError(
                option.toString(),
                `A "DOMException" occurred when trying to validate the option "${option}".`,
                error,
              );
            }
          }
        }
      })(),
    ),
  );

  if (Object.keys(validity).length) {
    return validity;
  }
}
