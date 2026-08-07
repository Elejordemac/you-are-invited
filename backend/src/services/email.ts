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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1e88e5;">Baby Shower</h1>
      <p>Dear <strong>${escapeHtml(guest.name)}</strong>,</p>
      <p>
        Great news! Your registration for the Baby Shower has been recognized and approved.
      </p>
      <h2 style="color: #1565c0;">Your RSVP Details</h2>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(guest.name)}</li>
        <li><strong>RSVP Status:</strong> ${escapeHtml(guest.rsvpStatus)}</li>
      </ul>
      <h2 style="color: #1565c0;">Event Details</h2>
      <ul>
        <li><strong>Event:</strong> Mark Rhey Elejorde &amp; Rochelle Ann Reyos&#39;s Baby Shower</li>
        <li><strong>Date:</strong> September 26 at 3:00 PM</li>
        <li><strong>Location:</strong> Lot 2 Blk 209 Viscara Street, New Lower Bicutan, Taguig City</li>
      </ul>
      <p>
        We look forward to celebrating with you!
      </p>
      <hr style="border: none; border-top: 1px solid #bbdefb; margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">
        This is an automated confirmation email for the Baby Shower guest registration.
      </p>
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
