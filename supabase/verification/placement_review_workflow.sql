-- Regression checks for the placement review workflow.
-- Run against a populated MOKA database as postgres. Requires existing approved
-- and withdrawn placements, one placement face, and an admin profile.
-- All row edits and temporary objects are rolled back; no code sequence is used.

BEGIN;
SET LOCAL statement_timeout = '60s';
CREATE TEMP TABLE review_behavior_baseline ON COMMIT DROP AS
SELECT id, to_jsonb(p) AS fields FROM public.placements p;
CREATE TEMP TABLE review_default_probe (LIKE public.placements INCLUDING DEFAULTS INCLUDING CONSTRAINTS) ON COMMIT DROP;
CREATE TRIGGER guard_review_default_probe BEFORE INSERT OR UPDATE ON review_default_probe
FOR EACH ROW EXECUTE FUNCTION private.guard_placement_state_changes();
CREATE TRIGGER withdrawn_review_default_probe BEFORE INSERT OR UPDATE ON review_default_probe
FOR EACH ROW EXECUTE FUNCTION private.keep_withdrawn_placement_out_of_review();
GRANT SELECT, INSERT, UPDATE ON review_default_probe TO authenticated;

DO $test$
DECLARE
  approved_id uuid;
  owner_id uuid;
  withdrawn_id uuid;
  withdrawn_owner uuid;
  admin_id uuid;
  face_id uuid;
  face_placement uuid;
  face_owner uuid;
  column_list text;
  actual_status text;
  expected_public_count bigint;
BEGIN
  SELECT p.id, p.user_id INTO STRICT approved_id, owner_id
  FROM public.placements p JOIN public.profiles pr ON pr.id=p.user_id
  WHERE p.owner_status='active' AND p.review_status='approved'
    AND NOT (pr.roles && ARRAY['admin'::public.app_role,'moderator'::public.app_role])
  ORDER BY p.id LIMIT 1;
  SELECT id,user_id INTO STRICT withdrawn_id,withdrawn_owner
  FROM public.placements WHERE owner_status='withdrawn' ORDER BY id LIMIT 1;
  SELECT id INTO STRICT admin_id FROM public.profiles
  WHERE roles @> ARRAY['admin'::public.app_role] ORDER BY id LIMIT 1;
  SELECT count(*) INTO expected_public_count FROM public.placements p
  JOIN public.profiles pr ON pr.id=p.user_id
  WHERE p.visibility='public' AND p.owner_status='active' AND p.review_status='approved' AND pr.status='active';

  SELECT string_agg(format('%I',attname),',' ORDER BY attnum) INTO column_list
  FROM pg_attribute WHERE attrelid='public.placements'::regclass
    AND attnum>0 AND NOT attisdropped AND attname<>'review_status';

  PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  EXECUTE format('INSERT INTO review_default_probe (%s) SELECT %s FROM public.placements WHERE id=$1',column_list,column_list)
  USING approved_id;
  SELECT review_status::text INTO actual_status FROM review_default_probe WHERE id=approved_id;
  IF actual_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Default/insert is not pending'; END IF;
  BEGIN
    UPDATE review_default_probe SET review_status='approved' WHERE id=approved_id;
    RAISE EXCEPTION 'Owner was allowed to self-approve';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  EXECUTE 'RESET ROLE';

  BEGIN
    PERFORM 'draft'::public.placement_review_status;
    RAISE EXCEPTION 'Removed draft enum value was accepted';
  EXCEPTION WHEN invalid_text_representation THEN NULL;
  END;

  BEGIN
    PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE public.placements SET description=coalesce(description,'')||' review regression check'
    WHERE id=approved_id RETURNING review_status::text INTO actual_status;
    IF actual_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Significant edit did not requeue'; END IF;
    RAISE EXCEPTION 'Rollback test' USING errcode='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE public.placements SET owner_status='withdrawn' WHERE id=approved_id
    RETURNING review_status::text INTO actual_status;
    IF actual_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Withdrawal did not reset review to pending'; END IF;
    RAISE EXCEPTION 'Rollback test' USING errcode='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    PERFORM set_config('request.jwt.claim.sub',withdrawn_owner::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',withdrawn_owner,'role','authenticated')::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE public.placements SET owner_status='active' WHERE id=withdrawn_id;
    RAISE EXCEPTION 'Owner was allowed to restore a withdrawn placement';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE public.placements SET owner_status='active',review_status='approved' WHERE id=withdrawn_id
    RETURNING review_status::text INTO actual_status;
    IF actual_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Admin restoration bypassed pending'; END IF;
    RAISE EXCEPTION 'Rollback test' USING errcode='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    UPDATE public.placements SET owner_status='active',review_status='approved' WHERE id=withdrawn_id
    RETURNING review_status::text INTO actual_status;
    IF actual_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Trusted restoration bypassed pending'; END IF;
    RAISE EXCEPTION 'Rollback test' USING errcode='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  BEGIN
    PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE public.placements SET review_status='approved' WHERE id=withdrawn_id;
    RAISE EXCEPTION 'A withdrawn placement was allowed into an approved state';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    UPDATE public.placements SET review_status='rejected' WHERE id=approved_id;
    PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE public.placements SET review_status='pending' WHERE id=approved_id
    RETURNING review_status::text INTO actual_status;
    IF actual_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Rejected owner resubmission failed'; END IF;
    RAISE EXCEPTION 'Rollback test' USING errcode='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  SELECT f.id,p.id,p.user_id INTO STRICT face_id,face_placement,face_owner
  FROM public.placement_faces f JOIN public.placements p ON p.id=f.placement_id
  WHERE p.owner_status='active' AND p.review_status='approved'
  ORDER BY f.id LIMIT 1;
  BEGIN
    PERFORM set_config('request.jwt.claim.sub',face_owner::text,true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',face_owner,'role','authenticated')::text,true);
    EXECUTE 'SET LOCAL ROLE authenticated';
    UPDATE public.placement_faces SET period_price=period_price WHERE id=face_id;
    SELECT review_status::text INTO actual_status FROM public.placements WHERE id=face_placement;
    IF actual_status IS DISTINCT FROM 'pending' THEN RAISE EXCEPTION 'Face edit did not requeue the parent'; END IF;
    RAISE EXCEPTION 'Rollback test' USING errcode='ZX001';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub','',true);
  PERFORM set_config('request.jwt.claims','{}',true);
  EXECUTE 'SET LOCAL ROLE anon';
  IF (SELECT count(*) FROM public.placements) <> expected_public_count THEN
    RAISE EXCEPTION 'Anonymous placement visibility changed';
  END IF;
  IF EXISTS (SELECT 1 FROM public.placements WHERE owner_status<>'active' OR review_status<>'approved') THEN
    RAISE EXCEPTION 'Anonymous users can see an unpublished placement';
  END IF;
  PERFORM count(*) FROM public.placement_faces;
  PERFORM public.get_public_placement_filter_options();
  PERFORM count(*) FROM public.get_public_placements_in_view(-90,-180,90,180);
  PERFORM count(*) FROM public.get_public_placement_page_in_view(-90,-180,90,180);
  EXECUTE 'RESET ROLE';

  IF EXISTS (
    SELECT 1 FROM review_behavior_baseline b FULL JOIN public.placements p USING (id)
    WHERE b.id IS NULL OR p.id IS NULL OR b.fields IS DISTINCT FROM to_jsonb(p)
  ) THEN
    RAISE EXCEPTION 'A regression test left modified placement data';
  END IF;
END;
$test$;
ROLLBACK;
