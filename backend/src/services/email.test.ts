import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock nodemailer
const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: mockSendMail,
    }),
  },
}));

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
    companions: 0,
    dietaryRestrictions: '',
    submittedAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockSendMail.mockClear();
  });

  it('should skip if approvalEmailSent is true', async () => {
    const guest = { ...mockGuest, approvalEmailSent: true };
    const result = await sendApprovalEmail(guest);
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should send email for pending guest', async () => {
    const result = await sendApprovalEmail(mockGuest);
    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'guest@example.com',
        subject: expect.stringContaining('Baby Shower'),
      })
    );
  });

  it('should return error if sendMail fails', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));
    const result = await sendApprovalEmail(mockGuest);
    expect(result.success).toBe(false);
    expect(result.error).toContain('SMTP connection failed');
  });
});
