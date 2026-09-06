/**
 * Pure selection logic for <Accordion>. Kept out of the component so the
 * toggling rules — which are the part people actually rely on — are tested
 * directly.
 */

export interface ToggleOptions {
  /** Allow more than one section open at a time. */
  expandMultiple?: boolean;
}

/**
 * The next `activeSections` after the user taps the header at `index`.
 *
 * Tapping an open section always closes it, in both modes. That matches
 * react-native-collapsible and is what users expect from an accordion header.
 */
export function toggleSection(
  activeSections: readonly number[],
  index: number,
  { expandMultiple = false }: ToggleOptions = {},
): number[] {
  const isActive = activeSections.includes(index);

  if (expandMultiple) {
    return isActive
      ? activeSections.filter((i) => i !== index)
      : [...activeSections, index].sort((a, b) => a - b);
  }

  return isActive ? [] : [index];
}

/**
 * Order in which sections are laid out. `expandFromBottom` renders them
 * reversed, so that the accordion grows upward from the bottom of the screen.
 */
export function sectionOrder(count: number, expandFromBottom = false): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  return expandFromBottom ? order.reverse() : order;
}

/** Whether the section at `index` should be rendered expanded. */
export function isSectionActive(activeSections: readonly number[], index: number): boolean {
  return activeSections.includes(index);
}

/**
 * Key for a section. Upstream defaults to the array index, which breaks
 * reordering; a caller-supplied `keyExtractor` is the fix and is preferred
 * whenever one is given.
 */
export function sectionKey<S>(
  section: S,
  index: number,
  keyExtractor?: (section: S, index: number) => string,
): string {
  if (keyExtractor) return keyExtractor(section, index);
  return String(index);
}

/**
 * Normalises `activeSections`, which comes straight from user state and may hold
 * indices that no longer exist after the section list shrinks.
 */
export function normaliseActiveSections(
  activeSections: readonly number[] | undefined,
  sectionCount: number,
): number[] {
  if (!activeSections) return [];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const index of activeSections) {
    if (!Number.isInteger(index) || index < 0 || index >= sectionCount) continue;
    if (seen.has(index)) continue;
    seen.add(index);
    result.push(index);
  }
  return result;
}
