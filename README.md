Precifica Delivery — SaaS de precificação de cardápio para restaurantes e delivery.

Stack: Next.js (App Router) + Tailwind CSS + Supabase (Postgres, Auth) + Stripe (assinatura, próxima etapa) + Vercel (deploy).

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
```

3. Aplique o schema do banco. No SQL Editor do Supabase, rode o conteúdo de `supabase/migrations/0001_init.sql` (ou use a Supabase CLI: `supabase db push`).

4. Em Authentication → Providers, garanta que o login por e-mail/senha está habilitado. Se a confirmação de e-mail estiver ativa, configure a Redirect URL para `<sua-url>/auth/callback`.

5. Rode o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Usuários não autenticados são redirecionados para `/login`; após login/cadastro, vão para `/onboarding` (Configurações de Custos).

## Schema do banco

Definido em `supabase/migrations/0001_init.sql`:

- `profiles` — criado automaticamente via trigger quando um usuário se cadastra.
- `cost_settings` — custos fixos (lista dinâmica), custos variáveis (%) e lucro desejado, um registro por usuário.
- `delivery_platforms`, `ingredients`, `recipes`, `recipe_ingredients`, `recipe_platform_prices` — schema já criado para as próximas etapas (cadastro de insumos, receitas e cálculo de preço por plataforma).

Todas as tabelas têm Row Level Security habilitada: cada usuário só enxerga seus próprios dados.

## Deploy

Deploy recomendado na [Vercel](https://vercel.com/new), configurando as mesmas variáveis de ambiente do `.env.local` no projeto.
