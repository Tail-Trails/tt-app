import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondaryVarient,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2(theme.accentPrimary),
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body(theme.accentPrimary),
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3d4520',
  },
  progressDotActive: {
    backgroundColor: theme.accentPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#282E10',
    borderWidth: 1.5,
    borderColor: '#3d4520',
  },
  tagSelected: {
    backgroundColor: 'rgba(255, 254, 119, 0.15)',
    borderColor: theme.accentPrimary,
  },
  tagText: {
    ...Typography.label(theme.accentPrimary),
    paddingHorizontal: 4,
  },
  tagTextSelected: {
    ...Typography.label(theme.accentPrimary),
    fontWeight: '700' as any,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h2(theme.accentPrimary),
  },
  section: {
    marginBottom: 24,
  },
  label: {
    ...Typography.label(theme.accentPrimary),
    marginBottom: 4,
  },
  helperText: {
    ...Typography.caption(theme.accentPrimary),
    marginBottom: 12,
  },
  recallContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  recallOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#282E10',
    borderWidth: 1.5,
    borderColor: '#3d4520',
    alignItems: 'center',
  },
  recallOptionSelected: {
    backgroundColor: 'rgba(255, 254, 119, 0.15)',
    borderColor: theme.accentPrimary,
  },
  recallText: {
    ...Typography.label(theme.accentPrimary),
    paddingHorizontal: 4,
  },
  recallTextSelected: {
    ...Typography.label(theme.accentPrimary),
    fontWeight: '700' as any,
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#3d4520',
    backgroundColor: '#282E10',
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1.5,
    borderColor: theme.accentPrimary,
  },
  backButtonText: {
    ...Typography.label(theme.accentPrimary),
    paddingHorizontal: 4,
  },
  finishButton: {
    flex: 1,
    backgroundColor: theme.accentPrimary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  finishButtonDisabled: {
    opacity: 0.6,
  },
  finishButtonText: {
    ...Typography.button('#1a1f0a'),
    paddingHorizontal: 4,
  },
});

export default styles;
