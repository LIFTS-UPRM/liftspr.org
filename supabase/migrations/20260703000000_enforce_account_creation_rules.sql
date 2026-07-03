create table if not exists public.signup_allowed_networks (
  id bigserial primary key,
  cidr cidr not null unique,
  note text,
  created_at timestamptz not null default now()
);

grant select on table public.signup_allowed_networks to supabase_auth_admin;
revoke all on table public.signup_allowed_networks from authenticated, anon, public;
alter table public.signup_allowed_networks enable row level security;

create or replace function public.hook_restrict_account_creation(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  email text := lower(coalesce(event->'user'->>'email', ''));
  domain text := split_part(email, '@', 2);
  ip inet := nullif(event->'metadata'->>'ip_address', '')::inet;
begin
  if domain <> 'upr.edu' and domain not like '%.upr.edu' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Not able to create account. Use a UPR email ending in @upr.edu.'
      )
    );
  end if;

  if ip is null or not exists (
    select 1
    from public.signup_allowed_networks allowed
    where ip << allowed.cidr
  ) then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Not able to create account. Account creation is only available from Puerto Rico.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.hook_restrict_account_creation(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_restrict_account_creation(jsonb) from authenticated, anon, public;
