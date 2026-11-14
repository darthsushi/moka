-- Editing is an owner-only transaction. Clear any moderator assignment before
-- returning the placement to the unassigned review queue.
create function private.edit_placement_and_requeue(p_id uuid, p_placement jsonb, p_faces jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_p public.placements%rowtype;
  v_face jsonb;
  v_face_id uuid;
  v_view text;
  v_url text;
  v_ids uuid[] := '{}'::uuid[];
begin
  select * into v_p from public.placements where id = p_id for update;
  if v_owner is null or not found or v_p.user_id <> v_owner or v_p.owner_status = 'withdrawn' then
    raise exception 'ACTION_NOT_ALLOWED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_faces) is distinct from 'array' or jsonb_array_length(p_faces) < 1
     or jsonb_array_length(p_faces) > 4 then
    raise exception 'FACES_REQUIRED' using errcode = '22023';
  end if;
  for v_face in select value from jsonb_array_elements(p_faces) loop
    if nullif(btrim(v_face->'images'->>'front'), '') is null then
      raise exception 'FRONT_IMAGE_REQUIRED' using errcode = '23514';
    end if;
  end loop;

  delete from public.placement_review_assignments where placement_id = p_id;
  update public.placements set
    type = (p_placement->>'type')::public.placement_type,
    structure_height = (p_placement->>'structure_height')::numeric,
    description = p_placement->>'description',
    visibility = (p_placement->>'visibility')::public.placement_visibility,
    review_status = 'pending'::public.placement_review_status
  where id = p_id;

  for v_face in select value from jsonb_array_elements(p_faces) loop
    v_face_id := nullif(v_face->>'id','')::uuid;
    if v_face_id is not null then
      if v_face_id = any(v_ids) then raise exception 'DUPLICATE_FACE' using errcode = '22023'; end if;
      update public.placement_faces set
        display_width = (v_face->>'display_width')::numeric,
        display_height = (v_face->>'display_height')::numeric,
        period_price = (v_face->>'period_price')::numeric,
        day_range = (v_face->>'day_range')::int4range
      where id = v_face_id and placement_id = p_id;
      if not found then raise exception 'FACE_NOT_FOUND' using errcode = '42501'; end if;
    else
      insert into public.placement_faces (placement_id,display_width,display_height,period_price,day_range)
      values (p_id,(v_face->>'display_width')::numeric,(v_face->>'display_height')::numeric,
        (v_face->>'period_price')::numeric,(v_face->>'day_range')::int4range)
      returning id into v_face_id;
    end if;
    v_ids := array_append(v_ids,v_face_id);
    foreach v_view in array array['front','approach','surrounding'] loop
      v_url := nullif(btrim(v_face->'images'->>v_view),'');
      if v_url is null then
        delete from public.placement_face_images where face_id = v_face_id and view_type = v_view;
      else
        insert into public.placement_face_images(face_id,view_type,url)
        values(v_face_id,v_view,v_url)
        on conflict (face_id,view_type) do update set url = excluded.url;
      end if;
    end loop;
  end loop;
  delete from public.placement_faces where placement_id = p_id and not (id = any(v_ids));
  return (select jsonb_build_object('id',p.id,'code',p.code,'visibility',p.visibility,
    'share_token',p.share_token,'face_count',p.face_count,'review_status',p.review_status)
    from public.placements p where p.id = p_id);
end;
$$;
revoke all on function private.edit_placement_and_requeue(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.edit_placement_and_requeue(uuid,jsonb,jsonb) to authenticated;
create function public.edit_placement_and_requeue(p_id uuid,p_placement jsonb,p_faces jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.edit_placement_and_requeue(p_id,p_placement,p_faces);
$$;
revoke all on function public.edit_placement_and_requeue(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.edit_placement_and_requeue(uuid,jsonb,jsonb) to authenticated;
