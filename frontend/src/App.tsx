import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { ThemeProvider } from './theme';
import RegistrationPage from './pages/RegistrationPage';
import GuestListPage from './pages/GuestListPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  const location = useLocation();
  const showNav = location.pathname.startsWith('/admin');

  return (
    <ThemeProvider>
      {showNav && (
        <nav className="app-nav" aria-label="Main navigation">
          <div className="app-nav-inner">
            <span className="app-nav-brand">🍼 Baby Shower</span>
            <div className="app-nav-links">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
                Register
              </NavLink>
              <NavLink to="/guests" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Guest List
              </NavLink>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Admin
              </NavLink>
            </div>
          </div>
        </nav>
      )}

      <main className={showNav ? 'app-content' : ''}>
        <Routes>
          <Route path="/" element={<RegistrationPage />} />
          <Route path="/guests" element={<GuestListPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </ThemeProvider>
  );
}

export default App;
