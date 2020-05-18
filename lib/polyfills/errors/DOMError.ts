export const DOMError =
  typeof window !== 'undefined' && window.DOMError
    ? window.DOMError
    : class DOMErrorPolyfill extends Error {
        constructor() {
          super();
          Object.setPrototypeOf(this, DOMErrorPolyfill.prototype);
        }
      };
