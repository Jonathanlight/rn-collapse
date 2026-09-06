import { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Collapsible } from './Collapsible.js';
import {
  isSectionActive,
  normaliseActiveSections,
  sectionKey,
  sectionOrder,
  toggleSection,
} from './accordionState.js';
import type { AccordionProps } from './types.js';

/**
 * Accordion built on <Collapsible>.
 *
 * Generic over the section type, so `renderHeader` and `renderContent` receive
 * the caller's own type rather than `any` — the upstream signature is untyped,
 * and typing it is invisible until the first time it catches a typo in a field
 * name.
 */
export function Accordion<S>({
  sections,
  activeSections,
  renderHeader,
  renderContent,
  renderSectionTitle,
  renderFooter,
  onChange,
  expandMultiple = false,
  expandFromBottom = false,
  touchableComponent,
  touchableProps,
  disabled = false,
  align = 'top',
  duration = 300,
  easing = 'ease',
  onAnimationEnd,
  sectionContainerStyle,
  containerStyle,
  keyExtractor,
  renderAsFlatList = false,
}: AccordionProps<S>) {
  const active = normaliseActiveSections(activeSections, sections.length);
  const Touchable = touchableComponent ?? Pressable;

  const handlePress = useCallback(
    (index: number) => {
      if (disabled) return;
      onChange?.(toggleSection(active, index, { expandMultiple }));
    },
    [active, disabled, expandMultiple, onChange],
  );

  const renderSection = useCallback(
    (index: number) => {
      const section = sections[index] as S;
      const isActive = isSectionActive(active, index);

      return (
        <View key={sectionKey(section, index, keyExtractor)} style={sectionContainerStyle}>
          {renderSectionTitle?.(section, index, isActive, sections)}

          <Touchable
            onPress={() => handlePress(index)}
            disabled={disabled}
            // The header is the control that opens the section, so it has to
            // read as a button and publish its expanded state. Upstream renders
            // it as an untyped touchable, which screen readers announce as
            // nothing at all.
            accessibilityRole="button"
            accessibilityState={{ expanded: isActive, disabled }}
            {...touchableProps}
          >
            {renderHeader(section, index, isActive, sections)}
          </Touchable>

          <Collapsible
            collapsed={!isActive}
            align={align}
            duration={duration}
            easing={easing}
            onAnimationEnd={
              onAnimationEnd ? () => onAnimationEnd(section, index) : undefined
            }
          >
            {renderContent(section, index, isActive, sections)}
          </Collapsible>

          {renderFooter?.(section, index, isActive, sections)}
        </View>
      );
    },
    [
      active,
      align,
      disabled,
      duration,
      easing,
      handlePress,
      keyExtractor,
      onAnimationEnd,
      renderContent,
      renderFooter,
      renderHeader,
      renderSectionTitle,
      sectionContainerStyle,
      sections,
      Touchable,
      touchableProps,
    ],
  );

  const order = sectionOrder(sections.length, expandFromBottom);

  if (renderAsFlatList) {
    return (
      <FlatList
        style={containerStyle}
        data={order}
        keyExtractor={(index) => sectionKey(sections[index] as S, index, keyExtractor)}
        renderItem={({ item }) => renderSection(item) as React.ReactElement}
      />
    );
  }

  return <View style={containerStyle}>{order.map(renderSection)}</View>;
}

export default Accordion;
