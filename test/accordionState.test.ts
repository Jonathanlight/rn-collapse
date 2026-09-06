import { describe, expect, it } from 'vitest';
import {
  isSectionActive,
  normaliseActiveSections,
  sectionKey,
  sectionOrder,
  toggleSection,
} from '../src/accordionState.js';

describe('toggleSection', () => {
  it('opens a section and closes the previous one by default', () => {
    expect(toggleSection([], 1)).toEqual([1]);
    expect(toggleSection([0], 1)).toEqual([1]);
  });

  it('closes a section when its own header is tapped again', () => {
    expect(toggleSection([1], 1)).toEqual([]);
  });

  it('keeps other sections open with expandMultiple', () => {
    expect(toggleSection([0], 2, { expandMultiple: true })).toEqual([0, 2]);
    expect(toggleSection([0, 2], 1, { expandMultiple: true })).toEqual([0, 1, 2]);
  });

  it('closes only the tapped section with expandMultiple', () => {
    expect(toggleSection([0, 1, 2], 1, { expandMultiple: true })).toEqual([0, 2]);
  });

  it('keeps the result sorted, so rendering order never depends on tap order', () => {
    expect(toggleSection([2, 0], 1, { expandMultiple: true })).toEqual([0, 1, 2]);
  });

  it('does not mutate the array it was given', () => {
    const current = [0, 1];
    toggleSection(current, 2, { expandMultiple: true });
    expect(current).toEqual([0, 1]);
  });
});

describe('sectionOrder', () => {
  it('lays sections out in order by default', () => {
    expect(sectionOrder(4)).toEqual([0, 1, 2, 3]);
  });

  it('reverses them for expandFromBottom', () => {
    expect(sectionOrder(4, true)).toEqual([3, 2, 1, 0]);
  });

  it('handles an empty list', () => {
    expect(sectionOrder(0)).toEqual([]);
  });
});

describe('normaliseActiveSections', () => {
  it('passes valid indices through', () => {
    expect(normaliseActiveSections([0, 2], 3)).toEqual([0, 2]);
  });

  it('drops indices past the end, which is what happens when the list shrinks', () => {
    expect(normaliseActiveSections([0, 5], 3)).toEqual([0]);
  });

  it('drops negatives, duplicates and non-integers', () => {
    expect(normaliseActiveSections([-1, 1, 1, 1.5], 3)).toEqual([1]);
  });

  it('treats a missing value as nothing open', () => {
    expect(normaliseActiveSections(undefined, 3)).toEqual([]);
  });
});

describe('sectionKey', () => {
  it('falls back to the index', () => {
    expect(sectionKey({ title: 'a' }, 2)).toBe('2');
  });

  it('prefers a caller-supplied extractor, so reordering keeps component state', () => {
    expect(sectionKey({ id: 'faq-1' }, 2, (s) => s.id)).toBe('faq-1');
  });
});

describe('isSectionActive', () => {
  it('reports membership', () => {
    expect(isSectionActive([0, 2], 2)).toBe(true);
    expect(isSectionActive([0, 2], 1)).toBe(false);
  });
});
