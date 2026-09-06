import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  contentOffsetFor,
  isMeaningfulMeasurement,
  resolveCollapseState,
  shouldRenderChildren,
} from './collapseState.js';
import { resolveEasing } from './easing.js';
import { useReduceMotion } from './useReduceMotion.js';
import type { CollapsibleProps } from './types.js';

/**
 * A container that animates between a collapsed height and the natural height of
 * its content.
 *
 * The content is always laid out at its full height inside a clipped container;
 * only the container's height is animated, on the UI thread. That is what lets
 * the height follow content that changes while the section is open — the measure
 * view keeps reporting, and the target simply moves.
 */
export function Collapsible({
  collapsed = true,
  collapsedHeight = 0,
  duration = 300,
  easing = 'ease',
  align = 'top',
  enablePointerEvents = false,
  onAnimationEnd,
  renderChildrenCollapsed = false,
  style,
  children,
  accessibilityLabel,
}: CollapsibleProps) {
  const reduceMotion = useReduceMotion();

  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const [hasEverExpanded, setHasEverExpanded] = useState(!collapsed);

  // Mount is tracked in a ref because the very first commit must not animate:
  // a section rendered already-open should just be open, not slide in.
  const mounted = useRef(false);
  const height = useSharedValue(collapsed ? collapsedHeight : 0);
  const contentHeight = useSharedValue(0);
  const currentHeight = useRef<number | null>(null);

  useEffect(() => {
    if (!collapsed) setHasEverExpanded(true);
  }, [collapsed]);

  const handleAnimationEnd = useCallback(() => {
    onAnimationEnd?.();
  }, [onAnimationEnd]);

  useEffect(() => {
    const state = resolveCollapseState({
      collapsed,
      measuredHeight,
      collapsedHeight,
      mounted: mounted.current,
      reduceMotion,
      currentHeight: currentHeight.current,
    });

    if (state.pending) {
      // Height is not known yet. Stay put; the layout callback will re-run this.
      // Deliberately does NOT mark the component mounted: for a section rendered
      // already-open, the first measurement *is* the first commit, and treating
      // it as a later change would animate it open on mount.
      return;
    }

    currentHeight.current = state.targetHeight;
    contentHeight.value = measuredHeight ?? 0;

    if (!state.animate) {
      height.value = state.targetHeight;
      mounted.current = true;
      return;
    }

    height.value = withTiming(
      state.targetHeight,
      { duration, easing: resolveEasing(easing) },
      (finished) => {
        'worklet';
        if (finished) scheduleOnRN(handleAnimationEnd);
      },
    );
    mounted.current = true;
  }, [
    collapsed,
    measuredHeight,
    collapsedHeight,
    reduceMotion,
    duration,
    easing,
    height,
    contentHeight,
    handleAnimationEnd,
  ]);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    // Ignore sub-pixel churn and repeated identical reports, otherwise an
    // orientation change or a re-render restarts the animation mid-flight.
    setMeasuredHeight((previous) => (isMeaningfulMeasurement(previous, next) ? next : previous));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ height: height.value }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentOffsetFor(align, height.value, contentHeight.value) }],
  }));

  const showChildren = shouldRenderChildren(collapsed, renderChildrenCollapsed, hasEverExpanded);

  return (
    <Animated.View
      style={[styles.container, containerStyle, style]}
      pointerEvents={collapsed && !enablePointerEvents ? 'none' : 'auto'}
      // Collapsed content must not be reachable by a screen reader; otherwise
      // VoiceOver walks into text nobody can see.
      accessibilityElementsHidden={collapsed}
      importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}
      {...(accessibilityLabel !== undefined ? { accessibilityLabel } : {})}
    >
      <Animated.View style={[styles.content, contentStyle]}>
        {/*
          The measuring view is laid out at its natural height regardless of the
          container, which is what makes measurement independent of the animation.
        */}
        <View onLayout={handleContentLayout}>{showChildren ? children : null}</View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  content: { position: 'absolute', left: 0, right: 0, top: 0 },
});

export default Collapsible;
