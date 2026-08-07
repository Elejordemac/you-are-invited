import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminPanel from './AdminPanel';

const mockGuests = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    rsvpStatus: 'Attending',
    approvalStatus: 'Approved',
    approvalEmailSent: true,
    submittedAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    rsvpStatus: 'Not Attending',
    approvalStatus: 'Pending',
    approvalEmailSent: false,
    submittedAt: '2024-01-16T12:00:00.000Z',
    updatedAt: '2024-01-16T12:00:00.000Z',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    rsvpStatus: 'Undecided',
    approvalStatus: 'Pending',
    approvalEmailSent: false,
    submittedAt: '2024-01-17T14:00:00.000Z',
    updatedAt: '2024-01-17T14:00:00.000Z',
  },
];

const mockCounts = { attending: 1, notAttending: 1, total: 3 };

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays loading state initially', () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves

    render(<AdminPanel token="test-token" />);

    expect(screen.getByText('Loading guest records...')).toBeInTheDocument();
  });

  it('fetches guests on mount with authorization header', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="my-jwt-token" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/guests'),
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer my-jwt-token' },
        })
      );
    });
  });

  it('displays guest records in a table after loading', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('displays counts summary', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    // Check for count labels with their values
    expect(screen.getByText('Attending:')).toBeInTheDocument();
    expect(screen.getByText('Not Attending:')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
  });

  it('shows Approve button only for Pending guests', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // Bob and Charlie are Pending — they should have Approve buttons
    expect(screen.getByLabelText('Approve Bob Jones')).toBeInTheDocument();
    expect(screen.getByLabelText('Approve Charlie Brown')).toBeInTheDocument();

    // Alice is Approved — no Approve button for her
    expect(screen.queryByLabelText('Approve Alice Smith')).not.toBeInTheDocument();
  });

  it('shows Edit and Delete buttons for all guests', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // All guests have Edit and Delete buttons
    expect(screen.getByLabelText('Edit Alice Smith')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Alice Smith')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Bob Jones')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Bob Jones')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Charlie Brown')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Charlie Brown')).toBeInTheDocument();
  });

  it('displays RSVP status badges with correct text', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Attending')).toBeInTheDocument();
    });

    expect(screen.getByText('Not Attending')).toBeInTheDocument();
    expect(screen.getByText('Undecided')).toBeInTheDocument();
  });

  it('displays approval status badges', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // One Approved, two Pending
    const approvedBadges = screen.getAllByText('Approved');
    const pendingBadges = screen.getAllByText('Pending');
    expect(approvedBadges).toHaveLength(1);
    expect(pendingBadges).toHaveLength(2);
  });

  it('displays error state when fetch fails', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Unable to connect to the server. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('displays error when server returns 401', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 })
    );

    render(<AdminPanel token="expired-token" />);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed. Please log in again.')).toBeInTheDocument();
    });
  });

  it('displays empty state when no guests', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: [], counts: { attending: 0, notAttending: 0, total: 0 } }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('No guest records found.')).toBeInTheDocument();
    });
  });

  it('displays table headers including all required columns', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 })
    );

    render(<AdminPanel token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('RSVP Status')).toBeInTheDocument();
    expect(screen.getByText('Approval Status')).toBeInTheDocument();
    expect(screen.getByText('Email Sent')).toBeInTheDocument();
    expect(screen.getByText('Registered At')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
