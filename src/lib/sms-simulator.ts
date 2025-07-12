/**
 * SMS simulation utilities
 */

export interface SmsMessage {
  to: string;
  message: string;
  timestamp: number;
}

export class SmsSimulator {
  private static messages: SmsMessage[] = [];

  static async sendMessage(phoneNumber: string, message: string): Promise<void> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Store message for simulation
    const smsMessage: SmsMessage = {
      to: phoneNumber,
      message,
      timestamp: Date.now()
    };

    this.messages.push(smsMessage);

    // Log for debugging
    console.log(`[SMS SIMULATION] Sent to ${phoneNumber}: ${message}`);
  }

  static isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format validation
    const e164Regex = /^\+?[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  static getMessages(): SmsMessage[] {
    return [...this.messages];
  }

  static clearMessages(): void {
    this.messages = [];
  }

  static formatNotificationMessage(title: string, pdfLink: string): string {
    return `📰 New article published: "${title}"\n\nRead the full article: ${pdfLink}\n\n- NewsFlash Team`;
  }
}