// tslint:disable no-empty max-classes-per-file

export const mockAudioElementFactory = (
  options: MockAudioElement.Options = {},
) =>
  options.supportSetSinkId
    ? class {
        loop = false;
        pause() {}
        async play() {}
        setAttribute() {}
        async setSinkId() {}
      }
    : class {
        loop = false;
        pause() {}
        async play() {}
        setAttribute() {}
      };

export namespace MockAudioElement {
  export interface Options {
    supportSetSinkId?: boolean;
  }
}
