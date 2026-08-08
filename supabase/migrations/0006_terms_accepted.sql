-- Registro do aceite dos Termos de Uso / Política de Privacidade no cadastro

alter table profiles add column terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, restaurant_name, email, terms_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'restaurant_name',
    new.email,
    (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
  );
  return new;
end;
$$;
