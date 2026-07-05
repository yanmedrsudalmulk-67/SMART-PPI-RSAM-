import { useState, useEffect, useMemo, useRef, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Activity,
  RefreshCw,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
import { EditableSelect } from "@/components/EditableSelect";
import { useAppContext } from "@/components/Providers";
const checklistItems = [
  {
    id: "im_1",
    label: "Ruangan terpisah (sendiri) / cohorting jarak > 1 meter",
  },
  { id: "im_2", label: "Pintu ruangan selalu tertutup" },
  { id: "im_3", label: "Transport pasien bila diperlukan saja" },
  { id: "im_4", label: "Pasien memakai masker saat keluar ruangan" },
  { id: "im_5", label: "Tersedia fasilitas cuci tangan" },
  { id: "im_6", label: "Petugas melakukan cuci tangan sesuai 5 momen" },
  { id: "im_7", label: "Menggunakan masker saat kontak dengan pasien" },
  {
    id: "im_8",
    label: "Memakai sarung tangan bila akan kontak dengan cairan tubuh",
  },
  { id: "im_9", label: "Memakai kacamata goggle bila perlu" },
  { id: "im_10", label: "Memakai gaun pelindung bila perlu" },
  { id: "im_11", label: "Memberikan edukasi kepada pasien" },
  { id: "im_12", label: "Memberikan edukasi kepada keluarga pasien" },
  {
    id: "im_13",
    label:
      "Setelah pasien pulang, bersihkan ruangan dengan cairan desinfektan sesuai standar",
  },
];
type AuditStatus = "ya" | "tidak" | "na" | null;
export default function InputMonitoringImmunoPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState("");
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [pjName, setPjName] = useState("");
  const sigRef = useRef<DigitalSignatureRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  useEffect(() => {
    const initialData: Record<string, AuditStatus> = {};
    checklistItems.forEach((item) => {
      initialData[item.id] = null;
    });
    setData(initialData);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);
        const loadEditData = async () => {
          const { data: ed, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .single();
          if (ed && !error) {
            if (ed.tanggal_waktu) setStartTime(new Date(ed.tanggal_waktu));
            if (ed.observer) setObserver(ed.observer);
            

            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            if (indicatorsData.temuan) setTemuan(indicatorsData.temuan);
            if (indicatorsData.rekomendasi) setRekomendasi(indicatorsData.rekomendasi);
            
            const displayPjName = indicatorsData.nama_pj || indicatorsData.nama_pj_ruangan || ed.nama_pj_ruangan || "";
            if (typeof setPjName === "function") setPjName(displayPjName);

            try {
              setData((prev: any) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((key) => {
                  if (indicatorsData[key] !== undefined) {
                    updated[key] = indicatorsData[key];
                  }
                });
                return updated;
              });
            } catch (err) {}

            

            // Prefill signatures
            setTimeout(() => {
              const t1 = ed.ttd_pj_ruangan || indicatorsData.ttd_pj || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[0]);
              const t2 = ed.ttd_ipcn || indicatorsData.ttd_ipcn || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[1]);
              if (t1 && sigRef.current?.setPjSignature) {
                sigRef.current.setPjSignature(t1);
              }
              if (t2 && sigRef.current?.setSupervisorSignature) {
                sigRef.current.setSupervisorSignature(t2);
              }
            }, 800);

            // Prefill documentation
            if (indicatorsData.dokumentasi) {
              setImages(
                indicatorsData.dokumentasi.map((url: string) => ({
                  url,
                  file: null as any,
                }))
              );
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
    setData((prev) => ({ ...prev, [id]: stat }));
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.values(data).forEach((val) => {
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
      if (persentase >= 85) statusText = "Baik";
      else if (persentase >= 70) statusText = "Cukup";
      else statusText = "Perlu Tindak Lanjut";
    }
    return { patuh, dinilai, persentase, statusText };
  }, [data]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) return alert("Pilih Supervisor terlebih dahulu");
    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const { uploadImagesToSupabase } = await import("@/lib/upload");
      const uploadedUrls = images.length > 0 ? await uploadImagesToSupabase(
        supabase,
        images.map(f => ({ file: f })),
        "audit_images",
        "monitoring_immuno",
      ) : [];
      const payload = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        checklist_json: { data },
        persentase: stats.persentase,
        temuan,
        rekomendasi,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        status_kepatuhan: stats.statusText,
        foto: uploadedUrls,
        ttd_pj,
        ttd_ipcn
      };
      const sessionPayload = {
        indikator_id: "monitoring_immuno",
        nama_indikator: "PENEMPATAN PASIEN IMMUNOCOMPROMISED",
        tanggal_waktu: payload.waktu,
        observer: observer,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        data_indikator: {
          ...payload.checklist_json,
          temuan: payload.temuan,
          rekomendasi: payload.rekomendasi,
          dokumentasi: uploadedUrls,
          tanda_tangan: [ttd_pj, ttd_ipcn].filter(Boolean),
        },
      };
      let sessionId = editId;

      if (isEditMode && editId) {
        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .update(sessionPayload)
          .eq("id", editId);
        if (sessionError) throw sessionError;

        await supabase.from("audit_details").delete().eq("session_id", editId);
      } else {
        const { data: sessionData, error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([sessionPayload])
          .select("id")
          .single();
        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      }
      const detailPayloads = Object.keys(data).map((key) => {
        let label = key;
        const found = checklistItems.find(i => i.id === key);
        if (found) label = found.label;
        return {
          session_id: sessionId,
          pertanyaan_id: key,
          pertanyaan: label,
          jawaban: String(data[key]),
        };
      });
      await supabase.from("audit_details").insert(detailPayloads);
      try {
        await supabase
          .from("penempatan_pasien_immunocompromised")
          .insert([{ ...payload, ttd_pj, ttd_ipcn }])
          .select("id")
          .single();
      } catch (err) {
        console.warn("Failed to insert into native table, but saved to generic session.", err);
      }
      const ch = supabase.channel('changes_monitoring_immuno');
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          ch.send({
            type: 'broadcast',
            event: 'audit_submitted',
            payload: { tableName: 'monitoring_immuno' }
          }).then(() => supabase.removeChannel(ch));
        }
      });
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Gagal menyimpan data"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data Penempatan Pasien Immunocompromised Berhasil Disimpan
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Input Penempatan Pasien Immunocompromised
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-blue-500/80 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Monitoring kepatuhan penempatan pasien immunocompromised
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-emerald-400" /> Data Subjek &
            Ruangan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Waktu Input
              </label>
              <input
                type="datetime-local"
                value={
                  startTime
                    ? new Date(
                        startTime.getTime() -
                          startTime.getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) => setStartTime(new Date(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                Ruangan
              </label>
              <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-blue-300 font-medium">
                Ruang Isolasi
              </div>
            </div>
            <EditableSelect
              label="Supervisor"
              value={observer}
              onChange={setObserver}
              options={[]}
              isIPCN={isIPCN}
              table="master_observers"
              placeholder="Pilih Supervisor..."
            />
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            📋 Checklist Penempatan Pasien Immunocompromised
          </h2>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsChecklistOpen(!isChecklistOpen)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-bold text-white uppercase tracking-widest">
                Daftar Checklist
              </span>
              {isChecklistOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {isChecklistOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5"
                >
                  <div className="p-4 space-y-4">
                    {checklistItems.map((item, idx) => {
                      const selected = data[item.id];
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
                          className={`bg-white/5 p-5 rounded-[1.5rem] border border-white/5 relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 ${borderLeftColor} transition-colors duration-300`}
                        >
                          <div className="flex gap-4 relative z-10 w-full md:w-auto">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/10 text-slate-400">
                              <span className="text-xs font-black">
                                {idx + 1}
                              </span>
                            </div>
                            <div className="mt-1 flex-1">
                              <h3 className="text-sm font-bold text-white leading-relaxed">
                                {item.label}
                              </h3>
                            </div>
                          </div>
                          <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-white/5 w-fit shrink-0 self-end md:self-center z-10">
                            {["ya", "tidak", "na"].map((choice) => (
                              <button
                                key={choice}
                                onClick={() =>
                                  handleActionClick(item.id, choice as any)
                                }
                                type="button"
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                  data[item.id] === choice
                                    ? choice === "ya"
                                      ? "bg-emerald-600 text-white shadow-lg"
                                      : choice === "tidak"
                                        ? "bg-red-600 text-white shadow-lg"
                                        : "bg-slate-600 text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                }`}
                              >
                                {choice}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <LiveStatisticsCard
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
          title="KEPATUHAN PENEMPATAN PASIEN IMMUNOCOMPROMISED"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              📝 TEMUAN
            </h2>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan audit...&#10;Contoh:&#10;Pengunjung tidak memakai masker&#10;Edukasi keluarga belum dilakukan&#10;Handrub tidak tersedia"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"
            />
          </div>
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              💡 REKOMENDASI
            </h2>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan rekomendasi tindak lanjut...&#10;Contoh:&#10;Lengkapi fasilitas hand hygiene&#10;Batasi transport pasien tidak perlu&#10;Edukasi ulang keluarga pasien"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"
            />
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            📷 DOKUMENTASI
          </h2>
          <div className="flex flex-wrap gap-4">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shadow-sm"
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt="img"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  type="button"
                  className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full text-white backdrop-blur-md hover:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="w-24 h-24 rounded-[1.25rem] border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer"
            >
              <Upload size={24} />
              <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">
                Upload
              </span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
            ✍️ TANDA TANGAN DIGITAL
          </h2>
          <DigitalSignatureSection
            ref={sigRef}
            pjName={pjName}
            setPjName={setPjName}
            pjLabel="PJ RUANGAN"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !observer || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isEditMode ? 'Update Data Audit' : 'Simpan Data Audit'}</span>
        </button>
      </div>
    </div>
  );
}
InputMonitoringImmunoPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};