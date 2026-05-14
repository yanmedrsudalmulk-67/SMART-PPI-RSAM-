import { useRef, useState, useEffect, ReactElement } from 'react';
import { useAppContext } from '@/components/Providers';
import { Upload, Trash2, ShieldCheck, Save, Loader2, Hospital, CheckCircle2, Edit3, Plus, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  active: boolean;
  sort_order: number;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'new_1',
    title: 'SMART PPI Terpadu',
    subtitle: 'Pusat Pemantauan dan Pengendalian Infeksi UOBK RSUD AL-MULK. Mencegah lebih baik daripada mengobati.',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600',
    active: true,
    sort_order: 1
  }
];

function SliderSettings() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const { data } = await supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true });
        if (data && data.length > 0) setSlides(data);
        else {
          const stored = localStorage.getItem('spp_slides');
          if (stored) setSlides(JSON.parse(stored));
          else setSlides(DEFAULT_SLIDES);
        }
      } catch(e) {
          const stored = localStorage.getItem('spp_slides');
          if (stored) setSlides(JSON.parse(stored));
          else setSlides(DEFAULT_SLIDES);
      }
    };
    loadSlides();
  }, []);

  const handleUpdate = (idx: number, field: keyof Slide, value: any) => {
    const newSlides = [...slides];
    newSlides[idx] = { ...newSlides[idx], [field]: value };
    setSlides(newSlides);
  };

  const handleImageChange = async (idx: number, file: File) => {
    if (!file || !file.name) return;
    try {
       setMsg({ text: 'Mengunggah gambar...', type: 'info' });
       try { await supabase.storage.createBucket('public', { public: true }); } catch (e) {}

       const ext = file.name.split('.').pop();
       const fileName = `slider/slider_${Date.now()}.${ext}`;
       const { error } = await supabase.storage.from('public').upload(fileName, file, { upsert: true });
       if (error) throw error;

       const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(fileName);
       handleUpdate(idx, 'image_url', publicUrlData.publicUrl);
       setMsg({ text: 'Gambar berhasil diunggah', type: 'success' });
    } catch(err: any) {
       setMsg({ text: `Gagal mengunggah: ${err.message}`, type: 'error' });
       const reader = new FileReader();
       reader.onload = (e) => {
          if (e.target?.result) handleUpdate(idx, 'image_url', e.target.result as string);
       };
       reader.readAsDataURL(file);
    }
  };

  const removeSlide = (idx: number) => {
    const slideToRemove = slides[idx];
    if (!slideToRemove.id.startsWith('new_')) {
      setDeletedIds(prev => [...prev, slideToRemove.id]);
    }
    setSlides(slides.filter((_, i) => i !== idx));
  };

  const saveSettings = async () => {
     setIsSaving(true);
     setMsg({ text: 'Menyimpan konfigurasi slider...', type: 'info' });
     try {
       if (deletedIds.length > 0) {
         await supabase.from('dashboard_slider').delete().in('id', deletedIds);
         setDeletedIds([]);
       }

       const slidesToUpsert = slides.map((s, i) => {
         const { id, ...rest } = s;
         return {
           id: id.startsWith('new_') ? crypto.randomUUID() : id,
           ...rest,
           sort_order: i + 1
         };
       });

       const { error } = await supabase.from('dashboard_slider').upsert(slidesToUpsert);
       if (error) throw error;

       const { data: updatedData } = await supabase.from('dashboard_slider').select('*').order('sort_order', { ascending: true });
       if (updatedData) setSlides(updatedData);

       localStorage.setItem('spp_slides', JSON.stringify(slides));
       setMsg({ text: 'Berhasil menyimpan pengaturan slider!', type: 'success' });
     } catch(e: any) {
       console.error(e);
       localStorage.setItem('spp_slides', JSON.stringify(slides));
       setMsg({ text: `Gagal menyimpan ke cloud: ${e.message}`, type: 'info' });
     }
     setIsSaving(false);
  };

  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-slate-200 dark:border-white/5 mt-8 shadow-sm dark:shadow-none transition-all">
       <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-wide flex items-center gap-2 uppercase">
         <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Slider Hero Dashboard
       </h2>
       
       <div className="space-y-4">
         {slides.map((s, idx) => (
           <div key={s.id} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col md:flex-row gap-4 relative group transition-all">
              <input type="file" accept="image/*" className="hidden" 
                ref={el => { if (el) fileInputRefs.current[s.id] = el; }}
                onChange={e => { if(e.target.files?.[0]) handleImageChange(idx, e.target.files[0]); }}
              />
              <div className="w-full md:w-40 h-28 bg-slate-200 dark:bg-black rounded-xl overflow-hidden relative">
                <Image src={s.image_url} alt="Slide Preview" fill className="object-cover" referrerPolicy="no-referrer" />
                <div onClick={() => fileInputRefs.current[s.id]?.click()} className="absolute flex cursor-pointer inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center backdrop-blur-sm">
                   <div className="text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                     <Edit3 className="w-4 h-4" /> Ubah Gambar
                   </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <input value={s.title} onChange={e => handleUpdate(idx, 'title', e.target.value)} 
                  className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white focus:border-blue-500 outline-none" 
                  placeholder="Judul Slider" 
                />
                <textarea value={s.subtitle} onChange={e => handleUpdate(idx, 'subtitle', e.target.value)} 
                  className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 focus:border-blue-500 outline-none resize-none h-16" 
                  placeholder="Deskripsi" 
                />
              </div>
              <div className="flex flex-col justify-center gap-2">
                 <button onClick={() => handleUpdate(idx, 'active', !s.active)} className={`p-3 rounded-xl transition-colors ${s.active ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                 </button>
                 <button onClick={() => removeSlide(idx)} className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>
           </div>
         ))}
         
         <button onClick={() => setSlides([...slides, { id: 'new_'+Date.now(), title: 'Slide Baru', subtitle: 'Deskripsi slide baru...', image_url: 'https://picsum.photos/seed/slide/1600/900', active: true, sort_order: slides.length+1 }])} 
           className="w-full p-4 border border-dashed border-white/20 rounded-2xl text-slate-400 hover:text-white hover:border-blue-500 transition-all font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2"
         >
            <Plus className="w-5 h-5" /> Tambah Slider
         </button>
       </div>

       <div className="mt-8 flex items-center justify-between">
          <p className={`text-[11px] font-bold tracking-wide ${msg.type === 'error' ? 'text-red-400' : msg.type==='success' ? 'text-green-400' : 'text-blue-400'}`}>
            {msg.text}
          </p>
          <button onClick={saveSettings} disabled={isSaving} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
       </div>
    </div>
  );
}

export default function SettingsPage() {
  const { appLogoUrl, setAppLogoUrl, hospitalLogoUrl, setHospitalLogoUrl } = useAppContext();
  
  const appLogoRef = useRef<HTMLInputElement>(null);
  const hospitalLogoRef = useRef<HTMLInputElement>(null);
  
  const [selectedAppFile, setSelectedAppFile] = useState<File | null>(null);
  const [selectedHospitalFile, setSelectedHospitalFile] = useState<File | null>(null);
  
  const [isUploadingApp, setIsUploadingApp] = useState(false);
  const [isUploadingHospital, setIsUploadingHospital] = useState(false);
  
  const [appMsg, setAppMsg] = useState({ text: '', type: '' });
  const [hospitalMsg, setHospitalMsg] = useState({ text: '', type: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'app' | 'hospital') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'app') {
        setSelectedAppFile(file);
        setAppLogoUrl(url);
        setAppMsg({ text: '', type: '' });
      } else {
        setSelectedHospitalFile(file);
        setHospitalLogoUrl(url);
        setHospitalMsg({ text: '', type: '' });
      }
    }
  };

  const handleSave = async (type: 'app' | 'hospital') => {
    const file = type === 'app' ? selectedAppFile : selectedHospitalFile;
    if (!file) return;
    
    const setMsg = type === 'app' ? setAppMsg : setHospitalMsg;
    const setIsUploading = type === 'app' ? setIsUploadingApp : setIsUploadingHospital;
    const setContextUrl = type === 'app' ? setAppLogoUrl : setHospitalLogoUrl;
    
    setIsUploading(true);
    setMsg({ text: `Mengunggah logo...`, type: 'info' });
    
    try {
      const fileName = type === 'app' ? 'app_logo.png' : 'hospital_logo.png';
      const filePath = `public/${fileName}`;

      try { await supabase.storage.createBucket('logos', { public: true }); } catch (e) {}
      
      const { error } = await supabase.storage.from('logos').upload(filePath, file, { upsert: true, contentType: file.type || 'image/png' });
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(filePath);
      const finalUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      setContextUrl(finalUrl);
      
      if (type === 'app') setSelectedAppFile(null);
      else setSelectedHospitalFile(null);
      setMsg({ text: `Logo berhasil disimpan!`, type: 'success' });
      
    } catch (err: any) {
      console.error(err);
      setMsg({ text: `Gagal menyimpan: ${err.message}`, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-32">
      <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-white/5 transition-all">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase">Pengaturan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Kelola preferensi dan tampilan aplikasi SMART-PPI</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-all">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-wide flex items-center gap-2 uppercase">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Logo Aplikasi
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-8 text-slate-700 dark:text-white">
          <div className="relative w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/5 overflow-hidden shrink-0 shadow-inner group hover:border-blue-500 transition-all">
            {appLogoUrl ? (
              <Image src={appLogoUrl} alt="Logo" fill className="object-contain p-4" referrerPolicy="no-referrer" />
            ) : (
              <ShieldCheck className="w-12 h-12 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
            )}
          </div>
          <div className="space-y-4 flex-1">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Ubah logo aplikasi utama (Sidebar & Laporan).
            </p>
            <div className="flex flex-wrap gap-4">
              <input type="file" accept="image/*" className="hidden" ref={appLogoRef} onChange={(e) => handleFileChange(e, 'app')} />
              <button onClick={() => appLogoRef.current?.click()} className="px-6 py-3 bg-white dark:bg-white/10 text-slate-700 dark:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/20 transition-all flex items-center gap-2 border border-slate-200 dark:border-white/10">
                <Upload className="w-4 h-4" /> Pilih Logo
              </button>
              {selectedAppFile && (
                <button onClick={() => handleSave('app')} disabled={isUploadingApp} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 disabled:opacity-50">
                  {isUploadingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUploadingApp ? 'Menyimpan...' : 'Simpan Logo'}
                </button>
              )}
            </div>
            {appMsg.text && (
              <p className={`text-[10px] font-bold uppercase tracking-widest ${appMsg.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {appMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-all">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 tracking-wide flex items-center gap-2 uppercase">
          <Hospital className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Logo Rumah Sakit
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-8 text-slate-700 dark:text-white">
          <div className="relative w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/5 overflow-hidden shrink-0 shadow-inner group hover:border-blue-500 transition-all">
            {hospitalLogoUrl ? (
              <Image src={hospitalLogoUrl} alt="Logo" fill className="object-contain p-4" referrerPolicy="no-referrer" />
            ) : (
              <Hospital className="w-12 h-12 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
            )}
          </div>
          <div className="space-y-4 flex-1">
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Ubah logo Rumah Sakit (Welcome Screen).
            </p>
            <div className="flex flex-wrap gap-4">
              <input type="file" accept="image/*" className="hidden" ref={hospitalLogoRef} onChange={(e) => handleFileChange(e, 'hospital')} />
              <button onClick={() => hospitalLogoRef.current?.click()} className="px-6 py-3 bg-white dark:bg-white/10 text-slate-700 dark:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/20 transition-all flex items-center gap-2 border border-slate-200 dark:border-white/10">
                <Upload className="w-4 h-4" /> Pilih Logo RS
              </button>
              {selectedHospitalFile && (
                <button onClick={() => handleSave('hospital')} disabled={isUploadingHospital} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 disabled:opacity-50">
                  {isUploadingHospital ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isUploadingHospital ? 'Menyimpan...' : 'Simpan Logo RS'}
                </button>
              )}
            </div>
            {hospitalMsg.text && (
              <p className={`text-[10px] font-bold uppercase tracking-widest ${hospitalMsg.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {hospitalMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      <SliderSettings />

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-all">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Versi Aplikasi</div>
            <div className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">v2.1.0-enterprise</div>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lisensi</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wide">RSUD Nasional (Aktif)</div>
          </div>
          <div className="flex items-center justify-between pb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Terakhir Diperbarui</div>
            <div className="text-sm font-bold text-slate-800 dark:text-white tracking-wide">14 April 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}

SettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
