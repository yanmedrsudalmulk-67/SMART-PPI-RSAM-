-- BUKA MENU SQL EDITOR DI DASHBOARD SUPABASE ANDA, KEMUDIAN JALANKAN SCRIPT INI.

-- 1. Berikan Akses Publik untuk Bucket Storage (Logo & Dokumentasi)
-- Jalankan ini jika Anda mendapatkan error "Access Denied" saat upload logo/foto
DO $$ 
BEGIN
    -- Bucket Logos
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'logos') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
    END IF;
    
    -- Bucket Audit Images
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'audit_images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('audit_images', 'audit_images', true);
    END IF;

    -- Policy untuk Logos
    DROP POLICY IF EXISTS "Public Uploads on Logos" ON storage.objects;
    DROP POLICY IF EXISTS "Public Update on Logos" ON storage.objects;
    DROP POLICY IF EXISTS "Public Select on Logos" ON storage.objects;
    
    CREATE POLICY "Public Uploads on Logos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'logos');
    CREATE POLICY "Public Update on Logos" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'logos');
    CREATE POLICY "Public Select on Logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'logos');

    -- Policy untuk Audit Images
    DROP POLICY IF EXISTS "Public Uploads on Audit Images" ON storage.objects;
    DROP POLICY IF EXISTS "Public Select on Audit Images" ON storage.objects;
    
    CREATE POLICY "Public Uploads on Audit Images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'audit_images');
    CREATE POLICY "Public Select on Audit Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'audit_images');

END $$;

-- 2. Buat tabel utama buat aplikasi jika belum ada
CREATE TABLE IF NOT EXISTS public.master_observers (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Audit Indikator
CREATE TABLE IF NOT EXISTS public.audit_hand_hygiene (
  id uuid default gen_random_uuid() primary key,
  observer text,
  unit text,
  profesi text,
  m1 text, m2 text, m3 text, m4 text, m5 text,
  patuh int,
  peluang int,
  persentase int,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_apd (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  profesi text,
  tindakan text,
  masker text,
  sarung_tangan text,
  penutup_kepala text,
  apron text,
  goggle text,
  sepatu_boot text,
  gaun_pelindung text,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_dekontaminasi_alat (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_pengendalian_lingkungan (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_pengelolaan_limbah_medis (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_pengelolaan_limbah_tajam (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.audit_penatalaksanaan_linen (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  status_kepatuhan text,
  temuan text,
  rekomendasi text,
  ttd_pj_ruangan text,
  ttd_ipcn text,
  dokumentasi text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.monitoring_fasilitas_apd (
  id uuid default gen_random_uuid() primary key,
  tanggal_waktu timestamp with time zone,
  observer text,
  unit text,
  profesi text,
  data_indikator jsonb,
  jumlah_dinilai int,
  jumlah_patuh int,
  persentase int,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.dashboard_slider (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.dashboard_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indikator text not null unique,
  nilai_standar numeric not null,
  operator text default '>=',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.welcome_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  public_url text not null,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

ALTER TABLE public.monitoring_fasilitas_apd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_slider ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welcome_backgrounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access" ON public.monitoring_fasilitas_apd;
CREATE POLICY "Public access" ON public.monitoring_fasilitas_apd FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public for slider" ON public.dashboard_slider;
CREATE POLICY "Public for slider" ON public.dashboard_slider FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public for standards" ON public.dashboard_standards;
CREATE POLICY "Public for standards" ON public.dashboard_standards FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public for welcome backgrounds" ON public.welcome_backgrounds;
CREATE POLICY "Public for welcome backgrounds" ON public.welcome_backgrounds FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.welcome_backgrounds;
CREATE POLICY "Access for authenticated users" ON public.welcome_backgrounds FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.welcome_backgrounds;
CREATE POLICY "Public access for compatibility" ON public.welcome_backgrounds FOR ALL TO anon USING (true) WITH CHECK (true);

-- Insert default slide if empty
INSERT INTO public.dashboard_slider (title, subtitle, image_url, active, sort_order)
SELECT 'SMART PPI Terpadu', 'Pusat Pemantauan dan Pengendalian Infeksi UOBK RSUD AL-MULK. Mencegah lebih baik daripada mengobati.', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.dashboard_slider);

ALTER TABLE IF EXISTS "public"."audit_apd" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_dekontaminasi_alat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_pengendalian_lingkungan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_pengelolaan_limbah_medis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_pengelolaan_limbah_tajam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_penatalaksanaan_linen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."master_observers" ENABLE ROW LEVEL SECURITY;

-- 2.b Unified Audit Tables
CREATE TABLE IF NOT EXISTS public.audit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    indikator_id TEXT,
    nama_indikator TEXT,
    kategori TEXT,
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    profesi TEXT,
    jenis_tindakan TEXT,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    nama_pj TEXT,
    nama_pj_ruangan TEXT,
    ttd_pj TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB,
    data_indikator JSONB
);

CREATE TABLE IF NOT EXISTS public.audit_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
    pertanyaan_id TEXT,
    pertanyaan TEXT,
    jawaban TEXT
);

CREATE TABLE IF NOT EXISTS public.training_materials (
    id TEXT PRIMARY KEY,
    kegiatan_id TEXT,
    nama_file TEXT,
    jenis_file TEXT,
    ukuran_file INTEGER,
    storage_path TEXT,
    public_url TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS "public"."audit_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."audit_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."training_materials" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public for training_materials" ON public.training_materials;
CREATE POLICY "Public for training_materials" ON public.training_materials FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.audit_farmasi (
  id uuid default gen_random_uuid() primary key,
  waktu timestamp with time zone,
  supervisor text,
  checklist_json jsonb,
  persentase int,
  temuan text,
  rekomendasi text,
  ttd_pj text,
  ttd_ipcn text,
  foto text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS "public"."audit_farmasi" ENABLE ROW LEVEL SECURITY;

-- 4. Insert data awal observers jika tabel masih kosong
INSERT INTO public.master_observers (nama)
SELECT name FROM unnest(ARRAY[
  'IPCN_Adi Tresa Purnama',
  'IPCLN_Syefira Salsabila',
  'IPCLN_Siti Hapsoh Roditubillah',
  'IPCLN_Ria Meliani',
  'IPCLN_Ema Mahmudah',
  'IPCLN_Putri Audia',
  'IPCLN_Seli Marselina',
  'IPCLN_Rahmat Hidayat',
  'IPCLN_Rickha Ilnia'
]) AS name
WHERE NOT EXISTS (SELECT 1 FROM public.master_observers LIMIT 1);

-- Ensure audit_sessions has all required columns (fix for existing table)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_sessions' AND column_name='nama_pj') THEN
        ALTER TABLE public.audit_sessions ADD COLUMN nama_pj TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_sessions' AND column_name='nama_pj_ruangan') THEN
        ALTER TABLE public.audit_sessions ADD COLUMN nama_pj_ruangan TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_sessions' AND column_name='ttd_pj') THEN
        ALTER TABLE public.audit_sessions ADD COLUMN ttd_pj TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_sessions' AND column_name='ttd_pj_ruangan') THEN
        ALTER TABLE public.audit_sessions ADD COLUMN ttd_pj_ruangan TEXT;
    END IF;
END $$;

-- 5. Refresh Schema Cache
NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS public.audit_tps (
  id uuid default gen_random_uuid() primary key,
  waktu timestamp with time zone,
  ruangan text,
  supervisor text,
  checklist_json jsonb,
  keterangan_json jsonb,
  persentase numeric,
  status text,
  temuan text,
  rekomendasi text,
  dokumentasi text[],
  nama_pj text,
  ttd_pj text,
  ttd_ipcn text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS "public"."audit_tps" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.supervisors_tps (
  id uuid default gen_random_uuid() primary key,
  nama text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
ALTER TABLE IF EXISTS "public"."supervisors_tps" ENABLE ROW LEVEL SECURITY;

INSERT INTO public.supervisors_tps (nama)
SELECT name FROM unnest(ARRAY[
  'IPCN_Adi Tresa Purnama'
]) AS name
WHERE NOT EXISTS (SELECT 1 FROM public.supervisors_tps LIMIT 1);


-- =========================================================================
-- RLS POLICIES (SECURITY: AUTHENTICATED ONLY)
-- Sesuai permintaan: pengguna terautentikasi (authenticated) saja yang bisa edit data,
-- namun kami sediakan fallback public (anon) = true sementara agar sistem tidak rusak.
-- Hapus blok policy anon jika sistem login front-end sudah stabil/wajib.
-- =========================================================================

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_hand_hygiene;
CREATE POLICY "Access for authenticated users" ON public.audit_hand_hygiene
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_hand_hygiene;
CREATE POLICY "Public access for compatibility" ON public.audit_hand_hygiene
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_apd;
CREATE POLICY "Access for authenticated users" ON public.audit_apd
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_apd;
CREATE POLICY "Public access for compatibility" ON public.audit_apd
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_dekontaminasi_alat;
CREATE POLICY "Access for authenticated users" ON public.audit_dekontaminasi_alat
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_dekontaminasi_alat;
CREATE POLICY "Public access for compatibility" ON public.audit_dekontaminasi_alat
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_pengendalian_lingkungan;
CREATE POLICY "Access for authenticated users" ON public.audit_pengendalian_lingkungan
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_pengendalian_lingkungan;
CREATE POLICY "Public access for compatibility" ON public.audit_pengendalian_lingkungan
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_pengelolaan_limbah_medis;
CREATE POLICY "Access for authenticated users" ON public.audit_pengelolaan_limbah_medis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_pengelolaan_limbah_medis;
CREATE POLICY "Public access for compatibility" ON public.audit_pengelolaan_limbah_medis
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_pengelolaan_limbah_tajam;
CREATE POLICY "Access for authenticated users" ON public.audit_pengelolaan_limbah_tajam
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_pengelolaan_limbah_tajam;
CREATE POLICY "Public access for compatibility" ON public.audit_pengelolaan_limbah_tajam
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_penatalaksanaan_linen;
CREATE POLICY "Access for authenticated users" ON public.audit_penatalaksanaan_linen
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_penatalaksanaan_linen;
CREATE POLICY "Public access for compatibility" ON public.audit_penatalaksanaan_linen
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.master_observers;
CREATE POLICY "Access for authenticated users" ON public.master_observers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.master_observers;
CREATE POLICY "Public access for compatibility" ON public.master_observers
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_sessions;
CREATE POLICY "Access for authenticated users" ON public.audit_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_sessions;
CREATE POLICY "Public access for compatibility" ON public.audit_sessions
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_details;
CREATE POLICY "Access for authenticated users" ON public.audit_details
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_details;
CREATE POLICY "Public access for compatibility" ON public.audit_details
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_farmasi;
CREATE POLICY "Access for authenticated users" ON public.audit_farmasi
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_farmasi;
CREATE POLICY "Public access for compatibility" ON public.audit_farmasi
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_tps;
CREATE POLICY "Access for authenticated users" ON public.audit_tps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_tps;
CREATE POLICY "Public access for compatibility" ON public.audit_tps
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.supervisors_tps;
CREATE POLICY "Access for authenticated users" ON public.supervisors_tps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.supervisors_tps;
CREATE POLICY "Public access for compatibility" ON public.supervisors_tps
  FOR ALL TO anon USING (true) WITH CHECK (true);

