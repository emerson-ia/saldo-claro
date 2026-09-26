import { LegalDocument } from "@/components/legal-document";

export default function PrivacyScreen() {
  return <LegalDocument title="Política de Privacidade" updatedAt="26 de setembro de 2026" intro="Privacidade financeira pede clareza. Esta política explica quais dados o Saldo Claro usa, por quê e quais controles você tem." sections={[
    { title: "Dados tratados", body: "Podemos tratar dados de cadastro, como e-mail e nome, e os dados financeiros que você inserir, como lançamentos, contas, cartões, categorias, metas e arquivos importados. O app não recebe sua senha bancária e não movimenta dinheiro." },
    { title: "Finalidade e base", body: "Os dados são usados para autenticar sua conta, sincronizar suas informações, mostrar saldos, previsões e alertas, prevenir abuso e atender solicitações feitas por você. O tratamento ocorre para executar o serviço solicitado e cumprir obrigações aplicáveis." },
    { title: "Armazenamento e acesso", body: "O acesso depende de autenticação. Cada conta acessa apenas os próprios dados pelas regras de permissão do banco. Dados de demonstração ficam identificados como demonstração. Nenhuma arquitetura elimina risco por completo, por isso não compartilhe sua senha." },
    { title: "Seus direitos pela LGPD", body: "Você pode pedir confirmação de tratamento, acesso, correção, informação sobre uso e exclusão da conta. Para começar uma solicitação, use o suporte dentro do app. O prazo e a resposta podem depender de obrigações legais de retenção e prevenção a fraude." },
    { title: "Exclusão da conta", body: "Na área de dados, você pode solicitar a exclusão. A solicitação fica registrada para atendimento; quando concluída, a conta e os dados vinculados são removidos conforme a política aplicável. Não oferecemos exclusão automática pelo celular porque isso exigiria uma credencial administrativa no dispositivo, o que seria inseguro." },
  ]} />;
}
