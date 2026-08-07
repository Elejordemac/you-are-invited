import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GuestRecord } from '../types';

const mockSend = vi.hoisted(() => vi.fn());

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend };
    },
  };
});

import { sendApprovalEmail } from './email';

describe('EmailService', () => {
  const mockGuest: GuestRecord = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    rsvpStatus: 'Attending',
    approvalStatus: 'Approved',
    approvalEmailSent: false,
    submittedAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendApprovalEmail', () => {
    it('should send email with correct subject containing "Baby Shower"', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Baby Shower - Your Registration Has Been Approved!',
        })
      );
    });

    it('should send to the guest email address', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
        })
      );
    });

    it('should include guest name in the email body', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('John Doe');
    });

    it('should include RSVP status in the email body', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Attending');
    });

    it('should include "Baby Shower" in the email body', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Baby Shower');
    });

    it('should include event details in the email body', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('Mark Rhey Elejorde');
      expect(call.html).toContain('Rochelle Ann Reyos');
      expect(call.html).toContain('September 26 at 3:00 PM');
      expect(call.html).toContain('Lot 2 Blk 209 Viscara Street, New Lower Bicutan, Taguig City');
    });

    it('should include confirmation message about registration being approved', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('recognized and approved');
    });

    it('should return success: true when email sends successfully', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      const result = await sendApprovalEmail(mockGuest);

      expect(result).toEqual({ success: true });
    });

    it('should return success: false with error when email fails', async () => {
      mockSend.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await sendApprovalEmail(mockGuest);

      expect(result).toEqual({
        success: false,
        error: 'API rate limit exceeded',
      });
    });

    it('should handle non-Error thrown values gracefully', async () => {
      mockSend.mockRejectedValue({ statusCode: 500 });

      const result = await sendApprovalEmail(mockGuest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should escape HTML in guest name to prevent XSS', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      const xssGuest: GuestRecord = {
        ...mockGuest,
        name: '<script>alert("xss")</script>',
      };

      await sendApprovalEmail(xssGuest);

      const call = mockSend.mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('&lt;script&gt;');
    });

    it('should work with all RSVP status values', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      for (const status of ['Attending', 'Not Attending', 'Undecided'] as const) {
        mockSend.mockClear();
        const guest: GuestRecord = { ...mockGuest, rsvpStatus: status };

        const result = await sendApprovalEmail(guest);

        expect(result.success).toBe(true);
        const call = mockSend.mock.calls[0][0];
        expect(call.html).toContain(status);
      }
    });

    it('should use configured from address', async () => {
      mockSend.mockResolvedValue({ id: 'email-id-123' });

      await sendApprovalEmail(mockGuest);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.any(String),
        })
      );
    });

    describe('deduplication', () => {
      it('should skip sending if approvalEmailSent is true', async () => {
        const alreadySentGuest: GuestRecord = {
          ...mockGuest,
          approvalEmailSent: true,
        };

        const result = await sendApprovalEmail(alreadySentGuest);

        expect(mockSend).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true, skipped: true });
      });

      it('should send email if approvalEmailSent is false', async () => {
        mockSend.mockResolvedValue({ id: 'email-id-123' });

        const result = await sendApprovalEmail(mockGuest);

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(result.success).toBe(true);
        expect(result.skipped).toBeUndefined();
      });
    });
  });
});
