import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';

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
    overflow: 'hidden',
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
    paddingHorizontal: 0,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: theme.accentPrimary,
  },
});
