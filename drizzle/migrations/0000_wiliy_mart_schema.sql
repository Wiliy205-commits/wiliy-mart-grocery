
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  unit text,
  price integer NOT NULL CHECK (price >= 0),
  compare_at_price integer CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  is_sample boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sold_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TYPE public.order_status AS ENUM ('pending','processing','shipped','completed','cancelled');
CREATE TYPE public.payment_method AS ENUM ('cod','bank_transfer');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid,
  customer_name text NOT NULL,
  whatsapp text NOT NULL,
  address text NOT NULL,
  notes text,
  payment_method public.payment_method NOT NULL,
  payment_verified boolean NOT NULL DEFAULT false,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal integer NOT NULL,
  total integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total integer NOT NULL
);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
    AND (public.has_role(auth.uid(), 'admin') OR o.user_id = auth.uid())));

-- Secure order placement: validates, prices on server, decrements stock atomically.
CREATE OR REPLACE FUNCTION public.place_order(
  _customer_name text, _whatsapp text, _address text, _notes text,
  _payment_method public.payment_method, _items jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _order_id uuid;
  _order_number text;
  _subtotal integer := 0;
  _item jsonb;
  _p public.products%ROWTYPE;
  _qty integer;
  _lines jsonb := '[]'::jsonb;
BEGIN
  IF length(trim(coalesce(_customer_name,''))) < 2 OR length(_customer_name) > 100 THEN
    RAISE EXCEPTION 'Nama tidak valid';
  END IF;
  IF coalesce(_whatsapp,'') !~ '^(\+62|62|0)8[0-9]{7,12}$' THEN
    RAISE EXCEPTION 'Nomor WhatsApp tidak valid';
  END IF;
  IF length(trim(coalesce(_address,''))) < 10 OR length(_address) > 500 THEN
    RAISE EXCEPTION 'Alamat tidak valid';
  END IF;
  IF length(coalesce(_notes,'')) > 500 THEN RAISE EXCEPTION 'Catatan terlalu panjang'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Keranjang kosong atau tidak valid';
  END IF;

  _order_number := 'WM-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));
  INSERT INTO public.orders (order_number, user_id, customer_name, whatsapp, address, notes, payment_method, subtotal, total)
  VALUES (_order_number, auth.uid(), trim(_customer_name), _whatsapp, trim(_address), nullif(trim(coalesce(_notes,'')),''), _payment_method, 0, 0)
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::integer;
    IF _qty IS NULL OR _qty < 1 OR _qty > 999 THEN RAISE EXCEPTION 'Jumlah tidak valid'; END IF;
    SELECT * INTO _p FROM public.products WHERE id = (_item->>'product_id')::uuid AND is_active FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produk tidak ditemukan'; END IF;
    IF _p.stock < _qty THEN RAISE EXCEPTION 'Stok % tidak mencukupi (tersisa %)', _p.name, _p.stock; END IF;
    UPDATE public.products SET stock = stock - _qty, sold_count = sold_count + _qty WHERE id = _p.id;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    VALUES (_order_id, _p.id, _p.name, _p.price, _qty, _p.price * _qty);
    _subtotal := _subtotal + _p.price * _qty;
    _lines := _lines || jsonb_build_object('name', _p.name, 'quantity', _qty, 'unit_price', _p.price, 'line_total', _p.price * _qty);
  END LOOP;

  UPDATE public.orders SET subtotal = _subtotal, total = _subtotal WHERE id = _order_id;
  RETURN jsonb_build_object('order_number', _order_number, 'subtotal', _subtotal, 'total', _subtotal,
    'payment_method', _payment_method, 'customer_name', trim(_customer_name), 'items', _lines);
END $$;
REVOKE ALL ON FUNCTION public.place_order FROM public;
GRANT EXECUTE ON FUNCTION public.place_order TO anon, authenticated;

-- Admin cancel restores stock
CREATE OR REPLACE FUNCTION public.restock_on_cancel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.products p SET stock = p.stock + oi.quantity, sold_count = greatest(0, p.sold_count - oi.quantity)
    FROM public.order_items oi WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  ELSIF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Pesanan yang dibatalkan tidak bisa diaktifkan kembali';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_restock AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restock_on_cancel();

-- Storage policies
CREATE POLICY "product images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "product images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
('Makanan','makanan','Lauk siap saji dan bahan makanan harian',1),
('Minuman','minuman','Kopi, teh, air mineral dan minuman lainnya',2),
('Sembako','sembako','Beras, gula, minyak dan kebutuhan pokok',3),
('Mi Instan','mi-instan','Aneka mi instan favorit keluarga',4),
('Makanan Ringan','makanan-ringan','Camilan untuk santai dan berbagi',5),
('Kebutuhan Rumah Tangga','kebutuhan-rumah-tangga','Perlengkapan kebersihan dan rumah',6);

-- Seed SAMPLE products (is_sample = true)
INSERT INTO public.products (category_id, name, slug, description, unit, price, compare_at_price, stock, image_url, is_sample, is_featured, sold_count) VALUES
((SELECT id FROM public.categories WHERE slug='mi-instan'),'Indomie Goreng','indomie-goreng','Mi instan goreng dengan bumbu khas, praktis untuk sarapan atau makan malam. (Produk contoh)','1 bungkus 85 g',3500,NULL,120,'/images/products/mi-goreng.jpg',true,true,340),
((SELECT id FROM public.categories WHERE slug='sembako'),'Gula Pasir 1 Kg','gula-pasir-1kg','Gula pasir putih kristal, cocok untuk minuman dan masakan. (Produk contoh)','1 kg',18000,19500,60,'/images/products/gula-pasir.jpg',true,true,210),
((SELECT id FROM public.categories WHERE slug='sembako'),'Minyak Goreng 1 Liter','minyak-goreng-1l','Minyak goreng sawit jernih untuk menggoreng dan menumis. (Produk contoh)','1 liter',19000,21000,45,'/images/products/minyak-goreng.jpg',true,true,190),
((SELECT id FROM public.categories WHERE slug='sembako'),'Beras 1 Kg','beras-1kg','Beras putih pulen pilihan untuk nasi sehari-hari. (Produk contoh)','1 kg',15000,NULL,80,'/images/products/beras.jpg',true,false,260),
((SELECT id FROM public.categories WHERE slug='minuman'),'Kopi Bubuk','kopi-bubuk','Kopi bubuk robusta dengan aroma kuat dan rasa mantap. (Produk contoh)','200 g',24000,NULL,30,'/images/products/kopi.jpg',true,false,95),
((SELECT id FROM public.categories WHERE slug='minuman'),'Teh Celup','teh-celup','Teh hitam celup isi 25 kantong, harum dan menyegarkan. (Produk contoh)','25 kantong',8500,NULL,50,'/images/products/teh.jpg',true,false,120),
((SELECT id FROM public.categories WHERE slug='minuman'),'Air Mineral 600 ml','air-mineral-600ml','Air mineral murni dalam kemasan botol 600 ml. (Produk contoh)','600 ml',4000,NULL,200,'/images/products/air-mineral.jpg',true,false,410),
((SELECT id FROM public.categories WHERE slug='makanan-ringan'),'Keripik Kentang','keripik-kentang','Snack keripik kentang renyah rasa original. (Produk contoh)','68 g',11000,12500,0,'/images/products/snack.jpg',true,false,75),
((SELECT id FROM public.categories WHERE slug='kebutuhan-rumah-tangga'),'Sabun Cuci Piring','sabun-cuci-piring','Sabun cuci piring cair, ampuh mengangkat lemak. Bonus spons. (Produk contoh)','400 ml',13500,NULL,8,'/images/products/sabun-cuci.jpg',true,false,40);
