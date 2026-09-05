import "@/global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FinanceProvider } from "@/lib/finance-store";
import { FinanceThemeProvider } from "@/lib/finance-theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FinanceThemeProvider>
        <FinanceProvider>
          <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="accounts" options={{ presentation: "card" }} />
            <Stack.Screen name="cards" options={{ presentation: "card" }} />
            <Stack.Screen name="categories" options={{ presentation: "card" }} />
            <Stack.Screen name="reports" options={{ presentation: "card" }} />
            <Stack.Screen name="settings" options={{ presentation: "card" }} />
          </Stack>
        </FinanceProvider>
      </FinanceThemeProvider>
    </SafeAreaProvider>
  );
}
