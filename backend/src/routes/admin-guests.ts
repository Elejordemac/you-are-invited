import { Router, Request, Response } from 'express';
import { getAdminGuests, updateGuest, deleteGuest, approveGuest, markEmailSent } from '../services/guest';
import { requireAuth } from '../middleware/auth';
import { RSVP_STATUSES, ApproveResponse } from '../types';
import { validateRegistration } from '../services/validation';
import { sendApprovalEmail } from '../services/email';

const router = Router();

// All routes in this router require authentication
router.use(requireAuth);

/**
 * GET /api/admin/guests
 * Retrieve all guest records with optional filtering and search.
 * Query params:
 *   - status: Filter by RSVP status (e.g. "Attending", "Not Attending", "Undecided")
 *   - search: Case-insensitive substring search on name or email
 * Both filters can be combined.
 * Returns guests sorted by submitted_at DESC with attendance counts.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Validate status filter if provided
    if (status && !RSVP_STATUSES.includes(status as any)) {
      return res.status(400).json({ error: `Invalid status filter. Must be one of: ${RSVP_STATUSES.join(', ')}` });
    }

    const filter: { status?: string; search?: string } = {};
    if (status) filter.status = status;
    if (search) filter.search = search;

    const result = await getAdminGuests(Object.keys(filter).length > 0 ? filter : undefined);

    return res.status(200).json({
      guests: result.guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        rsvpStatus: guest.rsvpStatus,
        approvalStatus: guest.approvalStatus,
        approvalEmailSent: guest.approvalEmailSent,
        submittedAt: guest.submittedAt.toISOString(),
        updatedAt: guest.updatedAt.toISOString(),
      })),
      counts: result.counts,
    });
  } catch (error: any) {
    console.error('Error retrieving admin guests:', error);

    // Database connection failures: ECONNREFUSED, ETIMEDOUT, pool exhaustion, connection reset
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout expired') ||
      error.message?.includes('Cannot acquire')
    ) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    return res.status(500).json({ error: 'Could not retrieve data' });
  }
});

/**
 * PUT /api/admin/guests/:id
 * Update a guest record.
 * Request body: { name, email, rsvpStatus }
 * Returns 200 with updated guest on success.
 * Returns 400 for validation errors.
 * Returns 404 if guest not found.
 * Returns 409 if email conflicts with another record.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate input
    const validationErrors = validateRegistration(req.body);
    if (validationErrors) {
      return res.status(400).json(validationErrors);
    }

    const { name, email, rsvpStatus } = req.body;

    const result = await updateGuest(id, { name, email, rsvpStatus });

    if (result === 'not_found') {
      return res.status(404).json({ error: 'Guest not found' });
    }

    if (result === 'email_conflict') {
      return res.status(409).json({ error: 'Email already in use', field: 'email' });
    }

    return res.status(200).json({
      guest: {
        id: result.id,
        name: result.name,
        email: result.email,
        rsvpStatus: result.rsvpStatus,
        approvalStatus: result.approvalStatus,
        approvalEmailSent: result.approvalEmailSent,
        submittedAt: result.submittedAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error updating guest:', error);

    // Database connection failures: ECONNREFUSED, ETIMEDOUT, pool exhaustion, connection reset
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout expired') ||
      error.message?.includes('Cannot acquire')
    ) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    return res.status(500).json({ error: 'Could not save data' });
  }
});

/**
 * DELETE /api/admin/guests/:id
 * Permanently remove a guest record from the database.
 * Returns 200 with success message on deletion.
 * Returns 404 if guest not found.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await deleteGuest(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    return res.status(200).json({ message: 'Guest deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting guest:', error);

    // Database connection failures: ECONNREFUSED, ETIMEDOUT, pool exhaustion, connection reset
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout expired') ||
      error.message?.includes('Cannot acquire')
    ) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    return res.status(500).json({ error: 'Could not delete guest' });
  }
});

/**
 * POST /api/admin/guests/:id/approve
 * Approve a pending guest registration.
 * Updates approvalStatus to "Approved" and sends an approval email.
 * Returns 200 with approval result (including emailSent status).
 * Returns 400 if guest is already approved.
 * Returns 404 if guest not found.
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await approveGuest(id);

    if (result === 'not_found') {
      return res.status(404).json({ error: 'Guest not found' });
    }

    if (result === 'already_approved') {
      return res.status(400).json({ error: 'Guest is already approved' });
    }

    // Attempt to send approval email (non-blocking to the approval save)
    let emailSent = false;
    let emailWarning: string | undefined;

    try {
      const emailResult = await sendApprovalEmail(result);
      emailSent = emailResult.success;
      if (emailSent) {
        // Mark email as sent in the database
        await markEmailSent(id);
      } else {
        emailWarning = `Approval was saved but the notification email could not be sent: ${emailResult.error || 'unknown error'}`;
        console.error('Email send failed:', emailResult.error);
      }
    } catch (emailError: any) {
      console.error('Error sending approval email:', emailError);
      emailWarning = `Approval was saved but the notification email could not be sent: ${emailError.message || 'unknown error'}`;
    }

    const response: ApproveResponse = {
      message: 'Guest registration approved successfully',
      guest: result,
      emailSent,
      ...(emailWarning && { emailWarning }),
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Error approving guest:', error);

    // Database connection failures: ECONNREFUSED, ETIMEDOUT, pool exhaustion, connection reset
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout expired') ||
      error.message?.includes('Cannot acquire')
    ) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    return res.status(500).json({ error: 'Could not approve guest' });
  }
});

export default router;
