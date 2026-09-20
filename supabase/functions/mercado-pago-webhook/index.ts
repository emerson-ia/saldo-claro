import { createClient } from "npm:@supabase/supabase-js@2";

const mercadoPagoApi = "https://api.mercadopago.com";

function response(status: number) {
  return new Response(null, { status });
}

function signatureParts(value: string) {
  return Object.fromEntries(value.split(",").map((item) => item.trim().split("=", 2)));
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(first: string, second: string) {
  if (first.length !== second.length) return false;
  let mismatch = 0;
  for (let index = 0; index < first.length; index += 1) mismatch |= first.charCodeAt(index) ^ second.charCodeAt(index);
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response(405);
  if (Deno.env.get("MP_TEST_MODE") !== "true") return response(503);

  const secret = Deno.env.get("MP_WEBHOOK_SECRET");
  const accessToken = Deno.env.get("MP_TEST_ACCESS_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !accessToken || !supabaseUrl || !serviceRoleKey) return response(503);

  let payload: { type?: string; data?: { id?: string | number } };
  try { payload = await request.json(); } catch { return response(400); }
  const dataId = new URL(request.url).searchParams.get("data.id") ?? String(payload.data?.id ?? "");
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id") ?? "";
  if (!dataId || !signature) return response(401);
  const parts = signatureParts(signature);
  if (!parts.ts || !parts.v1) return response(401);
  const expected = await hmac(secret, `id:${dataId};request-id:${requestId};ts:${parts.ts};`);
  if (!constantTimeEqual(expected, parts.v1)) return response(401);

  if (payload.type !== "subscription_preapproval") return response(200);

  const eventId = requestId || `${payload.type}:${dataId}:${parts.ts}`;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const mercadoResponse = await fetch(`${mercadoPagoApi}/preapproval/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!mercadoResponse.ok) {
    console.error("Mercado Pago subscription lookup failed", mercadoResponse.status);
    return response(502);
  }
  const subscription = await mercadoResponse.json();
  const userId = subscription.external_reference;
  if (typeof userId !== "string") return response(422);
  const { data: existing, error: existingError } = await admin.from("finance_billing_events").select("processed_at").eq("provider", "mercado_pago").eq("provider_event_id", eventId).maybeSingle();
  if (existingError) {
    console.error("Billing event lookup failed", existingError);
    return response(500);
  }
  if (existing?.processed_at) return response(200);

  const statuses: Record<string, string> = { authorized: "active", pending: "pending", paused: "paused", cancelled: "cancelled" };
  const period = subscription.auto_recurring?.frequency === 12 ? "yearly" : "monthly";
  const planCode = period === "yearly" ? "pro_annual" : "pro_monthly";
  const { data: storedSubscription, error: upsertError } = await admin.from("finance_subscriptions").upsert({
    user_id: userId,
    plan_code: planCode,
    status: statuses[subscription.status] ?? "pending",
    provider: "mercado_pago",
    provider_subscription_id: String(subscription.id),
    amount_cents: period === "yearly" ? 4990 : 560,
    currency: "BRL",
    billing_interval: period === "yearly" ? "year" : "month",
    current_period_start: subscription.date_created ?? null,
    current_period_end: subscription.next_payment_date ?? null,
    cancelled_at: subscription.status === "cancelled" ? (subscription.date_last_updated ?? new Date().toISOString()) : null,
  }, { onConflict: "provider,provider_subscription_id" }).select("id").single();
  if (upsertError) {
    console.error("Subscription upsert failed", upsertError);
    return response(500);
  }
  if (!existing) {
    const { error: eventInsertError } = await admin.from("finance_billing_events").insert({
      user_id: userId,
      subscription_id: storedSubscription.id,
      provider: "mercado_pago",
      provider_event_id: eventId,
      event_type: payload.type,
      status: "received",
      occurred_at: subscription.date_last_updated ?? null,
      metadata: { subscription_id: String(subscription.id), status: String(subscription.status) },
    });
    if (eventInsertError && eventInsertError.code !== "23505") {
      console.error("Billing event insert failed", eventInsertError);
      return response(500);
    }
  }
  const { error: eventError } = await admin.from("finance_billing_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("provider", "mercado_pago").eq("provider_event_id", eventId);
  if (eventError) {
    console.error("Billing event processing update failed", eventError);
    return response(500);
  }
  return response(200);
});
