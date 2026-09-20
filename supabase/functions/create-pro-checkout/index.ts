import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const plans = {
  monthly: { amount: 5.6, frequency: 1, label: "Mensal" },
  yearly: { amount: 49.9, frequency: 12, label: "Anual" },
} as const;

type Period = keyof typeof plans;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  // Safeguard: a production token must never create a real charge while this flow is being homologated.
  if (Deno.env.get("MP_TEST_MODE") !== "true") return json({ error: "Cobranças ainda não foram liberadas. Ambiente de teste não configurado." }, 503);

  const accessToken = Deno.env.get("MP_TEST_ACCESS_TOKEN");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!accessToken || !supabaseUrl || !supabaseAnonKey) return json({ error: "Configuração de cobrança incompleta." }, 503);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Faça login novamente para continuar." }, 401);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Sua sessão expirou. Entre novamente." }, 401);

  let period: Period;
  try {
    const body = await request.json();
    period = body.period;
  } catch {
    return json({ error: "Plano inválido." }, 400);
  }
  if (!(period in plans)) return json({ error: "Plano inválido." }, 400);

  const plan = plans[period];
  const appUrl = (Deno.env.get("APP_PUBLIC_URL") ?? "https://saldo-claro.pages.dev").replace(/\/$/, "");
  const webhookUrl = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: `Saldo Claro PRO ${plan.label}`,
      external_reference: user.id,
      payer_email: user.email,
      auto_recurring: { frequency: plan.frequency, frequency_type: "months", transaction_amount: plan.amount, currency_id: "BRL" },
      back_url: `${appUrl}/subscription?checkout=return`,
      notification_url: webhookUrl,
      status: "pending",
    }),
  });
  if (!response.ok) {
    console.error("Mercado Pago checkout error", response.status, await response.text());
    return json({ error: "Não foi possível iniciar o checkout do Mercado Pago." }, 502);
  }
  const checkout = await response.json();
  if (!checkout.init_point) return json({ error: "O Mercado Pago não retornou o checkout." }, 502);
  return json({ checkoutUrl: checkout.init_point });
});
