# Parecer técnico — landing page Finanças em Dia

## Rota e arquitetura recomendadas

- Criar a rota pública `app/landing.tsx` (URL: `/landing`), mantendo `app/(tabs)` e as rotas atuais intactos. No `app/_layout.tsx`, declarar `landing` no `Stack` e ajustar o `AuthGate` para tratá-la como pública; hoje ele redireciona qualquer rota que não comece por `auth` para `/auth/login` quando não há sessão/configuração.
- Deixar a landing como uma tela de aquisição isolada: sem `useFinance`, `FinanceProvider`, leitura/escrita de `AsyncStorage` ou regras do domínio financeiro. CTAs devem apontar para `/auth/login` (cadastro/entrar) e, se desejado, para `/welcome` apenas dentro do fluxo autorizado.
- Para preservar a experiência mobile, organizar a tela em `components/landing/` e usar o mesmo conteúdo/dados em ambas as plataformas, com implementações por sufixo de plataforma quando necessário: `landing-video.web.tsx` e `landing-video.native.tsx`. A rota continua Expo Router, sem criar um segundo site nem mexer na navegação do app.
- O projeto já entrega web estático via Metro (`web.output: "static"`) e possui `expo-video`; não há implementação de vídeo atual. A landing é viável no mesmo build web, desde que o conteúdo de marketing seja independente dos providers de dados do app.

## Componentes e reuso

Estrutura sugerida em `components/landing/`:

- `landing-header`: marca, navegação âncora na web e CTA de login.
- `hero`, `benefit-list` e `feature-preview`: proposta, benefícios e visual do produto.
- `social-proof`: dados tipados (`name`, `role`, `quote`, `avatar?`), renderizados por lista; usar apenas depoimentos autorizados e reais.
- `landing-video`: bloco dark com título, thumbnail/poster, play e fallback por plataforma.
- `cta-band` e `landing-footer`: CTA repetido e links institucionais.
- `landing-content.ts`: copy, benefícios, depoimentos e URLs como dados estáticos, para não espalhar texto/links no JSX.

Reaproveitar apenas tokens de marca que façam sentido (`#0B6B62`, tipografia e ícones `@expo/vector-icons`). Não reutilizar `ScreenContainer` ou componentes financeiros como base da landing: eles dependem do tema/semântica de aplicativo e podem levar a uma página promocional com comportamento de app.

## Vídeo dark sem impacto no app mobile

- **Web:** `landing-video.web.tsx` pode carregar um `iframe` responsivo de YouTube/Vimeo somente depois do clique no poster (ou por lazy-load com `loading="lazy"`), usando `aspect-ratio: 16 / 9`, `title`, domínio HTTPS permitido e política de privacidade/nocookie quando disponível. O poster evita scripts de terceiros e transferência inicial desnecessária.
- **iOS/Android:** não importar DOM/`iframe`. `landing-video.native.tsx` deve mostrar o mesmo poster e abrir o vídeo externo via `expo-linking`/`expo-web-browser`; se no futuro o vídeo for hospedado como MP4 próprio, usar `expo-video` apenas nesse arquivo nativo. Assim, dependências e APIs web não entram no bundle executado pelos apps.
- Hospedar poster e, se houver, MP4 em CDN/armazenamento versionado; comprimir e definir dimensões. Evitar autoplay com som, vídeo em background e credenciais/segredos em URLs. Fornecer link textual/fallback quando o player estiver bloqueado.

## Checklist de validação técnica

- [ ] Sem sessão, `/landing` abre e não é redirecionada pelo `AuthGate`; CTAs levam a `/auth/login` sem loop.
- [ ] Com sessão, landing continua acessível (ou há redirecionamento intencional e testado); rotas de tabs, login, welcome e deep links seguem funcionando.
- [ ] `pnpm check`, `pnpm lint` e `pnpm test` passam.
- [ ] Validar `expo start --web` e export/build web estático; abrir `/landing` diretamente e atualizar a página sem 404.
- [ ] Testar Android e iOS: rota renderiza, CTA navega e o vídeo abre externamente; nenhum `window`, `document` ou `iframe` é importado no bundle nativo.
- [ ] Em desktop e celular: poster preserva proporção, player só é carregado quando previsto, sem autoplay/áudio inesperado, e há fallback funcional.
- [ ] Conferir performance e acessibilidade: imagem otimizada, CLS baixo, textos/CTAs legíveis, foco de teclado, labels do player e contraste da seção dark.
- [ ] Antes de publicar prova social, validar autorização, nomes/cargos e a veracidade de cada depoimento.
