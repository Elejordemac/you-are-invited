import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegistrationPage from './RegistrationPage';

function fillAndSubmitForm() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice Smith' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
  fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
  fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
}

describe('RegistrationPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful new registration (201)', () => {
    it('displays confirmation message with RSVP status and pending approval', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Registration successful',
            guest: {
              id: '123',
              name: 'Alice Smith',
              email: 'alice@example.com',
              rsvpStatus: 'Attending',
              approvalStatus: 'Pending',
              submittedAt: '2025-01-01T00:00:00Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(
          screen.getByText(
            "Thank you! Your RSVP status is 'Attending' and your registration is pending approval."
          )
        ).toBeInTheDocument();
      });
    });

    it('hides the form after successful submission', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Registration successful',
            guest: {
              id: '123',
              name: 'Alice Smith',
              email: 'alice@example.com',
              rsvpStatus: 'Attending',
              approvalStatus: 'Pending',
              submittedAt: '2025-01-01T00:00:00Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Submit RSVP' })).not.toBeInTheDocument();
      });
    });
  });

  describe('successful update (200)', () => {
    it('displays RSVP updated message', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'RSVP updated',
            guest: {
              id: '123',
              name: 'Alice Smith',
              email: 'alice@example.com',
              rsvpStatus: 'Not Attending',
              approvalStatus: 'Pending',
              submittedAt: '2025-01-01T00:00:00Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(
          screen.getByText('Your RSVP has been updated successfully.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('validation error (400)', () => {
    it('displays field-specific errors from server', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [
              { field: 'email', message: 'Invalid email format' },
            ],
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('email: Invalid email format')).toBeInTheDocument();
      });
    });

    it('preserves form values on validation error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [{ field: 'email', message: 'Invalid email format' }],
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('email: Invalid email format')).toBeInTheDocument();
      });

      // Form should still be visible with values preserved
      expect(screen.getByLabelText('Name')).toHaveValue('Alice Smith');
      expect(screen.getByLabelText('Email')).toHaveValue('alice@example.com');
      expect(screen.getByLabelText('RSVP Status')).toHaveValue('Attending');
    });
  });

  describe('server error (500/503)', () => {
    it('displays generic error message on 500', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ error: 'Could not save data' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(
          screen.getByText('Unable to save your registration. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('displays generic error message on 503', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ error: 'Service temporarily unavailable' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(
          screen.getByText('Unable to save your registration. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('preserves form values on server error', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({ error: 'Could not save data' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(
          screen.getByText('Unable to save your registration. Please try again.')
        ).toBeInTheDocument();
      });

      // Form should still be visible with values preserved
      expect(screen.getByLabelText('Name')).toHaveValue('Alice Smith');
      expect(screen.getByLabelText('Email')).toHaveValue('alice@example.com');
      expect(screen.getByLabelText('RSVP Status')).toHaveValue('Attending');
    });
  });

  describe('network error', () => {
    it('displays error message on network failure', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(
          screen.getByText('Unable to save your registration. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('preserves form values on network failure', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(
          screen.getByText('Unable to save your registration. Please try again.')
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Name')).toHaveValue('Alice Smith');
      expect(screen.getByLabelText('Email')).toHaveValue('alice@example.com');
      expect(screen.getByLabelText('RSVP Status')).toHaveValue('Attending');
    });
  });

  describe('API call verification', () => {
    it('calls POST /api/guests with correct payload', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Registration successful',
            guest: {
              id: '123',
              name: 'Alice Smith',
              email: 'alice@example.com',
              rsvpStatus: 'Attending',
              approvalStatus: 'Pending',
              submittedAt: '2025-01-01T00:00:00Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        )
      );

      render(<RegistrationPage />);
      fillAndSubmitForm();

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/guests'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Alice Smith',
              email: 'alice@example.com',
              rsvpStatus: 'Attending',
            }),
          })
        );
      });
    });
  });
});
