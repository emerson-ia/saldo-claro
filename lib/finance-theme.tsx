import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

const light = {
  background: "#F6F8F7", surface: "#FFFFFF", elevated: "#EDF3F0", text: "#16332F", muted: "#687A76", border: "#DFE7E4",
  primary: "#0B6B62", primaryDark: "#064E47", positive: "#159A6B", warning: "#D98B18", negative: "#D94343", accent: "#E6F2EE",
};
const dark = {
  background: "#102522", surface: "#18312D", elevated: "#21433D", text: "#E8F2EF", muted: "#A8BAB4", border: "#2A4B44",
  primary: "#66C7B5", primaryDark: "#0B6B62", positive: "#54C796", warning: "#F0B64B", negative: "#F07878", accent: "#204C43",
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
