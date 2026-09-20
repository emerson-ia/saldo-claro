# Saldo Claro PRO, homologação Mercado Pago

Este fluxo é somente de teste. A função `create-pro-checkout` recusa qualquer checkout enquanto `MP_TEST_MODE` não for exatamente `true`.

## Segredos das Edge Functions

No Supabase, cadastre apenas em **Edge Functions → Secrets**:

```text
MP_TEST_ACCESS_TOKEN=<token de teste do Mercado Pago>
MP_TEST_PAYER_EMAIL=<e-mail do comprador de teste do Mercado Pago>
MP_TEST_MODE=true
APP_PUBLIC_URL=https://saldo-claro.pages.dev
```

`MP_ACCESS_TOKEN` de produção não é usado nesta etapa. `MP_WEBHOOK_SECRET` só deve ser cadastrado depois de criar o webhook no painel do Mercado Pago. Nunca incluir tokens, a assinatura do webhook ou segredos em `.env.local`, Git ou no app.

## Aplicar e publicar

Com o Supabase CLI autenticado e vinculado ao projeto `rwnjmdsjqnwntbqpxlja`:

```bash
supabase db push
supabase functions deploy create-pro-checkout
supabase functions deploy mercado-pago-webhook --no-verify-jwt
```

## Webhook no Mercado Pago

Ao criar a assinatura, a função envia esta URL automaticamente no campo `notification_url`:

```text
https://rwnjmdsjqnwntbqpxlja.supabase.co/functions/v1/mercado-pago-webhook
```

No painel Mercado Pago, copie a assinatura secreta do webhook e registre como `MP_WEBHOOK_SECRET`. A função valida `x-signature`, consulta a assinatura na API Mercado Pago e só então atualiza o plano do usuário no Supabase.

## Antes de liberar cobrança real

1. Usar usuário e cartão de teste do Mercado Pago.
2. Confirmar que um pagamento autorizado cria `finance_subscriptions` com status `active`.
3. Confirmar cancelamento, falha e reenvio de webhook sem duplicar eventos.
4. Implementar todos os recursos PRO e as regras de bloqueio no app.
5. Trocar para credencial de produção e `MP_TEST_MODE=false` somente com aprovação explícita.
