import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.backgroundPrimary,
        paddingHorizontal: 0,
        paddingBottom: 0,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: 'flex-start',
    },
    bigHeader: {
        paddingTop: 24,
        paddingBottom: 12,
    },
    bottomTitle: {
        ...Typography.h1(theme.accentPrimary),
        fontSize: 28,
        marginBottom: 8,
    },
    bottomSubtitle: {
        ...Typography.body(theme.textMuted),
        marginBottom: 16,
    },
    starRow: {
        flexDirection: 'row',
        gap: 2
    },
    starButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'flex-start',
    },
    star: {
        ...Typography.h2(theme.backgroundSecondaryVarient),
        fontSize: 30,
    },
    section: {
        marginBottom: 24,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: theme.borderSubtle,
        backgroundColor: theme.backgroundPrimary,
    },
    trackContainer: {
        height: 40,
        justifyContent: 'center',
    },
    track: {
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3d4520',
    },
    thumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: '#282E10',
        borderWidth: 1.5,
        borderColor: '#3d4520',
        marginRight: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 140,
    },
    chipSelected: {
        backgroundColor: 'rgba(255, 254, 119, 0.15)',
        borderColor: theme.accentPrimary,
    },
    chipText: {
        ...Typography.label(theme.accentPrimary),
        paddingHorizontal: 4,
    },
    chipTextSelected: {
        ...Typography.label(theme.accentPrimary),
        fontWeight: '700' as any,
        paddingHorizontal: 4,
    },
    cardTitle: {
        ...Typography.h1(theme.accentPrimary),
        fontSize: 20,
        marginBottom: 6,
    },
    label: {
        ...Typography.caption(theme.textMuted),
    },
    backButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'transparent',
        borderRadius: 12,
        padding: 18,
        borderWidth: 1.5,
        borderColor: theme.accentPrimary,
    },
    backButtonText: {
        ...Typography.label(theme.accentPrimary),
        paddingHorizontal: 4,
    },
    nextButtonLarge: {
        flex: 1,
        backgroundColor: theme.accentPrimary,
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    nextButtonText: {
        ...Typography.button('#1a1f0a'),
        paddingHorizontal: 4,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: theme.borderSubtle,
        backgroundColor: theme.backgroundPrimary,
    },
});

export default styles;
