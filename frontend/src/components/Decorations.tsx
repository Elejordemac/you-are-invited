import styles from './Decorations.module.css';

/**
 * Baby bottle SVG icon in blue theme.
 */
export function BabyBottleIcon({ size = 32 }: { size?: number }) {
  return (
    <span className={styles.babyBottle} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bottle body */}
        <rect x="20" y="20" width="24" height="36" rx="6" fill="#90caf9" stroke="#1e88e5" strokeWidth="2" />
        {/* Nipple */}
        <path d="M26 20 L26 14 Q32 8 38 14 L38 20" fill="#42a5f5" stroke="#1565c0" strokeWidth="2" />
        {/* Cap ring */}
        <rect x="24" y="18" width="16" height="4" rx="2" fill="#1e88e5" />
        {/* Measurement lines */}
        <line x1="22" y1="30" x2="28" y2="30" stroke="#1565c0" strokeWidth="1.5" opacity="0.6" />
        <line x1="22" y1="38" x2="28" y2="38" stroke="#1565c0" strokeWidth="1.5" opacity="0.6" />
        <line x1="22" y1="46" x2="28" y2="46" stroke="#1565c0" strokeWidth="1.5" opacity="0.6" />
      </svg>
    </span>
  );
}

/**
 * Pacifier SVG icon in blue theme.
 */
export function PacifierIcon({ size = 32 }: { size?: number }) {
  return (
    <span className={styles.pacifier} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield / mouth guard */}
        <ellipse cx="32" cy="36" rx="16" ry="12" fill="#90caf9" stroke="#1e88e5" strokeWidth="2" />
        {/* Nipple */}
        <ellipse cx="32" cy="48" rx="8" ry="6" fill="#42a5f5" stroke="#1565c0" strokeWidth="2" />
        {/* Ring / handle */}
        <circle cx="32" cy="22" r="8" fill="none" stroke="#1e88e5" strokeWidth="3" />
        {/* Ring highlight */}
        <path d="M27 18 Q32 14 37 18" fill="none" stroke="#42a5f5" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/**
 * Baby footprints SVG icon in blue theme.
 */
export function BabyFootprintsIcon({ size = 48 }: { size?: number }) {
  return (
    <span className={styles.footprints} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left foot */}
        <ellipse cx="28" cy="48" rx="9" ry="14" fill="#90caf9" stroke="#1e88e5" strokeWidth="1.5" />
        {/* Left toes */}
        <circle cx="22" cy="32" r="3.5" fill="#42a5f5" />
        <circle cx="27" cy="30" r="3.5" fill="#42a5f5" />
        <circle cx="32" cy="31" r="3" fill="#42a5f5" />
        <circle cx="36" cy="34" r="2.5" fill="#42a5f5" />

        {/* Right foot */}
        <ellipse cx="54" cy="52" rx="9" ry="14" fill="#90caf9" stroke="#1e88e5" strokeWidth="1.5" />
        {/* Right toes */}
        <circle cx="48" cy="36" r="3.5" fill="#42a5f5" />
        <circle cx="53" cy="34" r="3.5" fill="#42a5f5" />
        <circle cx="58" cy="35" r="3" fill="#42a5f5" />
        <circle cx="62" cy="38" r="2.5" fill="#42a5f5" />
      </svg>
    </span>
  );
}

/**
 * Blue sparkle/star decoration.
 */
export function SparkleIcon({ size = 20, delay = 0 }: { size?: number; delay?: number }) {
  const className = delay === 0
    ? styles.sparkle
    : delay === 1
      ? styles.sparkleDelayed
      : styles.sparkleDelayed2;

  return (
    <span className={className} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z"
          fill="#42a5f5"
          stroke="#1e88e5"
          strokeWidth="1"
        />
      </svg>
    </span>
  );
}

/**
 * Header decorations: baby bottle and pacifier flanking sparkles.
 * Use this near registration form and guest list headers.
 */
export function HeaderDecorations() {
  return (
    <div className={styles.headerDecorations} aria-hidden="true">
      <BabyBottleIcon size={36} />
      <SparkleIcon size={18} delay={0} />
      <SparkleIcon size={14} delay={1} />
      <PacifierIcon size={36} />
    </div>
  );
}

/**
 * Corner decoration with footprints + sparkles.
 * Use this in a relatively-positioned container on the guest list view.
 */
export function CornerFootprints() {
  return (
    <div className={styles.cornerDecoration} aria-hidden="true">
      <BabyFootprintsIcon size={64} />
      <SparkleIcon size={16} delay={2} />
    </div>
  );
}
