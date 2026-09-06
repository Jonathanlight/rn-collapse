import { Easing, type EasingFunction } from 'react-native-reanimated';

/**
 * Easing names accepted by the `easing` prop, matching react-native-collapsible
 * (which forwards them to React Native's own `Easing`).
 */
export type EasingName =
  | 'linear'
  | 'ease'
  | 'quad'
  | 'cubic'
  | 'sin'
  | 'circle'
  | 'exp'
  | 'in'
  | 'out'
  | 'inOut'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';

export type EasingSpec = EasingName | ((value: number) => number);

/** Every easing name this package understands, for validation and docs. */
export const EASING_NAMES: EasingName[] = [
  'linear',
  'ease',
  'quad',
  'cubic',
  'sin',
  'circle',
  'exp',
  'in',
  'out',
  'inOut',
  'easeIn',
  'easeOut',
  'easeInOut',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
];

export function isEasingName(value: unknown): value is EasingName {
  return typeof value === 'string' && (EASING_NAMES as string[]).includes(value);
}

/** Resolves the `easing` prop to a function `withTiming` can use. */
export function resolveEasing(spec: EasingSpec | undefined): EasingFunction {
  'worklet';
  if (typeof spec === 'function') return spec as EasingFunction;
  switch (spec) {
    case 'linear':
      return Easing.linear;
    case 'quad':
      return Easing.quad;
    case 'cubic':
      return Easing.cubic;
    case 'sin':
      return Easing.sin;
    case 'circle':
      return Easing.circle;
    case 'exp':
      return Easing.exp;
    case 'in':
    case 'easeIn':
      return Easing.in(Easing.ease);
    case 'out':
    case 'easeOut':
      return Easing.out(Easing.ease);
    case 'inOut':
    case 'easeInOut':
      return Easing.inOut(Easing.ease);
    case 'easeInCubic':
      return Easing.in(Easing.cubic);
    case 'easeOutCubic':
      return Easing.out(Easing.cubic);
    case 'easeInOutCubic':
      return Easing.inOut(Easing.cubic);
    case 'ease':
    default:
      return Easing.ease;
  }
}
