// tslint:disable no-empty

export class MockHTMLMediaElement {
  srcObject: MediaStream | null = null;
  pause(): void {}
  async play(): Promise<void> {}
}
