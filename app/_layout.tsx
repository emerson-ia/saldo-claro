import "@/global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FinanceProvider } from "@/lib/finance-store";
import { FinanceThemeProvider } from "@/lib/finance-theme";
import { AuthGate, AuthProvider } from "@/lib/auth-provider";
import { useFinanceTheme } from "@/lib/finance-theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FinanceThemeProvider>
        <RootNavigator />
      </FinanceThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors } = useFinanceTheme();
  return (
    <>
        <AuthProvider>
          <FinanceProvider>
            <AuthGate>
              <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: colors.background } }}>
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/callback" />
                <Stack.Screen name="landing" />
                <Stack.Screen name="welcome" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="accounts" options={{ presentation: "card" }} />
            <Stack.Screen name="cards" options={{ presentation: "card" }} />
            <Stack.Screen name="categories" options={{ presentation: "card" }} />
            <Stack.Screen name="reports" options={{ presentation: "card" }} />
                <Stack.Screen name="settings" options={{ presentation: "card" }} />
                <Stack.Screen name="profile" options={{ presentation: "card" }} />
                <Stack.Screen name="subscription" options={{ presentation: "card" }} />
                <Stack.Screen name="import-csv" options={{ presentation: "card" }} />
              </Stack>
            </AuthGate>
          </FinanceProvider>
        </AuthProvider>
    </>
  );
}
