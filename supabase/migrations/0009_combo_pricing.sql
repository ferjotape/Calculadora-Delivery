-- Precificação por 3 preços (mínimo/recomendado/promocional) do combo.
alter table combos add column safety_margin_type text not null default '10'
  check (safety_margin_type in ('5', '10', 'custom'));
alter table combos add column safety_margin_custom_pct numeric;
alter table combos add column promo_discount_pct numeric not null default 0;
alter table combos add column practiced_price numeric;
