import { describe, expect, it } from 'vitest';
import {
  contentOffsetFor,
  isMeaningfulMeasurement,
  resolveCollapseState,
  shouldRenderChildren,
  type CollapseInput,
} from '../src/collapseState.js';

const base: CollapseInput = {
  collapsed: true,
  measuredHeight: null,
  collapsedHeight: 0,
  mounted: true,
  reduceMotion: false,
  currentHeight: 0,
};

const state = (overrides: Partial<CollapseInput>) =>
  resolveCollapseState({ ...base, ...overrides });

describe('resolveCollapseState', () => {
  it('collapses to collapsedHeight', () => {
    expect(state({ collapsed: true, collapsedHeight: 20, currentHeight: 120 })).toEqual({
      targetHeight: 20,
      animate: true,
      pending: false,
    });
  });

  it('expands to the measured content height', () => {
    expect(state({ collapsed: false, measuredHeight: 140 })).toEqual({
      targetHeight: 140,
      animate: true,
      pending: false,
    });
  });

  it('does not animate when the height is already right', () => {
    expect(state({ collapsed: false, measuredHeight: 140, currentHeight: 140 }).animate).toBe(false);
  });

  it('can always collapse, even if the content never reported a height', () => {
    const result = state({ collapsed: true, measuredHeight: null, currentHeight: 90 });
    expect(result.pending).toBe(false);
    expect(result.targetHeight).toBe(0);
  });

  it('jumps instead of animating under reduce motion', () => {
    expect(state({ collapsed: false, measuredHeight: 140, reduceMotion: true }).animate).toBe(false);
  });
});

/**
 * The five cases below are the ones react-native-collapsible handles badly, and
 * they are the reason this package exists. Each gets a test.
 */
describe('the cases the original gets wrong', () => {
  it('1. follows content whose height changes while the section is open', () => {
    // A list that loads asynchronously: open at 100, content grows to 260.
    const opened = state({ collapsed: false, measuredHeight: 100, currentHeight: 100 });
    expect(opened.animate).toBe(false);

    const grown = state({ collapsed: false, measuredHeight: 260, currentHeight: 100 });
    expect(grown.targetHeight).toBe(260);
    expect(grown.animate).toBe(true);

    // And shrinking again is handled the same way.
    const shrunk = state({ collapsed: false, measuredHeight: 60, currentHeight: 260 });
    expect(shrunk.targetHeight).toBe(60);
    expect(shrunk.animate).toBe(true);
  });

  it('2. waits for a real measurement instead of opening to nothing', () => {
    // Content with images that have no intrinsic size reports no height yet.
    const pending = state({ collapsed: false, measuredHeight: null, collapsedHeight: 0 });
    expect(pending.pending).toBe(true);
    expect(pending.animate).toBe(false);
    // Crucially it does not animate to 0 and then jump when the image lands.
    expect(pending.targetHeight).toBe(0);

    const measured = state({ collapsed: false, measuredHeight: 320, currentHeight: 0 });
    expect(measured.pending).toBe(false);
    expect(measured.targetHeight).toBe(320);
  });

  it('3. treats a nested collapsible’s growth as an ordinary height change', () => {
    // An inner section opening makes the outer content taller. The outer
    // container has no special case for it: it is just a new measurement.
    const outerBefore = state({ collapsed: false, measuredHeight: 80, currentHeight: 80 });
    const outerAfter = state({ collapsed: false, measuredHeight: 200, currentHeight: 80 });

    expect(outerBefore.animate).toBe(false);
    expect(outerAfter.targetHeight).toBe(200);
    expect(outerAfter.animate).toBe(true);
  });

  it('4. absorbs a width change mid-animation without restarting from zero', () => {
    // Rotation re-lays-out the content while the open animation is still running
    // at, say, 130 of an intended 180.
    const rotated = state({ collapsed: false, measuredHeight: 240, currentHeight: 130 });
    expect(rotated.targetHeight).toBe(240);
    expect(rotated.animate).toBe(true);
    // The animation retargets from wherever it is; nothing resets the height.
    expect(rotated.pending).toBe(false);
  });

  it('5. renders an initially-open section open, with no animation on mount', () => {
    const firstCommit = state({
      collapsed: false,
      measuredHeight: 150,
      mounted: false,
      currentHeight: null,
    });
    expect(firstCommit.targetHeight).toBe(150);
    expect(firstCommit.animate).toBe(false);

    // A section that starts closed likewise does not animate shut on mount.
    const closedOnMount = state({ collapsed: true, mounted: false, currentHeight: null });
    expect(closedOnMount.animate).toBe(false);
  });
});

describe('isMeaningfulMeasurement', () => {
  it('accepts the first measurement', () => {
    expect(isMeaningfulMeasurement(null, 120)).toBe(true);
  });

  it('ignores sub-pixel churn, which would otherwise restart the animation', () => {
    expect(isMeaningfulMeasurement(120, 120.2)).toBe(false);
    expect(isMeaningfulMeasurement(120, 120)).toBe(false);
  });

  it('accepts a real change', () => {
    expect(isMeaningfulMeasurement(120, 140)).toBe(true);
    expect(isMeaningfulMeasurement(120, 119)).toBe(true);
  });

  it('rejects nonsense rather than propagating it into a layout', () => {
    expect(isMeaningfulMeasurement(120, Number.NaN)).toBe(false);
    expect(isMeaningfulMeasurement(120, -5)).toBe(false);
    expect(isMeaningfulMeasurement(null, Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe('contentOffsetFor', () => {
  it('leaves the content at the top by default', () => {
    expect(contentOffsetFor('top', 50, 200)).toBe(0);
  });

  it('centres and bottom-aligns the overflow', () => {
    expect(contentOffsetFor('center', 50, 200)).toBe(-75);
    expect(contentOffsetFor('bottom', 50, 200)).toBe(-150);
  });

  it('offsets nothing once the container is tall enough', () => {
    expect(contentOffsetFor('center', 200, 200)).toBe(0);
    expect(contentOffsetFor('bottom', 300, 200)).toBe(0);
  });
});

describe('shouldRenderChildren', () => {
  it('always renders children while expanded', () => {
    expect(shouldRenderChildren(false, false, false)).toBe(true);
  });

  it('keeps them mounted while collapsed when asked', () => {
    expect(shouldRenderChildren(true, true, false)).toBe(true);
  });

  it('skips them on a section that has never been opened', () => {
    expect(shouldRenderChildren(true, false, false)).toBe(false);
  });

  it('keeps them after a first open, so reopening does not re-measure from scratch', () => {
    expect(shouldRenderChildren(true, false, true)).toBe(true);
  });
});
