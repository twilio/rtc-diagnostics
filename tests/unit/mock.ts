// tslint:disable max-classes-per-file

/**
 * Mock browser only errors.
 */
(global as any).DOMError = class DOMErrorMock extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, DOMErrorMock.prototype);
  }
};
(global as any).DOMException = class DOMExceptionMock extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, DOMExceptionMock.prototype);
  }
};
