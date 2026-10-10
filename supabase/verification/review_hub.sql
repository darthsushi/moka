-- Run as postgres against the populated MOKA database. Everything rolls back.
-- Uses existing rows only inside this transaction; no emails, auth sessions or sequence values are created.
begin;
set local statement_timeout = '45s';
do $test$
declare
  p_id uuid; owner_id uuid; admin_id uuid; m1 uuid; m2 uuid; revision bigint;
  result jsonb; before_count bigint; face_id uuid;
begin
  select id,user_id into strict p_id,owner_id from public.placements
    where owner_status='active' and review_status='approved' order by id limit 1;
  select id into strict admin_id from public.profiles where 'admin'=any(roles) and id<>owner_id order by id limit 1;
  select id into strict m1 from public.profiles where id not in(owner_id,admin_id) order by id limit 1;
  select id into strict m2 from public.profiles where id not in(owner_id,admin_id,m1) order by id limit 1;
  update public.profiles set roles=array['moderator']::public.app_role[],status='active' where id in(m1,m2);
  update public.placements set review_status='pending' where id=p_id returning review_revision into revision;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  execute 'set local role authenticated';
  begin
    perform public.review_hub_list(); raise exception 'Owner accessed review hub';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claims',jsonb_build_object('sub',m1,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',m1::text,true);
  execute 'set local role authenticated';
  result:=public.review_hub_list();
  if not exists(select 1 from jsonb_array_elements(result->'rows') r where r->>'id'=p_id::text) then raise exception 'Queue omitted pending placement'; end if;
  begin
    perform public.review_hub_list('reassign'); raise exception 'Moderator accessed admin queue';
  exception when insufficient_privilege then null; end;
  begin
    perform public.review_hub_detail(p_id); raise exception 'Unassigned moderator opened review';
  exception when insufficient_privilege then null; end;
  perform public.review_hub_action(p_id,'claim',revision);
  select review_revision into revision from public.placements where id=p_id;
  result:=public.review_hub_detail(p_id);
  if result->'assignment'->>'reviewer_id'<>m1::text or result->'placement'->>'review_status'<>'in_review' then raise exception 'Claim did not start review'; end if;
  begin
    update public.placement_review_assignments set reviewer_id=m2 where placement_id=p_id;
    raise exception 'Moderator changed assignment directly';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.placement_review_events where placement_id=p_id;
    raise exception 'Moderator deleted audit history';
  exception when insufficient_privilege then null; end;
  begin
    perform public.review_hub_action(p_id,'rejected',revision,null,E' \t\n ');
    raise exception 'Empty rejection accepted';
  exception when others then if sqlerrm<>'REVIEW_REASON_REQUIRED' then raise; end if; end;
  begin
    perform public.review_hub_action(p_id,'reassign',revision,m2,'Transfer');
    raise exception 'Moderator reassigned placement';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claims',jsonb_build_object('sub',m2,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',m2::text,true);
  execute 'set local role authenticated';
  begin
    perform public.review_hub_action(p_id,'claim',revision);
    raise exception 'Second claim accepted';
  exception when others then if sqlerrm<>'REVIEW_ALREADY_ASSIGNED' then raise; end if; end;
  begin
    perform public.review_hub_action(p_id,'approved',revision);
    raise exception 'Other moderator approved placement';
  exception when insufficient_privilege then null; end;
  begin
    update public.placements set review_status='approved' where id=p_id;
    raise exception 'Direct update bypassed assignment';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claims',jsonb_build_object('sub',m1,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',m1::text,true);
  execute 'set local role authenticated';
  perform public.review_hub_action(p_id,'rejected',revision,null,'Replace the unreadable photo.');
  select review_revision into revision from public.placements where id=p_id;
  execute 'reset role';
  if not exists(select 1 from public.placement_review_events where placement_id=p_id and event_type='decision' and actor_id=m1 and message='Replace the unreadable photo.') then raise exception 'Missing immutable rejection'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  execute 'set local role authenticated';
  if not exists(select 1 from public.placement_review_events where placement_id=p_id and event_type='decision') then raise exception 'Owner cannot read their review'; end if;
  update public.placements set review_status='pending' where id=p_id;
  execute 'reset role';
  if (select reviewer_id from public.placement_review_assignments where placement_id=p_id)<>m1 then raise exception 'Resubmission lost assignee'; end if;

  perform set_config('request.jwt.claims','{}',true); perform set_config('request.jwt.claim.sub','',true);
  update public.profiles set roles=array['advertiser']::public.app_role[] where id=m1;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',m1,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',m1::text,true);
  execute 'set local role authenticated';
  begin perform public.review_hub_list('mine'); raise exception 'Demoted moderator retained access';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  execute 'set local role authenticated';
  result:=public.review_hub_list('reassign');
  if not exists(select 1 from jsonb_array_elements(result->'rows') r where r->>'id'=p_id::text) then raise exception 'Orphan review missing'; end if;
  select review_revision into revision from public.placements where id=p_id;
  begin perform public.review_hub_action(p_id,'reassign',revision,m2,''); raise exception 'Transfer without reason accepted';
  exception when others then if sqlerrm<>'REVIEW_REASON_REQUIRED' then raise; end if; end;
  begin perform public.review_hub_action(p_id,'reassign',revision,m1,'Reason'); raise exception 'Inactive reviewer accepted';
  exception when others then if sqlerrm<>'REVIEW_INVALID_REVIEWER' then raise; end if; end;
  perform public.review_hub_action(p_id,'reassign',revision,m2,'Previous reviewer left the team.');
  select review_revision into revision from public.placements where id=p_id;
  begin perform public.review_hub_action(p_id,'approved',revision); raise exception 'Admin bypassed assignee';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  if not exists(select 1 from public.placement_review_events where placement_id=p_id and event_type='reassigned' and previous_reviewer_id=m1 and reviewer_id=m2 and actor_id=admin_id) then raise exception 'Transfer audit missing'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.placement_review_events where placement_id=p_id and event_type='reassigned') then raise exception 'Owner saw internal transfer reason'; end if;
  update public.placements set description=coalesce(description,'')||' [verification]' where id=p_id;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',m2,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',m2::text,true);
  execute 'set local role authenticated';
  begin perform public.review_hub_action(p_id,'approved',revision); raise exception 'Stale approval accepted';
  exception when serialization_failure then null; end;
  select review_revision into revision from public.placements where id=p_id;
  perform public.review_hub_action(p_id,'approved',revision);
  select review_revision into revision from public.placements where id=p_id;
  begin perform public.review_hub_action(p_id,'suspended',revision,null,'  '); raise exception 'Empty suspension accepted';
  exception when others then if sqlerrm<>'REVIEW_REASON_REQUIRED' then raise; end if; end;
  perform public.review_hub_action(p_id,'suspended',revision,null,'Image requires verification.');
  select review_revision into revision from public.placements where id=p_id;
  perform public.review_hub_action(p_id,'in_review',revision);
  select review_revision into revision from public.placements where id=p_id;
  execute 'reset role';

  select id into face_id from public.placement_faces where placement_id=p_id limit 1;
  if face_id is not null then
    update public.placement_faces set period_price=period_price+1 where id=face_id;
    if (select review_revision from public.placements where id=p_id)<=revision then raise exception 'Face edit failed to invalidate review'; end if;
  end if;
  -- Suspension is checked against fresh profile data, even with an existing JWT.
  perform set_config('request.jwt.claims','{}',true); perform set_config('request.jwt.claim.sub','',true);
  update public.profiles set status='banned' where id=m2;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',m2,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',m2::text,true);
  execute 'set local role authenticated';
  begin perform public.review_hub_action(p_id,'approved',revision); raise exception 'Banned moderator retained access';
  exception when insufficient_privilege then null; end;
  execute 'reset role';

  perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',owner_id::text,true);
  execute 'set local role authenticated';
  update public.placements set owner_status='withdrawn' where id=p_id;
  execute 'reset role';
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  execute 'set local role authenticated';
  result:=public.review_hub_list('reassign','', '',1,50,false);
  if exists(select 1 from jsonb_array_elements(result->'rows') r where r->>'id'=p_id::text) then raise exception 'Withdrawn placement in queue'; end if;
  select review_revision into revision from public.placements where id=p_id;
  begin perform public.review_hub_action(p_id,'reassign',revision,admin_id,'Restore'); raise exception 'Withdrawn review accepted';
  exception when others then if sqlerrm<>'REVIEW_WITHDRAWN' then raise; end if; end;
  execute 'reset role';
  perform set_config('request.jwt.claims','{}',true); perform set_config('request.jwt.claim.sub','',true);
  execute 'set local role anon';
  begin perform public.review_hub_list(); raise exception 'Anon accessed review hub'; exception when insufficient_privilege then null; end;
  begin select count(*) into before_count from public.placement_review_events; raise exception 'Anon read history'; exception when insufficient_privilege then null; end;
  execute 'reset role';
end;
$test$;
rollback;
select 'Review Hub authorization, assignments, audit, transitions, stale edits and owner regressions passed; all test changes rolled back.' as result;
