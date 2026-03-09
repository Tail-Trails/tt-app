import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';

export default StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  container: {
    marginHorizontal: 12,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#223014', // dark olive similar to attachment
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#e6f2d6',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    color: '#c7d6b5',
    fontSize: 18,
  },
  content: {
    marginTop: 8,
  },
});
