export const DOMException =
  typeof window !== 'undefined' && window.DOMException
    ? window.DOMException
    : class DOMExceptionPolyfill extends Error {
      constructor() {
        super();
        Object.setPrototypeOf(this, DOMExceptionPolyfill.prototype);
      }
    };
