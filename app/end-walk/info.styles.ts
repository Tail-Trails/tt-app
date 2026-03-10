import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.backgroundSecondary,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  infoScroll: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundPrimary,
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
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    color: theme.textPrimary,
    marginBottom: 16,
    fontSize: 18,
  },
  addMoreToggle: {
    marginVertical: 18,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: {
    ...Typography.h2(theme.textMuted),
    fontSize: 16,
  },
  moreCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    overflow: 'hidden',
  },
  cardTitle: {
    ...Typography.h2(theme.accentPrimary),
    fontSize: 18,
    marginBottom: 6,
  },
  cardSub: {
    ...Typography.body(theme.textMuted),
    fontSize: 14,
    marginBottom: 8,
  },
  addPhotoBox: {
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: theme.backgroundPrimary,
  },
  plusSign: {
    ...Typography.h1(theme.accentPrimary),
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
    borderColor: theme.backgroundSecondary,
    backgroundColor: theme.backgroundSecondary,
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
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  backButton: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.backgroundSecondaryVarient,
  },
  backText: {
    ...Typography.h2(theme.accentPrimary),
    fontSize: 16,
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
    ...Typography.h2(theme.backgroundPrimary),
    fontSize: 16,
  },
});

export default styles;
