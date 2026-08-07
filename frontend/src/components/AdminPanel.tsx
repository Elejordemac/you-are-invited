import { useEffect, useState, useCallback } from 'react';
import { fetchAdminGuests } from '../api';
import styles from './AdminPanel.module.css';

export interface AdminGuest {
  id: string;
  name: string;
  email: string;
  rsvpStatus: 'Attending' | 'Not Attending' | 'Undecided';
  approvalStatus: 'Pending' | 'Approved';
  approvalEmailSent: boolean;
  submittedAt: string;
  updatedAt: string;
}

interface AdminGuestCounts {
  attending: number;
  notAttending: number;
  total: number;
}

export type { AdminGuestCounts };

interface AdminPanelProps {
  token: string;
  guests?: AdminGuest[];
  counts?: AdminGuestCounts;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit?: (guest: AdminGuest) => void;
  onDelete?: (guest: AdminGuest) => void;
  onApprove?: (guest: AdminGuest) => void;
  onSendEmail?: (guest: AdminGuest) => void;
  approvingId?: string | null;
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
function getRsvpBadgeClass(status: AdminGuest['rsvpStatus']): string {
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
function getApprovalBadgeClass(status: AdminGuest['approvalStatus']): string {
  switch (status) {
    case 'Approved':
      return styles.badgeApproved;
    case 'Pending':
      return styles.badgePending;
  }
}

/**
 * AdminPanel displays all guest registrations in a table for administrators.
 * Features:
 * - Fetches guests from GET /api/admin/guests on mount with JWT auth
 * - Displays guests in a table with status badges
 * - Shows "Approve" button only for Pending guests
 * - Shows "Edit" and "Delete" buttons for all guests
 * - Shows counts summary at the top
 *
 * Requirements: 6.4, 6.16, 6.17
 */
export default function AdminPanel({ token, guests: propGuests, counts: propCounts, loading: propLoading, error: propError, onRetry, onEdit, onDelete, onApprove, onSendEmail, approvingId }: AdminPanelProps) {
  const [internalGuests, setInternalGuests] = useState<AdminGuest[]>([]);
  const [internalCounts, setInternalCounts] = useState<AdminGuestCounts>({ attending: 0, notAttending: 0, total: 0 });
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Use props if provided (managed mode), otherwise use internal state (self-fetching mode)
  const isManaged = propGuests !== undefined;
  const guests = isManaged ? propGuests : internalGuests;
  const counts = propCounts ?? internalCounts;
  const loading = propLoading ?? internalLoading;
  const error = propError ?? internalError;

  const loadGuests = useCallback(async () => {
    if (isManaged) return; // Don't self-fetch in managed mode

    setInternalLoading(true);
    setInternalError(null);

    try {
      const response = await fetchAdminGuests(token);

      if (response.status === 401) {
        setInternalError('Authentication failed. Please log in again.');
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setInternalError(body.error || 'Could not retrieve guest data.');
        return;
      }

      const body = await response.json();
      setInternalGuests(body.guests || []);
      setInternalCounts(body.counts || { attending: 0, notAttending: 0, total: 0 });
    } catch {
      setInternalError('Unable to connect to the server. Please try again.');
    } finally {
      setInternalLoading(false);
    }
  }, [token, isManaged]);

  useEffect(() => {
    if (!isManaged) {
      loadGuests();
    }
  }, [loadGuests, isManaged]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading guest records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryBtn} onClick={onRetry ?? loadGuests}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Admin Panel</h2>
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
          <p className={styles.emptyMessage}>No guest records found.</p>
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
                <th>Actions</th>
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
                  <td data-label="Actions">
                    <div className={styles.actions}>
                      {guest.approvalStatus === 'Pending' && (
                        <button
                          className={styles.btnApprove}
                          onClick={() => onApprove?.(guest)}
                          aria-label={`Approve ${guest.name}`}
                          disabled={approvingId === guest.id}
                        >
                          {approvingId === guest.id ? 'Approving...' : 'Approve'}
                        </button>
                      )}
                      {guest.approvalStatus === 'Approved' && (
                        <button
                          className={styles.btnApprove}
                          onClick={() => onSendEmail?.(guest)}
                          aria-label={`Send email to ${guest.name}`}
                          disabled={approvingId === guest.id}
                        >
                          {approvingId === guest.id ? 'Sending...' : '📧 Email'}
                        </button>
                      )}
                      <button
                        className={styles.btnEdit}
                        onClick={() => onEdit?.(guest)}
                        aria-label={`Edit ${guest.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => onDelete?.(guest)}
                        aria-label={`Delete ${guest.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
