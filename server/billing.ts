import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Request } from "express";
import { billingWebhookEvents, subscriptions } from "../drizzle/schema";
import { getDb } from "./db";

const MERCADO_PAGO_API = "https://api.mercadopago.com";
export const PRO_MONTHLY_PRICE = 9.9;
export const PRO_YEARLY_PRICE = 99.9;

type BillingPeriod = "monthly" | "yearly";
type SupabaseUser = { id: string; email?: string | null };

function required(name: string) {
  const fallback = name === "SUPABASE_URL" ? process.env.EXPO_PUBLIC_SUPABASE_URL : name === "SUPABASE_ANON_KEY" ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined;
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Configuração ausente: ${name}`);
  return value;
}

export function isBillingConfigured() {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN && (process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL) && (process.env.SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) && process.env.APP_PUBLIC_URL);
}

export async function getSupabaseUser(req: Request): Promise<SupabaseUser> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Faça login novamente para continuar.");
  const response = await fetch(`${required("SUPABASE_URL")}/auth/v1/user`, { headers: { apikey: required("SUPABASE_ANON_KEY"), Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Sua sessão expirou. Entre novamente.");
  return response.json() as Promise<SupabaseUser>;
}

async function mercadoPago(path: string, init: RequestInit = {}) {
  const response = await fetch(`${MERCADO_PAGO_API}${path}`, { ...init, headers: { Authorization: `Bearer ${required("MERCADO_PAGO_ACCESS_TOKEN")}`, "Content-Type": "application/json", ...init.headers } });
  if (!response.ok) throw new Error(`Mercado Pago recusou a operação (${response.status}).`);
  return response.json() as Promise<any>;
}

export async function createProCheckout(user: SupabaseUser, period: BillingPeriod) {
  if (!isBillingConfigured()) throw new Error("A cobrança ainda não está configurada no servidor.");
  const price = period === "monthly" ? PRO_MONTHLY_PRICE : PRO_YEARLY_PRICE;
  const frequency = period === "monthly" ? 1 : 12;
  const appUrl = required("APP_PUBLIC_URL").replace(/\/$/, "");
  const preference = await mercadoPago("/preapproval", { method: "POST", body: JSON.stringify({
    reason: `Finanças em Dia PRO ${period === "monthly" ? "Mensal" : "Anual"}`,
    external_reference: user.id,
    payer_email: user.email ?? undefined,
    auto_recurring: { frequency, frequency_type: "months", transaction_amount: price, currency_id: "BRL" },
    back_url: `${appUrl}/subscription?payment=return`,
    notification_url: `${appUrl}/api/billing/mercado-pago/webhook`,
    status: "pending",
  }) });
  return { checkoutUrl: preference.init_point as string };
}

function isValidWebhook(req: Request) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return false;
  const signature = req.header("x-signature");
  const requestId = req.header("x-request-id") ?? "";
  const dataId = typeof req.query["data.id"] === "string" ? req.query["data.id"] : typeof req.body?.data?.id === "string" ? req.body.data.id : "";
  if (!signature || !dataId) return false;
  const parts = Object.fromEntries(signature.split(",").map((item) => item.trim().split("=", 2)));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1)); } catch { return false; }
}

export async function processMercadoPagoWebhook(req: Request) {
  if (!isValidWebhook(req)) throw new Error("Assinatura do webhook inválida.");
  const eventId = req.header("x-request-id") || `${req.body?.type}:${req.body?.data?.id}`;
  const db = await getDb();
  if (!db) throw new Error("Banco de assinatura indisponível.");
  const existing = await db.select({ id: billingWebhookEvents.id }).from(billingWebhookEvents).where(eq(billingWebhookEvents.providerEventId, eventId)).limit(1);
  if (existing.length) return;
  await db.insert(billingWebhookEvents).values({ provider: "mercado_pago", providerEventId: eventId, eventType: String(req.body?.type ?? "unknown"), payload: JSON.stringify(req.body) });
  if (req.body?.type !== "subscription_preapproval") return;
  const remote = await mercadoPago(`/preapproval/${req.body.data.id}`);
  const authUserId = remote.external_reference as string | undefined;
  if (!authUserId) throw new Error("Assinatura sem referência de usuário.");
  const statusMap: Record<string, "active" | "past_due" | "canceled" | "paused"> = { authorized: "active", pending: "paused", paused: "paused", cancelled: "canceled" };
  const status = statusMap[remote.status] ?? "paused";
  const previous = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.provider, "mercado_pago"), eq(subscriptions.providerSubscriptionId, remote.id))).limit(1);
  const values = { authUserId, plan: "pro" as const, status, provider: "mercado_pago", providerCustomerId: remote.payer_id ? String(remote.payer_id) : null, providerSubscriptionId: remote.id, currentPeriodEndsAt: remote.next_payment_date ? new Date(remote.next_payment_date) : null, cancelAtPeriodEnd: status === "canceled" };
  if (previous.length) await db.update(subscriptions).set(values).where(eq(subscriptions.id, previous[0].id));
  else await db.insert(subscriptions).values(values);
  await db.update(billingWebhookEvents).set({ processedAt: new Date() }).where(eq(billingWebhookEvents.providerEventId, eventId));
}
