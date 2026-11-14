-- Each face has one mandatory front image and at most one image per view.
-- The old image array is removed after the old placements and their storage
-- objects have been explicitly cleaned up.
create table public.placement_face_images (
  id uuid primary key default gen_random_uuid(),
  face_id uuid not null references public.placement_faces(id) on delete cascade,
  view_type text not null check (view_type in ('front', 'approach', 'surrounding')),
  url text not null check (length(btrim(url)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (face_id, view_type)
);

create index placement_face_images_face_id_idx on public.placement_face_images(face_id);
alter table public.placement_face_images enable row level security;

create policy "Face images visible to anonymous users" on public.placement_face_images
  for select to anon using (exists (
    select 1 from public.placement_faces f join public.placements p on p.id = f.placement_id
    where f.id = face_id and p.visibility = 'public' and p.owner_status = 'active'
      and p.review_status = 'approved'
  ));
create policy "Face images visible to authenticated users" on public.placement_face_images
  for select to authenticated using (exists (
    select 1 from public.placement_faces f join public.placements p on p.id = f.placement_id
    where f.id = face_id and (
      p.user_id = (select auth.uid())
      or (select private.user_has_any_role(array['admin'::public.app_role,'moderator'::public.app_role]))
      or (p.visibility = 'public' and p.owner_status = 'active' and p.review_status = 'approved')
    )
  ));
create policy "Owners can add face images" on public.placement_face_images
  for insert to authenticated with check (exists (
    select 1 from public.placement_faces f join public.placements p on p.id = f.placement_id
    where f.id = face_id and p.user_id = (select auth.uid())
  ));
create policy "Owners can update face images" on public.placement_face_images
  for update to authenticated using (exists (
    select 1 from public.placement_faces f join public.placements p on p.id = f.placement_id
    where f.id = face_id and p.user_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.placement_faces f join public.placements p on p.id = f.placement_id
    where f.id = face_id and p.user_id = (select auth.uid())
  ));
create policy "Owners can delete face images" on public.placement_face_images
  for delete to authenticated using (exists (
    select 1 from public.placement_faces f join public.placements p on p.id = f.placement_id
    where f.id = face_id and p.user_id = (select auth.uid())
  ));
grant select on public.placement_face_images to anon;
grant select, insert, update, delete on public.placement_face_images to authenticated;

create function private.require_front_face_image() returns trigger
  language plpgsql security invoker set search_path = '' as $$
declare v_face_id uuid;
begin
  v_face_id := case when TG_TABLE_NAME = 'placement_faces' then new.id
    when TG_OP = 'DELETE' then old.face_id else new.face_id end;
  if exists (select 1 from public.placement_faces where id = v_face_id)
     and not exists (select 1 from public.placement_face_images
                     where face_id = v_face_id and view_type = 'front') then
    raise exception 'FRONT_IMAGE_REQUIRED' using errcode = '23514';
  end if;
  if TG_TABLE_NAME = 'placement_face_images' and TG_OP = 'UPDATE'
     and old.face_id is distinct from new.face_id
     and exists (select 1 from public.placement_faces where id = old.face_id)
     and not exists (select 1 from public.placement_face_images
                     where face_id = old.face_id and view_type = 'front') then
    raise exception 'FRONT_IMAGE_REQUIRED' using errcode = '23514';
  end if;
  return null;
end;
$$;
create constraint trigger require_front_on_face
  after insert or update on public.placement_faces deferrable initially deferred
  for each row execute function private.require_front_face_image();
create constraint trigger require_front_on_image
  after insert or update or delete on public.placement_face_images deferrable initially deferred
  for each row execute function private.require_front_face_image();

-- A single RPC creates the placement, all its faces and named views atomically.
create function public.create_placement_with_faces(p_placement jsonb, p_faces jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_placement_id uuid; v_face_id uuid; v_face jsonb; v_view text; v_url text;
begin
  if auth.uid() is null then raise exception 'ACTION_NOT_ALLOWED' using errcode = '42501'; end if;
  if jsonb_typeof(p_faces) <> 'array' or jsonb_array_length(p_faces) < 1 then
    raise exception 'FACES_REQUIRED' using errcode = '22023';
  end if;
  for v_face in select value from jsonb_array_elements(p_faces) loop
    if nullif(btrim(v_face->'images'->>'front'), '') is null then
      raise exception 'FRONT_IMAGE_REQUIRED' using errcode = '23514';
    end if;
  end loop;
  insert into public.placements (user_id,type,latitude,longitude,structure_height,location,description,visibility)
  values (auth.uid(),(p_placement->>'type')::public.placement_type,
    (p_placement->>'latitude')::double precision,(p_placement->>'longitude')::double precision,
    (p_placement->>'structure_height')::numeric,p_placement->'location',
    p_placement->>'description',coalesce((p_placement->>'visibility')::public.placement_visibility,'private'))
  returning id into v_placement_id;
  for v_face in select value from jsonb_array_elements(p_faces) loop
    insert into public.placement_faces (placement_id,display_width,display_height,period_price,day_range)
    values (v_placement_id,(v_face->>'display_width')::numeric,(v_face->>'display_height')::numeric,
      (v_face->>'period_price')::numeric,(v_face->>'day_range')::int4range)
    returning id into v_face_id;
    foreach v_view in array array['front','approach','surrounding'] loop
      v_url := nullif(btrim(v_face->'images'->>v_view), '');
      if v_url is not null then
        insert into public.placement_face_images(face_id,view_type,url)
        values(v_face_id,v_view,v_url);
      end if;
    end loop;
  end loop;
  return (select jsonb_build_object('id',p.id,'code',p.code,'visibility',p.visibility,
    'share_token',p.share_token,'face_count',p.face_count)
    from public.placements p where p.id = v_placement_id);
end;
$$;
revoke all on function public.create_placement_with_faces(jsonb,jsonb) from public, anon;
grant execute on function public.create_placement_with_faces(jsonb,jsonb) to authenticated;

create or replace function private.fetch_unlisted_placement(p_placement_id uuid, p_share_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'placement', to_jsonb(p) - 'share_token',
    'faces', coalesce((select jsonb_agg(
      (to_jsonb(f) - 'images') || jsonb_build_object('images', coalesce(
        (select jsonb_agg(jsonb_build_object('view_type', i.view_type, 'url', i.url))
         from public.placement_face_images i where i.face_id = f.id), '[]'::jsonb))
      order by f.created_at, f.id)
      from public.placement_faces f where f.placement_id = p.id), '[]'::jsonb)
  ) from public.placements p where p.id = p_placement_id and p.share_token = p_share_token
    and exists (select 1 from public.profiles owner where owner.id = p.user_id and owner.status = 'active'::public.user_status)
    and p.visibility = 'unlisted' and p.owner_status = 'active' and p.review_status = 'approved';
$$;

create or replace function private.review_hub_detail(p_placement_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_actor uuid:=auth.uid(); v_p public.placements%rowtype; v_a public.placement_review_assignments%rowtype;
begin
  if v_actor is null or not private.review_hub_is_reviewer(v_actor) then raise exception 'REVIEW_FORBIDDEN' using errcode='42501'; end if;
  select * into v_p from public.placements where id=p_placement_id;
  if not found then raise exception 'REVIEW_NOT_FOUND'; end if;
  select * into v_a from public.placement_review_assignments where placement_id=p_placement_id;
  if v_a.reviewer_id is distinct from v_actor and not private.review_hub_is_reviewer(v_actor,true) then
    raise exception 'REVIEW_NOT_ASSIGNED_TO_YOU' using errcode='42501';
  end if;
  return jsonb_build_object(
    'placement',to_jsonb(v_p)-'share_token'-'search_text',
    'assignment',case when v_a.placement_id is null then null else to_jsonb(v_a) end,
    'owner_name',(select name from public.profiles where id=v_p.user_id),
    'reviewer_name',(select name from public.profiles where id=v_a.reviewer_id),
    'faces',coalesce((select jsonb_agg(
      (to_jsonb(f) - 'images') || jsonb_build_object('images',coalesce(
        (select jsonb_agg(jsonb_build_object('view_type',i.view_type,'url',i.url))
         from public.placement_face_images i where i.face_id=f.id),'[]'::jsonb))
      order by f.created_at,f.id) from public.placement_faces f where f.placement_id=p_placement_id),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at desc,e.id)
      from public.placement_review_events e where e.placement_id=p_placement_id),'[]'::jsonb)
  );
end;
$$;

alter table public.placement_faces drop constraint placement_faces_images_check;
alter table public.placement_faces drop column images;
