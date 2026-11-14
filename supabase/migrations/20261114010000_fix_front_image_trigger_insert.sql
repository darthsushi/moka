-- OLD is undefined on INSERT. Keep the UPDATE-only check in its own branch.
create or replace function private.require_front_face_image() returns trigger
  language plpgsql security invoker set search_path = '' as $$
declare v_face_id uuid;
begin
  if TG_TABLE_NAME = 'placement_faces' then
    v_face_id := NEW.id;
  elsif TG_OP = 'DELETE' then
    v_face_id := OLD.face_id;
  else
    v_face_id := NEW.face_id;
  end if;

  if exists (select 1 from public.placement_faces where id = v_face_id)
     and not exists (select 1 from public.placement_face_images
                     where face_id = v_face_id and view_type = 'front') then
    raise exception 'FRONT_IMAGE_REQUIRED' using errcode = '23514';
  end if;

  if TG_TABLE_NAME = 'placement_face_images' and TG_OP = 'UPDATE' then
    if OLD.face_id is distinct from NEW.face_id
       and exists (select 1 from public.placement_faces where id = OLD.face_id)
       and not exists (select 1 from public.placement_face_images
                       where face_id = OLD.face_id and view_type = 'front') then
      raise exception 'FRONT_IMAGE_REQUIRED' using errcode = '23514';
    end if;
  end if;

  return null;
end;
$$;
