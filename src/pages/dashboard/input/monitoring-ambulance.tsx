import { useState, useEffect, useMemo, useRef, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Activity,
  RefreshCw,
  X,
  User,
  ShieldCheck,
  Settings,
  Trash2,
  Camera,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import { EditableSelect } from "@/components/EditableSelect";
import { useAppContext } from "@/components/Providers";
import { uploadImagesToSupabase } from "@/lib/upload";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";

const checklistItems = [
  { id: "amb_1", label: "Tersedia spill kit tumpahan cairan tubuh" },
  { id: "amb_2", label: "Ambulance tampak bersih" },
  { id: "amb_3", label: "Tidak ada lawa-lawa di sudut Ambulance" },
  { id: "amb_4", label: "Jendela kaca tampak bersih" },
  { id: "amb_5", label: "Tidak ada debu" },
  { id: "amb_6", label: "Tersedia sarana APD" },
  { id: "amb_7", label: "Tersedia handrub di mobil ambulance" },
  { id: "amb_8", label: "Tersedia tempat sampah tertutup" },
];

type AuditStatus = "ya" | "tidak" | "na" | null;

export default function MonitoringAmbulancePage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState("");
  const [ambulanceId, setAmbulanceId] = useState("");
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [pjName, setPjName] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);
  const sigRef = useRef<DigitalSignatureRef>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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
            if (ed.ruangan) setAmbulanceId(ed.ruangan);
            else if (ed.unit && ed.unit !== "Ambulance") setAmbulanceId(ed.unit);

            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            if (indicatorsData.ambulance_id) setAmbulanceId(indicatorsData.ambulance_id);
            if (indicatorsData.temuan) setTemuan(indicatorsData.temuan);
            if (indicatorsData.rekomendasi) setRekomendasi(indicatorsData.rekomendasi);
            
            const displayPjName = indicatorsData.nama_pj || indicatorsData.nama_pj_ruangan || ed.nama_pj_ruangan || "";
            setPjName(displayPjName);

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

  const handleActionClick = (id: string, val: AuditStatus) => {
    setData((prev) => ({ ...prev, [id]: val }));
  };

  const stats = useMemo(() => {
    const dinilai = Object.values(data).filter((v) => v !== null).length;
    const patuh = Object.values(data).filter((v) => v === "ya").length;
    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let statusText = "Belum Dinilai";
    if (dinilai > 0) {
      if (persentase >= 85) statusText = "Baik";
      else if (persentase >= 70) statusText = "Cukup";
      else statusText = "Perlu Perbaikan";
    }
    return { dinilai, patuh, persentase, statusText };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) {
      alert("Harap pilih Supervisor!");
      return;
    }
    if (!ambulanceId) {
      alert("Harap pilih ID Ambulance!");
      return;
    }
    if (stats.dinilai === 0) {
      alert("Harap isi setidaknya satu indikator!");
      return;
    }
    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature() || null;
      const ttd_ipcn = sigRef.current?.getSupervisorSignature() || null;

      // Handle images upload
      const existingUrls = images.filter((img) => !img.file).map((img) => img.url);
      const newFiles = images.filter((img) => img.file).map((img) => ({ file: img.file }));
      const newlyUploadedUrls = newFiles.length > 0 
        ? await uploadImagesToSupabase(supabase, newFiles, "dokumentasi", "audit") 
        : [];
      const uploadedUrls = [...existingUrls, ...newlyUploadedUrls];

      const sessionPayload: any = {
        indikator_id: "monitoring_ambulance",
        kategori: "Kewaspadaan Isolasi",
        nama_indikator: "MONITORING AMBULANCE",
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit: ambulanceId,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        nama_pj_ruangan: pjName.trim(),
        data_indikator: {
          ...data,
          temuan,
          rekomendasi,
          dokumentasi: uploadedUrls,
          tanda_tangan: [ttd_pj, ttd_ipcn],
          nama_pj: pjName.trim(),
          nama_pj_ruangan: pjName.trim(),
          ambulance_id: ambulanceId,
        },
      };

      let sessionId = editId;

      if (isEditMode && editId) {
        // Update existing session
        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .update(sessionPayload)
          .eq("id", editId);
        if (sessionError) throw sessionError;

        // Clean up detail entries for update
        await supabase.from("audit_details").delete().eq("session_id", editId);
      } else {
        // Insert new session
        const { data: sessionData, error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([sessionPayload])
          .select("id")
          .single();
        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      }

      // Insert detail entries
      const detailPayloads = checklistItems
        .filter((item) => data[item.id] !== null)
        .map((item) => ({
          session_id: sessionId,
          pertanyaan_id: item.id,
          pertanyaan: item.label,
          jawaban: String(data[item.id] || ""),
        }));
      
      if (detailPayloads.length > 0) {
        await supabase.from("audit_details").insert(detailPayloads);
      }

      // Optional legacy inserts for compatibility
      try {
        await supabase.from("monitoring_ambulance").insert([
          {
            observer,
            ambulance_id: ambulanceId,
            start_time: startTime?.toISOString(),
            end_time: new Date().toISOString(),
            data_json: data,
            patuh: stats.patuh,
            dinilai: stats.dinilai,
            persentase: stats.persentase,
          },
        ]);
      } catch (err) {}

      try {
        await supabase.from("audit_ambulance").insert([
          {
            waktu: startTime?.toISOString(),
            ruangan: ambulanceId,
            supervisor: observer,
            checklist_json: data,
            persentase: stats.persentase,
            status: stats.statusText,
          },
        ]);
      } catch (err) {}

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data: ${err.message || ""}`);
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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold uppercase tracking-wider text-xs border border-blue-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Data Monitoring Ambulance Berhasil Disimpan</span>
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
            Monitoring Ambulance
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-blue-500/80 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Audit Kebersihan dan PPI Ambulance
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Informasi Audit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Waktu Audit
                </label>
              </div>
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
              />
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
            <EditableSelect
              label="ID Ambulance"
              value={ambulanceId}
              onChange={setAmbulanceId}
              isIPCN={isIPCN}
              options={["Ambulance 1", "Ambulance 2", "Mobil Jenazah"]}
              placeholder="Pilih Ambulance..."
            />
          </div>
        </div>

        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Indikator Kepatuhan
          </h2>
          <div className="space-y-4">
            {checklistItems.map((item) => {
              const val = data[item.id];
              const activeColorLine =
                val === "ya"
                  ? "border-l-blue-500 bg-blue-500/5"
                  : val === "tidak"
                    ? "border-l-red-500 bg-red-500/5"
                    : val === "na"
                      ? "border-l-slate-400 bg-slate-500/5"
                      : "border-l-transparent";

              return (
                <div
                  key={item.id}
                  className={`bg-white/5 p-6 rounded-[24px] border border-white/5 group hover:border-blue-500/30 transition-all duration-300 border-l-4 relative overflow-hidden ${activeColorLine}`}
                >
                  <h3 className="text-sm font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                    {item.label}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        id: "ya",
                        label: "Ya",
                        activeClass: "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20",
                      },
                      {
                        id: "tidak",
                        label: "Tidak",
                        activeClass: "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20",
                      },
                      {
                        id: "na",
                        label: "N/A",
                        activeClass: "bg-slate-500 text-white border-slate-400 shadow-lg shadow-slate-500/20",
                      },
                    ].map((btn) => (
                      <button
                        type="button"
                        key={btn.id}
                        onClick={() => handleActionClick(item.id, btn.id as any)}
                        className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          data[item.id] === btn.id
                            ? btn.activeClass
                            : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
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
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              📝 Temuan Audit
            </h2>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan audit..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
            />
          </div>
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              💡 Rekomendasi
            </h2>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan rekomendasi tindak lanjut..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
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
          type="submit"
          disabled={isSubmitting || !observer || !ambulanceId || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isEditMode ? "Update Data Audit" : "Simpan Data Audit"}</span>
        </button>
      </form>
    </div>
  );
}

MonitoringAmbulancePage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
