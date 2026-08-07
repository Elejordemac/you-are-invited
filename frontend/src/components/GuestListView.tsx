import { useNavigate } from 'react-router-dom';
import styles from './GuestListView.module.css';
import { CornerFootprints, HeaderDecorations } from './Decorations';

export interface Guest {
  id: string;
  name: string;
  email: string;
  rsvpStatus: 'Attending' | 'Not Attending' | 'Undecided';
  approvalStatus: 'Pending' | 'Approved';
  submittedAt: string; // ISO 8601 UTC
}

export interface GuestCounts {
  attending: number;
  notAttending: number;
  total: number;
}

interface GuestListViewProps {
  guests: Guest[];
  counts: GuestCounts;
}

/**
 * Formats an ISO date string into a readable local date/time.
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns the appropriate CSS class for an RSVP status badge.
 */
function getRsvpBadgeClass(status: Guest['rsvpStatus']): string {
  switch (status) {
    case 'Attending':
      return styles.badgeAttending;
    case 'Not Attending':
      return styles.badgeNotAttending;
    case 'Undecided':
      return styles.badgeUndecided;
  }
}

/**
 * Returns the appropriate CSS class for an approval status badge.
 */
function getApprovalBadgeClass(status: Guest['approvalStatus']): string {
  switch (status) {
    case 'Approved':
      return styles.badgeApproved;
    case 'Pending':
      return styles.badgePending;
  }
}

/**
 * GuestListView displays all registered guests in a table with RSVP
 * and approval status badges, along with attendance summary counts.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */
export default function GuestListView({ guests, counts }: GuestListViewProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <button
        className={styles.backBtn}
        onClick={() => navigate('/')}
        type="button"
      >
        ← Back
      </button>

      <div className={styles.header}>
        <HeaderDecorations />
        <h2 className={styles.title}>Guest List</h2>
        <div className={styles.countsBar}>
          <span className={styles.countItem}>
            Attending: <span className={styles.countValue}>{counts.attending}</span>
          </span>
          <span className={styles.separator}>|</span>
          <span className={styles.countItem}>
            Not Attending: <span className={styles.countValue}>{counts.notAttending}</span>
          </span>
          <span className={styles.separator}>|</span>
          <span className={styles.countItem}>
            Total: <span className={styles.countValue}>{counts.total}</span>
          </span>
        </div>
      </div>

      {guests.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <p className={styles.emptyMessage}>No guests have registered yet.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>RSVP Status</th>
                <th>Approval Status</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id}>
                  <td data-label="Name">{guest.name}</td>
                  <td data-label="Email">{guest.email}</td>
                  <td data-label="RSVP">
                    <span className={`${styles.badge} ${getRsvpBadgeClass(guest.rsvpStatus)}`}>
                      {guest.rsvpStatus}
                    </span>
                  </td>
                  <td data-label="Approval">
                    <span className={`${styles.badge} ${getApprovalBadgeClass(guest.approvalStatus)}`}>
                      {guest.approvalStatus}
                    </span>
                  </td>
                  <td data-label="Registered">{formatTimestamp(guest.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CornerFootprints />
    </div>
  );
}
