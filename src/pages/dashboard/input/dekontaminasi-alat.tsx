import React, { useState, useEffect, useMemo, ReactElement, useRef } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Activity,
  RefreshCw,
  Clock,
  Camera,
  Upload,
  Trash2,
  X,
  ClipboardCheck,
  Info,
  ShieldCheck,
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
  {
    id: "peralatan_tersedia",
    label: "Peralatan tersedia dan tersusun baik di meja dan lemari",
    key: "peralatan_tersedia",
    type: "positive",
  },
  {
    id: "peralatan_berkarat",
    label: "Adakah peralatan sarana dan prasarana kesehatan yang berkarat",
    key: "peralatan_berkarat",
    type: "negative",
  },
  {
    id: "sterilisasi_tersentral",
    label: "Sterilisasi tersentral",
    key: "sterilisasi_tersentral",
    type: "positive",
  },
  {
    id: "alat_reused",
    label: "Alat used reused sesuai aturan",
    key: "alat_reused",
    type: "positive",
  },
  {
    id: "metode_dekontaminasi",
    label:
      "Petugas dapat menjelaskan metoda dekontaminasi peralatan yang biasa digunakan pasien",
    key: "metode_dekontaminasi",
    type: "positive",
  },
  {
    id: "dekontaminasi_lokal",
    label:
      "Dekontaminasi lokal dari instrumen bedah tidak dilakukan di area klinis",
    key: "dekontaminasi_lokal",
    type: "positive",
  },
  {
    id: "expired_date",
    label: "Tanggal kadaluarsa peralatan steril belum terlewati",
    key: "expired_date",
    type: "positive",
  },
  {
    id: "instrumen_bekas",
    label: "Tidak terlihat debu / darah tertinggal di instrumen bekas pakai",
    key: "instrumen_bekas",
    type: "positive",
  },
] as const;
type AuditStatus = "ya" | "tidak" | "na" | null;
export default function InputDekontaminasiAlatPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState("");
  const [upayaPerbaikan, setUpayaPerbaikan] = useState("");
  const [waktuPerbaikan, setWaktuPerbaikan] = useState("");
  const [perbaikanImages, setPerbaikanImages] = useState<DocImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const sigRef = useRef<DigitalSignatureRef>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [preloadedPjSignature, setPreloadedPjSignature] = useState<string | null>(null);
  const [preloadedIpcnSignature, setPreloadedIpcnSignature] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    peralatan_tersedia: null,
    peralatan_berkarat: null,
    sterilisasi_tersentral: null,
    alat_reused: null,
    metode_dekontaminasi: null,
    dekontaminasi_lokal: null,
    expired_date: null,
    instrumen_bekas: null,
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);
        const loadEditData = async () => {
          let { data, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (!data) {
            const { data: fallbackData } = await supabase
              .from("audit_dekontaminasi_alat")
              .select("*")
              .eq("id", id)
              .maybeSingle();
            if (fallbackData) data = fallbackData;
          }

          if (data) {
            if (data.tanggal_waktu) setStartTime(new Date(data.tanggal_waktu));
            if (data.observer) setObserver(data.observer);
            if (data.unit) setUnit(data.unit);
            
            const indicatorsData = data.data_indikator || data.checklist_json || {};
            const valTemuan = data.temuan || indicatorsData.temuan || data.temuan_lapangan || indicatorsData.temuan_lapangan || data.catatan || indicatorsData.catatan || "";
            if (valTemuan) setTemuan(valTemuan);

            const valRekomendasi = data.rekomendasi || indicatorsData.rekomendasi || data.saran || indicatorsData.saran || "";
            if (valRekomendasi) setRekomendasi(valRekomendasi);

            if (data.nama_pj_ruangan || data.nama_pj || indicatorsData.nama_pj_ruangan || indicatorsData.nama_pj) {
              setPjName(data.nama_pj_ruangan || data.nama_pj || indicatorsData.nama_pj_ruangan || indicatorsData.nama_pj);
            }
            if (data.ttd_pj_ruangan || indicatorsData.tanda_tangan_pj) setPreloadedPjSignature(data.ttd_pj_ruangan || indicatorsData.tanda_tangan_pj);
            if (data.ttd_ipcn || indicatorsData.tanda_tangan_ipcn) setPreloadedIpcnSignature(data.ttd_ipcn || indicatorsData.tanda_tangan_ipcn);
            // Populate checklist items
            setAuditData((prev) => {
              const updated = { ...prev };
              Object.keys(updated).forEach((key) => {
                if (indicatorsData[key] !== undefined) {
                  updated[key] = indicatorsData[key] as AuditStatus;
                }
              });
              return updated;
            });
            // Prefill signatures to signature pads
            if (data.ttd_pj_ruangan && sigRef.current?.setPjSignature) {
              setTimeout(() => {
                sigRef.current?.setPjSignature?.(data.ttd_pj_ruangan!);
              }, 400);
            }
            if (data.ttd_ipcn && sigRef.current?.setSupervisorSignature) {
              setTimeout(() => {
                sigRef.current?.setSupervisorSignature?.(data.ttd_ipcn!);
              }, 400);
            }
            
            // Prefill documentation
            const docs = indicatorsData.dokumentasi || data.dokumentasi || indicatorsData.foto || data.foto;
            if (Array.isArray(docs)) {
              setImages(docs.map((url: any) => typeof url === 'string' ? { url, file: null as any } : url));
            } else if (typeof docs === 'string' && docs.length > 0) {
              setImages([{ url: docs, file: null as any }]);
            }

            const upaya = indicatorsData.upaya_perbaikan || indicatorsData.upayaPerbaikan || data.upaya_perbaikan || "";
            if (upaya) setUpayaPerbaikan(upaya);

            const waktuPerb = indicatorsData.waktu_perbaikan || indicatorsData.tanggal_perbaikan || data.waktu_perbaikan || data.tanggal_perbaikan || "";
            if (waktuPerb) setWaktuPerbaikan(waktuPerb);

            const perbaikanDocs = indicatorsData.foto_perbaikan || indicatorsData.dokumentasi_perbaikan || data.foto_perbaikan;
            if (perbaikanDocs) {
              const pArr = Array.isArray(perbaikanDocs) ? perbaikanDocs : [perbaikanDocs];
              setPerbaikanImages(pArr.map((url: string) => (typeof url === 'string' ? { url } : url)));
            }
          }
        };
        loadEditData();
      }
    }
  }, []);
  const formatDateForInput = (date: Date | null) =>
    date ? date.toISOString().split("T")[0] : "";
  const formatTimeForInput = (date: Date | null) =>
    date
      ? `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
      : "";
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split("-").map(Number);
    const newD = new Date(startTime || new Date());
    newD.setFullYear(year, month - 1, day);
    setStartTime(newD);
  };
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, mins] = e.target.value.split(":").map(Number);
    const newD = new Date(startTime || new Date());
    newD.setHours(hours, mins);
    setStartTime(newD);
  };
  const handleActionClick = (id: string, stat: AuditStatus) =>
    setAuditData((prev) => ({ ...prev, [id]: stat }));
  const handleError = (err: any) => {
    console.error(err);
    alert(`Error: ${err.message}`);
  };
  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    auditItems.forEach((item) => {
      const val = auditData[item.id];
      if (val === "ya" || val === "tidak") {
        dinilai++;
        if (item.type === "positive") {
          if (val === "ya") patuh++;
        } else {
          if (val === "tidak") patuh++;
        }
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
      const ttd_pj = sigRef.current?.getPjSignature()?.trim() || preloadedPjSignature || "";
      const ttd_ipcn = sigRef.current?.getSupervisorSignature()?.trim() || preloadedIpcnSignature || "";
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
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
      };
      let sessionError;
      if (isEditMode && editId) {
        const { error } = await supabase
          .from("audit_sessions")
          .update({
            tanggal_waktu: payload.tanggal_waktu,
            observer,
            unit,
            jumlah_dinilai: stats.dinilai,
            jumlah_patuh: stats.patuh,
            persentase: stats.persentase,
            status_kepatuhan: stats.statusText,
            upaya_perbaikan: upayaPerbaikan,
            waktu_perbaikan: waktuPerbaikan,
            tanggal_perbaikan: waktuPerbaikan,
            foto_perbaikan: uploadedPerbaikanUrls,
            data_indikator: {
              ...auditData,
              temuan,
              rekomendasi,
              dokumentasi: uploadedImages,
              tanda_tangan_pj: ttd_pj,
              tanda_tangan_ipcn: ttd_ipcn,
              nama_pj_ruangan: pjName.trim(),
              upaya_perbaikan: upayaPerbaikan,
              waktu_perbaikan: waktuPerbaikan,
              foto_perbaikan: uploadedPerbaikanUrls,
            },
          })
          .eq("id", editId);
        sessionError = error;
      } else {
        const { error } = await supabase
          .from("audit_sessions")
          .insert([
            {
              indikator_id: "dekontaminasi_alat",
              nama_indikator: "DEKONTAMINASI ALAT",
              tanggal_waktu: payload.tanggal_waktu,
              observer,
              unit,
              jenis_tindakan: "Dekontaminasi Alat Audit",
              jumlah_dinilai: stats.dinilai,
              jumlah_patuh: stats.patuh,
              persentase: stats.persentase,
              status_kepatuhan: stats.statusText,
              upaya_perbaikan: upayaPerbaikan,
              waktu_perbaikan: waktuPerbaikan,
              tanggal_perbaikan: waktuPerbaikan,
              foto_perbaikan: uploadedPerbaikanUrls,
              data_indikator: {
                ...auditData,
                temuan,
                rekomendasi,
                dokumentasi: uploadedImages,
                tanda_tangan_pj: ttd_pj,
                tanda_tangan_ipcn: ttd_ipcn,
                nama_pj_ruangan: pjName.trim(),
                upaya_perbaikan: upayaPerbaikan,
                waktu_perbaikan: waktuPerbaikan,
                foto_perbaikan: uploadedPerbaikanUrls,
              },
            },
          ]);
        sessionError = error;
      }
      if (sessionError) throw sessionError;
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
      handleError(err);
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
            {isEditMode ? "Data Audit Dekontaminasi Alat Diperbarui!" : "Data Audit Dekontaminasi Alat Tersimpan!"}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-blue-500/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xs min-[360px]:text-sm min-[410px]:text-base sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap">
              Audit Dekontaminasi Alat
            </h1>
            {isEditMode && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse">
                MODE EDIT DATA
              </span>
            )}
          </div>
          <p className="text-[8px] min-[360px]:text-[9px] min-[410px]:text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-blue-500/80 mt-2 whitespace-nowrap">
            Observasi kepatuhan dekontaminasi peralatan medis
          </p>
        </div>
      </div>
      <div className="space-y-6">
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
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
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
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            Checklist Dekontaminasi Alat
          </h2>
          <div className="space-y-4">
            {auditItems.map((item, idx) => {
              const selected = auditData[item.id];
              const isNegativeQuestion = item.id === "peralatan_berkarat";
              let borderLeftColor = "border-l-transparent";
              if (selected === "na") {
                borderLeftColor = "border-l-slate-500";
              } else if (selected) {
                if (isNegativeQuestion) {
                  borderLeftColor =
                    selected === "ya"
                      ? "border-l-red-500"
                      : "border-l-blue-500";
                } else {
                  borderLeftColor =
                    selected === "ya"
                      ? "border-l-blue-500"
                      : "border-l-red-500";
                }
              }
              return (
                <div
                  key={item.id}
                  className={`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 ${borderLeftColor} transition-colors duration-300 relative overflow-hidden group`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex gap-4">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-white/5 border-white/10 text-slate-500`}
                      >
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
                              selected === choice
                                ? activeClass
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            {choice}
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
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
          title="KEPATUHAN DEKONTAMINASI ALAT"
        />
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Temuan dan Rekomendasi
          </h2>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
              Temuan Lapangan
            </label>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan lapangan..."
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
            ref={sigRef}
            pjName={pjName}
            setPjName={setPjName}
            pjLabel="PJ RUANGAN"
            supervisorLabel="TIM PPI"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !observer || !unit || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isEditMode ? "Update Data Audit" : "Simpan Data Audit"}</span>
        </button>
      </div>
    </div>
  );
}
InputDekontaminasiAlatPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};