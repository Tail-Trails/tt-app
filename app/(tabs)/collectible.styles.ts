import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Text } from '@/components';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: theme.accentPrimary,
    fontWeight: '600',
  },
  title: {
    ...((Text as any).defaultProps?.style || {}),
    color: theme.accentPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  spacer: { width: 40 },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    marginLeft: 20,
  },
  itemTitle: {
    color: theme.accentPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    color: theme.textSecondary,
    fontSize: 13,
  },
});
