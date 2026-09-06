import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Accordion, Collapsible } from 'rn-collapse-next';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

const FAQ: Faq[] = [
  { id: 'q1', question: 'Does it need the New Architecture?', answer: 'Yes. Reanimated 4 supports only Fabric, so this does too.' },
  { id: 'q2', question: 'Is the API the same?', answer: 'Every prop of react-native-collapsible is supported under its original name. Migration is one import line.' },
  { id: 'q3', question: 'What about content that loads later?', answer: 'The container follows it. Open the async section below to see it happen.' },
];

/** Content that arrives after the section is already open — edge case 1. */
function AsyncContent() {
  const [rows, setRows] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setRows(['Loaded row one', 'Loaded row two', 'Loaded row three']), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (rows.length === 0) return <Text style={styles.body}>Loading…</Text>;
  return (
    <View>
      {rows.map((row) => (
        <Text key={row} style={styles.body}>
          {row}
        </Text>
      ))}
    </View>
  );
}

export default function App() {
  const [active, setActive] = useState<number[]>([]);
  const [asyncOpen, setAsyncOpen] = useState(true);
  const [nestedOuter, setNestedOuter] = useState(false);
  const [nestedInner, setNestedInner] = useState(false);
  const dark = useColorScheme() === 'dark';

  return (
    <View style={[styles.root, dark && styles.rootDark]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, dark && styles.textDark]}>rn-collapse-next</Text>
        <Text style={styles.subtitle}>Dynamic height, on the UI thread.</Text>

        <Text style={[styles.section, dark && styles.textDark]}>FAQ accordion</Text>
        <Accordion
          sections={FAQ}
          activeSections={active}
          onChange={setActive}
          keyExtractor={(section) => section.id}
          renderHeader={(section, _index, isActive) => (
            <View style={[styles.header, isActive && styles.headerActive]}>
              <Text style={styles.headerText}>{section.question}</Text>
              <Text style={styles.chevron}>{isActive ? '−' : '+'}</Text>
            </View>
          )}
          renderContent={(section) => (
            <View style={styles.content}>
              <Text style={styles.body}>{section.answer}</Text>
            </View>
          )}
        />

        <Text style={[styles.section, dark && styles.textDark]}>
          Content that loads after opening
        </Text>
        <Text
          accessibilityRole="button"
          onPress={() => setAsyncOpen((v) => !v)}
          style={styles.link}
        >
          {asyncOpen ? 'Close' : 'Open'} the async section
        </Text>
        <Collapsible collapsed={!asyncOpen}>
          <View style={styles.content}>
            <AsyncContent />
          </View>
        </Collapsible>

        <Text style={[styles.section, dark && styles.textDark]}>Nested collapsibles</Text>
        <Text
          accessibilityRole="button"
          onPress={() => setNestedOuter((v) => !v)}
          style={styles.link}
        >
          {nestedOuter ? 'Close' : 'Open'} the outer section
        </Text>
        <Collapsible collapsed={!nestedOuter}>
          <View style={styles.content}>
            <Text style={styles.body}>The outer section grows when the inner one opens.</Text>
            <Text
              accessibilityRole="button"
              onPress={() => setNestedInner((v) => !v)}
              style={styles.link}
            >
              {nestedInner ? 'Close' : 'Open'} the inner section
            </Text>
            <Collapsible collapsed={!nestedInner}>
              <Text style={styles.body}>
                Nested content. The outer container followed this height change without
                knowing anything about it.
              </Text>
            </Collapsible>
          </View>
        </Collapsible>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#faf9f7' },
  rootDark: { backgroundColor: '#141413' },
  scroll: { padding: 20, paddingTop: 64, paddingBottom: 64 },
  title: { fontSize: 28, fontWeight: '700', color: '#141413' },
  subtitle: { fontSize: 14, color: '#63635e', marginTop: 4 },
  textDark: { color: '#f5f4ed' },
  section: { fontSize: 15, fontWeight: '600', marginTop: 32, marginBottom: 10, color: '#141413' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#e9e6dc',
    borderRadius: 10,
    marginTop: 8,
  },
  headerActive: { backgroundColor: '#c96442' },
  headerText: { flex: 1, fontSize: 14, color: '#141413' },
  chevron: { fontSize: 16, color: '#141413', marginLeft: 12 },
  content: { padding: 14 },
  body: { fontSize: 14, lineHeight: 20, color: '#63635e' },
  link: { fontSize: 14, color: '#c96442', marginTop: 8, fontWeight: '600' },
});
