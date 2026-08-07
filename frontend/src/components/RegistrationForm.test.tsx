import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegistrationForm from './RegistrationForm';

describe('RegistrationForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockReset();
  });

  describe('rendering', () => {
    it('displays event details', () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      expect(
        screen.getByText("Mark Rhey Elejorde & Rochelle Ann Reyos's Baby Shower")
      ).toBeInTheDocument();
      expect(screen.getByText('September 26, 2025 at 3:00 PM')).toBeInTheDocument();
      expect(
        screen.getByText('Lot 2 Blk 209 Viscara Street, New Lower Bicutan, Taguig City')
      ).toBeInTheDocument();
    });

    it('renders name, email, and RSVP fields', () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('RSVP Status')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      expect(screen.getByRole('button', { name: 'Submit RSVP' })).toBeInTheDocument();
    });

    it('renders RSVP options', () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      const select = screen.getByLabelText('RSVP Status');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Attending')).toBeInTheDocument();
      expect(screen.getByText('Not Attending')).toBeInTheDocument();
      expect(screen.getByText('Undecided')).toBeInTheDocument();
    });
  });

  describe('validation - required fields', () => {
    it('shows error when name is empty', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when email is empty', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('Email is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error when RSVP status is not selected', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('RSVP status is required')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows all errors at once for multiple missing fields', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('RSVP status is required')).toBeInTheDocument();
    });
  });

  describe('validation - email format', () => {
    it('shows error for email without @', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalidemail' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('Email must contain exactly one "@" symbol')).toBeInTheDocument();
    });

    it('shows error for email with multiple @', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b@c.com' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('Email must contain exactly one "@" symbol')).toBeInTheDocument();
    });

    it('shows error for email without dot in domain', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@domain' } });
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('Email domain must contain at least one dot')).toBeInTheDocument();
    });
  });

  describe('validation - name length', () => {
    it('shows error for name exceeding 100 characters', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      const longName = 'a'.repeat(101);
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: longName } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@test.com' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));
      expect(await screen.findByText('Name must be at most 100 characters')).toBeInTheDocument();
    });
  });

  describe('preserving field values on validation error', () => {
    it('does not clear fields when validation fails', async () => {
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bademail' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));

      // Fields should retain their values
      expect(screen.getByLabelText('Name')).toHaveValue('Alice');
      expect(screen.getByLabelText('Email')).toHaveValue('bademail');
      expect(screen.getByLabelText('RSVP Status')).toHaveValue('Attending');
    });
  });

  describe('successful submission', () => {
    it('calls onSubmit with valid data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice Smith' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@example.com' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Alice Smith',
          email: 'alice@example.com',
          rsvpStatus: 'Attending',
        });
      });
    });

    it('trims name and email before submitting', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Bob  ' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  bob@test.com  ' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Undecided' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Bob',
          email: 'bob@test.com',
          rsvpStatus: 'Undecided',
        });
      });
    });
  });

  describe('loading state', () => {
    it('shows loading text and disables button during submission', async () => {
      let resolveSubmit: () => void;
      const slowSubmit = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(slowSubmit);

      render(<RegistrationForm onSubmit={mockOnSubmit} />);
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Alice' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'alice@test.com' } });
      fireEvent.change(screen.getByLabelText('RSVP Status'), { target: { value: 'Attending' } });
      fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
      });

      resolveSubmit!();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Submit RSVP' })).not.toBeDisabled();
      });
    });
  });
});
