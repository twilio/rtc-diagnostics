/**
 * @internalapi
 * Helper type that defines the type of the options we expect.
 */
export declare type InputOptions = Record<string, any>;
/**
 * @internalapi
 * Helper type for what a [[ValidatorFunction]] should return;
 */
export declare type Validity = string | undefined;
/**
 * @internalapi
 * Helper type for validation. All validators should have this typing.
 * If the option is invalid, then the validator should return a string
 * describing why, otherwise return nothing or `undefined`.
 */
export declare type ValidatorFunction = (option: any) => Validity | Promise<Validity>;
/**
 * @internalapi
 * Helper type for validation. Defines the configuration that `validateOptions`
 * expects.
 */
export declare type ValidatorConfig<T extends InputOptions> = Partial<Record<keyof T, ValidatorFunction | ValidatorFunction[] | undefined>>;
/**
 * @internalapi
 * Helper type for validation. Defines the record that describes the invalidity
 * of options if they are found invalid.
 */
export declare type InvalidityRecord<T extends InputOptions> = Partial<Record<keyof T, string[]>>;
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
export declare function createAudioDeviceValidator(options?: AudioDeviceValidatorOptions): ValidatorFunction;
/**
 * @internalapi
 * Validate that an option is a valid device ID to pass to `getUserMedia` or
 * `setSinkId`.
 * @param option The option to check is a valid device ID to pass to
 * `getUserMedia` or `setSinkId`.
 * @returns If the option is not valid, return a string that describes why,
 * otherwise `undefined`.
 */
export declare function validateDeviceId(option: any): Validity;
/**
 * @internalapi
 * Validate that an option is a valid string.
 * @param option The option to check is a valid string.
 * @returns If the option is not valid, return a string that describes why it is
 * invalid, otherwise return `undefined`.
 */
export declare function validateString(option: any): Validity;
/**
 * @internalapi
 * Validate a time-based parameter, i.e. duration or interval.
 * @param option The duration of time to validate
 * @returns A possibly undefined string, if the time is valid it will return
 * undefined, otherwise an error message
 */
export declare function validateTime(option: any): Validity;
/**
 * @internalapi
 * Validate that an option is neither `undefined` nor `null`.
 * @param option The option to check exists.
 * @returns A possibly undefined string, if the option exists it will return
 * `undefined`, otherwise a string representing why the option is invalid
 */
export declare function validateExists(option: any): Validity;
/**
 * @internalapi
 * Validate input options to the [[InputTest]].
 * @param inputOptions The options to validate.
 * @param config A record of option names to either a single
 * [[ValidatorFunction]] or an array of [[ValidatorFunctions]].
 * @returns A Promise that resolves either with a [[InvalidityRecord]] describing
 * which options are invalid and why, or `undefined` if all options are vaild.
 */
export declare function validateOptions<T extends InputOptions>(inputOptions: T, config: ValidatorConfig<T>): Promise<InvalidityRecord<T> | undefined>;
export {};
