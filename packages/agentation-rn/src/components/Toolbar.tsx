import React, { useState, useCallback, useRef, useMemo, useContext, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Text,
  TextInput,
  StyleProp,
  ViewStyle,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconListSparkle,
  IconClose,
  IconCopy,
  IconTrash,
  IconGear,
  IconSun,
  IconMoon,
  IconEye,
  IconEyeSlash,
  IconCheckSmall,
  IconCheckCircle,
  IconPlay,
  IconPause,
  IconSendArrow,
  IconChevronRight,
  IconChevronLeft,
} from './Icons';
import type { OutputDetailLevel, ConnectionStatus } from '../types';
import { useToolbarAnimations } from '../hooks/useToolbarAnimations';
import { useToolbarSettings } from '../hooks/useToolbarSettings';
import { AgenationContext } from '../context/AgenationContext';
import { version as __VERSION__ } from '../../package.json';

// Colors matching web ($blue, $green, $red)
const COLORS = {
  blue: '#3c82f7',
  green: '#34c759',
  red: '#ff3b30',
} as const;

const THEME = {
  dark: {
    containerBg: '#1a1a1a',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',
    textQuaternary: 'rgba(255, 255, 255, 0.4)',
    toggleText: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(255, 255, 255, 0.07)',
    checkboxBorder: 'rgba(255, 255, 255, 0.2)',
    checkboxCheckedBg: '#FFFFFF',
    checkboxCheckedBorder: 'rgba(255, 255, 255, 0.3)',
    checkmarkColor: '#1a1a1a',
    dotInactive: 'rgba(255, 255, 255, 0.3)',
    dotActive: '#FFFFFF',
    iconDisabled: '#666666',
    shadowOpacity: 0.2,
    menuBorder: 'rgba(255, 255, 255, 0.08)',
    menuShadowOffset: 4,
    menuShadowOpacity: 0.3,
    menuShadowRadius: 20,
    inputBg: 'rgba(255, 255, 255, 0.08)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    divider: 'rgba(255, 255, 255, 0.15)',
    autoSendLabel: 'rgba(255, 255, 255, 0.4)',
    autoSendLabelActive: '#66b8ff',
  },
  light: {
    containerBg: '#FFFFFF',
    textPrimary: 'rgba(0, 0, 0, 0.85)',
    textSecondary: 'rgba(0, 0, 0, 0.5)',
    textTertiary: 'rgba(0, 0, 0, 0.4)',
    textQuaternary: 'rgba(0, 0, 0, 0.4)',
    toggleText: 'rgba(0, 0, 0, 0.5)',
    border: 'rgba(0, 0, 0, 0.08)',
    checkboxBorder: 'rgba(0, 0, 0, 0.15)',
    checkboxCheckedBg: '#1a1a1a',
    checkboxCheckedBorder: '#1a1a1a',
    checkmarkColor: '#FFFFFF',
    dotInactive: 'rgba(0, 0, 0, 0.2)',
    dotActive: 'rgba(0, 0, 0, 0.7)',
    iconDisabled: 'rgba(0, 0, 0, 0.3)',
    shadowOpacity: 0.2,
    menuBorder: 'rgba(0, 0, 0, 0.04)',
    menuShadowOffset: 1,
    menuShadowOpacity: 0.25,
    menuShadowRadius: 8,
    inputBg: 'rgba(0, 0, 0, 0.04)',
    inputBorder: 'rgba(0, 0, 0, 0.1)',
    divider: 'rgba(0, 0, 0, 0.1)',
    autoSendLabel: 'rgba(0, 0, 0, 0.4)',
    autoSendLabelActive: COLORS.blue,
  },
} as const;

const DETAIL_LEVEL_LABELS: Record<OutputDetailLevel, string> = {
  compact: 'Compact',
  standard: 'Standard',
  detailed: 'Detailed',
  forensic: 'Forensic',
};

// Simple URL validation
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
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
  autoClearAfterCopy?: boolean;
  onAutoClearAfterCopyChange?: (value: boolean) => void;
  annotationColor?: string;
  onAnnotationColorChange?: (color: string) => void;
  offset?: { x?: number; y?: number };
  onSettingsMenuChange?: (isOpen: boolean) => void;
  // Markers visibility
  showMarkers?: boolean;
  onShowMarkersChange?: (show: boolean) => void;
  // Pause button (shown when plugin provides it)
  showPauseButton?: boolean;
  isPaused?: boolean;
  onPauseToggle?: () => void;
  // V2 MCP Integration Props
  showSendToAgent?: boolean;
  onSendToAgent?: () => void;
  connectionStatus?: ConnectionStatus;
  mcpEndpoint?: string;
  // V2 Webhook Props
  webhookUrl?: string;
  onWebhookUrlChange?: (url: string) => void;
  webhooksEnabled?: boolean;
  onWebhooksEnabledChange?: (enabled: boolean) => void;
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
    autoClearAfterCopy: controlledAutoClearAfterCopy,
    onAutoClearAfterCopyChange,
    annotationColor: controlledAnnotationColor,
    onAnnotationColorChange,
    offset,
    onSettingsMenuChange,
    showMarkers: controlledShowMarkers,
    onShowMarkersChange,
    showPauseButton = false,
    isPaused = false,
    onPauseToggle,
    // V2 MCP props
    showSendToAgent = false,
    onSendToAgent,
    connectionStatus = 'disconnected',
    mcpEndpoint,
    // V2 Webhook props
    webhookUrl: controlledWebhookUrl,
    onWebhookUrlChange,
    webhooksEnabled: controlledWebhooksEnabled,
    onWebhooksEnabledChange,
  } = props;

  const insets = useSafeAreaInsets();
  const context = useContext(AgenationContext);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsPage, setSettingsPage] = useState<'main' | 'automations'>('main');
  const [internalShowMarkers, setInternalShowMarkers] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const showMarkers = controlledShowMarkers ?? internalShowMarkers;

  const isDarkMode = context?.isDarkMode ?? true;
  const setIsDarkMode = context?.setIsDarkMode ?? (() => {});
  const theme = useMemo(() => THEME[isDarkMode ? 'dark' : 'light'], [isDarkMode]);

  const animations = useToolbarAnimations(isExpanded, showSettingsMenu, annotationCount, settingsPage);

  const settings = useToolbarSettings({
    controlledOutputDetail,
    onOutputDetailChange,
    controlledAutoClearAfterCopy,
    onAutoClearAfterCopyChange,
    controlledAnnotationColor,
    onAnnotationColorChange,
    controlledWebhookUrl,
    onWebhookUrlChange,
    controlledWebhooksEnabled,
    onWebhooksEnabledChange,
  });

  // Reset to main page when settings menu closes
  useEffect(() => {
    if (!showSettingsMenu) {
      setSettingsPage('main');
    }
  }, [showSettingsMenu]);

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
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [onCopyMarkdown]);

  // Remove trash confirmation - just clear directly
  const handleTrashPress = useCallback(() => {
    onClearAll();
  }, [onClearAll]);

  const handleSettingsPress = useCallback(() => {
    setShowSettingsMenu(prev => {
      const newValue = !prev;
      onSettingsMenuChange?.(newValue);
      return newValue;
    });
  }, [onSettingsMenuChange]);

  const handleMarkersToggle = useCallback(() => {
    const newValue = !showMarkers;
    setInternalShowMarkers(newValue);
    onShowMarkersChange?.(newValue);
  }, [showMarkers, onShowMarkersChange]);

  const handleNavigateToAutomations = useCallback(() => {
    setSettingsPage('automations');
  }, []);

  const handleNavigateToMain = useCallback(() => {
    setSettingsPage('main');
  }, []);

  const handleLearnMore = useCallback(() => {
    Linking.openURL('https://github.com/anthropics/agentation');
  }, []);

  const bottomPosition = Math.max(insets.bottom, 16) + 16 + (offset?.y ?? 0);
  const rightPosition = 20 + (offset?.x ?? 0);

  const iconColor = theme.textPrimary;
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
        <FloatingContainer style={[
          styles.settingsMenu,
          {
            backgroundColor: theme.containerBg,
            borderWidth: 1,
            borderColor: theme.menuBorder,
            ...Platform.select({
              ios: {
                shadowOffset: { width: 0, height: theme.menuShadowOffset },
                shadowOpacity: theme.menuShadowOpacity,
                shadowRadius: theme.menuShadowRadius,
              },
            }),
          },
        ]}>
          {/* Two-page container with slide animation */}
          <View style={styles.settingsPagesContainer}>
            {/* Main Settings Page */}
            <Animated.View
              style={[
                styles.settingsPage,
                {
                  transform: [{
                    translateX: animations.pageSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -280],
                    }),
                  }],
                  opacity: animations.pageSlideAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0.5, 0],
                  }),
                },
              ]}
              pointerEvents={settingsPage === 'main' ? 'auto' : 'none'}
            >
              {/* Header with brand and theme toggle */}
              <View style={[styles.settingsHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.settingsBrand, { color: theme.textPrimary }]}>
                  <Text style={{ color: settings.currentAnnotationColor }}>/</Text>
                  agentation
                </Text>
                <Text style={[styles.settingsVersion, { color: theme.textQuaternary }]}>v{__VERSION__}</Text>
                <TouchableOpacity
                  style={styles.themeToggle}
                  onPress={() => setIsDarkMode(!isDarkMode)}
                  activeOpacity={0.7}
                >
                  {isDarkMode ? <IconSun size={14} color={theme.textQuaternary} /> : <IconMoon size={14} color={theme.textQuaternary} />}
                </TouchableOpacity>
              </View>

              {/* Output Detail */}
              <View style={styles.settingsSectionFirst}>
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={settings.handleOutputDetailCycle}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Output Detail</Text>
                  <View style={styles.settingsValueWithDots}>
                    <Text style={[styles.settingsValueText, { color: theme.textPrimary }]}>
                      {DETAIL_LEVEL_LABELS[settings.currentOutputDetail]}
                    </Text>
                    <View style={styles.cycleDots}>
                      {(['compact', 'standard', 'detailed', 'forensic'] as OutputDetailLevel[]).map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.cycleDot,
                            { backgroundColor: theme.dotInactive },
                            settings.currentOutputDetail === level && { backgroundColor: theme.dotActive },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Marker Color */}
              <View style={[styles.settingsSection, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={settings.handleAnnotationColorCycle}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Marker Colour</Text>
                  <View style={[styles.colorSwatch, { backgroundColor: settings.currentAnnotationColor }]} />
                </TouchableOpacity>
              </View>

              {/* Clear after output toggle */}
              <View style={[styles.settingsSection, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={settings.handleAutoClearAfterCopyToggle}
                  activeOpacity={0.6}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: theme.checkboxBorder },
                    settings.currentAutoClearAfterCopy && {
                      backgroundColor: theme.checkboxCheckedBg,
                      borderColor: theme.checkboxCheckedBorder,
                    },
                  ]}>
                    {settings.currentAutoClearAfterCopy && (
                      <IconCheckSmall size={12} color={theme.checkmarkColor} />
                    )}
                  </View>
                  <Text style={[styles.toggleLabel, { color: theme.toggleText }]}>Clear on copy/send</Text>
                </TouchableOpacity>
              </View>

              {/* Navigation to Automations page */}
              <View style={[styles.settingsSection, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={handleNavigateToAutomations}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Manage MCP & Webhooks</Text>
                  <IconChevronRight size={16} color={theme.textQuaternary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Automations Page */}
            <Animated.View
              style={[
                styles.settingsPage,
                styles.automationsPage,
                {
                  transform: [{
                    translateX: animations.pageSlideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [280, 0],
                    }),
                  }],
                  opacity: animations.pageSlideAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.5, 1],
                  }),
                },
              ]}
              pointerEvents={settingsPage === 'automations' ? 'auto' : 'none'}
            >
              {/* Back button */}
              <TouchableOpacity
                style={styles.settingsBackRow}
                onPress={handleNavigateToMain}
                activeOpacity={0.7}
              >
                <IconChevronLeft size={16} color={theme.textQuaternary} />
                <Text style={[styles.settingsBackText, { color: theme.textPrimary }]}>Manage MCP & Webhooks</Text>
              </TouchableOpacity>

              {/* MCP Connection Section */}
              <View style={[styles.settingsSection, { borderTopColor: theme.border }]}>
                <View style={styles.settingsRow}>
                  <Text style={[styles.automationHeader, { color: theme.textPrimary }]}>MCP Connection</Text>
                  {mcpEndpoint && connectionStatus !== 'disconnected' && (
                    <Animated.View style={[
                      styles.mcpStatusDot,
                      connectionStatus === 'connected' && styles.mcpStatusDotConnected,
                      connectionStatus === 'connecting' && styles.mcpStatusDotConnecting,
                    ]} />
                  )}
                </View>
              </View>

              {/* Webhooks Section */}
              <View style={[styles.settingsSection, { borderTopColor: theme.border }]}>
                <View style={styles.settingsRow}>
                  <Text style={[styles.automationHeader, { color: theme.textPrimary }]}>Webhooks</Text>
                  <View style={styles.autoSendRow}>
                    <Text style={[
                      styles.autoSendLabel,
                      { color: settings.currentWebhooksEnabled ? theme.autoSendLabelActive : theme.autoSendLabel },
                    ]}>Auto-Send</Text>
                    <TouchableOpacity
                      style={[
                        styles.toggleSwitch,
                        !settings.currentWebhookUrl && styles.toggleSwitchDisabled,
                      ]}
                      onPress={settings.handleWebhooksEnabledToggle}
                      disabled={!settings.currentWebhookUrl}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.toggleSlider,
                        { backgroundColor: isDarkMode ? '#484848' : '#dddddd' },
                        settings.currentWebhooksEnabled && settings.currentWebhookUrl && { backgroundColor: COLORS.blue },
                      ]}>
                        <Animated.View style={[
                          styles.toggleKnob,
                          settings.currentWebhooksEnabled && settings.currentWebhookUrl && styles.toggleKnobActive,
                        ]} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Webhook URL Input */}
              <View style={styles.webhookInputRow}>
                <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Webhook URL</Text>
                <TextInput
                  style={[
                    styles.webhookInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.textPrimary,
                    },
                  ]}
                  placeholder="https://..."
                  placeholderTextColor={theme.textQuaternary}
                  value={settings.currentWebhookUrl}
                  onChangeText={settings.handleWebhookUrlChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
            </Animated.View>
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
          <AnimatedButton onPress={handleFabPress} style={[
            styles.fab,
            { backgroundColor: theme.containerBg },
            Platform.select({
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
          ]}>
            <IconListSparkle size={20} color={iconColor} />
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
          <FloatingContainer style={[styles.toolbar, { backgroundColor: theme.containerBg }]}>
            <View style={styles.toolbarButtons}>
              {/* Pause button (only when plugin provides it) */}
              {showPauseButton && onPauseToggle && (
                <AnimatedButton
                  onPress={onPauseToggle}
                  style={[
                    styles.toolbarButton,
                    isPaused && styles.toolbarButtonActive,
                  ]}
                >
                  {isPaused ? (
                    <IconPlay size={24} color={isPaused ? COLORS.blue : iconColor} />
                  ) : (
                    <IconPause size={24} color={iconColor} />
                  )}
                </AnimatedButton>
              )}

              {/* Eye toggle (markers visibility) */}
              <AnimatedButton
                onPress={handleMarkersToggle}
                disabled={annotationCount === 0}
                style={[
                  styles.toolbarButton,
                  annotationCount === 0 && styles.toolbarButtonDisabled,
                ]}
              >
                {showMarkers ? (
                  <IconEye size={24} color={annotationCount > 0 ? iconColor : theme.iconDisabled} />
                ) : (
                  <IconEyeSlash size={24} color={annotationCount > 0 ? iconColor : theme.iconDisabled} />
                )}
              </AnimatedButton>

              {/* Copy button */}
              <AnimatedButton
                onPress={handleCopyPress}
                disabled={annotationCount === 0}
                style={[
                  styles.toolbarButton,
                  annotationCount === 0 && styles.toolbarButtonDisabled,
                ]}
              >
                {copySuccess ? (
                  <IconCheckCircle size={24} color={COLORS.green} />
                ) : (
                  <IconCopy size={24} color={annotationCount > 0 ? iconColor : theme.iconDisabled} />
                )}
              </AnimatedButton>

              {/* Send button - only visible when webhook URL is valid AND auto-send is off */}
              {!settings.currentWebhooksEnabled && isValidUrl(settings.currentWebhookUrl) && onSendToAgent && (
                <AnimatedButton
                  onPress={onSendToAgent}
                  disabled={annotationCount === 0}
                  style={[
                    styles.toolbarButton,
                    annotationCount === 0 && styles.toolbarButtonDisabled,
                  ]}
                >
                  <IconSendArrow size={24} color={annotationCount > 0 ? iconColor : theme.iconDisabled} />
                </AnimatedButton>
              )}

              {/* Trash button */}
              <AnimatedButton
                onPress={handleTrashPress}
                disabled={annotationCount === 0}
                style={[
                  styles.toolbarButton,
                  annotationCount === 0 && styles.toolbarButtonDisabled,
                ]}
              >
                <IconTrash size={24} color={annotationCount > 0 ? iconColor : theme.iconDisabled} />
              </AnimatedButton>

              {/* Settings button */}
              <AnimatedButton onPress={handleSettingsPress} style={styles.toolbarButton}>
                <IconGear size={24} color={iconColor} />
                {mcpEndpoint && connectionStatus === 'connected' && (
                  <View style={styles.gearStatusDot} />
                )}
                {mcpEndpoint && connectionStatus === 'connecting' && (
                  <View style={[styles.gearStatusDot, styles.gearStatusDotConnecting]} />
                )}
              </AnimatedButton>

              {/* Divider before close */}
              <View style={[styles.toolbarDivider, { backgroundColor: theme.divider }]} />

              {/* Close button */}
              <AnimatedButton onPress={handleFabPress} style={styles.toolbarButton}>
                <IconClose size={24} color={iconColor} />
              </AnimatedButton>
            </View>
          </FloatingContainer>
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
  toolbarButtonActive: {
    backgroundColor: 'rgba(60, 130, 247, 0.25)', // COLORS.blue with opacity
  },
  toolbarDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 2,
  },

  floatingBackground: {
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
    paddingTop: 13,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  settingsPagesContainer: {
    position: 'relative',
    minWidth: 205,
  },
  settingsPage: {
    // Main page styles
  },
  automationsPage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minWidth: 205,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  settingsBrand: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.12,
  },
  settingsVersion: {
    fontSize: 11,
    fontWeight: '400',
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
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  settingsBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginLeft: -4,
    marginBottom: 4,
  },
  settingsBackText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 8,
  },
  settingsValueText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  mcpStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginRight: 6,
  },
  statusDotConnected: {
    backgroundColor: '#34C759',
  },
  statusDotConnecting: {
    backgroundColor: '#FFD60A',
  },
  mcpStatusText: {
    fontSize: 13,
  },
  learnMoreLink: {
    color: '#3c82f7',
    fontSize: 13,
  },
  webhookInputRow: {
    paddingTop: 8,
    marginTop: 8,
  },
  webhookInput: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    marginTop: 6,
  },
  gearStatusDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    borderWidth: 1.5,
    borderColor: '#1a1a1a',
  },
  gearStatusDotConnecting: {
    backgroundColor: '#FFD60A',
  },
  // Automations page styles
  automationHeader: {
    fontSize: 13,
    fontWeight: '400',
  },
  autoSendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autoSendLabel: {
    fontSize: 11,
    fontWeight: '400',
  },
  // iOS-style toggle switch
  toggleSwitch: {
    width: 24,
    height: 16,
  },
  toggleSwitchDisabled: {
    opacity: 0.4,
  },
  toggleSlider: {
    width: 24,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleKnobActive: {
    marginLeft: 10, // Move to right when active
  },
  // MCP status dot (animated)
  mcpStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  mcpStatusDotConnected: {
    backgroundColor: '#34C759',
  },
  mcpStatusDotConnecting: {
    backgroundColor: '#f5a623',
  },
});
