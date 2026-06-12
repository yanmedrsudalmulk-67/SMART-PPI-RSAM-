import { useState, useEffect, useMemo, useRef, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  Activity,
  ArrowLeft,
  Save,
  CheckCircle2,
  Settings,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { uploadImagesToSupabase } from "@/lib/upload";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { useAppContext } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
import { EditableSelect } from "@/components/EditableSelect";
import { genericAuditConfigs } from "@/lib/audit-configs";

const unitList = [
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
  "Farmasi",
  "Rekam Medis",
  "Pantry",
];

const checklistItems =
  genericAuditConfigs.monitoring_fasilitas_apd?.items || [];
const tableName =
  genericAuditConfigs.monitoring_fasilitas_apd?.tableName ||
  "monitoring_fasilitas_apd";

type AuditStatus = "ya" | "tidak" | "na" | null;

export default function MonitoringFasilitasAPDPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === "admin" || userRole === "ipcn";

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [pjName, setPjName] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);

  const sigRef = useRef<DigitalSignatureRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const initialData: Record<string, AuditStatus> = {};
    const initialNotes: Record<string, string> = {};
    checklistItems.forEach((item) => {
      initialData[item.id] = null;
      initialNotes[item.id] = "";
    });
    setStartTime(new Date());
    setData(initialData);
    setNotes(initialNotes);
  }, []);

  const toggleItem = (id: string, stat: AuditStatus) => {
    setData((prev) => ({ ...prev, [id]: stat }));
  };

  const handleNoteChange = (id: string, val: string) => {
    setNotes((prev) => ({ ...prev, [id]: val }));
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
    let status = "Belum Dinilai";
    if (dinilai > 0) {
      status =
        persentase >= 85
          ? "Baik"
          : persentase >= 70
            ? "Cukup"
            : "Perlu Tindak Lanjut";
    }
    return { patuh, dinilai, persentase, status };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) {
      alert("Harap pilih Supervisor!");
      return;
    }
    if (Object.values(data).some((v) => v === null)) {
      alert("Harap isi semua checklist!");
      return;
    }

    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const uploadedUrls = await uploadImagesToSupabase(
        supabase,
        images,
        "logos",
        "audit",
      );

      const recordId = crypto.randomUUID();

      const payloadIndikator: Record<string, any> = {};
      Object.keys(data).forEach((key) => {
        payloadIndikator[key] = {
          status: data[key],
          keterangan: notes[key] || "",
        };
      });

      const sessionPayload = {
        id: recordId,
        waktu: startTime?.toISOString() || new Date().toISOString(),
        supervisor: observer,
        unit: unit,
        checklist_json: payloadIndikator,
        persentase: stats.persentase,
        temuan,
        rekomendasi,
        ttd_pj,
        ttd_ipcn,
        foto: uploadedUrls,
        created_at: new Date().toISOString(),
      };

      await supabase.from(tableName).insert([sessionPayload]);

      const payloadStats = {
        id: recordId,
        indikator_id: tableName,
        kategori_id: "monitoring",
        ruangan: unit,
        supervisor: observer,
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        persentase: stats.persentase,
        jumlah_patuh: stats.patuh,
        jumlah_tindakan: stats.dinilai,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        dokumentasi: uploadedUrls,
        data_indikator: data,
      };

      await supabase.from("audit_sessions").insert([payloadStats]);

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-8">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 animate-gradient drop-shadow-sm uppercase">
            Input Monitoring Fasilitas APD
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Monitoring ketersediaan alat pelindung diri sesuai standar PPI Rumah
            Sakit.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-white/5 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-white/5 shadow-sm space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark] transition-colors"
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
              label="Ruangan / Unit"
              value={unit}
              onChange={setUnit}
              options={unitList}
              isIPCN={isIPCN}
              storageKey="smartppi_units"
              placeholder="Pilih Unit..."
            />
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            📋 Indikator Kepatuhan
          </h2>
          <div className="space-y-4">
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
                            onClick={() => toggleItem(item.id, choice as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                              data[item.id] === choice
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
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.status}
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
          disabled={isSubmitting || !observer || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
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

MonitoringFasilitasAPDPage.getLayout = function getLayout(
  page: React.ReactElement,
) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
