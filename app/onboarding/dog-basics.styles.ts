import { StyleSheet, Platform } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
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
    backgroundColor: theme.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    ...Typography.label(theme.accentPrimary),
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    ...Typography.label(theme.accentPrimary),
    marginBottom: 8,
    paddingHorizontal: Platform.OS === 'android' ? 4 : 0,
  },
  input: {
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    color: theme.accentPrimary,
    borderWidth: 1,
    borderColor: '#3d4520',
    fontSize: 16,
    ...Platform.select({
      android: {
        includeFontPadding: true,
        textAlignVertical: 'center',
        minHeight: 56,
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
    }),
  },
  pickerButton: {
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3d4520',
  },
  pickerButtonText: {
    ...Typography.body(theme.accentPrimary),
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
    ...Typography.body(theme.accentPrimary),
  },
  pickerOptionTextSelected: {
    ...Typography.body(theme.accentPrimary),
    fontWeight: '600' as any,
  },
  nextButton: {
    backgroundColor: theme.accentPrimary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    ...Typography.button(theme.backgroundPrimary),
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default styles;
