-- Catálogo de planos de assinatura. Fonte da verdade para preço/limite de
-- receitas/flags de feature — ajustável via SQL sem precisar de deploy.
create table plans (
  id text primary key,
  name text not null,
  price_cents integer not null,
  recipe_limit integer, -- null = ilimitado
  has_combos boolean not null default false,
  stripe_price_id text,
  display_order integer not null,
  created_at timestamptz default now()
);

insert into plans (id, name, price_cents, recipe_limit, has_combos, stripe_price_id, display_order) values
  ('gratuito', 'Gratuito', 0, 2, false, null, 1),
  ('essencial', 'Essencial', 2990, 5, false, null, 2),
  ('profissional', 'Profissional', 5990, 10, false, null, 3),
  ('business', 'Business', 9990, null, true, null, 4);

alter table plans enable row level security;

-- Dado de referência público (preços/limites da página de assinatura), sem
-- informação sensível — leitura liberada mesmo sem autenticação.
create policy "plans: select all" on plans
  for select using (true);

alter table subscriptions add column plan_id text not null default 'gratuito' references plans(id);
