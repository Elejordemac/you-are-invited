import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
        setSubmissionState({
          status: 'error',
          message: 'Unable to save your registration. Please try again.',
        });
      }
    } catch {
      setSubmissionState({
        status: 'error',
        message: 'Unable to save your registration. Please try again.',
      });
    }
  }

  // Success screen - full screen Marvel style
  if (submissionState.status === 'success') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #0a1929 0%, #001e3c 40%, #000d1a 100%)',
        color: '#e3f2fd', textAlign: 'center', padding: '2rem',
      }}>
        <div>
          <div style={{
            fontSize: '3rem', marginBottom: '1rem',
          }}>✓</div>
          <h2 style={{
            color: '#42a5f5', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
            fontWeight: 700, marginBottom: '1rem', letterSpacing: '1px',
          }}>REGISTRATION CONFIRMED</h2>
          <p style={{ color: '#b3e5fc', fontSize: '1rem', lineHeight: 1.6 }}>
            {submissionState.message}
          </p>
          <button
            onClick={() => navigate('/wishlist')}
            style={{
              marginTop: '1.5rem',
              padding: '0.7rem 2rem',
              background: 'transparent',
              border: '2px solid rgba(255, 213, 79, 0.6)',
              borderRadius: '6px',
              color: '#ffd54f',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '2px',
              cursor: 'pointer',
              fontFamily: "'Bebas Neue', 'Anton', sans-serif",
              transition: 'all 0.3s ease',
            }}
          >
            🎁 VIEW GIFT IDEAS
          </button>
        </div>
      </div>
    );
  }

  // Error overlay on top of form
  return (
    <>
      {submissionState.status === 'error' && (
        <div style={{
          position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 300, background: 'rgba(239, 83, 80, 0.9)', color: '#fff',
          padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.85rem',
          maxWidth: '90%', textAlign: 'center',
        }} role="alert">
          <p style={{ margin: 0 }}>{submissionState.message}</p>
          {serverErrors.length > 0 && (
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', textAlign: 'left' }}>
              {serverErrors.map((err) => (
                <li key={err.field}>{err.field}: {err.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <RegistrationForm onSubmit={handleSubmit} />
    </>
  );
}
