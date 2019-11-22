import { Diagnostics } from './index';

declare global {
  interface Window {
    Twilio: Object & { Diagnostics?: any };
  }
}

window.Twilio = window.Twilio || {};
window.Twilio.Diagnostics = window.Twilio.Diagnostics || Diagnostics;
