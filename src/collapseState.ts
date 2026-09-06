/**
 * The height state machine behind <Collapsible>.
 *
 * All of the genuinely hard behaviour in a collapsible lives in one question:
 * "given what we currently know about the content's height, what height should
 * the container be, and should getting there be animated?". Answering that in a
 * pure function is what makes the awkward cases — content that resizes while
 * open, images that arrive late, rotation mid-animation, a section that starts
 * open — testable instead of something you check by hand on a simulator.
 */

export type Align = 'top' | 'center' | 'bottom';

export interface CollapseInput {
  /** The `collapsed` prop. */
  collapsed: boolean;
  /** Height reported by the measuring view, or null before the first measure. */
  measuredHeight: number | null;
  /** The `collapsedHeight` prop. */
  collapsedHeight: number;
  /** False until the component has completed its first commit. */
  mounted: boolean;
  /** OS reduce-motion setting. */
  reduceMotion: boolean;
  /** Height currently on screen, used to decide whether anything must move. */
  currentHeight: number | null;
}

export interface CollapseOutput {
  /** Height the container should have. */
  targetHeight: number;
  /** Whether to animate towards it, or jump. */
  animate: boolean;
  /** True while the content height is still unknown and must not be animated to. */
  pending: boolean;
}

/**
 * Resolves the container height for the current props and measurement.
 */
export function resolveCollapseState(input: CollapseInput): CollapseOutput {
  const { collapsed, measuredHeight, collapsedHeight, mounted, reduceMotion, currentHeight } =
    input;

  // Collapsing never needs a measurement: the target is known outright, and a
  // section can always close even if its content never reported a height.
  if (collapsed) {
    return {
      targetHeight: collapsedHeight,
      // Nothing to animate on the very first commit, and reduce motion means jump.
      animate: mounted && !reduceMotion && currentHeight !== collapsedHeight,
      pending: false,
    };
  }

  // Expanding before the content has been measured. Animating to 0 here is what
  // makes images without intrinsic dimensions flash: the container opens to
  // nothing, then jumps once the image lands. Hold at the collapsed height and
  // wait for a real measurement instead.
  if (measuredHeight === null) {
    return { targetHeight: collapsedHeight, animate: false, pending: true };
  }

  return {
    targetHeight: measuredHeight,
    animate: mounted && !reduceMotion && currentHeight !== measuredHeight,
    pending: false,
  };
}

/**
 * Whether a freshly reported measurement is worth acting on.
 *
 * `onLayout` fires for sub-pixel changes and for every re-layout during an
 * orientation change, so measurements are ignored unless they actually differ.
 * The tolerance is half a point: below that the difference cannot be seen and
 * reacting to it only causes animation restarts.
 */
export function isMeaningfulMeasurement(
  previous: number | null,
  next: number,
  tolerance = 0.5,
): boolean {
  if (!Number.isFinite(next) || next < 0) return false;
  if (previous === null) return true;
  return Math.abs(previous - next) > tolerance;
}

/**
 * Where the content sits inside the container while it is shorter than the
 * content — the `align` prop. Returns the vertical offset to apply to the
 * content, which is zero or negative.
 */
export function contentOffsetFor(
  align: Align,
  containerHeight: number,
  contentHeight: number,
): number {
  const overflow = contentHeight - containerHeight;
  if (overflow <= 0) return 0;
  switch (align) {
    case 'center':
      return -overflow / 2;
    case 'bottom':
      return -overflow;
    case 'top':
    default:
      return 0;
  }
}

/**
 * Whether the collapsed content should still be mounted.
 *
 * Upstream's `renderChildrenCollapsed` keeps children in the tree while closed,
 * which matters when they hold state or are expensive to build.
 */
export function shouldRenderChildren(
  collapsed: boolean,
  renderChildrenCollapsed: boolean,
  hasEverExpanded: boolean,
): boolean {
  if (!collapsed) return true;
  if (renderChildrenCollapsed) return true;
  // Once measured, keeping the measuring view mounted avoids re-measuring from
  // scratch on every open, which is what makes repeat opens jump.
  return hasEverExpanded;
}
