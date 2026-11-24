import React, { useRef, useState } from 'react';
import { Camera, Trash2, Eye, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DocImage {
  url: string;
  file?: File | null;
}

interface DocumentationUploaderProps {
  images: (DocImage | any)[];
  setImages: React.Dispatch<React.SetStateAction<DocImage[]>> | React.Dispatch<React.SetStateAction<any[]>>;
  maxImages?: number;
  label?: string;
  helperText?: string;
}

export function DocumentationUploader({ images, setImages, maxImages, label, helperText }: DocumentationUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    return img.url || '';
  };

  const validImages = Array.isArray(images) ? images.filter(img => Boolean(getImageUrl(img))) : [];

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
          
          // More aggressive sizing
          const max = 1000;
          if (width > height && width > max) { height *= max / width; width = max; }
          else if (height > max) { width *= max / height; height = max; }
          
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Iterate quality if needed? Or just use a lower fixed quality.
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), { type: 'image/webp' }));
          }, 'image/webp', 0.5);
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const currentCount = validImages.length;
    let filesToProcess: File[] = Array.from(rawFiles);

    if (maxImages && maxImages > 0) {
      const availableSlots = maxImages - currentCount;
      if (availableSlots <= 0) {
        alert(`Batas maksimal ${maxImages} foto dokumentasi sudah tercapai.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        return;
      }
      if (filesToProcess.length > availableSlots) {
        alert(`Anda memilih ${filesToProcess.length} foto, hanya ${availableSlots} foto yang dapat ditambahkan (maksimal ${maxImages} foto).`);
        filesToProcess = filesToProcess.slice(0, availableSlots);
      }
    }

    const newImages: DocImage[] = [];
    const MAX_SIZE = 3 * 1024 * 1024; // 3MB
    for (let i = 0; i < filesToProcess.length; i++) {
        if (filesToProcess[i].size > MAX_SIZE) {
          alert('Ukuran gambar terlalu besar (' + (filesToProcess[i].size / 1024 / 1024).toFixed(1) + ' MB). Maksimal upload 3 MB.');
          continue;
        }
        const compressed = await compressImage(filesToProcess[i]);
        newImages.push({ url: URL.createObjectURL(compressed), file: compressed });
    }
    setImages((prev: any) => [...(Array.isArray(prev) ? prev : []), ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev: any) => {
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

  const isMaxReached = Boolean(maxImages && validImages.length >= maxImages);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <div className="flex items-center gap-2.5">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" /> {label || 'Foto Dokumentasi'}
            </label>
            {maxImages && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border ${
                isMaxReached 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
              }`}>
                {validImages.length} / {maxImages} Foto
              </span>
            )}
          </div>
          {helperText && (
            <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
          )}
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="button"
            disabled={isMaxReached}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),2px_3px_6px_rgba(0,0,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-blue-400" /> Pilih Galeri
          </button>
          <button
            type="button"
            disabled={isMaxReached}
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),2px_3px_6px_rgba(0,0,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" /> Buka Kamera
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 mt-5 w-full">
        <AnimatePresence>
          {validImages.map((img, idx) => {
            const url = getImageUrl(img);
            return (
              <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} key={url || idx} 
                className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group shadow-2xl bg-black/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Doc ${idx}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setPreviewImage(url)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl transition-all cursor-pointer">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-xl transition-all cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
        
      {validImages.length === 0 && (
        <div className="py-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-black/20 w-full mt-4">
          <Camera className="w-7 h-7 opacity-30 text-cyan-400" />
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">Belum ada foto dokumentasi</p>
          <span className="text-[10px] text-slate-500">Dapat mengunggah 1 hingga {maxImages || 5} foto</span>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-6 h-6"/>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImage} alt="Preview Dokumentasi" className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl border border-white/10" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
