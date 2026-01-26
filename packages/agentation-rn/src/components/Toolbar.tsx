import React, { useState, useCallback, useRef } from 'react';
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
import { IconListSparkle, IconClose, IconCopy, IconTrash, IconGear, IconSun, IconMoon } from './Icons';
import type { OutputDetailLevel } from '../types';
import { useToolbarAnimations } from '../hooks/useToolbarAnimations';
import { useToolbarSettings } from '../hooks/useToolbarSettings';
// @ts-expect-error - importing version from package.json
import { version as __VERSION__ } from '../../package.json';

const DETAIL_LEVEL_LABELS: Record<OutputDetailLevel, string> = {
  compact: 'Compact',
  standard: 'Standard',
  detailed: 'Detailed',
  forensic: 'Forensic',
};

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
  } = props;

  const insets = useSafeAreaInsets();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Mock state for demo

  const animations = useToolbarAnimations(isExpanded, showSettingsMenu, annotationCount);

  const settings = useToolbarSettings({
    controlledOutputDetail,
    onOutputDetailChange,
    controlledClearAfterCopy,
    onClearAfterCopyChange,
    controlledAnnotationColor,
    onAnnotationColorChange,
  });

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

  const bottomPosition = Math.max(insets.bottom, 16) + 16 + (offset?.y ?? 0);
  const rightPosition = 20 + (offset?.x ?? 0);

  const iconColor = '#FFFFFF';
  const badgeColor = settings.currentAnnotationColor;

  const containerStyle = [styles.container, { zIndex, bottom: bottomPosition, right: rightPosition }];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.settingsMenuWrapper,
          {
            opacity: animations.settingsOpacity,
            transform: [
              { scale: animations.settingsScale },
              { translateY: animations.settingsTranslateY },
            ],
          },
        ]}
        pointerEvents={showSettingsMenu ? 'auto' : 'none'}
      >
        <FloatingContainer style={styles.settingsMenu}>
          {/* Header */}
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsBrand}>
              <Text style={[styles.settingsBrandSlash, { color: settings.currentAnnotationColor }]}>/</Text>
              agentation
            </Text>
            <Text style={styles.settingsVersion}>v{__VERSION__}</Text>
            <TouchableOpacity
              style={styles.themeToggle}
              onPress={() => setIsDarkMode(!isDarkMode)}
              activeOpacity={0.7}
            >
              {isDarkMode ? <IconSun size={14} color="rgba(255, 255, 255, 0.4)" /> : <IconMoon size={14} color="rgba(255, 255, 255, 0.4)" />}
            </TouchableOpacity>
          </View>

          {/* Output Detail Section */}
          <View style={styles.settingsSectionFirst}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={settings.handleOutputDetailCycle}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsLabel}>Output Detail</Text>
              <View style={styles.settingsValueWithDots}>
                <Text style={styles.settingsValueText}>
                  {DETAIL_LEVEL_LABELS[settings.currentOutputDetail]}
                </Text>
                <View style={styles.cycleDots}>
                  {(['compact', 'standard', 'detailed', 'forensic'] as OutputDetailLevel[]).map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.cycleDot,
                        settings.currentOutputDetail === level && styles.cycleDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Marker Colour Section */}
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={settings.handleAnnotationColorCycle}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsLabel}>Marker Colour</Text>
              <View style={[styles.colorSwatch, { backgroundColor: settings.currentAnnotationColor }]} />
            </TouchableOpacity>
          </View>

          {/* Toggles Section */}
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={settings.handleClearAfterCopyToggle}
              activeOpacity={0.6}
            >
              <View style={[styles.checkbox, settings.currentClearAfterCopy && styles.checkboxChecked]}>
                {settings.currentClearAfterCopy && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>Clear after output</Text>
            </TouchableOpacity>
          </View>
        </FloatingContainer>
      </Animated.View>

      <View style={styles.toolbarWrapper} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.fabWrapper,
            {
              opacity: animations.fabOpacity,
              transform: [
                { scale: animations.entranceScale },
                { rotate: animations.entranceRotateInterpolate },
              ],
            },
          ]}
          pointerEvents={isExpanded ? 'none' : 'auto'}
        >
          <AnimatedButton onPress={handleFabPress} style={styles.fab}>
            <FloatingContainer style={styles.fabGlass}>
              <IconListSparkle size={20} color={iconColor} />
            </FloatingContainer>
          </AnimatedButton>

          {annotationCount > 0 && (
            <Animated.View
              style={[
                styles.badge,
                { backgroundColor: badgeColor, transform: [{ scale: animations.badgeScale }] },
              ]}
            >
              <Text style={styles.badgeText}>
                {annotationCount > 99 ? '99+' : annotationCount}
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.expandedWrapper,
            { opacity: animations.toolbarOpacity },
          ]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          <FloatingContainer style={styles.toolbar}>
            <View style={styles.toolbarButtons}>
              <AnimatedButton
                onPress={handleCopyPress}
                disabled={annotationCount === 0}
                style={[
                  styles.toolbarButton,
                  annotationCount === 0 && styles.toolbarButtonDisabled,
                ]}
              >
                <IconCopy size={18} color={annotationCount > 0 ? iconColor : '#666'} />
              </AnimatedButton>

              <AnimatedButton
                onPress={handleTrashPress}
                disabled={annotationCount === 0}
                style={[
                  styles.toolbarButton,
                  annotationCount === 0 && styles.toolbarButtonDisabled,
                ]}
              >
                <IconTrash size={18} color={annotationCount > 0 ? iconColor : '#666'} />
              </AnimatedButton>

              <AnimatedButton onPress={handleSettingsPress} style={styles.toolbarButton}>
                <IconGear size={18} color={iconColor} />
              </AnimatedButton>

              <AnimatedButton onPress={handleFabPress} style={styles.toolbarButton}>
                <IconClose size={18} color={iconColor} />
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
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  fabGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  expandedWrapper: {
    position: 'relative',
  },
  toolbar: {
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonDisabled: {
    opacity: 0.35,
  },

  floatingBackground: {
    backgroundColor: '#1a1a1a',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeExpanded: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  settingsMenuWrapper: {
    marginBottom: 8,
  },
  settingsMenu: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 205,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  settingsBrand: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.12,
    color: '#FFFFFF',
  },
  settingsBrandSlash: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  settingsVersion: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginLeft: 'auto',
    letterSpacing: -0.12,
  },
  themeToggle: {
    width: 22,
    height: 22,
    marginLeft: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSectionFirst: {
    paddingTop: 8,
  },
  settingsSection: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  settingsLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '400',
  },
  toggleLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 8,
  },
  settingsValueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  settingsValueWithDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cycleDots: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  cycleDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cycleDotActive: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2, // align with 20px swatch
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkmark: {
    color: '#1a1a1a',
    fontSize: 11,
    fontWeight: '600',
    marginTop: -1,
  },
});
