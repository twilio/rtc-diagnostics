/**
 * @internalapi
 * These datatypes are defined by the spec found on this site:
 * https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
 */
export declare type NetworkInformation = Readonly<Partial<{
    downlink: number;
    downlinkMax: number;
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    rtt: number;
    saveData: boolean;
    type: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
}>>;
/**
 * @internalapi
 */
export declare const networkInformationPolyfill: NetworkInformation | undefined;
