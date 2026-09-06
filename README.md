# rn-collapse-next

**Collapsible and Accordion for React Native, on the UI thread.**

`react-native-collapsible` is installed about 212,000 times a week. It is plain
JavaScript on the `Animated` API, copyright 2015–2021. The reason it is still
everywhere is that it handles **dynamic height**: you do not know how tall the
content is, and it measures it for you.

Reanimated does that better now. `rn-collapse-next` keeps the same API and the same
props, moves the animation to the UI thread, fixes the five cases the original
handles badly, and makes the result accessible.

> Independent community rewrite. Not affiliated with, nor endorsed by, the
> authors of react-native-collapsible.

---

## Migration

The original ships two entry points. Both become one named import:

```diff
- import Collapsible from 'react-native-collapsible';
- import Accordion from 'react-native-collapsible/Accordion';
+ import { Collapsible, Accordion } from 'rn-collapse-next';
```

`import Collapsible from 'rn-collapse-next'` also works, if you prefer the default.

Every prop on both components is supported under its original name. Nothing was
renamed and nothing was dropped.

### What actually differs

| | `react-native-collapsible` | `rn-collapse-next` |
|---|---|---|
| Animation thread | JS thread | UI thread |
| Re-render per frame | yes | no |
| Accessibility | none | header is a button with `expanded` state; collapsed content hidden from screen readers |
| Reduce motion | ignored | respected — the height changes instantly |
| `sections` typing | `any` | generic, so `renderHeader` gets your own type |
| Architecture | Paper (old) | New Architecture only |
| React Native | any | >= 0.78 |

### Installation

```sh
npm install rn-collapse-next react-native-reanimated react-native-worklets
```

---

## What's different, in detail

These are the five behaviours that send people to the issue tracker of the
original. Each one has a test.

**1. Content that resizes while the section is open.** A list that loads
asynchronously used to leave the container at its old height, clipping the new
rows. Here the measuring view keeps reporting and the container simply retargets.

**2. Images with no known dimensions.** Opening before the content has a height
used to animate to zero and then jump when the image landed. `rn-collapse-next` holds
at the collapsed height until a real measurement exists, so there is one smooth
open instead of a flash.

**3. Nested collapsibles.** An inner section opening makes the outer content
taller. There is no special case for it — to the outer container it is an
ordinary height change, and it follows.

**4. Rotation, or any width change, mid-animation.** The animation retargets from
wherever it currently is rather than restarting from zero.

**5. A section rendered already open.** It is simply open. No animation plays on
mount. This is the one that is easiest to get wrong, so the mount sequence has
[its own test file](test/mountSequence.test.ts) rather than relying on the state
machine alone.

Sub-pixel `onLayout` churn is ignored (half a point of tolerance), because
reacting to it is what restarts animations during an orientation change.

---

## Accessibility

The original renders a bare touchable, which screen readers announce as nothing.
Here:

- headers get `accessibilityRole="button"` and
  `accessibilityState={{ expanded, disabled }}`
- collapsed content is removed from the accessibility tree
  (`accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`),
  so VoiceOver does not walk into text nobody can see
- the OS reduce-motion setting turns the transition into an instant height change

---

## API

### `<Collapsible>`

```tsx
<Collapsible collapsed={collapsed}>
  <Text>Anything at all.</Text>
</Collapsible>
```

| Prop | Type | Default |
|---|---|---|
| `collapsed` | `boolean` | `true` |
| `collapsedHeight` | `number` | `0` |
| `duration` | `number` | `300` |
| `easing` | easing name or `(t: number) => number` | `'ease'` |
| `align` | `'top' \| 'center' \| 'bottom'` | `'top'` |
| `enablePointerEvents` | `boolean` | `false` |
| `onAnimationEnd` | `() => void` | — |
| `renderChildrenCollapsed` | `boolean` | `false` |
| `style` | style | — |

### `<Accordion>`

```tsx
const [active, setActive] = useState<number[]>([]);

<Accordion
  sections={faq}
  activeSections={active}
  onChange={setActive}
  renderHeader={(section, index, isActive) => <Header {...section} open={isActive} />}
  renderContent={(section) => <Answer text={section.answer} />}
/>
```

`sections` is generic, so `section` above is typed as your own element type
rather than `any`.

| Prop | Type | Default |
|---|---|---|
| `sections` | `S[]` | required |
| `activeSections` | `number[]` | required |
| `renderHeader` | `(section, index, isActive, sections) => ReactNode` | required |
| `renderContent` | `(section, index, isActive, sections) => ReactNode` | required |
| `renderSectionTitle` | same signature | — |
| `renderFooter` | same signature | — |
| `onChange` | `(indices: number[]) => void` | — |
| `expandMultiple` | `boolean` | `false` |
| `expandFromBottom` | `boolean` | `false` |
| `touchableComponent` | component | `Pressable` |
| `touchableProps` | object | — |
| `disabled` | `boolean` | `false` |
| `align` | `'top' \| 'center' \| 'bottom'` | `'top'` |
| `duration` | `number` | `300` |
| `easing` | easing name or function | `'ease'` |
| `onAnimationEnd` | `(section, index) => void` | — |
| `sectionContainerStyle` | style | — |
| `containerStyle` | style | — |
| `keyExtractor` | `(section, index) => string` | index |
| `renderAsFlatList` | `boolean` | `false` |

### Easing names

`linear` `ease` `quad` `cubic` `sin` `circle` `exp` `in` `out` `inOut`
`easeIn` `easeOut` `easeInOut` `easeInCubic` `easeOutCubic` `easeInOutCubic`,
or pass your own worklet function.

---

## Example app

```sh
cd example
npm install
npx expo start
```

It contains a FAQ accordion, a section whose content loads asynchronously, and a
nested collapsible — cases 1 and 3 above, visible.

## Licence

MIT. See [NOTICE](NOTICE) for the relationship to react-native-collapsible.
