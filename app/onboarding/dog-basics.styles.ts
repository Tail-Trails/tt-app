import { StyleSheet } from 'react-native';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.accent,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.lightGreen,
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
    backgroundColor: colors.accent,
  },
  photoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: 'center',
    marginBottom: 32,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.mediumGreen,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: colors.lightGreen,
    fontWeight: '500' as const,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.accent,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.accent,
    borderWidth: 1,
    borderColor: '#3d4520',
  },
  pickerButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d4520',
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.accent,
  },
  pickerButtonTextPlaceholder: {
    color: '#5a6040',
  },
  pickerOptions: {
    backgroundColor: '#282E10',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#3d4520',
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f0a',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(255, 254, 119, 0.15)',
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.lightGreen,
  },
  pickerOptionTextSelected: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.darkGreen,
  },
});

export default styles;
