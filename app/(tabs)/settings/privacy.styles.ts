import { StyleSheet } from 'react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.backgroundPrimary,
    },
    header: {
        height: 64,
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
    content: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        backgroundColor: theme.backgroundPrimary,
    },
    title: {
        ...Typography.h2(theme.accentPrimary),
        marginBottom: 6,
    },
    updated: {
        ...Typography.caption(theme.textSecondary),
        marginBottom: 12,
    },
    heading: {
        ...Typography.h3(theme.accentPrimary),
        marginTop: 12,
        marginBottom: 6,
    },
    paragraph: {
        ...Typography.body(theme.textPrimary),
        marginBottom: 8,
        lineHeight: 20,
    },
    list: {
        marginVertical: 6,
        paddingLeft: 6,
    },
    listItem: {
        ...Typography.body(theme.textPrimary),
        marginBottom: 6,
        lineHeight: 20,
    },
    link: {
        color: theme.accentPrimary,
        textDecorationLine: 'underline',
    },
});
