/**
 * AnimationScreen - Reanimated Animation Examples
 *
 * Demonstrates the pause functionality with various Reanimated animations
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../theme';
import { Card, SectionHeader, Paragraph, HighlightBox } from '../components';

// =============================================================================
// Animated Components
// =============================================================================

function BouncingBall() {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-100, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })
      ),
      -1, // Infinite
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.ball, animatedStyle]} />
    </View>
  );
}

function SpinningSquare() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.square, animatedStyle]} />
    </View>
  );
}

function PulsingCircle() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.circle, animatedStyle]} />
    </View>
  );
}

function SlidingBar() {
  const translateX = useSharedValue(-100);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true // Reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.barContainer}>
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
}

function FadingDots() {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    opacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      false
    );

    // Staggered start for dot 2
    setTimeout(() => {
      opacity2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      );
    }, 150);

    // Staggered start for dot 3
    setTimeout(() => {
      opacity3.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      );
    }, 300);
  }, []);

  const style1 = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const style2 = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const style3 = useAnimatedStyle(() => ({ opacity: opacity3.value }));

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, style1]} />
      <Animated.View style={[styles.dot, style2]} />
      <Animated.View style={[styles.dot, style3]} />
    </View>
  );
}

function ColorShift() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate between colors
    const r = Math.round(59 + (255 - 59) * progress.value);
    const g = Math.round(130 + (87 - 130) * progress.value);
    const b = Math.round(247 + (51 - 247) * progress.value);
    return {
      backgroundColor: `rgb(${r}, ${g}, ${b})`,
    };
  });

  return (
    <View style={styles.animationContainer}>
      <Animated.View style={[styles.colorBox, animatedStyle]} />
    </View>
  );
}

// =============================================================================
// AnimationScreen
// =============================================================================

export function AnimationScreen() {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Animations</Text>
        <Text style={styles.tagline}>Pause to annotate moving elements</Text>
      </View>

      {/* Introduction */}
      <Card>
        <Paragraph>
          Animations make it hard to annotate specific elements - they move before
          you can tap them! The pause button freezes all Reanimated animations.
        </Paragraph>
        <HighlightBox>
          Tap the pause button in the toolbar to freeze these animations, then
          annotate any element. Tap play to resume.
        </HighlightBox>
      </Card>

      {/* Animation Grid */}
      <SectionHeader title="Animation examples" />
      <Card>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Bouncing</Text>
            <BouncingBall />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Spinning</Text>
            <SpinningSquare />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Pulsing</Text>
            <PulsingCircle />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Color Shift</Text>
            <ColorShift />
          </View>
        </View>
      </Card>

      {/* Sliding Bar */}
      <SectionHeader title="Progress indicator" />
      <Card>
        <Text style={styles.label}>Sliding Bar</Text>
        <SlidingBar />
      </Card>

      {/* Loading Dots */}
      <SectionHeader title="Loading state" />
      <Card>
        <Text style={styles.label}>Loading Dots</Text>
        <FadingDots />
      </Card>

      {/* Instructions */}
      <SectionHeader title="How pause works" />
      <Card>
        <Paragraph>
          The pause feature uses reanimated-pause-state to freeze shared values.
          When paused:
        </Paragraph>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• All animations freeze in place</Text>
          <Text style={styles.bullet}>• You can tap to annotate any element</Text>
          <Text style={styles.bullet}>• Elements stay in their paused position</Text>
          <Text style={styles.bullet}>• Resume to continue animations</Text>
        </View>
      </Card>

      {/* Footer spacing */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.light.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.light.text,
    letterSpacing: typography.letterSpacing.tight,
  },
  tagline: {
    fontSize: typography.sizes.title,
    color: colors.light.textTertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '47%',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.light.textTertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Animation containers
  animationContainer: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  barContainer: {
    height: 60,
    backgroundColor: colors.light.bgSubtle,
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },

  // Animated shapes
  ball: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  square: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF9500', // Orange/warning color
  },
  colorBox: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  bar: {
    width: 80,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },

  // Bullet list
  bulletList: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  bullet: {
    fontSize: typography.sizes.body,
    color: colors.light.textSecondary,
    lineHeight: 22,
  },
});
