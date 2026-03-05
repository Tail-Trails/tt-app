import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSection: {
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.accentPrimary,
    borderWidth: 0,
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    ...Typography.h3(theme.accentPrimary),
    marginBottom: 2,
  },
  userEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    ...Typography.caption(theme.textSecondary),
    opacity: 0.8,
    marginLeft: 6,
  },
  dogCardContainer: {
    marginBottom: 16,
  },
  dogCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 14,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 0,
    borderColor: theme.backgroundPrimary,
  },
  dogPhotoContainer: {
    marginBottom: 16,
  },
  dogPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.backgroundSecondaryVarient,
    borderWidth: 0,
    borderColor: theme.accentPrimary,
  },
  dogPhotoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogName: {
    ...Typography.h2(theme.accentPrimary),
    marginBottom: 4,
  },
  dogNickname: {
    ...Typography.label(theme.textMuted),
    opacity: 0.9,
    marginBottom: 16,
  },
  nicknameSpacing: {
    height: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3(theme.accentPrimary),
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption(theme.textSecondary),
    opacity: 0.8,
  },
  dogInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dogInfoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dogInfoText: {
    ...Typography.label(theme.textPrimary),
  },
  loadingDogCard: {
    backgroundColor: theme.textPrimary,
    borderRadius: 24,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.backgroundPrimary,
  },
  statsCardContainer: {
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 14,
    padding: 18,
    borderWidth: 0,
    overflow: 'hidden',
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    ...Typography.label(theme.accentPrimary),
  },
  statsCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLeft: {
    flex: 1,
  },
  statsBig: {
    ...Typography.h1(theme.accentPrimary),
    fontSize: 48,
    lineHeight: 52,
  },
  statsLabel: {
    ...Typography.h3(theme.accentPrimary),
    marginTop: 6,
  },
  statsHint: {
    ...Typography.caption(theme.textSecondary),
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsRight: {
    width: 110,
    alignItems: 'center',
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accentSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    ...Typography.label(theme.accentPrimary),
  },
  badgeSubtitle: {
    ...Typography.caption(theme.textSecondary),
    marginTop: 2,
  },
  noDogCard: {
    backgroundColor: theme.textPrimary,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.backgroundPrimary,
  },
  noDogText: {
    ...Typography.body(theme.accentPrimary),
    opacity: 0.9,
    textAlign: 'center',
  },
  addDogButton: {
    backgroundColor: theme.backgroundPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addDogButtonText: {
    ...Typography.label(theme.textPrimary),
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0,
  },
  tabActive: {
    backgroundColor: theme.accentPrimary,
  },
  tabText: {
    ...Typography.label(theme.textMuted),
  },
  tabTextActive: {
    color: theme.backgroundSecondary,
  },
  tabCount: {
    ...Typography.h3(theme.accentPrimary),
    marginBottom: 2,
  },
  tabCountActive: {
    color: theme.backgroundPrimary,
  },
  trailsSection: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  horizontalTrailsContainer: {
    gap: 12,
    paddingHorizontal: 16,
  },
  trailCard: {
    backgroundColor: theme.textPrimary,
    borderRadius: 8,
    width: 350,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: theme.backgroundSecondaryVarient,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
  },
  trailImage: {
    width: '100%',
    height: 250,
    backgroundColor: theme.backgroundSecondary,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.backgroundSecondary,
  },
  trailContent: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    padding: 12,
  },
  trailContentBelow: {
    padding: 12,
    backgroundColor: theme.backgroundSecondary,
  },
  trailName: {
    ...Typography.h2(theme.textPrimary),
    marginBottom: 4,
  },
  trailLocation: {
    ...Typography.caption(theme.textPrimary),
    opacity: 0.95,
  },
  trailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  trailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trailBadgeText: {
    ...Typography.caption(theme.textPrimary),
  },
  emptyText: {
    ...Typography.body(theme.textPrimary),
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 14,
    height: 177,
    width: 264,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.accentPrimary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.accentPrimary,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    ...Typography.label(theme.backgroundPrimary),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: theme.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.accentPrimary,
  },
  modalTitle: {
    ...Typography.h2(theme.textPrimary),
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    ...Typography.label(theme.backgroundPrimary),
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    padding: 16,
    color: theme.textPrimary,
    borderWidth: 1,
    borderColor: theme.accentPrimary,
  },
  initialAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialAvatarText: {
    ...Typography.h1(theme.textPrimary),
  },
  /* Modal / Edit profile styles */
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.accentPrimary,
    borderWidth: 3,
    borderColor: theme.backgroundPrimary,
  },
  editPhoto: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.backgroundPrimary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    ...Typography.caption(theme.textMuted),
    marginTop: 8,
  },
  inputSection: {
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.accentPrimary,
  },
  disabledInputText: {
    ...Typography.label(theme.backgroundPrimary),
    opacity: 0.8,
  },
  inputHint: {
    ...Typography.caption(theme.textMuted),
    marginTop: 6,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.accentPrimary,
    backgroundColor: theme.backgroundPrimary,
  },
  saveButton: {
    backgroundColor: theme.backgroundPrimary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.button(theme.textPrimary),
  },
});
