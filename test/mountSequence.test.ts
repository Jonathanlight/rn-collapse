import { describe, expect, it } from 'vitest';
import { resolveCollapseState } from '../src/collapseState.js';

/**
 * The state machine is only half the story: <Collapsible> feeds it results back
 * as `mounted` and `currentHeight`, and getting that feedback wrong is how an
 * initially-open section ends up animating on mount even though the pure
 * function says it should not.
 *
 * This driver mirrors the component's effect exactly, so the sequence is under
 * test rather than just the individual decisions.
 */
class CollapsibleDriver {
  mounted = false;
  currentHeight: number | null = null;
  measuredHeight: number | null = null;
  collapsed: boolean;
  readonly animations: number[] = [];
  readonly jumps: number[] = [];

  constructor(options: { collapsed: boolean; collapsedHeight?: number; reduceMotion?: boolean }) {
    this.collapsed = options.collapsed;
    this.collapsedHeight = options.collapsedHeight ?? 0;
    this.reduceMotion = options.reduceMotion ?? false;
    this.settle();
  }

  private collapsedHeight: number;
  private reduceMotion: boolean;

  /** Runs the component's effect once. */
  private settle() {
    const state = resolveCollapseState({
      collapsed: this.collapsed,
      measuredHeight: this.measuredHeight,
      collapsedHeight: this.collapsedHeight,
      mounted: this.mounted,
      reduceMotion: this.reduceMotion,
      currentHeight: this.currentHeight,
    });

    if (state.pending) return;

    this.currentHeight = state.targetHeight;
    if (state.animate) this.animations.push(state.targetHeight);
    else this.jumps.push(state.targetHeight);
    this.mounted = true;
  }

  /** The measuring view reported a height. */
  measure(height: number) {
    this.measuredHeight = height;
    this.settle();
  }

  /** The `collapsed` prop changed. */
  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
    this.settle();
  }
}

describe('mount sequence', () => {
  it('a section rendered already-open appears open without animating', () => {
    const c = new CollapsibleDriver({ collapsed: false });
    // Nothing has been decided yet: the height is unknown.
    expect(c.animations).toEqual([]);
    expect(c.jumps).toEqual([]);

    c.measure(180);

    // The first measurement is the mount commit, so it jumps rather than slides.
    expect(c.animations).toEqual([]);
    expect(c.jumps).toEqual([180]);
  });

  it('a section rendered closed settles closed without animating', () => {
    const c = new CollapsibleDriver({ collapsed: true, collapsedHeight: 0 });
    expect(c.jumps).toEqual([0]);
    expect(c.animations).toEqual([]);
  });

  it('opening a closed section after mount does animate', () => {
    const c = new CollapsibleDriver({ collapsed: true });
    c.setCollapsed(false);
    c.measure(200);
    expect(c.animations).toEqual([200]);
  });

  it('a late measurement on an open section animates, unlike the first one', () => {
    const c = new CollapsibleDriver({ collapsed: false });
    c.measure(100); // mount commit — jumps
    c.measure(260); // async content arrived — animates
    expect(c.jumps).toEqual([100]);
    expect(c.animations).toEqual([260]);
  });

  it('never animates at all under reduce motion', () => {
    const c = new CollapsibleDriver({ collapsed: true, reduceMotion: true });
    c.setCollapsed(false);
    c.measure(200);
    c.measure(320);
    c.setCollapsed(true);
    expect(c.animations).toEqual([]);
  });

  it('closing works even if the content never reported a height', () => {
    const c = new CollapsibleDriver({ collapsed: false });
    c.setCollapsed(true);
    expect(c.jumps).toEqual([0]);
  });
});
