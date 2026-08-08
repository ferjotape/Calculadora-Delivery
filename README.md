CUSTTO — SaaS de precificação de cardápio para restaurantes e delivery.

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
   - Não é necessário criar um Produto/Preço manualmente: o preço (R$ 89,90/mês, 7 dias de teste grátis) é criado dinamicamente a cada checkout — veja `src/lib/stripe/plan.ts`.
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

- Plano único mensal de R$ 89,90 com 7 dias de teste grátis (`src/lib/stripe/plan.ts`).
- `/billing` ("Minha assinatura") mostra status e data de renovação, e permite iniciar o checkout do Stripe.
- `/dashboard`, `/onboarding/ingredients` e `/onboarding/recipes` (lista e detalhe) exigem assinatura ativa/em teste — sem isso, o usuário é redirecionado para `/billing`.
- `/onboarding` (Configurações de Custos) e `/onboarding/platforms` permanecem acessíveis mesmo sem assinatura ativa.

## Deploy no Vercel

> Estes passos são feitos no painel do Vercel/Stripe/Supabase — precisam ser
> executados por quem tem acesso a essas contas.

1. **Importar o repositório**: em [vercel.com/new](https://vercel.com/new), conecte sua conta do GitHub e importe este repositório. O Vercel detecta automaticamente que é um projeto Next.js — não é necessário configurar build command, output directory ou root directory manualmente.

2. **Configurar as variáveis de ambiente**: em Project Settings → Environment Variables, adicione (para os ambientes Production e Preview):

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/public key do Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key do Supabase (secreta) |
   | `STRIPE_SECRET_KEY` | chave secreta do Stripe (comece com a de teste, troque para live quando for cobrar de verdade) |
   | `STRIPE_WEBHOOK_SECRET` | signing secret do webhook (veja o passo 4) |
   | `NEXT_PUBLIC_SITE_URL` | URL de produção do app, ex: `https://seu-app.vercel.app` ou seu domínio próprio |

3. **Primeiro deploy**: clique em Deploy. O Vercel builda e publica; anote a URL gerada (ou configure seu domínio próprio em Project Settings → Domains) — é o valor que vai em `NEXT_PUBLIC_SITE_URL`.

4. **Webhook do Stripe apontando para produção**: no Dashboard do Stripe (Developers → Webhooks), crie (ou edite) o endpoint para `https://<sua-url>/api/stripe/webhook`, com os eventos `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted`. Copie o novo "Signing secret" e atualize `STRIPE_WEBHOOK_SECRET` no Vercel (é diferente do secret usado em desenvolvimento local com o Stripe CLI). Depois de trocar uma env var, é preciso fazer um novo deploy (ou "Redeploy") para ela valer.

5. **Redirect URL do Supabase Auth**: em Authentication → URL Configuration no Supabase, adicione a URL de produção (`https://<sua-url>/auth/callback`) às Redirect URLs permitidas — senão a confirmação de e-mail (se habilitada) redireciona para o lugar errado.

6. **Confirmar as variáveis**: em Project Settings → Environment Variables, revise se as 6 variáveis acima estão presentes, sem espaços/aspas extras, e no ambiente certo (Production). Um jeito rápido de checar em runtime: se `/billing` carregar sem erro 500 e mostrar "Sem assinatura", as chaves do Supabase e do Stripe estão minimamente funcionais.

## Checklist de teste do fluxo completo

Depois do deploy, com o Stripe em modo teste (cartão `4242 4242 4242 4242`, qualquer data futura/CVC), valide o fluxo do zero:

- [ ] **Cadastro**: `/signup` com um e-mail novo → redireciona para `/dashboard`.
- [ ] **Bloqueio por assinatura**: sem assinatura ainda, `/dashboard` deve redirecionar para `/billing`.
- [ ] **Checkout**: em `/billing`, clicar em "Assinar" → completar o Checkout do Stripe (modo teste) → volta para `/billing?success=1`.
- [ ] **Liberação de acesso**: em poucos segundos (após o webhook processar), o status em `/billing` muda para "Em teste grátis" e `/dashboard` passa a carregar normalmente.
- [ ] **Onboarding**: em `/onboarding`, preencher custos fixos/variáveis/lucro desejado e salvar.
- [ ] **Plataformas**: em `/onboarding/platforms`, cadastrar ao menos uma plataforma ativa (ex: iFood, 20%).
- [ ] **Insumos**: em `/onboarding/ingredients`, cadastrar 2-3 insumos.
- [ ] **Receita**: em `/onboarding/recipes`, criar uma receita, adicionar os insumos com quantidade e conferir o custo total.
- [ ] **Preço**: na receita, conferir preço sugerido, lucro aproximado, preço por plataforma e o efeito de preencher desconto/preço praticado.
- [ ] **Dashboard**: voltar ao `/dashboard` e conferir se a receita aparece com os números certos e se o resumo (total, lucro médio, abaixo do ideal) bate.
- [ ] **Webhook em produção**: no Dashboard do Stripe → Webhooks → seu endpoint, conferir se os eventos do teste acima aparecem como entregues com sucesso (200).
- [ ] **Cancelamento** (opcional): cancelar a assinatura de teste no Stripe e confirmar que, após o webhook atualizar o status, `/dashboard` volta a redirecionar para `/billing`.
