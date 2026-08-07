import React from 'react';
import './theme.css';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider wraps the application with the blue baby boy theme.
 * It applies CSS variables and global styles via the theme-root class,
 * making the blue palette available to all child components.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <div className="theme-root">
      {children}
    </div>
  );
};

export default ThemeProvider;
