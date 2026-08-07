// RSVP Status union type
export type RsvpStatus = 'Attending' | 'Not Attending' | 'Undecided';

// Approval Status union type
export type ApprovalStatus = 'Pending' | 'Approved';

// Valid RSVP status values (for runtime validation)
export const RSVP_STATUSES: RsvpStatus[] = ['Attending', 'Not Attending', 'Undecided'];

// Valid approval status values (for runtime validation)
export const APPROVAL_STATUSES: ApprovalStatus[] = ['Pending', 'Approved'];

/**
 * Represents a guest registration record stored in the database.
 */
export interface GuestRecord {
  id: string;                 // UUID primary key
  name: string;               // 1-100 characters
  email: string;              // unique, case-insensitive, max 254 chars
  rsvpStatus: RsvpStatus;
  approvalStatus: ApprovalStatus;
  approvalEmailSent: boolean; // tracks whether approval email was sent
  companions: number;         // 0-5 number of companions
  dietaryRestrictions: string; // optional, max 200 chars
  submittedAt: Date;          // UTC timestamp, second precision
  updatedAt: Date;            // UTC timestamp of last update
}

/**
 * Represents an admin user record stored in the database.
 */
export interface AdminRecord {
  id: string;           // UUID primary key
  username: string;     // unique
  passwordHash: string; // bcrypt hash
}

/**
 * Request body for POST /api/guests (guest self-registration).
 */
export interface RegisterGuestRequest {
  name: string;        // 1-100 characters
  email: string;       // valid email, max 254 characters
  rsvpStatus: RsvpStatus;
}

/**
 * Response body for POST /api/guests (201 Created or 200 Updated).
 */
export interface RegisterGuestResponse {
  message: string;     // Confirmation message (new or updated)
  guest: {
    id: string;
    name: string;
    email: string;
    rsvpStatus: RsvpStatus;
    approvalStatus: ApprovalStatus;
    submittedAt: string; // ISO 8601 UTC
  };
}

/**
 * Response body for validation errors (400 Bad Request).
 */
export interface ValidationErrorResponse {
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Request body for POST /api/admin/login.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response body for POST /api/admin/login (200 OK).
 */
export interface LoginResponse {
  token: string; // JWT
}

/**
 * Response body for POST /api/admin/guests/:id/approve (200 OK).
 */
export interface ApproveResponse {
  message: string;
  guest: GuestRecord;
  emailSent: boolean;       // false if email failed
  emailWarning?: string;    // present if email failed
}
