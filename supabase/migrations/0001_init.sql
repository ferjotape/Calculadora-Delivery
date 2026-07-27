-- Precificação Delivery - schema inicial
-- Usuários e assinatura já vêm do Supabase Auth + (futura) tabela de billing (Stripe)

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_name text,
  created_at timestamptz default now()
);

-- === Configurações de custo (aba INÍCIO) ===
create table cost_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  -- custos fixos (lista dinâmica: nome + valor)
  fixed_costs jsonb default '[]', -- [{name: "Aluguel", value: 1500}, ...]
  -- custos variáveis
  card_fee_pct numeric default 0,      -- taxa de cartão
  packaging_pct numeric default 0,     -- embalagem
  free_delivery_pct numeric default 0, -- entrega grátis
  -- markup
  desired_profit_pct numeric default 0,
  avg_monthly_revenue numeric,         -- usado p/ estimar markup se não tiver histórico
  updated_at timestamptz default now()
);

-- === Plataformas de delivery (multi-plataforma) ===
create table delivery_platforms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  name text not null,          -- "iFood", "99Food", "Keeta", "Próprio"
  fee_pct numeric not null,    -- taxa da plataforma
  is_active boolean default true
);

-- === Cadastro de Insumos (banco único reutilizável) ===
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  code integer,                 -- código sequencial (compatibilidade com planilha)
  name text not null,
  price_paid numeric not null,       -- R$ pago
  purchase_volume numeric not null,  -- volume do item comprado
  unit text not null,                -- kg, g, l, ml, un
  correction_factor numeric default 1.0, -- FAT.C (perda/quebra do insumo)
  unit_cost numeric generated always as
    (price_paid / nullif(purchase_volume,0) * correction_factor) stored,
  created_at timestamptz default now()
);

-- === Receitas (pratos) ===
create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  name text not null,
  loss_pct numeric default 0,     -- %perda da receita
  discount_pct numeric default 0, -- promoção/desconto
  practiced_price numeric,        -- preço praticado manualmente (opcional)
  created_at timestamptz default now()
);

-- === Ingredientes usados em cada receita ===
create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  ingredient_id uuid references ingredients(id),
  quantity_used numeric not null  -- quantidade líquida usada na receita
  -- custo total = quantity_used * ingredient.unit_cost (calculado na aplicação)
);

-- === Preço calculado por receita x plataforma (cache dos resultados) ===
create table recipe_platform_prices (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  platform_id uuid references delivery_platforms(id),
  suggested_price numeric,
  price_with_discount numeric,
  profit_pct numeric,
  profit_value numeric,
  cmv_pct numeric,
  calculated_at timestamptz default now()
);

-- =========================================================
-- Índices
-- =========================================================
-- um usuário tem no máximo uma configuração de custos (upsert por user_id)
create unique index cost_settings_user_id_idx on cost_settings(user_id);
create index delivery_platforms_user_id_idx on delivery_platforms(user_id);
create index ingredients_user_id_idx on ingredients(user_id);
create index recipes_user_id_idx on recipes(user_id);
create index recipe_ingredients_recipe_id_idx on recipe_ingredients(recipe_id);
create index recipe_ingredients_ingredient_id_idx on recipe_ingredients(ingredient_id);
create index recipe_platform_prices_recipe_id_idx on recipe_platform_prices(recipe_id);
create index recipe_platform_prices_platform_id_idx on recipe_platform_prices(platform_id);

-- =========================================================
-- Row Level Security: cada usuário só acessa seus próprios dados
-- =========================================================
alter table profiles enable row level security;
alter table cost_settings enable row level security;
alter table delivery_platforms enable row level security;
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_platform_prices enable row level security;

create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

create policy "cost_settings: select own" on cost_settings
  for select using (auth.uid() = user_id);
create policy "cost_settings: insert own" on cost_settings
  for insert with check (auth.uid() = user_id);
create policy "cost_settings: update own" on cost_settings
  for update using (auth.uid() = user_id);
create policy "cost_settings: delete own" on cost_settings
  for delete using (auth.uid() = user_id);

create policy "delivery_platforms: select own" on delivery_platforms
  for select using (auth.uid() = user_id);
create policy "delivery_platforms: insert own" on delivery_platforms
  for insert with check (auth.uid() = user_id);
create policy "delivery_platforms: update own" on delivery_platforms
  for update using (auth.uid() = user_id);
create policy "delivery_platforms: delete own" on delivery_platforms
  for delete using (auth.uid() = user_id);

create policy "ingredients: select own" on ingredients
  for select using (auth.uid() = user_id);
create policy "ingredients: insert own" on ingredients
  for insert with check (auth.uid() = user_id);
create policy "ingredients: update own" on ingredients
  for update using (auth.uid() = user_id);
create policy "ingredients: delete own" on ingredients
  for delete using (auth.uid() = user_id);

create policy "recipes: select own" on recipes
  for select using (auth.uid() = user_id);
create policy "recipes: insert own" on recipes
  for insert with check (auth.uid() = user_id);
create policy "recipes: update own" on recipes
  for update using (auth.uid() = user_id);
create policy "recipes: delete own" on recipes
  for delete using (auth.uid() = user_id);

create policy "recipe_ingredients: select own" on recipe_ingredients
  for select using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "recipe_ingredients: insert own" on recipe_ingredients
  for insert with check (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "recipe_ingredients: update own" on recipe_ingredients
  for update using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "recipe_ingredients: delete own" on recipe_ingredients
  for delete using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

create policy "recipe_platform_prices: select own" on recipe_platform_prices
  for select using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "recipe_platform_prices: insert own" on recipe_platform_prices
  for insert with check (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "recipe_platform_prices: update own" on recipe_platform_prices
  for update using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );
create policy "recipe_platform_prices: delete own" on recipe_platform_prices
  for delete using (
    exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid())
  );

-- =========================================================
-- Cria automaticamente um profile ao registrar um novo usuário
-- =========================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, restaurant_name)
  values (new.id, new.raw_user_meta_data ->> 'restaurant_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
