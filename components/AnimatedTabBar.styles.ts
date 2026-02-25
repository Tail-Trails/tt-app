import { StyleSheet, Platform } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 0,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
    gap: 6,
  },
  tabButton: {
    height: 64,
    borderRadius: 16,
    // Change 'hidden' to 'visible' if clipping persists
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    // Add a tiny bit of horizontal padding so the text isn't 
    // pushed against the very edge of the flex container
    paddingHorizontal: Platform.OS === 'android' ? 4 : 0,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.label(theme.textMuted),
    // keep Android-specific layout fixes
    ...Platform.select({
      android: {
        includeFontPadding: false,
        paddingRight: 2,
        textAlign: 'center',
        minWidth: 60,
      },
    }),
  },
  labelActive: {
    color: theme.accentPrimary,
  },
});
