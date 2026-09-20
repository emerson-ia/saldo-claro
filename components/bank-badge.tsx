import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { bankForName, initialsForBank } from "@/lib/bank-directory";

type Props = { name?: string; size?: number; style?: ViewStyle };

export function BankBadge({ name, size = 44, style }: Props) {
  const bank = bankForName(name);
  const mark = bank?.mark ?? initialsForBank(name);
  const fontSize = mark.length > 3 ? size * 0.22 : mark.length > 2 ? size * 0.27 : size * 0.38;
  return <View accessibilityLabel={name ? `Marca ${name}` : "Banco"} style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: bank?.color ?? "#607D76" }, style]}>
    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.mark, { color: bank?.foreground ?? "#FFFFFF", fontSize }]}>{mark}</Text>
  </View>;
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  mark: { fontWeight: "900", letterSpacing: -0.65, maxWidth: "86%" },
});
