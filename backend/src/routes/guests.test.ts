import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import guestsRouter from './guests';

// Mock the guest service
vi.mock('../services/guest', () => ({
  registerGuest: vi.fn(),
  getAllGuests: vi.fn(),
}));

import { registerGuest, getAllGuests } from '../services/guest';

const mockRegisterGuest = registerGuest as ReturnType<typeof vi.fn>;
const mockGetAllGuests = getAllGuests as ReturnType<typeof vi.fn>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/guests', guestsRouter);
  return app;
}

describe('POST /api/guests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 with confirmation message for new registration', async () => {
    const mockGuest = {
      id: 'uuid-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      rsvpStatus: 'Attending',
      approvalStatus: 'Pending',
      approvalEmailSent: false,
      submittedAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T10:00:00.000Z'),
    };

    mockRegisterGuest.mockResolvedValue({ guest: mockGuest, isUpdate: false });

    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane Doe', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Attending');
    expect(res.body.message).toContain('pending approval');
    expect(res.body.guest.id).toBe('uuid-1');
    expect(res.body.guest.name).toBe('Jane Doe');
    expect(res.body.guest.email).toBe('jane@example.com');
    expect(res.body.guest.rsvpStatus).toBe('Attending');
    expect(res.body.guest.approvalStatus).toBe('Pending');
    expect(res.body.guest.submittedAt).toBe('2024-01-15T10:00:00.000Z');
  });

  it('returns 200 with update message for existing registration', async () => {
    const mockGuest = {
      id: 'uuid-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      rsvpStatus: 'Not Attending',
      approvalStatus: 'Pending',
      approvalEmailSent: false,
      submittedAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-16T10:00:00.000Z'),
    };

    mockRegisterGuest.mockResolvedValue({ guest: mockGuest, isUpdate: true });

    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane Doe', email: 'jane@example.com', rsvpStatus: 'Not Attending' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('updated');
  });

  it('returns 400 with validation errors for missing fields', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);

    const fields = res.body.errors.map((e: any) => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('email');
    expect(fields).toContain('rsvpStatus');
  });

  it('returns 400 with validation error for invalid email', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane', email: 'invalid-email', rsvpStatus: 'Attending' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    const emailErrors = res.body.errors.filter((e: any) => e.field === 'email');
    expect(emailErrors.length).toBeGreaterThan(0);
  });

  it('returns 400 with validation error for invalid RSVP status', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane', email: 'jane@example.com', rsvpStatus: 'Maybe' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    const rsvpErrors = res.body.errors.filter((e: any) => e.field === 'rsvpStatus');
    expect(rsvpErrors.length).toBeGreaterThan(0);
  });

  it('returns 500 when database write fails', async () => {
    mockRegisterGuest.mockRejectedValue(new Error('Database write failed'));

    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane Doe', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Could not save data');
  });

  it('returns 503 when database connection is unavailable (ECONNREFUSED)', async () => {
    const connError = new Error('connection refused');
    (connError as any).code = 'ECONNREFUSED';
    mockRegisterGuest.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane Doe', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection times out (ETIMEDOUT)', async () => {
    const timeoutError = new Error('connect ETIMEDOUT');
    (timeoutError as any).code = 'ETIMEDOUT';
    mockRegisterGuest.mockRejectedValue(timeoutError);

    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane Doe', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection pool is exhausted', async () => {
    const poolError = new Error('timeout expired: Cannot acquire connection from pool');
    mockRegisterGuest.mockRejectedValue(poolError);

    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane Doe', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection is reset (ECONNRESET)', async () => {
    const resetError = new Error('connection reset');
    (resetError as any).code = 'ECONNRESET';
    mockRegisterGuest.mockRejectedValue(resetError);

    const app = createApp();
    const res = await request(app)
      .post('/api/guests')
      .send({ name: 'Jane Doe', email: 'jane@example.com', rsvpStatus: 'Attending' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('calls registerGuest with correct parameters', async () => {
    const mockGuest = {
      id: 'uuid-1',
      name: 'Test User',
      email: 'test@example.com',
      rsvpStatus: 'Undecided',
      approvalStatus: 'Pending',
      approvalEmailSent: false,
      submittedAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T10:00:00.000Z'),
    };

    mockRegisterGuest.mockResolvedValue({ guest: mockGuest, isUpdate: false });

    const app = createApp();
    await request(app)
      .post('/api/guests')
      .send({ name: 'Test User', email: '  TEST@Example.COM  ', rsvpStatus: 'Undecided' });

    expect(mockRegisterGuest).toHaveBeenCalledWith('Test User', '  TEST@Example.COM  ', 'Undecided');
  });
});

describe('GET /api/guests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with guests sorted by submittedAt DESC and counts', async () => {
    mockGetAllGuests.mockResolvedValue({
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
      counts: {
        attending: 1,
        notAttending: 1,
        total: 2,
      },
    });

    const app = createApp();
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(200);
    expect(res.body.guests).toHaveLength(2);
    expect(res.body.guests[0].name).toBe('Bob');
    expect(res.body.guests[1].name).toBe('Alice');
    expect(res.body.guests[0].submittedAt).toBe('2024-01-16T10:00:00.000Z');
    expect(res.body.guests[1].submittedAt).toBe('2024-01-15T10:00:00.000Z');
    expect(res.body.counts).toEqual({
      attending: 1,
      notAttending: 1,
      total: 2,
    });
  });

  it('returns 200 with empty guests and zero counts when no registrations', async () => {
    mockGetAllGuests.mockResolvedValue({
      guests: [],
      counts: {
        attending: 0,
        notAttending: 0,
        total: 0,
      },
    });

    const app = createApp();
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(200);
    expect(res.body.guests).toHaveLength(0);
    expect(res.body.counts).toEqual({
      attending: 0,
      notAttending: 0,
      total: 0,
    });
  });

  it('returns guest fields in camelCase format', async () => {
    mockGetAllGuests.mockResolvedValue({
      guests: [
        {
          id: 'uuid-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
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
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(200);
    const guest = res.body.guests[0];
    expect(guest).toHaveProperty('id');
    expect(guest).toHaveProperty('name');
    expect(guest).toHaveProperty('email');
    expect(guest).toHaveProperty('rsvpStatus');
    expect(guest).toHaveProperty('approvalStatus');
    expect(guest).toHaveProperty('submittedAt');
    expect(guest).toHaveProperty('updatedAt');
  });

  it('returns 503 when database connection is unavailable (ECONNREFUSED)', async () => {
    const connError = new Error('connection refused');
    (connError as any).code = 'ECONNREFUSED';
    mockGetAllGuests.mockRejectedValue(connError);

    const app = createApp();
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection times out (ETIMEDOUT)', async () => {
    const timeoutError = new Error('connect ETIMEDOUT');
    (timeoutError as any).code = 'ETIMEDOUT';
    mockGetAllGuests.mockRejectedValue(timeoutError);

    const app = createApp();
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection pool is exhausted', async () => {
    const poolError = new Error('timeout expired: Cannot acquire connection from pool');
    mockGetAllGuests.mockRejectedValue(poolError);

    const app = createApp();
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 503 when connection is reset (ECONNRESET)', async () => {
    const resetError = new Error('connection reset');
    (resetError as any).code = 'ECONNRESET';
    mockGetAllGuests.mockRejectedValue(resetError);

    const app = createApp();
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Service temporarily unavailable');
  });

  it('returns 500 when query fails', async () => {
    mockGetAllGuests.mockRejectedValue(new Error('Query failed'));

    const app = createApp();
    const res = await request(app).get('/api/guests');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Could not retrieve data');
  });
});
