import { useState } from 'react';
import RegistrationForm, { RegistrationData } from '../components/RegistrationForm';
import { registerGuest } from '../api';

type SubmissionState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

interface ServerFieldError {
  field: string;
  message: string;
}

export default function RegistrationPage() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ status: 'idle' });
  const [serverErrors, setServerErrors] = useState<ServerFieldError[]>([]);

  async function handleSubmit(data: RegistrationData) {
    setSubmissionState({ status: 'idle' });
    setServerErrors([]);

    try {
      const response = await registerGuest(data);

      if (response.status === 201) {
        const body = await response.json();
        const rsvpStatus = body.guest?.rsvpStatus || data.rsvpStatus;
        setSubmissionState({
          status: 'success',
          message: `Thank you! Your RSVP status is '${rsvpStatus}' and your registration is pending approval.`,
        });
      } else if (response.status === 200) {
        setSubmissionState({
          status: 'success',
          message: 'Your RSVP has been updated successfully.',
        });
      } else if (response.status === 400) {
        const body = await response.json();
        if (body.errors && Array.isArray(body.errors)) {
          setServerErrors(body.errors);
          setSubmissionState({
            status: 'error',
            message: 'Please fix the errors below and try again.',
          });
        } else {
          setSubmissionState({
            status: 'error',
            message: 'Validation failed. Please check your input.',
          });
        }
      } else {
        // 500, 503, or any other server error
        setSubmissionState({
          status: 'error',
          message: 'Unable to save your registration. Please try again.',
        });
      }
    } catch {
      // Network error or fetch failure
      setSubmissionState({
        status: 'error',
        message: 'Unable to save your registration. Please try again.',
      });
    }
  }

  return (
    <div>
      {submissionState.status === 'success' && (
        <div role="alert" aria-live="polite" className="confirmation-message">
          <p>{submissionState.message}</p>
        </div>
      )}

      {submissionState.status === 'error' && (
        <div role="alert" aria-live="polite" className="error-message">
          <p>{submissionState.message}</p>
          {serverErrors.length > 0 && (
            <ul>
              {serverErrors.map((err) => (
                <li key={err.field}>{err.field}: {err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {submissionState.status !== 'success' && (
        <RegistrationForm onSubmit={handleSubmit} />
      )}
    </div>
  );
}
