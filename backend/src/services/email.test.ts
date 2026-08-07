import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer before importing
vi.mock('nodemailer', () => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });
  return {
    default: {
      createTransport: () => ({ sendMail }),
    },
  };
});

// Set env vars before import
process.env.GMAIL_USER = 'test@gmail.com';
process.env.GMAIL_APP_PASSWORD = 'test-app-password';

import { sendApprovalEmail } from './email';
import { GuestRecord } from '../types';

describe('sendApprovalEmail', () => {
  const mockGuest: GuestRecord = {
    id: '123',
    name: 'Test Guest',
    email: 'guest@example.com',
    rsvpStatus: 'Attending',
    approvalStatus: 'Approved',
    approvalEmailSent: false,
    submittedAt: new Date(),
    updatedAt: new Date(),
  };

  it('should skip if approvalEmailSent is true', async () => {
    const guest = { ...mockGuest, approvalEmailSent: true };
    const result = await sendApprovalEmail(guest);
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
  });

  it('should send email for pending guest', async () => {
    const result = await sendApprovalEmail(mockGuest);
    expect(result.success).toBe(true);
  });
});
