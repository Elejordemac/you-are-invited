import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RegistrationForm.module.css';
import HealingPod from './HealingPod';

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

function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Name is required';
  if (trimmed.length > 100) return 'Name must be at most 100 characters';
  return undefined;
}

function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (trimmed.length === 0) return 'Email is required';
  if (trimmed.length > 254) return 'Email must be at most 254 characters';
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount !== 1) return 'Email must contain exactly one "@" symbol';
  const [local, domain] = trimmed.split('@');
  if (!local || local.length === 0) return 'Email must have a local part before "@"';
  if (!domain || domain.length === 0) return 'Email must have a domain after "@"';
  if (!domain.includes('.')) return 'Email domain must contain at least one dot';
  if (domain.startsWith('.') || domain.endsWith('.')) return 'Email domain must not start or end with a dot';
  return undefined;
}

function validateRsvpStatus(status: string): string | undefined {
  if (!status) return 'RSVP status is required';
  if (!RSVP_OPTIONS.includes(status as RsvpStatus)) return 'Invalid RSVP status';
  return undefined;
}

export default function RegistrationForm({ onSubmit }: RegistrationFormProps) {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<'invite' | 'rsvp'>('invite');
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
    if (Object.keys(fieldErrors).length > 0) return;

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

  // SCREEN 1: Invitation
  if (screen === 'invite') {
    return (
      <div className={styles.slide}>
        <div className={styles.inviteContainer}>
          {/* Hex pattern background overlay */}
          <div className={styles.hexOverlay} aria-hidden="true" />

          {/* Healing Pod in background - baby healing behind everything */}
          <div className={styles.healingPodBg} aria-hidden="true">
            <HealingPod />
          </div>

          {/* Background bubbles - underwater feel */}
          <div className={styles.bgBubble} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble2}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble3}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble4}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble5}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble6}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble7}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble8}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble9}`} aria-hidden="true" />
          <div className={`${styles.bgBubble} ${styles.bgBubble10}`} aria-hidden="true" />

          {/* Floating particles */}
          <div className={styles.particle} aria-hidden="true" />
          <div className={`${styles.particle} ${styles.particle2}`} aria-hidden="true" />
          <div className={`${styles.particle} ${styles.particle3}`} aria-hidden="true" />

          <div className={styles.inviteContent}>
            <div className={styles.badge}>YOU'RE INVITED</div>
            
            <h1 className={styles.heroTitle}>
              <span className={styles.titleGlow}>Baby Shower</span>
            </h1>

            <div className={styles.parents}>
              <span className={styles.parentName}>Mark Rhey Elejorde</span>
              <span className={styles.ampersand}>&</span>
              <span className={styles.parentName}>Rochelle Ann Reyos</span>
            </div>

            <div className={styles.divider} aria-hidden="true" />

            <div className={styles.eventInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>📅</span>
                <span className={styles.infoText}>September 5, 2026 &bull; 3:00 PM</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>📍</span>
                <span className={styles.infoText}>Lot 2 Blk 209 Viscara Street, New Lower Bicutan, Taguig City</span>
              </div>
            </div>

            <div className={styles.buttonStack}>
              <button
                className={styles.proceedBtn}
                onClick={() => setScreen('rsvp')}
                type="button"
              >
                <span>ASSEMBLE YOUR RSVP</span>
                <span className={styles.btnArrow}>→</span>
              </button>

              <button
                className={styles.guestListBtn}
                onClick={() => navigate('/guests')}
                type="button"
              >
                <span>VIEW GUEST LIST</span>
              </button>

              <button
                className={styles.guestListBtn}
                onClick={() => navigate('/wishlist')}
                type="button"
              >
                <span>🎁 GIFT IDEAS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: RSVP Form
  return (
    <div className={styles.slide}>
      <div className={styles.rsvpContainer}>
        <div className={styles.hexOverlay} aria-hidden="true" />

        <button
          className={styles.backBtn}
          onClick={() => setScreen('invite')}
          type="button"
        >
          ← Back
        </button>

        <div className={styles.rsvpContent}>
          <div className={styles.rsvpBadge}>RSVP</div>
          <h2 className={styles.rsvpTitle}>Register Your Attendance</h2>

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="reg-name" className={styles.label}>Full Name</label>
              <input
                id="reg-name"
                type="text"
                maxLength={100}
                required
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              {errors.name && <p className={styles.errorText}>{errors.name}</p>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="reg-email" className={styles.label}>Email Address</label>
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
              <label htmlFor="reg-rsvp" className={styles.label}>RSVP Status</label>
              <select
                id="reg-rsvp"
                required
                className={`${styles.select} ${errors.rsvpStatus ? styles.inputError : ''}`}
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value)}
              >
                <option value="">-- Select --</option>
                {RSVP_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.rsvpStatus && <p className={styles.errorText}>{errors.rsvpStatus}</p>}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'SUBMITTING...' : 'CONFIRM RSVP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
