import {
  enumerateDevices,
  EnumerateDevicesUnsupportedError,
} from '../polyfills';

/**
 * @internalapi
 * Helper type that defines the type of the options we expect.
 */
export type InputOptions = Record<string, any>;

/**
 * @internalapi
 * Helper type for what a [[ValidatorFunction]] should return;
 */
export type Validity = string | undefined;

/**
 * @internalapi
 * Helper type for validation. All validators should have this typing.
 * If the option is invalid, then the validator should return a string
 * describing why, otherwise return nothing or `undefined`.
 */
export type ValidatorFunction = (option: any) => Validity | Promise<Validity>;

/**
 * @internalapi
 * Helper type for validation. Defines the configuration that `validateOptions`
 * expects.
 */
export type ValidatorConfig<T extends InputOptions> = Partial<Record<
  keyof T,
  ValidatorFunction | ValidatorFunction[] | undefined
>>;

/**
 * @internalapi
 * Helper type for validation. Defines the record that describes the invalidity
 * of options if they are found invalid.
 */
export type InvalidityRecord<T extends InputOptions> = Partial<Record<
  keyof T,
  string[]
>>;

/**
 * @internalapi
 * Helper type for audio device validation.
 */
interface AudioDeviceValidatorOptions {
  enumerateDevices?: typeof navigator.mediaDevices.enumerateDevices;
  kind?: MediaDeviceKind;
}

/**
 * @internalapi
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
): ValidatorFunction {
  const opts: AudioDeviceValidatorOptions = { enumerateDevices, ...options };

  /**
   * The audio device validator that will be returned.
   * @param deviceId The device ID to be validated.
   * @returns A Promise that resolves with a `string` representing why the
   * device ID is invalid, or `undefined` if it is valid.
   */
  return async (deviceId: string | undefined): Promise<Validity> => {
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
      if (opts.kind) {
        // If we get here, we just want to make sure there is at least one
        // media device with the correct kind.
        const matchingDevicesKind = devices.filter((device: MediaDeviceInfo) =>
          device.kind === opts.kind);

        if (!matchingDevicesKind.length) {
          return `No devices found with the correct kind "${opts.kind}".`;
        }
      }
      return;
    }

    const matchingDevicesId = devices.filter((device: MediaDeviceInfo) =>
      device.deviceId === deviceId);

    if (!matchingDevicesId.length) {
      return `Device ID "${deviceId}" not found within list of available devices.`;
    }

    if (opts.kind) {
      const matchingDevicesIdAndKind = matchingDevicesId.filter(
        (device: MediaDeviceInfo) => device.kind === opts.kind);
      if (!matchingDevicesIdAndKind.length) {
        return `Device ID "${deviceId}" is not the correct "kind",`
          + ` expected "${opts.kind}".`;
      }
    }
  };
}

/**
 * @internalapi
 * Validate that an option is a valid device ID to pass to `getUserMedia` or
 * `setSinkId`.
 * @param option The option to check is a valid device ID to pass to
 * `getUserMedia` or `setSinkId`.
 * @returns If the option is not valid, return a string that describes why,
 * otherwise `undefined`.
 */
export function validateDeviceId(option: any): Validity {
  if (!['undefined', 'string'].includes(typeof option)) {
    return 'If "deviceId" is defined, it must be a "string".';
  }
}

/**
 * @internalapi
 * Validate that an option is a valid string.
 * @param option The option to check is a valid string.
 * @returns If the option is not valid, return a string that describes why it is
 * invalid, otherwise return `undefined`.
 */
export function validateString(option: any): Validity {
  const type = typeof option;
  if (type !== 'string') {
    return `Option cannot have type "${type}", must be "string".`;
  }
}

/**
 * @internalapi
 * Validate a time-based parameter, i.e. duration or interval.
 * @param option The duration of time to validate
 * @returns A possibly undefined string, if the time is valid it will return
 * undefined, otherwise an error message
 */
export function validateTime(option: any): Validity {
  const doesNotExistMessage = validateExists(option);
  if (doesNotExistMessage) {
    return doesNotExistMessage;
  }

  if (typeof option !== 'number') {
    return 'Time must be a number.';
  }

  if (option < 0) {
    return 'Time must always be non-negative.';
  }
}

/**
 * @internalapi
 * Validate that an option is neither `undefined` nor `null`.
 * @param option The option to check exists.
 * @returns A possibly undefined string, if the option exists it will return
 * `undefined`, otherwise a string representing why the option is invalid
 */
export function validateExists(option: any): Validity {
  if (option === undefined || option === null) {
    return `Option cannot be "${String(option)}".`;
  }
}

/**
 * @internalapi
 * Validate that an option is a `boolean`.
 * @param option The option to check.
 * @returns A possibly undefined string, if the option is valid it will return
 * `undefined`, otherwise a string representing why the option is invalid
 */
export function validateBoolean(option: any): Validity {
  if (typeof option !== 'boolean') {
    return `Option must be "boolean".`;
  }
}

/**
 * @internalapi
 * Validate input options to the [[InputTest]].
 * @param inputOptions The options to validate.
 * @param config A record of option names to either a single
 * [[ValidatorFunction]] or an array of [[ValidatorFunctions]].
 * @returns A Promise that resolves either with a [[InvalidityRecord]] describing
 * which options are invalid and why, or `undefined` if all options are vaild.
 */
export async function validateOptions<T extends InputOptions>(
  inputOptions: T,
  config: ValidatorConfig<T>,
): Promise<InvalidityRecord<T> | undefined> {
  // Create a validity record to return once all the validators finish running.
  const validity: InvalidityRecord<T> = {};

  await Promise.all(Object.entries(config).map(async ([
    optionKey,
    validatorFunctions,
  ]: [
    keyof T,
    ValidatorFunction | ValidatorFunction[] | undefined,
  ]): Promise<void> => {
    if (!validatorFunctions) {
      return;
    }

    const optionValue = inputOptions[optionKey];

    const validators = Array.isArray(validatorFunctions)
      ? validatorFunctions
      : [validatorFunctions];

    await Promise.all(validators.map(
      async (validator: ValidatorFunction): Promise<void> => {
        const invalidReason = await validator(optionValue);
        if (invalidReason) {
          const invalidReasons: string[] | undefined = validity[optionKey];
          if (invalidReasons) {
            invalidReasons.push(invalidReason);
          } else {
            validity[optionKey] = [invalidReason];
          }
        }
      },
    ));
  }));

  if (Object.keys(validity).length) {
    return validity;
  }
}
