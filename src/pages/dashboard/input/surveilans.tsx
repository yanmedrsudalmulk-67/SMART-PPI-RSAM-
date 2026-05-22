import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Activity,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
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
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const KATEGORI_RUANGAN = [
  "Ranap Bedah",
  "Ranap Dewasa",
  "Ranap Anak",
  "Ranap Kebidanan",
  "ICU",
];

const KATEGORI_HAIS = ["Phlebitis", "ISK", "IDO", "VAP", "Decubitus"];

const STANDARD_HAIS: Record<string, string> = {
  Phlebitis: "< 1 ‰",
  ISK: "< 4.7 ‰",
  IDO: "< 2 %",
  VAP: "< 5.8 ‰",
  Decubitus: "< 1.5 ‰",
};

interface AggregateRow {
  id: string;
  ruangan: string;
  hais: string;
  numerator: number | "";
  denominator: number | "";
}

export default function SurveilansFormPage() {
  const router = useRouter();

  const [date, setDate] = useState<string>("");
  const [petugas, setPetugas] = useState<string>("");

  const [rows, setRows] = useState<AggregateRow[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grafik states
  const [histData, setHistData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState("Bulanan");
  const [chartHais, setChartHais] = useState("Phlebitis");

  useEffect(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setDate(localISOTime);
    setRows([
      {
        id: Date.now().toString(),
        ruangan: "",
        hais: "",
        numerator: "",
        denominator: "",
      },
    ]);
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    const { data } = await supabase
      .from("insiden_hais")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setHistData(data);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString() + Math.random().toString(),
        ruangan: "",
        hais: "",
        numerator: "",
        denominator: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof AggregateRow, value: any) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const calcRate = (row: AggregateRow) => {
    if (
      typeof row.numerator !== "number" ||
      typeof row.denominator !== "number" ||
      row.denominator === 0
    )
      return 0;
    const isPercent = row.hais === "IDO";
    const multiplier = isPercent ? 100 : 1000;
    return (row.numerator / row.denominator) * multiplier;
  };

  const formatRate = (row: AggregateRow) => {
    const rate = calcRate(row);
    if (!row.hais) return "-";
    const symbol = row.hais === "IDO" ? "%" : "‰";
    return `${rate.toFixed(2)} ${symbol}`;
  };

  const currentStandardValue = parseFloat(
    STANDARD_HAIS[chartHais]?.replace(/[^0-9.]/g, "") || "0",
  );

  // Process data for charts
  const processedChartData = useMemo(() => {
    if (!histData.length) return [];

    // Group by period
    const getPeriodKey = (d: string) => {
      const dt = parseISO(d);
      if (chartPeriod === "Bulanan")
        return format(dt, "MMM yyyy", { locale: idLocale });
      if (chartPeriod === "Triwulan")
        return `Q${Math.floor(dt.getMonth() / 3) + 1} ${dt.getFullYear()}`;
      if (chartPeriod === "Semester")
        return `S${Math.floor(dt.getMonth() / 6) + 1} ${dt.getFullYear()}`;
      return `${dt.getFullYear()}`;
    };

    const grouped: Record<string, { num: number; den: number }> = {};

    histData.forEach((item) => {
      if (item.jenis !== chartHais) return;
      const key = getPeriodKey(item.created_at);
      if (!grouped[key]) grouped[key] = { num: 0, den: 0 };
      grouped[key].num += item.jml_insiden || 0;
      grouped[key].den += item.jml_pemasangan || 0;
    });

    return Object.entries(grouped).map(([period, counts]) => {
      const isPercent = chartHais === "IDO";
      const mult = isPercent ? 100 : 1000;
      const rate = counts.den > 0 ? (counts.num / counts.den) * mult : 0;
      return {
        period,
        rate: Number(rate.toFixed(2)),
        standar: currentStandardValue,
      };
    });
  }, [histData, chartPeriod, chartHais, currentStandardValue]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !petugas) {
      setError("Harap lengkapi Waktu dan Petugas.");
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.ruangan || !r.hais || r.numerator === "" || r.denominator === "") {
        setError(`Data pada baris ke-${i + 1} belum lengkap.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const promises = rows.map((r) => {
        const num = Number(r.numerator);
        const den = Number(r.denominator);
        const isPercent = r.hais === "IDO";
        const rate = den > 0 ? (num / den) * (isPercent ? 100 : 1000) : 0;

        return supabase.from("insiden_hais").insert([
          {
            created_at: new Date(date).toISOString(),
            unit: r.ruangan,
            ruangan: r.ruangan,
            jenis: r.hais,
            rate: rate,
            petugas: petugas,
            nama_pasien: "Data Agregat", // Aggregate now
            no_rm: "-",
            jml_pemasangan: den,
            jml_insiden: num,
          },
        ]);
      });

      // Saving audit sessions
      promises.push(
        supabase.from("audit_sessions").insert([
          {
            indikator_id: "surveilans_hais",
            nama_indikator: "SURVEILANS HAIS",
            tanggal_waktu: new Date(date).toISOString(),
            observer: petugas,
            unit: "Keseluruhan",
            jumlah_dinilai: rows.reduce((s, r) => s + Number(r.denominator), 0),
            jumlah_patuh: 0,
            persentase: 100, // Aggregate meaning
            data_indikator: { rows },
          },
        ]),
      );

      await Promise.all(promises);
      setShowToast(true);
      fetchHistoricalData();

      setTimeout(() => {
        setRows([
          {
            id: Date.now().toString(),
            ruangan: "",
            hais: "",
            numerator: "",
            denominator: "",
          },
        ]);
        setShowToast(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-32 space-y-8 font-sans">
      <div className="flex items-center gap-4 mb-4 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-emerald-400 bg-[length:200%_auto] animate-gradient uppercase">
            Surveilans HAIs
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-blue-400 mt-1">
            Input Data Insiden Terintegrasi
          </p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center gap-3 text-sm font-medium backdrop-blur-sm"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Waktu Surveilans
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Nama Petugas (IPCN / IPCLN)
            </label>
            <input
              type="text"
              value={petugas}
              onChange={(e) => setPetugas(e.target.value)}
              placeholder="Masukkan nama petugas..."
              className="w-full px-4 py-3.5 bg-slate-900/50 border border-white/10 text-white font-semibold rounded-xl text-sm outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-400" />
              Detail Surveilans
            </h2>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 sm:-mx-8 sm:px-8 pb-4">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-white/10 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="pb-4 w-12 font-black text-center">No</th>
                  <th className="pb-4 px-3 font-black min-w-[160px]">
                    Kategori Ruangan
                  </th>
                  <th className="pb-4 px-3 font-black min-w-[140px]">
                    Kategori HAIS
                  </th>
                  <th className="pb-4 px-3 font-black min-w-[120px]">
                    Numerator
                  </th>
                  <th className="pb-4 px-3 font-black min-w-[120px]">
                    Denominator
                  </th>
                  <th className="pb-4 px-3 font-black min-w-[120px]">
                    Persentase
                  </th>
                  <th className="pb-4 px-3 font-black min-w-[100px] text-center">
                    Nilai Normal
                  </th>
                  <th className="pb-4 w-16 px-2 font-black text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 text-center text-sm font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-3">
                      <select
                        value={row.ruangan}
                        onChange={(e) =>
                          updateRow(row.id, "ruangan", e.target.value)
                        }
                        className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 text-white font-semibold rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Pilih Ruangan...</option>
                        {KATEGORI_RUANGAN.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-3">
                      <select
                        value={row.hais}
                        onChange={(e) =>
                          updateRow(row.id, "hais", e.target.value)
                        }
                        className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 text-white font-semibold rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Pilih HAIS...</option>
                        {KATEGORI_HAIS.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.numerator}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "numerator",
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value),
                          )
                        }
                        className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 text-white font-mono rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-4 px-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.denominator}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "denominator",
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value),
                          )
                        }
                        className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 text-white font-mono rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </td>
                    <td className="py-4 px-3">
                      <div className="px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold rounded-lg text-sm text-center">
                        {formatRate(row)}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 font-mono font-bold rounded-full text-xs whitespace-nowrap">
                        {row.hais ? STANDARD_HAIS[row.hais] : "-"}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all disabled:opacity-50 disabled:bg-transparent mx-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="w-full mt-6 py-4 bg-white/[0.02] hover:bg-white/[0.05] text-blue-400 font-black text-xs uppercase tracking-widest rounded-2xl transition-all border-2 border-blue-500/20 hover:border-blue-500/40 border-dashed"
          >
            + Tambah Baris Input
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-3 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-[1.25rem] transition-all shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] disabled:opacity-50 relative overflow-hidden group"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
          <span>Simpan Data Surveilans</span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
        </button>
      </form>

      {/* DASHBOARD GRAFIK CAPAIAN */}
      <div className="bg-[#0f172a] backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl mt-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 relative z-10">
          <h2 className="text-2xl font-black text-white flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            Grafik Capaian HAIs
          </h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
              <Filter className="w-4 h-4 text-slate-400 ml-3 mr-2" />
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 py-2 pr-8 outline-none"
              >
                <option value="Bulanan" className="bg-slate-900">
                  Bulanan
                </option>
                <option value="Triwulan" className="bg-slate-900">
                  Triwulan
                </option>
                <option value="Semester" className="bg-slate-900">
                  Semester
                </option>
                <option value="Tahunan" className="bg-slate-900">
                  Tahunan
                </option>
              </select>
            </div>
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
              <Activity className="w-4 h-4 text-emerald-400 ml-3 mr-2" />
              <select
                value={chartHais}
                onChange={(e) => setChartHais(e.target.value)}
                className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 py-2 pr-8 outline-none"
              >
                {KATEGORI_HAIS.map((h) => (
                  <option key={h} value={h} className="bg-slate-900">
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10">
          {processedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={processedChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff15"
                  vertical={false}
                />
                <XAxis
                  dataKey="period"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderRadius: "1rem",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    backdropFilter: "blur(10px)",
                  }}
                  itemStyle={{
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="rate"
                  name={`Insiden (${chartHais === "IDO" ? "%" : "‰"})`}
                  fill="url(#colorRate)"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
                <Line
                  type="monotone"
                  dataKey="standar"
                  name="Nilai Standar"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
              <Activity className="w-12 h-12 text-slate-700/50" />
              <p className="font-bold text-sm tracking-widest uppercase">
                Belum ada data capaian {chartHais}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl font-black uppercase tracking-widest text-xs border border-emerald-400 flex items-center gap-3 backdrop-blur-xl"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Data Surveilans Terekam Sukses</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

SurveilansFormPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
