const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface RegisterGuestData {
  name: string;
  email: string;
  rsvpStatus: 'Attending' | 'Not Attending' | 'Undecided';
}

/**
 * Registers a guest by calling POST /api/guests.
 * Returns the raw Response so the caller can inspect status codes (201 vs 200).
 */
export async function registerGuest(data: RegisterGuestData): Promise<Response> {
  const response = await fetch(`${API_BASE}/guests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Fetches admin guest records from GET /api/admin/guests.
 * Requires JWT token for authorization. Supports optional filtering by RSVP status
 * and searching by name/email substring.
 */
export async function fetchAdminGuests(
  token: string,
  params?: { status?: string; search?: string }
): Promise<Response> {
  const url = new URL(`${API_BASE}/admin/guests`, window.location.origin);

  if (params?.status) {
    url.searchParams.set('status', params.status);
  }
  if (params?.search) {
    url.searchParams.set('search', params.search);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
}

/**
 * Authenticates an admin by calling POST /api/admin/login.
 * Returns the raw Response so the caller can inspect status codes (200 vs 401).
 */
export async function loginAdmin(username: string, password: string): Promise<Response> {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  return response;
}

/**
 * Fetches all guests by calling GET /api/guests.
 * Returns the raw Response so the caller can inspect status and parse the body.
 */
export async function fetchGuests(): Promise<Response> {
  const response = await fetch(`${API_BASE}/guests`);
  return response;
}

/**
 * Updates an admin guest record by calling PUT /api/admin/guests/:id.
 * Requires JWT token for authorization.
 */
export async function updateAdminGuest(
  token: string,
  id: string,
  data: { name: string; email: string; rsvpStatus: string }
): Promise<Response> {
  const response = await fetch(`${API_BASE}/admin/guests/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response;
}

/**
 * Deletes an admin guest record by calling DELETE /api/admin/guests/:id.
 * Requires JWT token for authorization.
 */
export async function deleteAdminGuest(token: string, id: string): Promise<Response> {
  const response = await fetch(`${API_BASE}/admin/guests/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
}

/**
 * Approves a guest record by calling POST /api/admin/guests/:id/approve.
 * Requires JWT token for authorization.
 */
export async function approveAdminGuest(token: string, id: string): Promise<Response> {
  const response = await fetch(`${API_BASE}/admin/guests/${id}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
}
