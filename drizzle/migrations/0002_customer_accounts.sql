ALTER TABLE public.profiles ADD COLUMN username text, ADD COLUMN email text, ADD COLUMN phone text, ADD COLUMN avatar_url text, ADD COLUMN birth_date date, ADD COLUMN gender text, ADD COLUMN bio text, ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles(lower(username));
ALTER TABLE public.profiles ADD CONSTRAINT username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,30}$');
UPDATE public.profiles p SET email=u.email FROM auth.users u WHERE u.id=p.id;
CREATE TABLE public.addresses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, recipient_name text NOT NULL, phone text NOT NULL, label text NOT NULL DEFAULT 'Rumah', province text NOT NULL, city text NOT NULL, district text NOT NULL, village text NOT NULL, postal_code text NOT NULL, full_address text NOT NULL, notes text, is_default boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY addresses_own ON public.addresses FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY addresses_admin_read ON public.addresses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE UNIQUE INDEX addresses_one_default ON public.addresses(user_id) WHERE is_default;
CREATE POLICY profiles_admin_read ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
INSERT INTO public.profiles(id,full_name,username,email,phone,birth_date) VALUES(NEW.id,NEW.raw_user_meta_data->>'full_name',nullif(lower(NEW.raw_user_meta_data->>'username'),''),NEW.email,NEW.raw_user_meta_data->>'phone',nullif(NEW.raw_user_meta_data->>'birth_date','')::date);
INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'user'); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.sync_profile_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.profiles SET email=NEW.email,updated_at=now() WHERE id=NEW.id; RETURN NEW; END $$;
CREATE TRIGGER account_email_sync AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();
CREATE OR REPLACE FUNCTION public.validate_profile() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.birth_date > current_date THEN RAISE EXCEPTION 'Tanggal lahir tidak valid'; END IF;
IF TG_OP='UPDATE' AND current_user='authenticated' AND NEW.email IS DISTINCT FROM OLD.email THEN RAISE EXCEPTION 'Ubah email melalui verifikasi akun'; END IF;
NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER profile_validation BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_profile();
CREATE OR REPLACE FUNCTION public.set_default_address(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
PERFORM 1 FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
IF NOT EXISTS(SELECT 1 FROM public.addresses WHERE id=_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Alamat tidak ditemukan'; END IF;
UPDATE public.addresses SET is_default=false WHERE user_id=auth.uid() AND is_default;
UPDATE public.addresses SET is_default=true WHERE id=_id AND user_id=auth.uid(); END $$;
REVOKE ALL ON FUNCTION public.set_default_address(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.set_default_address(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.login_email_for_username(_username text) RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT u.email FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE p.username=lower(_username) $$;
REVOKE ALL ON FUNCTION public.login_email_for_username(text) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.login_email_for_username(text) TO service_role;
CREATE POLICY avatars_read_own ON storage.objects FOR SELECT TO authenticated USING(bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY avatars_insert_own ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text AND owner_id=auth.uid()::text);
CREATE POLICY avatars_update_own ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text AND owner_id=auth.uid()::text) WITH CHECK(bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text AND owner_id=auth.uid()::text);
CREATE POLICY avatars_delete_own ON storage.objects FOR DELETE TO authenticated USING(bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text AND owner_id=auth.uid()::text);