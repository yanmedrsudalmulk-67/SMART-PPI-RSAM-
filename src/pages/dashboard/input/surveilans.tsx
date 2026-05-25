import React, { useState, useEffect } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  Activity,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";

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

  const [rows, setRows] = useState<AggregateRow[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Harap lengkapi Waktu Surveilans.");
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

        return supabase.from("audit_sessions").insert([
          {
            indikator_id: r.hais.toLowerCase(),
            nama_indikator: r.hais,
            kategori: "Surveilans HAIs",
            tanggal_waktu: new Date(date).toISOString(),
            unit: r.ruangan,
            observer: "",
            jumlah_dinilai: den,
            jumlah_patuh: num,
            persentase: Math.round(rate),
            data_indikator: { numerator: num, denominator: den, rate: rate, isPercent },
          },
        ]);
      });

      await Promise.all(promises);
      setShowToast(true);

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
        <div className="bg-white/5 backdrop-blur-xl gap-6 p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Waktu Surveilans
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:w-1/2 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all [color-scheme:dark]"
          />
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
