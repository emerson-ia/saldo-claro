import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/lib/auth-provider";
import { useFinanceTheme } from "@/lib/finance-theme";

type Props = { visible: boolean; itemLabel: string; onClose: () => void; onConfirm: () => void };

export function SecureDeleteModal({ visible, itemLabel, onClose, onConfirm }: Props) {
  const { colors } = useFinanceTheme(); const { verifyPassword } = useAuth();
  const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const close = () => { if (loading) return; setPassword(""); setError(""); onClose(); };
  const remove = async () => {
    if (!password) return setError("Digite sua senha para confirmar.");
    setLoading(true); setError("");
    try { await verifyPassword(password); onConfirm(); close(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível validar a senha."); } finally { setLoading(false); }
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}><View style={styles.overlay}><View style={[styles.dialog, { backgroundColor: colors.surface }]}><View style={[styles.icon, { backgroundColor: `${colors.negative}18` }]}><MaterialIcons name="delete-forever" size={23} color={colors.negative} /></View><Text style={[styles.title, { color: colors.text }]}>Excluir definitivamente?</Text><Text style={[styles.copy, { color: colors.muted }]}>Confirme sua senha para excluir “{itemLabel}”. Seus lançamentos históricos serão preservados.</Text><Text style={[styles.label, { color: colors.text }]}>Sua senha</Text><TextInput value={password} onChangeText={(value) => { setPassword(value); setError(""); }} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Digite sua senha" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: error ? colors.negative : colors.border }]} onSubmitEditing={remove} /><Text style={[styles.error, { color: colors.negative }]}>{error}</Text><Pressable disabled={loading} onPress={remove} style={({ pressed }) => [styles.remove, { backgroundColor: colors.negative, opacity: pressed || loading ? .62 : 1 }]}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.removeText}>Excluir definitivamente</Text>}</Pressable><Pressable disabled={loading} onPress={close} style={styles.cancel}><Text style={[styles.cancelText, { color: colors.muted }]}>Cancelar</Text></Pressable></View></View></Modal>;
}

const styles = StyleSheet.create({ overlay: { flex: 1, backgroundColor: "#00000072", padding: 24, alignItems: "center", justifyContent: "center" }, dialog: { width: "100%", maxWidth: 420, borderRadius: 24, padding: 21 }, icon: { width: 47, height: 47, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 15 }, title: { fontSize: 19, fontWeight: "900" }, copy: { fontSize: 13, lineHeight: 19, marginTop: 7 }, label: { fontSize: 12, fontWeight: "800", marginTop: 19, marginBottom: 7 }, input: { height: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14, fontWeight: "600" }, error: { minHeight: 17, fontSize: 11, fontWeight: "700", marginTop: 6 }, remove: { height: 49, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 10 }, removeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, cancel: { alignItems: "center", padding: 10, marginTop: 4 }, cancelText: { fontSize: 13, fontWeight: "800" } });
