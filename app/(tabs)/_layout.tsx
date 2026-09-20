import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFinanceTheme } from "@/lib/finance-theme";

export default function TabLayout() {
  const { colors } = useFinanceTheme();
  const insets = useSafeAreaInsets();
  const paddingBottom = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: [styles.tabBar, { height: 59 + paddingBottom, paddingBottom, backgroundColor: colors.surface, borderTopColor: colors.border }],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color, size }) => <MaterialIcons name="home-filled" color={color} size={size} /> }} />
      <Tabs.Screen name="transactions" options={{ title: "Lançamentos", tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt-long" color={color} size={size} /> }} />
      <Tabs.Screen name="add" options={{ title: "Adicionar", tabBarIcon: ({ color }) => <View style={[styles.addIcon, { backgroundColor: colors.primary }]}><MaterialIcons name="add" color="#FFFFFF" size={25} /></View> }} />
      <Tabs.Screen name="planning" options={{ title: "Planejamento", tabBarIcon: ({ color, size }) => <MaterialIcons name="donut-large" color={color} size={size} /> }} />
      <Tabs.Screen name="more" options={{ title: "Mais", tabBarIcon: ({ color, size }) => <MaterialIcons name="more-horiz" color={color} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { borderTopWidth: 1, paddingTop: 7, elevation: 0 },
  tabLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  addIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginTop: -2, shadowColor: "#064E47", shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
});
