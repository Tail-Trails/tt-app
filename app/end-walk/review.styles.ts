import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: theme.backgroundSecondary,
        paddingHorizontal: 24,
        paddingBottom: 40,
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
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 0,
        backgroundColor: theme.backgroundSecondaryVarient,
        marginRight: 12,
        marginBottom: 12,
        minWidth: 160,
    },
    chipSelected: {
        backgroundColor: theme.accentPrimary,
    },
    chipText: {
        ...Typography.h2(theme.textMuted),
        fontSize: 16,
    },
    chipTextSelected: {
        color: theme.backgroundPrimary,
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
        backgroundColor: theme.backgroundSecondary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.backgroundSecondaryVarient,
    },
    backButtonText: {
        ...Typography.h2(theme.accentPrimary),
        fontSize: 18,
    },
    nextButtonLarge: {
        flex: 1,
        backgroundColor: theme.accentSecondary,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
    },
    nextButtonText: {
        ...Typography.h2(theme.backgroundPrimary),
        fontSize: 18,
    },
});

export default styles;
