import { StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { Typography } from '@/constants/typography';
import theme from '@/constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scroll: {
    padding: 24,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    ...Typography.h1(theme.accentPrimary),
    fontSize: 34,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.body(theme.textMuted),
  },
  card: {
    marginBottom: 24,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.backgroundSecondary,
  },
  sectionTitle: {
    ...Typography.h2(colors.accentPrimary),
    fontSize: 18,
    marginBottom: 6,
  },
  sectionSub: {
    ...Typography.body(colors.textMuted),
    fontSize: 14,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundPrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  starButtonActive: {
    backgroundColor: colors.accentPrimary,
    borderColor: colors.accentPrimary,
  },
  starText: {
    ...Typography.h2(colors.textMuted),
    fontSize: 24,
  },
  starTextActive: {
    color: colors.backgroundPrimary,
  },
  addPhotoBox: {
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.backgroundPrimary,
  },
  plusSign: {
    ...Typography.h1(colors.accentPrimary),
    fontSize: 28,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: -18,
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
    backgroundColor: colors.backgroundSecondary,
  },
  input: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: 12,
    padding: 12,
    color: colors.textPrimary,
    minHeight: 120,
    marginTop: 8,
    textAlignVertical: 'top',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  backButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundSecondaryVarient,
  },
  backText: {
    ...Typography.h2(colors.accentPrimary),
    fontSize: 16,
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.accentPrimary,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneText: {
    ...Typography.h2(colors.backgroundPrimary),
    fontSize: 16,
  },
});
