import styles from './HealingPod.module.css';

/**
 * Dragon Ball Z-inspired Healing Pod / Rejuvenation Tank.
 * A baby floating inside a circular pod with bubbles, tubes, and blue liquid.
 * Uses inline SVG with CSS animations for bubbles.
 */
export default function HealingPod() {
  return (
    <div className={styles.podWrapper} aria-hidden="true">
      <svg
        viewBox="0 0 300 400"
        className={styles.podSvg}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pod outer frame */}
        <defs>
          <radialGradient id="liquidGradient" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#1e88e5" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#0d47a1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#002171" stopOpacity="0.8" />
          </radialGradient>
          <radialGradient id="glassGradient" cx="30%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(144, 202, 249, 0.15)" />
            <stop offset="100%" stopColor="rgba(13, 71, 161, 0.05)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pod stand/base */}
        <rect x="110" y="360" width="80" height="12" rx="6" fill="#263238" />
        <rect x="120" y="350" width="60" height="14" rx="4" fill="#37474f" />
        <rect x="130" y="342" width="40" height="12" rx="3" fill="#455a64" />

        {/* Tubes coming from bottom */}
        <path
          d="M 130 342 Q 100 320 90 280"
          fill="none"
          stroke="#546e7a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 170 342 Q 200 320 210 280"
          fill="none"
          stroke="#546e7a"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Tube connectors */}
        <circle cx="90" cy="278" r="5" fill="#78909c" />
        <circle cx="210" cy="278" r="5" fill="#78909c" />

        {/* Main circular pod glass */}
        <ellipse
          cx="150"
          cy="190"
          rx="110"
          ry="130"
          fill="url(#liquidGradient)"
          stroke="#455a64"
          strokeWidth="6"
        />

        {/* Glass reflection overlay */}
        <ellipse
          cx="150"
          cy="190"
          rx="106"
          ry="126"
          fill="url(#glassGradient)"
        />

        {/* Pod rim highlight */}
        <ellipse
          cx="150"
          cy="190"
          rx="110"
          ry="130"
          fill="none"
          stroke="#90caf9"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Baby silhouette - curled up fetal position */}
        <g filter="url(#glow)" opacity="0.85">
          {/* Baby body (torso) */}
          <ellipse cx="150" cy="200" rx="22" ry="28" fill="#ffcc80" />
          {/* Baby head */}
          <circle cx="150" cy="168" r="18" fill="#ffe0b2" />
          {/* Baby eyes (closed, sleeping) */}
          <path d="M 143 166 Q 145 168 147 166" fill="none" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 153 166 Q 155 168 157 166" fill="none" stroke="#5d4037" strokeWidth="1.5" strokeLinecap="round" />
          {/* Baby mouth (peaceful smile) */}
          <path d="M 147 174 Q 150 176 153 174" fill="none" stroke="#8d6e63" strokeWidth="1" strokeLinecap="round" />
          {/* Left arm curled */}
          <path d="M 132 195 Q 125 185 130 175" fill="none" stroke="#ffcc80" strokeWidth="7" strokeLinecap="round" />
          {/* Right arm curled */}
          <path d="M 168 195 Q 175 185 170 175" fill="none" stroke="#ffcc80" strokeWidth="7" strokeLinecap="round" />
          {/* Left leg curled */}
          <path d="M 138 220 Q 130 232 135 240" fill="none" stroke="#ffcc80" strokeWidth="7" strokeLinecap="round" />
          {/* Right leg curled */}
          <path d="M 162 220 Q 170 232 165 240" fill="none" stroke="#ffcc80" strokeWidth="7" strokeLinecap="round" />
          {/* Diaper */}
          <ellipse cx="150" cy="225" rx="16" ry="10" fill="#e3f2fd" opacity="0.8" />
        </g>

        {/* Breathing mask/tube */}
        <path
          d="M 150 178 L 150 250 Q 150 270 140 290 Q 130 310 130 342"
          fill="none"
          stroke="#b0bec5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="none"
        />
        {/* Mask piece */}
        <ellipse cx="150" cy="177" rx="7" ry="5" fill="#78909c" opacity="0.8" />

        {/* Animated bubbles */}
        <circle className={styles.bubble1} cx="120" cy="280" r="4" fill="#42a5f5" opacity="0.6" />
        <circle className={styles.bubble2} cx="170" cy="260" r="3" fill="#90caf9" opacity="0.5" />
        <circle className={styles.bubble3} cx="140" cy="290" r="5" fill="#64b5f6" opacity="0.4" />
        <circle className={styles.bubble4} cx="180" cy="270" r="3.5" fill="#42a5f5" opacity="0.5" />
        <circle className={styles.bubble5} cx="130" cy="250" r="2.5" fill="#bbdefb" opacity="0.6" />
        <circle className={styles.bubble6} cx="160" cy="285" r="4.5" fill="#1e88e5" opacity="0.3" />
        <circle className={styles.bubble7} cx="155" cy="300" r="2" fill="#90caf9" opacity="0.7" />
        <circle className={styles.bubble8} cx="145" cy="240" r="3" fill="#64b5f6" opacity="0.4" />

        {/* Top cap / seal */}
        <ellipse cx="150" cy="62" rx="50" ry="8" fill="#37474f" />
        <rect x="100" y="56" width="100" height="10" rx="5" fill="#455a64" />

        {/* Status light */}
        <circle cx="150" cy="52" r="4" fill="#4caf50" className={styles.statusLight} />
      </svg>
    </div>
  );
}
