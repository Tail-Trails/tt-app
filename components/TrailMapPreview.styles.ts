import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';

export default StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  text: {
    color: theme.backgroundPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtext: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
