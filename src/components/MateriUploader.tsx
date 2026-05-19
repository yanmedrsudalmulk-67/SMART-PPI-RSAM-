'use client';
import React, { useRef, useState, useEffect } from 'react';
import { FileText, Trash2, Eye, X, Upload, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Import react-pdf components directly
import { Document, Page, pdfjs } from 'react-pdf';

// Import required styles for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export interface TrainingMaterial {
  id: string;
  url: string;
  file: File;
  type: 'pdf' | 'pptx' | 'other';
  name: string;
}

interface MateriUploaderProps {
  materials: TrainingMaterial[];
  setMaterials: React.Dispatch<React.SetStateAction<TrainingMaterial[]>>;
}

export function MateriUploader({ materials, setMaterials }: MateriUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMaterial, setPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newMaterials: TrainingMaterial[] = [];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_SIZE) {
          alert(`Ukuran file ${file.name} terlalu besar. Maksimal 10 MB.`);
          continue;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();
        let type: TrainingMaterial['type'] = 'other';
        if (extension === 'pdf') type = 'pdf';
        else if (['pptx', 'ppt'].includes(extension || '')) type = 'pptx';

        newMaterials.push({
          id: Math.random().toString(36).substring(7),
          url: URL.createObjectURL(file),
          file: file,
          type: type,
          name: file.name
        });
    }

    setMaterials(prev => [...prev, ...newMaterials]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMaterial = (id: string) => {
    setMaterials(prev => {
      const material = prev.find(m => m.id === id);
      if (material) URL.revokeObjectURL(material.url);
      return prev.filter(m => m.id !== id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-blue-400" /> Materi Latihan (PDF/PPT)
        </label>
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <Upload className="w-4 h-4" /> Upload Materi
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.ppt,.pptx" multiple onChange={handleFileUpload} />
      </div>

      {materials.length > 0 && (
        <div className="w-full">
           <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 }
            }}
            className="materi-swiper pb-10"
           >
             {materials.map((m) => (
               <SwiperSlide key={m.id}>
                 <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 group relative overflow-hidden transition-all hover:bg-slate-800">
                    <div className="aspect-square bg-slate-900 rounded-xl flex items-center justify-center relative">
                        {m.type === 'pdf' ? (
                            <FileText className="w-12 h-12 text-rose-400 opacity-50" />
                        ) : (
                            <FileIcon className="w-12 h-12 text-orange-400 opacity-50" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-xl gap-2">
                            <button type="button" onClick={() => setPreviewMaterial(m)} className="p-2 bg-blue-600 text-white rounded-lg">
                                <Eye className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => removeMaterial(m.id)} className="p-2 bg-red-600 text-white rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-1 bg-white/10 rounded-md backdrop-blur-md">
                            <span className="text-[10px] font-bold uppercase text-white">{m.type}</span>
                        </div>
                    </div>
                    <div className="px-1">
                        <p className="text-xs font-bold text-slate-300 truncate">{m.name}</p>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">{(m.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                 </div>
               </SwiperSlide>
             ))}
           </Swiper>
        </div>
      )}
        
      {materials.length === 0 && (
        <div className="py-12 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-slate-500 gap-4 bg-white/2 w-full mt-4">
          <FileText className="w-8 h-8 opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-center px-4">Belum ada materi (PDF/PPT) yang diupload</p>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewMaterial && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-10 bg-black/95 backdrop-blur-md">
                <div className="bg-slate-900 w-full max-w-5xl h-full rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-4 bg-slate-800 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {previewMaterial.type === 'pdf' ? <FileText className="w-5 h-5 text-rose-400" /> : <FileIcon className="w-5 h-5 text-orange-400" />}
                            <h3 className="text-sm font-bold text-white truncate max-w-xs">{previewMaterial.name}</h3>
                        </div>
                        <button onClick={() => setPreviewMaterial(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto bg-slate-950 flex justify-center p-4">
                        {previewMaterial.type === 'pdf' ? (
                            <div className="w-full max-w-4xl">
                                <Document
                                    file={previewMaterial.url}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className="flex flex-col items-center gap-4"
                                >
                                    {Array.from(new Array(numPages), (el, index) => (
                                        <Page 
                                            key={`page_${index + 1}`} 
                                            pageNumber={index + 1} 
                                            width={Math.min(window.innerWidth - 80, 800)}
                                            className="shadow-2xl rounded-lg overflow-hidden border border-white/5"
                                            renderAnnotationLayer={false}
                                            renderTextLayer={false}
                                        />
                                    ))}
                                </Document>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8">
                                <FileIcon className="w-24 h-24 text-orange-400 opacity-20 mb-6" />
                                <h4 className="text-xl font-black text-white mb-2">PowerPoint Preview</h4>
                                <p className="text-slate-400 text-sm max-w-md mb-8">
                                    Format PowerPoint (.pptx) tidak mendukung preview langsung di browser untuk keamanan. 
                                    Silakan download file untuk melihat konten lengkap.
                                </p>
                                <a 
                                    href={previewMaterial.url} 
                                    download={previewMaterial.name}
                                    className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/20"
                                >
                                    Download PowerPoint
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .materi-swiper .swiper-pagination-bullet {
          background: #3b82f6 !important;
          opacity: 0.2 !important;
        }
        .materi-swiper .swiper-pagination-bullet-active {
          opacity: 1 !important;
          width: 20px !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  );
}
