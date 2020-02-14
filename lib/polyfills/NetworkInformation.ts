/**
 * These datatypes are defined by the spec found on this site:
 * https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 */
export type NetworkInformation = Readonly<Partial<{
  downlink: number;
  downlinkMax: number;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  rtt: number;
  saveData: boolean;
  type: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' |
    'other' | 'unknown';
}>>;

/**
 * Declare the member `connection` on the `window.navigator` global.
 */
interface PolyfillWindow extends Window {
  navigator: Navigator & { connection: NetworkInformation };
}
const polyfillWindow: PolyfillWindow | undefined =
  typeof window !== 'undefined'
    ? window as unknown as PolyfillWindow
    : undefined;

export const networkInformationPolyfill: NetworkInformation | undefined =
  typeof polyfillWindow !== 'undefined' && polyfillWindow.navigator &&
  polyfillWindow.navigator.connection
    ? polyfillWindow.navigator.connection
    : undefined;
