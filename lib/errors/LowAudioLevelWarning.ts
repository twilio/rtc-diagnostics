import { DiagnosticWarning } from './DiagnosticWarning';

/**
 * Low audio volume level warning.
 */
export class LowAudioLevelWarning extends DiagnosticWarning {
  /**
   * The type of this warning.
   */
  static type: string = 'low-audio-level';

  /**
   * Constructor for [[LowAudioLevelWarning]]. Sets the type and message.
   */
  constructor() {
    super(
      LowAudioLevelWarning.type,
      'Low volume values detected from the captured audio stream. ' +
      'This could indicate that your microphone is not working properly.',
    );
  }
}
