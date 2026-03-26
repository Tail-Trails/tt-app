import { View, StyleSheet, TouchableOpacity, Text as RNText } from 'react-native';
import { Square, Camera } from 'lucide-react-native';
import theme from '@/constants/colors';
import { Typography } from '@/constants/typography';

type Props = {
  isRecording: boolean;
  isExpanded: boolean;
  duration: number;
  distance: number;
  elevation: number;
  pace: string;
  speed: number;
  progress: number;
  showProgress: boolean;
  startLabel?: string;
  onStart?: () => void;
  onStop: () => void;
  onClose?: () => void;
  onCancel?: () => void;
  onCamera?: () => void;
};

export default function RecordOverlay({
  isRecording,
  isExpanded,
  duration,
  distance,
  elevation,
  pace,
  speed,
  progress,
  showProgress,
  startLabel = 'Start Trail',
  onStart,
  onStop,
  onClose,
  onCancel,
  onCamera,
}: Props) {
  const formattedDistance = `${(distance / 1000).toFixed(2)}km`;
  const formattedElevation = `${Math.round(elevation)}m`;

  if (!isRecording) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.recordButton} onPress={onStart} activeOpacity={0.8}>
          <RNText style={styles.recordButtonText}>{startLabel}</RNText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isExpanded ? (
        <View style={styles.grid}>
          <View style={styles.card}>
            <RNText style={styles.cardLabel}>TIME</RNText>
            <RNText style={styles.cardValue}>{Math.floor(duration / 60)}m</RNText>
          </View>
          <View style={styles.card}>
            <RNText style={styles.cardLabel}>DISTANCE</RNText>
            <RNText style={styles.cardValue}>{formattedDistance}</RNText>
          </View>
          <View style={styles.card}>
            <RNText style={styles.cardLabel}>SNIFF TIME</RNText>
            <RNText style={styles.cardValue}>0s</RNText>
          </View>
          <View style={styles.card}>
            <RNText style={styles.cardLabel}>ELEVATION</RNText>
            <RNText style={styles.cardValue}>{formattedElevation}</RNText>
          </View>
        </View>
      ) : (
        <View style={styles.compactContainer}>
          <View style={styles.compactLeft}>
            <View style={styles.compactCard}>
              <RNText style={styles.cardLabel}>TIME</RNText>
              <RNText style={styles.cardValue}>{Math.floor(duration / 60)}m</RNText>
            </View>
            <View style={styles.compactCard}>
              <RNText style={styles.cardLabel}>DISTANCE</RNText>
              <RNText style={styles.cardValue}>{formattedDistance}</RNText>
            </View>
          </View>
          <View style={styles.compactRight}>
            <TouchableOpacity style={[styles.stopButton, styles.stopButtonLarge]} onPress={onStop} activeOpacity={0.85}>
              <View style={styles.stopInner}>
                <Square size={18} color={theme.backgroundPrimary} fill={theme.backgroundPrimary} />
                <RNText style={styles.stopText}>Stop</RNText>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isExpanded && (
        <View style={[styles.controlsRow, !isExpanded && styles.controlsRowCollapsed]}>
          <TouchableOpacity style={styles.stopButton} onPress={onStop} activeOpacity={0.85}>
            <View style={styles.stopInner}>
              <Square size={18} color={theme.backgroundPrimary} fill={theme.backgroundPrimary} />
              <RNText style={styles.stopText}>Stop</RNText>
            </View>
          </TouchableOpacity>
          {onCancel ? (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
              <RNText style={styles.cancelText}>Cancel</RNText>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.cameraButton} onPress={() => { if (onCamera) onCamera(); }} activeOpacity={0.8}>
            <Camera size={20} color={theme.accentPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  card: {
    width: '48%',
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: theme.borderSubtle,
  },
  cardLabel: {
    ...Typography.caption(theme.textMuted),
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    ...Typography.h3(theme.accentPrimary),
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopButton: {
    flex: 1,
    backgroundColor: theme.accentSecondary,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopText: {
    ...Typography.button(theme.backgroundPrimary),
    marginLeft: 8,
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: theme.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRow: {
    height: 44,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  compactLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  compactCard: {
    flex: 1,
    backgroundColor: theme.backgroundPrimary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: theme.borderSubtle,
  },
  compactRight: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRowCollapsed: {
    marginTop: -28,
  },
  recordButton: {
    backgroundColor: theme.accentSecondary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonCompact: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  cameraButtonCompact: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  stopButtonLarge: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 20,
    minWidth: 140,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelText: {
    ...Typography.label('#9ca07e'),
  },
  recordButtonText: {
    ...Typography.button(theme.backgroundPrimary),
  },
});
