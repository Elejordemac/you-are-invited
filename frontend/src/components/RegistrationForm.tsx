import { useState, FormEvent } from 'react';
import styles from './RegistrationForm.module.css';
import { HeaderDecorations } from './Decorations';

type RsvpStatus = 'Attending' | 'Not Attending' | 'Undecided';

export interface RegistrationData {
  name: string;
  email: string;
  rsvpStatus: RsvpStatus;
}

interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => Promise<void> | void;
}

interface FieldErrors {
  name?: string;
  email?: string;
  rsvpStatus?: string;
}

const RSVP_OPTIONS: RsvpStatus[] = ['Attending', 'Not Attending', 'Undecided'];

/**
 * Validates a name field.
 * Required, 1-100 characters.
 */
function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return 'Name is required';
  }
  if (trimmed.length > 100) {
    return 'Name must be at most 100 characters';
  }
  return undefined;
}

/**
 * Validates an email field.
 * Required, max 254 chars, exactly one "@" followed by domain with at least one dot.
 */
function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return 'Email is required';
  }
  if (trimmed.length > 254) {
    return 'Email must be at most 254 characters';
  }

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) {
    return 'Email must contain exactly one "@" symbol';
  }

  const [local, domain] = trimmed.split('@');
  if (!local || local.length === 0) {
    return 'Email must have a local part before "@"';
  }
  if (!domain || domain.length === 0) {
    return 'Email must have a domain after "@"';
  }
  if (!domain.includes('.')) {
    return 'Email domain must contain at least one dot';
  }
  if (domain.startsWith('.') || domain.endsWith('.')) {
    return 'Email domain must not start or end with a dot';
  }

  return undefined;
}

/**
 * Validates the RSVP status selection.
 */
function validateRsvpStatus(status: string): string | undefined {
  if (!status) {
    return 'RSVP status is required';
  }
  if (!RSVP_OPTIONS.includes(status as RsvpStatus)) {
    return 'RSVP status must be one of: Attending, Not Attending, Undecided';
  }
  return undefined;
}

export default function RegistrationForm({ onSubmit }: RegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate(): FieldErrors {
    const fieldErrors: FieldErrors = {};
    const nameError = validateName(name);
    if (nameError) fieldErrors.name = nameError;

    const emailError = validateEmail(email);
    if (emailError) fieldErrors.email = emailError;

    const rsvpError = validateRsvpStatus(rsvpStatus);
    if (rsvpError) fieldErrors.rsvpStatus = rsvpError;

    return fieldErrors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const fieldErrors = validate();
    setErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        rsvpStatus: rsvpStatus as RsvpStatus,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.eventDetails}>
        <HeaderDecorations />
        <h1 className={styles.eventTitle}>
          Mark Rhey Elejorde &amp; Rochelle Ann Reyos's Baby Shower
        </h1>
        <p className={styles.eventDateTime}>September 26, 2025 at 3:00 PM</p>
        <p className={styles.eventLocation}>
          Lot 2 Blk 209 Viscara Street, New Lower Bicutan, Taguig City
        </p>
      </div>

      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.formTitle}>RSVP Registration</h2>

        <div className={styles.fieldGroup}>
          <label htmlFor="reg-name" className={styles.label}>
            Name
          </label>
          <input
            id="reg-name"
            type="text"
            maxLength={100}
            required
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />
          {errors.name && <p className={styles.errorText}>{errors.name}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="reg-email" className={styles.label}>
            Email
          </label>
          <input
            id="reg-email"
            type="text"
            maxLength={254}
            required
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
          {errors.email && <p className={styles.errorText}>{errors.email}</p>}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="reg-rsvp" className={styles.label}>
            RSVP Status
          </label>
          <select
            id="reg-rsvp"
            required
            className={`${styles.select} ${errors.rsvpStatus ? styles.inputError : ''}`}
            value={rsvpStatus}
            onChange={(e) => setRsvpStatus(e.target.value)}
          >
            <option value="">-- Select your RSVP --</option>
            {RSVP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.rsvpStatus && <p className={styles.errorText}>{errors.rsvpStatus}</p>}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit RSVP'}
        </button>
      </form>
    </div>
  );
}
