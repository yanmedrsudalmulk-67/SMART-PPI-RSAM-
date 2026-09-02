import React, { useState, useEffect, useMemo, ReactElement, useRef } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Activity,
  RefreshCw,
  Upload,
  Trash2,
  X,
  ClipboardCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAppContext } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import { uploadImagesToSupabase } from "@/lib/upload";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { UpayaPerbaikanSection } from "@/components/UpayaPerbaikanSection";
import { EditableSelect } from "@/components/EditableSelect";
const units = [
  "IGD",
  "ICU",
  "IBS",
  "Rawat Jalan",
  "Ranap Aisyah",
  "Ranap Fatimah",
  "Ranap Khadijah",
  "Ranap Usman",
  "Radiologi",
  "Laboratorium",
  "Pantry",
  "Emergency Kebidanan",
];
const auditItems = [
  { id: "item_1", label: "Tersedia fasilitas pembuangan sampah" },
  { id: "item_2", label: "Tempat sampah menggunakan pedal kaki" },
  {
    id: "item_3",
    label:
      "Tempat sampah diberi label sesuai peruntukannya: infeksius dan non infeksius",
  },
  {
    id: "item_4",
    label: "Tersedia kantung plastik kuning untuk limbah medis/infeksius",
  },
  {
    id: "item_5",
    label: "Jumlah tempat sampah memadai dan dalam kondisi baik",
  },
  { id: "item_6", label: "Sampah yang akan dibuang diikat dengan baik" },
  { id: "item_7", label: "Sampah tidak lebih dari 3/4 penuh" },
  {
    id: "item_8",
    label:
      "Sampah disimpan/ditempatkan di area yang disediakan sebelum dibawa ke pembuangan/TPS",
  },
  {
    id: "item_9",
    label: "Petugas mengetahui cara penanganan tumpahan cairan infeksius",
  },
  {
    id: "item_10",
    label: "Spill kit tersedia dan petugas mengetahui lokasi penyimpanannya",
  },
] as const;
type AuditStatus = "ya" | "tidak" | "na" | null;
export default function InputPengelolaanLimbahMedisPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState("");
  const signatureRef = useRef<DigitalSignatureRef>(null);
  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    item_1: null,
    item_2: null,
    item_3: null,
    item_4: null,
    item_5: null,
    item_6: null,
    item_7: null,
    item_8: null,
    item_9: null,
    item_10: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upayaPerbaikan, setUpayaPerbaikan] = useState("");
  const [waktuPerbaikan, setWaktuPerbaikan] = useState("");
  const [perbaikanImages, setPerbaikanImages] = useState<DocImage[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [preloadedPjSignature, setPreloadedPjSignature] = useState<string | null>(null);
  const [preloadedIpcnSignature, setPreloadedIpcnSignature] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);
        const loadEditData = async () => {
          let { data: ed, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .single();
          if (error || !ed) {
            const { data: edFallback, error: errFallback } = await supabase
              .from("audit_pengelolaan_limbah_medis")
              .select("*")
              .eq("id", id)
              .single();
            if (edFallback) {
              ed = edFallback;
              error = null as any;
            } else {
              const { data: oldFallback } = await supabase
                .from("pengelolaan_limbah_medis")
                .select("*")
                .eq("id", id)
                .single();
              if (oldFallback) {
                ed = oldFallback;
                error = null as any;
              }
            }
          }
          if (ed && !error) {
            if (ed.tanggal_waktu) setStartTime(new Date(ed.tanggal_waktu));
            if (ed.observer) setObserver(ed.observer);
            if (ed.unit) setUnit(ed.unit);
            
            let indicatorsData = typeof ed.data_indikator === 'string' ? JSON.parse(ed.data_indikator) : ed.data_indikator;
            let checklistJson = typeof ed.checklist_json === 'string' ? JSON.parse(ed.checklist_json) : ed.checklist_json;
            if (!indicatorsData && !checklistJson && ed.indikator_id) {
               let { data: specData } = await supabase.from("audit_pengelolaan_limbah_medis").select("*").eq("id", id).single();
               if (!specData) {
                  const { data: specOldData } = await supabase.from("pengelolaan_limbah_medis").select("*").eq("id", id).single();
                  specData = specOldData;
               }
               indicatorsData = specData;
            }
            indicatorsData = indicatorsData || checklistJson || ed;
            
            if (indicatorsData) {
              const valTemuan = ed.temuan || indicatorsData.temuan || ed.temuan_lapangan || indicatorsData.temuan_lapangan || ed.catatan || indicatorsData.catatan || "";
              if (valTemuan) setTemuan(valTemuan);

              const valRekomendasi = ed.rekomendasi || indicatorsData.rekomendasi || ed.saran || indicatorsData.saran || "";
              if (valRekomendasi) setRekomendasi(valRekomendasi);

              const displayPjName = indicatorsData.nama_pj_ruangan || indicatorsData.nama_pj || ed.nama_pj_ruangan || ed.nama_pj || "";
              if (displayPjName) setPjName(displayPjName);
              
              const pjSig = indicatorsData.tanda_tangan_pj || ed.ttd_pj_ruangan || ed.ttd_pj || ed.tanda_tangan_pj || indicatorsData.ttd_pj_ruangan || indicatorsData.ttd_pj || (Array.isArray(indicatorsData.tanda_tangan) ? indicatorsData.tanda_tangan[0] : null);
              const ipcnSig = indicatorsData.tanda_tangan_ipcn || ed.ttd_ipcn || ed.tanda_tangan_ipcn || ed.tanda_tangan_spv || indicatorsData.ttd_ipcn || (Array.isArray(indicatorsData.tanda_tangan) ? indicatorsData.tanda_tangan[1] : null);

              if (pjSig) {
                setPreloadedPjSignature(pjSig);
                setTimeout(() => signatureRef.current?.setPjSignature?.(pjSig), 400);
              }
              if (ipcnSig) {
                setPreloadedIpcnSignature(ipcnSig);
                setTimeout(() => signatureRef.current?.setSupervisorSignature?.(ipcnSig), 400);
              }
              setAuditData(prev => ({ ...prev, ...indicatorsData }));
            }
            
            const docs = indicatorsData.dokumentasi || ed.dokumentasi || indicatorsData.foto || ed.foto;
            if (Array.isArray(docs)) {
              setImages(docs.map((url: any) => typeof url === 'string' ? { url, file: null as any } : url));
            } else if (typeof docs === 'string' && docs.length > 0) {
              setImages([{ url: docs, file: null as any }]);
            }

            const upaya = indicatorsData.upaya_perbaikan || indicatorsData.upayaPerbaikan || ed.upaya_perbaikan || "";
            if (upaya) setUpayaPerbaikan(upaya);

            const waktuPerb = indicatorsData.waktu_perbaikan || indicatorsData.tanggal_perbaikan || ed.waktu_perbaikan || ed.tanggal_perbaikan || "";
            if (waktuPerb) setWaktuPerbaikan(waktuPerb);

            const perbaikanDocs = indicatorsData.foto_perbaikan || indicatorsData.dokumentasi_perbaikan || ed.foto_perbaikan;
            if (perbaikanDocs) {
              const pArr = Array.isArray(perbaikanDocs) ? perbaikanDocs : [perbaikanDocs];
              setPerbaikanImages(pArr.map((url: string) => (typeof url === 'string' ? { url } : url)));
            }
          }
        };
        loadEditData();
      } else {
        setStartTime(new Date());
      }
    } else {
      setStartTime(new Date());
    }
  }, []);
  const handleActionClick = (id: string, stat: AuditStatus) => {
    setAuditData((prev) => ({ ...prev, [id]: stat }));
  };
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };
  const formatTimeForInput = (date: Date | null) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${mins}`;
    } catch (e) {
      return "";
    }
  };
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split("-").map(Number);
    if (!year) return;
    if (startTime) {
      const newD = new Date(startTime);
      newD.setFullYear(year, month - 1, day);
      setStartTime(newD);
    } else {
      const newD = new Date();
      newD.setFullYear(year, month - 1, day);
      setStartTime(newD);
    }
  };
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, mins] = e.target.value.split(":").map(Number);
    const newD = startTime ? new Date(startTime) : new Date();
    newD.setHours(hours, mins);
    setStartTime(newD);
  };
  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.values(auditData).forEach((val) => {
      if (val === "ya") {
        patuh++;
        dinilai++;
      } else if (val === "tidak") {
        dinilai++;
      }
    });
    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let statusText = "Belum Dinilai";
    if (dinilai > 0) {
      if (persentase >= 85) statusText = "Patuh";
      else if (persentase >= 70) statusText = "Cukup";
      else statusText = "Tidak Patuh";
    }
    return { patuh, dinilai, persentase, statusText };
  }, [auditData]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const pjSig = signatureRef.current?.getPjSignature() || preloadedPjSignature;
      const ipcnSig = signatureRef.current?.getSupervisorSignature() || preloadedIpcnSignature;
      const uploadedImages = await uploadImagesToSupabase(
        supabase,
        images || [],
        "audit_images",
        "images",
      );
      const uploadedPerbaikanUrls: string[] = [];
      for (const img of perbaikanImages) {
        if (typeof img === "string") {
          uploadedPerbaikanUrls.push(img);
        } else if (img.url && !img.url.startsWith("blob:")) {
          uploadedPerbaikanUrls.push(img.url);
        } else if (img.file) {
          const fileExt = img.file.name.split(".").pop();
          const fileName = `perbaikan_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `perbaikan/${fileName}`;
          const { error: uploadErr } = await supabase.storage.from("dokumentasi").upload(filePath, img.file);
          if (!uploadErr) {
            const { data: pUrl } = supabase.storage.from("dokumentasi").getPublicUrl(filePath);
            if (pUrl?.publicUrl) uploadedPerbaikanUrls.push(pUrl.publicUrl);
          }
        }
      }

      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        temuan,
        rekomendasi,
        ...auditData,
      };
      const sessionPayload = {
        indikator_id: "pengelolaan_limbah_medis",
        nama_indikator: "PENGELOLAAN LIMBAH MEDIS",
        tanggal_waktu: payload.tanggal_waktu,
        observer,
        unit,
        nama_pj: pjName.trim(),
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: pjSig,
        ttd_ipcn: ipcnSig,
        temuan,
        rekomendasi,
        jenis_tindakan: "Limbah Medis Audit",
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        data_indikator: {
          ...auditData,
          temuan,
          rekomendasi,
          dokumentasi: uploadedImages,
          tanda_tangan_pj: pjSig,
          tanda_tangan_ipcn: ipcnSig,
          nama_pj_ruangan: pjName.trim(),
          upaya_perbaikan: upayaPerbaikan,
          waktu_perbaikan: waktuPerbaikan,
          foto_perbaikan: uploadedPerbaikanUrls,
        },
      };
      if (isEditMode && editId) {
        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .update(sessionPayload)
          .eq("id", editId);
        
        if (sessionError) throw sessionError;
      } else {
        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([sessionPayload]);
          
        if (sessionError) throw sessionError;
      }
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        if (isEditMode) {
          router.push("/dashboard/reports");
        } else {
          router.push("/dashboard/input/isolasi");
        }
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Terjadi kesalahan sistem"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-blue-400/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400">
            Input Audit Pengelolaan Limbah Medis
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">
            Audit kepatuhan pengelolaan limbah medis sesuai standar PPI Rumah
            Sakit.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Waktu Observasi */}
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Clock className="w-4 h-4 text-emerald-400" /> Waktu Input
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative group overflow-hidden bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-inner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">
                Tanggal Audit
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={formatDateForInput(startTime)}
                  onChange={handleDateChange}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
            <div className="relative group overflow-hidden bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-inner border-l-4 border-l-blue-500/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 block flex items-center justify-between">
                Jam Input
                <span className="text-[8px] opacity-50 animate-pulse italic text-slate-400">
                  Scroll untuk pilih
                </span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="time"
                  value={formatTimeForInput(startTime)}
                  onChange={handleTimeChange}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Observer & Unit */}
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <EditableSelect
              label="Observer / Verifikator"
              value={observer}
              onChange={setObserver}
              options={[]}
              isIPCN={isIPCN}
              table="master_observers"
              placeholder="Pilih Observer..."
            />
            <EditableSelect
              label="Unit Kerja / Ruangan"
              value={unit}
              onChange={setUnit}
              options={units}
              isIPCN={isIPCN}
              storageKey="smartppi_units"
              placeholder="Pilih Unit..."
            />
          </div>
        </div>
        {/* Checklist */}
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            Checklist Pengelolaan Limbah Medis
          </h2>
          <div className="space-y-4">
            {auditItems.map((item, idx) => {
              const selected = auditData[item.id];
              const negativeKeywords = [
                "berkarat",
                "kotor",
                "debu",
                "genangan",
                "tercampur",
                "bercampur",
                "penumpukan",
                "bocor",
                "jarum",
                "menumpuk",
                "sampah medis dan non medis",
                "pembuangan sampah infeksius",
              ];
              const isNegativeQuestion = negativeKeywords.some((kw) =>
                (item.label || (item as any).desc || "")
                  .toLowerCase()
                  .includes(kw),
              );
              let borderLeftColor = "border-l-transparent";
              if (selected === "na") {
                borderLeftColor = "border-l-slate-500";
              } else if (selected) {
                borderLeftColor =
                  selected === "ya"
                    ? isNegativeQuestion
                      ? "border-l-red-500"
                      : "border-l-blue-500"
                    : isNegativeQuestion
                      ? "border-l-blue-500"
                      : "border-l-red-500";
              }
              return (
                <div
                  key={item.id}
                  className={`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 ${borderLeftColor} transition-colors duration-300 relative overflow-hidden group`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-white/5 border-white/10 text-slate-500">
                        <span className="text-xs font-black">{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white mb-2">
                          {item.label}
                        </h3>
                      </div>
                    </div>
                    <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit self-end md:self-center">
                      {["ya", "tidak", "na"].map((choice) => {
                        let activeClass = "";
                        if (choice === "na") {
                          activeClass =
                            "bg-slate-500 text-white shadow-[0_0_15px_rgba(100,116,139,0.3)] transform scale-105";
                        } else if (isNegativeQuestion) {
                          activeClass =
                            choice === "ya"
                              ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105"
                              : "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105";
                        } else {
                          activeClass =
                            choice === "ya"
                              ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105"
                              : "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105";
                        }
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() =>
                              handleActionClick(item.id, choice as any)
                            }
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                              auditData[item.id] === choice
                                ? activeClass
                                : "bg-transparent text-slate-400 hover:bg-white/10"
                            }`}
                          >
                            {choice === "na" ? "N/A" : choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <LiveStatisticsCard
          totalDinilai={stats.dinilai || 0}
          totalPatuh={stats.patuh || 0}
          totalTidakPatuh={(stats.dinilai || 0) - (stats.patuh || 0)}
          persentase={stats.persentase || 0}
          statusText={stats.statusText || "Belum Dinilai"}
        />
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Temuan dan Rekomendasi
          </h2>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
              Temuan Audit
            </label>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan audit..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[100px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
              Rekomendasi
            </label>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Rekomendasi tindakan..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[100px]"
            />
          </div>
          <DocumentationUploader images={images} setImages={setImages} />
          {isEditMode && (
            <UpayaPerbaikanSection
              upayaPerbaikan={upayaPerbaikan}
              setUpayaPerbaikan={setUpayaPerbaikan}
              perbaikanImages={perbaikanImages}
              setPerbaikanImages={setPerbaikanImages}
              waktuPerbaikan={waktuPerbaikan}
              setWaktuPerbaikan={setWaktuPerbaikan}
            />
          )}
          <DigitalSignatureSection
            ref={signatureRef}
            pjName={pjName}
            setPjName={setPjName}
            pjLabel="PJ RUANGAN"
            preloadedPjSignature={preloadedPjSignature}
            preloadedIpcnSignature={preloadedIpcnSignature}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isEditMode ? 'Update Data Audit' : 'Simpan Data Audit'}</span>
        </button>
      </form>
    </div>
  );
}
InputPengelolaanLimbahMedisPage.getLayout = function getLayout(
  page: React.ReactElement,
) {
  return <DashboardLayout>{page}</DashboardLayout>;
};