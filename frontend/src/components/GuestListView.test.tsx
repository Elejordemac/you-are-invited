import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GuestListView, { Guest, GuestCounts } from './GuestListView';

const mockGuests: Guest[] = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    rsvpStatus: 'Attending',
    approvalStatus: 'Approved',
    submittedAt: '2025-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    rsvpStatus: 'Not Attending',
    approvalStatus: 'Pending',
    submittedAt: '2025-01-14T08:00:00Z',
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    rsvpStatus: 'Undecided',
    approvalStatus: 'Pending',
    submittedAt: '2025-01-13T15:45:00Z',
  },
];

const mockCounts: GuestCounts = {
  attending: 1,
  notAttending: 1,
  total: 3,
};

describe('GuestListView', () => {
  describe('rendering with guests', () => {
    it('displays the guest list title', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      expect(screen.getByText('Guest List')).toBeInTheDocument();
    });

    it('displays attendance counts in the summary', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      // Attending: 1, Not Attending: 1, Total: 3
      const countValues = screen.getAllByText('1');
      expect(countValues.length).toBe(2); // attending and not-attending both 1
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays count labels', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      const countsBar = screen.getByText(/Total:/).closest('div')!;
      expect(countsBar).toHaveTextContent('Attending:');
      expect(countsBar).toHaveTextContent('Not Attending:');
      expect(countsBar).toHaveTextContent('Total:');
    });

    it('displays table headers', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('RSVP Status')).toBeInTheDocument();
      expect(screen.getByText('Approval Status')).toBeInTheDocument();
      expect(screen.getByText('Registered At')).toBeInTheDocument();
    });

    it('displays guest names in the table', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Carol Davis')).toBeInTheDocument();
    });

    it('displays guest emails in the table', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      expect(screen.getByText('carol@example.com')).toBeInTheDocument();
    });

    it('displays RSVP status badges', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      // The badges in the table body (not the header counts)
      const attendingBadges = screen.getAllByText('Attending');
      expect(attendingBadges.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Not Attending', { selector: 'span' })).toBeInTheDocument();
      expect(screen.getByText('Undecided')).toBeInTheDocument();
    });

    it('displays approval status badges', () => {
      render(<GuestListView guests={mockGuests} counts={mockCounts} />);
      expect(screen.getByText('Approved')).toBeInTheDocument();
      const pendingBadges = screen.getAllByText('Pending');
      expect(pendingBadges).toHaveLength(2);
    });
  });

  describe('empty state', () => {
    it('displays empty state message when no guests', () => {
      const emptyCounts: GuestCounts = { attending: 0, notAttending: 0, total: 0 };
      render(<GuestListView guests={[]} counts={emptyCounts} />);
      expect(screen.getByText('No guests have registered yet.')).toBeInTheDocument();
    });

    it('shows counts at zero when no guests', () => {
      const emptyCounts: GuestCounts = { attending: 0, notAttending: 0, total: 0 };
      render(<GuestListView guests={[]} counts={emptyCounts} />);
      // All count values should be 0
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(3);
    });

    it('does not render the table when no guests', () => {
      const emptyCounts: GuestCounts = { attending: 0, notAttending: 0, total: 0 };
      render(<GuestListView guests={[]} counts={emptyCounts} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('sorting display', () => {
    it('renders guests in the order provided (caller responsible for sort)', () => {
      const sortedGuests: Guest[] = [
        {
          id: 'latest',
          name: 'Newest Guest',
          email: 'newest@example.com',
          rsvpStatus: 'Attending',
          approvalStatus: 'Pending',
          submittedAt: '2025-02-01T12:00:00Z',
        },
        {
          id: 'oldest',
          name: 'Oldest Guest',
          email: 'oldest@example.com',
          rsvpStatus: 'Not Attending',
          approvalStatus: 'Approved',
          submittedAt: '2025-01-01T12:00:00Z',
        },
      ];
      const counts: GuestCounts = { attending: 1, notAttending: 1, total: 2 };

      render(<GuestListView guests={sortedGuests} counts={counts} />);

      const rows = screen.getAllByRole('row');
      // First row is header, second is newest, third is oldest
      expect(rows[1]).toHaveTextContent('Newest Guest');
      expect(rows[2]).toHaveTextContent('Oldest Guest');
    });
  });
});
