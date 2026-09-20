# Finanças em Dia, arquitetura de dados financeiros

## Decisão

A fonte oficial dos dados financeiros será **Supabase Postgres**. O Supabase Auth já é usado no aplicativo e o Postgres permite usar o mesmo `auth.users.id` como fronteira de segurança por usuário.

O armazenamento local deixa de ser fonte de verdade. Ele permanece somente como cache de experiência offline, com fila de alterações a sincronizar.

## O que está coberto pela migração inicial

- Preferências da experiência financeira.
- Contas, categorias, cartões, lançamentos, orçamentos e metas.
- Importações CSV/OFX, guardando metadados e hash para impedir reimportação acidental.
- Valores em **centavos inteiros**. Nunca usar `float` ou `double` para dinheiro.
- UUIDs, `created_at`, `updated_at` e exclusão lógica onde o histórico precisa sobreviver.
- Índices para carregamento por usuário e mês, que é a consulta principal do produto.
- RLS em todas as tabelas. Usuários autenticados só leem e escrevem linhas cujo `user_id = auth.uid()`.

Arquivo preparado, ainda não aplicado:

`supabase/migrations/20260906053000_finance_foundation.sql`

## Arquivos OFX e comprovantes

1. CSV/OFX é interpretado no app ou endpoint autenticado.
2. O conteúdo recebe SHA-256 e gera lançamentos em transação lógica.
3. Por padrão, o original não é armazenado após a importação.
4. Se for necessário guardar o arquivo, ele entra em bucket privado por usuário, com URL assinada e regra de retenção.
5. Nunca guardar extrato em bucket público.

## Escala e tamanho esperado

Estimativa conservadora para lançamentos sem anexos:

| Volume | Lançamentos | Dados + índices, ordem de grandeza |
|---|---:|---:|
| 1.000 usuários, 1.000 lançamentos cada | 1 milhão | 2 a 5 GB |
| 10.000 usuários, 1.000 lançamentos cada | 10 milhões | 20 a 50 GB |

Contas, cartões, categorias e metas têm peso irrelevante perto da tabela de lançamentos. Arquivos OFX e comprovantes são os itens que podem inflar armazenamento, por isso há retenção e bucket separado.

## Backup e recuperação

- Banco: backup gerenciado com ponto de restauração e retenção compatível com o plano contratado.
- Cópia independente: dump diário criptografado em armazenamento separado, retenção inicial de 30 dias.
- Arquivos privados: versionamento e retenção própria no bucket.
- Operação: restaurar um backup em ambiente isolado a cada trimestre. Backup sem teste de restauração não conta.
- Objetivo inicial: perda máxima de 24 horas em desastre amplo. Depois evoluir para point-in-time recovery conforme a base crescer.

## Sincronização do aplicativo

1. Na primeira entrada após a migração, importar o JSON local uma única vez, sob confirmação do usuário.
2. Criar registros no servidor com UUID no cliente e `updated_at` no servidor.
3. Ler lançamentos paginados por mês, nunca o histórico inteiro.
4. Atualizar a tela imediatamente e sincronizar em segundo plano.
5. Em conflito, usar `updated_at` e registrar conflito para itens financeiros que não possam ser mesclados com segurança.
6. Depois de sincronizar e validar, manter o cache local apenas para offline e recuperação rápida.

## Sequência de implantação

1. Criar projeto/ambiente Supabase de desenvolvimento separado.
2. Aplicar a migração em desenvolvimento e testar RLS com dois usuários.
3. Criar serviço de repositório financeiro no app, em paralelo ao `AsyncStorage`.
4. Migrar leitura, escrita e exclusões por entidade.
5. Adicionar importação única dos dados locais e deduplicação de CSV/OFX.
6. Configurar backup, exportação de dados e exclusão de conta/LGPD.
7. Aplicar em produção somente após teste de restauração e aprovação explícita.

## Não fazer

- Não expor `service_role` no aplicativo.
- Não colocar arquivos OFX em bucket público.
- Não confiar apenas em filtro de `user_id` no front-end. RLS é obrigatório.
- Não usar número de ponto flutuante para valores monetários.
- Não manter o `AsyncStorage` como único local dos dados após lançar para usuários reais.
