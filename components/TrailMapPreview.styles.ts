import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

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
    ...Typography.body(theme.backgroundPrimary),
    fontWeight: '700' as any,
  },
  subtext: {
    ...Typography.caption(theme.textMuted),
    marginTop: 4,
  },
});
