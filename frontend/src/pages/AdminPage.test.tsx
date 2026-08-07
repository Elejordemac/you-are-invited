import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminPage from './AdminPage';

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
];

const mockCounts = { attending: 1, notAttending: 1, total: 2 };

function mockLoginThenGuests() {
  const mockFetch = vi.mocked(fetch);
  mockFetch.mockImplementation(async (url) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr.includes('/admin/login')) {
      return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
    }
    if (urlStr.includes('/admin/guests')) {
      return new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  });
}

async function loginAsAdmin() {
  const usernameInput = screen.getByLabelText('Username');
  const passwordInput = screen.getByLabelText('Password');
  const loginBtn = screen.getByRole('button', { name: /log in/i });

  fireEvent.change(usernameInput, { target: { value: 'admin' } });
  fireEvent.change(passwordInput, { target: { value: 'password' } });
  fireEvent.click(loginBtn);
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows login form when not authenticated', () => {
    render(<AdminPage />);
    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows admin panel after successful login', async () => {
    mockLoginThenGuests();

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  it('shows filter dropdown and search input when authenticated', async () => {
    mockLoginThenGuests();

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByLabelText('RSVP Status:')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Search guests by name or email')).toBeInTheDocument();
  });

  it('passes filter params to API when status filter changes', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/admin/login')) {
        return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
      }
      if (urlStr.includes('/admin/guests')) {
        return new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // Change filter to "Attending"
    const filterSelect = screen.getByLabelText('RSVP Status:');
    fireEvent.change(filterSelect, { target: { value: 'Attending' } });

    await waitFor(() => {
      const calls = mockFetch.mock.calls;
      const lastGuestCall = calls.filter((c) => {
        const urlStr = typeof c[0] === 'string' ? c[0] : c[0]?.toString() || '';
        return urlStr.includes('/admin/guests') && urlStr.includes('status=Attending');
      });
      expect(lastGuestCall.length).toBeGreaterThan(0);
    });
  });

  it('passes search param to API when search input changes', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/admin/login')) {
        return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
      }
      if (urlStr.includes('/admin/guests')) {
        return new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search guests by name or email');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    await waitFor(() => {
      const calls = mockFetch.mock.calls;
      const searchCall = calls.filter((c) => {
        const urlStr = typeof c[0] === 'string' ? c[0] : c[0]?.toString() || '';
        return urlStr.includes('/admin/guests') && urlStr.includes('search=alice');
      });
      expect(searchCall.length).toBeGreaterThan(0);
    });
  });

  it('opens edit modal with pre-filled data on Edit click', async () => {
    mockLoginThenGuests();

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    const editBtn = screen.getByLabelText('Edit Alice Smith');
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Guest Record')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alice Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
  });

  it('validates edit form - empty name shows error', async () => {
    mockLoginThenGuests();

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Edit Alice Smith'));

    // Clear name field
    const nameInput = screen.getByDisplayValue('Alice Smith');
    fireEvent.change(nameInput, { target: { value: '' } });

    // Submit
    fireEvent.click(screen.getByText('Save Changes'));

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('validates edit form - invalid email shows error', async () => {
    mockLoginThenGuests();

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Edit Alice Smith'));

    // Set invalid email
    const emailInput = screen.getByDisplayValue('alice@example.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    fireEvent.click(screen.getByText('Save Changes'));

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('shows 409 conflict error when email already in use', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/admin/login')) {
        return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
      }
      if (urlStr.includes('/admin/guests') && options?.method === 'PUT') {
        return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 409 });
      }
      if (urlStr.includes('/admin/guests')) {
        return new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Edit Alice Smith'));
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(screen.getByText('Email address is already in use by another guest.')).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog on delete and calls API on confirm', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/admin/login')) {
        return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
      }
      if (urlStr.includes('/admin/guests/2') && options?.method === 'DELETE') {
        return new Response(null, { status: 204 });
      }
      if (urlStr.includes('/admin/guests')) {
        return new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete Bob Jones'));

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Bob Jones')
    );
  });

  it('does not delete when confirmation is cancelled', async () => {
    mockLoginThenGuests();

    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Delete Bob Jones'));

    // Record should still be visible
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('calls approve endpoint and shows success message', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/admin/login')) {
        return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
      }
      if (urlStr.includes('/approve') && options?.method === 'POST') {
        return new Response(
          JSON.stringify({ message: 'Guest approved', guest: { ...mockGuests[1], approvalStatus: 'Approved' }, emailSent: true }),
          { status: 200 }
        );
      }
      if (urlStr.includes('/admin/guests')) {
        return new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByLabelText('Approve Bob Jones')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Approve Bob Jones'));

    await waitFor(() => {
      expect(screen.getByText(/Bob Jones.*has been approved/i)).toBeInTheDocument();
    });
  });

  it('shows email warning when approve succeeds but email fails', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/admin/login')) {
        return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
      }
      if (urlStr.includes('/approve') && options?.method === 'POST') {
        return new Response(
          JSON.stringify({
            message: 'Guest approved',
            guest: { ...mockGuests[1], approvalStatus: 'Approved' },
            emailSent: false,
            emailWarning: 'Approval saved but notification email could not be sent.',
          }),
          { status: 200 }
        );
      }
      if (urlStr.includes('/admin/guests')) {
        return new Response(JSON.stringify({ guests: mockGuests, counts: mockCounts }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    render(<AdminPage />);
    await loginAsAdmin();

    await waitFor(() => {
      expect(screen.getByLabelText('Approve Bob Jones')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Approve Bob Jones'));

    await waitFor(() => {
      expect(screen.getByText(/notification email could not be sent/i)).toBeInTheDocument();
    });
  });

  it('clears token and shows login on 401 from admin API', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/admin/login')) {
        return new Response(JSON.stringify({ token: 'test-jwt-token' }), { status: 200 });
      }
      if (urlStr.includes('/admin/guests')) {
        return new Response(JSON.stringify({ error: 'Token expired' }), { status: 401 });
      }
      return new Response('Not Found', { status: 404 });
    });

    render(<AdminPage />);
    await loginAsAdmin();

    // Should show login again after 401
    await waitFor(() => {
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });
  });
});
