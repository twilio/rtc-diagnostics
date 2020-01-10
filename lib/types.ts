// Typescript doesn't yet support `setSinkId`, so we want to add it to the
// existing definition.
export interface AudioElement extends HTMLAudioElement {
  setSinkId?: (sinkId: string) => Promise<void>;
}
