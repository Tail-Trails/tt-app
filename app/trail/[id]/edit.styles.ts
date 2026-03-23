import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.backgroundPrimary,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderSubtle,
    },
    headerButtons: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.backgroundPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    headerRightButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.backgroundPrimary,
    },
    loadingText: {
        marginTop: 16,
        ...Typography.body(theme.accentPrimary),
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.backgroundPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...Typography.h2(theme.accentPrimary),
    },
    finishButton: {
        backgroundColor: theme.accentPrimary,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        minWidth: 72,
    },
    finishButtonDisabled: {
        opacity: 0.6,
    },
    finishButtonText: {
        ...Typography.button('#1a1f0a'),
    },
    form: {
        padding: 16,
    },
    label: {
        ...Typography.label(theme.textMuted),
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        color: theme.textPrimary,
    },
    moreCard: {
        marginTop: 16,
        marginBottom: 24,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.borderSubtle,
        backgroundColor: theme.backgroundSecondary,
    },
    cardTitle: {
        ...Typography.h2(theme.accentPrimary),
        fontSize: 18,
        marginBottom: 6,
    },
    cardSub: {
        ...Typography.body(theme.textMuted),
        fontSize: 14,
        marginBottom: 8,
    },
    addPhotoBox: {
        height: 80,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.borderSubtle,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: theme.backgroundPrimary,
    },
    plusSign: {
        ...Typography.h1(theme.accentPrimary),
        fontSize: 26,
    },
    photoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    thumb: {
        width: 84,
        height: 84,
        borderRadius: 12,
        marginRight: -12,
        borderWidth: 2,
        borderColor: theme.backgroundSecondary,
        backgroundColor: theme.backgroundSecondary,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: theme.backgroundPrimary,
        borderTopWidth: 1,
        borderTopColor: theme.borderSubtle,
        alignItems: 'center',
    },
    footerSaveButton: {
        width: '100%',
        backgroundColor: theme.accentPrimary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerSaveButtonText: {
        ...Typography.h2(theme.backgroundPrimary),
    },
});

export default styles;
