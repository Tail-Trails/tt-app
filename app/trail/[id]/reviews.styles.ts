import { StyleSheet } from 'react-native';
import colors from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    ...Typography.h2(colors.accentPrimary),
  },
  subtitle: {
    ...Typography.body(colors.textMuted),
  },
  composeCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    marginBottom: 18,
  },
  composeTitle: {
    ...Typography.h3(colors.textPrimary),
    marginBottom: 4,
  },
  composeSubtitle: {
    ...Typography.body(colors.textMuted),
    marginBottom: 14,
  },
  composeStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  composeStarButton: {
    paddingVertical: 2,
  },
  composeInput: {
    ...Typography.body(colors.textPrimary),
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.backgroundPrimary,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  composeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  composeHint: {
    ...Typography.caption(colors.textMuted),
  },
  submitButton: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPrimary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    ...Typography.label(colors.backgroundPrimary),
  },
  addReviewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    ...Typography.body(colors.textMuted),
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    gap: 14,
  },
  errorText: {
    ...Typography.body(colors.textPrimary),
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentPrimary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryText: {
    ...Typography.label(colors.backgroundPrimary),
  },
  summaryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    marginBottom: 18,
  },
  summaryLabel: {
    ...Typography.caption(colors.textMuted),
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  summaryValue: {
    ...Typography.h1(colors.accentPrimary),
    marginBottom: 6,
  },
  summaryMeta: {
    ...Typography.body(colors.textPrimary),
  },
  reviewCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 18,
    marginBottom: 14,
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.label(colors.textPrimary),
  },
  dateText: {
    ...Typography.caption(colors.textMuted),
    flexShrink: 1,
    textAlign: 'right',
  },
  reviewContent: {
    ...Typography.body(colors.textPrimary),
  },
  emptyCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    ...Typography.h3(colors.textPrimary),
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body(colors.textMuted),
    textAlign: 'center',
  },
});
