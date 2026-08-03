-- Faturamento mensal (base para avg_monthly_revenue calculado automaticamente)

create table monthly_revenue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  year integer not null,
  month integer not null check (month between 1 and 12),
  value numeric not null check (value >= 0),
  updated_at timestamptz default now()
);

create unique index monthly_revenue_user_year_month_idx on monthly_revenue(user_id, year, month);

alter table monthly_revenue enable row level security;

create policy "monthly_revenue: select own" on monthly_revenue
  for select using (auth.uid() = user_id);
create policy "monthly_revenue: insert own" on monthly_revenue
  for insert with check (auth.uid() = user_id);
create policy "monthly_revenue: update own" on monthly_revenue
  for update using (auth.uid() = user_id);
create policy "monthly_revenue: delete own" on monthly_revenue
  for delete using (auth.uid() = user_id);
