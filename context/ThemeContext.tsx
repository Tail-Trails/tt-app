// ThemeContext removed — application now uses a single fixed theme.
// This stub keeps accidental imports from crashing. Prefer removing imports instead.
import React from 'react';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useTheme = () => ({ theme: 'light', setThemeMode: (_: unknown) => {} });

export default null as any;
