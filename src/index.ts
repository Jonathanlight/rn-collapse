/**
 * rn-collapse — Collapsible and Accordion for React Native on Reanimated 4.
 *
 * Independent community rewrite. Not affiliated with, nor endorsed by, the
 * authors of react-native-collapsible. See NOTICE for attribution.
 */
export { Collapsible } from './Collapsible.js';
export { Accordion } from './Accordion.js';

export {
  contentOffsetFor,
  isMeaningfulMeasurement,
  resolveCollapseState,
  shouldRenderChildren,
  type CollapseInput,
  type CollapseOutput,
} from './collapseState.js';

export {
  isSectionActive,
  normaliseActiveSections,
  sectionKey,
  sectionOrder,
  toggleSection,
} from './accordionState.js';

export { EASING_NAMES, isEasingName, resolveEasing } from './easing.js';
export { useReduceMotion } from './useReduceMotion.js';

export type {
  AccordionProps,
  Align,
  CollapsibleProps,
  EasingName,
  EasingSpec,
} from './types.js';

import { Accordion } from './Accordion.js';
import { Collapsible } from './Collapsible.js';

/** Default export, so `import Collapsible from 'rn-collapse'` also works. */
export default Collapsible;
export { Accordion as AccordionComponent };
