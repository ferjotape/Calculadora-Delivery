-- Custo Motoboy: nº de pedidos e valor da entrega grátis bancada pelo restaurante

create table delivery_cost_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  monthly_orders integer default 0,
  delivery_value numeric default 0,
  updated_at timestamptz default now()
);

create unique index delivery_cost_settings_user_id_idx on delivery_cost_settings(user_id);

alter table delivery_cost_settings enable row level security;

create policy "delivery_cost_settings: select own" on delivery_cost_settings
  for select using (auth.uid() = user_id);
create policy "delivery_cost_settings: insert own" on delivery_cost_settings
  for insert with check (auth.uid() = user_id);
create policy "delivery_cost_settings: update own" on delivery_cost_settings
  for update using (auth.uid() = user_id);
create policy "delivery_cost_settings: delete own" on delivery_cost_settings
  for delete using (auth.uid() = user_id);
