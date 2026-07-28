-- Assinatura paga via Stripe
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'incomplete', -- trialing, active, past_due, canceled, unpaid, incomplete...
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- um usuário tem no máximo uma assinatura (upsert por user_id a partir do webhook)
create unique index subscriptions_user_id_idx on subscriptions(user_id);
create unique index subscriptions_stripe_subscription_id_idx
  on subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;
create index subscriptions_stripe_customer_id_idx on subscriptions(stripe_customer_id);

alter table subscriptions enable row level security;

-- O usuário só pode ler a própria assinatura. Não há policy de insert/update/
-- delete: essa tabela só é gravada pelo webhook do Stripe usando a service
-- role key (que ignora RLS), nunca diretamente pelo usuário autenticado —
-- caso contrário ele poderia forjar o próprio status de assinatura.
create policy "subscriptions: select own" on subscriptions
  for select using (auth.uid() = user_id);
