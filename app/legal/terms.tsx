import { LegalDocument } from "@/components/legal-document";

export default function TermsScreen() {
  return <LegalDocument title="Termos de Uso" updatedAt="26 de setembro de 2026" intro="Estes termos explicam como usar o Saldo Claro. Ao criar uma conta, você confirma que leu e concorda com estas condições." sections={[
    { title: "O que o Saldo Claro faz", body: "O Saldo Claro organiza informações financeiras que você registra, como lançamentos, contas, cartões, metas e orçamentos. Ele não é banco, não movimenta dinheiro, não realiza transferências e não pede sua senha bancária." },
    { title: "Decisões financeiras", body: "As informações, previsões e alertas são apoio à organização pessoal. Eles não substituem orientação financeira, contábil ou jurídica. Você continua responsável pelas decisões tomadas com base nos dados do app." },
    { title: "Sua conta", body: "Você deve fornecer dados corretos, manter sua senha protegida e avisar sobre uso não autorizado. Podemos limitar ou suspender acesso em caso de fraude, violação destes termos ou risco à segurança do serviço." },
    { title: "Planos e cobrança", body: "O plano Grátis não tem cobrança. Recursos PRO podem ter preço, ciclo e condições próprios apresentados antes da contratação. Nenhuma cobrança deve ser criada sem a confirmação explícita do titular." },
    { title: "Mudanças no serviço", body: "O produto evolui continuamente. Alterações relevantes nestes termos serão publicadas nesta página com nova data de atualização. Se você não concordar, poderá parar de usar o serviço e solicitar a exclusão da conta." },
  ]} />;
}
