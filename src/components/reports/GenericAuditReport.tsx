import React, { useState, useEffect, useMemo, useCallback } from "react";
import { utils, writeFile } from "xlsx";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp,
  Activity,
  BarChart2,
  TrendingDown,
  Target,
  Calendar,
  CheckSquare,
  Search,
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  User,
  Building2,
  Clock,
  Check,
  Trash2,
  Edit,
  Plus,
  Camera,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "@/components/ChartComponents";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAppContext } from "@/components/Providers";

interface GenericAuditData {
  id: string;
  tanggal_waktu?: string;
  waktu?: string;
  observer?: string;
  supervisor?: string;
  unit?: string;
  ruangan?: string;
  profesi?: string;
  nama_pasien?: string;
  data_indikator?: Record<string, string | null>;
  checklist_json?: Record<string, string | null>;
  persentase: number;
  status_kepatuhan?: string;
  temuan?: string;
  rekomendasi?: string;
  foto?: string[];
  dokumentasi?: string[];
  tanda_tangan_1?: string;
  tanda_tangan_2?: string;
  ttd_pj_ruangan?: string;
  ttd_ipcn?: string;
  tanda_tangan?: string[];
  nama_pj_ruangan?: string;
}

export default function GenericAuditReport({
  tableName,
  indicatorItems,
  title,
  extraFilter,
  filters,
}: {
  tableName: string;
  indicatorItems: {
    id: string;
    label: string;
    key: string;
    isNegative?: boolean;
  }[];
  title: string;
  extraFilter?: Record<string, string>;
  filters?: {
    periode?: string;
    unitFilter?: string;
    searchQuery?: string;
    type?: string;
  };
}) {
  const { hospitalLogoUrl } = useAppContext();
  const [data, setData] = useState<GenericAuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [searchDoc, setSearchDoc] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let sessionQuery = supabase
        .from("audit_sessions")
        .select("*")
        .eq("indikator_id", tableName);
      if (extraFilter) sessionQuery = sessionQuery.match(extraFilter);
      const { data: sessionData } = await sessionQuery.order("tanggal_waktu", {
        ascending: false,
      });

      let tableData: any[] = [];
      try {
        let tableQuery = supabase.from(tableName).select("*");
        if (extraFilter) tableQuery = tableQuery.match(extraFilter);
        const { data: tData } = await tableQuery.order("tanggal_waktu", {
          ascending: false,
        });
        if (tData) tableData = tData;
      } catch (e) {}

      const rawData = [...(sessionData || []), ...tableData];
      const ids = new Set();
      const result = rawData.filter((d) => {
        const key = d.id;
        if (key && ids.has(key)) return false;
        if (key) ids.add(key);
        return true;
      });

      const normalized = result
        .map((item: any) => {
          const jsonFallback =
            item.checklist_json ||
            item.data_indikator ||
            item.checklist_data ||
            {};
          return {
            ...item,
            waktu: item.tanggal_waktu || item.waktu || item.created_at,
            checklist_json: jsonFallback,
            persentase:
              item.persentase !== undefined
                ? item.persentase
                : item.compliance_score !== undefined
                  ? item.compliance_score
                  : 0,
            tanda_tangan_1:
              item.ttd_pj_ruangan ||
              item.ttd_pj ||
              item.tanda_tangan_1 ||
              jsonFallback.tanda_tangan_pj ||
              item.tanda_tangan?.[0],
            tanda_tangan_2:
              item.ttd_ipcn ||
              item.tanda_tangan_2 ||
              jsonFallback.tanda_tangan_ipcn ||
              jsonFallback.tanda_tangan_spv ||
              item.tanda_tangan?.[1],
            foto:
              item.dokumentasi || item.foto || jsonFallback.dokumentasi || [],
            nama_pj_ruangan:
              item.nama_pj_ruangan ||
              item.nama_pj ||
              item.auditee ||
              jsonFallback.nama_pj_ruangan ||
              jsonFallback.nama_pj ||
              "",
            observer: item.observer || item.supervisor || item.ipcn || "",
            unit: item.unit || item.ruangan || "",
            temuan: item.temuan || jsonFallback.temuan || "",
            rekomendasi: item.rekomendasi || jsonFallback.rekomendasi || "",
          };
        })
        .sort(
          (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime(),
        );

      setData(normalized);
      if (normalized.length > 0 && selectedRecordId === null)
        setSelectedRecordId(normalized[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tableName, extraFilter, selectedRecordId]);

  useEffect(() => {
    fetchData();
    const chTarget = supabase
      .channel(`changes_${tableName}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chTarget);
    };
  }, [tableName, fetchData]);

  useEffect(() => {
    const handleExportExcel = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.indicator === tableName) {
        if (!data || data.length === 0) {
          alert("Tidak ada data untuk diekspor");
          return;
        }

        const wb = utils.book_new();

        // Export Overview
        const wsData = data.map((item) => ({
          ID: item.id,
          Waktu: item.waktu
            ? format(parseISO(item.waktu), "dd/MM/yyyy HH:mm")
            : "",
          Supervisor: item.supervisor || item.observer || "-",
          "Unit/Ruangan": item.unit || item.ruangan || "-",
          "Profesi/Pasien": item.profesi || item.nama_pasien || "-",
          "Skor Kepatuhan (%)": item.persentase || 0,
          Temuan: item.temuan || "-",
          Rekomendasi: item.rekomendasi || "-",
        }));
        const ws = utils.json_to_sheet(wsData);
        utils.book_append_sheet(wb, ws, "Rekap Audit");

        writeFile(
          wb,
          `Laporan_${tableName}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`,
        );
      }
    };
    window.addEventListener("export-excel", handleExportExcel);
    return () => window.removeEventListener("export-excel", handleExportExcel);
  }, [data, tableName]);

  const { filteredRecords, summaryStats, trendData } = useMemo(() => {
    let filteredData = data;
    if (filters) {
      filteredData = data.filter((item) => {
        if (filters.periode) {
          if (!item.waktu) return false;

          const itemDate = new Date(item.waktu);
          const filterDate = new Date(filters.periode);
          const type = filters.type || "Tahunan";

          if (type === "Bulanan") {
            if (
              itemDate.getMonth() !== filterDate.getMonth() ||
              itemDate.getFullYear() !== filterDate.getFullYear()
            )
              return false;
          } else if (type === "Triwulan") {
            const qtItem = Math.floor(itemDate.getMonth() / 3);
            const qtFilter = Math.floor(filterDate.getMonth() / 3);
            if (
              qtItem !== qtFilter ||
              itemDate.getFullYear() !== filterDate.getFullYear()
            )
              return false;
          } else if (type === "Semester") {
            const sItem = Math.floor(itemDate.getMonth() / 6);
            const sFilter = Math.floor(filterDate.getMonth() / 6);
            if (
              sItem !== sFilter ||
              itemDate.getFullYear() !== filterDate.getFullYear()
            )
              return false;
          } else if (type === "Tahunan") {
            if (itemDate.getFullYear() !== filterDate.getFullYear())
              return false;
          }
        }
        if (filters.unitFilter && filters.unitFilter !== "Semua Unit") {
          if (
            item.unit !== filters.unitFilter &&
            item.ruangan !== filters.unitFilter
          )
            return false;
        }
        if (searchDoc) {
          const query = searchDoc.toLowerCase();
          if (
            !item.observer?.toLowerCase().includes(query) &&
            !item.unit?.toLowerCase().includes(query) &&
            !item.ruangan?.toLowerCase().includes(query)
          )
            return false;
        }
        return true;
      });
    }

    if (filteredData.length === 0)
      return {
        filteredRecords: [],
        summaryStats: { avg: 0, count: 0, high: 0, low: 0, trend: 0 },
        trendData: [],
      };

    const allPerc = filteredData.map((r) => r.persentase);
    const avg = allPerc.reduce((a, b) => a + b, 0) / allPerc.length;

    // Trend Data Logic
    const periodMap = new Map<string, any[]>();
    const filterDate = filters?.periode
      ? new Date(filters.periode)
      : new Date();
    const fYear = filterDate.getFullYear();
    let startMonth = 0;
    let endMonth = 11;
    const type = filters?.type || "Tahunan";

    if (type === "Bulanan") {
      startMonth = filterDate.getMonth();
      endMonth = filterDate.getMonth();
    } else if (type === "Triwulan") {
      startMonth = Math.floor(filterDate.getMonth() / 3) * 3;
      endMonth = startMonth + 2;
    } else if (type === "Semester") {
      startMonth = Math.floor(filterDate.getMonth() / 6) * 6;
      endMonth = startMonth + 5;
    }

    for (let i = startMonth; i <= endMonth; i++) {
      const k = `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][i]} ${fYear}`;
      periodMap.set(k, []);
    }

    filteredData.forEach((row) => {
      if (!row.waktu) return;
      const date = new Date(row.waktu);
      const k = `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][date.getMonth()]} ${date.getFullYear()}`;
      if (periodMap.has(k)) {
        periodMap.get(k)!.push(row);
      }
    });

    const trend = Array.from(periodMap.entries()).map(([k, recs]) => {
      const a =
        recs.length > 0
          ? recs.reduce((sum, r) => sum + (r.persentase || 0), 0) / recs.length
          : 0;
      return { name: k, val: Math.round(a) };
    });

    return {
      filteredRecords: filteredData,
      summaryStats: {
        avg: Math.round(avg),
        count: filteredData.length,
        high: Math.max(...allPerc),
        low: Math.min(...allPerc),
        trend:
          trend.length > 1 ? trend[trend.length - 1].val - trend[0].val : 0,
      },
      trendData: trend,
    };
  }, [data, filters, searchDoc]);

  // If selected record is not in filtered list, select the first one from filtered
  useEffect(() => {
    if (
      filteredRecords.length > 0 &&
      (!selectedRecordId ||
        !filteredRecords.find((r) => r.id === selectedRecordId))
    ) {
      setSelectedRecordId(filteredRecords[0].id);
    } else if (filteredRecords.length === 0) {
      setSelectedRecordId(null);
    }
  }, [filteredRecords, selectedRecordId]);

  const selectedRecord = filteredRecords.find((r) => r.id === selectedRecordId);

  const getStatus = (itemId: string) => {
    if (!selectedRecord) return undefined;
    const val: any = selectedRecord.checklist_json?.[itemId];
    if (typeof val === "string") return val.toLowerCase();
    if (
      val &&
      typeof val === "object" &&
      "status" in val &&
      typeof val.status === "string"
    ) {
      return val.status.toLowerCase();
    }
    return undefined;
  };

  const getKeterangan = (itemId: string) => {
    if (!selectedRecord) return "";
    const val: any = selectedRecord.checklist_json?.[itemId];
    if (
      val &&
      typeof val === "object" &&
      "keterangan" in val &&
      typeof val.keterangan === "string"
    ) {
      return val.keterangan;
    }
    return "";
  };

  const toSentenceCase = (str: string) => {
    if (!str) return "";
    const cleaned = str.replace(/_/g, " ");
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  };

  const checklistItems =
    indicatorItems && indicatorItems.length > 0
      ? indicatorItems.map((i) => ({ id: i.key, label: i.label }))
      : Object.keys(selectedRecord?.checklist_json || {}).map((k) => ({
          id: k,
          label: toSentenceCase(k),
        }));

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("record-selected", { detail: { id: selectedRecordId } }),
    );
  }, [selectedRecordId]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white/5 backdrop-blur-md rounded-3xl animate-pulse">
        <Activity className="w-10 h-10 text-slate-400 mb-4 animate-spin" />
        <span className="text-slate-500 font-medium">
          Memuat Data Analisis...
        </span>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* SELECTION ROW */}
      {tableName !== "pengendalian_lingkungan" &&
        tableName !== "penempatan_pasien" && (
          <div className="bg-white dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] p-4 sm:p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center z-10 relative print:hidden">
            <div className="flex-1 w-full">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Pilih Data Audit ({filteredRecords.length})
              </label>
              <select
                value={selectedRecordId || ""}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {filteredRecords.length === 0 && (
                  <option value="">Belum ada data di periode ini</option>
                )}
                {filteredRecords.map((rec, i) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.waktu
                      ? format(parseISO(rec.waktu), "dd/MM/yyyy HH:mm")
                      : "-"}{" "}
                    | {rec.unit || rec.ruangan || "Tanpa Unit"} |{" "}
                    {rec.observer || rec.supervisor || "Tanpa Supervisor"} |{" "}
                    {rec.persentase}%
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 w-full relative">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Pencarian Cepat
              </label>
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari unit atau supervisor..."
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

      {filteredRecords.length > 0 && selectedRecord ? (
        <div
          className="p-4 md:p-6 print:p-0 relative break-inside-avoid w-full max-w-[800px] mx-auto bg-force-white mb-8 border border-slate-200 dark:border-white/10 rounded-2xl print:border-none print:rounded-none print:mb-0 font-sans report-card-premium"
          style={{
            pageBreakAfter: "always",
            fontFamily: "var(--font-sans), Poppins, sans-serif",
          }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4 border-b-2 border-slate-800 pb-3 w-full text-center mt-6 print:mt-0">
            <div className="flex items-center gap-2 sm:gap-4 w-full justify-center text-center max-w-full">
              <div className="w-10 h-10 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center p-1">
                {hospitalLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hospitalLogoUrl}
                    alt="Logo RS"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-force-black" />
                )}
              </div>
              <div className="text-left">
                <h1 className="text-[9px] min-[400px]:text-[11px] sm:text-[13px] md:text-[15px] font-black tracking-tight leading-tight uppercase font-heading text-force-black whitespace-nowrap">
                  TIM PENCEGAHAN & PENGENDALIAN INFEKSI (PPI)
                </h1>
                <p className="text-[7.5px] min-[400px]:text-[8.5px] sm:text-[10px] md:text-[12px] font-bold uppercase text-force-black tracking-widest mt-0.5 whitespace-nowrap">
                  UOBK RSUD AL-MULK KOTA SUKABUMI
                </p>
                <p className="text-[6.5px] min-[400px]:text-[7px] sm:text-[8px] md:text-[9px] text-force-black mt-0.5 italic whitespace-nowrap">
                  Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota
                  Sukabumi, Jawa Barat.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mb-3">
            <h2 className="text-[16px] sm:text-[18px] font-black tracking-tight font-heading text-force-black w-full text-center uppercase">
              {title}
            </h2>
          </div>

          <div className="w-full mb-4 border-2 border-slate-800 border-collapse grid grid-cols-3">
            <div className="border-r border-slate-800 p-2 text-center flex flex-col items-center justify-center bg-slate-50">
              <p className="text-[8px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-1 mb-0.5">
                Waktu Pelaksanaan
              </p>
              <div className="font-bold text-[10px] sm:text-[11px] text-force-black">
                {selectedRecord.waktu
                  ? format(
                      parseISO(selectedRecord.waktu),
                      "dd MMM yyyy HH:mm",
                      { locale: idLocale },
                    )
                  : "-"}
              </div>
            </div>
            <div className="border-r border-slate-800 p-2 text-center flex flex-col items-center justify-center bg-slate-50">
              <p className="text-[8px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-1 mb-0.5">
                Supervisor / IPCN
              </p>
              <p className="font-bold text-[10px] sm:text-[11px] uppercase text-force-black">
                {selectedRecord.supervisor || selectedRecord.observer || "-"}
              </p>
            </div>
            <div className="p-2 text-center flex flex-col items-center justify-center bg-slate-50">
              <p className="text-[8px] font-black uppercase tracking-widest text-force-black flex items-center justify-center gap-1 mb-0.5">
                Unit / Ruangan
              </p>
              <p className="font-bold text-[10px] sm:text-[11px] uppercase text-force-black">
                {selectedRecord.unit || selectedRecord.ruangan || "-"}
              </p>
            </div>
          </div>

          <div className="mb-4 overflow-x-auto w-full print:overflow-visible">
            <table className="w-full border-collapse text-left text-[7.5px] min-[360px]:text-[8.5px] sm:text-[10px] text-force-black bg-force-white border-2 border-slate-800 mb-2 print:min-w-0">
              <thead>
                <tr className="bg-slate-50 font-black tracking-wider text-[7px] min-[340px]:text-[7.5px] sm:text-[9px] uppercase border-b-2 border-slate-800">
                  <th className="px-1 py-1.5 sm:px-2 sm:py-2 w-6 sm:w-8 text-center border border-slate-800 text-force-black">
                    No
                  </th>
                  <th className="px-1.5 py-1.5 sm:px-3 sm:py-2 border border-slate-800 text-force-black text-center">
                    Indikator
                  </th>
                  <th className="px-1 py-1.5 sm:px-2 sm:py-2 w-7 sm:w-10 text-center border border-slate-800 text-force-black">
                    Ya
                  </th>
                  <th className="px-1 py-1.5 sm:px-2 sm:py-2 w-8 sm:w-12 text-center border border-slate-800 text-force-black">
                    Tidak
                  </th>
                  <th className="px-1 py-1.5 sm:px-2 sm:py-2 w-7 sm:w-10 text-center border border-slate-800 text-force-black">
                    N/A
                  </th>
                  <th className="px-1.5 py-1.5 sm:px-3 sm:py-2 border border-slate-800 text-force-black text-center w-20 min-[400px]:w-28 sm:w-32">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map((item, itemIdx) => {
                  const status = getStatus(item.id);
                  const ket = getKeterangan(item.id);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 hover:bg-slate-50/50 transition-colors text-force-black"
                    >
                      <td className="px-1 py-1 sm:px-2 sm:py-2 text-center border border-slate-800 font-bold leading-tight">
                        {itemIdx + 1}
                      </td>
                      <td className="px-1.5 py-1 sm:px-3 sm:py-2 font-medium border border-slate-800 leading-tight">
                        {item.label.replace(/^\d+\.\s*/, "")}
                      </td>
                      <td className="px-1 py-1 sm:px-2 sm:py-2 text-center border border-slate-800 align-middle">
                        {status === "ya" && (
                          <span
                            className={`font-black text-[10px] sm:text-[12px] ${item.id === "peralatan_berkarat" || item.id === "jarum_suntik_bekas" ? "text-red-600" : "text-blue-600"}`}
                          >
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-1 sm:px-2 sm:py-2 text-center border border-slate-800 align-middle">
                        {status === "tidak" && (
                          <span
                            className={`font-black text-[10px] sm:text-[12px] ${item.id === "peralatan_berkarat" || item.id === "jarum_suntik_bekas" ? "text-blue-600" : "text-red-600"}`}
                          >
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-1 sm:px-2 sm:py-2 text-center border border-slate-800 align-middle">
                        {status === "na" && (
                          <span className="font-black text-[10px] sm:text-[12px] text-slate-500">
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="px-1.5 py-1 sm:px-3 sm:py-2 text-[7px] sm:text-[10px] italic border border-slate-800 leading-tight break-words">
                        {ket}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-4 gap-0 mb-4 break-inside-avoid border-2 border-slate-800">
            <div className="w-full md:col-span-3 grid grid-cols-3 gap-0 border-b-2 border-slate-800 md:border-b-0 md:border-r-2">
              <div className="p-3 border-r border-slate-800 text-center flex flex-col justify-center bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-1">
                  Patuh
                </p>
                <p className="text-xl sm:text-2xl font-black text-force-black font-mono leading-none">
                  {(() => {
                    return checklistItems.filter(
                      (item) => getStatus(item.id) === "ya",
                    ).length;
                  })()}
                </p>
              </div>
              <div className="p-3 border-r border-slate-800 text-center flex flex-col justify-center bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-1">
                  Tdk Patuh
                </p>
                <p className="text-xl sm:text-2xl font-black text-force-black font-mono leading-none">
                  {(() => {
                    return checklistItems.filter(
                      (item) => getStatus(item.id) === "tidak",
                    ).length;
                  })()}
                </p>
              </div>
              <div className="p-3 text-center flex flex-col justify-center bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-force-black mb-1">
                  N/A
                </p>
                <p className="text-xl sm:text-2xl font-black text-force-black font-mono leading-none">
                  {(() => {
                    return checklistItems.filter(
                      (item) => getStatus(item.id) === "na",
                    ).length;
                  })()}
                </p>
              </div>
            </div>
            <div className="w-full md:col-span-1 p-3 flex flex-col items-center justify-center text-center bg-blue-50/50">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-force-black">
                Persentase Capaian
              </p>
              <p className="text-2xl sm:text-3xl font-black font-heading mb-1.5 leading-none text-force-black">
                {selectedRecord.persentase || 0}%
              </p>
              <div className="text-[9px] font-black uppercase tracking-widest py-0.5 px-2 text-force-black print:p-0">
                {(selectedRecord.persentase || 0) >= 85
                  ? "SESUAI STANDAR"
                  : "TIDAK SESUAI"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 break-inside-avoid">
            <div className="border-2 border-slate-800 p-3 bg-slate-50/50">
              <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-force-black mb-2 border-b-2 border-slate-800 pb-1 flex items-center gap-2">
                Temuan Lapangan
              </h4>
              <div className="text-xs sm:text-sm text-force-black leading-tight whitespace-pre-wrap">
                {selectedRecord.temuan || (
                  <span className="italic">
                    Tidak ada temuan spesifik yang dicatat.
                  </span>
                )}
              </div>
            </div>
            <div className="border-2 border-slate-800 p-3 bg-slate-50/50">
              <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-force-black mb-2 border-b-2 border-slate-800 pb-1 flex items-center gap-2">
                Rekomendasi & Tindak Lanjut
              </h4>
              <div className="text-xs sm:text-sm text-force-black leading-tight whitespace-pre-wrap">
                {selectedRecord.rekomendasi || (
                  <span className="italic">
                    Sesuai dengan standar prosedur operasional yang berlaku.
                  </span>
                )}
              </div>
            </div>
          </div>

          {selectedRecord.foto &&
            (selectedRecord.foto as string[]).length > 0 && (
              <div className="mb-4 break-inside-avoid">
                <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-force-black mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-force-black" /> Lampiran
                  Dokumentasi
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(selectedRecord.foto as string[]).map(
                    (url: string, i: number) => (
                      <div
                        key={i}
                        onClick={() => setZoomedImage(url)}
                        className="aspect-video relative border border-slate-300 p-1 cursor-zoom-in"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Dokumentasi ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          crossOrigin="anonymous"
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          <div className="grid grid-cols-2 gap-8 mt-4 mb-2 break-inside-avoid">
            <div className="text-center space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-force-black mb-2">
                PJ Ruangan
              </p>
              <div className="h-16 relative w-full flex justify-center items-center">
                {selectedRecord.tanda_tangan_1 ? (
                  <img
                    src={selectedRecord.tanda_tangan_1}
                    className="object-contain h-full relative z-10 mix-blend-multiply"
                    alt="TTD PJ"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">
                    Tanpa Tanda Tangan
                  </span>
                )}
              </div>
              <div className="pt-1 border-t border-slate-300 w-[90%] md:w-48 mx-auto">
                <p className="font-bold text-[10px] uppercase tracking-wider text-force-black mt-1 text-wrap">
                  {selectedRecord.nama_pj_ruangan
                    ? `( ${selectedRecord.nama_pj_ruangan} )`
                    : "( ........................................ )"}
                </p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-force-black mb-2">
                IPCN / Auditor
              </p>
              <div className="h-16 relative w-full flex justify-center items-center">
                {selectedRecord.tanda_tangan_2 ? (
                  <img
                    src={selectedRecord.tanda_tangan_2}
                    className="object-contain h-full relative z-10 mix-blend-multiply"
                    alt="TTD IPCN"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">
                    Tanpa Tanda Tangan
                  </span>
                )}
              </div>
              <div className="pt-1 border-t border-slate-300 w-[90%] md:w-48 mx-auto">
                <p className="font-bold text-[10px] uppercase tracking-wider text-force-black mt-1 text-wrap">
                  ({" "}
                  {selectedRecord.supervisor ||
                    selectedRecord.observer ||
                    "........................................"}{" "}
                  )
                </p>
              </div>
            </div>
          </div>

          {tableName !== "pengendalian_lingkungan" &&
            tableName !== "penempatan_pasien" && (
              <div className="mt-8 text-center border-t-2 border-slate-800 pt-4 pb-2">
                <p className="text-[8px] font-bold uppercase tracking-widest text-force-black">
                  SMART PPI - Dicetak pada{" "}
                  {format(new Date(), "dd MMMM yyyy HH:mm", {
                    locale: idLocale,
                  })}
                </p>
              </div>
            )}
        </div>
      ) : (
        <div className="h-full bg-slate-50 dark:bg-[#111827]/80 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-12 md:p-20 text-center text-slate-500 shadow-sm min-h-[400px]">
          <FileText className="w-16 h-16 md:w-20 md:h-20 mb-6 text-slate-300 dark:text-slate-700" />
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2">
            Belum Ada Data Audit
          </h2>
          <p className="text-xs md:text-sm max-w-sm">
            Data laporan audit untuk indikator dan periode yang dipilih saat ini
            belum tersedia.
          </p>
        </div>
      )}

      {/* ZOOM IMAGE MODAL */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out print:hidden"
          >
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:m-0,
          .print\\:m-0 * {
            visibility: visible;
          }
          .print\\:m-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
