// tslint:disable no-empty

export class MockHTMLMediaElement {
  src: string | null = null;
  srcObject: MediaStream | null = null;
  load(): void {}
  pause(): void {}
  async play(): Promise<void> {}
}
