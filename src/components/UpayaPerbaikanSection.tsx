import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, Eye, X, Image as ImageIcon, Wrench, Sparkles, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocImage } from '@/components/DocumentationUploader';

export const getNowDateTimeLocal = (dateInput?: Date | string) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

interface UpayaPerbaikanSectionProps {
  upayaPerbaikan: string;
  setUpayaPerbaikan: (val: string) => void;
  perbaikanImages: (DocImage | any)[];
  setPerbaikanImages: React.Dispatch<React.SetStateAction<DocImage[]>> | React.Dispatch<React.SetStateAction<any[]>>;
  waktuPerbaikan?: string;
  setWaktuPerbaikan?: (val: string) => void;
  title?: string;
  placeholder?: string;
}

export function UpayaPerbaikanSection({
  upayaPerbaikan,
  setUpayaPerbaikan,
  perbaikanImages,
  setPerbaikanImages,
  waktuPerbaikan,
  setWaktuPerbaikan,
  title = "UPAYA PERBAIKAN & DOKUMENTASI TINDAK LANJUT",
  placeholder = "Tuliskan rincian upaya perbaikan, tindakan korektif, atau tindak lanjut yang telah/akan dilakukan..."
}: UpayaPerbaikanSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!waktuPerbaikan && setWaktuPerbaikan) {
      setWaktuPerbaikan(getNowDateTimeLocal());
    }
  }, [waktuPerbaikan, setWaktuPerbaikan]);

  const ensureWaktuRealtime = () => {
    if (!waktuPerbaikan && setWaktuPerbaikan) {
      setWaktuPerbaikan(getNowDateTimeLocal());
    }
  };

  const getImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    return img.url || '';
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const max = 1000;
          if (width > height && width > max) { height *= max / width; width = max; }
          else if (height > max) { width *= max / height; height = max; }
          
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), { type: 'image/webp' }));
          }, 'image/webp', 0.5);
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: DocImage[] = [];
    const MAX_SIZE = 3 * 1024 * 1024; // 3MB
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_SIZE) {
        alert('Ukuran gambar terlalu besar (' + (files[i].size / 1024 / 1024).toFixed(1) + ' MB). Maksimal upload 3 MB.');
        continue;
      }
      const compressed = await compressImage(files[i]);
      newImages.push({ url: URL.createObjectURL(compressed), file: compressed });
    }
    ensureWaktuRealtime();
    setPerbaikanImages((prev: any) => [...(Array.isArray(prev) ? prev : []), ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setPerbaikanImages((prev: any) => {
      const updated = [...(Array.isArray(prev) ? prev : [])];
      const target = updated[index];
      const targetUrl = typeof target === 'string' ? target : target?.url;
      if (targetUrl && targetUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(targetUrl);
        } catch (_) {}
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const validImages = Array.isArray(perbaikanImages) ? perbaikanImages.filter(img => Boolean(getImageUrl(img))) : [];

  return (
    <div className="space-y-6">
      {/* Kolom Tanggal & Waktu Perbaikan */}
      <div className="bg-gradient-to-br from-cyan-500/10 via-cyan-600/5 to-transparent p-6 rounded-[24px] border border-cyan-500/25 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cyan-400">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Tanggal & Waktu Perbaikan
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <input
            type="datetime-local"
            value={waktuPerbaikan || getNowDateTimeLocal()}
            onChange={(e) => setWaktuPerbaikan?.(e.target.value)}
            className="bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono shadow-inner"
          />
        </div>
      </div>

      {/* Kolom Upaya Perbaikan (Teks) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent p-6 rounded-[24px] border border-amber-500/25 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-amber-400">
            <Wrench className="w-4 h-4 text-amber-400" />
            Upaya Perbaikan
          </h2>
        </div>
        <textarea
          value={upayaPerbaikan}
          onChange={(e) => {
            ensureWaktuRealtime();
            setUpayaPerbaikan(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full bg-black/30 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-500"
        />
      </div>

      {/* Kolom Upload Foto Upaya Perbaikan */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-emerald-500/25 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" /> Foto Upaya Perbaikan
            </label>
            <p className="text-[11px] text-slate-400 mt-1">Upload bukti foto perbaikan melalui kamera atau galeri</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none px-4 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <ImageIcon className="w-4 h-4" /> Pilih Galeri
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 sm:flex-none px-4 py-3 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <Camera className="w-4 h-4" /> Buka Kamera
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
          />
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 w-full">
          <AnimatePresence>
            {validImages.map((img, idx) => {
              const url = getImageUrl(img);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={url || idx}
                  className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/30 group shadow-2xl bg-black/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Perbaikan ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(url)}
                      className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xl transition-all"
                      title="Lihat Foto"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-xl transition-all"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded-md text-[9px] font-bold text-emerald-400">
                    Foto #{idx + 1}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {validImages.length === 0 && (
          <div className="col-span-full py-8 border-2 border-dashed border-emerald-500/20 rounded-[2rem] flex flex-col items-center justify-center text-slate-500 gap-3 bg-white/[0.02] w-full mt-4">
            <Sparkles className="w-7 h-7 text-emerald-400/40" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60">
              Belum ada foto upaya perbaikan diunggah
            </p>
          </div>
        )}

        {previewImage && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <button className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Preview Foto Perbaikan"
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl border border-emerald-500/30"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}
export default UpayaPerbaikanSection;
