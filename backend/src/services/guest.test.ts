import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerGuest, getAllGuests, getAdminGuests, updateGuest, deleteGuest, approveGuest, markEmailSent } from './guest';

// Mock the database pool
const mockQuery = vi.fn();
const mockRelease = vi.fn();
const mockConnect = vi.fn();

vi.mock('../db', () => ({
  default: {
    connect: () => mockConnect(),
    query: (...args: any[]) => mockQuery(...args),
  },
}));

describe('GuestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  describe('registerGuest', () => {
    it('inserts a new guest when email does not exist', async () => {
      // No existing guest found
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT (no existing)
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-new',
            name: 'Jane Doe',
            email: 'jane@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          }],
        }) // INSERT
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await registerGuest('Jane Doe', 'jane@example.com', 'Attending');

      expect(result.isUpdate).toBe(false);
      expect(result.guest.name).toBe('Jane Doe');
      expect(result.guest.email).toBe('jane@example.com');
      expect(result.guest.rsvpStatus).toBe('Attending');
      expect(result.guest.approvalStatus).toBe('Pending');
      expect(result.guest.approvalEmailSent).toBe(false);
    });

    it('updates an existing guest when email already exists', async () => {
      // Existing guest found
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-existing',
            name: 'Jane Doe',
            email: 'jane@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          }],
        }) // SELECT (existing found)
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-existing',
            name: 'Jane Updated',
            email: 'jane@example.com',
            rsvp_status: 'Not Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-16T10:00:00.000Z',
          }],
        }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await registerGuest('Jane Updated', '  JANE@EXAMPLE.COM  ', 'Not Attending');

      expect(result.isUpdate).toBe(true);
      expect(result.guest.name).toBe('Jane Updated');
      expect(result.guest.rsvpStatus).toBe('Not Attending');
    });

    it('normalizes email to lowercase and trims whitespace', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-new',
            name: 'Test',
            email: 'test@example.com',
            rsvp_status: 'Undecided',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          }],
        }) // INSERT
        .mockResolvedValueOnce(undefined); // COMMIT

      await registerGuest('Test', '  TEST@EXAMPLE.COM  ', 'Undecided');

      // The SELECT query should use the normalized email
      const selectCall = mockQuery.mock.calls[1];
      expect(selectCall[1][0]).toBe('test@example.com');
    });

    it('rolls back transaction on error', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('DB error')); // SELECT fails

      await expect(registerGuest('Jane', 'jane@example.com', 'Attending'))
        .rejects.toThrow('DB error');

      // Should have called ROLLBACK
      const rollbackCall = mockQuery.mock.calls.find(
        (call: any) => call[0] === 'ROLLBACK'
      );
      expect(rollbackCall).toBeDefined();
    });

    it('always releases the client connection', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-new',
            name: 'Test',
            email: 'test@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          }],
        }) // INSERT
        .mockResolvedValueOnce(undefined); // COMMIT

      await registerGuest('Test', 'test@example.com', 'Attending');

      expect(mockRelease).toHaveBeenCalledOnce();
    });

    it('releases client even on error', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(registerGuest('Jane', 'jane@example.com', 'Attending'))
        .rejects.toThrow();

      expect(mockRelease).toHaveBeenCalledOnce();
    });
  });

  describe('getAllGuests', () => {
    it('returns all guests sorted by submitted_at DESC with counts', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-2',
            name: 'Bob',
            email: 'bob@example.com',
            rsvp_status: 'Not Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-16T10:00:00.000Z',
            updated_at: '2024-01-16T10:00:00.000Z',
          },
          {
            id: 'uuid-1',
            name: 'Alice',
            email: 'alice@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Approved',
            approval_email_sent: true,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          },
        ],
      });

      const result = await getAllGuests();

      expect(result.guests).toHaveLength(2);
      expect(result.guests[0].name).toBe('Bob');
      expect(result.guests[1].name).toBe('Alice');
      expect(result.counts).toEqual({
        attending: 1,
        notAttending: 1,
        total: 2,
      });
    });

    it('returns empty guests array and zero counts when no records', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getAllGuests();

      expect(result.guests).toHaveLength(0);
      expect(result.counts).toEqual({
        attending: 0,
        notAttending: 0,
        total: 0,
      });
    });

    it('correctly counts multiple attending and not attending guests', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: '1', name: 'A', email: 'a@x.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
          { id: '2', name: 'B', email: 'b@x.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-14T10:00:00Z', updated_at: '2024-01-14T10:00:00Z' },
          { id: '3', name: 'C', email: 'c@x.com', rsvp_status: 'Not Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-13T10:00:00Z', updated_at: '2024-01-13T10:00:00Z' },
          { id: '4', name: 'D', email: 'd@x.com', rsvp_status: 'Undecided', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-12T10:00:00Z', updated_at: '2024-01-12T10:00:00Z' },
        ],
      });

      const result = await getAllGuests();

      expect(result.counts.attending).toBe(2);
      expect(result.counts.notAttending).toBe(1);
      expect(result.counts.total).toBe(4);
    });

    it('maps database row fields to camelCase GuestRecord', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'uuid-1',
            name: 'Test Guest',
            email: 'test@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Approved',
            approval_email_sent: true,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-16T10:00:00.000Z',
          },
        ],
      });

      const result = await getAllGuests();
      const guest = result.guests[0];

      expect(guest.id).toBe('uuid-1');
      expect(guest.name).toBe('Test Guest');
      expect(guest.email).toBe('test@example.com');
      expect(guest.rsvpStatus).toBe('Attending');
      expect(guest.approvalStatus).toBe('Approved');
      expect(guest.approvalEmailSent).toBe(true);
      expect(guest.submittedAt).toBeInstanceOf(Date);
      expect(guest.updatedAt).toBeInstanceOf(Date);
    });

    it('queries with ORDER BY submitted_at DESC', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getAllGuests();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM guests ORDER BY submitted_at DESC'
      );
    });
  });

  describe('getAdminGuests', () => {
    it('returns all guests when no filter is provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: '1', name: 'Alice', email: 'alice@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-16T10:00:00Z', updated_at: '2024-01-16T10:00:00Z' },
          { id: '2', name: 'Bob', email: 'bob@example.com', rsvp_status: 'Not Attending', approval_status: 'Approved', approval_email_sent: true, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
        ],
      });

      const result = await getAdminGuests();

      expect(result.guests).toHaveLength(2);
      expect(result.counts).toEqual({ attending: 1, notAttending: 1, total: 2 });
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM guests ORDER BY submitted_at DESC',
        []
      );
    });

    it('filters by RSVP status when status is provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: '1', name: 'Alice', email: 'alice@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-16T10:00:00Z', updated_at: '2024-01-16T10:00:00Z' },
        ],
      });

      const result = await getAdminGuests({ status: 'Attending' });

      expect(result.guests).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM guests WHERE rsvp_status = $1 ORDER BY submitted_at DESC',
        ['Attending']
      );
    });

    it('searches by name or email (case-insensitive) when search is provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: '1', name: 'John Smith', email: 'john@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-16T10:00:00Z', updated_at: '2024-01-16T10:00:00Z' },
        ],
      });

      const result = await getAdminGuests({ search: 'John' });

      expect(result.guests).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM guests WHERE (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1) ORDER BY submitted_at DESC',
        ['%john%']
      );
    });

    it('combines status and search filters', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      await getAdminGuests({ status: 'Attending', search: 'alice' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM guests WHERE rsvp_status = $1 AND (LOWER(name) LIKE $2 OR LOWER(email) LIKE $2) ORDER BY submitted_at DESC',
        ['Attending', '%alice%']
      );
    });

    it('returns correct counts for filtered results', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: '1', name: 'A', email: 'a@x.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-16T10:00:00Z', updated_at: '2024-01-16T10:00:00Z' },
          { id: '2', name: 'B', email: 'b@x.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
        ],
      });

      const result = await getAdminGuests({ status: 'Attending' });

      expect(result.counts.attending).toBe(2);
      expect(result.counts.notAttending).toBe(0);
      expect(result.counts.total).toBe(2);
    });
  });

  describe('updateGuest', () => {
    it('updates a guest record and returns the updated record', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'uuid-1', name: 'Old Name', email: 'old@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' }],
        }) // SELECT (guest exists)
        .mockResolvedValueOnce({ rows: [] }) // SELECT (no email conflict)
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            name: 'New Name',
            email: 'new@example.com',
            rsvp_status: 'Not Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-16T10:00:00.000Z',
          }],
        }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await updateGuest('uuid-1', { name: 'New Name', email: 'new@example.com', rsvpStatus: 'Not Attending' });

      expect(result).not.toBe('not_found');
      expect(result).not.toBe('email_conflict');
      if (typeof result === 'object') {
        expect(result.name).toBe('New Name');
        expect(result.email).toBe('new@example.com');
        expect(result.rsvpStatus).toBe('Not Attending');
      }
    });

    it('returns not_found when guest ID does not exist', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT (guest not found)
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const result = await updateGuest('nonexistent-id', { name: 'Test', email: 'test@example.com', rsvpStatus: 'Attending' });

      expect(result).toBe('not_found');
    });

    it('returns email_conflict when email is already used by another guest', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'uuid-1', name: 'Guest', email: 'guest@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' }],
        }) // SELECT (guest exists)
        .mockResolvedValueOnce({ rows: [{ id: 'uuid-2' }] }) // SELECT (email conflict found)
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const result = await updateGuest('uuid-1', { name: 'Guest', email: 'taken@example.com', rsvpStatus: 'Attending' });

      expect(result).toBe('email_conflict');
    });

    it('normalizes email (trims and lowercases) before checking conflict', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'uuid-1', name: 'Guest', email: 'guest@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' }],
        }) // SELECT (guest exists)
        .mockResolvedValueOnce({ rows: [] }) // SELECT (no email conflict)
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            name: 'Guest',
            email: 'new@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-16T10:00:00.000Z',
          }],
        }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      await updateGuest('uuid-1', { name: 'Guest', email: '  NEW@EXAMPLE.COM  ', rsvpStatus: 'Attending' });

      // The conflict check should use the normalized email
      const conflictCheckCall = mockQuery.mock.calls[2];
      expect(conflictCheckCall[1][0]).toBe('new@example.com');
    });

    it('rolls back transaction on error', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(updateGuest('uuid-1', { name: 'Test', email: 'test@example.com', rsvpStatus: 'Attending' }))
        .rejects.toThrow('DB error');

      const rollbackCall = mockQuery.mock.calls.find(
        (call: any) => call[0] === 'ROLLBACK'
      );
      expect(rollbackCall).toBeDefined();
    });

    it('always releases the client connection', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'uuid-1', name: 'Guest', email: 'guest@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' }],
        }) // SELECT (guest exists)
        .mockResolvedValueOnce({ rows: [] }) // SELECT (no conflict)
        .mockResolvedValueOnce({
          rows: [{ id: 'uuid-1', name: 'Guest', email: 'guest@example.com', rsvp_status: 'Attending', approval_status: 'Pending', approval_email_sent: false, submitted_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-16T10:00:00Z' }],
        }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      await updateGuest('uuid-1', { name: 'Guest', email: 'guest@example.com', rsvpStatus: 'Attending' });

      expect(mockRelease).toHaveBeenCalledOnce();
    });
  });

  describe('deleteGuest', () => {
    it('returns true when a guest record is deleted', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await deleteGuest('uuid-1');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM guests WHERE id = $1',
        ['uuid-1']
      );
    });

    it('returns false when no guest record with that ID exists', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await deleteGuest('nonexistent-id');

      expect(result).toBe(false);
      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM guests WHERE id = $1',
        ['nonexistent-id']
      );
    });

    it('propagates database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(deleteGuest('uuid-1')).rejects.toThrow('DB error');
    });
  });

  describe('approveGuest', () => {
    it('approves a pending guest and returns updated record', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            name: 'Jane Doe',
            email: 'jane@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          }],
        }) // SELECT (guest exists, Pending)
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            name: 'Jane Doe',
            email: 'jane@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Approved',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-16T10:00:00.000Z',
          }],
        }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      const result = await approveGuest('uuid-1');

      expect(result).not.toBe('not_found');
      expect(result).not.toBe('already_approved');
      if (typeof result === 'object') {
        expect(result.approvalStatus).toBe('Approved');
        expect(result.name).toBe('Jane Doe');
        expect(result.id).toBe('uuid-1');
      }
    });

    it('returns not_found when guest ID does not exist', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT (not found)
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const result = await approveGuest('nonexistent-id');

      expect(result).toBe('not_found');
    });

    it('returns already_approved when guest is already approved', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            name: 'Jane Doe',
            email: 'jane@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Approved',
            approval_email_sent: true,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          }],
        }) // SELECT (already approved)
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const result = await approveGuest('uuid-1');

      expect(result).toBe('already_approved');
    });

    it('rolls back transaction on error', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(approveGuest('uuid-1')).rejects.toThrow('DB error');

      const rollbackCall = mockQuery.mock.calls.find(
        (call: any) => call[0] === 'ROLLBACK'
      );
      expect(rollbackCall).toBeDefined();
    });

    it('always releases the client connection', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            name: 'Jane',
            email: 'jane@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Pending',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-15T10:00:00.000Z',
          }],
        }) // SELECT
        .mockResolvedValueOnce({
          rows: [{
            id: 'uuid-1',
            name: 'Jane',
            email: 'jane@example.com',
            rsvp_status: 'Attending',
            approval_status: 'Approved',
            approval_email_sent: false,
            submitted_at: '2024-01-15T10:00:00.000Z',
            updated_at: '2024-01-16T10:00:00.000Z',
          }],
        }) // UPDATE
        .mockResolvedValueOnce(undefined); // COMMIT

      await approveGuest('uuid-1');

      expect(mockRelease).toHaveBeenCalledOnce();
    });
  });

  describe('markEmailSent', () => {
    it('updates approval_email_sent to true for the given guest ID', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      await markEmailSent('uuid-1');

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE guests SET approval_email_sent = true WHERE id = $1',
        ['uuid-1']
      );
    });

    it('propagates database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(markEmailSent('uuid-1')).rejects.toThrow('DB error');
    });
  });
});
