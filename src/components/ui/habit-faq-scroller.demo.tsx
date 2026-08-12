import FaqSection, { type FaqSectionData } from "@/components/ui/habit-faq-scroller";

/**
 * Demo com o conteúdo real de FAQ do CUSTTO (mesmas perguntas já usadas na
 * landing page hoje), só pra visualizar o componente — não é o conteúdo
 * final de nenhuma tela.
 */
export default function HabitFaqScrollerDemo() {
  const faqData: FaqSectionData = {
    mainTitle: "Perguntas frequentes",
    mainSubtitle: "Ainda com dúvidas? Separamos as que mais recebemos sobre o CUSTTO.",
    rows: [
      {
        id: "row1",
        speed: "60s",
        direction: "left",
        faqItems: [
          {
            id: "q1",
            question: "Preciso saber usar planilha?",
            answer:
              "Não. O CUSTTO substitui a planilha: você só cadastra os números uma vez e o sistema calcula tudo sozinho, sempre que você mexer em custo, insumo ou receita.",
          },
          {
            id: "q2",
            question: "Funciona pro meu tipo de negócio?",
            answer:
              "Funciona pra qualquer restaurante ou operação de delivery que venda pratos com ingredientes — hamburgueria, marmitaria, pizzaria, confeitaria, esfiharia, entre outros.",
          },
        ],
      },
      {
        id: "row2",
        speed: "45s",
        direction: "right",
        faqItems: [
          {
            id: "q3",
            question: "Existe plano grátis?",
            answer:
              "Sim. O plano Gratuito não expira e não pede cartão de crédito — você cadastra até 2 receitas pra já sentir o CUSTTO calculando o preço certo.",
          },
          {
            id: "q4",
            question: "Posso cancelar quando quiser?",
            answer: "Sim, direto pela sua conta, sem multa e sem precisar falar com ninguém.",
          },
        ],
      },
      {
        id: "row3",
        speed: "70s",
        direction: "left",
        faqItems: [
          {
            id: "q5",
            question: "Preciso instalar alguma coisa?",
            answer: "Não. O CUSTTO funciona direto no navegador, no computador ou no celular.",
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <FaqSection data={faqData} />
    </div>
  );
}
