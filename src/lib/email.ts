/**
 * Email Service Utility
 *
 * Handles sending emails for scheduled exports and notifications.
 * Uses Resend (resend.com) for email delivery.
 *
 * Setup:
 * 1. Create account at resend.com
 * 2. Verify your domain (reports.cryptoreportkit.com)
 * 3. Get API key and set RESEND_API_KEY in environment
 * 4. Install package: npm install resend
 *
 * Usage:
 *   const result = await sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Your Report',
 *     text: 'Your report is attached.',
 *     attachments: [{ filename: 'report.xlsx', content: buffer }],
 *   });
 */

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Default from address
const FROM_EMAIL = process.env.EMAIL_FROM || 'reports@cryptoreportkit.com';

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Send an email
 *
 * @param options Email options (to, subject, text/html, attachments)
 * @returns Result with success status and message ID
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, text, html, attachments, replyTo } = options;

  // Check if email is configured
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Service not configured - RESEND_API_KEY missing');
    console.log(`[Email] Would send to: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[Email] Subject: ${subject}`);

    // Return success in dev to not break flows, but log that email wasn't sent
    if (process.env.NODE_ENV === 'development') {
      return { success: true, messageId: 'dev-no-send' };
    }

    return {
      success: false,
      error: 'Email service not configured. Set RESEND_API_KEY environment variable.',
    };
  }

  try {
    // Dynamic import to avoid errors if resend isn't installed
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Prepare attachments for Resend format
    const resendAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content),
    }));

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      text: text || '',
      html: html || undefined,
      attachments: resendAttachments,
      replyTo: replyTo || undefined,
    });

    if (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent successfully: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email] Send error:', errorMessage);

    // Check if it's a missing module error
    if (errorMessage.includes('Cannot find module') || errorMessage.includes('resend')) {
      return {
        success: false,
        error: 'Resend package not installed. Run: npm install resend',
      };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send a scheduled export email with the report attached
 */
export async function sendScheduledExportEmail(options: {
  to: string;
  exportName: string;
  buffer: Buffer;
  filename: string;
}): Promise<SendEmailResult> {
  const { to, exportName, buffer, filename } = options;

  return sendEmail({
    to,
    subject: `CryptoReportKit Report: ${exportName}`,
    text: `Your scheduled CryptoReportKit report "${exportName}" is attached.

This report was generated automatically based on your schedule settings.

Manage your scheduled exports:
https://cryptoreportkit.com/account/schedules

---
CryptoReportKit - Professional Crypto Reporting
https://cryptoreportkit.com`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">CryptoReportKit</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Your Report is Ready</h2>
      <p>Your scheduled report <strong>"${exportName}"</strong> has been generated and is attached to this email.</p>
      <p>Open the Excel file and use the CRK Add-in to refresh with the latest data.</p>
      <a href="https://cryptoreportkit.com/account/schedules" class="button">Manage Schedules</a>
    </div>
    <div class="footer">
      <p>CryptoReportKit - Professional Crypto Reporting</p>
      <p><a href="https://cryptoreportkit.com">cryptoreportkit.com</a></p>
    </div>
  </div>
</body>
</html>`,
    attachments: [
      {
        filename,
        content: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  });
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(options: {
  to: string;
  name?: string;
}): Promise<SendEmailResult> {
  const { to, name } = options;
  const greeting = name ? `Hi ${name}` : 'Welcome';

  return sendEmail({
    to,
    subject: 'Welcome to CryptoReportKit',
    text: `${greeting}!

Thanks for signing up for CryptoReportKit.

Get started:
1. Download a report pack from the Builder
2. Install the CRK Excel Add-in
3. Connect your API keys for unlimited data

Need help? Reply to this email or visit our FAQ.

Best,
The CryptoReportKit Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
    .step { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #10b981; }
    .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Welcome to CryptoReportKit</h1>
    </div>
    <div class="content">
      <p>${greeting}!</p>
      <p>Thanks for signing up. Here's how to get started:</p>

      <div class="step">
        <strong>1. Build a Report</strong>
        <p style="margin: 5px 0 0 0;">Use the Report Builder to create your custom crypto report pack.</p>
      </div>

      <div class="step">
        <strong>2. Install the Add-in</strong>
        <p style="margin: 5px 0 0 0;">Download and install the CRK Excel Add-in for live data refresh.</p>
      </div>

      <div class="step">
        <strong>3. Connect API Keys</strong>
        <p style="margin: 5px 0 0 0;">Add your own CoinGecko API key for unlimited data access.</p>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="https://cryptoreportkit.com/builder" class="button">Get Started</a>
      </div>
    </div>
    <div class="footer">
      <p>CryptoReportKit - Professional Crypto Reporting</p>
      <p><a href="https://cryptoreportkit.com">cryptoreportkit.com</a></p>
    </div>
  </div>
</body>
</html>`,
  });
}
