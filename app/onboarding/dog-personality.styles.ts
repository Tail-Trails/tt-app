import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';

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
    fontSize: 28,
    fontWeight: '700' as const,
    color: theme.accentPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.accentPrimary,
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
    fontSize: 15,
    fontWeight: '500' as const,
    color: theme.accentPrimary,
  },
  tagTextSelected: {
    color: theme.accentPrimary,
    fontWeight: '600' as const,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.accentPrimary,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: theme.accentPrimary,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: theme.accentPrimary,
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
    fontSize: 14,
    fontWeight: '500' as const,
    color: theme.accentPrimary,
  },
  recallTextSelected: {
    color: theme.accentPrimary,
    fontWeight: '600' as const,
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
    fontSize: 17,
    fontWeight: '600' as const,
    color: theme.accentPrimary,
  },
  finishButton: {
    flex: 1,
    backgroundColor: theme.accentPrimary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonDisabled: {
    opacity: 0.6,
  },
  finishButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1a1f0a',
  },
});

export default styles;
