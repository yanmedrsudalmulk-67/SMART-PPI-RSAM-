import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart,
  LineChart,
  Table2,
  TrendingUp,
  AlertCircle,
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
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [indicator, periodeStartISO]);

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Memuat data realtime...
                  </td>
                </tr>
              ) : currentPeriodData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
          <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 mt-0.5">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-1">
              Analisis Otomatis
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
