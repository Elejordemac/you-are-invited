import pool from '../db';
import { GuestRecord, RsvpStatus } from '../types';
import { normalizeEmail } from './validation';

export interface RegisterGuestResult {
  guest: GuestRecord;
  isUpdate: boolean;
}

/**
 * Registers a new guest or updates an existing one based on normalized email.
 * Uses a database transaction for atomicity.
 */
export async function registerGuest(
  name: string,
  email: string,
  rsvpStatus: RsvpStatus
): Promise<RegisterGuestResult> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = name.trim();
  const now = new Date();
  // Truncate to second precision
  now.setMilliseconds(0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if a guest with this normalized email already exists
    const existingResult = await client.query(
      'SELECT * FROM guests WHERE LOWER(TRIM(email)) = $1',
      [normalizedEmail]
    );

    let guest: GuestRecord;
    let isUpdate: boolean;

    if (existingResult.rows.length > 0) {
      // Update existing record
      const updateResult = await client.query(
        `UPDATE guests 
         SET name = $1, rsvp_status = $2, updated_at = $3 
         WHERE LOWER(TRIM(email)) = $4 
         RETURNING *`,
        [trimmedName, rsvpStatus, now, normalizedEmail]
      );

      const row = updateResult.rows[0];
      guest = mapRowToGuestRecord(row);
      isUpdate = true;
    } else {
      // Insert new record
      const insertResult = await client.query(
        `INSERT INTO guests (name, email, rsvp_status, approval_status, approval_email_sent, submitted_at, updated_at)
         VALUES ($1, $2, $3, 'Pending', false, $4, $4)
         RETURNING *`,
        [trimmedName, normalizedEmail, rsvpStatus, now]
      );

      const row = insertResult.rows[0];
      guest = mapRowToGuestRecord(row);
      isUpdate = false;
    }

    await client.query('COMMIT');
    return { guest, isUpdate };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface GuestListResult {
  guests: GuestRecord[];
  counts: {
    attending: number;
    notAttending: number;
    total: number;
  };
}

/**
 * Retrieves all guest records sorted by submitted_at DESC,
 * along with attendance status counts.
 */
export async function getAllGuests(): Promise<GuestListResult> {
  const result = await pool.query(
    'SELECT * FROM guests ORDER BY submitted_at DESC'
  );

  const guests = result.rows.map(mapRowToGuestRecord);

  const attending = guests.filter(g => g.rsvpStatus === 'Attending').length;
  const notAttending = guests.filter(g => g.rsvpStatus === 'Not Attending').length;

  return {
    guests,
    counts: {
      attending,
      notAttending,
      total: guests.length,
    },
  };
}

export interface AdminGuestsFilter {
  status?: string;
  search?: string;
}

/**
 * Retrieves guest records for admin panel with optional filtering and search.
 * Supports filtering by RSVP status and case-insensitive substring search on name or email.
 * Returns results sorted by submitted_at DESC.
 */
export async function getAdminGuests(filter?: AdminGuestsFilter): Promise<GuestListResult> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filter?.status) {
    conditions.push(`rsvp_status = $${paramIndex}`);
    params.push(filter.status);
    paramIndex++;
  }

  if (filter?.search) {
    conditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex})`);
    params.push(`%${filter.search.toLowerCase()}%`);
    paramIndex++;
  }

  let query = 'SELECT * FROM guests';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY submitted_at DESC';

  const result = await pool.query(query, params);
  const guests = result.rows.map(mapRowToGuestRecord);

  const attending = guests.filter(g => g.rsvpStatus === 'Attending').length;
  const notAttending = guests.filter(g => g.rsvpStatus === 'Not Attending').length;

  return {
    guests,
    counts: {
      attending,
      notAttending,
      total: guests.length,
    },
  };
}

/**
 * Updates an existing guest record by ID.
 * Validates email uniqueness (case-insensitive, trimmed) against other records.
 * Returns the updated guest, 'not_found' if the ID doesn't exist,
 * or 'email_conflict' if the new email conflicts with another guest.
 */
export async function updateGuest(
  id: string,
  data: { name: string; email: string; rsvpStatus: RsvpStatus }
): Promise<GuestRecord | 'not_found' | 'email_conflict'> {
  const normalizedEmail = normalizeEmail(data.email);
  const trimmedName = data.name.trim();
  const now = new Date();
  now.setMilliseconds(0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the guest exists
    const existingResult = await client.query(
      'SELECT * FROM guests WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return 'not_found';
    }

    // Check for email conflict with another record
    const conflictResult = await client.query(
      'SELECT id FROM guests WHERE LOWER(TRIM(email)) = $1 AND id != $2',
      [normalizedEmail, id]
    );

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return 'email_conflict';
    }

    // Update the guest record
    const updateResult = await client.query(
      `UPDATE guests 
       SET name = $1, email = $2, rsvp_status = $3, updated_at = $4
       WHERE id = $5
       RETURNING *`,
      [trimmedName, normalizedEmail, data.rsvpStatus, now, id]
    );

    await client.query('COMMIT');
    return mapRowToGuestRecord(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Deletes a guest record by ID.
 * Returns true if a record was deleted, false if no record with that ID exists.
 */
export async function deleteGuest(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM guests WHERE id = $1',
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Approves a guest registration by ID.
 * Verifies the guest exists and has a status of "Pending" before updating to "Approved".
 * Returns the updated guest record, 'not_found' if ID doesn't exist,
 * or 'already_approved' if the guest is already approved.
 */
export async function approveGuest(id: string): Promise<GuestRecord | 'not_found' | 'already_approved'> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the guest exists
    const existingResult = await client.query(
      'SELECT * FROM guests WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return 'not_found';
    }

    const existing = existingResult.rows[0];

    // Check if already approved
    if (existing.approval_status === 'Approved') {
      await client.query('ROLLBACK');
      return 'already_approved';
    }

    // Update approval status
    const now = new Date();
    now.setMilliseconds(0);

    const updateResult = await client.query(
      `UPDATE guests 
       SET approval_status = 'Approved', updated_at = $1
       WHERE id = $2
       RETURNING *`,
      [now, id]
    );

    await client.query('COMMIT');
    return mapRowToGuestRecord(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Marks that the approval email has been sent for a guest.
 * Sets approval_email_sent = true in the database.
 */
export async function markEmailSent(id: string): Promise<void> {
  await pool.query(
    'UPDATE guests SET approval_email_sent = true WHERE id = $1',
    [id]
  );
}

/**
 * Maps a database row to a GuestRecord object.
 */
function mapRowToGuestRecord(row: any): GuestRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    rsvpStatus: row.rsvp_status,
    approvalStatus: row.approval_status,
    approvalEmailSent: row.approval_email_sent,
    submittedAt: new Date(row.submitted_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Retrieves a single guest record by ID.
 * Returns null if not found.
 */
export async function getGuestById(id: string): Promise<GuestRecord | null> {
  const result = await pool.query('SELECT * FROM guests WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return mapRowToGuestRecord(result.rows[0]);
}

/**
 * Resets the approval_email_sent flag so the email can be resent.
 */
export async function resetEmailSent(id: string): Promise<void> {
  await pool.query(
    'UPDATE guests SET approval_email_sent = false WHERE id = $1',
    [id]
  );
}
