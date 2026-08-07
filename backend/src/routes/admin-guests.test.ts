import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import adminGuestsRouter from './admin-guests';

// Mock the guest service
vi.mock('../services/guest', () => ({
  getAdminGuests: vi.fn(),
  updateGuest: vi.fn(),
  deleteGuest: vi.fn(),
  approveGuest: vi.fn(),
  markEmailSent: vi.fn(),
}));

// Mock the email service
vi.mock('../services/email', () => ({
  sendApprovalEmail: vi.fn(),
}));

// Mock the auth middleware to bypass JWT verification in tests
vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.adminId = 'admin-uuid';
    req.username = 'admin';
    next();
  },
}));

import { getAdminGuests, updateGuest, deleteGuest, approveGuest, markEmailSent } from '../services/guest';
import { sendApprovalEmail } from '../services/email';

const mockGetAdminGuests = getAdminGuests as ReturnType<typeof vi.fn>;
const mockUpdateGuest = updateGuest as ReturnType<typeof vi.fn>;
const mockDeleteGuest = deleteGuest as ReturnType<typeof vi.fn>;
const mockApproveGuest = approveGuest as ReturnType<typeof vi.fn>;
const mockMarkEmailSent = markEmailSent as ReturnType<typeof vi.fn>;
const mockSendApprovalEmail = sendApprovalEmail as ReturnType<typeof vi.fn>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/guests', adminGuestsRouter);
  return app;
}

describe('GET /api/admin/guests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with all guests when no filters applied', async () => {
    mockGetAdminGuests.mockResolvedValue({
      guests: [
        {
          id: 'uuid-2',
          name: 'Bob',
          email: 'bob@example.com',
          rsvpStatus: 'Not Attending',
          approvalStatus: 'Pending',
          approvalEmailSent: false,
          submittedAt: new Date('2024-01-16T10:00:00.000Z'),
          updatedAt: new Date('2024-01-16T10:00:00.000Z'),
        },
        {
          id: 'uuid-1',
          name: 'Alice',
          email: 'alice@example.com',
          rsvpStatus: 'Attending',
          approvalStatus: 'Approved',
          approvalEmailSent: true,
          submittedAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      ],
      counts: { attending: 1, notAttending: 1, total: 2 },
    });

    const app = createApp();
    const res = await request(app).get('/api/admin/guests');

    expect(res.status).toBe(200);
    expect(res.body.guests).toHaveLength(2);
    expect(res.body.counts).toEqual({ attending: 1, notAttending: 1, total: 2 });
    expect(mockGetAdminGuests).toHaveBeenCalledWith(undefined);
  });

  it('passes status filter to getAdminGuests', async () => {
    mockGetAdminGuests.mockResolvedValue({
      guests: [
        {
          id: 'uuid-1',
          name: 'Alice',
          email: 'alice@example.com',
          rsvpStatus: 'Attending',
          approvalStatus: 'Approved',
          approvalEmailSent: true,
          submittedAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      ],
      counts: { attending: 1, notAttending: 0, total: 1 },
    });

    const app = createApp();
    const res = await request(app).get('/api/admin/guests?status=Attending');

    expect(res.status).toBe(200);
    expect(mockGetAdminGuests).toHaveBeenCalledWith({ status: 'Attending' });
  });

  it('passes search filter to getAdminGuests', async () => {
    mockGetAdminGuests.mockResolvedValue({
      guests: [
        {
          id: 'uuid-1',
          name: 'John Smith',
          email: 'john@example.com',
          rsvpStatus: 'Attending',
          approvalStatus: 'Pending',
          approvalEmailSent: false,
          submittedAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      ],
      counts: { attending: 1, notAttending: 0, total: 1 },
    });

    const app = createApp();
    const res = await request(app).get('/api/admin/guests?search=john');

    expect(res.status).toBe(200);
    expect(mockGetAdminGuests).toHaveBeenCalledWith({ search: 'john' });
  });

  it('passes both status and search filters combined', async () => {
    mockGetAdminGuests.mockResolvedValue({
      guests: [],
      counts: { attending: 0, notAttending: 0, total: 0 },
    });

    const app = createApp();
    const res = await request(app).get('/api/admin/guests?status=Attending&search=alice');

    expect(res.status).toBe(200);
    expect(mockGetAdminGuests).toHaveBeenCalledWith({ status: 'Attending', search: 'alice' });
  });

  it('returns 400 for invalid status filter value', async () => {
    const app = createApp();
    const res = await request(app).get('/api/admin/guests?status=InvalidStatus');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid status filter');
  });

  it('returns guest fields including approvalEmailSent', async () => {
    mockGetAdminGuests.mockResolvedValue({
      guests: [
        {
          id: 'uuid-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          rsvpStatus: 'Attending',
          approvalStatus: 'Approved',
          approvalEmailSent: true,
          submittedAt: new Date('2024-01-15T10:00:00.000Z'),
          updatedAt: new Date('2024-01-15T10:00:00.000Z'),
        },
      ],
      counts: { attending: 1, notAttending: 0, total: 1 },
    });

    const app = createApp();
    const res = await request(app).get('/api/admin/guests');

    expect(res.status).toBe(200);
    const guest = res.body.guests[0];
    expect(guest).toHaveProperty('id');
    expect(guest).toHaveProperty('name');
    expect(guest).toHaveProperty('email');
    expect(guest).toHaveProperty('rsvpStatus');
    expect(guest).toHaveProperty('approvalStatus');
    expect(guest).toHaveProperty('approvalEmailSent');
    expect(guest).toHaveProperty('submittedAt');
    expect(guest).toHaveProperty('updatedAt');
    expect(guest.approvalEmailSent).toBe(true);
  });

  it('returns 503 when database connection is unavailable', async () => {
    const connError = new Error('connection refused');
    (connError as any).code = 'ECONNREFUSED';
    mockGetAdminGuests.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app).get('/api/admin/guests');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 500 when query fails', async () => {
    mockGetAdminGuests.mockRejectedValue(new Error('Query failed'));

    const app = createApp();
    const res = await request(app).get('/api/admin/guests');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Could not retrieve data');
  });

  it('returns empty guests array with zero counts when no guests exist', async () => {
    mockGetAdminGuests.mockResolvedValue({
      guests: [],
      counts: { attending: 0, notAttending: 0, total: 0 },
    });

    const app = createApp();
    const res = await request(app).get('/api/admin/guests');

    expect(res.status).toBe(200);
    expect(res.body.guests).toHaveLength(0);
    expect(res.body.counts).toEqual({ attending: 0, notAttending: 0, total: 0 });
  });
});

describe('PUT /api/admin/guests/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with updated guest on success', async () => {
    mockUpdateGuest.mockResolvedValue({
      id: 'uuid-1',
      name: 'Jane Updated',
      email: 'jane@example.com',
      rsvpStatus: 'Not Attending',
      approvalStatus: 'Pending',
      approvalEmailSent: false,
      submittedAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-16T10:00:00.000Z'),
    });

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane Updated', email: 'jane@example.com', rsvpStatus: 'Not Attending' });

    expect(res.status).toBe(200);
    expect(res.body.guest.name).toBe('Jane Updated');
    expect(res.body.guest.email).toBe('jane@example.com');
    expect(res.body.guest.rsvpStatus).toBe('Not Attending');
    expect(res.body.guest.approvalStatus).toBe('Pending');
    expect(res.body.guest.submittedAt).toBe('2024-01-15T10:00:00.000Z');
    expect(res.body.guest.updatedAt).toBe('2024-01-16T10:00:00.000Z');
  });

  it('returns 400 when name is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some((e: any) => e.field === 'name')).toBe(true);
    expect(mockUpdateGuest).not.toHaveBeenCalled();
  });

  it('returns 400 when name exceeds 100 characters', async () => {
    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'A'.repeat(101), email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some((e: any) => e.field === 'name')).toBe(true);
  });

  it('returns 400 when email is invalid', async () => {
    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'invalid-email', rsvpStatus: 'Attending' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some((e: any) => e.field === 'email')).toBe(true);
  });

  it('returns 400 when rsvpStatus is invalid', async () => {
    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Maybe' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.some((e: any) => e.field === 'rsvpStatus')).toBe(true);
  });

  it('returns 404 when guest ID does not exist', async () => {
    mockUpdateGuest.mockResolvedValue('not_found');

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/nonexistent-id')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Guest not found');
  });

  it('does not trigger email send when editing an already-approved guest', async () => {
    mockUpdateGuest.mockResolvedValue({
      id: 'uuid-1',
      name: 'Jane Updated',
      email: 'jane@example.com',
      rsvpStatus: 'Attending',
      approvalStatus: 'Approved',
      approvalEmailSent: true,
      submittedAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-16T10:00:00.000Z'),
    });

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane Updated', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(200);
    expect(res.body.guest.approvalStatus).toBe('Approved');
    // Email service should never be called from the edit endpoint
    expect(mockSendApprovalEmail).not.toHaveBeenCalled();
    expect(mockMarkEmailSent).not.toHaveBeenCalled();
  });

  it('returns 409 when email conflicts with another record', async () => {
    mockUpdateGuest.mockResolvedValue('email_conflict');

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'taken@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already in use');
    expect(res.body.field).toBe('email');
  });

  it('returns 503 when database connection is unavailable (ECONNREFUSED)', async () => {
    const connError = new Error('connection refused');
    (connError as any).code = 'ECONNREFUSED';
    mockUpdateGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when database connection times out (ETIMEDOUT)', async () => {
    const connError = new Error('connection timed out');
    (connError as any).code = 'ETIMEDOUT';
    mockUpdateGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when database connection is reset (ECONNRESET)', async () => {
    const connError = new Error('connection reset');
    (connError as any).code = 'ECONNRESET';
    mockUpdateGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection pool is exhausted', async () => {
    mockUpdateGuest.mockRejectedValue(new Error('Cannot acquire connection from pool'));

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockUpdateGuest.mockRejectedValue(new Error('Unexpected error'));

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/guests/uuid-1')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Could not save data');
  });
});

describe('DELETE /api/admin/guests/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with success message when guest is deleted', async () => {
    mockDeleteGuest.mockResolvedValue(true);

    const app = createApp();
    const res = await request(app).delete('/api/admin/guests/uuid-1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Guest deleted successfully');
    expect(mockDeleteGuest).toHaveBeenCalledWith('uuid-1');
  });

  it('returns 404 when guest ID does not exist', async () => {
    mockDeleteGuest.mockResolvedValue(false);

    const app = createApp();
    const res = await request(app).delete('/api/admin/guests/nonexistent-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Guest not found');
    expect(mockDeleteGuest).toHaveBeenCalledWith('nonexistent-id');
  });

  it('returns 503 when database connection is unavailable (ECONNREFUSED)', async () => {
    const connError = new Error('connection refused');
    (connError as any).code = 'ECONNREFUSED';
    mockDeleteGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app).delete('/api/admin/guests/uuid-1');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when database connection times out (ETIMEDOUT)', async () => {
    const connError = new Error('connection timed out');
    (connError as any).code = 'ETIMEDOUT';
    mockDeleteGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app).delete('/api/admin/guests/uuid-1');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when database connection is reset (ECONNRESET)', async () => {
    const connError = new Error('connection reset');
    (connError as any).code = 'ECONNRESET';
    mockDeleteGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app).delete('/api/admin/guests/uuid-1');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection pool is exhausted', async () => {
    mockDeleteGuest.mockRejectedValue(new Error('Cannot acquire connection from pool'));

    const app = createApp();
    const res = await request(app).delete('/api/admin/guests/uuid-1');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockDeleteGuest.mockRejectedValue(new Error('Unexpected error'));

    const app = createApp();
    const res = await request(app).delete('/api/admin/guests/uuid-1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Could not delete guest');
  });
});

describe('POST /api/admin/guests/:id/approve', () => {
  const approvedGuest = {
    id: 'uuid-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    rsvpStatus: 'Attending',
    approvalStatus: 'Approved',
    approvalEmailSent: false,
    submittedAt: new Date('2024-01-15T10:00:00.000Z'),
    updatedAt: new Date('2024-01-16T10:00:00.000Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with approved guest and emailSent true when email succeeds', async () => {
    mockApproveGuest.mockResolvedValue(approvedGuest);
    mockSendApprovalEmail.mockResolvedValue({ success: true });
    mockMarkEmailSent.mockResolvedValue(undefined);

    const app = createApp();
    const res = await request(app).post('/api/admin/guests/uuid-1/approve');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Guest registration approved successfully');
    expect(res.body.guest).toBeDefined();
    expect(res.body.guest.id).toBe('uuid-1');
    expect(res.body.guest.approvalStatus).toBe('Approved');
    expect(res.body.emailSent).toBe(true);
    expect(res.body.emailWarning).toBeUndefined();
    expect(mockApproveGuest).toHaveBeenCalledWith('uuid-1');
    expect(mockSendApprovalEmail).toHaveBeenCalledWith(approvedGuest);
    expect(mockMarkEmailSent).toHaveBeenCalledWith('uuid-1');
  });

  it('returns 200 with emailSent false and emailWarning when email fails', async () => {
    mockApproveGuest.mockResolvedValue(approvedGuest);
    mockSendApprovalEmail.mockResolvedValue({ success: false, error: 'SMTP failure' });

    const app = createApp();
    const res = await request(app).post('/api/admin/guests/uuid-1/approve');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Guest registration approved successfully');
    expect(res.body.emailSent).toBe(false);
    expect(res.body.emailWarning).toBe('Approval was saved but the notification email could not be sent');
    expect(mockMarkEmailSent).not.toHaveBeenCalled();
  });

  it('returns 200 with emailWarning when sendApprovalEmail throws', async () => {
    mockApproveGuest.mockResolvedValue(approvedGuest);
    mockSendApprovalEmail.mockRejectedValue(new Error('SMTP error'));

    const app = createApp();
    const res = await request(app).post('/api/admin/guests/uuid-1/approve');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Guest registration approved successfully');
    expect(res.body.emailSent).toBe(false);
    expect(res.body.emailWarning).toBe('Approval was saved but the notification email could not be sent');
    expect(mockMarkEmailSent).not.toHaveBeenCalled();
  });

  it('returns 404 when guest not found', async () => {
    mockApproveGuest.mockResolvedValue('not_found');

    const app = createApp();
    const res = await request(app).post('/api/admin/guests/nonexistent-id/approve');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Guest not found');
    expect(mockSendApprovalEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when guest is already approved', async () => {
    mockApproveGuest.mockResolvedValue('already_approved');

    const app = createApp();
    const res = await request(app).post('/api/admin/guests/uuid-1/approve');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Guest is already approved');
    expect(mockSendApprovalEmail).not.toHaveBeenCalled();
  });

  it('returns 503 when database connection is unavailable', async () => {
    const connError = new Error('connection refused');
    (connError as any).code = 'ECONNREFUSED';
    mockApproveGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app).post('/api/admin/guests/uuid-1/approve');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockApproveGuest.mockRejectedValue(new Error('Unexpected error'));

    const app = createApp();
    const res = await request(app).post('/api/admin/guests/uuid-1/approve');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Could not approve guest');
  });
});
