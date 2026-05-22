import React, {
  useState,
  useEffect,
  useMemo,
  ReactElement,
  useRef,
} from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Info,
  ShieldCheck,
  RefreshCw,
  ClipboardCheck,
  Activity,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAppContext } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import { uploadImagesToSupabase } from "@/lib/upload";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
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

const criteria = [
  {
    id: "c1",
    label:
      "Linen bersih disimpan di lemari tertutup dengan jarak setidaknya dari lantai 30 cm, dinding 20 cm, langit-langit 60 cm, di area bersih terlindung dari kontaminasi",
  },
  {
    id: "c2",
    label: "Tersedia troli/tempat linen kotor dalam kondisi baik dan tertutup",
  },
  {
    id: "c3",
    label:
      "Tersedia kantung linen berwarna kuning untuk linen infeksius / tercemar / basah",
  },
  {
    id: "c4",
    label: "Linen kotor dipisahkan sesuai dengan SPO",
  },
  {
    id: "c5",
    label:
      "Petugas menggunakan APD saat menangani linen infeksius / tercemar / basah",
  },
] as const;

type AuditStatus = "ya" | "tidak" | "na" | null;

export default function LinenAuditPage() {
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
    c1: null,
    c2: null,
    c3: null,
    c4: null,
    c5: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setStartTime(new Date());
  }, []);

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

  const handleSelection = (cid: string, val: AuditStatus) => {
    setAuditData((prev) => ({ ...prev, [cid]: val }));
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
    let totalEvaluasi = 0;

    Object.values(auditData).forEach((val) => {
      if (val === "ya") {
        patuh++;
        totalEvaluasi++;
      } else if (val === "tidak") {
        totalEvaluasi++;
      }
    });

    const persentase =
      totalEvaluasi > 0 ? Math.round((patuh / totalEvaluasi) * 100) : 0;
    let statusText = "Belum Dinilai";

    if (totalEvaluasi > 0) {
      if (persentase >= 85) statusText = "Baik";
      else if (persentase >= 70) statusText = "Cukup";
      else statusText = "Perlu Perbaikan";
    }

    return { patuh, totalEvaluasi, persentase, statusText };
  }, [auditData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(auditData).some((v) => v === null)) {
      alert("Harap isi semua indikator!");
      return;
    }

    setIsSubmitting(true);

    try {
      const pjSig = signatureRef.current?.getPjSignature();
      const ipcnSig = signatureRef.current?.getSupervisorSignature();

      const uploadedImages = await uploadImagesToSupabase(
        supabase,
        images || [],
        "audit_images",
        "images",
      );

      const payload = {
        indikator_id: "penatalaksanaan_linen",
        nama_indikator: "PENATALAKSANAAN LINEN",
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        jenis_tindakan: "Linen Management Audit",
        jumlah_dinilai: stats.totalEvaluasi,
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
        },
        temuan,
        rekomendasi,
        nama_pj_ruangan: pjName.trim(),
        tanda_tangan_pj: pjSig,
        tanda_tangan_ipcn: ipcnSig,
      };

      const { data: sessionData, error } = await supabase
        .from("audit_sessions")
        .insert([payload])
        .select("id")
        .single();
      if (error) throw error;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
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

      <div className="flex items-center gap-4 mb-8 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400 uppercase">
            Audit Penatalaksanaan Linen
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">
            Audit kepatuhan pengelolaan linen bersih dan linen kotor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              storageKey="local_obs"
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
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST
            PENATALAKSANAAN LINEN
          </h2>
          <div className="space-y-4">
            {criteria.map((item, idx) => {
              const selected = auditData[item.id];
              let borderLeftColor = "border-l-transparent";
              if (selected === "na") {
                borderLeftColor = "border-l-slate-500";
              } else if (selected) {
                borderLeftColor = selected === "ya" ? "border-l-blue-500" : "border-l-red-500";
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
                              handleSelection(item.id, choice as any)
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
          totalDinilai={stats.totalEvaluasi || 0}
          totalPatuh={stats.patuh || 0}
          totalTidakPatuh={(stats.totalEvaluasi || 0) - (stats.patuh || 0)}
          persentase={stats.persentase || 0}
          statusText={stats.statusText || "Belum Dinilai"}
        />

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Section Audit Tambahan
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

          <DigitalSignatureSection
            ref={signatureRef}
            pjName={pjName}
            setPjName={setPjName}
            pjLabel="PJ RUANGAN"
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
          <span>Simpan Data Audit</span>
        </button>
      </form>
    </div>
  );
}

LinenAuditPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
