import { StyleSheet } from 'react-native';
import colors from '@/constants/colors';

export default StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.surface,
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
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtext: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
});
