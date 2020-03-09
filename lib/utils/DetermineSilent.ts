/**
 * @internalapi
 * Determine whether audio is silent or not by analyzing an array of volume values.
 * @param volumes An array of volume values to to analyze.
 * @returns Whether audio is silent or not.
 */
export function determineSilent(volumes: number[]): boolean {
  // TODO Come up with a better algorithm for deciding if the volume values
  // resulting in a success

  // Loops over every sample, checks to see if it was completely silent by
  // checking if the average of the amplitudes is 0, and returns whether or
  // not more than 50% of the samples were silent.
  return !(volumes && volumes.length > 3 &&
    (volumes.filter((v: number) => v > 0).length / volumes.length) > 0.5);
}
