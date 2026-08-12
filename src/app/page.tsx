import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { FaqCarousel } from "@/components/FaqCarousel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatCurrency } from "@/lib/format";
import { PLANS } from "@/lib/stripe/plan";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5521999982983";
const WHATSAPP_MESSAGE = "Olá, quero tirar dúvidas sobre o CUSTTO";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const title = "CUSTTO — Descubra se seu prato tá dando prejuízo";
const description =
  "Pare de precificar no chute. O CUSTTO calcula o preço ideal de cada prato do seu delivery — com custo de insumo, taxa de plataforma (iFood, 99Food, Keeta) e desconto considerados automaticamente. Comece grátis, sem cartão de crédito.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main>
        <Hero />
        <PainSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
      <WhatsAppFloatingButton />
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6">
      <Logo markClassName="h-7 w-7" textClassName="text-lg" />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/login"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="hero-fade-up text-3xl leading-tight sm:text-5xl">
          Descubra se seu prato <span className="text-accent">tá dando prejuízo.</span>
        </h1>
        <p
          className="hero-fade-up max-w-xl text-base text-neutral-600 sm:text-lg dark:text-neutral-300"
          style={{ animationDelay: "90ms" }}
        >
          Some seus custos, insumos e taxas de cada plataforma de delivery — e receba o preço
          certo pra cada prato do seu cardápio, sem chute e sem planilha.
        </p>

        <div
          className="hero-fade-up flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            href="/signup"
            className="rounded-md bg-accent px-6 py-3 text-center text-base font-medium text-white transition-colors hover:bg-accent-active"
          >
            Começar grátis
          </Link>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-md border border-neutral-300 px-6 py-3 text-center text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          >
            <WhatsAppIcon className="h-5 w-5 shrink-0" />
            Tirar dúvidas
          </a>
        </div>

        <p className="hero-fade-up text-xs text-neutral-400" style={{ animationDelay: "260ms" }}>
          Plano Gratuito pra sempre · Sem cartão de crédito
        </p>
      </div>
    </section>
  );
}

const PAIN_POINTS = [
  {
    title: "Você não sabe se tá tendo lucro de verdade",
    description:
      "Sem separar custo fixo, custo variável e taxa de plataforma, é impossível saber quanto sobra de cada venda — só no fim do mês, quando já é tarde.",
  },
  {
    title: "Preço copiado do concorrente, sem considerar seus custos",
    description:
      "O prato do vizinho pode ter aluguel, insumo e estrutura completamente diferentes da sua. Copiar o preço é copiar o prejuízo dele.",
  },
  {
    title: "A taxa da plataforma come sua margem sem perceber",
    description:
      "iFood, 99Food, Keeta... cada uma cobra um percentual diferente. Se o preço não for ajustado por plataforma, a conta não fecha.",
  },
];

function PainSection() {
  return (
    <section className="bg-neutral-100 px-4 py-14 sm:px-6 sm:py-20 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <Reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-accent">O problema</p>
          <h2 className="mt-2 text-2xl sm:text-3xl">Precificar no olho sai caro</h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PAIN_POINTS.map((pain, index) => (
            <Reveal key={pain.title} delayMs={index * 80}>
              <div className="flex h-full flex-col gap-2 rounded-md border border-neutral-300 bg-background p-5 dark:border-neutral-700">
                <h3 className="font-medium">{pain.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {pain.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Cadastre seus custos",
    description: "Custos fixos, variáveis e o lucro que você quer ter em cada venda.",
    imageSrc: "/landing/custos-preview.png",
    imageAlt: "Tela de Configurações de Custos do CUSTTO, com custos fixos, variáveis e markup ideal",
  },
  {
    title: "Calcule o custo do motoboy",
    description:
      "Ticket médio e custo da entrega grátis calculados a partir do seu faturamento e do número de pedidos do mês.",
    imageSrc: "/landing/custo-motoboy-preview.png",
    imageAlt: "Tela de Custo Motoboy do CUSTTO, com ticket médio e percentual de custo da entrega grátis",
  },
  {
    title: "Cadastre seus insumos",
    description: "Preço pago, volume comprado e fator de correção — o custo unitário sai sozinho.",
    imageSrc: "/landing/insumos-preview.png",
    imageAlt: "Tela de Insumos do CUSTTO com a lista de ingredientes cadastrados e o custo unitário calculado",
  },
  {
    title: "Monte suas receitas",
    description: "Some os insumos de cada prato e o sistema calcula o custo total automaticamente.",
    imageSrc: "/landing/receitas-preview.png",
    imageAlt: "Tela de Receitas do CUSTTO com a lista de pratos cadastrados e o custo de cada um",
  },
  {
    title: "Configure suas plataformas",
    description:
      "Taxa de cada plataforma de delivery (iFood, 99Food, Keeta e outras) pra ajustar o preço automaticamente.",
    imageSrc: "/landing/plataformas-preview.png",
    imageAlt: "Tela de Plataformas do CUSTTO com as taxas de cada plataforma de delivery cadastrada",
  },
  {
    title: "Veja tudo no dashboard",
    description:
      "Preço sugerido, por plataforma de delivery, com desconto e cupom simulados — tudo centralizado.",
    imageSrc: "/landing/dashboard-preview.png",
    imageAlt:
      "Dashboard do CUSTTO mostrando receitas cadastradas, custos totais, markup atual e o preço de cada prato",
  },
];

/**
 * Se o print ainda não foi enviado pro /public, mostra um placeholder com as
 * mesmas dimensões em vez de deixar o next/image quebrado — assim que o
 * arquivo for adicionado em /public/landing com o nome certo, o próximo
 * build já passa a exibir a imagem real, sem precisar mexer no código.
 */
function StepScreenshot({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  const fileExists = fs.existsSync(path.join(process.cwd(), "public", src));

  if (!fileExists) {
    return (
      <div
        role="img"
        aria-label={`Espaço reservado para o print da tela: ${label}`}
        className="flex aspect-[800/482] w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 text-center text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
      >
        Print: {label}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-700">
      <Image
        src={src}
        alt={alt}
        width={800}
        height={482}
        sizes="(min-width: 640px) 440px, 100vw"
        className="w-full"
      />
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <Reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-accent">Como funciona</p>
          <h2 className="mt-2 text-2xl sm:text-3xl">
            Do custo ao preço certo em {STEPS.length} passos
          </h2>
        </Reveal>

        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <Reveal
              key={step.title}
              as="li"
              delayMs={index * 80}
              className="flex flex-col gap-4 rounded-md border border-neutral-300 p-5 dark:border-neutral-700"
            >
              <div className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 font-mono text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {step.description}
                  </p>
                </div>
              </div>

              <StepScreenshot src={step.imageSrc} alt={step.imageAlt} label={step.title} />
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="bg-neutral-100 px-4 py-14 sm:px-6 sm:py-20 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-accent">Preço</p>
          <h2 className="mt-2 text-2xl sm:text-3xl">Comece grátis. Cresça quando precisar.</h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, index) => {
            const isFeatured = plan.id === "profissional";
            const priceLabel =
              plan.priceCents === 0 ? "Grátis" : formatCurrency(plan.priceCents / 100);

            return (
              <Reveal key={plan.id} delayMs={index * 60}>
                <div
                  className={`flex h-full flex-col gap-4 rounded-xl border bg-background p-6 ${
                    isFeatured
                      ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
                      : "border-neutral-300 dark:border-neutral-700"
                  }`}
                >
                  {isFeatured && (
                    <span className="w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
                      Mais popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-lg font-medium">{plan.name}</h3>
                    <p className="mt-1 font-mono text-3xl font-semibold">
                      {priceLabel}
                      {plan.priceCents > 0 && (
                        <span className="text-base font-normal text-neutral-500">/mês</span>
                      )}
                    </p>
                  </div>

                  <ul className="flex flex-1 flex-col gap-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        {plan.recipeLimit === null
                          ? "Receitas ilimitadas"
                          : `Até ${plan.recipeLimit} receita${plan.recipeLimit === 1 ? "" : "s"}`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>Preço ajustado por plataforma (iFood, 99Food, Keeta e outras)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>Indicador de markup e margem em tempo real</span>
                    </li>
                    {plan.hasCombos && (
                      <li className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span className="flex flex-wrap items-center gap-1.5">
                          Aba de Combos
                          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            Em breve
                          </span>
                        </span>
                      </li>
                    )}
                  </ul>

                  <Link
                    href="/signup"
                    className={
                      isFeatured
                        ? "rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-accent-active"
                        : "rounded-md border border-neutral-300 px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
                    }
                  >
                    {plan.id === "gratuito" ? "Começar grátis" : "Assinar"}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    question: "Preciso saber usar planilha?",
    answer:
      "Não. O CUSTTO substitui a planilha: você só cadastra os números uma vez e o sistema calcula tudo sozinho, sempre que você mexer em custo, insumo ou receita.",
  },
  {
    question: "Funciona pro meu tipo de negócio?",
    answer:
      "Funciona pra qualquer restaurante ou operação de delivery que venda pratos com ingredientes — hamburgueria, marmitaria, pizzaria, confeitaria, esfiharia, entre outros.",
  },
  {
    question: "Existe plano grátis?",
    answer:
      "Sim. O plano Gratuito não expira e não pede cartão de crédito — você cadastra até 2 receitas pra já sentir o CUSTTO calculando o preço certo. Quando precisar de mais, é só fazer upgrade.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim, direto pela sua conta, sem multa e sem precisar falar com ninguém.",
  },
  {
    question: "Preciso instalar alguma coisa?",
    answer: "Não. O CUSTTO funciona direto no navegador, no computador ou no celular.",
  },
];

function FaqSection() {
  const items = FAQ_ITEMS.map((item, index) => ({ id: `faq-${index}`, ...item }));

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <Reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-accent">Dúvidas</p>
          <h2 className="mt-2 text-2xl sm:text-3xl">Perguntas frequentes</h2>
        </Reveal>

        <Reveal delayMs={80}>
          <FaqCarousel items={items} />
        </Reveal>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="bg-neutral-900 px-4 py-14 text-white sm:px-6 sm:py-20">
      <Reveal className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <h2 className="text-2xl sm:text-3xl">Pare de perder dinheiro em cada prato.</h2>
        <p className="text-neutral-300">
          Comece grátis, sem cartão de crédito, e descubra o preço certo do seu cardápio hoje
          mesmo.
        </p>
        <Link
          href="/signup"
          className="rounded-md bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent-active"
        >
          Começar grátis
        </Link>
      </Reveal>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="flex flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
      <Logo markClassName="h-6 w-6" textClassName="text-base" />
      <p className="text-sm text-neutral-500">
        Ainda com dúvidas?{" "}
        <a
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-neutral-900 underline dark:text-white"
        >
          Fale com a gente
        </a>
      </p>
      <p className="text-xs text-neutral-400">
        <Link href="/termos-de-uso" className="hover:underline">
          Termos de Uso
        </Link>{" "}
        ·{" "}
        <Link href="/politica-de-privacidade" className="hover:underline">
          Política de Privacidade
        </Link>
      </p>
      <p className="text-xs text-neutral-400">© {new Date().getFullYear()} CUSTTO</p>
    </footer>
  );
}

function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="whatsapp-pulse fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.35a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.83 14.06c-.24.68-1.4 1.32-1.94 1.4-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.61-2.91-1.26-4.8-4.19-4.95-4.38-.15-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.28.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.81 2 .88 2.14.07.15.12.32.02.51-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.12.99 2.05 1.3 2.34 1.45.29.15.46.13.63-.05.17-.19.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.68.79 1.97.94.29.14.48.21.55.33.07.13.07.72-.17 1.4Z" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 10.5L8 14.5L16 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
