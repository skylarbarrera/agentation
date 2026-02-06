/**
 * Icons for Agentation Toolbar
 * SVG icons adapted from web Agentation
 * Falls back to emoji if react-native-svg not available
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

// Try to import react-native-svg, fallback to emoji if not available
let Svg: any;
let Path: any;
let Circle: any;
let G: any;
let ClipPath: any;
let Defs: any;
let Rect: any;

try {
  const svg = require('react-native-svg');
  Svg = svg.Svg;
  Path = svg.Path;
  Circle = svg.Circle;
  G = svg.G;
  ClipPath = svg.ClipPath;
  Defs = svg.Defs;
  Rect = svg.Rect;
} catch {
  // react-native-svg not available, will use emoji fallback
}

interface IconProps {
  size?: number;
  color?: string;
}

// Fallback component when SVG not available
function EmojiIcon({ emoji, size = 24 }: { emoji: string; size?: number }) {
  return (
    <View style={[styles.emojiContainer, { width: size, height: size }]}>
      <Text style={[styles.emoji, { fontSize: size * 0.7 }]}>{emoji}</Text>
    </View>
  );
}

/**
 * List with sparkle - Agentation logo icon
 */
export function IconListSparkle({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="✨" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.5 12L5.5 12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 6.75L5.5 6.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.25 17.25L5.5 17.25"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 12.75L16.5179 13.9677C16.8078 14.6494 17.3506 15.1922 18.0323 15.4821L19.25 16L18.0323 16.5179C17.3506 16.8078 16.8078 17.3506 16.5179 18.0323L16 19.25L15.4821 18.0323C15.1922 17.3506 14.6494 16.8078 13.9677 16.5179L12.75 16L13.9677 15.4821C14.6494 15.1922 15.1922 14.6494 15.4821 13.9677L16 12.75Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Play icon (triangle)
 */
export function IconPlay({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="▶️" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.75 10.701C18.75 11.2783 18.75 12.7217 17.75 13.299L8.75 18.4952C7.75 19.0725 6.5 18.3509 6.5 17.1962L6.5 6.80384C6.5 5.64914 7.75 4.92746 8.75 5.50481L17.75 10.701Z"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

/**
 * Pause icon (two bars)
 */
export function IconPause({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="⏸️" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6L8 18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16 18L16 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Copy icon
 */
export function IconCopy({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="📋" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.75 11.25C4.75 10.4216 5.42157 9.75 6.25 9.75H12.75C13.5784 9.75 14.25 10.4216 14.25 11.25V17.75C14.25 18.5784 13.5784 19.25 12.75 19.25H6.25C5.42157 19.25 4.75 18.5784 4.75 17.75V11.25Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M17.25 14.25H17.75C18.5784 14.25 19.25 13.5784 19.25 12.75V6.25C19.25 5.42157 18.5784 4.75 17.75 4.75H11.25C10.4216 4.75 9.75 5.42157 9.75 6.25V6.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Trash icon
 */
export function IconTrash({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="🗑️" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 11.5L10.125 15.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11.5L13.87 15.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 7.5V6.25C9 5.42157 9.67157 4.75 10.5 4.75H13.5C14.3284 4.75 15 5.42157 15 6.25V7.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 7.75H18.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M6.75 7.75L7.11691 16.189C7.16369 17.2649 7.18708 17.8028 7.41136 18.2118C7.60875 18.5717 7.91211 18.8621 8.28026 19.0437C8.69854 19.25 9.23699 19.25 10.3139 19.25H13.6861C14.763 19.25 15.3015 19.25 15.7197 19.0437C16.0879 18.8621 16.3912 18.5717 16.5886 18.2118C16.8129 17.8028 16.8363 17.2649 16.8831 16.189L17.25 7.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Gear/Settings icon
 */
export function IconGear({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="⚙️" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.6504 5.81117C10.9939 4.39628 13.0061 4.39628 13.3496 5.81117C13.5715 6.72517 14.6187 7.15891 15.4219 6.66952C16.6652 5.91193 18.0881 7.33479 17.3305 8.57815C16.8411 9.38134 17.2748 10.4285 18.1888 10.6504C19.6037 10.9939 19.6037 13.0061 18.1888 13.3496C17.2748 13.5715 16.8411 14.6187 17.3305 15.4219C18.0881 16.6652 16.6652 18.0881 15.4219 17.3305C14.6187 16.8411 13.5715 17.2748 13.3496 18.1888C13.0061 19.6037 10.9939 19.6037 10.6504 18.1888C10.4285 17.2748 9.38135 16.8411 8.57815 17.3305C7.33479 18.0881 5.91193 16.6652 6.66952 15.4219C7.15891 14.6187 6.72517 13.5715 5.81117 13.3496C4.39628 13.0061 4.39628 10.9939 5.81117 10.6504C6.72517 10.4285 7.15891 9.38134 6.66952 8.57815C5.91193 7.33479 7.33479 5.91192 8.57815 6.66952C9.38135 7.15891 10.4285 6.72517 10.6504 5.81117Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={2.5} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

/**
 * Checkmark icon
 */
export function IconCheck({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="✓" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.25 8.75L10 15.25L7.25 12.25"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Close/X icon
 */
export function IconClose({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="✕" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.25 16.25L7.75 7.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.75 16.25L16.25 7.75"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Send arrow icon (for "Send to Agent")
 * V2 feature
 */
export function IconSendArrow({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="➤" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0537C3.80791 10.3919 4.34498 10.6605 5.41912 11.1976L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Wifi/connection icon (for connection status)
 * V2 feature
 */
export function IconWifi({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="📶" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19.5C12.8284 19.5 13.5 18.8284 13.5 18C13.5 17.1716 12.8284 16.5 12 16.5C11.1716 16.5 10.5 17.1716 10.5 18C10.5 18.8284 11.1716 19.5 12 19.5Z"
        fill={color}
      />
      <Path
        d="M12 13.5C10.8954 13.5 9.90793 14.0154 9.24264 14.8033"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.7574 14.8033C14.0921 14.0154 13.1046 13.5 12 13.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.34315 11.3431C8.18905 9.70053 10 9 12 9C14 9 15.811 9.70053 17.6569 11.3431"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51472 8.51472C6.18629 6.16829 9 5 12 5C15 5 17.8137 6.16829 20.4853 8.51472"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Disconnected/offline icon
 * V2 feature
 */
export function IconWifiOff({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="📵" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19.5C12.8284 19.5 13.5 18.8284 13.5 18C13.5 17.1716 12.8284 16.5 12 16.5C11.1716 16.5 10.5 17.1716 10.5 18C10.5 18.8284 11.1716 19.5 12 19.5Z"
        fill={color}
      />
      <Path
        d="M3 3L21 21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 13.5C10.5 13.5 11.5 14 12.5 15"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 9C8 9 10 9.5 12 10.5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Chevron right icon (for navigation)
 */
export function IconChevronRight({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="›" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Chevron left icon (for back navigation)
 */
export function IconChevronLeft({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="‹" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6L9 12L15 18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Question mark/help icon (for tooltips)
 */
export function IconHelp({ size = 24, color = 'currentColor' }: IconProps) {
  if (!Svg) return <EmojiIcon emoji="?" size={size} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.25} stroke={color} strokeWidth={1.5} />
      <Path
        d="M10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10C14 10.8291 13.4977 11.5418 12.7654 11.8516C12.3229 12.0366 12 12.4477 12 12.9293V13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={16} r={1} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});
