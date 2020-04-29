// tslint:disable no-empty

export const mockAudioElementFactory = (
  options: MockAudioElement.Options = {},
) => class {
  loop = false;
  setSinkId?: () => void;
  constructor() {
    if (options.supportSetSinkId) {
      this.setSinkId = () => {};
    }
  }
  pause() {}
  async play() {}
  setAttribute() {}
};

export namespace MockAudioElement {
  export interface Options {
    supportSetSinkId?: boolean;
  }
}
