-- Use the same owner and availability scope as the inventory list and map.
-- Withdrawn placements must not contribute geographic options or face counts.

CREATE OR REPLACE FUNCTION public.get_inventory_filter_options()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with user_placements as materialized (
    select
      p.country,
      p.state,
      p.city,
      p.face_count
    from public.placements as p
    where p.user_id = (select auth.uid())
      and p.owner_status <> 'withdrawn'
  )
  select jsonb_build_object(
    'countries', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'value', options.label,
          'label', options.label,
          'count', options.placement_count
        )
        order by options.placement_count desc, options.label
      )
      from (
        select
          up.country as label,
          count(*)::integer as placement_count
        from user_placements as up
        where up.country is not null
        group by up.country
      ) as options
    ), '[]'::jsonb),
    'states', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'value', options.label,
          'label', options.label,
          'country', options.country,
          'count', options.placement_count
        )
        order by options.placement_count desc, options.label
      )
      from (
        select
          up.state as label,
          case
            when count(distinct up.country) = 1 then min(up.country)
          end as country,
          count(*)::integer as placement_count
        from user_placements as up
        where up.state is not null
        group by up.state
      ) as options
    ), '[]'::jsonb),
    'cities', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'value', options.label,
          'label', options.label,
          'state', options.state,
          'country', options.country,
          'count', options.placement_count
        )
        order by options.placement_count desc, options.label
      )
      from (
        select
          up.city as label,
          case
            when count(distinct up.state) = 1 then min(up.state)
          end as state,
          case
            when count(distinct up.country) = 1 then min(up.country)
          end as country,
          count(*)::integer as placement_count
        from user_placements as up
        where up.city is not null
        group by up.city
      ) as options
    ), '[]'::jsonb),
    'faceCounts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'value', options.face_count,
          'count', options.placement_count
        )
        order by options.face_count
      )
      from (
        select
          up.face_count,
          count(*)::integer as placement_count
        from user_placements as up
        group by up.face_count
      ) as options
    ), '[]'::jsonb)
  );
$function$;
