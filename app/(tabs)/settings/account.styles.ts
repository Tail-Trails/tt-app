import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary || '#fff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.borderSubtle || '#eee',
    backgroundColor: theme.backgroundSecondary || '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    color: theme.textPrimary,
    fontWeight: '600',
  },

  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  photoSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 120 / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondaryVarient || '#f2f2f2',
  },
  editPhoto: {
    width: 120,
    height: 120,
    borderRadius: 120 / 2,
  },
  initialAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondaryVarient || '#f2f2f2',
  },
  initialAvatarText: {
    fontSize: 36,
    color: theme.textPrimary,
    fontWeight: '700',
  },
  cameraOverlay: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 36,
    height: 36,
    borderRadius: 36 / 2,
    backgroundColor: theme.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  photoHint: {
    marginTop: 8,
    color: theme.textSecondary,
    fontSize: 13,
  },

  inputSection: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderSubtle || '#e6e6e6',
    paddingHorizontal: 12,
    color: theme.textPrimary,
    backgroundColor: theme.backgroundPrimary || '#fff',
  },
  disabledInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderSubtle || '#e6e6e6',
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: theme.backgroundSecondaryVarient || '#fafafa',
  },
  disabledInputText: {
    color: theme.textSecondary,
  },
  inputHint: {
    marginTop: 6,
    color: theme.textMuted,
    fontSize: 12,
  },

  modalFooter: {
    marginTop: 18,
    alignItems: 'center',
  },
  saveButton: {
    height: 48,
    minWidth: 200,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.backgroundPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});
