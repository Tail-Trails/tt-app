import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';

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
    fontSize: 32,
    fontWeight: '700' as const,
    color: theme.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.backgroundPrimary,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
  },
  button: {
    backgroundColor: theme.accentSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.997 }],
    opacity: 0.95,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.backgroundPrimary,
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.accentPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: theme.textMuted,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.accentPrimary,
  },
});

export default styles;
