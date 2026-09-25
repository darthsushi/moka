-- Privileged staff accounts cannot also be placement owners or advertisers.
-- Preserve the advertiser requirement for ordinary accounts.
do $guard$
begin
  if exists (
    select 1
    from public.placements pl
    join public.profiles p on p.id = pl.user_id
    where p.roles && array['admin', 'moderator']::public.app_role[]
  ) then
    raise exception 'Transfer staff placements to an owner before changing staff roles';
  end if;
end;
$guard$;

alter table public.profiles
  drop constraint profiles_roles_require_advertiser;

update public.profiles
set roles = array['admin', 'moderator']::public.app_role[]
where 'admin'::public.app_role = any(roles);

update public.profiles
set roles = array['moderator']::public.app_role[]
where 'moderator'::public.app_role = any(roles)
  and not ('admin'::public.app_role = any(roles));

alter table public.profiles
  add constraint profiles_roles_by_access_scope check (
    case
      when 'admin'::public.app_role = any(roles) then
        roles @> array['admin', 'moderator']::public.app_role[]
        and roles <@ array['admin', 'moderator']::public.app_role[]
        and cardinality(roles) = 2
      when 'moderator'::public.app_role = any(roles) then
        roles = array['moderator']::public.app_role[]
      else
        roles @> array['advertiser']::public.app_role[]
    end
  );
