import { useState, useEffect, useMemo, ReactElement, useRef } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Activity,
  RefreshCw,
  FileText,
  Camera,
  Signature,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAppContext } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import { uploadImagesToSupabase } from "@/lib/upload";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import { DocumentationUploader } from "@/components/DocumentationUploader";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";

type Observer = { id: string; nama: string };

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

const professions = [
  "Dokter Umum",
  "Dokter Spesialis",
  "Perawat",
  "Bidan",
  "Analis Laboratorium",
  "Radiografer",
  "Pramusaji",
];

const auditItems = [
  {
    id: "item_1",
    label: "Kursi/meja/dan loker tampak bersih dan dalam kondisi baik",
    key: "item_1",
  },
  { id: "item_2", label: "Troli tindakan tampak bersih", key: "item_2" },
  {
    id: "item_3",
    label: "Troli tindakan dibersihkan dan didesinfeksi setiap hari",
    key: "item_3",
  },
  {
    id: "item_4",
    label: "Lantai bersih dan dalam kondisi baik",
    key: "item_4",
  },
  { id: "item_5", label: "Ditemukan debu di permukaan kerja", key: "item_5" },
  {
    id: "item_6",
    label: "Tirai pemisah dan tirai jendela bersih dalam kondisi baik",
    key: "item_6",
  },
  { id: "item_7", label: "Kipas angin dan AC bersih", key: "item_7" },
  {
    id: "item_8",
    label: "Dinding dan langit-langit bebas jamur",
    key: "item_8",
  },
  { id: "item_9", label: "Ventilasi/jendela bersih", key: "item_9" },
  { id: "item_10", label: "Area tunggu/publik bersih", key: "item_10" },
  {
    id: "item_11",
    label: "Terdapat tanaman hidup di dalam ruang rawat inap",
    key: "item_11",
  },
  {
    id: "item_12",
    label: "Area WC/toilet bebas dari benda-benda yang tidak seharusnya ada",
    key: "item_12",
  },
  {
    id: "item_13",
    label: "Perlengkapan WC/toilet dalam kondisi baik dan tidak bau",
    key: "item_13",
  },
  {
    id: "item_14",
    label: "Tersedia fasilitas pembuangan sampah",
    key: "item_14",
  },
  {
    id: "item_15",
    label: "Dinding dan langit-langit WC/toilet bebas jamur",
    key: "item_15",
  },
] as const;

type AuditStatus = "ya" | "tidak" | "na" | null;

export default function InputPengendalianLingkunganPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { userRole } = useAppContext();

  const [startTime, setStartTime] = useState<Date | null>(null);

  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [pjName, setPjName] = useState("");

  const [observers, setObservers] = useState<Observer[]>([]);

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
    item_11: null,
    item_12: null,
    item_13: null,
    item_14: null,
    item_15: null,
  });

  const [images, setImages] = useState<any[]>([]);
  const signatureRef = useRef<DigitalSignatureRef>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchObservers();

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
            if (ed.unit) setUnit(ed.unit);

            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            if (indicatorsData.temuan) setTemuan(indicatorsData.temuan);
            if (indicatorsData.rekomendasi) setRekomendasi(indicatorsData.rekomendasi);
            
            const displayPjName = indicatorsData.nama_pj || indicatorsData.nama_pj_ruangan || ed.nama_pj_ruangan || "";
            if (typeof setPjName === "function") setPjName(displayPjName);

            try {
              setAuditData((prev: any) => {
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
              if (t1 && signatureRef.current?.setPjSignature) {
                signatureRef.current.setPjSignature(t1);
              }
              if (t2 && signatureRef.current?.setSupervisorSignature) {
                signatureRef.current.setSupervisorSignature(t2);
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

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase
        .from("master_observers")
        .select("*")
        .order("nama");
      if ((globalThis as any).error) throw new Error();

      let finalData = data || [];
      const hasAdi = finalData.some((s) => s.nama === "IPCN_Adi Tresa Purnama");
      if (!hasAdi) {
        finalData = [
          { id: "adi-static", nama: "IPCN_Adi Tresa Purnama" },
          ...finalData,
        ];
      }
      setObservers(finalData);
    } catch (err) {
      setObservers([{ id: "1", nama: "IPCN_Adi Tresa Purnama" }]);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    alert(`Error: ${err.message || "Terjadi kesalahan sistem"}`);
  };

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setAuditData((prev) => ({ ...prev, [id]: stat }));
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
      statusText = persentase === 100 ? "Patuh" : "Tidak Patuh";
    }
    return { patuh, dinilai, persentase, statusText };
  }, [auditData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const pjSig = signatureRef.current?.getPjSignature();
      const spvSig = signatureRef.current?.getSupervisorSignature();

      const uploadedImages = await uploadImagesToSupabase(
        supabase,
        images || [],
        "audit_images",
        "images",
      );

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
                tanda_tangan_spv: spvSig,
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from("audit_sessions")
        .insert([
          {
            indikator_id: "pengendalian_lingkungan",
            nama_indikator: "PENGENDALIAN LINGKUNGAN",
            tanggal_waktu: payload.tanggal_waktu,
            observer,
            unit,
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
              tanda_tangan_spv: spvSig,
              nama_pj: pjName,
            },
          },
        ])
        .select("*")
        .single();

      if (sessionError) throw sessionError;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
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
            Data Audit Pengendalian Lingkungan Tersimpan!
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
            Audit Pengendalian Lingkungan
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">
            Observasi kebersihan fasilitas dan lingkungan
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

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Observer
              </label>
              <select
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
              >
                <option value="" className="bg-slate-900">
                  Pilih Observer...
                </option>
                {observers.map((o) => (
                  <option key={o.id} value={o.nama} className="bg-slate-900">
                    {o.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
              >
                <option value="" className="bg-slate-900">
                  Pilih Unit...
                </option>
                {units.map((u) => (
                  <option key={u} value={u} className="bg-slate-900">
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
              placeholder="Tuliskan temuan audit lingkungan..."
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

InputPengendalianLingkunganPage.getLayout = function getLayout(
  page: React.ReactElement,
) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
