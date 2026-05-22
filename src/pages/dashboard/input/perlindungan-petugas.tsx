import { useState, useEffect, useMemo, ReactElement } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Activity,
  RefreshCw,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useAppContext } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import { EditableSelect } from "@/components/EditableSelect";

const units = [
  "IGD",
  "ICU",
  "IBS",
  "Ranap Aisyah",
  "Ranap Fatimah",
  "Ranap Khadijah",
  "Ranap Usman",
  "Laboratorium",
  "Radiologi",
  "Farmasi",
  "Rawat Jalan",
];

const auditItems = [
  {
    id: "item_1",
    label:
      "Imunisasi diberikan kepada seluruh petugas kesehatan, minimal vaksinasi Hepatitis B dan Covid-19",
    key: "item_1",
  },
  {
    id: "item_2",
    label: "Pemeriksaan kesehatan minimal 1x/tahun",
    key: "item_2",
  },
] as const;

type AuditStatus = "ya" | "tidak" | "na" | null;

export default function InputPerlindunganPetugasPage() {
  const router = useRouter();
  const { userRole } = useAppContext();

  const [startTime, setStartTime] = useState<Date | null>(null);

  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");

  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    item_1: null,
    item_2: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const d = new Date();
    setStartTime(d);
  }, []);

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
    if (Object.values(auditData).some((v) => v === null)) {
      alert("Harap isi semua indikator!");
      return;
    }
    setIsSubmitting(true);

    try {
      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        ...auditData,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from("audit_sessions")
        .insert([
          {
            indikator_id: "perlindungan_petugas",
            nama_indikator: "PERLINDUNGAN KESEHATAN PETUGAS",
            tanggal_waktu: payload.tanggal_waktu,
            observer,
            unit,
            jumlah_dinilai: stats.dinilai,
            jumlah_patuh: stats.patuh,
            persentase: stats.persentase,
            status_kepatuhan: stats.statusText,
            data_indikator: auditData,
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setStartTime(new Date(val));
    }
  };

  const formattedDate = startTime
    ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

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
            Data Audit Berhasil Disimpan!
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400">
            Audit Perlindungan Petugas
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">
            Observasi kesehatan dan perlindungan staf
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Informasi Audit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Waktu Audit
              </label>
              <input
                type="datetime-local"
                value={formattedDate}
                onChange={handleDateChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <EditableSelect
                label="Supervisor"
                value={observer}
                onChange={setObserver}
                options={["IPCN_Adi Tresa Purnama"]}
                isIPCN={userRole === "ipcn"}
                table="master_observers"
                storageKey="local_obs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="" className="bg-slate-900">
                  Pilih Unit...
                </option>
                {units.map((u) => (
                  <option key={u} value={u} className="bg-slate-900">
                    {u}
                  </option>
                ))}{" "}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST PERLINDUNGAN
            KESEHATAN PETUGAS
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

        <button
          type="submit"
          disabled={isSubmitting}
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

InputPerlindunganPetugasPage.getLayout = function getLayout(
  page: React.ReactElement,
) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
