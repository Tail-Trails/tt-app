import { StyleSheet, Platform } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    ...Typography.h2(theme.textPrimary),
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  subtitle: {
    ...Typography.body(theme.textMuted),
    marginTop: 8,
    textAlign: 'center',
    // Subtle buffer for multi-line text
    paddingHorizontal: Platform.OS === 'android' ? 8 : 0,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    ...Typography.label(theme.textMuted),
    marginBottom: 8,
    paddingHorizontal: Platform.OS === 'android' ? 4 : 0,
  },
  input: {
    backgroundColor: theme.backgroundPrimary,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: 12,
    padding: 16,
    color: theme.textPrimary,
    fontSize: 16,
    // Fix for text getting cut off inside the input field itself on Android
    ...Platform.select({
      android: {
        includeFontPadding: true,
        textAlignVertical: 'center',
        minHeight: 56, // Ensure enough vertical space
        paddingVertical: 12,
        paddingHorizontal: 16,
        paddingRight: 20, 
      },
      ios: {
        paddingRight: 16,
      },
    }),
  },
  helperText: {
    ...Typography.caption(theme.textMuted),
    marginTop: 8,
    paddingRight: Platform.OS === 'android' ? 4 : 0,
  },
  button: {
    backgroundColor: theme.accentSecondary,
    borderRadius: 12,
    paddingVertical: 18, // Slightly taller buttons for better text fit
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
    // Ensure the button container doesn't clip its own text
    overflow: 'visible', 
    minHeight: 56, // Standard accessible button height
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }], // Slightly more pronounced scale
    opacity: 0.95,
  },
  buttonText: {
    ...Typography.button(theme.backgroundPrimary),
    paddingHorizontal: 4,
    textAlign: 'center',
    // Prevent clipping on Android
    ...Platform.select({
      android: {
        includeFontPadding: true,
      }
    })
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    ...Typography.label(theme.accentPrimary),
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    // Prevent the footer from squeezing the link text
    flexWrap: 'wrap',
  },
  footerText: {
    ...Typography.label(theme.textMuted),
    paddingRight: Platform.OS === 'android' ? 4 : 0,
    paddingVertical: 4,
  },
  linkText: {
    ...Typography.label(theme.accentPrimary),
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});

export default styles;