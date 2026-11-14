-- Display-only signup metadata; permissions still come from the fixed advertiser role.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, roles, name)
  values (
    new.id,
    array['advertiser']::public.app_role[],
    nullif(left(btrim(new.raw_user_meta_data->>'name'), 120), '')
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
