import { useState, useRef, useMemo, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { 
  Activity, ArrowLeft, Save, CheckCircle2, Clock, User, Building2, 
  Settings, ClipboardCheck, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { uploadImagesToSupabase } from '@/lib/upload';
import { DocumentationUploader, DocImage } from '@/components/DocumentationUploader';
import DigitalSignatureSection, { DigitalSignatureRef } from '@/components/DigitalSignatureSection';
import DashboardLayout from '@/components/DashboardLayout';
import { LiveStatisticsCard } from '@/components/LiveStatisticsCard';

const units = [
  'IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Fatimah', 
  'Ranap Khadijah', 'Ranap Usman', 'Poli Bedah'
];

const bundleConfigs: Record<string, { title: string, checklists: string[] }> = {
  'plabsi-insersi': {
    title: 'Bundles PLABSI Insersi',
    checklists: [
      'Kebersihan tangan dilakukan',
      'Penggunaan APD lengkap (Topi, masker, gaun steril, sarung tangan steril)',
      'Preparasi kulit dengan antiseptik (Chlorhexidine)',
      'Teknik aseptik dipertahankan',
      'Pemilihan lokasi pemasangan kateter yang tepat',
      'Peralatan yang digunakan steril'
    ]
  },
  'plabsi-maintenance': {
    title: 'Bundles PLABSI Maintenance',
    checklists: [
      'Kebersihan tangan sebelum memanipulasi line',
      'Perawatan dressing steril dan tetap utuh',
      'Evaluasi harian kebutuhan kateter',
      'Sistem tertutup (closed system) dipertahankan',
      'Disinfeksi hub sebelum setiap akses'
    ]
  },
  'cauti-insersi': {
    title: 'Bundles CAUTI Insersi',
    checklists: [
      'Terdapat indikasi medis yang jelas',
      'Kebersihan tangan sebelum insersi',
      'Pemasangan dilakukan dengan teknik aseptik',
      'Kateter yang digunakan dalam kondisi steril',
      'Fiksasi kateter dilakukan dengan tepat'
    ]
  },
  'cauti-maintenance': {
    title: 'Bundles CAUTI Maintenance',
    checklists: [
      'Sistem drainase tertutup dipertahankan',
      'Posisi urine bag selalu lebih rendah dari kandung kemih',
      'Tidak ada lekukan (kinking) pada tubing',
      'Kebersihan perineal dijaga',
      'Evaluasi harian kebutuhan kateter'
    ]
  },
  'ido-pre-operasi': {
    title: 'Bundles IDO Pre Operasi',
    checklists: [
      'Kebersihan tangan dilakukan',
      'Profilaksis antibiotik diberikan tepat waktu',
      'Preparasi kulit dengan cairan antiseptik',
      'Tidak ada pencukuran rambut (atau menggunakan clipper listrik)'
    ]
  },
  'ido-intra-operasi': {
    title: 'Bundles IDO Intra Operasi',
    checklists: [
      'Teknik aseptik dipertahankan selama operasi',
      'Sterilitas instrumen terjamin',
      'Standar APD kamar operasi dipatuhi lengkap',
      'Kontrol lingkungan kamar operasi baik'
    ]
  },
  'ido-post-operasi': {
    title: 'Bundles IDO Post Operasi',
    checklists: [
      'Perawatan luka dilakukan secara steril',
      'Edukasi pasien/keluarga terkait perawatan luka',
      'Pemantauan tanda-tanda infeksi pada area luka',
      'Kebersihan tangan sebelum dan setelah menangani luka'
    ]
  },
  'vap-insersi': {
    title: 'Bundles VAP Insersi',
    checklists: [
      'Kebersihan tangan sebelum pemasangan ETT',
      'Teknik aseptik saat proses intubasi',
      'Elevasi posisi kepala (head-up) 30-45 derajat',
      'Penggunaan APD yang sesuai (masker, sarung tangan)'
    ]
  },
  'vap-maintenance': {
    title: 'Bundles VAP Maintenance',
    checklists: [
      'Elevasi posisi kepala (head-up) 30-45 derajat',
      'Kebersihan mulut (oral hygiene) rutin dengan antiseptik',
      'Proses suction dilakukan dengan teknik steril',
      'Evaluasi harian untuk rencana ekstubasi',
      'Pengurasan rutin kondensat tubing ventilator'
    ]
  }
};

type ChecklistOption = 'ya' | 'tidak' | 'na' | null;

export default function BundlesInputForm() {
  const router = useRouter();
  const { bundleId } = router.query;
  const bundleIdStr = typeof bundleId === 'string' ? bundleId : '';
  const config = bundleConfigs[bundleIdStr];

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [unit, setUnit] = useState('');
  const [observer, setObserver] = useState('');
  const [petugasPemasang, setPetugasPemasang] = useState('');
  const [namaPasien, setNamaPasien] = useState('');
  const [noRm, setNoRm] = useState('');
  const [temuan, setTemuan] = useState('');
  const [rekomendasi, setRekomendasi] = useState('');
  const [pjName, setPjName] = useState('');
  const [checklist, setChecklist] = useState<Record<number, ChecklistOption>>({});
  const [images, setImages] = useState<DocImage[]>([]);
  const sigRef = useRef<DigitalSignatureRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setStartTime(new Date());
    if (bundleId && !bundleConfigs[bundleIdStr]) {
      router.push('/dashboard/input/bundles');
    }
  }, [bundleId, bundleIdStr, router]);

  const stats = useMemo(() => {
    let yes = 0;
    let valid = 0;
    if (config) {
      config.checklists.forEach((_, idx) => {
        const val = checklist[idx];
        if (val === 'ya') { yes++; valid++; }
        if (val === 'tidak') { valid++; }
      });
    }
    const cp = valid === 0 ? 0 : Math.round((yes / valid) * 100);
    return { yesCount: yes, validCount: valid, compliance: cp };
  }, [checklist, config]);

  if (!bundleId || !config) return <div className="p-8 text-white">Loading bundle config...</div>;
  const { yesCount, validCount, compliance } = stats;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit || !petugasPemasang || !namaPasien || !noRm) {
      alert('Harap lengkapi field wajib.');
      return;
    }
    const unanswered = config.checklists.findIndex((_, idx) => checklist[idx] === undefined || checklist[idx] === null);
    if (unanswered !== -1) {
      alert('Harap isi semua checklist (Ya/Tidak/NA).');
      return;
    }

    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const uploadedUrls = await uploadImagesToSupabase(supabase, images, 'logos', 'audit');

      const payload = {
        bundle_id: bundleIdStr,
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer, unit,
        petugas_pemasang: petugasPemasang,
        nama_pasien: namaPasien,
        no_rm: noRm,
        checklist_data: checklist,
        compliance_score: compliance,
        nama_pj_ruangan: pjName,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        temuan, rekomendasi,
        created_at: new Date().toISOString(),
        dokumentasi: uploadedUrls
      };

      const sessionPayload = {
        indikator_id: 'audit_bundles_hais',
        nama_indikator: 'AUDIT BUNDLES HAIS - ' + config.title,
        tanggal_waktu: payload.tanggal_waktu,
        observer, unit,
        profesi: null,
        jenis_tindakan: bundleIdStr,
        jumlah_dinilai: validCount,
        jumlah_patuh: yesCount,
        persentase: compliance,
        status_kepatuhan: compliance >= 85 ? 'Patuh' : 'Perlu Perbaikan',
        temuan, rekomendasi,
        nama_pj: pjName,
        nama_pj_ruangan: pjName,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        dokumentasi: uploadedUrls,
        data_indikator: checklist
      };

      const { data: sessionData, error: sessionError } = await supabase.from('audit_sessions').insert([sessionPayload]).select('*').single();
      if (sessionError) throw sessionError;

      const detailPayloads = Object.keys(checklist).map(key => ({
        session_id: sessionData.id,
        pertanyaan_id: key,
        pertanyaan: config.checklists[parseInt(key)],
        jawaban: String(checklist[parseInt(key)])
      }));
      await supabase.from('audit_details').insert(detailPayloads);

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/dashboard/input/bundles');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-32">
       <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 py-6 border-b border-white/5">
        <Link href="/dashboard/input/bundles" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400 uppercase">{config.title}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mt-1">Audit Kepatuhan Bundles HAIs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Waktu Kepatuhan</label>
              <input type="datetime-local" value={startTime ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setStartTime(new Date(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none [color-scheme:dark]" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none">
                <option value="" className="bg-slate-900">Pilih Unit...</option>
                {units.map(u => <option key={u} value={u} className="bg-slate-900">{u}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Observer</label>
              <input type="text" value={observer} onChange={(e) => setObserver(e.target.value)} placeholder="Nama observer..." required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Petugas Pemasang</label>
              <input type="text" value={petugasPemasang} onChange={(e) => setPetugasPemasang(e.target.value)} placeholder="Nama petugas..." required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Nama Pasien</label>
              <input type="text" value={namaPasien} onChange={(e) => setNamaPasien(e.target.value)} placeholder="Nama pasien..." required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">No. Rekam Medis</label>
              <input type="text" value={noRm} onChange={(e) => setNoRm(e.target.value)} placeholder="No RM..." required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 border-b border-white/5 pb-4">Indikator Kepatuhan</h2>
          {config.checklists.map((text, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-300">
                <span className="text-blue-400 font-bold mr-2">{idx + 1}.</span>{text}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {['ya', 'tidak', 'na'].map(choice => (
                  <button key={choice} type="button" onClick={() => setChecklist(prev => ({ ...prev, [idx]: choice as any }))}
                    className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      checklist[idx] === choice 
                        ? (choice === 'ya' ? 'bg-blue-600 text-white' : choice === 'tidak' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white')
                        : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <LiveStatisticsCard totalDinilai={validCount} totalPatuh={yesCount} totalTidakPatuh={validCount - yesCount} persentase={compliance} statusText={compliance >= 85 ? 'Patuh' : 'Perlu Perbaikan'} title="HASIL BUNDLES" />

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>

        <DigitalSignatureSection ref={sigRef} pjName={pjName} setPjName={setPjName} />

        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50">
          {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>Simpan Data Bundles</span>
        </button>
      </form>
    </div>
  );
}

BundlesInputForm.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
