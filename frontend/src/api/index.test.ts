import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerGuest, fetchGuests, fetchAdminGuests } from './index';

describe('API utility', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerGuest', () => {
    it('calls POST with correct URL and payload', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('{}', { status: 201 }));

      await registerGuest({
        name: 'Test User',
        email: 'test@example.com',
        rsvpStatus: 'Attending',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/guests',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            rsvpStatus: 'Attending',
          }),
        }
      );
    });

    it('returns the raw Response object', async () => {
      const mockFetch = vi.mocked(fetch);
      const mockResponse = new Response(
        JSON.stringify({ message: 'ok' }),
        { status: 200 }
      );
      mockFetch.mockResolvedValue(mockResponse);

      const result = await registerGuest({
        name: 'User',
        email: 'u@test.com',
        rsvpStatus: 'Undecided',
      });

      expect(result).toBe(mockResponse);
      expect(result.status).toBe(200);
    });
  });

  describe('fetchGuests', () => {
    it('calls GET with correct URL', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await fetchGuests();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/guests'
      );
    });

    it('returns the raw Response object', async () => {
      const mockFetch = vi.mocked(fetch);
      const mockResponse = new Response(
        JSON.stringify({ guests: [], counts: { attending: 0, notAttending: 0, total: 0 } }),
        { status: 200 }
      );
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchGuests();

      expect(result).toBe(mockResponse);
      expect(result.status).toBe(200);
    });
  });

  describe('fetchAdminGuests', () => {
    it('calls GET with authorization header', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await fetchAdminGuests('my-jwt-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/guests'),
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer my-jwt-token' },
        })
      );
    });

    it('includes status query param when provided', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await fetchAdminGuests('token', { status: 'Attending' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('status=Attending');
    });

    it('includes search query param when provided', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await fetchAdminGuests('token', { search: 'alice' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('search=alice');
    });

    it('includes both params when provided', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await fetchAdminGuests('token', { status: 'Attending', search: 'bob' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('status=Attending');
      expect(calledUrl).toContain('search=bob');
    });

    it('does not include params when not provided', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await fetchAdminGuests('token');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('status=');
      expect(calledUrl).not.toContain('search=');
    });

    it('returns the raw Response object', async () => {
      const mockFetch = vi.mocked(fetch);
      const mockResponse = new Response(
        JSON.stringify({ guests: [], counts: {} }),
        { status: 200 }
      );
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchAdminGuests('token');

      expect(result).toBe(mockResponse);
      expect(result.status).toBe(200);
    });
  });
});
