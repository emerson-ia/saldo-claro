import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMonth } from '@/lib/finance-domain';
import { useFinanceTheme } from '@/lib/finance-theme';

type MonthNavigatorProps = { month: string; onPrevious: () => void; onNext: () => void };

/** Same month control everywhere financial data is filtered. */
export function MonthNavigator({ month, onPrevious, onNext }: MonthNavigatorProps) {
  const { colors } = useFinanceTheme();
  return <View style={styles.root} accessibilityRole="adjustable" accessibilityLabel={`Mês selecionado: ${formatMonth(month)}`}>
    <Pressable accessibilityLabel="Ver mês anterior" onPress={onPrevious} hitSlop={8} style={({ pressed }) => [styles.arrow, { backgroundColor: colors.elevated, opacity: pressed ? .65 : 1 }]}><MaterialIcons name="chevron-left" size={22} color={colors.text} /></Pressable>
    <Text style={[styles.month, { color: colors.text }]}>{formatMonth(month)}</Text>
    <Pressable accessibilityLabel="Ver próximo mês" onPress={onNext} hitSlop={8} style={({ pressed }) => [styles.arrow, { backgroundColor: colors.elevated, opacity: pressed ? .65 : 1 }]}><MaterialIcons name="chevron-right" size={22} color={colors.text} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({ root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, arrow: { height: 35, width: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, month: { fontSize: 14, fontWeight: '800' } });
