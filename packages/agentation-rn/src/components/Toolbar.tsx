import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconListSparkle, IconClose, IconCopy, IconTrash, IconGear, IconPlay, IconPause } from './Icons';
import type { OutputDetailLevel, AgenationSettings } from '../types';
import { DEFAULT_SETTINGS, COLOR_OPTIONS } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';

const DETAIL_LEVEL_LABELS: Record<OutputDetailLevel, string> = {
  compact: 'Compact',
  standard: 'Standard',
  detailed: 'Detailed',
  forensic: 'Forensic',
};

const DETAIL_LEVEL_ORDER: OutputDetailLevel[] = ['compact', 'standard', 'detailed', 'forensic'];

function getNextDetailLevel(current: OutputDetailLevel): OutputDetailLevel {
  const currentIndex = DETAIL_LEVEL_ORDER.indexOf(current);
  const nextIndex = (currentIndex + 1) % DETAIL_LEVEL_ORDER.length;
  return DETAIL_LEVEL_ORDER[nextIndex];
}

interface FloatingContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function FloatingContainer({ children, style }: FloatingContainerProps) {
  return (
    <View style={[style, styles.floatingBackground]}>
      {children}
    </View>
  );
}


interface AnimatedButtonProps {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

function AnimatedButton({ onPress, disabled, style, children }: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  }, [scaleAnim]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export interface ToolbarProps {
  isAnnotationMode: boolean;
  annotationCount: number;
  onToggleMode: () => void;
  onCopyMarkdown: () => void;
  onClearAll: () => void;
  zIndex?: number;
  outputDetail?: OutputDetailLevel;
  onOutputDetailChange?: (level: OutputDetailLevel) => void;
  clearAfterCopy?: boolean;
  onClearAfterCopyChange?: (value: boolean) => void;
  annotationColor?: string;
  onAnnotationColorChange?: (color: string) => void;
  offset?: { x?: number; y?: number };
  onSettingsMenuChange?: (isOpen: boolean) => void;
  // Pause button (shown when plugin provides it)
  showPauseButton?: boolean;
  isPaused?: boolean;
  onPauseToggle?: () => void;
}

export function Toolbar(props: ToolbarProps) {
  const {
    isAnnotationMode,
    annotationCount,
    onToggleMode,
    onCopyMarkdown,
    onClearAll,
    zIndex = 9999,
    outputDetail: controlledOutputDetail,
    onOutputDetailChange,
    clearAfterCopy: controlledClearAfterCopy,
    onClearAfterCopyChange,
    annotationColor: controlledAnnotationColor,
    onAnnotationColorChange,
    offset,
    onSettingsMenuChange,
    showPauseButton = false,
    isPaused = false,
    onPauseToggle,
  } = props;

  const insets = useSafeAreaInsets();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [internalSettings, setInternalSettings] = useState<AgenationSettings>(DEFAULT_SETTINGS);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const settingsAnim = useRef(new Animated.Value(0)).current;

  const fabOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const toolbarOpacity = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const settingsOpacity = settingsAnim;

  const currentOutputDetail = controlledOutputDetail ?? internalSettings.outputDetail;
  const currentClearAfterCopy = controlledClearAfterCopy ?? internalSettings.clearAfterCopy;
  const currentAnnotationColor = controlledAnnotationColor ?? internalSettings.annotationColor;

  useEffect(() => {
    loadSettings().then(setInternalSettings);
  }, []);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, expandAnim]);

  useEffect(() => {
    Animated.timing(settingsAnim, {
      toValue: showSettingsMenu ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showSettingsMenu, settingsAnim]);

  const handleFabPress = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (!isAnnotationMode) {
        onToggleMode();
      }
    } else {
      setIsExpanded(false);
      if (showSettingsMenu) {
        setShowSettingsMenu(false);
        onSettingsMenuChange?.(false);
      }
      if (isAnnotationMode) {
        onToggleMode();
      }
    }
  }, [isExpanded, isAnnotationMode, onToggleMode, showSettingsMenu, onSettingsMenuChange]);

  const handleCopyPress = useCallback(() => {
    onCopyMarkdown();
  }, [onCopyMarkdown]);

  const handleTrashPress = useCallback(() => {
    Alert.alert(
      'Clear All Annotations',
      'Are you sure you want to delete all annotations?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearAll },
      ]
    );
  }, [onClearAll]);

  const handleSettingsPress = useCallback(() => {
    setShowSettingsMenu(prev => {
      const newValue = !prev;
      onSettingsMenuChange?.(newValue);
      return newValue;
    });
  }, [onSettingsMenuChange]);

  const handleOutputDetailCycle = useCallback(() => {
    const nextLevel = getNextDetailLevel(currentOutputDetail);
    if (onOutputDetailChange) {
      onOutputDetailChange(nextLevel);
    } else {
      const newSettings = { ...internalSettings, outputDetail: nextLevel };
      setInternalSettings(newSettings);
      saveSettings({ outputDetail: nextLevel });
    }
  }, [currentOutputDetail, onOutputDetailChange, internalSettings]);

  const handleClearAfterCopyToggle = useCallback(() => {
    const newValue = !currentClearAfterCopy;
    if (onClearAfterCopyChange) {
      onClearAfterCopyChange(newValue);
    } else {
      const newSettings = { ...internalSettings, clearAfterCopy: newValue };
      setInternalSettings(newSettings);
      saveSettings({ clearAfterCopy: newValue });
    }
  }, [currentClearAfterCopy, onClearAfterCopyChange, internalSettings]);

  const handleAnnotationColorCycle = useCallback(() => {
    const currentIndex = COLOR_OPTIONS.findIndex(c => c.value === currentAnnotationColor);
    const nextIndex = (currentIndex + 1) % COLOR_OPTIONS.length;
    const nextColor = COLOR_OPTIONS[nextIndex].value;
    if (onAnnotationColorChange) {
      onAnnotationColorChange(nextColor);
    } else {
      const newSettings = { ...internalSettings, annotationColor: nextColor };
      setInternalSettings(newSettings);
      saveSettings({ annotationColor: nextColor });
    }
  }, [currentAnnotationColor, onAnnotationColorChange, internalSettings]);

  const bottomPosition = Math.max(insets.bottom, 16) + 16 + (offset?.y ?? 0);
  const rightPosition = 20 + (offset?.x ?? 0);

  const iconColor = '#FFFFFF';
  const badgeColor = currentAnnotationColor;

  const containerStyle = [styles.container, { zIndex, bottom: bottomPosition, right: rightPosition }];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.settingsMenuWrapper,
          { opacity: settingsOpacity },
        ]}
        pointerEvents={showSettingsMenu ? 'auto' : 'none'}
      >
        <FloatingContainer style={styles.settingsMenu}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleOutputDetailCycle}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsLabel}>Output Detail</Text>
            <Text style={styles.settingsValueText}>
              {DETAIL_LEVEL_LABELS[currentOutputDetail]}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleClearAfterCopyToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsLabel}>Clear After Copy</Text>
            <View style={[styles.checkbox, currentClearAfterCopy && styles.checkboxChecked]}>
              {currentClearAfterCopy && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={handleAnnotationColorCycle}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsLabel}>Marker Color</Text>
            <View style={[styles.colorSwatch, { backgroundColor: currentAnnotationColor }]} />
          </TouchableOpacity>
        </FloatingContainer>
      </Animated.View>

      <View style={styles.toolbarWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.fabWrapper,
            { opacity: fabOpacity },
          ]}
          pointerEvents={isExpanded ? 'none' : 'auto'}
        >
          <AnimatedButton onPress={handleFabPress} style={styles.fab}>
            <FloatingContainer style={styles.fabGlass}>
              <IconListSparkle size={24} color={iconColor} />
            </FloatingContainer>
          </AnimatedButton>

          {annotationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <Text style={styles.badgeText}>
                {annotationCount > 99 ? '99+' : annotationCount}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.expandedWrapper,
            { opacity: toolbarOpacity },
          ]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          <FloatingContainer style={styles.toolbar}>
            <View style={styles.toolbarButtons}>
              <AnimatedButton onPress={handleFabPress} style={styles.toolbarButton}>
                <IconClose size={22} color={iconColor} />
              </AnimatedButton>

              {showPauseButton && onPauseToggle && (
                <AnimatedButton onPress={onPauseToggle} style={styles.toolbarButton}>
                  {isPaused ? (
                    <IconPlay size={22} color={iconColor} />
                  ) : (
                    <IconPause size={22} color={iconColor} />
                  )}
                </AnimatedButton>
              )}

              <AnimatedButton
                onPress={handleCopyPress}
                disabled={annotationCount === 0}
                style={[
                  styles.toolbarButton,
                  annotationCount === 0 && styles.toolbarButtonDisabled,
                ]}
              >
                <IconCopy size={22} color={annotationCount > 0 ? iconColor : '#666'} />
              </AnimatedButton>

              <AnimatedButton
                onPress={handleTrashPress}
                disabled={annotationCount === 0}
                style={[
                  styles.toolbarButton,
                  annotationCount === 0 && styles.toolbarButtonDisabled,
                ]}
              >
                <IconTrash size={22} color={annotationCount > 0 ? iconColor : '#666'} />
              </AnimatedButton>

              <AnimatedButton onPress={handleSettingsPress} style={styles.toolbarButton}>
                <IconGear size={22} color={iconColor} />
              </AnimatedButton>
            </View>
          </FloatingContainer>

          {annotationCount > 0 && (
            <View style={[styles.badgeExpanded, { backgroundColor: badgeColor }]}>
              <Text style={styles.badgeText}>
                {annotationCount > 99 ? '99+' : annotationCount}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
  },

  toolbarWrapper: {
    position: 'relative',
    alignItems: 'center',
  },

  fabWrapper: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGlass: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  expandedWrapper: {
    position: 'relative',
  },
  toolbar: {
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonDisabled: {
    opacity: 0.4,
  },

  floatingBackground: {
    backgroundColor: '#1a1a1a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeExpanded: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  settingsMenuWrapper: {
    marginBottom: 8,
  },
  settingsMenu: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minWidth: 170,
  },
  settingsLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    fontWeight: '400',
  },
  settingsValue: {
    paddingHorizontal: 4,
  },
  settingsValueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  settingsToggle: {
    paddingHorizontal: 4,
  },
  settingsToggleActive: {},
  settingsToggleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkmark: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -1,
  },
});
