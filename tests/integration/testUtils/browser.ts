export function isFirefox() {
  const navigator: Navigator | null = typeof window === 'undefined'
    ? null
    : window.navigator;

  return typeof navigator?.userAgent === 'string' &&
    /firefox|fxios/i.test(navigator.userAgent);
}
