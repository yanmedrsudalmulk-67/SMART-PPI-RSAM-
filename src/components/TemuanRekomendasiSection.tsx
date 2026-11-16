import React, { useRef } from "react";
import { generatePpiRecommendation } from "@/utils/ppiRecommendationHelper";

interface TemuanRekomendasiSectionProps {
  temuan: string;
  setTemuan: (val: string) => void;
  rekomendasi: string;
  setRekomendasi: (val: string) => void;
  titleTemuan?: string;
  titleRekomendasi?: string;
  placeholderTemuan?: string;
  placeholderRekomendasi?: string;
  className?: string;
}

export default function TemuanRekomendasiSection({
  temuan,
  setTemuan,
  rekomendasi,
  setRekomendasi,
  titleTemuan = "Temuan Lapangan",
  titleRekomendasi = "Rekomendasi Tindak Lanjut",
  placeholderTemuan = "Tuliskan temuan audit / observasi lapangan...",
  placeholderRekomendasi = "Rekomendasi terisi otomatis sesuai standar PPI (bisa diedit manual)...",
  className = "",
}: TemuanRekomendasiSectionProps) {
  // Tracks whether the user has explicitly typed into the rekomendasi field in this session
  const hasUserManuallyEditedRef = useRef<boolean>(false);

  const handleTemuanChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTemuan(val);

    // Auto-generate if user hasn't explicitly typed custom text into rekomendasi in this session,
    // or if rekomendasi is currently empty / cleared
    if (!hasUserManuallyEditedRef.current || !rekomendasi.trim()) {
      if (val.trim().length >= 2) {
        const autoRec = generatePpiRecommendation(val);
        setRekomendasi(autoRec);
      } else if (val.trim().length === 0) {
        setRekomendasi("");
        hasUserManuallyEditedRef.current = false;
      }
    }
  };

  const handleTemuanBlur = () => {
    if (
      temuan.trim().length >= 2 &&
      (!hasUserManuallyEditedRef.current || !rekomendasi.trim())
    ) {
      const autoRec = generatePpiRecommendation(temuan);
      setRekomendasi(autoRec);
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* 1. Kolom Temuan */}
      <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm space-y-3">
        <label className="block text-sm font-bold uppercase tracking-widest text-slate-300">
          {titleTemuan}
        </label>
        <textarea
          value={temuan}
          onChange={handleTemuanChange}
          onBlur={handleTemuanBlur}
          placeholder={placeholderTemuan}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400/50 transition-colors resize-y min-h-[110px]"
        />
      </div>

      {/* 2. Kolom Rekomendasi */}
      <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm space-y-3">
        <label className="block text-sm font-bold uppercase tracking-widest text-slate-300">
          {titleRekomendasi}
        </label>
        <textarea
          value={rekomendasi}
          onChange={(e) => {
            setRekomendasi(e.target.value);
            // Mark that user has explicitly typed a custom manual recommendation
            hasUserManuallyEditedRef.current = true;
          }}
          placeholder={placeholderRekomendasi}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/50 transition-colors resize-y min-h-[110px]"
        />
      </div>
    </div>
  );
}
