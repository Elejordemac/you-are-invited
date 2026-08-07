import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import GuestListPage from './GuestListPage';

function createMockResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const mockGuestsResponse = {
  guests: [
    {
      id: '1',
      name: 'Alice',
      email: 'alice@example.com',
      rsvpStatus: 'Attending',
      approvalStatus: 'Approved',
      submittedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Bob',
      email: 'bob@example.com',
      rsvpStatus: 'Not Attending',
      approvalStatus: 'Pending',
      submittedAt: '2024-01-14T09:00:00Z',
    },
  ],
  counts: { attending: 1, notAttending: 1, total: 2 },
};

describe('GuestListPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading indicator on first load', () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves

    render(<GuestListPage />);

    expect(screen.getByText('Loading guest list...')).toBeInTheDocument();
  });

  it('renders guest list after successful fetch', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(createMockResponse(mockGuestsResponse));

    render(<GuestListPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows error message with retry button when fetch fails', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<GuestListPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to retrieve guest data. Please try again.')
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows error message when response is not ok', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      createMockResponse({ error: 'Service unavailable' }, 503)
    );

    render(<GuestListPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Unable to retrieve guest data. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('retries fetch when retry button is clicked', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<GuestListPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    // Now make the next fetch succeed
    mockFetch.mockResolvedValue(createMockResponse(mockGuestsResponse));

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });

  it('polls every 5 seconds and updates guest list', async () => {
    vi.useFakeTimers();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(createMockResponse(mockGuestsResponse));

    render(<GuestListPage />);

    // Flush microtasks for initial fetch
    await act(async () => {});

    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Update mock to return new data
    const updatedResponse = {
      guests: [
        ...mockGuestsResponse.guests,
        {
          id: '3',
          name: 'Charlie',
          email: 'charlie@example.com',
          rsvpStatus: 'Undecided',
          approvalStatus: 'Pending',
          submittedAt: '2024-01-16T11:00:00Z',
        },
      ],
      counts: { attending: 1, notAttending: 1, total: 3 },
    };
    mockFetch.mockResolvedValue(createMockResponse(updatedResponse));

    // Advance timer by 5 seconds to trigger poll
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('Charlie')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('does not show error on background poll failure when data is already loaded', async () => {
    vi.useFakeTimers();
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(createMockResponse(mockGuestsResponse));

    render(<GuestListPage />);

    // Flush microtasks for initial fetch
    await act(async () => {});

    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Simulate background poll failure
    mockFetch.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Should still show the existing data, not an error
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Unable to retrieve guest data. Please try again.')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
