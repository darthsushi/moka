-- Durable, recipient-specific inbox. Clients may only read and mark their own rows.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('review_decision', 'review_assigned', 'review_reassigned', 'review_requested')),
  placement_id uuid references public.placements(id) on delete set null,
  placement_code text,
  review_status text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_recent_idx on public.notifications(recipient_id, created_at desc, id desc);
create index notifications_recipient_unread_idx on public.notifications(recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, update(read_at) on public.notifications to authenticated;

create policy notifications_own_read on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy notifications_own_mark_read on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- Review events are written by the existing checked moderation transaction.
-- This trigger has no client-callable endpoint and creates notifications atomically.
create function private.notify_placement_review_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_code text;
  v_reviewer uuid;
begin
  select user_id, code into v_owner, v_code
  from public.placements where id = new.placement_id;

  if new.event_type = 'decision' and new.new_status in ('approved', 'rejected', 'suspended') then
    insert into public.notifications(recipient_id, kind, placement_id, placement_code, review_status)
    values (v_owner, 'review_decision', new.placement_id, v_code, new.new_status::text);
  elsif new.event_type in ('assigned', 'reassigned') and new.reviewer_id is not null then
    insert into public.notifications(recipient_id, kind, placement_id, placement_code)
    values (new.reviewer_id,
      case when new.event_type = 'assigned' then 'review_assigned' else 'review_reassigned' end,
      new.placement_id, v_code);
  elsif new.event_type = 'status_changed' and new.new_status = 'pending'
    and new.previous_status is distinct from 'pending' then
    select reviewer_id into v_reviewer from public.placement_review_assignments
      where placement_id = new.placement_id;
    if v_reviewer is not null and v_reviewer is distinct from new.actor_id then
      insert into public.notifications(recipient_id, kind, placement_id, placement_code)
      values (v_reviewer, 'review_requested', new.placement_id, v_code);
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.notify_placement_review_event() from public, anon, authenticated;
create trigger notify_placement_review_event after insert on public.placement_review_events
for each row execute function private.notify_placement_review_event();

-- Realtime's Postgres Changes authorizes each row through the SELECT policy.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

notify pgrst, 'reload schema';
