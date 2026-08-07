import { useState, useCallback, useEffect, FormEvent } from 'react';
import AdminLogin from '../components/AdminLogin';
import AdminPanel, { AdminGuest } from '../components/AdminPanel';
import {
  fetchAdminGuests,
  updateAdminGuest,
  deleteAdminGuest,
  approveAdminGuest,
} from '../api';
import styles from './AdminPage.module.css';

type RsvpFilter = '' | 'Attending' | 'Not Attending' | 'Undecided';

interface EditFormData {
  name: string;
  email: string;
  rsvpStatus: 'Attending' | 'Not Attending' | 'Undecided';
}

interface EditFormErrors {
  name?: string;
  email?: string;
  rsvpStatus?: string;
}

/**
 * AdminPage composes the AdminLogin and AdminPanel components.
 * It manages:
 * - Authentication flow (shows login when no token, panel when authenticated)
 * - Filter/search bar for RSVP status and name/email search
 * - Edit modal for updating guest records
 * - Delete confirmation for removing guest records
 * - Approve action for approving pending registrations
 *
 * Requirements: 6.1-6.17, 7.4
 */
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RsvpFilter>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Guest data
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [counts, setCounts] = useState({ attending: 0, notAttending: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit modal state
  const [editingGuest, setEditingGuest] = useState<AdminGuest | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({ name: '', email: '', rsvpStatus: 'Attending' });
  const [editErrors, setEditErrors] = useState<EditFormErrors>({});
  const [editServerError, setEditServerError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Status messages
  const [successMessage, setSuccessMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  function handleLoginSuccess(newToken: string) {
    setToken(newToken);
  }

  function handleAuthFailure() {
    setToken(null);
  }

  // Auto-clear status messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Load guests with filter/search params
  const loadGuests = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setLoadError(null);

    try {
      const params: { status?: string; search?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const response = await fetchAdminGuests(token, params);

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setLoadError(body.error || 'Could not retrieve guest data.');
        return;
      }

      const body = await response.json();
      setGuests(body.guests || []);
      setCounts(body.counts || { attending: 0, notAttending: 0, total: 0 });
    } catch {
      setLoadError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, searchQuery]);

  // Load guests when token, filter, or search changes
  useEffect(() => {
    if (token) {
      loadGuests();
    }
  }, [token, loadGuests]);

  // --- Edit functionality ---

  function validateEditForm(data: EditFormData): EditFormErrors {
    const errors: EditFormErrors = {};

    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailTrimmed = data.email.trim();
      if (emailTrimmed.length > 254) {
        errors.email = 'Email must be 254 characters or less';
      } else {
        // Check email format: exactly one @ followed by domain with at least one dot
        const atParts = emailTrimmed.split('@');
        if (atParts.length !== 2 || !atParts[0] || !atParts[1]) {
          errors.email = 'Invalid email format';
        } else if (!atParts[1].includes('.')) {
          errors.email = 'Invalid email format';
        }
      }
    }

    const validStatuses = ['Attending', 'Not Attending', 'Undecided'];
    if (!validStatuses.includes(data.rsvpStatus)) {
      errors.rsvpStatus = 'Invalid RSVP status';
    }

    return errors;
  }

  function handleEditClick(guest: AdminGuest) {
    setEditingGuest(guest);
    setEditForm({
      name: guest.name,
      email: guest.email,
      rsvpStatus: guest.rsvpStatus,
    });
    setEditErrors({});
    setEditServerError('');
  }

  function handleEditCancel() {
    setEditingGuest(null);
    setEditErrors({});
    setEditServerError('');
  }

  async function handleEditSave(e: FormEvent) {
    e.preventDefault();

    if (!editingGuest || !token) return;

    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditSaving(true);
    setEditServerError('');

    try {
      const response = await updateAdminGuest(token, editingGuest.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        rsvpStatus: editForm.rsvpStatus,
      });

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (response.status === 409) {
        setEditServerError('Email address is already in use by another guest.');
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setEditServerError(body.error || 'Could not save changes. Please try again.');
        return;
      }

      // Success - update local state
      setEditingGuest(null);
      setSuccessMessage('Guest record updated successfully.');
      await loadGuests();
    } catch {
      setEditServerError('Unable to connect to the server. Please try again.');
    } finally {
      setEditSaving(false);
    }
  }

  // --- Delete functionality ---

  async function handleDeleteClick(guest: AdminGuest) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the registration for "${guest.name}" (${guest.email})? This action cannot be undone.`
    );

    if (!confirmed || !token) return;

    try {
      const response = await deleteAdminGuest(token, guest.id);

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setErrorMessage(body.error || 'Could not delete the guest record. Please try again.');
        return;
      }

      // Success - remove from local state
      setGuests((prev) => prev.filter((g) => g.id !== guest.id));
      setSuccessMessage(`Guest "${guest.name}" has been deleted.`);
      // Reload to update counts
      await loadGuests();
    } catch {
      setErrorMessage('Unable to connect to the server. Please try again.');
    }
  }

  // --- Approve functionality ---

  async function handleApproveClick(guest: AdminGuest) {
    if (!token) return;

    try {
      const response = await approveAdminGuest(token, guest.id);

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setErrorMessage(body.error || 'Could not approve the guest. Please try again.');
        return;
      }

      const body = await response.json();

      // Check if email was sent successfully
      if (body.emailSent === false && body.emailWarning) {
        setWarningMessage(body.emailWarning);
      } else {
        setSuccessMessage(`Guest "${guest.name}" has been approved.`);
      }

      // Update local state
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id ? { ...g, approvalStatus: 'Approved' as const } : g
        )
      );
    } catch {
      setErrorMessage('Unable to connect to the server. Please try again.');
    }
  }

  // --- Render ---

  if (!token) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <h1 className={styles.pageTitle}>Admin Panel</h1>
        <button className={styles.logoutBtn} onClick={() => setToken(null)}>
          Log Out
        </button>
      </div>

      {/* Status messages */}
      {successMessage && (
        <div className={`${styles.statusMessage} ${styles.successMessage}`} role="status">
          {successMessage}
        </div>
      )}
      {warningMessage && (
        <div className={`${styles.statusMessage} ${styles.warningMessage}`} role="alert">
          ⚠️ {warningMessage}
        </div>
      )}
      {errorMessage && (
        <div className={`${styles.statusMessage} ${styles.errorBanner}`} role="alert">
          {errorMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <label className={styles.filterLabel} htmlFor="rsvp-filter">
          RSVP Status:
        </label>
        <select
          id="rsvp-filter"
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RsvpFilter)}
        >
          <option value="">All</option>
          <option value="Attending">Attending</option>
          <option value="Not Attending">Not Attending</option>
          <option value="Undecided">Undecided</option>
        </select>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search guests by name or email"
        />
      </div>

      {/* Admin Panel Table */}
      <AdminPanel
        token={token}
        guests={guests}
        counts={counts}
        loading={loading}
        error={loadError}
        onRetry={loadGuests}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onApprove={handleApproveClick}
      />

      {/* Edit Modal */}
      {editingGuest && (
        <div className={styles.modalOverlay} onClick={handleEditCancel}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Edit Guest Record</h3>

            {editServerError && (
              <div className={styles.modalError} role="alert">
                {editServerError}
              </div>
            )}

            <form onSubmit={handleEditSave} noValidate>
              <div className={styles.formGroup}>
                <label htmlFor="edit-name" className={styles.formLabel}>
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  className={`${styles.formInput} ${editErrors.name ? styles.formInputError : ''}`}
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, name: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  maxLength={100}
                />
                {editErrors.name && <div className={styles.fieldError}>{editErrors.name}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-email" className={styles.formLabel}>
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className={`${styles.formInput} ${editErrors.email ? styles.formInputError : ''}`}
                  value={editForm.email}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, email: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  maxLength={254}
                />
                {editErrors.email && <div className={styles.fieldError}>{editErrors.email}</div>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-rsvp" className={styles.formLabel}>
                  RSVP Status
                </label>
                <select
                  id="edit-rsvp"
                  className={styles.formSelect}
                  value={editForm.rsvpStatus}
                  onChange={(e) => {
                    setEditForm((prev) => ({
                      ...prev,
                      rsvpStatus: e.target.value as EditFormData['rsvpStatus'],
                    }));
                    setEditErrors((prev) => ({ ...prev, rsvpStatus: undefined }));
                  }}
                >
                  <option value="Attending">Attending</option>
                  <option value="Not Attending">Not Attending</option>
                  <option value="Undecided">Undecided</option>
                </select>
                {editErrors.rsvpStatus && <div className={styles.fieldError}>{editErrors.rsvpStatus}</div>}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={handleEditCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSave}
                  disabled={editSaving}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
