import React, { createContext, useContext, useEffect, useState } from 'react';
import colors, { setTheme } from '@/constants/colors';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark' | null;

const ThemeContext = createContext<{ theme: Theme; setThemeMode: (t: Theme) => void }>({ theme: null, setThemeMode: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = Appearance.getColorScheme();
  const [theme, setThemeState] = useState<Theme>(system === 'light' ? 'light' : 'dark');

  useEffect(() => {
    // initialize colors module
    setTheme(theme);
  }, [theme]);

  const setThemeMode = (t: Theme) => {
    if (t === null) {
      const sys = Appearance.getColorScheme();
      setTheme(sys === 'dark' ? 'dark' : 'light');
      setThemeState(sys === 'dark' ? 'dark' : 'light');
    } else {
      setTheme(t);
      setThemeState(t);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
