import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection, LegalList, LegalListItem } from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Termos de Uso — CUSTTO",
  description: "Termos de Uso do CUSTTO.",
};

export default function TermosDeUsoPage() {
  return (
    <LegalPageLayout
      title="Termos de Uso"
      lastUpdated="08 de agosto de 2026"
      crossLinkHref="/politica-de-privacidade"
      crossLinkLabel="Política de Privacidade"
    >
      <LegalSection number={1} title="Sobre o CUSTTO">
        <p>
          O CUSTTO é uma ferramenta online de precificação para donos de restaurante e delivery,
          oferecida por CUSTTO, inscrito no CNPJ 63.317.375/0001-08, com sede na Rua do Ouvidor,
          313, sala 5, e contato através do e-mail{" "}
          <a href="mailto:atendimento@custto.com.br" className="underline">
            atendimento@custto.com.br
          </a>
          .
        </p>
        <p>
          Ao criar uma conta e usar o CUSTTO, você concorda com estes Termos de Uso e com a{" "}
          <Link href="/politica-de-privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection number={2} title="O que o serviço faz">
        <p>
          O CUSTTO permite que você cadastre custos, insumos e receitas do seu negócio para
          calcular preços sugeridos de venda. Os cálculos e sugestões apresentados são baseados
          exclusivamente nas informações que você fornece — o CUSTTO não verifica a exatidão dos
          dados inseridos e não se responsabiliza por decisões comerciais tomadas com base nos
          resultados exibidos. A responsabilidade pela precificação final do seu negócio é sempre
          sua.
        </p>
      </LegalSection>

      <LegalSection number={3} title="Cadastro e conta">
        <LegalList>
          <LegalListItem>Você deve fornecer informações verdadeiras ao criar sua conta.</LegalListItem>
          <LegalListItem>
            Você é responsável por manter a confidencialidade da sua senha e por todas as
            atividades realizadas na sua conta.
          </LegalListItem>
          <LegalListItem>
            É proibido compartilhar sua conta com terceiros fora do seu negócio.
          </LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection number={4} title="Período de teste e assinatura">
        <LegalList>
          <LegalListItem>Novos usuários têm direito a 7 dias de teste gratuito.</LegalListItem>
          <LegalListItem>
            Após o período de teste, o uso continuado do CUSTTO está condicionado ao pagamento da
            assinatura mensal vigente, cobrada automaticamente via cartão de crédito através do
            Stripe.
          </LegalListItem>
          <LegalListItem>
            Você pode cancelar sua assinatura a qualquer momento, diretamente pelo painel do
            CUSTTO. O cancelamento interrompe cobranças futuras, mas não gera reembolso
            proporcional do período já pago, salvo os casos previstos em lei (veja seção 5).
          </LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection number={5} title="Cancelamento e reembolso">
        <LegalList>
          <LegalListItem>
            Conforme o Código de Defesa do Consumidor (Art. 49), você tem direito de se arrepender
            da contratação em até 7 dias corridos após a primeira cobrança, caso a contratação
            tenha sido feita fora de estabelecimento comercial físico, com reembolso integral.
          </LegalListItem>
          <LegalListItem>
            Fora esse prazo, cancelamentos interrompem cobranças futuras, sem reembolso do período
            já iniciado.
          </LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection number={6} title="Uso aceitável">
        <p>Você concorda em não:</p>
        <LegalList>
          <LegalListItem>Usar o CUSTTO para fins ilegais;</LegalListItem>
          <LegalListItem>Tentar acessar dados de outros usuários;</LegalListItem>
          <LegalListItem>
            Realizar engenharia reversa, copiar ou revender a plataforma sem autorização.
          </LegalListItem>
        </LegalList>
      </LegalSection>

      <LegalSection number={7} title="Limitação de responsabilidade">
        <p>
          O CUSTTO é fornecido &ldquo;como está&rdquo;. Não garantimos que o serviço estará livre
          de interrupções ou erros. Não nos responsabilizamos por perdas financeiras decorrentes
          do uso das sugestões de preço geradas pela ferramenta — a decisão final de precificação
          é sempre do usuário.
        </p>
      </LegalSection>

      <LegalSection number={8} title="Alterações nestes termos">
        <p>
          Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão comunicadas por
          e-mail ou aviso dentro da plataforma.
        </p>
      </LegalSection>

      <LegalSection number={9} title="Contato">
        <p>
          Dúvidas sobre estes termos:{" "}
          <a href="mailto:atendimento@custto.com.br" className="underline">
            atendimento@custto.com.br
          </a>{" "}
          ou pelo WhatsApp de suporte disponível na plataforma.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
