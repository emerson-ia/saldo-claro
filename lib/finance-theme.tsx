import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

const light = {
  background: "#F7F9F5", surface: "#FFFFFF", elevated: "#EEF5E9", text: "#1B2A21", muted: "#647166", border: "#DCE7DC",
  primary: "#00843D", primaryDark: "#006B33", positive: "#00843D", warning: "#C98212", negative: "#C74646", accent: "#E8F4D8",
};
const dark = {
  background: "#102418", surface: "#183521", elevated: "#234A2C", text: "#EDF7E9", muted: "#A8BCA8", border: "#2C5138",
  primary: "#5ABF64", primaryDark: "#00843D", positive: "#5ABF64", warning: "#F0BB56", negative: "#F27D7D", accent: "#284B2E",
};

type Palette = typeof light;
type ThemeContextValue = { preference: ThemePreference; setPreference: (preference: ThemePreference) => void; isDark: boolean; colors: Palette };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function FinanceThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  useEffect(() => { AsyncStorage.getItem("saldo-claro.theme.v1").then((value) => { if (value === "light" || value === "dark" || value === "system") setPreferenceState(value); }).catch(() => undefined); }, []);
  const setPreference = (value: ThemePreference) => { setPreferenceState(value); AsyncStorage.setItem("saldo-claro.theme.v1", value).catch(() => undefined); };
  const isDark = preference === "dark" || (preference === "system" && systemScheme === "dark");
  const value = useMemo(() => ({ preference, setPreference, isDark, colors: isDark ? dark : light }), [preference, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useFinanceTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useFinanceTheme deve ser usado dentro de FinanceThemeProvider.");
  return context;
}
