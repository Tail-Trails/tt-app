// Single, fixed theme for the app.
// This file exports a single `theme` object (keeps a default export for compatibility).

const themeObj = {
  backgroundPrimary: '#191E07',
  backgroundSecondary: '#272F0A',
  backgroundSecondaryVarient: '#3E481B',

  accentPrimary: '#FFFE77',
  accentSecondary: '#D4FF5E',

  textPrimary: '#FFFFFF',
  textSecondary: '#BEC056',
  textMuted: '#A0A883',

  borderSubtle: '#343A20',
  
};

export const theme = themeObj as any;
export default themeObj;
