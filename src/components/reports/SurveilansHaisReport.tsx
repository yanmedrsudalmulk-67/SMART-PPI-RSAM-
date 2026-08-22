import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { ReportSkeleton } from '@/components/SkeletonLoading';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import { useAppContext } from "@/components/Providers";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart,
  LineChart,
  Table2,
  TrendingUp,
  AlertCircle,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
} from "recharts";

interface SurveilansHaisReportProps {
  indicator: string; // 'phlebitis', 'isk', 'vap', 'ido'
  periodeStartISO: string;
  periodeType: string;
}

const STANDARDS: Record<string, number> = {
  phlebitis: 1,
  isk: 4.7,
  vap: 5.8,
  ido: 2,
};

const IND_NAMES: Record<string, string> = {
  phlebitis: "Phlebitis",
  isk: "Infeksi Saluran Kemih (ISK)",
  vap: "Ventilator Associated Pneumonia (VAP)",
  ido: "Infeksi Daerah Operasi (IDO)",
};

const COLORS: Record<string, string> = {
  phlebitis: "#06b6d4", // cyan
  isk: "#10b981", // emerald
  vap: "#a855f7", // purple
  ido: "#f59e0b", // orange
};

export default function SurveilansHaisReport({
  indicator,
  periodeStartISO,
  periodeType,
}: SurveilansHaisReportProps) {
  const router = useRouter();
  const { userRole } = useAppContext();
  const hasEditAccess = userRole === "Admin" || userRole === "IPCN" || userRole === "Supervisor";

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");

  // Deletion States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  // Load historical data for this year to show trend
  useEffect(() => {
    const fetchHaisData = async () => {
      setLoading(true);
      try {
        const startOfYear = new Date(
          new Date(periodeStartISO).getFullYear(),
          0,
          1,
        ).toISOString();

        const { data: resData } = await supabase
          .from("audit_sessions")
          .select("*")
          .eq("kategori", "Surveilans HAIs")
          .ilike("indikator_id", indicator)
          .gte("tanggal_waktu", startOfYear)
          .order("tanggal_waktu", { ascending: true });

        setData(resData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHaisData();

    // real-time
    const channel = supabase
      .channel("hais_report_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audit_sessions",
          filter: `kategori=eq.Surveilans HAIs`,
        },
        fetchHaisData,
      )
      .on("broadcast", { event: "audit_submitted" }, () => {
        fetchHaisData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [indicator, periodeStartISO]);

  // Ensure scroll resets to top when data loading finishes
  useEffect(() => {
    const scrollToTop = () => {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: "instant" as any });
      }
      const scrollableElements = document.querySelectorAll('.overflow-y-auto');
      scrollableElements.forEach(el => {
        el.scrollTop = 0;
      });
      window.scrollTo({ top: 0, behavior: "instant" as any });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if (!loading) {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 150);
    }
  }, [loading]);

  const handleEditClick = (recordId: string) => {
    router.push(`/dashboard/input/surveilans?id=${recordId}&mode=edit`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("audit_sessions")
        .delete()
        .eq("id", deleteConfirmId);
      if (error) throw error;

      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 3000);

      // Re-trigger local update
      setData((prev) => prev.filter((item) => item.id !== deleteConfirmId));
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menghapus data surveilans: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const maxStandard = STANDARDS[indicator] || 0;
  const isPercent = indicator === "ido";
  const symbol = isPercent ? "%" : "‰";
  const color = COLORS[indicator] || "#3b82f6";
  const indName = IND_NAMES[indicator] || indicator;

  // Filter data for the table exactly matching the current period
  const currentPeriodData = useMemo(() => {
    return data.filter((d) => (d.tanggal_waktu || d.created_at) >= periodeStartISO);
  }, [data, periodeStartISO]);

  // Chart data grouping
  const chartData = useMemo(() => {
    if (!data.length) return [];
    const grouped: Record<string, { num: number; den: number }> = {};

    data.forEach((item) => {
      const dt = parseISO(item.tanggal_waktu || item.created_at);
      let key = "";
      if (periodeType === "Bulanan" || periodeType === "Tahunan") {
        key = format(dt, "MMM yyyy", { locale: idLocale });
      } else if (periodeType === "Triwulan") {
        key = `Q${Math.floor(dt.getMonth() / 3) + 1} ${dt.getFullYear()}`;
      } else if (periodeType === "Semester") {
        key = `S${Math.floor(dt.getMonth() / 6) + 1} ${dt.getFullYear()}`;
      }

      if (!grouped[key]) grouped[key] = { num: 0, den: 0 };
      grouped[key].num += item.jumlah_patuh || 0;
      grouped[key].den += item.jumlah_dinilai || 0;
    });

    return Object.entries(grouped).map(([period, counts]) => {
      const mult = isPercent ? 100 : 1000;
      const rate = counts.den > 0 ? (counts.num / counts.den) * mult : 0;
      return {
        period,
        rate: Number(rate.toFixed(2)),
        standar: maxStandard,
      };
    });
  }, [data, periodeType, isPercent, maxStandard]);

  // Insight generator
  const insight = useMemo(() => {
    if (!chartData.length)
      return "Belum ada data pada periode ini untuk dianalisis.";
    const currentRate = chartData[chartData.length - 1].rate;
    const prevRate =
      chartData.length > 1 ? chartData[chartData.length - 2].rate : currentRate;

    let msg = `Capaian rate ${indName} periode terakhir adalah ${currentRate.toFixed(2)}${symbol}. `;
    if (currentRate > maxStandard) {
      msg += `Nilai ini berada di atas standar maksimal (${maxStandard}${symbol}), memerlukan investigasi lebih lanjut. `;
    } else {
      msg += `Nilai ini telah memenuhi standar nasional (≤${maxStandard}${symbol}). `;
    }

    if (chartData.length > 1) {
      if (currentRate > prevRate)
        msg += `Trend rate mengalami peningkatan dibandingkan periode sebelumnya.`;
      else if (currentRate < prevRate)
        msg += `Trend rate mengalami penurunan, ini adalah hal yang baik.`;
      else msg += `Trend stabil.`;
    }
    return msg;
  }, [chartData, indName, maxStandard, symbol]);

  if (loading && !data.length) return <ReportSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* TABLE SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center relative z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl" style={{ color }}>
              <Table2 className="w-5 h-5" />
            </div>
            Monitoring Realtime
          </h3>
        </div>

        <div className="p-0 overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-800/50 text-[11px] uppercase tracking-widest text-slate-400">
                <th className="py-4 px-6 font-black w-16 text-center">No</th>
                <th className="py-4 px-6 font-black">Tanggal Input</th>
                <th className="py-4 px-6 font-black">Kategori Ruangan</th>
                <th className="py-4 px-6 font-black text-right">Numerator</th>
                <th className="py-4 px-6 font-black text-right">Denominator</th>
                <th className="py-4 px-6 font-black text-right">Rate</th>
                <th className="py-4 px-6 font-black text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Memuat data realtime...
                  </td>
                </tr>
              ) : currentPeriodData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                      <p className="font-medium">
                        Belum ada data surveilans pada periode ini.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentPeriodData.map((row, idx) => {
                  const rate =
                    row.jumlah_dinilai > 0
                      ? (row.jumlah_patuh / row.jumlah_dinilai) *
                        (isPercent ? 100 : 1000)
                      : 0;
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-6 text-center text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {format(parseISO(row.created_at), "dd MMM yyyy HH:mm", {
                          locale: idLocale,
                        })}
                      </td>
                      <td className="py-4 px-6 font-medium text-white">
                        {row.unit}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-400">
                        {row.jumlah_patuh}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-400">
                        {row.jumlah_dinilai}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className="font-mono font-bold px-2.5 py-1 rounded-md"
                          style={{
                            backgroundColor: `${color}1A`,
                            color: color,
                          }}
                        >
                          {rate.toFixed(2)}
                          {symbol}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        {hasEditAccess ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(row.id)}
                              type="button"
                              className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-md border border-blue-500/20 group/btn"
                              title="Edit Data"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(row.id)}
                              type="button"
                              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-md border border-red-500/20 group/btn"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {deleteConfirmId && (
            <div className="fixed inset-0 z-[99999] font-sans flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmId(null)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-2xl backdrop-blur-xl"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-6 border border-red-500/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">Hapus Data Laporan</h3>
                <p className="text-sm text-slate-300 font-medium">Apakah Anda yakin ingin menghapus data laporan ini?</p>
                <p className="text-xs text-slate-400 mt-2 italic">Data yang telah dihapus tidak dapat dikembalikan.</p>
                
                <div className="mt-8 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50"
                  >
                    Tidak
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-xs font-bold text-white transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 cursor-pointer border border-red-400/50"
                  >
                    {isDeleting ? "Menghapus..." : "Ya"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <AnimatePresence>
        {showDeleteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[210] bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-emerald-400/30 font-sans"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            ✅ Data berhasil dihapus
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHART SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-xl" style={{ color }}>
                <TrendingUp className="w-5 h-5" />
              </div>
              Grafik Trend Capaian
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Visualisasi rate periode saat ini melawan standar
            </p>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setChartMode("bar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${chartMode === "bar" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              <BarChart className="w-4 h-4" /> Bar
            </button>
            <button
              onClick={() => setChartMode("line")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${chartMode === "line" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              <LineChart className="w-4 h-4" /> Line
            </button>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#ffffff10"
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  stroke="#64748b"
                  fontSize={11}
                  tickMargin={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "12px",
                    border: "1px solid #1e293b",
                    color: "#fff",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                  }}
                  itemStyle={{
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                  iconType="circle"
                />
                {chartMode === "bar" ? (
                  <Bar
                    dataKey="rate"
                    name={`Rate (${symbol})`}
                    fill="url(#chartColor)"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="rate"
                    name={`Rate (${symbol})`}
                    stroke={color}
                    strokeWidth={4}
                    activeDot={{
                      r: 6,
                      fill: color,
                      stroke: "#1e293b",
                      strokeWidth: 2,
                    }}
                    dot={{
                      r: 4,
                      fill: "#1e293b",
                      stroke: color,
                      strokeWidth: 2,
                    }}
                  />
                )}
                <Line
                  type="step"
                  dataKey="standar"
                  name={`Standar Maksimal (${maxStandard}${symbol})`}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-4 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
              <Activity className="w-12 h-12 text-slate-700/50" />
              <p className="font-bold text-sm tracking-widest uppercase">
                Data monitoring belum cukup untuk menghasilkan grafik
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-1">
              Analisa Data
            </h4>
            <p className="text-slate-300 text-sm text-justify leading-relaxed">{insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
