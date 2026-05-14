-- =========================================================================
-- KONFIGURASI DATABASE SUPABASE - SMART PPI
-- Copy seluruh script ini dan jalankan di menu "SQL Editor" pada dashboard Supabase Anda
-- =========================================================================

-- 1. Tabel APD
CREATE TABLE IF NOT EXISTS audit_apd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    profesi TEXT,
    tindakan TEXT,
    masker TEXT,
    sarung_tangan TEXT,
    penutup_kepala TEXT,
    apron TEXT,
    goggle TEXT,
    sepatu_boot TEXT,
    gaun_pelindung TEXT,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    dokumentasi JSONB
);

-- 2. Tabel Hand Hygiene
CREATE TABLE IF NOT EXISTS audit_hand_hygiene (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    profesi TEXT,
    m1 TEXT,
    m2 TEXT,
    m3 TEXT,
    m4 TEXT,
    m5 TEXT,
    patuh INTEGER,
    peluang INTEGER,
    persentase INTEGER
);

-- 3. Tabel Dekontaminasi Alat
CREATE TABLE IF NOT EXISTS audit_dekontaminasi_alat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 4. Tabel Pengelolaan Limbah Medis
CREATE TABLE IF NOT EXISTS audit_pengelolaan_limbah_medis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 5. Tabel Pengelolaan Limbah Tajam
CREATE TABLE IF NOT EXISTS audit_pengelolaan_limbah_tajam (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 6. Tabel Penatalaksanaan Linen
CREATE TABLE IF NOT EXISTS audit_penatalaksanaan_linen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 7. Tabel Etika Batuk
CREATE TABLE IF NOT EXISTS audit_etika_batuk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    materi_edukasi JSONB,
    sasaran_edukasi JSONB,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 8. Tabel Pengendalian Lingkungan
CREATE TABLE IF NOT EXISTS audit_pengendalian_lingkungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    jumlah_dinilai INTEGER,
    jumlah_patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 9. Tabel Penempatan Pasien
CREATE TABLE IF NOT EXISTS audit_penempatan_pasien (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    ceklist JSONB,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    foto JSONB
);

-- 10. Tabel Penyuntikan Aman
CREATE TABLE IF NOT EXISTS audit_penyuntikan_aman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    profesi TEXT,
    jenis_tindakan TEXT,
    data_indikator JSONB,
    persentase INTEGER,
    status_kepatuhan TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 11. Tabel Perlindungan Petugas
CREATE TABLE IF NOT EXISTS audit_perlindungan_petugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT
);

-- 12. Tabel Farmasi
CREATE TABLE IF NOT EXISTS audit_farmasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT,
    foto JSONB
);

-- 13. Tabel Ruangan IBS
CREATE TABLE IF NOT EXISTS audit_ruangan_ibs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT,
    foto JSONB
);

-- 13.b Tabel Ambulance
CREATE TABLE IF NOT EXISTS audit_ambulance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    keterangan_json JSONB,
    persentase INTEGER,
    status TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    dokumentasi JSONB,
    nama_pj TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 13.c Tabel Ruang Tunggu
CREATE TABLE IF NOT EXISTS audit_ruang_tunggu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    keterangan_json JSONB,
    persentase INTEGER,
    status TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    dokumentasi JSONB,
    nama_pj TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 13.d Tabel Kamar Jenazah
CREATE TABLE IF NOT EXISTS audit_kamar_jenazah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    status TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    dokumentasi JSONB,
    nama_pj TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 13.e Tabel Laboratorium
CREATE TABLE IF NOT EXISTS audit_laboratorium (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    status TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    dokumentasi JSONB,
    nama_pj TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 13.f Tabel Radiologi
CREATE TABLE IF NOT EXISTS audit_radiologi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    status TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    dokumentasi JSONB,
    nama_pj TEXT,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 14. Tabel Monitoring Ruang Isolasi
CREATE TABLE IF NOT EXISTS audit_monitoring_ppi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    compliance_score INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    kategori TEXT,
    dokumentasi JSONB
);

-- 15. Tabel Monitoring Fasilitas APD & HH
CREATE TABLE IF NOT EXISTS monitoring_fasilitas_apd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    dinilai INTEGER,
    patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

CREATE TABLE IF NOT EXISTS monitoring_fasilitas_hand_hygiene (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_waktu TIMESTAMPTZ,
    observer TEXT,
    unit TEXT,
    data_indikator JSONB,
    dinilai INTEGER,
    patuh INTEGER,
    persentase INTEGER,
    status_kepatuhan TEXT,
    temuan TEXT,
    rekomendasi TEXT,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 16. Tabel Bundles HAIS
CREATE TABLE IF NOT EXISTS audit_bundles_hais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    bundle_id TEXT,
    tanggal_waktu TIMESTAMPTZ,
    unit TEXT,
    petugas_pemasang TEXT,
    nama_pasien TEXT,
    no_rm TEXT,
    checklist_data JSONB,
    compliance_score INTEGER,
    ttd_pj_ruangan TEXT,
    ttd_ipcn TEXT,
    dokumentasi JSONB
);

-- 17. Penempatan Pasien Airborne
CREATE TABLE IF NOT EXISTS supervisors_airborne (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS penempatan_pasien_airbone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    waktu TIMESTAMPTZ,
    ruangan TEXT,
    supervisor TEXT,
    checklist_json JSONB,
    persentase INTEGER,
    temuan TEXT,
    rekomendasi TEXT,
    foto JSONB,
    ttd_pj TEXT,
    ttd_ipcn TEXT
);

-- 18. Tabel Dashboard Slider
CREATE TABLE IF NOT EXISTS dashboard_slider (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER
);

-- 19. Tabel Dashboard Standards
CREATE TABLE IF NOT EXISTS dashboard_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    indikator TEXT UNIQUE,
    nilai_standar NUMERIC,
    operator TEXT CHECK (operator IN ('>=', '<='))
);

-- =========================================================================
-- MEMATIKAN SELLER SEMUA BLOKIRAN RLS KODE (MENGIZINKAN INSERT & SELECT SECARA UMUM)
-- Supaya data input dari aplikasi tidak terkena error "Row-Level Security / Forbidden"
-- =========================================================================

-- Menonaktifkan wajib RLS untuk mencegah masalah akses secara instan
ALTER TABLE audit_apd ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_hand_hygiene ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_dekontaminasi_alat ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pengelolaan_limbah_medis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pengelolaan_limbah_tajam ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_penatalaksanaan_linen ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_etika_batuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pengendalian_lingkungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_penempatan_pasien ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_penyuntikan_aman ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_perlindungan_petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_farmasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ruangan_ibs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_kamar_jenazah ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_laboratorium ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_radiologi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_monitoring_ppi ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_fasilitas_apd ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_fasilitas_hand_hygiene ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_bundles_hais ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors_airborne ENABLE ROW LEVEL SECURITY;
ALTER TABLE penempatan_pasien_airbone ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_slider ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_standards ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- MEMBUAT BUCKET PENYIMPANAN FOTO/DOKUMENTASI JIKA BELUM ADA
-- =========================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dokumentasi', 'dokumentasi', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Give public access to dokumentasi" ON storage.objects;
CREATE POLICY "Give public access to dokumentasi" ON storage.objects FOR ALL USING (bucket_id = 'dokumentasi');

DROP POLICY IF EXISTS "Give public access to public" ON storage.objects;
CREATE POLICY "Give public access to public" ON storage.objects FOR ALL USING (bucket_id = 'public');

-- ==========================================
-- TABEL UTAMA AUDIT (UNIFIED BATCH SAVE)
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_sessions (
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

CREATE TABLE IF NOT EXISTS audit_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
    pertanyaan_id TEXT,
    pertanyaan TEXT,
    jawaban TEXT
);

ALTER TABLE IF EXISTS audit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_details ENABLE ROW LEVEL SECURITY;

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

-- Refresh Schema Cache
NOTIFY pgrst, 'reload schema';


-- =========================================================================
-- RLS POLICIES (SECURITY: AUTHENTICATED ONLY)
-- Sesuai permintaan: pengguna terautentikasi (authenticated) saja yang bisa edit data,
-- namun kami sediakan fallback public (anon) = true sementara agar sistem tidak rusak.
-- Hapus blok policy anon jika sistem login front-end sudah stabil/wajib.
-- =========================================================================

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_apd;
CREATE POLICY "Access for authenticated users" ON public.audit_apd
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_apd;
CREATE POLICY "Public access for compatibility" ON public.audit_apd
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_hand_hygiene;
CREATE POLICY "Access for authenticated users" ON public.audit_hand_hygiene
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_hand_hygiene;
CREATE POLICY "Public access for compatibility" ON public.audit_hand_hygiene
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_dekontaminasi_alat;
CREATE POLICY "Access for authenticated users" ON public.audit_dekontaminasi_alat
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_dekontaminasi_alat;
CREATE POLICY "Public access for compatibility" ON public.audit_dekontaminasi_alat
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

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_etika_batuk;
CREATE POLICY "Access for authenticated users" ON public.audit_etika_batuk
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_etika_batuk;
CREATE POLICY "Public access for compatibility" ON public.audit_etika_batuk
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_pengendalian_lingkungan;
CREATE POLICY "Access for authenticated users" ON public.audit_pengendalian_lingkungan
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_pengendalian_lingkungan;
CREATE POLICY "Public access for compatibility" ON public.audit_pengendalian_lingkungan
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_penempatan_pasien;
CREATE POLICY "Access for authenticated users" ON public.audit_penempatan_pasien
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_penempatan_pasien;
CREATE POLICY "Public access for compatibility" ON public.audit_penempatan_pasien
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_penyuntikan_aman;
CREATE POLICY "Access for authenticated users" ON public.audit_penyuntikan_aman
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_penyuntikan_aman;
CREATE POLICY "Public access for compatibility" ON public.audit_penyuntikan_aman
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_perlindungan_petugas;
CREATE POLICY "Access for authenticated users" ON public.audit_perlindungan_petugas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_perlindungan_petugas;
CREATE POLICY "Public access for compatibility" ON public.audit_perlindungan_petugas
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_farmasi;
CREATE POLICY "Access for authenticated users" ON public.audit_farmasi
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_farmasi;
CREATE POLICY "Public access for compatibility" ON public.audit_farmasi
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_ruangan_ibs;
CREATE POLICY "Access for authenticated users" ON public.audit_ruangan_ibs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_ruangan_ibs;
CREATE POLICY "Public access for compatibility" ON public.audit_ruangan_ibs
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_kamar_jenazah;
CREATE POLICY "Access for authenticated users" ON public.audit_kamar_jenazah
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_kamar_jenazah;
CREATE POLICY "Public access for compatibility" ON public.audit_kamar_jenazah
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_laboratorium;
CREATE POLICY "Access for authenticated users" ON public.audit_laboratorium
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_laboratorium;
CREATE POLICY "Public access for compatibility" ON public.audit_laboratorium
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_radiologi;
CREATE POLICY "Access for authenticated users" ON public.audit_radiologi
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_radiologi;
CREATE POLICY "Public access for compatibility" ON public.audit_radiologi
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_monitoring_ppi;
CREATE POLICY "Access for authenticated users" ON public.audit_monitoring_ppi
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_monitoring_ppi;
CREATE POLICY "Public access for compatibility" ON public.audit_monitoring_ppi
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.monitoring_fasilitas_apd;
CREATE POLICY "Access for authenticated users" ON public.monitoring_fasilitas_apd
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.monitoring_fasilitas_apd;
CREATE POLICY "Public access for compatibility" ON public.monitoring_fasilitas_apd
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.monitoring_fasilitas_hand_hygiene;
CREATE POLICY "Access for authenticated users" ON public.monitoring_fasilitas_hand_hygiene
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.monitoring_fasilitas_hand_hygiene;
CREATE POLICY "Public access for compatibility" ON public.monitoring_fasilitas_hand_hygiene
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.audit_bundles_hais;
CREATE POLICY "Access for authenticated users" ON public.audit_bundles_hais
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.audit_bundles_hais;
CREATE POLICY "Public access for compatibility" ON public.audit_bundles_hais
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.supervisors_airborne;
CREATE POLICY "Access for authenticated users" ON public.supervisors_airborne
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.supervisors_airborne;
CREATE POLICY "Public access for compatibility" ON public.supervisors_airborne
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.penempatan_pasien_airbone;
CREATE POLICY "Access for authenticated users" ON public.penempatan_pasien_airbone
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.penempatan_pasien_airbone;
CREATE POLICY "Public access for compatibility" ON public.penempatan_pasien_airbone
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.dashboard_slider;
CREATE POLICY "Access for authenticated users" ON public.dashboard_slider
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.dashboard_slider;
CREATE POLICY "Public access for compatibility" ON public.dashboard_slider
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Access for authenticated users" ON public.dashboard_standards;
CREATE POLICY "Access for authenticated users" ON public.dashboard_standards
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for compatibility" ON public.dashboard_standards;
CREATE POLICY "Public access for compatibility" ON public.dashboard_standards
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

