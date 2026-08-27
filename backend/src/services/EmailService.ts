import nodemailer from 'nodemailer';
import { config } from '../config/env';

export class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        if (config.smtpUser && config.smtpPass) {
            this.transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpSecure,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
            });
        }
    }

    /**
     * Sends a 6-digit OTP email verification code to the user.
     * In development or when SMTP credentials are not configured, prints the OTP clearly to the terminal.
     */
    async sendVerificationOtp(email: string, otp: string, name: string): Promise<boolean> {
        const isSmtpConfigured = !!(config.smtpUser && config.smtpPass);

        if (!isSmtpConfigured || !this.transporter) {
            console.log('\n┌──────────────────────────────────────────────────────────────────┐');
            console.log(`│ 📧 [DEV EMAIL CONSOLE] Verification Code for ${email.padEnd(31)}│`);
            console.log(`│ 🔑 CODE: [ ${otp.split('').join(' ')} ] (Valid for 15 minutes)            │`);
            console.log('└──────────────────────────────────────────────────────────────────┘\n');
            return true;
        }

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-width: 100%; background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background-color: #ffffff;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: linear-gradient(135deg, #d97706, #f59e0b); color: #ffffff; font-size: 24px; font-weight: bold; margin-bottom: 16px;">
                QR
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #111827;">Verify Your Email</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">Welcome to QR Menu SaaS, ${name}!</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #374151;">
                Use the following 6-digit verification code to confirm your email address and activate your restaurant profile:
              </p>
              <!-- OTP Box -->
              <div style="background-color: #fffbeb; border: 1.5px dashed #f59e0b; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #b45309;">
                  ${otp}
                </span>
              </div>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                This code will expire in <strong>15 minutes</strong>. If you did not sign up for this account, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} QR Menu SaaS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        try {
            await this.transporter.sendMail({
                from: `"QR Menu" <${config.smtpFrom}>`,
                to: email,
                subject: `${otp} is your QR Menu verification code`,
                text: `Hello ${name},\n\nYour QR Menu verification code is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you did not create a QR Menu account, please ignore this email.\n\n— The QR Menu Team`,
                html,
                headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'Importance': 'high',
                },
            });
            return true;
        } catch (error) {
            console.error('Failed to send verification email via SMTP:', error);
            // In case SMTP delivery fails, log the OTP to the console so user testing is not blocked
            console.log(`[FALLBACK DEV OTP] Code for ${email}: ${otp}`);
            return false;
        }
    }
}

export const emailService = new EmailService();
