-- Área administrativa (/admin): quem pode acessar

alter table profiles add column email text;
alter table profiles add column is_admin boolean not null default false;

-- Backfill do e-mail para quem já tinha se cadastrado antes desta coluna existir.
update profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- A partir de agora, o profile já nasce com o e-mail junto com o restaurant_name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, restaurant_name, email)
  values (new.id, new.raw_user_meta_data ->> 'restaurant_name', new.email);
  return new;
end;
$$;

-- A policy "profiles: update own" deixa o usuário atualizar a própria linha
-- (ex: nome do restaurante) — sem essa trava, ele também poderia se
-- autopromover com `update profiles set is_admin = true where id = auth.uid()`
-- direto pelo client. Este trigger ignora qualquer mudança em is_admin que não
-- venha da service role key (a única forma de conceder acesso de admin).
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and coalesce(current_setting('role', true), '') <> 'service_role' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger protect_is_admin_before_update
  before update on profiles
  for each row execute procedure public.protect_is_admin();
