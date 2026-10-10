-- Reject reasons made only of tabs/newlines as well as ordinary spaces.
create or replace function private.review_hub_action(
  p_placement_id uuid, p_action text, p_expected_revision bigint,
  p_reviewer_id uuid default null, p_message text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_admin boolean; v_p public.placements%rowtype;
  v_a public.placement_review_assignments%rowtype; v_target uuid;
  v_status public.placement_review_status; v_message text := nullif(regexp_replace(p_message, '^[[:space:]]+|[[:space:]]+$', '', 'g'),'');
  v_kind text;
begin
  if v_actor is null or not private.review_hub_is_reviewer(v_actor) then
    raise exception 'REVIEW_FORBIDDEN' using errcode = '42501';
  end if;
  v_admin := private.review_hub_is_reviewer(v_actor,true);
  select * into v_p from public.placements where id = p_placement_id for update;
  if not found then raise exception 'REVIEW_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_p.owner_status = 'withdrawn' then raise exception 'REVIEW_WITHDRAWN'; end if;
  if p_expected_revision is null or v_p.review_revision <> p_expected_revision then
    raise exception 'REVIEW_STALE' using errcode = '40001';
  end if;
  if char_length(v_message) > 2000 then raise exception 'REVIEW_MESSAGE_TOO_LONG'; end if;
  select * into v_a from public.placement_review_assignments where placement_id = p_placement_id;
  if p_action = 'claim' then
    if v_a.placement_id is not null then raise exception 'REVIEW_ALREADY_ASSIGNED'; end if;
    if v_p.review_status <> 'pending' then raise exception 'REVIEW_INVALID_TRANSITION'; end if;
    if v_p.user_id = v_actor then raise exception 'REVIEW_OWN_PLACEMENT' using errcode = '42501'; end if;
    v_target := v_actor; v_status := 'in_review'; v_kind := 'assigned';
    insert into public.placement_review_assignments(placement_id,reviewer_id,assigned_by)
      values(p_placement_id,v_target,v_actor);
  elsif p_action = 'reassign' then
    if not v_admin then raise exception 'REVIEW_ADMIN_REQUIRED' using errcode = '42501'; end if;
    if v_message is null then raise exception 'REVIEW_REASON_REQUIRED'; end if;
    if p_reviewer_id is null or not private.review_hub_is_reviewer(p_reviewer_id) then
      raise exception 'REVIEW_INVALID_REVIEWER';
    end if;
    if p_reviewer_id = v_p.user_id then raise exception 'REVIEW_OWN_PLACEMENT'; end if;
    if p_reviewer_id = v_a.reviewer_id then raise exception 'REVIEW_SAME_REVIEWER'; end if;
    v_target := p_reviewer_id; v_kind := 'reassigned';
    v_status := case when v_p.review_status = 'pending' then 'in_review'::public.placement_review_status else v_p.review_status end;
    insert into public.placement_review_assignments(placement_id,reviewer_id,assigned_by)
      values(p_placement_id,v_target,v_actor)
      on conflict(placement_id) do update set reviewer_id=excluded.reviewer_id,
        assigned_by=excluded.assigned_by,assigned_at=now(),updated_at=now();
  elsif p_action in ('approved','rejected','suspended','in_review') then
    if v_a.reviewer_id is distinct from v_actor or v_p.user_id = v_actor then
      raise exception 'REVIEW_NOT_ASSIGNED_TO_YOU' using errcode = '42501';
    end if;
    if not (
      (p_action = 'in_review' and v_p.review_status in ('pending','suspended')) or
      (p_action in ('approved','rejected') and v_p.review_status = 'in_review') or
      (p_action = 'suspended' and v_p.review_status = 'approved')
    ) then raise exception 'REVIEW_INVALID_TRANSITION'; end if;
    if p_action in ('rejected','suspended') and v_message is null then raise exception 'REVIEW_REASON_REQUIRED'; end if;
    v_target := v_actor; v_status := p_action::public.placement_review_status; v_kind := 'decision';
  else raise exception 'REVIEW_INVALID_ACTION'; end if;
  update public.placements set review_status=v_status where id=p_placement_id;
  insert into public.placement_review_events
    (placement_id,event_type,actor_id,actor_name,previous_reviewer_id,previous_reviewer_name,
      reviewer_id,reviewer_name,previous_status,new_status,message)
  values (p_placement_id,v_kind,v_actor,(select name from public.profiles where id=v_actor),
    v_a.reviewer_id,(select name from public.profiles where id=v_a.reviewer_id),
    v_target,(select name from public.profiles where id=v_target),v_p.review_status,v_status,v_message);
  return jsonb_build_object('placement_id',p_placement_id,'review_status',v_status);
end;
$$;

alter table public.placement_review_events drop constraint review_event_reason_required;
alter table public.placement_review_events add constraint review_event_reason_required check (
  not (event_type = 'reassigned' or (event_type = 'decision' and new_status in ('rejected','suspended')))
  or coalesce(message ~ '[^[:space:]]', false)
);
