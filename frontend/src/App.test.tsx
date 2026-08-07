import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('should render navigation links', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /guest list/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
  });

  it('should render the brand name in the navigation', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('🍼 Baby Shower')).toBeInTheDocument();
  });

  it('should render the registration page by default', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    // Registration page renders the RegistrationForm component
    expect(screen.getByRole('link', { name: /register/i })).toHaveClass('active');
  });

  it('should render guest list page on /guests route', () => {
    render(
      <MemoryRouter initialEntries={['/guests']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /guest list/i })).toHaveClass('active');
  });

  it('should render admin page on /admin route', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /admin/i })).toHaveClass('active');
  });
});
