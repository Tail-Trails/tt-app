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
  header: {
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    ...Typography.h1(theme.accentPrimary),
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body(theme.textMuted),
  },
  contentCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    ...Typography.caption(theme.textMuted),
  },
  value: {
    ...Typography.h2(theme.textPrimary),
    marginTop: 6,
  },
  nextButton: {
    marginTop: 12,
    backgroundColor: theme.accentPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.h2(theme.backgroundPrimary),
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundPrimary,
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
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.backgroundSecondary,
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
    ...Typography.h2(theme.textPrimary),
  },
  /* bottom sheet */
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
    paddingBottom: 36,
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
    gap: 12,
    marginTop: 6,
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    ...Typography.h2(theme.accentPrimary),
    fontSize: 20,
  },
  /* review page */
  chip: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    backgroundColor: theme.backgroundPrimary,
    marginRight: 12,
    marginBottom: 12,
  },
  chipSelected: {
    borderColor: theme.accentPrimary,
    backgroundColor: 'transparent',
  },
  chipText: {
    ...Typography.body(theme.textMuted),
  },
  chipTextSelected: {
    color: theme.accentPrimary,
  },
  pagerDotsRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.textMuted,
    marginHorizontal: 4,
  },
  pagerDotActive: {
    backgroundColor: theme.accentPrimary,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: {
    ...Typography.h2(theme.textPrimary),
  },
  nextButtonLarge: {
    flex: 1,
    backgroundColor: '#E6FF66',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.h2('#0b3d00'),
  },
  photoPlaceholder: {
    height: 220,
    borderRadius: 12,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPlaceholderText: {
    ...Typography.body(theme.backgroundPrimary),
    marginTop: 8,
  },
  completeIcon: {
    height: 160,
    width: 160,
    borderRadius: 80,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 24,
  },
  /* info page */
  infoScroll: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  infoHeader: {
    ...Typography.h1(theme.accentPrimary),
    fontSize: 36,
    marginTop: 8,
    marginBottom: 6,
  },
  infoSub: {
    ...Typography.body(theme.textMuted),
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    padding: 14,
    color: theme.textPrimary,
    marginBottom: 12,
  },
  addMoreToggle: {
    marginVertical: 12,
  },
  addMoreText: {
    ...Typography.h2(theme.accentPrimary),
  },
  moreCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: {
    ...Typography.h2(theme.accentPrimary),
    marginBottom: 6,
  },
  cardSub: {
    ...Typography.body(theme.textMuted),
    marginBottom: 8,
  },
  addPhotoBox: {
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  plusSign: {
    ...Typography.h1(theme.accentPrimary),
    fontSize: 28,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    marginRight: 8,
  },
  notesInput: {
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    padding: 12,
    color: theme.textPrimary,
    minHeight: 88,
    marginTop: 8,
  },
  privacyButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  privacyText: {
    ...Typography.h2(theme.accentPrimary),
  },
  bottomRow: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 28,
    flexDirection: 'row',
    gap: 12,
  },
  doneButton: {
    flex: 1,
    backgroundColor: theme.accentPrimary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    ...Typography.h2('#000'),
  },
});

export default styles;
