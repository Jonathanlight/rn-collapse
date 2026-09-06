import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Align } from './collapseState.js';
import type { EasingSpec } from './easing.js';

export type { Align } from './collapseState.js';
export type { EasingSpec, EasingName } from './easing.js';

export interface CollapsibleProps {
  collapsed?: boolean;
  /** Height shown while collapsed. Defaults to 0. */
  collapsedHeight?: number;
  duration?: number;
  easing?: EasingSpec;
  /** Where the content sits while the container is shorter than it. */
  align?: Align;
  /** Allow touches to reach the content while collapsed. */
  enablePointerEvents?: boolean;
  onAnimationEnd?: () => void;
  /** Keep children mounted while collapsed. */
  renderChildrenCollapsed?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Announced by screen readers when the content is expanded. */
  accessibilityLabel?: string;
}

export interface AccordionProps<S> {
  sections: readonly S[];
  activeSections: readonly number[];
  renderHeader: (section: S, index: number, isActive: boolean, sections: readonly S[]) => ReactNode;
  renderContent: (section: S, index: number, isActive: boolean, sections: readonly S[]) => ReactNode;
  renderSectionTitle?: (
    section: S,
    index: number,
    isActive: boolean,
    sections: readonly S[],
  ) => ReactNode;
  renderFooter?: (section: S, index: number, isActive: boolean, sections: readonly S[]) => ReactNode;
  onChange?: (indices: number[]) => void;
  expandMultiple?: boolean;
  expandFromBottom?: boolean;
  /** Touchable used for the headers. Defaults to `Pressable`. */
  touchableComponent?: React.ComponentType<Record<string, unknown>>;
  touchableProps?: Record<string, unknown>;
  disabled?: boolean;
  align?: Align;
  duration?: number;
  easing?: EasingSpec;
  onAnimationEnd?: (section: S, index: number) => void;
  sectionContainerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  keyExtractor?: (section: S, index: number) => string;
  /** Render through a FlatList instead of a plain View. */
  renderAsFlatList?: boolean;
}
