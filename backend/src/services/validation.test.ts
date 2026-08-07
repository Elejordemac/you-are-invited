import { describe, it, expect } from 'vitest';
import {
  validateName,
  validateEmail,
  validateRsvpStatus,
  validateRegistration,
  normalizeEmail,
} from './validation';

describe('ValidationService', () => {
  describe('validateName', () => {
    it('returns error when name is undefined', () => {
      const errors = validateName(undefined);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'name', message: 'Name is required' });
    });

    it('returns error when name is null', () => {
      const errors = validateName(null);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
    });

    it('returns error when name is empty string', () => {
      const errors = validateName('');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
      expect(errors[0].message).toContain('required');
    });

    it('returns error when name is only whitespace', () => {
      const errors = validateName('   ');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
    });

    it('returns no errors for valid name with 1 character', () => {
      const errors = validateName('A');
      expect(errors).toHaveLength(0);
    });

    it('returns no errors for valid name with 100 characters', () => {
      const errors = validateName('A'.repeat(100));
      expect(errors).toHaveLength(0);
    });

    it('returns error for name exceeding 100 characters', () => {
      const errors = validateName('A'.repeat(101));
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
      expect(errors[0].message).toContain('100');
    });

    it('returns error when name is not a string', () => {
      const errors = validateName(123);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('name');
    });
  });

  describe('normalizeEmail', () => {
    it('trims whitespace', () => {
      expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('converts to lowercase', () => {
      expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
    });

    it('trims and lowercases together', () => {
      expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com');
    });
  });

  describe('validateEmail', () => {
    it('returns error when email is undefined', () => {
      const errors = validateEmail(undefined);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'email', message: 'Email is required' });
    });

    it('returns error when email is empty string', () => {
      const errors = validateEmail('');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toContain('required');
    });

    it('returns error when email exceeds 254 characters', () => {
      const longEmail = 'a'.repeat(243) + '@example.com'; // 255 chars
      const errors = validateEmail(longEmail);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toContain('254');
    });

    it('returns error when email has no "@"', () => {
      const errors = validateEmail('userexample.com');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toContain('@');
    });

    it('returns error when email has multiple "@"', () => {
      const errors = validateEmail('user@@example.com');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toContain('@');
    });

    it('returns error when email has no dot in domain', () => {
      const errors = validateEmail('user@localhost');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
      expect(errors[0].message).toContain('dot');
    });

    it('returns error when domain starts with a dot', () => {
      const errors = validateEmail('user@.example.com');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
    });

    it('returns error when domain ends with a dot', () => {
      const errors = validateEmail('user@example.com.');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
    });

    it('returns no errors for valid email', () => {
      const errors = validateEmail('user@example.com');
      expect(errors).toHaveLength(0);
    });

    it('validates email after normalization (case-insensitive)', () => {
      const errors = validateEmail('User@Example.COM');
      expect(errors).toHaveLength(0);
    });

    it('validates email after trimming whitespace', () => {
      const errors = validateEmail('  user@example.com  ');
      expect(errors).toHaveLength(0);
    });

    it('returns error when email is not a string', () => {
      const errors = validateEmail(42);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
    });

    it('returns error for email with no local part', () => {
      const errors = validateEmail('@example.com');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('email');
    });
  });

  describe('validateRsvpStatus', () => {
    it('returns error when status is undefined', () => {
      const errors = validateRsvpStatus(undefined);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({ field: 'rsvpStatus', message: 'RSVP status is required' });
    });

    it('returns error when status is empty string', () => {
      const errors = validateRsvpStatus('');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('rsvpStatus');
    });

    it('returns error for invalid status value', () => {
      const errors = validateRsvpStatus('Maybe');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('rsvpStatus');
      expect(errors[0].message).toContain('Attending');
    });

    it('returns no errors for "Attending"', () => {
      expect(validateRsvpStatus('Attending')).toHaveLength(0);
    });

    it('returns no errors for "Not Attending"', () => {
      expect(validateRsvpStatus('Not Attending')).toHaveLength(0);
    });

    it('returns no errors for "Undecided"', () => {
      expect(validateRsvpStatus('Undecided')).toHaveLength(0);
    });

    it('returns error for case-sensitive mismatch', () => {
      const errors = validateRsvpStatus('attending');
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('rsvpStatus');
    });
  });

  describe('validateRegistration', () => {
    it('returns null for valid registration data', () => {
      const result = validateRegistration({
        name: 'John Doe',
        email: 'john@example.com',
        rsvpStatus: 'Attending',
      });
      expect(result).toBeNull();
    });

    it('returns errors for completely empty data', () => {
      const result = validateRegistration({});
      expect(result).not.toBeNull();
      expect(result!.errors).toHaveLength(3);
      const fields = result!.errors.map((e) => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('email');
      expect(fields).toContain('rsvpStatus');
    });

    it('returns errors for null data', () => {
      const result = validateRegistration(null);
      expect(result).not.toBeNull();
      expect(result!.errors).toHaveLength(3);
    });

    it('returns errors for undefined data', () => {
      const result = validateRegistration(undefined);
      expect(result).not.toBeNull();
      expect(result!.errors).toHaveLength(3);
    });

    it('returns errors only for invalid fields', () => {
      const result = validateRegistration({
        name: 'Jane',
        email: 'invalid-email',
        rsvpStatus: 'Attending',
      });
      expect(result).not.toBeNull();
      expect(result!.errors).toHaveLength(1);
      expect(result!.errors[0].field).toBe('email');
    });

    it('returns multiple errors when multiple fields are invalid', () => {
      const result = validateRegistration({
        name: '',
        email: 'no-at-sign',
        rsvpStatus: 'Invalid',
      });
      expect(result).not.toBeNull();
      expect(result!.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
