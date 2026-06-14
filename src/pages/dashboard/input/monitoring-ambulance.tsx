import { useState, useEffect, useMemo, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Activity,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import { EditableSelect } from "@/components/EditableSelect";
import { useAppContext } from "@/components/Providers";

const checklistItems = [
  { id: "amb_1", label: "Kebersihan lantai, dinding dan langit-langit" },
  { id: "amb_2", label: "Kebersihan stretcher / tempat tidur pasien" },
  { id: "amb_3", label: "Tersedia handrub untuk kebersihan tangan" },
  { id: "amb_4", label: "Tersedia tisu dan tempat sampah tertutup" },
  { id: "amb_5", label: "Tersedia APD minimal masker dan sarung tangan" },
  { id: "amb_6", label: "Peralatan medis bersih dan tidak berdebu" },
  { id: "amb_7", label: "Tersedia wadah limbah benda tajam (safety box)" },
  { id: "amb_8", label: "Ambilance didekontaminasi setelah digunakan" },
  { id: "amb_9", label: "Tidak ada makanan dan minuman di ambulance" },
  { id: "amb_10", label: "Suhu AC terjaga dan dingin" },
];

export default function MonitoringAmbulancePage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState("");
  const [ambulanceId, setAmbulanceId] = useState("");
  const [data, setData] = useState<
    Record<string, "ya" | "tidak" | "na" | null>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          const { data: ed, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .single();

          if (ed && !error) {
            if (ed.tanggal_waktu) setStartTime(new Date(ed.tanggal_waktu));
            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            try { setData((prev: any) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((key) => {
                  if (indicatorsData[key] !== undefined) {
                    updated[key] = indicatorsData[key];
                  }
                });
                return updated; }); } catch(err) {}
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

  const handleActionClick = (id: string, val: "ya" | "tidak" | "na") => {
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
    if (!observer || !ambulanceId || stats.dinilai === 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("monitoring_ambulance").insert([
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
      if (error) throw error;
      setShowToast(true);
      setTimeout(() => router.push("/dashboard/input"), 2000);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data");
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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            Monitoring Ambulance
          </h1>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">
            Audit Kebersihan dan PPI Ambulance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="space-y-6">
          <div className="bg-white/5 p-8 rounded-[32px] border border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="space-y-4">
            {checklistItems.map((item) => {
              const val = data[item.id];
              const borderL =
                val === "ya"
                  ? "border-l-blue-500"
                  : val === "tidak"
                    ? "border-l-red-500"
                    : val === "na"
                      ? "border-l-slate-500"
                      : "border-l-transparent";
              return (
                <div
                  key={item.id}
                  className={`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 ${borderL} transition-all`}
                >
                  <h3 className="text-sm font-bold text-white mb-4">
                    {item.label}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["ya", "tidak", "na"].map((choice) => (
                      <button
                        key={choice}
                        onClick={() =>
                          handleActionClick(item.id, choice as any)
                        }
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          data[item.id] === choice
                            ? choice === "ya"
                              ? "bg-blue-600 text-white"
                              : choice === "tidak"
                                ? "bg-red-600 text-white"
                                : "bg-slate-600 text-white"
                            : "bg-white/5 text-slate-500 hover:bg-white/10"
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
        </div>

        <LiveStatisticsCard
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
        />

        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting || !observer || !ambulanceId || stats.dinilai === 0
          }
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>Simpan Data Monitoring</span>
        </button>
      </div>
    </div>
  );
}

MonitoringAmbulancePage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
