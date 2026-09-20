import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-provider";
import { useFinanceTheme } from "@/lib/finance-theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SignOutModal({ visible, onClose }: Props) {
  const { colors } = useFinanceTheme();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (loading) return;
    setError("");
    onClose();
  };

  const leave = async () => {
    setLoading(true);
    setError("");
    try {
      await signOut();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível sair agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <View style={styles.overlay}>
      <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.surface }]}>
        <View style={[styles.icon, { backgroundColor: `${colors.negative}16` }]}><MaterialIcons name="logout" size={23} color={colors.negative} /></View>
        <Text style={[styles.title, { color: colors.text }]}>Sair da conta?</Text>
        <Text style={[styles.copy, { color: colors.muted }]}>Você será desconectado neste aparelho. Seus dados sincronizados permanecem protegidos.</Text>
        {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.negative }]}>{error}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Confirmar saída da conta" disabled={loading} onPress={leave} style={({ pressed }) => [styles.leave, { backgroundColor: colors.negative, opacity: pressed || loading ? .62 : 1 }]}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.leaveText}>Sair da conta</Text>}</Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar saída da conta" disabled={loading} onPress={close} style={({ pressed }) => [styles.cancel, { opacity: pressed || loading ? .62 : 1 }]}><Text style={[styles.cancelText, { color: colors.muted }]}>Cancelar</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#00000072", padding: 24, alignItems: "center", justifyContent: "center" },
  dialog: { width: "100%", maxWidth: 420, borderRadius: 24, padding: 21 },
  icon: { width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  title: { fontSize: 19, fontWeight: "900" },
  copy: { fontSize: 13, lineHeight: 19, marginTop: 7 },
  error: { fontSize: 12, lineHeight: 17, fontWeight: "700", marginTop: 14 },
  leave: { height: 49, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 20 },
  leaveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  cancel: { alignItems: "center", padding: 10, marginTop: 4 },
  cancelText: { fontSize: 13, fontWeight: "800" },
});
