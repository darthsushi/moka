-- Review Hub: immutable decisions, exclusive assignments and audited admin transfers.
-- Existing approved placements keep their status. No historical reviewer is invented.
alter table public.placements add column review_revision bigint not null default 0;

create table public.placement_review_assignments (
  placement_id uuid primary key references public.placements(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid not null,
  updated_at timestamptz not null default now()
);
create index placement_review_assignments_reviewer_idx
  on public.placement_review_assignments(reviewer_id, placement_id);
create index placement_review_queue_idx on public.placements(review_status, created_at, id)
  where owner_status <> 'withdrawn';

create table public.placement_review_events (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.placements(id) on delete restrict,
  event_type text not null check (event_type in ('assigned','reassigned','decision','status_changed')),
  actor_id uuid,
  actor_name text,
  previous_reviewer_id uuid,
  previous_reviewer_name text,
  reviewer_id uuid,
  reviewer_name text,
  previous_status public.placement_review_status,
  new_status public.placement_review_status,
  message text check (message is null or char_length(message) <= 2000),
  created_at timestamptz not null default now(),
  constraint review_event_reason_required check (
    not (event_type = 'reassigned' or (event_type = 'decision' and new_status in ('rejected','suspended')))
    or nullif(btrim(message), '') is not null
  )
);
create index placement_review_events_placement_idx
  on public.placement_review_events(placement_id, created_at desc, id);

-- A fresh database lookup also invalidates access after demotion or suspension.
create function private.review_hub_is_reviewer(p_user_id uuid, p_admin_only boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = p_user_id and p.status = 'active'
      and (u.banned_until is null or u.banned_until <= now())
      and (case when p_admin_only then 'admin'::public.app_role = any(p.roles)
        else p.roles && array['admin','moderator']::public.app_role[] end)
  );
$$;
revoke all on function private.review_hub_is_reviewer(uuid, boolean) from public, anon;
grant execute on function private.review_hub_is_reviewer(uuid, boolean) to authenticated;

alter table public.placement_review_assignments enable row level security;
alter table public.placement_review_events enable row level security;
revoke all on public.placement_review_assignments, public.placement_review_events from anon, authenticated;
grant select on public.placement_review_assignments, public.placement_review_events to authenticated;
create policy review_assignments_team_read on public.placement_review_assignments
  for select to authenticated using ((select private.review_hub_is_reviewer(auth.uid())));
-- Owners can read their decisions later; internal assignment reasons are team-only.
create policy review_events_read on public.placement_review_events
  for select to authenticated using (
    (select private.review_hub_is_reviewer(auth.uid())) or
    (event_type in ('decision','status_changed') and exists (
      select 1 from public.placements p where p.id = placement_id and p.user_id = (select auth.uid())
    ))
  );

-- All moderation writes use the checked private operation below. Owner resubmission
-- and existing availability actions keep working through the existing inventory.
create function private.guard_review_hub_changes()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.review_revision := 0;
    if current_user = 'authenticated' and new.review_status <> 'pending' then
      raise exception 'REVIEW_HUB_REQUIRED' using errcode = '42501';
    end if;
    return new;
  end if;
  new.review_revision := old.review_revision + 1;
  if current_user = 'authenticated' and new.review_status is distinct from old.review_status then
    if not (
      (new.owner_status = 'withdrawn' and old.user_id = auth.uid()) or
      (old.owner_status = 'withdrawn' and private.review_hub_is_reviewer(auth.uid(), true)) or
      (old.user_id = auth.uid() and old.review_status in ('approved','rejected') and new.review_status = 'pending')
    ) then
      raise exception 'REVIEW_HUB_REQUIRED' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
create trigger zz_review_hub_guard before insert or update on public.placements
for each row execute function private.guard_review_hub_changes();

-- Record owner/system requeues as well as decisions made by a reviewer. The decision
-- RPC appends a separate event containing its mandatory reason in the same transaction.
create function private.record_review_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.review_status is distinct from old.review_status then
    insert into public.placement_review_events
      (placement_id,event_type,actor_id,actor_name,previous_status,new_status)
    values (new.id,'status_changed',auth.uid(),
      (select name from public.profiles where id = auth.uid()),old.review_status,new.review_status);
  end if;
  return new;
end;
$$;
create trigger review_hub_status_history after update on public.placements
for each row execute function private.record_review_status_change();

-- Touch the parent on every face edit, including edits while a review is open.
create or replace function private.requeue_placement_after_face_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_ids uuid[];
begin
  if tg_op = 'INSERT' then v_ids := array[new.placement_id];
  elsif tg_op = 'DELETE' then v_ids := array[old.placement_id];
  else v_ids := array[old.placement_id,new.placement_id]; end if;
  -- Stable lock order if a face moves between placements.
  perform id from public.placements where id = any(v_ids) order by id for update;
  update public.placements set review_status = case
    when review_status = 'approved' then 'pending'::public.placement_review_status else review_status end
  where id = any(v_ids);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function private.review_hub_action(
  p_placement_id uuid, p_action text, p_expected_revision bigint,
  p_reviewer_id uuid default null, p_message text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_admin boolean; v_p public.placements%rowtype;
  v_a public.placement_review_assignments%rowtype; v_target uuid;
  v_status public.placement_review_status; v_message text := nullif(btrim(p_message),'');
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

create function private.review_hub_list(
  p_tab text default 'unassigned', p_search text default '', p_status text default '',
  p_page integer default 1, p_page_size integer default 12, p_only_orphaned boolean default true
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_admin boolean; v_result jsonb;
begin
  if v_actor is null or not private.review_hub_is_reviewer(v_actor) then raise exception 'REVIEW_FORBIDDEN' using errcode='42501'; end if;
  v_admin := private.review_hub_is_reviewer(v_actor,true);
  if p_tab not in ('unassigned','mine','reassign') or p_tab is null then raise exception 'REVIEW_INVALID_TAB'; end if;
  if p_tab='reassign' and not v_admin then raise exception 'REVIEW_ADMIN_REQUIRED' using errcode='42501'; end if;
  if p_page is null or p_page < 1 or p_page_size is null or p_page_size not between 1 and 50 then raise exception 'REVIEW_INVALID_PAGE'; end if;
  with queue as (
    select p.id,p.code,p.type,p.display_name,p.country,p.state,p.city,p.face_count,
      p.owner_status,p.review_status,p.review_revision,p.created_at,p.user_id,
      owner.name as owner_name,a.reviewer_id,reviewer.name as reviewer_name,a.assigned_at,
      (a.reviewer_id is not null and not private.review_hub_is_reviewer(a.reviewer_id)) as needs_reassignment
    from public.placements p
    left join public.placement_review_assignments a on a.placement_id=p.id
    left join public.profiles owner on owner.id=p.user_id
    left join public.profiles reviewer on reviewer.id=a.reviewer_id
    where p.owner_status <> 'withdrawn'
  ), counts as (
    select jsonb_build_object(
      'unassigned',count(*) filter(where reviewer_id is null and review_status='pending' and user_id<>v_actor),
      'mine',count(*) filter(where reviewer_id=v_actor),
      'reassign',case when v_admin then count(*) filter(where needs_reassignment and review_status in ('pending','in_review')) else 0 end
    ) as value from queue
  ), filtered as (
    select * from queue q where
      ((p_tab='unassigned' and reviewer_id is null and review_status='pending' and user_id<>v_actor)
       or (p_tab='mine' and reviewer_id=v_actor)
       or (p_tab='reassign' and v_admin and (not p_only_orphaned or (needs_reassignment and review_status in ('pending','in_review')))))
      and (coalesce(p_status,'')='' or review_status::text=p_status)
      and (coalesce(btrim(p_search),'')='' or concat_ws(' ',code,display_name,city,state,country,owner_name) ilike '%'||btrim(p_search)||'%')
  ), paged as (
    select * from filtered order by created_at,id limit p_page_size offset (p_page-1)*p_page_size
  ) select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb),
      'total',(select count(*) from filtered),'counts',(select value from counts)) into v_result;
  return v_result;
end;
$$;

create function private.review_hub_detail(p_placement_id uuid)
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
    'faces',coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at,f.id) from public.placement_faces f where f.placement_id=p_placement_id),'[]'::jsonb),
    'events',coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at desc,e.id) from public.placement_review_events e where e.placement_id=p_placement_id),'[]'::jsonb)
  );
end;
$$;
create function private.review_hub_reviewers()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.review_hub_is_reviewer(auth.uid(),true) then raise exception 'REVIEW_ADMIN_REQUIRED' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) order by p.name,p.id)
    from public.profiles p where private.review_hub_is_reviewer(p.id)),'[]'::jsonb);
end;
$$;

-- Exposed wrappers are SECURITY INVOKER. Privilege elevation is confined to the
-- private schema; each private endpoint authenticates and authorizes its caller.
create function public.review_hub_action(p_placement_id uuid,p_action text,p_expected_revision bigint,p_reviewer_id uuid default null,p_message text default null)
returns jsonb language sql security invoker set search_path='' as $$
 select private.review_hub_action(p_placement_id,p_action,p_expected_revision,p_reviewer_id,p_message); $$;
create function public.review_hub_list(p_tab text default 'unassigned',p_search text default '',p_status text default '',p_page integer default 1,p_page_size integer default 12,p_only_orphaned boolean default true)
returns jsonb language sql stable security invoker set search_path='' as $$
 select private.review_hub_list(p_tab,p_search,p_status,p_page,p_page_size,p_only_orphaned); $$;
create function public.review_hub_detail(p_placement_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$ select private.review_hub_detail(p_placement_id); $$;
create function public.review_hub_reviewers()
returns jsonb language sql stable security invoker set search_path='' as $$ select private.review_hub_reviewers(); $$;

revoke all on function private.guard_review_hub_changes(),private.record_review_status_change() from public,anon,authenticated;
revoke all on function private.review_hub_action(uuid,text,bigint,uuid,text),public.review_hub_action(uuid,text,bigint,uuid,text),
  private.review_hub_list(text,text,text,integer,integer,boolean),public.review_hub_list(text,text,text,integer,integer,boolean),
  private.review_hub_detail(uuid),public.review_hub_detail(uuid),private.review_hub_reviewers(),public.review_hub_reviewers()
  from public,anon,authenticated;
grant execute on function private.review_hub_action(uuid,text,bigint,uuid,text),public.review_hub_action(uuid,text,bigint,uuid,text),
  private.review_hub_list(text,text,text,integer,integer,boolean),public.review_hub_list(text,text,text,integer,integer,boolean),
  private.review_hub_detail(uuid),public.review_hub_detail(uuid),private.review_hub_reviewers(),public.review_hub_reviewers()
  to authenticated;
notify pgrst, 'reload schema';
