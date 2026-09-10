-- Nº de pedidos deixa de ser um valor solto (delivery_cost_settings.monthly_orders)
-- e passa a ser por mês, junto com o faturamento em monthly_revenue — o Ticket
-- Médio (Custo Motoboy) precisa dividir o faturamento de um mês pelos pedidos
-- do MESMO mês, nunca por uma média de vários meses.

alter table monthly_revenue
  add column orders_count integer check (orders_count >= 0);

-- Migra o valor solto existente pro último mês preenchido de cada usuário,
-- já que era usado como "o número de pedidos atual".
with latest_month as (
  select distinct on (user_id) user_id, year, month
  from monthly_revenue
  order by user_id, year desc, month desc
)
update monthly_revenue mr
set orders_count = dcs.monthly_orders
from delivery_cost_settings dcs
join latest_month lm on lm.user_id = dcs.user_id
where mr.user_id = lm.user_id
  and mr.year = lm.year
  and mr.month = lm.month
  and dcs.monthly_orders > 0;

alter table delivery_cost_settings
  drop column monthly_orders;
