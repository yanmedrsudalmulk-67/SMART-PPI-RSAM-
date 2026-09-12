import { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, CheckCircle2, Loader2, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Background {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  public_url: string;
  is_active: boolean;
  created_at: string;
}

export default function WelcomeBackgroundSettings() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({ text: '', type: 'info' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('welcome_backgrounds').select('*').order('created_at', { ascending: false });
      if (error) {
        if (error.code === '42P01') {
          setMsg({ text: 'Tabel welcome_backgrounds belum dibuat di database.', type: 'error' });
        } else {
          throw error;
        }
      }
      if (data) setBackgrounds(data);
    } catch (err: any) {
      console.error(err);
      setMsg({ text: err.message || 'Gagal memuat data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
       setMsg({ text: 'Format tidak didukung. Gunakan gambar atau video.', type: 'error' });
       return;
    }

    if (isImage && file.size > 3 * 1024 * 1024) {
      setMsg({ text: 'Ukuran gambar maksimal 3 MB', type: 'error' });
      return;
    }

    setIsUploading(true);
    setMsg({ text: 'Mengunggah file...', type: 'info' });

    try {
      try {
        await supabase.storage.createBucket('public', { public: true });
      } catch (e) {
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `welcome-background/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('public')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      await supabase.from('welcome_backgrounds').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');

      const { error: dbError } = await supabase.from('welcome_backgrounds').insert([
        {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          public_url: publicUrl,
          is_active: true
        }
      ]);

      if (dbError) throw dbError;

      setMsg({ text: 'Background berhasil diunggah', type: 'success' });
      fetchBackgrounds();
    } catch (err: any) {
      console.error(err);
      if (err.code === '42P01') {
         setMsg({ text: 'Tabel welcome_backgrounds belum ada di Supabase.', type: 'error'});
      } else {
         setMsg({ text: err.message || 'Gagal mengunggah file', type: 'error' });
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const executeDelete = async (bg: Background) => {
    setIsLoading(true);
    setMsg({ text: 'Menghapus background...', type: 'info' });
    try {
      // Extract storage path safely
      let storagePath: string | null = null;
      try {
        const match = bg.public_url.match(/welcome-background\/[^?#]+/);
        if (match) {
          storagePath = match[0];
        } else {
          const url = new URL(bg.public_url);
          const pathParts = url.pathname.split('/');
          const fileName = pathParts[pathParts.length - 1];
          if (fileName) storagePath = `welcome-background/${fileName}`;
        }
      } catch (e) {
        // url parse fallback
      }

      if (storagePath) {
        await supabase.storage.from('public').remove([storagePath]);
      }
      
      const { error } = await supabase.from('welcome_backgrounds').delete().eq('id', bg.id);
      
      if (error) throw error;
      setMsg({ text: 'Background berhasil dihapus', type: 'success' });
      setConfirmDeleteId(null);
      fetchBackgrounds();
    } catch (err: any) {
      console.error(err);
      setMsg({ text: err.message || 'Gagal menghapus background', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const setAsActive = async (id: string) => {
    setIsLoading(true);
    setMsg({ text: 'Mengaktifkan background...', type: 'info' });
    try {
      await supabase.from('welcome_backgrounds').update({ is_active: false }).neq('id', id);
      const { error } = await supabase.from('welcome_backgrounds').update({ is_active: true }).eq('id', id);
      if (error) throw error;
      setMsg({ text: 'Background berhasil diaktifkan', type: 'success' });
      fetchBackgrounds();
    } catch (err: any) {
      console.error(err);
      setMsg({ text: err.message || 'Gagal mengubah background', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-sm p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-all my-8">
      <div className="flex items-center justify-between mx-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-wide flex items-center gap-2 uppercase">
            <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Pengaturan Background Welcome Page
          </h2>
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Kelola gambar dan video latar belakang halaman depan
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {msg.text && (
            <p className={`text-[10px] font-bold uppercase tracking-widest ${msg.type === 'error' ? 'text-red-500' : msg.type === 'success' ? 'text-emerald-500' : 'text-blue-500'}`}>
              {msg.text}
            </p>
          )}
          <input
            type="file"
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Mengunggah...' : 'Upload Background'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {backgrounds.map((bg) => (
          <div key={bg.id} className={`group relative rounded-3xl overflow-hidden border-2 transition-all flex flex-col bg-slate-900/40 ${bg.is_active ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
            {/* Visual media preview container */}
            <div className="aspect-video bg-black/40 relative flex items-center justify-center overflow-hidden">
              {bg.file_type.startsWith('video/') ? (
                <video
                  key={bg.public_url}
                  autoPlay
                  muted
                  playsInline
                  loop
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    e.currentTarget.muted = true;
                    e.currentTarget.play().catch(() => {});
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                >
                  <source src={bg.public_url} type={bg.file_type} />
                </video>
              ) : (
                <img src={bg.public_url} alt={bg.file_name} className="w-full h-full object-cover" />
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2 z-10 pointer-events-none">
                {bg.file_type.startsWith('video/') ? (
                  <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Video className="w-3 h-3 text-cyan-400" /> Video
                  </span>
                ) : (
                  <span className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <ImageIcon className="w-3 h-3 text-emerald-400" /> Image
                  </span>
                )}
                {bg.is_active && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                )}
              </div>

              {/* Inline Delete Confirmation Overlay */}
              {confirmDeleteId === bg.id && (
                <div className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col items-center justify-center p-4 text-center backdrop-blur-md">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2 animate-bounce" />
                  <p className="text-white text-xs font-bold mb-1">Hapus background ini?</p>
                  <p className="text-slate-400 text-[10px] mb-3 truncate max-w-[220px]">{bg.file_name}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => executeDelete(bg)}
                      disabled={isLoading}
                      className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={isLoading}
                      className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Card Footer with Info and Direct Action Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-slate-800 dark:text-white text-xs font-semibold truncate" title={bg.file_name}>
                  {bg.file_name}
                </p>
                <p className="text-slate-400 dark:text-slate-400 text-[10px] tracking-wider mt-0.5">
                  {(bg.file_size / (1024 * 1024)).toFixed(2)} MB • {new Date(bg.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!bg.is_active && (
                  <button
                    type="button"
                    onClick={() => setAsActive(bg.id)}
                    disabled={isLoading}
                    title="Jadikan Background Utama"
                    className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktifkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(bg.id)}
                  disabled={isLoading}
                  title="Hapus background"
                  className="p-2 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all border border-red-600/20 flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {backgrounds.length === 0 && !isLoading && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
             <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
             <p className="text-sm font-bold uppercase tracking-widest">Belum ada background</p>
           </div>
        )}
      </div>
    </div>
  );
}
