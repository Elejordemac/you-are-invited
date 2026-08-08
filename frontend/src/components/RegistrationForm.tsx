import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RegistrationForm.module.css';
import HealingPod from './HealingPod';

type RsvpStatus = 'Attending' | 'Not Attending' | 'Undecided';

export interface RegistrationData {
  name: string;
  email: string;
  rsvpStatus: RsvpStatus;
  companions: number;
  dietaryRestrictions: string;
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

// Target date: September 5, 2026 at 3:00 PM Manila time (UTC+8)
const EVENT_DATE = new Date('2026-09-05T15:00:00+08:00');

function getTimeRemaining() {
  const now = new Date();
  const diff = EVENT_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

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
  const [companions, setCompanions] = useState(0);
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

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
        companions,
        dietaryRestrictions: dietaryRestrictions.trim(),
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

          {/* Healing Pod in background - baby hero reveal then fade to bg */}
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
            <div className={`${styles.badge} ${styles.animateIn}`} style={{ animationDelay: '2s' }}>YOU'RE INVITED</div>
            
            <h1 className={`${styles.heroTitle} ${styles.animateIn}`} style={{ animationDelay: '2.2s' }}>
              <span className={styles.titleGlow}>Baby Shower</span>
            </h1>

            <div className={`${styles.parents} ${styles.animateIn}`} style={{ animationDelay: '2.4s' }}>
              <span className={styles.parentName}>Mark Rhey Elejorde</span>
              <span className={styles.ampersand}>&</span>
              <span className={styles.parentName}>Rochelle Ann Reyos</span>
            </div>

            <div className={`${styles.divider} ${styles.animateIn}`} style={{ animationDelay: '2.6s' }} aria-hidden="true" />

            <div className={`${styles.eventInfo} ${styles.animateIn}`} style={{ animationDelay: '2.7s' }}>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>📅</span>
                <span className={styles.infoText}>September 5, 2026 &bull; 3:00 PM</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>📍</span>
                <span className={styles.infoText}>Lot 2 Blk 209 Viscara Street, New Lower Bicutan, Taguig City</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>🗺️</span>
                <a href="https://www.google.com/maps/search/?api=1&query=Lot+2+Blk+209+Viscara+Street+New+Lower+Bicutan+Taguig+City" target="_blank" rel="noopener noreferrer" className={styles.infoLink}>View on Google Maps</a>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>📞</span>
                <a href="tel:09616987756" className={styles.infoLink}>0961 698 7756</a>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className={`${styles.countdown} ${styles.animateIn}`} style={{ animationDelay: '2.9s' }}>
              <div className={styles.countdownRow}>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeRemaining.days}</span>
                  <span className={styles.countdownLabel}>days</span>
                </div>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeRemaining.hours}</span>
                  <span className={styles.countdownLabel}>hours</span>
                </div>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeRemaining.minutes}</span>
                  <span className={styles.countdownLabel}>min</span>
                </div>
                <div className={styles.countdownBlock}>
                  <span className={styles.countdownNumber}>{timeRemaining.seconds}</span>
                  <span className={styles.countdownLabel}>sec</span>
                </div>
              </div>
              <p className={styles.countdownText}>until the Baby Shower!</p>
            </div>

            <div className={`${styles.buttonStack} ${styles.animateIn}`} style={{ animationDelay: '3.1s' }}>
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

            <div className={styles.fieldGroup}>
              <label htmlFor="reg-companions" className={styles.label}>Number of Companions (optional)</label>
              <input
                id="reg-companions"
                type="number"
                min={0}
                max={5}
                className={styles.input}
                value={companions === 0 ? '' : companions}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    setCompanions(0);
                    return;
                  }
                  const val = Math.max(0, Math.min(5, parseInt(raw) || 0));
                  setCompanions(val);
                }}
                placeholder="0"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="reg-dietary" className={styles.label}>Dietary Restrictions / Allergies (optional)</label>
              <textarea
                id="reg-dietary"
                maxLength={200}
                className={styles.textarea}
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="e.g., Vegetarian, No peanuts..."
                rows={3}
              />
              <span className={styles.charCount}>{dietaryRestrictions.length}/200</span>
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
