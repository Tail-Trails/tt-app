import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.backgroundPrimary,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bigHeader: {
    paddingTop: 24,
    paddingBottom: 12,
  },
  hugeTitle: {
    ...Typography.h1(theme.accentPrimary),
    fontSize: 36,
    lineHeight: 44,
    marginBottom: 10,
  },
  bigSubtitle: {
    ...Typography.h2(theme.textMuted),
  },
  statsGridTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    width: '32%',
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  statLabel: {
    ...Typography.caption(theme.textMuted),
    marginBottom: 6,
  },
  statValue: {
    ...Typography.h3(theme.accentPrimary),
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bottomContent: {
    backgroundColor: theme.backgroundSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 80,
  },
  bottomTitle: {
    ...Typography.h1(theme.accentPrimary),
    fontSize: 28,
    marginBottom: 8,
  },
  bottomSubtitle: {
    ...Typography.body(theme.textMuted),
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'flex-start',
  },
  star: {
    ...Typography.h2(theme.backgroundSecondaryVarient),
    fontSize: 30,
  },
});

export default styles;
