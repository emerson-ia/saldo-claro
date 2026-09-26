import type { PropsWithChildren } from "react";

export default function RootHtml({ children }: PropsWithChildren) {
  return <html lang="pt-BR"><head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <meta name="theme-color" content="#0A2421" />
    <meta name="description" content="Saldo Claro mostra quanto você pode gastar sem comprometer o seu mês." />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:title" content="Saldo Claro | Posso gastar esse dinheiro?" />
    <meta property="og:description" content="Veja quanto realmente cabe no seu mês antes de decidir." />
    <meta name="twitter:card" content="summary" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="canonical" href="https://saldo-claro.pages.dev/" />
    <title>Saldo Claro | Posso gastar esse dinheiro?</title>
  </head><body>{children}</body></html>;
}
