import { Appearance } from 'react-native';

// Light theme (existing)
const lightTheme = {
  primary: '#5d6b4a',
  accent: '#FFFE77',
  background: '#F8F7F2',
  darkGreen: '#282E10',
  mediumGreen: '#3d4520',
  lightGreen: '#a8ad8e',
  paleYellow: '#d4d4a0',
  // semantic additions for more consistent theming
  surface: '#f3f4f6',
  border: '#d1d5db', // slightly darker for better contrast
  muted: '#5b646f', // darker muted text for accessibility
  white: '#ffffff',
  black: '#000000',
  info: '#2563eb',
  danger: '#b91c1c',
  tabBarBg: 'rgba(40,46,16,0.95)',
  light: {
    text: '#11120f',
    background: '#F7F7F3',
    tint: '#5d6b4a',
    tabIconDefault: '#7f8b7a', // darker default icon color
    tabIconSelected: '#FFFE77',
  },
};

// Dark theme (new)
const darkTheme = {
  primary: '#86a06a', // slightly lighter green for contrast on dark bg
  accent: '#FFFE77',
  background: '#071009', // very dark background
  darkGreen: '#b5c47aff', // used for text in dark mode
  mediumGreen: '#223015',
  lightGreen: '#6b7b56',
  paleYellow: '#bfb77a',
  // semantic additions for dark mode
  surface: '#0f1a14',
  border: '#123019',
  muted: '#9ca3af',
  white: '#eef7e6',
  black: '#071009',
  info: '#6596ff',
  danger: '#ef9a9a',
  tabBarBg: 'rgba(10,12,6,0.95)',
  light: {
    text: '#eef7e6',
    background: '#071009',
    tint: '#86a06a',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#FFFE77',
  },
};

// Start with system preference but keep a mutable object so existing imports
// continue to work (we mutate the exported object when theme changes).
const systemScheme = Appearance.getColorScheme();
const initial = systemScheme === 'dark' ? darkTheme : lightTheme;

// Mutable colors object exported as default for backwards compatibility.
const colors: any = { ...initial };

function applyTheme(theme: any) {
  // mutate the exported colors object in-place
  Object.keys(colors).forEach((k) => delete colors[k]);
  Object.assign(colors, theme);
}

// Listen for system theme changes and update exported colors in-place.
if (Appearance && typeof Appearance.addChangeListener === 'function') {
  Appearance.addChangeListener((evt: any) => {
    const scheme = evt.colorScheme || Appearance.getColorScheme();
    applyTheme(scheme === 'dark' ? darkTheme : lightTheme);
  });
}

// Allow manual override at runtime
export function setTheme(scheme: 'light' | 'dark' | null) {
  if (scheme === 'dark') applyTheme(darkTheme);
  else if (scheme === 'light') applyTheme(lightTheme);
  else applyTheme(Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme);
}

export default colors;
