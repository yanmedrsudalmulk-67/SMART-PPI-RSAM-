'use client';
import React, { useRef, useState } from 'react';
import { 
  FileText, Trash2, Eye, X, Upload, File as FileIcon, 
  Download, RefreshCw, Loader2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export interface TrainingMaterial {
  id: string;
  kegiatan_id: string;
  nama_file: string;
  jenis_file: string;
  ukuran_file: number;
  storage_path: string;
  public_url: string;
  uploaded_by: string;
  created_at?: string;
  temp?: boolean;
}

interface MateriUploaderProps {
  materials: TrainingMaterial[];
  setMaterials: React.Dispatch<React.SetStateAction<TrainingMaterial[]>>;
  activityId: string;
  uploadedBy?: string;
}

export function MateriUploader({ materials, setMaterials, activityId, uploadedBy = "Observer" }: MateriUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<TrainingMaterial | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'uploading' | 'success' | 'error'>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ensure storage bucket exists
  const ensureBucketExists = async () => {
    try {
      await supabase.storage.createBucket('public', { public: true });
    } catch (e) {
      console.log("Bucket might already exist or creation failed:", e);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <span className="text-xl shrink-0 select-none">📄</span>;
    } else if (['doc', 'docx'].includes(ext || '')) {
      return <span className="text-xl shrink-0 select-none">📘</span>;
    } else if (['ppt', 'pptx'].includes(ext || '')) {
      return <span className="text-xl shrink-0 select-none">📊</span>;
    }
    return <FileIcon className="w-5 h-5 text-slate-400 shrink-0" />;
  };

  const validateFile = (file: File): string | null => {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!ext || !allowedExtensions.includes(ext)) {
      return `Format file tidak didukung (${file.name})`;
    }
    
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return `Ukuran file melebihi batas 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
    }
    
    return null;
  };

  const uploadFileToSupabase = async (file: File, replaceId?: string) => {
    await ensureBucketExists();
    const tempId = Math.random().toString(36).substring(7);
    
    // Validate
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setUploadStatus(prev => ({ ...prev, [tempId]: 'uploading' }));
    setUploadProgress(prev => ({ ...prev, [tempId]: 10 }));

    // Simulate smooth progress bar transition
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[tempId] || 10;
        if (current >= 85) return prev;
        return { ...prev, [tempId]: current + Math.floor(Math.random() * 15) + 5 };
      });
    }, 150);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileNameClean = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storagePath = `training-materials/${activityId}/${Date.now()}_${fileNameClean}`;

      // Upload actually to Supabase
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('public')
        .getPublicUrl(storagePath);

      if (!publicUrlData) throw new Error("Gagal generate public URL");

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));
      setUploadStatus(prev => ({ ...prev, [tempId]: 'success' }));

      const metadata: TrainingMaterial = {
        id: replaceId || Math.random().toString(36).substring(2, 11),
        kegiatan_id: activityId,
        nama_file: file.name,
        jenis_file: ext || 'pdf',
        ukuran_file: file.size,
        storage_path: storagePath,
        public_url: publicUrlData.publicUrl,
        uploaded_by: uploadedBy,
      };

      // Try saving to database table 'training_materials' natively
      try {
        await supabase.from('training_materials').insert([
          {
            id: metadata.id,
            kegiatan_id: metadata.kegiatan_id,
            nama_file: metadata.nama_file,
            jenis_file: metadata.jenis_file,
            ukuran_file: metadata.ukuran_file,
            storage_path: metadata.storage_path,
            public_url: metadata.public_url,
            uploaded_by: metadata.uploaded_by,
          }
        ]);
      } catch (dbErr) {
        console.log("Saving to training_materials table skipped/failed but fallback will be saved in audit_sessions:", dbErr);
      }

      // Update state
      if (replaceId) {
        // Ganti file logic
        setMaterials(prev => prev.map(m => m.id === replaceId ? metadata : m));
        setSuccessMessage("Materi berhasil diganti");
      } else {
        // Addition logic
        setMaterials(prev => [...prev, metadata]);
        setSuccessMessage("Materi berhasil diunggah");
      }

      setTimeout(() => {
        setSuccessMessage(null);
        setUploadStatus(prev => {
          const dict = { ...prev };
          delete dict[tempId];
          return dict;
        });
      }, 3000);

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      setUploadStatus(prev => ({ ...prev, [tempId]: 'error' }));
      setErrorMessage(`Gagal mengunggah file: ${err.message || err}`);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        await uploadFileToSupabase(e.dataTransfer.files[i]);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        await uploadFileToSupabase(e.target.files[i]);
      }
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Replace file action
  const handleReplaceClick = (id: string) => {
    setReplacingId(id);
    setTimeout(() => replaceInputRef.current?.click(), 100);
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && replacingId) {
      const oldMaterial = materials.find(m => m.id === replacingId);
      if (oldMaterial) {
        // Delete old storage object in background
        try {
          await supabase.storage.from('public').remove([oldMaterial.storage_path]);
          await supabase.from('training_materials').delete().eq('id', oldMaterial.id);
        } catch (e) {
          console.log("Cleanup of replaced old material omitted:", e);
        }
      }
      await uploadFileToSupabase(e.target.files[0], replacingId);
      setReplacingId(null);
    }
  };

  // Delete file action
  const handleDeleteClick = async (id: string) => {
    const material = materials.find(m => m.id === id);
    if (!material) return;
    try {
      await supabase.storage.from('public').remove([material.storage_path]);
      await supabase.from('training_materials').delete().eq('id', id);
    } catch (e) {
      console.log("Delete storage / database row failed but continuing locally:", e);
    }
    
    setMaterials(prev => prev.filter(m => m.id !== id));
    setSuccessMessage("Materi berhasil dihapus");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="bg-[#111827]/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
      
      <div className="flex flex-col gap-1 mb-5">
        <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
          📎 Upload Dokumen Materi Pelatihan
        </h3>
        <p className="text-slate-400 text-xs">
          Unggah materi pelatihan yang akan tersimpan pada sistem dan ditampilkan pada laporan kegiatan.
        </p>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
            <span>✕ {errorMessage}</span>
          </motion.div>
        )}
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>✓ {successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag & Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerSelectFile}
        className={`border-2 border-dashed rounded-2xl py-8 px-4 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
          dragActive 
            ? 'border-cyan-400 bg-cyan-500/10 scale-102 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
            : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/5'
        }`}
      >
        <div className="p-4 rounded-full bg-white/5 text-slate-400 group-hover:text-white transition-colors shadow-inner">
          <Upload className="w-6 h-6 text-cyan-400 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-200">Drag & drop files here, or <span className="text-cyan-400 hover:underline">browse</span></p>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Mendukung PDF, Word, PowerPoint (Maks. 5MB per file)</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.ppt,.pptx" 
          multiple 
          onChange={handleFileChange} 
        />
        {/* Hidden replacement file input */}
        <input 
          type="file" 
          ref={replaceInputRef} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.ppt,.pptx" 
          onChange={handleReplaceFileChange} 
        />
      </div>

      {/* Uploading Status list */}
      {Object.keys(uploadStatus).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadStatus).map(([id, status]) => (
            <div key={id} className="bg-slate-800/40 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  Mengunggah materi...
                </span>
                <span>{uploadProgress[id] || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress[id] || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List Uploaded Materials (Premium styled grid with clean action buttons) */}
      {materials.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Materi Terunggah ({materials.length})</h4>
          <div className="grid grid-cols-1 gap-3">
            {materials.map((m) => (
              <motion.div 
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/2 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all relative overflow-hidden group"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                  <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                    {getFileIcon(m.nama_file)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-200 truncate pr-6 max-w-[280px]">
                      {m.nama_file}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      {m.jenis_file.toUpperCase()} • {(m.ukuran_file / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {/* File Action Controls */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto shrink-0 border-t border-white/5 pt-3 sm:pt-0 sm:border-t-0 justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewMaterial(m)}
                    className="p-2 bg-white/5 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 rounded-xl text-slate-400 hover:text-cyan-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all select-none"
                    title="Pratinjau Materi"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau</span>
                  </button>
                  <a
                    href={m.public_url}
                    download={m.nama_file}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white/5 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-xl text-slate-400 hover:text-emerald-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all select-none"
                    title="Unduh file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleReplaceClick(m.id)}
                    className="p-2 bg-white/5 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 rounded-xl text-slate-400 hover:text-amber-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all select-none"
                    title="Ganti file materi"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(m.id)}
                    className="p-2 bg-white/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl text-slate-400 hover:text-red-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all select-none ml-auto sm:ml-0"
                    title="Hapus file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Document Preview Panel Modal */}
      <AnimatePresence>
        {previewMaterial && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-10 bg-black/95 backdrop-blur-md"
          >
            <div className="bg-slate-900 w-full max-w-5xl h-full rounded-[2rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
              <div className="p-5 bg-slate-800 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 border border-white/5 rounded-xl text-cyan-400 text-lg">
                    {previewMaterial.jenis_file === 'pdf' ? '📄' : '📘'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest truncate max-w-xs sm:max-w-md">Pratinjau Materi Latihan</h3>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">{previewMaterial.nama_file}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewMaterial(null)} 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto bg-slate-950 flex justify-center p-4">
                {previewMaterial.jenis_file === 'pdf' ? (
                  <div className="w-full h-full flex flex-col justify-between relative bg-slate-950 rounded-xl overflow-hidden p-3 border border-white/5">
                    <iframe 
                      src={previewMaterial.public_url}
                      className="w-full h-full rounded-xl bg-white border border-white/10 shadow-inner"
                      title="Viewer PDF"
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 shadow-2xl p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Gunakan pengontrol native untuk mengunduh atau mencetak PDF.</p>
                      <a 
                        href={previewMaterial.public_url} 
                        download={previewMaterial.nama_file}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 select-none"
                      >
                        <Download className="w-4 h-4" /> Download File Langsung
                      </a>
                    </div>
                  </div>
                ) : (
                  // Uses standard secure Google Docs Viewer for Word / PowerPoint formats
                  <div className="w-full h-full flex flex-col justify-between relative bg-slate-950 rounded-xl overflow-hidden p-3 border border-white/5">
                    <iframe 
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(previewMaterial.public_url)}&embedded=true`}
                      className="w-full h-full rounded-xl bg-white border border-white/10 shadow-inner"
                      title="Viewer Document"
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 shadow-2xl p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Format Office membutuhkan download atau viewer eksternal.</p>
                      <a 
                        href={previewMaterial.public_url} 
                        download={previewMaterial.nama_file}
                        className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 select-none"
                      >
                        <Download className="w-4 h-4" /> Download File Langsung
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
