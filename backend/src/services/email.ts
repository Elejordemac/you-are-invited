import nodemailer from 'nodemailer';
import { GuestRecord } from '../types';

export interface EmailResult {
  success: boolean;
  error?: string;
  skipped?: boolean;
}

/**
 * Gmail SMTP transporter using App Password.
 * 
 * Required env vars:
 *   GMAIL_USER - your Gmail address (e.g. greatglorious2@gmail.com)
 *   GMAIL_APP_PASSWORD - a Gmail App Password (NOT your regular password)
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM_ADDRESS = process.env.GMAIL_USER || 'greatglorious2@gmail.com';

/**
 * Sends an approval email to a guest notifying them that their registration
 * has been recognized and approved.
 *
 * Implements deduplication: if the guest's `approvalEmailSent` flag is true,
 * the email is skipped to ensure at most one approval email per guest.
 */
export async function sendApprovalEmail(guest: GuestRecord): Promise<EmailResult> {
  // Deduplication: do not send if email was already sent for this guest
  if (guest.approvalEmailSent) {
    return { success: true, skipped: true };
  }

  // Check if Gmail credentials are configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD env vars.');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  const subject = "Baby Shower - Your Registration Has Been Approved!";

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a1929; color: #e3f2fd; padding: 0; border-radius: 12px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1565c0, #0d47a1); padding: 24px 30px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 2px;">🍼 BABY SHOWER</h1>
        <p style="margin: 8px 0 0; color: #90caf9; font-size: 14px;">Mark Rhey Elejorde &amp; Rochelle Ann Reyos</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <p style="color: #e3f2fd; font-size: 16px; margin: 0 0 20px;">
          Dear <strong style="color: #42a5f5;">${escapeHtml(guest.name)}</strong>,
        </p>

        <!-- Approval badge -->
        <div style="background: rgba(66, 165, 245, 0.1); border: 1px solid rgba(66, 165, 245, 0.3); border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0; color: #4caf50; font-size: 18px; font-weight: 700;">✓ REGISTRATION APPROVED</p>
          <p style="margin: 8px 0 0; color: #b3e5fc; font-size: 14px;">Your RSVP has been recognized and confirmed!</p>
        </div>

        <!-- RSVP Details -->
        <h2 style="color: #42a5f5; font-size: 16px; letter-spacing: 1px; margin: 0 0 12px; text-transform: uppercase;">YOUR RSVP DETAILS</h2>
        <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #90caf9; font-size: 14px; width: 120px;">Name:</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">${escapeHtml(guest.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #90caf9; font-size: 14px;">RSVP Status:</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">${escapeHtml(guest.rsvpStatus)}</td>
          </tr>
        </table>

        <!-- Event Details -->
        <h2 style="color: #42a5f5; font-size: 16px; letter-spacing: 1px; margin: 0 0 12px; text-transform: uppercase;">EVENT DETAILS</h2>
        <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #90caf9; font-size: 14px; vertical-align: top;">📅 Date:</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">September 5, 2026 &bull; 3:00 PM</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #90caf9; font-size: 14px; vertical-align: top;">📍 Location:</td>
            <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">
              <a href="https://maps.app.goo.gl/wWNuKUMiy7fU1UqX6" style="color: #64b5f6; text-decoration: underline;">Lot 2 Blk 209 Viscara Street, New Lower Bicutan, Taguig City</a>
            </td>
          </tr>
        </table>

        <p style="color: #e3f2fd; font-size: 15px; margin: 0 0 10px;">
          We look forward to celebrating with you! 💙
        </p>
      </div>

      <!-- Footer -->
      <div style="background: rgba(21, 101, 192, 0.2); padding: 16px 30px; text-align: center; border-top: 1px solid rgba(66, 165, 245, 0.2);">
        <p style="margin: 0; color: #78909c; font-size: 12px;">
          This is an automated confirmation from the Baby Shower Guest Registration App.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Baby Shower" <${FROM_ADDRESS}>`,
      to: guest.email,
      subject,
      html,
    });

    console.log(`Approval email sent to ${guest.email}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send approval email:', error.message || error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Escapes HTML special characters to prevent XSS in email content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
