-- Reverte a migração 0010: Nº de pedidos volta a ser um valor único e solto
-- em delivery_cost_settings, em vez de um campo por mês em monthly_revenue.
-- O Ticket Médio passa a usar o faturamento do ÚLTIMO MÊS PREENCHIDO (não
-- mais um mês "completo" pareado com pedidos daquele mês) dividido por esse
-- valor único, atualizado manualmente pelo usuário.

alter table delivery_cost_settings
  add column monthly_orders integer default 0;

-- Preserva o dado já preenchido: usa o orders_count mais recente de cada
-- usuário (mesmo critério "último mês" que a 0010 usou na direção oposta).
with latest_orders as (
  select distinct on (user_id) user_id, orders_count
  from monthly_revenue
  where orders_count is not null
  order by user_id, year desc, month desc
)
update delivery_cost_settings dcs
set monthly_orders = lo.orders_count
from latest_orders lo
where dcs.user_id = lo.user_id;

alter table monthly_revenue
  drop column orders_count;
