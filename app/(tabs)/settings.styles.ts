import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: theme.accentPrimary,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 16,
    padding: 18,
    shadowColor: theme.borderSubtle,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: theme.accentPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  rowText: {
    fontSize: 15,
    color: theme.accentPrimary,
  },
  logoutCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutText: {
    fontSize: 15,
    color: theme.accentPrimary,
  },
});
