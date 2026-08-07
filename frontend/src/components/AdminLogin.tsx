import { useState, FormEvent } from 'react';
import { loginAdmin } from '../api';
import styles from './AdminLogin.module.css';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

/**
 * AdminLogin displays a login form for admin authentication.
 * On success it calls onLoginSuccess with the JWT token.
 * On failure it shows an error message and clears only the password field.
 */
export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginAdmin(username, password);

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.token);
      } else if (response.status === 401) {
        setError('Invalid credentials');
        setPassword('');
      } else {
        setError('Unable to connect');
        setPassword('');
      }
    } catch {
      setError('Unable to connect');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.title}>Admin Login</h2>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="admin-username" className={styles.label}>
            Username
          </label>
          <input
            id="admin-username"
            type="text"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="admin-password" className={styles.label}>
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
