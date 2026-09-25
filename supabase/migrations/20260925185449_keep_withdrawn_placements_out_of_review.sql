-- Withdrawing retains the placement and its faces, but cancels any active review.
-- A separate list may display withdrawn records later.
create function private.keep_withdrawn_placement_out_of_review()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_op = 'UPDATE'
     and new.owner_status = 'withdrawn'::public.placement_owner_status
     and old.owner_status is distinct from new.owner_status then
    new.review_status := 'draft'::public.placement_review_status;
  end if;

  if new.owner_status = 'withdrawn'::public.placement_owner_status
     and new.review_status <> 'draft'::public.placement_review_status then
    raise exception 'A withdrawn placement cannot be submitted for review'
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

-- Run after the existing ownership and review permission guard.
create trigger zy_keep_withdrawn_placement_out_of_review_trigger
before insert or update on public.placements
for each row execute function private.keep_withdrawn_placement_out_of_review();

update public.placements
set review_status = 'draft'::public.placement_review_status
where owner_status = 'withdrawn'::public.placement_owner_status
  and review_status <> 'draft'::public.placement_review_status;

alter table public.placements
  add constraint placements_withdrawn_not_under_review_check
  check (
    owner_status <> 'withdrawn'::public.placement_owner_status
    or review_status = 'draft'::public.placement_review_status
  );
