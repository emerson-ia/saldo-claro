# Saldo Claro

O **Saldo Claro** é uma aplicação móvel de finanças pessoais, em português do Brasil, criada para tornar o controlo de contas, despesas, cartões e planejamento mais claro. O projeto privilegia orientação vertical, utilização com uma mão, dados demonstrativos identificados e interações curtas para registar movimentações no momento em que acontecem.

## Estado da versão

Esta entrega é um **MVP local funcional**. Os dados são persistidos no dispositivo e podem ser explorados imediatamente no modo de demonstração ou substituídos por uma base vazia no onboarding. A estrutura de tipos e regras foi preparada para receber uma camada de sincronização autenticada, mas a versão atual não deve ser usada como repositório de dados financeiros de produção.

| Área | Entregue nesta versão | Comportamento |
|---|---|---|
| Onboarding | Sim | Cria uma primeira conta ou inicia dados de demonstração separados. |
| Painel mensal | Sim | Mostra saldo calculado, previsão, resumo, alertas e últimos lançamentos. |
| Lançamentos | Sim | Regista receitas, despesas, transferências e compras no cartão. |
| Contas | Sim | O saldo é calculado a partir do saldo inicial e movimentações realizadas. |
| Cartões | Sim | Mostra limite, utilização do período e referência de fechamento. |
| Planejamento | Sim | Exibe orçamentos existentes, meta principal e progresso. |
| Relatórios | Sim | Resume entradas, saídas e despesas por categoria. |
| Preferências | Sim | Inclui tema, modo de privacidade e saída do modo demonstrativo. |
| Sincronização, autenticação e RLS | Preparado | Requer a integração de backend antes de uso com dados reais. |

## Arquitetura

O cliente usa **Expo**, **React Native**, **Expo Router** e **TypeScript**. A camada `lib/finance-domain.ts` concentra entidades, regras de cálculo e formatação; `lib/finance-store.tsx` mantém a sessão de dados e persiste o estado com AsyncStorage. Essa separação evita que cálculos importantes dependam da interface e torna possível substituir a persistência local por uma API autenticada sem reescrever os ecrãs.

| Camada | Responsabilidade | Arquivos principais |
|---|---|---|
| Interface | Telas, componentes, estados de formulário e feedback | `app/`, `components/finance-ui.tsx` |
| Domínio | Tipos, regras de saldo, previsão, orçamento e demonstrativo | `lib/finance-domain.ts` |
| Estado local | Carga, persistência e ações que alteram dados | `lib/finance-store.tsx` |
| Aparência | Paleta, tema claro/escuro e preferências | `lib/finance-theme.tsx`, `theme.config.js` |
| Validação | Regras financeiras automatizadas | `tests/finance-domain.test.ts` |

> **Regra central:** transferências movem saldo entre contas, mas não entram como receita ou despesa. Lançamentos pendentes entram na previsão, não no saldo realizado. Compras no cartão aparecem como despesa e não reduzem diretamente a conta bancária.

## Modelo de dados local

As entidades abaixo existem como tipos de domínio e podem mapear diretamente para tabelas numa futura sincronização. Valores da versão de demonstração são números JavaScript; em produção, os valores monetários devem ser persistidos em **centavos inteiros** ou colunas `DECIMAL`, nunca como ponto flutuante.

| Entidade | Campos fundamentais | Relações e regras |
|---|---|---|
| Conta | `id`, `name`, `type`, `initialBalance`, `includeInTotal` | O saldo é derivado de lançamentos realizados. |
| Categoria | `id`, `name`, `kind`, `color`, `icon` | É associada a receita, despesa ou compra no cartão. |
| Cartão | `id`, `name`, `limit`, `closingDay`, `dueDay` | Recebe compras; o limite utilizado é calculado por período. |
| Lançamento | `id`, `kind`, `amount`, `date`, `status` | Pode ser receita, despesa, transferência ou compra no cartão. |
| Orçamento | `id`, `categoryId`, `amount`, `month` | Compara gasto da categoria com limite mensal. |
| Meta | `id`, `name`, `target`, `saved`, `targetDate` | Exibe progresso do objetivo sem somar esse objetivo ao saldo disponível. |

## Como executar localmente

```bash
pnpm install
pnpm dev
```

Use o QR fornecido pelo ambiente de desenvolvimento para abrir no Expo Go ou utilize a pré-visualização web. Para validação, os comandos principais são:

```bash
pnpm check
pnpm test
pnpm lint
```

## Segurança e evolução para produção

O escopo solicitado inclui autenticação, dados privados por usuário, recuperação de conta, exportação, anexos, importação de CSV, notificações e políticas de segurança por linha. Esses elementos exigem uma infraestrutura de produção e não devem ser simulados no cliente local.

| Próxima etapa | Decisão recomendada | Critério de aceite |
|---|---|---|
| Dados privados | Criar API autenticada e tabelas por `user_id` | Um usuário jamais recebe dados de outro. |
| Segurança | Usar autorização no servidor em toda leitura e alteração | Rotas protegidas e testes de isolamento entre usuários. |
| Valores monetários | Persistir em centavos ou `DECIMAL(14,2)` | Sem erros de arredondamento em parcelas e faturas. |
| Cartões e faturas | Modelar compras, parcelas, faturas e pagamentos em transação atômica | Pagamento de fatura não duplica a despesa. |
| Importação/exportação | Processar CSV com pré-visualização e validação | Possíveis duplicidades ficam visíveis antes de salvar. |
| Notificações | Usar agendamento local e serviço remoto autorizado no futuro | Alertas de vencimento respeitam preferências do usuário. |

## Limitações conhecidas

O MVP ainda não inclui login por e-mail, Supabase, Row Level Security, banco remoto, faturas completas, recorrências, parcelamento gerado automaticamente, importação CSV, exportação PDF, calendário, anexos, área administrativa ou pagamentos. Estes itens não são apresentados como concluídos. O menu de importação/exportação está sinalizado como funcionalidade futura e não executa qualquer operação sensível.

## Identidade visual

O nome, textos, paleta e ícone do Saldo Claro são originais. A cor de marca é o verde-petróleo `#0B6B62`, com verde para resultados positivos, âmbar para atenção e vermelho para despesas ou risco. A configuração central de marca fica em `app.config.ts`.
