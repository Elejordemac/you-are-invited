import { Router, Request, Response } from 'express';
import { validateRegistration } from '../services/validation';
import { registerGuest, getAllGuests } from '../services/guest';
import { RegisterGuestRequest, RsvpStatus } from '../types';

const router = Router();

/**
 * GET /api/guests
 * Retrieve all guest records sorted by submitted_at DESC with status counts.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await getAllGuests();

    return res.status(200).json({
      guests: result.guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        rsvpStatus: guest.rsvpStatus,
        approvalStatus: guest.approvalStatus,
        companions: guest.companions,
        submittedAt: guest.submittedAt.toISOString(),
        updatedAt: guest.updatedAt.toISOString(),
      })),
      counts: result.counts,
    });
  } catch (error: any) {
    console.error('Error retrieving guests:', error);

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
 * POST /api/guests
 * Register a new guest or update an existing registration (upsert by email).
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationErrors = validateRegistration(req.body);
    if (validationErrors) {
      return res.status(400).json(validationErrors);
    }

    const { name, email, rsvpStatus } = req.body as RegisterGuestRequest;
    const companions = parseInt(req.body.companions) || 0;
    const dietaryRestrictions = req.body.dietaryRestrictions || '';

    // Register or update guest
    const { guest, isUpdate } = await registerGuest(name, email, rsvpStatus, companions, dietaryRestrictions);

    const statusCode = isUpdate ? 200 : 201;
    const message = isUpdate
      ? 'Your RSVP has been updated successfully.'
      : `Thank you for registering! Your RSVP status is "${guest.rsvpStatus}" and your registration is pending approval.`;

    return res.status(statusCode).json({
      message,
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        rsvpStatus: guest.rsvpStatus,
        approvalStatus: guest.approvalStatus,
        submittedAt: guest.submittedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error registering guest:', error);

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

    // All other database write failures (constraint violations, query errors, etc.)
    return res.status(500).json({ error: 'Could not save data' });
  }
});

export default router;
