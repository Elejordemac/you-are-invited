import { RSVP_STATUSES, ValidationErrorResponse } from '../types';

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a guest name.
 * - Required (non-empty after trimming)
 * - 1-100 characters
 */
export function validateName(name: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (name === undefined || name === null || (typeof name === 'string' && name.trim() === '')) {
    errors.push({ field: 'name', message: 'Name is required' });
    return errors;
  }

  if (typeof name !== 'string') {
    errors.push({ field: 'name', message: 'Name must be a string' });
    return errors;
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (trimmed.length > 100) {
    errors.push({ field: 'name', message: 'Name must be at most 100 characters' });
  }

  return errors;
}

/**
 * Normalizes an email by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates an email address.
 * - Required (non-empty after trimming)
 * - Max 254 characters (after trimming)
 * - Must contain exactly one "@" followed by a domain with at least one dot
 * - Email is normalized (trimmed, lowercased) before validation
 */
export function validateEmail(email: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (email === undefined || email === null || (typeof email === 'string' && email.trim() === '')) {
    errors.push({ field: 'email', message: 'Email is required' });
    return errors;
  }

  if (typeof email !== 'string') {
    errors.push({ field: 'email', message: 'Email must be a string' });
    return errors;
  }

  const normalized = normalizeEmail(email);

  if (normalized.length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
    return errors;
  }

  if (normalized.length > 254) {
    errors.push({ field: 'email', message: 'Email must be at most 254 characters' });
    return errors;
  }

  // Must contain exactly one "@" followed by a domain with at least one dot
  const atCount = (normalized.match(/@/g) || []).length;
  if (atCount !== 1) {
    errors.push({ field: 'email', message: 'Email must contain exactly one "@" symbol' });
    return errors;
  }

  const [local, domain] = normalized.split('@');

  if (!local || local.length === 0) {
    errors.push({ field: 'email', message: 'Email must have a local part before "@"' });
    return errors;
  }

  if (!domain || domain.length === 0) {
    errors.push({ field: 'email', message: 'Email must have a domain after "@"' });
    return errors;
  }

  if (!domain.includes('.')) {
    errors.push({ field: 'email', message: 'Email domain must contain at least one dot' });
    return errors;
  }

  // Domain must not start or end with a dot
  if (domain.startsWith('.') || domain.endsWith('.')) {
    errors.push({ field: 'email', message: 'Email domain must not start or end with a dot' });
    return errors;
  }

  return errors;
}

/**
 * Validates an RSVP status value.
 * - Required
 * - Must be one of 'Attending', 'Not Attending', 'Undecided'
 */
export function validateRsvpStatus(status: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (status === undefined || status === null || (typeof status === 'string' && status.trim() === '')) {
    errors.push({ field: 'rsvpStatus', message: 'RSVP status is required' });
    return errors;
  }

  if (typeof status !== 'string') {
    errors.push({ field: 'rsvpStatus', message: 'RSVP status must be a string' });
    return errors;
  }

  if (!RSVP_STATUSES.includes(status as any)) {
    errors.push({
      field: 'rsvpStatus',
      message: `RSVP status must be one of: ${RSVP_STATUSES.join(', ')}`,
    });
  }

  return errors;
}

/**
 * Validates a full registration request.
 * Returns a structured error response with all validation errors.
 */
export function validateRegistration(data: any): ValidationErrorResponse | null {
  const errors: ValidationError[] = [];

  const name = data?.name;
  const email = data?.email;
  const rsvpStatus = data?.rsvpStatus;

  errors.push(...validateName(name));
  errors.push(...validateEmail(email));
  errors.push(...validateRsvpStatus(rsvpStatus));

  if (errors.length > 0) {
    return { errors };
  }

  return null;
}
