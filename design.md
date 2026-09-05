# Plano de Interface — Saldo Claro

## Direção do produto

O **Saldo Claro** será uma aplicação de finanças pessoais em português do Brasil, desenhada prioritariamente para uma utilização confortável com uma mão em orientação vertical 9:16. A experiência deve reduzir a ansiedade associada a números financeiros: informações essenciais aparecem primeiro, detalhes ficam acessíveis por toque e o utilizador recebe contexto claro antes de tomar qualquer ação.

O padrão visual seguirá convenções iOS contemporâneas: áreas de toque amplas, hierarquia tipográfica nítida, navegação inferior persistente, folhas modais para criação de dados e confirmação explícita em ações destrutivas. No ecrã inicial, o foco é o saldo e as próximas decisões; nas áreas operacionais, o foco é a rapidez de registo.

## Cores e identidade

| Papel | Cor | Aplicação |
|---|---|---|
| Marca principal | `#0B6B62` | Ações primárias, destaques e navegação ativa |
| Marca profunda | `#064E47` | Cabeçalhos de destaque e superfícies de contexto |
| Fundo claro | `#F6F8F7` | Fundo geral dos ecrãs claros |
| Superfície | `#FFFFFF` | Cartões, campos e folhas modais |
| Texto principal | `#16332F` | Títulos, valores e informação de alta prioridade |
| Texto secundário | `#687A76` | Rótulos, datas e descrições auxiliares |
| Positivo | `#159A6B` | Receitas, evolução favorável e estados concluídos |
| Atenção | `#D98B18` | Vencimentos e orçamentos próximos do limite |
| Negativo | `#D94343` | Despesas, atrasos e ações de risco |

O modo escuro conservará o verde-petróleo como referência, usando superfícies em `#102522`, cartões em `#18312D` e texto em `#E8F2EF`. Os componentes nunca dependerão apenas de cor para transmitir estado: ícone, rótulo e contraste complementam os indicadores.

## Ecrãs e funcionalidades

| Ecrã | Conteúdo principal | Ações principais |
|---|---|---|
| Boas-vindas e onboarding | Apresentação, moeda BRL, primeira conta, saldo inicial, categorias e cartão opcional | Avançar, voltar, pular etapa opcional, concluir |
| Início | Saudação, seletor mensal, saldo atual e previsto, resumo do mês, gráficos, alertas e últimos lançamentos | Navegar entre meses, abrir lançamentos, iniciar novo registo |
| Lançamentos | Pesquisa, filtros, lista cronológica e estado dos lançamentos | Adicionar, editar, duplicar, marcar como pago/recebido, excluir |
| Novo lançamento | Seletor de tipo, valor, categoria, conta/cartão, datas e notas | Guardar receita, despesa, transferência ou compra no cartão |
| Planejamento | Orçamentos por categoria, metas e projeção de saldo | Ajustar orçamento, criar meta, consultar detalhes |
| Contas e carteiras | Saldo calculado por conta, ícone, cor e estado | Criar, editar, arquivar e consultar movimentações |
| Cartões | Limite, fatura atual, próximos vencimentos e compras parceladas | Cadastrar cartão, adicionar compra e registrar pagamento |
| Relatórios e calendário | Comparação receitas/despesas, despesas por categoria e agenda mensal | Alterar período e filtros, abrir itens do gráfico/calendário |
| Mais e preferências | Categorias, importação/exportação, tema, perfil, notificações e segurança | Gerir dados, alternar tema, exportar e encerrar sessão |

## Fluxos principais

### Primeiro acesso

O utilizador entra na sequência de boas-vindas, escolhe BRL, informa uma primeira conta e seu saldo inicial. Em seguida pode selecionar categorias mais comuns e, caso deseje, cadastrar um cartão. Ao concluir ou pular etapas opcionais, chega ao painel inicial com instruções sutis para criar a primeira movimentação.

### Registrar uma despesa

Na barra inferior, o utilizador toca em **Adicionar**, seleciona **Despesa**, informa o valor e a categoria, escolhe a conta ou cartão, revisa data e status e confirma. O sistema atualiza o saldo, o total mensal, o orçamento da categoria e a lista de lançamentos; uma mensagem de sucesso deixa claro que o registo foi guardado.

### Acompanhar planejamento

Em **Planejamento**, o utilizador vê um cartão de orçamento por categoria com utilizado, restante e percentagem. Ao tocar no cartão, pode ver os lançamentos que compõem o valor, ajustar o limite e comparar com o mês anterior. Metas mostram progresso e contribuição planejada sem misturar o valor da meta com o saldo disponível.

### Gerir conta e cartão

Em **Mais**, o utilizador abre Contas ou Cartões. A conta apresenta saldo calculado e movimentos; o cartão apresenta limite disponível, fatura aberta e data de vencimento. Qualquer ação que exclua dados pede confirmação e apresenta o impacto antes de ser executada.

## Estrutura e decisões técnicas

O MVP utilizará Expo Router e TypeScript, com componentes reutilizáveis, tipos financeiros centralizados e persistência local para a demonstração inicial. A camada de domínio será separada da interface para permitir ligar posteriormente autenticação, base de dados e sincronização privada sem reescrever os ecrãs. Datas serão exibidas em `DD/MM/AAAA` e valores serão formatados em `pt-BR` e `BRL`.

As ações de registo devem completar um ciclo inteiro na demonstração: criar, visualizar no painel, refletir em totais e poder editar ou excluir. Integrações sensíveis — sincronização, notificações remotas, importação bancária e recuperação de conta — ficarão sinalizadas como pontos de evolução até que a infraestrutura de produção seja ativada.
