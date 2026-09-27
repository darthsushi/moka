-- Split owner availability from MOKA approval. No booking table exists yet:
-- withdrawing hides a placement immediately and retains its faces and history.
create type public.placement_owner_status as enum ('active', 'paused', 'withdrawn');
create type public.placement_review_status as enum
  ('draft', 'pending', 'in_review', 'approved', 'suspended', 'rejected');

alter table public.placements
  add column owner_status public.placement_owner_status not null default 'active',
  add column review_status public.placement_review_status not null default 'draft';

update public.placements
set owner_status = case status
    when 'paused' then 'paused'::public.placement_owner_status
    when 'deleted' then 'withdrawn'::public.placement_owner_status
    else 'active'::public.placement_owner_status
  end,
  review_status = case status
    when 'active' then 'approved'::public.placement_review_status
    when 'pending' then 'pending'::public.placement_review_status
    when 'suspended' then 'suspended'::public.placement_review_status
    when 'paused' then 'approved'::public.placement_review_status
    when 'deleted' then 'approved'::public.placement_review_status
    else 'draft'::public.placement_review_status
  end;

-- Review is controlled by admin/moderator. Owner availability is controlled by
-- the owner (admin may restore a withdrawn record into review).
create function private.guard_placement_state_changes()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_team boolean;
  v_admin boolean;
  v_owner boolean;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  v_team := coalesce((select private.user_has_any_role(
    array['admin'::public.app_role, 'moderator'::public.app_role]
  )), false);
  v_admin := coalesce((select private.user_has_any_role(
    array['admin'::public.app_role]
  )), false);

  if tg_op = 'INSERT' then
    if not v_team and (
      new.owner_status <> 'active'::public.placement_owner_status
      or new.review_status not in (
        'draft'::public.placement_review_status,
        'pending'::public.placement_review_status
      )
    ) then
      raise exception 'Only the review team may set an initial approval state'
        using errcode = '42501';
    end if;
    return new;
  end if;

  v_owner := old.user_id = (select auth.uid());

  if new.user_id is distinct from old.user_id then
    raise exception 'Placement ownership cannot be changed'
      using errcode = '42501';
  end if;

  if new.owner_status is distinct from old.owner_status then
    if not v_owner and not v_admin then
      raise exception 'Only the owner can change availability'
        using errcode = '42501';
    end if;
    if old.owner_status = 'withdrawn'::public.placement_owner_status
       and not v_admin then
      raise exception 'A withdrawn placement requires an admin to restore it'
        using errcode = '42501';
    end if;
    if old.owner_status = 'withdrawn'::public.placement_owner_status
       and new.owner_status <> 'withdrawn'::public.placement_owner_status
       and new.review_status not in (
         'draft'::public.placement_review_status,
         'pending'::public.placement_review_status
       ) then
      raise exception 'A restored placement must return to review'
        using errcode = '23514';
    end if;
  end if;

  -- Significant edits to an approved placement require a new review.
  if not v_team
     and old.review_status = 'approved'::public.placement_review_status
     and new.review_status = old.review_status
     and (
       new.type, new.latitude, new.longitude,
       new.structure_height, new.description, new.location,
       new.country, new.state, new.city, new.display_name
     ) is distinct from (
       old.type, old.latitude, old.longitude,
       old.structure_height, old.description, old.location,
       old.country, old.state, old.city, old.display_name
     ) then
    new.review_status := 'pending'::public.placement_review_status;
  end if;

  if new.review_status is distinct from old.review_status and not v_team then
    if not v_owner
       or new.review_status <> 'pending'::public.placement_review_status
       or old.review_status not in (
         'draft'::public.placement_review_status,
         'rejected'::public.placement_review_status,
         'approved'::public.placement_review_status
       ) then
      raise exception 'Only the review team can approve, reject or suspend a placement'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

create trigger guard_placement_state_changes_trigger
before insert or update on public.placements
for each row execute function private.guard_placement_state_changes();

-- A face change can affect what was approved. Existing face data is preserved.
create function private.requeue_placement_after_face_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' then
    update public.placements
    set review_status = 'pending'::public.placement_review_status
    where id = old.placement_id
      and review_status = 'approved'::public.placement_review_status;
    return old;
  end if;

  update public.placements
  set review_status = 'pending'::public.placement_review_status
  where id = new.placement_id
    and review_status = 'approved'::public.placement_review_status;

  if tg_op = 'UPDATE' and old.placement_id is distinct from new.placement_id then
    update public.placements
    set review_status = 'pending'::public.placement_review_status
    where id = old.placement_id
      and review_status = 'approved'::public.placement_review_status;
  end if;
  return new;
end;
$function$;

create trigger zz_requeue_placement_after_face_change_trigger
after insert or update or delete on public.placement_faces
for each row execute function private.requeue_placement_after_face_change();

-- Public, authenticated, and unlisted reads share the same publication rule.
drop policy "Placements públicos visibles para anónimos" on public.placements;
create policy "Placements públicos visibles para anónimos"
on public.placements for select to anon
using (
  visibility = 'public'::public.placement_visibility
  and owner_status = 'active'::public.placement_owner_status
  and review_status = 'approved'::public.placement_review_status
  and exists (
    select 1 from public.profiles as owner
    where owner.id = placements.user_id
      and owner.status = 'active'::public.user_status
  )
);

drop policy "Placements visibles para usuarios autenticados" on public.placements;
create policy "Placements visibles para usuarios autenticados"
on public.placements for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.user_has_any_role(array['admin'::public.app_role, 'moderator'::public.app_role]))
  or (
    visibility = 'public'::public.placement_visibility
    and owner_status = 'active'::public.placement_owner_status
    and review_status = 'approved'::public.placement_review_status
    and exists (
      select 1 from public.profiles as owner
      where owner.id = placements.user_id
        and owner.status = 'active'::public.user_status
    )
  )
);

drop policy "Caras públicas visibles para anónimos" on public.placement_faces;
create policy "Caras públicas visibles para anónimos"
on public.placement_faces for select to anon
using (exists (
  select 1 from public.placements p
  where p.id = placement_faces.placement_id
    and p.visibility = 'public'::public.placement_visibility
    and p.owner_status = 'active'::public.placement_owner_status
    and p.review_status = 'approved'::public.placement_review_status
));

drop policy "Caras visibles para usuarios autenticados" on public.placement_faces;
create policy "Caras visibles para usuarios autenticados"
on public.placement_faces for select to authenticated
using (exists (
  select 1 from public.placements p
  where p.id = placement_faces.placement_id
    and (
      p.user_id = (select auth.uid())
      or (select private.user_has_any_role(array['admin'::public.app_role, 'moderator'::public.app_role]))
      or (
        p.visibility = 'public'::public.placement_visibility
        and p.owner_status = 'active'::public.placement_owner_status
        and p.review_status = 'approved'::public.placement_review_status
      )
    )
));

-- Do not physically delete placements: reservations/history may live elsewhere.
drop policy "Propietarios y equipo pueden eliminar placements" on public.placements;
revoke delete on table public.placements from authenticated;

CREATE OR REPLACE FUNCTION private.fetch_unlisted_placement(p_placement_id uuid, p_share_token uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'placement', to_jsonb(p) - 'share_token',
    'faces', coalesce(
      (
        select jsonb_agg(to_jsonb(f) order by f.created_at, f.id)
        from public.placement_faces f
        where f.placement_id = p.id
      ),
      '[]'::jsonb
    )
  )
  from public.placements p
  where p.id = p_placement_id
    and p.share_token = p_share_token
    and exists (
      select 1 from public.profiles as owner
      where owner.id = p.user_id and owner.status = 'active'::public.user_status
    )
    and p.visibility = 'unlisted'::public.placement_visibility
    and p.owner_status = 'active'::public.placement_owner_status
    and p.review_status = 'approved'::public.placement_review_status;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_placements_in_view(p_south double precision, p_west double precision, p_north double precision, p_east double precision, p_limit integer DEFAULT 1000, p_exact_code text DEFAULT NULL::text, p_search_terms text[] DEFAULT '{}'::text[], p_country_codes text[] DEFAULT '{}'::text[], p_state_scopes jsonb DEFAULT '[]'::jsonb, p_city_scopes jsonb DEFAULT '[]'::jsonb, p_types text[] DEFAULT '{}'::text[])
 RETURNS TABLE(id uuid, code text, type placement_type, latitude double precision, longitude double precision, country text, country_code text, state text, subdivision_code text, city text, display_name text, face_count smallint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_limit integer := coalesce(p_limit, 1000);
  v_exact_code text := nullif(btrim(p_exact_code), '');
  v_search_terms text[] := coalesce(p_search_terms, '{}'::text[]);
  v_country_codes text[] := coalesce(p_country_codes, '{}'::text[]);
  v_state_scopes jsonb := coalesce(p_state_scopes, '[]'::jsonb);
  v_city_scopes jsonb := coalesce(p_city_scopes, '[]'::jsonb);
  v_types text[] := coalesce(p_types, '{}'::text[]);
begin
  if p_south is null or p_west is null or p_north is null or p_east is null then
    raise exception 'Viewport bounds cannot be null.' using errcode = '22023';
  end if;

  if p_south < -90 or p_south > 90
     or p_north < -90 or p_north > 90
     or p_south >= p_north then
    raise exception 'Invalid latitude bounds.' using errcode = '22023';
  end if;

  if p_west < -180 or p_west > 180
     or p_east < -180 or p_east > 180
     or p_west = p_east then
    raise exception 'Invalid longitude bounds.' using errcode = '22023';
  end if;

  if v_limit < 1 or v_limit > 2000 then
    raise exception 'p_limit must be between 1 and 2000.' using errcode = '22023';
  end if;

  if cardinality(v_search_terms) > 8 then
    raise exception 'Too many search terms.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_search_terms) as term
    where term is null or length(term) < 2 or length(term) > 80
  ) then
    raise exception 'Invalid search term.' using errcode = '22023';
  end if;

  if cardinality(v_country_codes) > 50 then
    raise exception 'Too many country filters.' using errcode = '22023';
  end if;

  if cardinality(v_types) > 20 then
    raise exception 'Too many type filters.' using errcode = '22023';
  end if;

  if jsonb_typeof(v_state_scopes) <> 'array'
     or jsonb_typeof(v_city_scopes) <> 'array' then
    raise exception 'State and city scopes must be arrays.' using errcode = '22023';
  end if;

  if jsonb_array_length(v_state_scopes) > 100
     or jsonb_array_length(v_city_scopes) > 100 then
    raise exception 'Too many location scopes.' using errcode = '22023';
  end if;

  return query
  select
    p.id,
    p.code,
    p.type,
    p.latitude,
    p.longitude,
    p.country,
    p.country_code,
    p.state,
    p.subdivision_code,
    p.city,
    p.display_name,
    p.face_count
  from public.placements as p
  join public.profiles as owner
    on owner.id = p.user_id
   and owner.status = 'active'
  where p.visibility = 'public'
    and p.owner_status = 'active'::public.placement_owner_status
    and p.review_status = 'approved'::public.placement_review_status
    and (
      (
        p_west < p_east
        and extensions.st_setsrid(
          extensions.st_makepoint(p.longitude, p.latitude),
          4326
        ) operator(extensions.&&)
        extensions.st_makeenvelope(
          p_west,
          p_south,
          p_east,
          p_north,
          4326
        )
      )
      or
      (
        p_west > p_east
        and (
          extensions.st_setsrid(
            extensions.st_makepoint(p.longitude, p.latitude),
            4326
          ) operator(extensions.&&)
          extensions.st_makeenvelope(
            p_west,
            p_south,
            180,
            p_north,
            4326
          )
          or
          extensions.st_setsrid(
            extensions.st_makepoint(p.longitude, p.latitude),
            4326
          ) operator(extensions.&&)
          extensions.st_makeenvelope(
            -180,
            p_south,
            p_east,
            p_north,
            4326
          )
        )
      )
    )
    and (
      v_exact_code is null
      or p.code = upper(v_exact_code)
    )
    and (
      v_exact_code is not null
      or cardinality(v_search_terms) = 0
      or not exists (
        select 1
        from unnest(v_search_terms) as search_term
        where p.search_text not ilike '%' || search_term || '%'
      )
    )
    and (
      cardinality(v_country_codes) = 0
      or p.country_code = any(v_country_codes)
    )
    and (
      cardinality(v_types) = 0
      or p.type::text = any(v_types)
    )
    and (
      jsonb_array_length(v_state_scopes) = 0
      or exists (
        select 1
        from jsonb_array_elements(v_state_scopes) as scope
        where p.country_code = upper(scope->>'country_code')
          and (
            (
              nullif(scope->>'subdivision_code', '') is not null
              and p.subdivision_code = upper(scope->>'subdivision_code')
            )
            or
            (
              nullif(scope->>'subdivision_code', '') is null
              and p.subdivision_code is null
              and p.state = nullif(scope->>'state', '')
            )
          )
      )
    )
    and (
      jsonb_array_length(v_city_scopes) = 0
      or exists (
        select 1
        from jsonb_array_elements(v_city_scopes) as scope
        where p.country_code = upper(scope->>'country_code')
          and p.city = nullif(scope->>'city', '')
          and (
            (
              nullif(scope->>'subdivision_code', '') is not null
              and p.subdivision_code = upper(scope->>'subdivision_code')
            )
            or
            (
              nullif(scope->>'subdivision_code', '') is null
              and p.subdivision_code is null
              and p.state = nullif(scope->>'state', '')
            )
          )
      )
    )
  order by p.created_at desc, p.id desc
  limit v_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_placement_page_in_view(p_south double precision, p_west double precision, p_north double precision, p_east double precision, p_limit integer DEFAULT 25, p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cursor_id uuid DEFAULT NULL::uuid, p_exact_code text DEFAULT NULL::text, p_search_terms text[] DEFAULT '{}'::text[], p_country_codes text[] DEFAULT '{}'::text[], p_state_scopes jsonb DEFAULT '[]'::jsonb, p_city_scopes jsonb DEFAULT '[]'::jsonb, p_types text[] DEFAULT '{}'::text[])
 RETURNS TABLE(id uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_limit integer := coalesce(p_limit, 25);
  v_exact_code text := nullif(btrim(p_exact_code), '');
  v_search_terms text[] := coalesce(p_search_terms, '{}'::text[]);
  v_country_codes text[] := coalesce(p_country_codes, '{}'::text[]);
  v_state_scopes jsonb := coalesce(p_state_scopes, '[]'::jsonb);
  v_city_scopes jsonb := coalesce(p_city_scopes, '[]'::jsonb);
  v_types text[] := coalesce(p_types, '{}'::text[]);
begin
  if p_south is null or p_west is null or p_north is null or p_east is null then
    raise exception 'Viewport bounds cannot be null.' using errcode = '22023';
  end if;

  if p_south < -90 or p_south > 90
     or p_north < -90 or p_north > 90
     or p_south >= p_north then
    raise exception 'Invalid latitude bounds.' using errcode = '22023';
  end if;

  if p_west < -180 or p_west > 180
     or p_east < -180 or p_east > 180
     or p_west = p_east then
    raise exception 'Invalid longitude bounds.' using errcode = '22023';
  end if;

  if v_limit < 1 or v_limit > 101 then
    raise exception 'p_limit must be between 1 and 101.' using errcode = '22023';
  end if;

  if (p_cursor_created_at is null) <> (p_cursor_id is null) then
    raise exception 'Cursor fields must both be null or both be provided.' using errcode = '22023';
  end if;

  if cardinality(v_search_terms) > 8 then
    raise exception 'Too many search terms.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_search_terms) as term
    where term is null or length(term) < 2 or length(term) > 80
  ) then
    raise exception 'Invalid search term.' using errcode = '22023';
  end if;

  if cardinality(v_country_codes) > 50 then
    raise exception 'Too many country filters.' using errcode = '22023';
  end if;

  if cardinality(v_types) > 20 then
    raise exception 'Too many type filters.' using errcode = '22023';
  end if;

  if jsonb_typeof(v_state_scopes) <> 'array'
     or jsonb_typeof(v_city_scopes) <> 'array' then
    raise exception 'State and city scopes must be arrays.' using errcode = '22023';
  end if;

  if jsonb_array_length(v_state_scopes) > 100
     or jsonb_array_length(v_city_scopes) > 100 then
    raise exception 'Too many location scopes.' using errcode = '22023';
  end if;

  return query
  select
    p.id,
    p.created_at
  from public.placements as p
  join public.profiles as owner
    on owner.id = p.user_id
   and owner.status = 'active'
  where p.visibility = 'public'
    and p.owner_status = 'active'::public.placement_owner_status
    and p.review_status = 'approved'::public.placement_review_status
    and (
      (
        p_west < p_east
        and extensions.st_setsrid(
          extensions.st_makepoint(p.longitude, p.latitude),
          4326
        ) operator(extensions.&&)
        extensions.st_makeenvelope(
          p_west,
          p_south,
          p_east,
          p_north,
          4326
        )
      )
      or
      (
        p_west > p_east
        and (
          extensions.st_setsrid(
            extensions.st_makepoint(p.longitude, p.latitude),
            4326
          ) operator(extensions.&&)
          extensions.st_makeenvelope(
            p_west,
            p_south,
            180,
            p_north,
            4326
          )
          or
          extensions.st_setsrid(
            extensions.st_makepoint(p.longitude, p.latitude),
            4326
          ) operator(extensions.&&)
          extensions.st_makeenvelope(
            -180,
            p_south,
            p_east,
            p_north,
            4326
          )
        )
      )
    )
    and (
      v_exact_code is null
      or p.code = upper(v_exact_code)
    )
    and (
      v_exact_code is not null
      or cardinality(v_search_terms) = 0
      or not exists (
        select 1
        from unnest(v_search_terms) as search_term
        where p.search_text not ilike '%' || search_term || '%'
      )
    )
    and (
      cardinality(v_country_codes) = 0
      or p.country_code = any(v_country_codes)
    )
    and (
      cardinality(v_types) = 0
      or p.type::text = any(v_types)
    )
    and (
      jsonb_array_length(v_state_scopes) = 0
      or exists (
        select 1
        from jsonb_array_elements(v_state_scopes) as scope
        where p.country_code = upper(scope->>'country_code')
          and (
            (
              nullif(scope->>'subdivision_code', '') is not null
              and p.subdivision_code = upper(scope->>'subdivision_code')
            )
            or
            (
              nullif(scope->>'subdivision_code', '') is null
              and p.subdivision_code is null
              and p.state = nullif(scope->>'state', '')
            )
          )
      )
    )
    and (
      jsonb_array_length(v_city_scopes) = 0
      or exists (
        select 1
        from jsonb_array_elements(v_city_scopes) as scope
        where p.country_code = upper(scope->>'country_code')
          and p.city = nullif(scope->>'city', '')
          and (
            (
              nullif(scope->>'subdivision_code', '') is not null
              and p.subdivision_code = upper(scope->>'subdivision_code')
            )
            or
            (
              nullif(scope->>'subdivision_code', '') is null
              and p.subdivision_code is null
              and p.state = nullif(scope->>'state', '')
            )
          )
      )
    )
    and (
      p_cursor_created_at is null
      or p.created_at < p_cursor_created_at
      or (
        p.created_at = p_cursor_created_at
        and p.id < p_cursor_id
      )
    )
  order by p.created_at desc, p.id desc
  limit v_limit;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_placement_filter_options()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with public_placements as materialized (
    select
      p.country,
      p.country_code,
      p.state,
      p.subdivision_code,
      p.city,
      p.type
    from public.placements as p
    join public.profiles as owner
      on owner.id = p.user_id
    where p.visibility = 'public'
      and p.owner_status = 'active'::public.placement_owner_status
    and p.review_status = 'approved'::public.placement_review_status
      and owner.status = 'active'
  )
  select jsonb_build_object(
    'countries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key', options.country_code,
          'value', options.label,
          'label', options.label,
          'country_code', options.country_code,
          'count', options.placement_count
        )
        order by options.placement_count desc, options.label, options.country_code
      )
      from (
        select
          pp.country_code,
          min(pp.country) as label,
          count(*)::integer as placement_count
        from public_placements as pp
        where pp.country_code is not null
          and pp.country is not null
        group by pp.country_code
      ) as options
    ), '[]'::jsonb),

    'states', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key', options.country_code || ':' || coalesce(options.subdivision_code, options.label),
          'value', options.label,
          'label', options.label,
          'country', options.country,
          'country_code', options.country_code,
          'subdivision_code', options.subdivision_code,
          'count', options.placement_count
        )
        order by options.placement_count desc, options.label, options.country, options.country_code
      )
      from (
        select
          pp.country_code,
          pp.subdivision_code,
          min(pp.country) as country,
          pp.state as label,
          count(*)::integer as placement_count
        from public_placements as pp
        where pp.state is not null
          and pp.country_code is not null
        group by
          pp.country_code,
          pp.subdivision_code,
          pp.state
      ) as options
    ), '[]'::jsonb),

    'cities', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key', options.country_code || ':' || coalesce(options.subdivision_code, coalesce(options.state, '')) || ':' || options.label,
          'value', options.label,
          'label', options.label,
          'state', options.state,
          'country', options.country,
          'country_code', options.country_code,
          'subdivision_code', options.subdivision_code,
          'count', options.placement_count
        )
        order by options.placement_count desc, options.label, options.state, options.country, options.country_code
      )
      from (
        select
          pp.country_code,
          pp.subdivision_code,
          min(pp.country) as country,
          pp.state,
          pp.city as label,
          count(*)::integer as placement_count
        from public_placements as pp
        where pp.city is not null
          and pp.country_code is not null
        group by
          pp.country_code,
          pp.subdivision_code,
          pp.state,
          pp.city
      ) as options
    ), '[]'::jsonb),

    'types', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'value', options.value,
          'count', options.placement_count
        )
        order by options.placement_count desc, options.value
      )
      from (
        select
          pp.type::text as value,
          count(*)::integer as placement_count
        from public_placements as pp
        group by pp.type
      ) as options
    ), '[]'::jsonb)
  );
$function$;

-- Existing partial indexes must follow the new publication predicate.
drop index public.placements_public_active_search_trgm_idx;
drop index public.placements_public_active_geo_gist_idx;

alter table public.placements drop column status;
drop type public.placement_status;

create index placements_public_approved_search_trgm_idx
on public.placements using gin (search_text extensions.gin_trgm_ops)
where visibility = 'public'::public.placement_visibility
  and owner_status = 'active'::public.placement_owner_status
  and review_status = 'approved'::public.placement_review_status;

create index placements_public_approved_geo_gist_idx
on public.placements using gist (
  extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)
)
where visibility = 'public'::public.placement_visibility
  and owner_status = 'active'::public.placement_owner_status
  and review_status = 'approved'::public.placement_review_status;

comment on column public.placements.owner_status is 'Owner availability: active, paused, withdrawn. Withdrawn records retain their faces and commitments.';
comment on column public.placements.review_status is 'MOKA review: draft, pending, in_review, approved, suspended, rejected.';
