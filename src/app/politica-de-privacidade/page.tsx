import type { Metadata } from "next";
import { LegalPageLayout, LegalSection, LegalList, LegalListItem } from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Privacidade — CUSTTO",
  description: "Política de Privacidade do CUSTTO.",
};

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      lastUpdated="08 de agosto de 2026"
      crossLinkHref="/termos-de-uso"
      crossLinkLabel="Termos de Uso"
    >
      <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Esta Política de Privacidade descreve como o CUSTTO coleta, usa e protege seus dados
        pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
        13.709/2018).
      </p>

      <LegalSection number={1} title="Quais dados coletamos">
        <LegalList>
          <LegalListItem>
            <strong>Dados de cadastro:</strong> nome, e-mail, nome do restaurante/negócio.
          </LegalListItem>
          <LegalListItem>
            <strong>Dados de uso:</strong> custos, insumos, receitas e preços que você cadastra na
            plataforma para gerar os cálculos de precificação.
          </LegalListItem>
          <LegalListItem>
            <strong>Dados de pagamento:</strong> processados diretamente pelo Stripe — o CUSTTO
            não armazena número de cartão de crédito.
          </LegalListItem>
          <LegalListItem>
            <strong>Dados técnicos:</strong> endereço IP, tipo de navegador e informações de uso
            da plataforma, coletados automaticamente para fins de segurança e melhoria do serviço
            (analytics).
          </LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection number={2} title="Por que coletamos esses dados">
        <LegalList>
          <LegalListItem>Para viabilizar o funcionamento da ferramenta (cálculo de preços);</LegalListItem>
          <LegalListItem>Para processar sua assinatura e cobrança;</LegalListItem>
          <LegalListItem>
            Para prestar suporte via WhatsApp/e-mail quando você entra em contato;
          </LegalListItem>
          <LegalListItem>
            Para melhorar a plataforma com base em métricas de uso agregadas.
          </LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection number={3} title="Com quem compartilhamos dados">
        <p>
          Não vendemos seus dados. Compartilhamos informações apenas com prestadores de serviço
          essenciais ao funcionamento do CUSTTO:
        </p>
        <LegalList>
          <LegalListItem>
            <strong>Supabase</strong> — armazenamento do banco de dados;
          </LegalListItem>
          <LegalListItem>
            <strong>Stripe</strong> — processamento de pagamentos;
          </LegalListItem>
          <LegalListItem>
            <strong>Vercel</strong> — hospedagem da aplicação.
          </LegalListItem>
        </LegalList>
        <p>
          Esses parceiros têm suas próprias políticas de privacidade e seguem padrões de segurança
          compatíveis com a LGPD.
        </p>
      </LegalSection>

      <LegalSection number={4} title="Seus direitos como titular de dados">
        <p>Conforme a LGPD, você pode a qualquer momento:</p>
        <LegalList>
          <LegalListItem>Solicitar acesso aos seus dados armazenados;</LegalListItem>
          <LegalListItem>Solicitar correção de dados incorretos;</LegalListItem>
          <LegalListItem>Solicitar a exclusão da sua conta e dos dados associados;</LegalListItem>
          <LegalListItem>Solicitar a portabilidade dos seus dados.</LegalListItem>
        </LegalList>
        <p>
          Para exercer qualquer um desses direitos, entre em contato pelo e-mail{" "}
          <a href="mailto:atendimento@custto.com.br" className="underline">
            atendimento@custto.com.br
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection number={5} title="Retenção e exclusão de dados">
        <p>
          Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar o cancelamento
          definitivo da conta, seus dados serão excluídos em até 30 dias, exceto informações que
          precisamos manter por obrigação legal (ex: registros fiscais de cobrança).
        </p>
      </LegalSection>

      <LegalSection number={6} title="Segurança">
        <p>
          Utilizamos autenticação segura e políticas de acesso (Row Level Security) que garantem
          que cada usuário só acesse seus próprios dados dentro da plataforma.
        </p>
      </LegalSection>

      <LegalSection number={7} title="Cookies">
        <p>
          Utilizamos cookies essenciais para manter sua sessão de login ativa, e podemos utilizar
          cookies de analytics para entender como a plataforma é usada, sempre de forma agregada e
          não identificável individualmente para fins de anúncio.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Contato do Encarregado de Dados (DPO)">
        <p>
          Para questões relacionadas à privacidade e proteção de dados:{" "}
          <a href="mailto:atendimento@custto.com.br" className="underline">
            atendimento@custto.com.br
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
