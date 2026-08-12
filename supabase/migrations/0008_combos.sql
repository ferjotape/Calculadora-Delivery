-- Combos: exclusivo do plano Business. Preço/desconto do combo ainda não é
-- calculado (discount_pct existe no schema, sem uso na aplicação por ora).
create table combos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  name text not null,
  discount_pct numeric default 0,
  created_at timestamptz default now()
);

create table combo_recipes (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid references combos(id) on delete cascade,
  recipe_id uuid references recipes(id),
  quantity numeric not null default 1
);

create index combos_user_id_idx on combos(user_id);
create index combo_recipes_combo_id_idx on combo_recipes(combo_id);
create index combo_recipes_recipe_id_idx on combo_recipes(recipe_id);

alter table combos enable row level security;
alter table combo_recipes enable row level security;

create policy "combos: select own" on combos
  for select using (auth.uid() = user_id);
create policy "combos: insert own" on combos
  for insert with check (auth.uid() = user_id);
create policy "combos: update own" on combos
  for update using (auth.uid() = user_id);
create policy "combos: delete own" on combos
  for delete using (auth.uid() = user_id);

create policy "combo_recipes: select own" on combo_recipes
  for select using (
    exists (select 1 from combos c where c.id = combo_id and c.user_id = auth.uid())
  );
create policy "combo_recipes: insert own" on combo_recipes
  for insert with check (
    exists (select 1 from combos c where c.id = combo_id and c.user_id = auth.uid())
  );
create policy "combo_recipes: update own" on combo_recipes
  for update using (
    exists (select 1 from combos c where c.id = combo_id and c.user_id = auth.uid())
  );
create policy "combo_recipes: delete own" on combo_recipes
  for delete using (
    exists (select 1 from combos c where c.id = combo_id and c.user_id = auth.uid())
  );
