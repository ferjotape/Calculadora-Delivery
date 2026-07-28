Precifica Delivery — SaaS de precificação de cardápio para restaurantes e delivery.

Stack: Next.js (App Router) + Tailwind CSS + Supabase (Postgres, Auth) + Stripe (assinatura) + Vercel (deploy).

## Setup

1. Instale as dependências:

```bash
npm install
```

2. Crie um projeto no [Supabase](https://supabase.com) e copie `.env.local.example` para `.env.local`, preenchendo com as credenciais do projeto (Project Settings → API):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

A `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → service_role) é usada **apenas** pelo webhook do Stripe, no servidor, para gravar o status da assinatura ignorando RLS. Nunca a exponha no client.

3. Aplique o schema do banco. No SQL Editor do Supabase, rode o conteúdo de `supabase/migrations/0001_init.sql` e depois `supabase/migrations/0002_subscriptions.sql` (ou use a Supabase CLI: `supabase db push`).

4. Em Authentication → Providers, garanta que o login por e-mail/senha está habilitado. Se a confirmação de e-mail estiver ativa, configure a Redirect URL para `<sua-url>/auth/callback`.

5. Configure o Stripe:
   - Crie uma conta em [stripe.com](https://stripe.com) e pegue a chave secreta (modo teste) em Developers → API keys → `STRIPE_SECRET_KEY`.
   - Não é necessário criar um Produto/Preço manualmente: o preço (R$ 149,90/mês, 7 dias de teste grátis) é criado dinamicamente a cada checkout — veja `src/lib/stripe/plan.ts`.
   - Configure um webhook (Developers → Webhooks) apontando para `<sua-url>/api/stripe/webhook`, escutando pelo menos os eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`. Copie o "Signing secret" para `STRIPE_WEBHOOK_SECRET`.
   - Em desenvolvimento local, use o [Stripe CLI](https://docs.stripe.com/stripe-cli) para encaminhar eventos: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (o comando imprime um signing secret temporário para usar em `STRIPE_WEBHOOK_SECRET` local).
   - Defina `NEXT_PUBLIC_SITE_URL` com a URL pública do app (usada nas URLs de retorno do Checkout).

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

6. Rode o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Usuários não autenticados são redirecionados para `/login`; após login/cadastro, vão para `/dashboard` — que exige assinatura ativa (ou período de teste), redirecionando para `/billing` caso contrário.

## Schema do banco

- `supabase/migrations/0001_init.sql`:
  - `profiles` — criado automaticamente via trigger quando um usuário se cadastra.
  - `cost_settings` — custos fixos (lista dinâmica), custos variáveis (%) e lucro desejado, um registro por usuário.
  - `delivery_platforms`, `ingredients`, `recipes`, `recipe_ingredients`, `recipe_platform_prices`.
- `supabase/migrations/0002_subscriptions.sql`:
  - `subscriptions` — status da assinatura Stripe por usuário (`status`, `current_period_end`), atualizado exclusivamente pelo webhook via service role. O usuário só tem permissão de leitura sobre a própria linha.

Todas as tabelas têm Row Level Security habilitada: cada usuário só enxerga (e, quando aplicável, edita) seus próprios dados.

## Assinatura

- Plano único mensal de R$ 149,90 com 7 dias de teste grátis (`src/lib/stripe/plan.ts`).
- `/billing` ("Minha assinatura") mostra status e data de renovação, e permite iniciar o checkout do Stripe.
- `/dashboard`, `/onboarding/ingredients` e `/onboarding/recipes` (lista e detalhe) exigem assinatura ativa/em teste — sem isso, o usuário é redirecionado para `/billing`.
- `/onboarding` (Configurações de Custos) e `/onboarding/platforms` permanecem acessíveis mesmo sem assinatura ativa.

## Deploy

Deploy recomendado na [Vercel](https://vercel.com/new), configurando as mesmas variáveis de ambiente do `.env.local` no projeto (incluindo `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `NEXT_PUBLIC_SITE_URL` apontando para o domínio de produção).
