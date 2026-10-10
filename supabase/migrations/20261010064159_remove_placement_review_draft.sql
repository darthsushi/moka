-- Remove draft from the review workflow without changing owner availability.
-- All former drafts become pending. Withdrawn placements keep that placeholder
-- but remain excluded from inventory/public listings until restored.
SET LOCAL lock_timeout = '5s';
SET LOCAL search_path = public, extensions, pg_catalog;
LOCK TABLE public.placements, public.placement_faces IN ACCESS EXCLUSIVE MODE;

-- Detach only the audited objects that hold references to the old enum.

DROP POLICY "Placements públicos visibles para anónimos" ON "public"."placements";

DROP POLICY "Placements visibles para usuarios autenticados" ON "public"."placements";

DROP POLICY "Caras públicas visibles para anónimos" ON "public"."placement_faces";

DROP POLICY "Caras visibles para usuarios autenticados" ON "public"."placement_faces";

ALTER TABLE public.placements DROP CONSTRAINT placements_withdrawn_not_under_review_check;

DROP INDEX "public"."placements_public_approved_search_trgm_idx";

DROP INDEX "public"."placements_public_approved_geo_gist_idx";

ALTER TABLE public.placements ALTER COLUMN review_status DROP DEFAULT;

-- PostgreSQL cannot drop a single enum label. Cast the column into an enum
-- containing only the remaining labels, mapping draft to pending in the rewrite.
ALTER TYPE public.placement_review_status RENAME TO placement_review_status_with_draft;
CREATE TYPE public.placement_review_status AS ENUM
  ('pending', 'in_review', 'approved', 'suspended', 'rejected');

ALTER TABLE public.placements
  ALTER COLUMN review_status TYPE public.placement_review_status
  USING (
    CASE review_status::text
      WHEN 'draft' THEN 'pending'
      ELSE review_status::text
    END
  )::public.placement_review_status,
  ALTER COLUMN review_status SET DEFAULT 'pending'::public.placement_review_status;

DROP TYPE public.placement_review_status_with_draft;

-- Preserve ownership/team permissions and force restored records into pending.

CREATE OR REPLACE FUNCTION private.guard_placement_state_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_team boolean;
  v_admin boolean;
  v_owner boolean;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  v_team := coalesce((select private.user_has_any_role(
    array['admin'::public.app_role, 'moderator'::public.app_role]
  )), false);
  v_admin := coalesce((select private.user_has_any_role(
    array['admin'::public.app_role]
  )), false);

  if tg_op = 'INSERT' then
    if not v_team and (
      new.owner_status <> 'active'::public.placement_owner_status
      or new.review_status <> 'pending'::public.placement_review_status
    ) then
      raise exception 'Only the review team may set an initial approval state'
        using errcode = '42501';
    end if;
    return new;
  end if;

  v_owner := old.user_id = (select auth.uid());

  if new.user_id is distinct from old.user_id then
    raise exception 'Placement ownership cannot be changed'
      using errcode = '42501';
  end if;

  if new.owner_status is distinct from old.owner_status then
    if not v_owner and not v_admin then
      raise exception 'Only the owner can change availability'
        using errcode = '42501';
    end if;
    if old.owner_status = 'withdrawn'::public.placement_owner_status
       and not v_admin then
      raise exception 'A withdrawn placement requires an admin to restore it'
        using errcode = '42501';
    end if;
    if old.owner_status = 'withdrawn'::public.placement_owner_status
       and new.owner_status <> 'withdrawn'::public.placement_owner_status then
      new.review_status := 'pending'::public.placement_review_status;
    end if;
  end if;

  -- Significant edits to an approved placement require a new review.
  if not v_team
     and old.review_status = 'approved'::public.placement_review_status
     and new.review_status = old.review_status
     and (
       new.type, new.latitude, new.longitude,
       new.structure_height, new.description, new.location,
       new.country, new.state, new.city, new.display_name
     ) is distinct from (
       old.type, old.latitude, old.longitude,
       old.structure_height, old.description, old.location,
       old.country, old.state, old.city, old.display_name
     ) then
    new.review_status := 'pending'::public.placement_review_status;
  end if;

  if new.review_status is distinct from old.review_status and not v_team then
    if not v_owner
       or new.review_status <> 'pending'::public.placement_review_status
       or old.review_status not in (
         'rejected'::public.placement_review_status,
         'approved'::public.placement_review_status
       ) then
      raise exception 'Only the review team can approve, reject or suspend a placement'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.keep_withdrawn_placement_out_of_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'UPDATE'
     and new.owner_status = 'withdrawn'::public.placement_owner_status
     and old.owner_status is distinct from new.owner_status then
    new.review_status := 'pending'::public.placement_review_status;
  end if;

  -- Restoring through any trusted database path still requires a fresh review.
  if tg_op = 'UPDATE'
     and old.owner_status = 'withdrawn'::public.placement_owner_status
     and new.owner_status <> 'withdrawn'::public.placement_owner_status then
    new.review_status := 'pending'::public.placement_review_status;
  end if;

  if new.owner_status = 'withdrawn'::public.placement_owner_status
     and new.review_status <> 'pending'::public.placement_review_status then
    raise exception 'A withdrawn placement cannot be submitted for review'
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

ALTER TABLE public.placements
  ADD CONSTRAINT placements_withdrawn_not_under_review_check
  CHECK (
    owner_status <> 'withdrawn'::public.placement_owner_status
    OR review_status = 'pending'::public.placement_review_status
  );

COMMENT ON COLUMN public.placements.review_status IS
  'MOKA review: pending, in_review, approved, suspended, rejected. Withdrawn placements remain excluded from review listings by owner_status.';

-- Rebind existing RPCs and the face-change trigger to the replacement enum.
-- CREATE OR REPLACE retains their signatures, owners and grants.
DO $rebind$
DECLARE
  function_identity text;
BEGIN
  FOR function_identity IN
    SELECT unnest(ARRAY[
      'private.fetch_unlisted_placement(uuid,uuid)',
      'private.requeue_placement_after_face_change()',
      'get_public_placement_filter_options()',
      'get_public_placement_page_in_view(double precision,double precision,double precision,double precision,integer,timestamp with time zone,uuid,text,text[],text[],jsonb,jsonb,text[])',
      'get_public_placements_in_view(double precision,double precision,double precision,double precision,integer,text,text[],text[],jsonb,jsonb,text[])'
    ]::text[])
  LOOP
    EXECUTE pg_get_functiondef(function_identity::regprocedure);
  END LOOP;
END;
$rebind$;

-- Restore the same publication and ownership rules against the new enum.

CREATE POLICY "Placements públicos visibles para anónimos" ON "public"."placements"
AS PERMISSIVE FOR SELECT TO "anon"
USING (((visibility = 'public'::placement_visibility) AND (owner_status = 'active'::placement_owner_status) AND (review_status = 'approved'::placement_review_status) AND (EXISTS ( SELECT 1
   FROM profiles owner
  WHERE ((owner.id = placements.user_id) AND (owner.status = 'active'::user_status))))));

CREATE POLICY "Placements visibles para usuarios autenticados" ON "public"."placements"
AS PERMISSIVE FOR SELECT TO "authenticated"
USING (((user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT private.user_has_any_role(ARRAY['admin'::app_role, 'moderator'::app_role]) AS user_has_any_role) OR ((visibility = 'public'::placement_visibility) AND (owner_status = 'active'::placement_owner_status) AND (review_status = 'approved'::placement_review_status) AND (EXISTS ( SELECT 1
   FROM profiles owner
  WHERE ((owner.id = placements.user_id) AND (owner.status = 'active'::user_status)))))));

CREATE POLICY "Caras públicas visibles para anónimos" ON "public"."placement_faces"
AS PERMISSIVE FOR SELECT TO "anon"
USING ((EXISTS ( SELECT 1
   FROM placements p
  WHERE ((p.id = placement_faces.placement_id) AND (p.visibility = 'public'::placement_visibility) AND (p.owner_status = 'active'::placement_owner_status) AND (p.review_status = 'approved'::placement_review_status)))));

CREATE POLICY "Caras visibles para usuarios autenticados" ON "public"."placement_faces"
AS PERMISSIVE FOR SELECT TO "authenticated"
USING ((EXISTS ( SELECT 1
   FROM placements p
  WHERE ((p.id = placement_faces.placement_id) AND ((p.user_id = ( SELECT auth.uid() AS uid)) OR ( SELECT private.user_has_any_role(ARRAY['admin'::app_role, 'moderator'::app_role]) AS user_has_any_role) OR ((p.visibility = 'public'::placement_visibility) AND (p.owner_status = 'active'::placement_owner_status) AND (p.review_status = 'approved'::placement_review_status)))))));

-- Rebuild the approved-public search/map indexes with their original predicates.

CREATE INDEX placements_public_approved_search_trgm_idx ON public.placements USING gin (search_text gin_trgm_ops) WHERE ((visibility = 'public'::placement_visibility) AND (owner_status = 'active'::placement_owner_status) AND (review_status = 'approved'::placement_review_status));

CREATE INDEX placements_public_approved_geo_gist_idx ON public.placements USING gist (st_setsrid(st_makepoint(longitude, latitude), 4326)) WHERE ((visibility = 'public'::placement_visibility) AND (owner_status = 'active'::placement_owner_status) AND (review_status = 'approved'::placement_review_status));

ANALYZE public.placements;
NOTIFY pgrst, 'reload schema';
