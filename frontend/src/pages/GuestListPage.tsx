import { useEffect, useState, useCallback, useRef } from 'react';
import GuestListView, { Guest, GuestCounts } from '../components/GuestListView';
import { fetchGuests } from '../api';

const POLL_INTERVAL_MS = 5000;

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; guests: Guest[]; counts: GuestCounts };

/**
 * GuestListPage handles data fetching and polling for the guest list.
 * It calls GET /api/guests on mount and every 5 seconds, passing data
 * to the GuestListView presentational component.
 *
 * Requirements: 2.4, 4.5
 */
export default function GuestListPage() {
  const [state, setState] = useState<PageState>({ status: 'loading' });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadGuests = useCallback(async (isBackground = false) => {
    try {
      const response = await fetchGuests();

      if (!response.ok) {
        // Only show error state if this is the initial load or we're already in error state
        if (!isBackground) {
          setState({
            status: 'error',
            message: 'Unable to retrieve guest data. Please try again.',
          });
        }
        return;
      }

      const data = await response.json();
      const guests: Guest[] = data.guests ?? [];
      const counts: GuestCounts = data.counts ?? {
        attending: 0,
        notAttending: 0,
        total: guests.length,
      };

      setState({ status: 'loaded', guests, counts });
    } catch {
      if (!isBackground) {
        setState({
          status: 'error',
          message: 'Unable to retrieve guest data. Please try again.',
        });
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadGuests(false);
  }, [loadGuests]);

  // Polling every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // Background polls only update on success; they don't overwrite a loaded view with an error
      loadGuests(state.status === 'loaded');
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadGuests, state.status]);

  if (state.status === 'loading') {
    return (
      <div className="loading-container" role="status" aria-live="polite">
        <p>Loading guest list...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="error-container" role="alert" aria-live="polite">
        <p>{state.message}</p>
        <button onClick={() => { setState({ status: 'loading' }); loadGuests(false); }}>
          Retry
        </button>
      </div>
    );
  }

  return <GuestListView guests={state.guests} counts={state.counts} />;
}
