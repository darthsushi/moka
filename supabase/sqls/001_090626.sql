CREATE TYPE public.app_role AS ENUM (
  'admin',       -- Control total de la plataforma
  'moderator',   -- Aprueba anuncios, revisa que no haya contenido indebido
  'advertiser',  -- El que paga por anunciarse.
  'owner',       -- El dueño del espacio.
  'producer'     -- ('installer'). La imprenta, el rotulista o instalador.
);

CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'deleted', 'banned');

-- Anotaciones:
  --Quitar theme, laguage, 
CREATE TABLE public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  roles public.app_role[] not null default '{advertiser}', 
  name text,
  avatar_url text,
  timezone text,
  metadata jsonb default '{}'::jsonb,
  status public.user_status not null default 'active',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Esta función actualiza automáticamente el campo 'updated_at' en cada modificación
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función anterior antes de cualquier UPDATE
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_timestamp();

-- Función que insertará el perfil automáticamente despues de crear uno en la auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la función anterior despues de cualquier INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar la seguridad a nivel de fila (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. La función para leer roles ahora devuelve un arreglo de tu ENUM
CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS public.app_role[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT roles FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "Visibilidad de perfiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR (public.get_user_roles() && ARRAY['admin', 'moderator']::public.app_role[]) 
  OR status NOT IN ('banned'::public.user_status, 'deleted'::public.user_status)
);

CREATE POLICY "Actualización de perfiles" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() = id 
  OR (public.get_user_roles() && ARRAY['admin', 'moderator']::public.app_role[])
);

-- 2. El trigger ahora evalúa usando tu ENUM public.app_role
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger AS $$
BEGIN
  IF NOT (public.get_user_roles() && ARRAY['admin', 'moderator']::public.app_role[]) THEN
    NEW.roles = OLD.roles;
    NEW.status = OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a la tabla profiles
CREATE TRIGGER enforce_profile_protection
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();
-- JULY PLACEMENTS

-- Crear los Tipos (ENUMS)
CREATE TYPE public.placement_type AS ENUM ('UNIPOLE_BILLBOARD', 'HAND_PAINTED_MURAL', 'BARRICADE', 'BUILDING_WRAP');
CREATE TYPE public.placement_visibility AS ENUM ('public', 'private', 'unlisted');
CREATE TYPE public.placement_status AS ENUM ('pending', 'active', 'paused', 'suspended', 'draft', 'deleted');

-- Crear la tabla principal de Placements
CREATE TABLE public.placements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text NOT NULL UNIQUE,
  type public.placement_type not null,
  latitude double precision not null,
  longitude double precision not null,
  structure_height numeric not null,
  structure_width numeric not null,
  location jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  visibility public.placement_visibility not null default 'private',
  status public.placement_status not null default 'draft',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SEGURIDAD RLS (Row Level Security)
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

-- INDEX
CREATE INDEX placements_location_gin_idx
ON public.placements
USING gin (location);

-- SEQUENCE 

CREATE SEQUENCE IF NOT EXISTS public.placement_code_sequence
AS bigint
START WITH 1000;

-- 2. Función que genera el código automáticamente.
CREATE OR REPLACE FUNCTION public.assign_placement_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code_prefix text;
  code_number bigint;
BEGIN
  -- Impedir que el código cambie después de crear el placement.
  IF TG_OP = 'UPDATE' AND OLD.code IS NOT NULL THEN
    NEW.code := OLD.code;
    RETURN NEW;
  END IF;

  -- Obtener el prefijo desde location.isoCode.
  -- Si no existe o está vacío, utilizar OTR.
  code_prefix := upper(
    coalesce(
      nullif(btrim(NEW.location ->> 'isoCode'), ''),
      'OTR'
    )
  );

  -- Validar aproximadamente el formato ISO 3166-2.
  IF code_prefix <> 'OTR'
     AND code_prefix !~ '^[A-Z]{2}-[A-Z0-9]{1,3}$'
  THEN
    code_prefix := 'OTR';
  END IF;

  -- Obtener el siguiente número de manera segura.
  code_number := nextval(
    'public.placement_code_sequence'::regclass
  );

  NEW.code := code_prefix || '-' || code_number::text;

  RETURN NEW;
END;
$$;

-- 4. Generar el código antes de insertar.
-- En las actualizaciones evita que el cliente cambie code.

CREATE TRIGGER assign_placement_code_trigger
BEFORE INSERT OR UPDATE OF code
ON public.placements
FOR EACH ROW
EXECUTE FUNCTION public.assign_placement_code();

-- 5. Evitar que la función y secuencia se invoquen directamente.
REVOKE ALL
ON FUNCTION public.assign_placement_code()
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON SEQUENCE public.placement_code_sequence
FROM PUBLIC, anon, authenticated;

COMMIT;







-- Crear la tabla de las Caras (Faces)
CREATE TABLE public.placement_faces (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid references public.placements(id) on delete cascade not null, -- LIGA CON EL PLACEMENT
  display_width numeric not null,
  display_height numeric not null,
  period_price numeric not null,
  available_periods integer not null check (available_periods >= 1 and available_periods <= 100),
  images text[] not null check (array_length(images, 1) > 0),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SEGURIDAD RLS (Row Level Security)
ALTER TABLE public.placement_faces ENABLE ROW LEVEL SECURITY;

-- Esta función actualiza automáticamente el campo 'updated_at' en cada modificación
CREATE TRIGGER set_placements_updated_at 
BEFORE UPDATE ON public.placements 
FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

CREATE TRIGGER set_placement_faces_updated_at 
BEFORE UPDATE ON public.placement_faces 
FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();


CREATE POLICY "Lectura de placements" 
ON public.placements FOR SELECT 
USING (
  user_id = auth.uid() 
  OR (public.get_user_roles() && ARRAY['admin', 'moderator']::public.app_role[]) 
  OR (
    visibility IN ('public', 'unlisted') 
    AND status = 'active'
  )
);

CREATE POLICY "Actualización de placements" 
ON public.placements FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR (public.get_user_roles() && ARRAY['admin', 'moderator']::public.app_role[])
);

CREATE POLICY "Creación de placements" 
ON public.placements FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (public.get_user_roles() && ARRAY['owner', 'admin']::public.app_role[])
);

CREATE POLICY "Eliminación de placements" 
ON public.placements FOR DELETE 
USING (
  user_id = auth.uid()
  OR (public.get_user_roles() && ARRAY['admin', 'moderator']::public.app_role[])
);


CREATE POLICY "Lectura de faces" 
ON public.placement_faces FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.placements p 
    WHERE p.id = placement_faces.placement_id 
  )
);

CREATE POLICY "Modificación de faces" 
ON public.placement_faces FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.placements p 
    WHERE p.id = placement_faces.placement_id 
    AND (
      (p.user_id = auth.uid() AND (public.get_user_roles() && ARRAY['owner']::public.app_role[]))
      OR (public.get_user_roles() && ARRAY['admin', 'moderator']::public.app_role[])
    )
  )
);


-- BUCKET

CREATE POLICY "Permitir subida a usuarios autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'placements_images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Permitir lectura publica de imagenes"
ON storage.objects FOR SELECT
USING (bucket_id = 'placements_images');

CREATE POLICY "Permitir eliminar imagen a su dueño"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'placements_images' 
  AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

