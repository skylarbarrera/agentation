/**
 * Agentation Design System
 * Ported from web agentation repo
 *
 * Key characteristics:
 * - Minimalist, clean aesthetic
 * - Dark-first UI (#1a1a1a)
 * - Soft colors, subtle borders
 * - Rounded corners (6-16px)
 * - Smooth spring animations
 *
 * @author @skylarbarrera
 */

export const colors = {
  // Primary actions
  primary: '#3c82f7',
  primaryHover: '#74b1fd',
  success: '#34c759',
  danger: '#ff3b30',

  // Dark mode (primary UI)
  dark: {
    bg: '#1a1a1a',
    bgElevated: '#2a2a2a',
    bgOverlay: '#383838',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.85)',
    textTertiary: 'rgba(255,255,255,0.5)',
    textMuted: 'rgba(255,255,255,0.35)',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.12)',
  },

  // Light mode
  light: {
    bg: '#fdfdfc',
    bgCard: '#ffffff',
    bgSubtle: 'rgba(0,0,0,0.03)',
    bgHover: 'rgba(0,0,0,0.06)',
    text: '#111111',
    textSecondary: 'rgba(0,0,0,0.7)',
    textTertiary: 'rgba(0,0,0,0.5)',
    textMuted: 'rgba(0,0,0,0.35)',
    border: 'rgba(0,0,0,0.08)',
    borderMedium: 'rgba(0,0,0,0.12)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  // Toolbar-specific (from web SCSS)
  toolbar: 24, // 1.5rem - expanded toolbar
  toolbarCollapsed: 22, // collapsed toolbar circle
  popup: 16, // annotation popup
  pill: 999,
};

// Sizing constants (from web SCSS)
export const sizing = {
  // Toolbar dimensions
  toolbarHeight: 44,
  toolbarWidthCollapsed: 44,
  toolbarWidthExpanded: 257,
  toolbarWidthWithMcp: 297, // When MCP connection shown

  // Button dimensions
  buttonSize: 34,
  buttonSizeSmall: 28,

  // Marker dimensions
  markerSize: 22,
  markerMultiSelectSize: 26,

  // Popup dimensions
  popupWidth: 280,
  popupMaxHeight: 400,

  // Badge dimensions
  badgeHeight: 18,
  badgeMinWidth: 18,

  // Settings panel
  settingsPanelWidth: 240,
};

export const typography = {
  // React Native uses system fonts (SF Pro on iOS, Roboto on Android)
  sizes: {
    tiny: 10,
    small: 11,
    caption: 12,
    body: 14,
    ui: 13,
    title: 16,
    heading: 18,
    large: 20,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tight: -0.3,
    normal: 0,
    wide: 0.5,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  // Component-specific shadows (approximating web's multi-layer shadows)
  // Web: 0 2px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)
  toolbar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  // Web: 0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)
  popup: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  // Web: 0 2px 6px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.04)
  marker: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
};

// Animation presets (for react-native-reanimated)
export const animations = {
  spring: {
    damping: 15,
    stiffness: 150,
  },
  springBouncy: {
    damping: 12,
    stiffness: 180,
  },
  timing: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  // Web animation durations (from SCSS)
  durations: {
    toolbarEnter: 500,
    toolbarExpand: 400,
    markerIn: 250,
    markerOut: 200,
    popupEnter: 200,
    popupExit: 150,
    shake: 250,
    badgeEnter: 300, // + 400ms delay
    settingsPanel: 200,
  },
  // Web easing curves (cubic-bezier) - use with Reanimated's Easing.bezier()
  // Example: Easing.bezier(0.34, 1.2, 0.64, 1)
  easings: {
    // Bouncy entrance - cubic-bezier(0.34, 1.2, 0.64, 1)
    bouncy: [0.34, 1.2, 0.64, 1] as const,
    // Super bouncy (popup) - cubic-bezier(0.34, 1.56, 0.64, 1)
    superBouncy: [0.34, 1.56, 0.64, 1] as const,
    // Smooth entrance - cubic-bezier(0.22, 1, 0.36, 1)
    smooth: [0.22, 1, 0.36, 1] as const,
    // Chevron rotation - cubic-bezier(0.16, 1, 0.3, 1)
    chevron: [0.16, 1, 0.3, 1] as const,
    // Expo out - cubic-bezier(0.19, 1, 0.22, 1)
    expoOut: [0.19, 1, 0.22, 1] as const,
  },
};

/**
 * ANIMATION STATUS (using React Native core Animated API)
 *
 * ✅ IMPLEMENTED:
 *
 * 1. popupEnter - Scale + slide + opacity
 *    Web: scale(0.95) translateY(4px) → scale(1) translateY(0), 200ms
 *    RN: ✅ Animated.parallel([scale, translateY, opacity]), 200ms
 *    Location: AnnotationPopup.tsx:71-87
 *
 * 2. buttonPress - Spring scale feedback
 *    Web: scale(0.92) on :active
 *    RN: ✅ Animated.spring scale(0.9), friction 5
 *    Location: Toolbar.tsx:56-73 (AnimatedButton)
 *
 * 3. toolbarExpand - Expand/collapse transition
 *    RN: ✅ Animated.timing, 200ms
 *    Location: Toolbar.tsx:174-178
 *
 * 4. settingsPanel - Show/hide transition
 *    RN: ✅ Animated.timing, 150ms
 *    Location: Toolbar.tsx:182-185
 *
 * ⚠️ PARTIAL:
 *
 * 5. markerIn - Entrance animation
 *    Web: scale(0.3) → scale(1), 250ms smooth easing
 *    RN: ⚠️ Only opacity fade 200ms (missing scale)
 *    Location: AnnotationMarker.tsx:58-62
 *    TODO: Add scale animation to match web
 *
 * ❌ NOT IMPLEMENTED:
 *
 * 6. toolbarEnter - Dramatic first-load entrance
 *    Web: scale(0.5) rotate(90deg) → scale(1) rotate(0deg), 500ms bouncy
 *    RN: ❌ No entrance animation
 *    TODO: Animated.parallel([rotate, scale]) on mount
 *
 * 7. shake - Error feedback
 *    Web: translateX oscillation (-3px, 3px, -2px, 2px), 250ms
 *    RN: ❌ Not implemented
 *    TODO: Animated.sequence of translateX values
 *
 * 8. scaleIn (badge) - Badge entrance with delay
 *    Web: scale(0.85) → scale(1), 300ms + 400ms delay
 *    RN: ❌ Not implemented
 *    TODO: setTimeout + Animated.spring
 *
 * PLATFORM LIMITATIONS (cannot implement):
 * - Multi-layer shadows (iOS/Android only support single shadow)
 * - Inset shadows (not supported in RN)
 * - CSS blend modes on shadows
 */

// Common component styles
export const componentStyles = {
  // Cards
  card: {
    backgroundColor: colors.light.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardDark: {
    backgroundColor: colors.dark.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: colors.light.text,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
  },
  buttonSecondary: {
    backgroundColor: colors.light.bgCard,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.light.borderMedium,
  },

  // Icon buttons (toolbar style) - uses sizing.buttonSize (34)
  iconButton: {
    width: sizing.buttonSize,
    height: sizing.buttonSize,
    borderRadius: sizing.buttonSize / 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // Inputs
  input: {
    backgroundColor: colors.light.bgCard,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    fontSize: typography.sizes.body,
  },

  // Badges - uses sizing.badgeHeight (18)
  badge: {
    minWidth: sizing.badgeMinWidth,
    height: sizing.badgeHeight,
    borderRadius: sizing.badgeHeight / 2,
    paddingHorizontal: 5,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  badgeText: {
    color: '#fff',
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.semibold,
  },

  // Marker styles
  marker: {
    width: sizing.markerSize,
    height: sizing.markerSize,
    borderRadius: sizing.markerSize / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...shadows.marker,
  },
  markerMultiSelect: {
    width: sizing.markerMultiSelectSize,
    height: sizing.markerMultiSelectSize,
    borderRadius: sizing.markerMultiSelectSize / 2,
  },

  // Popup styles
  popup: {
    width: sizing.popupWidth,
    maxHeight: sizing.popupMaxHeight,
    borderRadius: radius.popup,
    ...shadows.popup,
  },

  // Toolbar styles
  toolbar: {
    height: sizing.toolbarHeight,
    borderRadius: radius.toolbar,
    ...shadows.toolbar,
  },
  toolbarCollapsed: {
    width: sizing.toolbarWidthCollapsed,
    height: sizing.toolbarHeight,
    borderRadius: radius.toolbarCollapsed,
  },
  toolbarExpanded: {
    width: sizing.toolbarWidthExpanded,
    height: sizing.toolbarHeight,
    borderRadius: radius.toolbar,
  },
};

export default {
  colors,
  spacing,
  radius,
  sizing,
  typography,
  shadows,
  animations,
  componentStyles,
};
