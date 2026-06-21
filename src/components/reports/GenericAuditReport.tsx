import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { utils, writeFile } from "xlsx";
import { supabase } from "@/lib/supabase";
import { ReportSkeleton } from '@/components/SkeletonLoading';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
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
  ClipboardCheck,
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
import { genericAuditConfigs } from "@/lib/audit-configs";

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

const INDICATOR_TO_FORM_PATH: Record<string, string> = {
  'etika_batuk': '/dashboard/input/etika-batuk',
  'penempatan_pasien': '/dashboard/input/penempatan-pasien',
  'dekontaminasi_alat': '/dashboard/input/dekontaminasi-alat',
  'pengelolaan_limbah_medis': '/dashboard/input/pengelolaan-limbah-medis',
  'pengelolaan_limbah_tajam': '/dashboard/input/pengelolaan-limbah-tajam',
  'penatalaksanaan_linen': '/dashboard/input/penatalaksanaan-linen',
  'pengendalian_lingkungan': '/dashboard/input/pengendalian-lingkungan',
  'penyuntikan_aman': '/dashboard/input/penyuntikan-aman',
  'perlindungan_petugas': '/dashboard/input/perlindungan-petugas',
  'monitoring_airborne': '/dashboard/input/monitoring-airborne',
  'monitoring_jenazah': '/dashboard/input/monitoring-jenazah',
  'monitoring_laboratorium': '/dashboard/input/monitoring-laboratorium',
  'monitoring_radiologi': '/dashboard/input/monitoring-radiologi',
  'monitoring_ppi_ruang_isolasi': '/dashboard/input/monitoring-ruang_isolasi',
  'monitoring_immuno': '/dashboard/input/monitoring-immuno',
  'monitoring_fasilitas_hand_hygiene': '/dashboard/input/monitoring-fasilitas_hh',
  'monitoring_fasilitas_apd': '/dashboard/input/monitoring-fasilitas_apd',
  'monitoring_farmasi': '/dashboard/input/monitoring-farmasi',
  'monitoring_ibs': '/dashboard/input/monitoring-ibs',
  'monitoring_cssd': '/dashboard/input/monitoring-cssd',
  'monitoring_gizi': '/dashboard/input/monitoring-gizi',
  'monitoring_ambulance': '/dashboard/input/monitoring-ambulance',
  'monitoring_tunggu': '/dashboard/input/monitoring-tunggu',
  'monitoring_tps': '/dashboard/input/monitoring-tps',
};

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
  const router = useRouter();
  const { hospitalLogoUrl, userRole } = useAppContext();
  const hasEditAccess = userRole === "Admin" || userRole === "IPCN" || userRole === "Supervisor";

  const [data, setData] = useState<GenericAuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [searchDoc, setSearchDoc] = useState("");

  // Deletion States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const normalizeItem = useCallback((item: any) => {
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
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const config = genericAuditConfigs[tableName];
      const configExtraFilter = config?.extraFilter;
      const finalExtraFilter = extraFilter || configExtraFilter;

      let sessionQuery = supabase
        .from("audit_sessions")
        .select("*");

      if (config && config.tableName === "audit_bundles_hais") {
        sessionQuery = sessionQuery.eq("indikator_id", "audit_bundles_hais");
        if (configExtraFilter && configExtraFilter.bundle_id) {
          sessionQuery = sessionQuery.eq("jenis_tindakan", configExtraFilter.bundle_id);
        }
      } else {
        sessionQuery = sessionQuery.eq("indikator_id", tableName);
        if (extraFilter) sessionQuery = sessionQuery.match(extraFilter);
      }

      const { data: sessionData } = await sessionQuery.order("tanggal_waktu", {
        ascending: false,
      });

      let tableData: any[] = [];
      try {
        const actualTable = config?.tableName || tableName;
        let tableQuery = supabase.from(actualTable).select("*");
        if (finalExtraFilter) tableQuery = tableQuery.match(finalExtraFilter);
        const { data: tData } = await tableQuery.order("tanggal_waktu", {
          ascending: false,
        });
        if (tData) tableData = tData;
        
        if (tableName && actualTable !== tableName) {
          let oldQuery = supabase.from(tableName).select("*");
          if (finalExtraFilter) oldQuery = oldQuery.match(finalExtraFilter);
          const { data: tOldData } = await oldQuery.order("tanggal_waktu", {
            ascending: false,
          });
          if (tOldData) {
            tableData = [...tableData, ...tOldData];
          }
        }
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
        .map(normalizeItem)
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
  }, [tableName, extraFilter, selectedRecordId, normalizeItem]);

  useEffect(() => {
    fetchData();
    const actualTable = genericAuditConfigs[tableName]?.tableName || tableName;
    
    const handlePayload = (payload: any) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
         if (payload.new.indikator_id && payload.new.indikator_id !== tableName) return;
         setData(prev => {
            const norm = normalizeItem(payload.new);
            const isUpdate = prev.some(p => p.id === norm.id);
            const nextData = isUpdate ? prev.map(p => p.id === norm.id ? norm : p) : [norm, ...prev];
            return nextData.sort((a,b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
         });
      } else if (payload.eventType === 'DELETE') {
         setData(prev => prev.filter(p => p.id !== payload.old.id));
      }
    };

    const chTarget = supabase
      .channel(`changes_${tableName}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_sessions", filter: `indikator_id=eq.${tableName}` }, handlePayload)
      .on("postgres_changes", { event: "*", schema: "public", table: actualTable }, handlePayload)
      .subscribe();

    return () => {
      supabase.removeChannel(chTarget);
    };
  }, [tableName, fetchData, normalizeItem]);

  const handleEditClick = (recordId: string) => {
    const formPath = INDICATOR_TO_FORM_PATH[tableName];
    if (formPath) {
      router.push(`${formPath}?id=${recordId}&mode=edit`);
    } else {
      alert("Form input untuk indikator ini belum terdaftar atau tidak didukung.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      // 1. Delete from audit_details first because it has foreign keys referencing audit_sessions(id)
      const { error: errDetails } = await supabase
        .from("audit_details")
        .delete()
        .eq("session_id", deleteConfirmId);
      if (errDetails) {
        console.warn("Detail deletion returned error:", errDetails);
      }

      // 2. Delete from specific indicator table if applicable
      if (tableName && tableName !== "audit_sessions" && tableName !== "audit_hand_hygiene" && tableName !== "audit_apd") {
        const tableToDelete = genericAuditConfigs[tableName]?.tableName || tableName;
        
        const { error: errSpec1 } = await supabase
          .from(tableToDelete)
          .delete()
          .eq("id", deleteConfirmId);
        if (errSpec1) {
          console.warn(`Deleting from ${tableToDelete} returned error:`, errSpec1);
        }

        if (tableToDelete !== tableName) {
          const { error: errSpec2 } = await supabase
            .from(tableName)
            .delete()
            .eq("id", deleteConfirmId);
          if (errSpec2) {
            console.warn(`Deleting from ${tableName} returned error:`, errSpec2);
          }
        }
      }

      // 3. Delete from audit_sessions finally
      const { error: errSession } = await supabase
        .from("audit_sessions")
        .delete()
        .eq("id", deleteConfirmId);
      
      if (errSession) {
        throw new Error(errSession.message);
      }

      // Success toast
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 3000);

      // Refresh
      await fetchData();
      
      // If active record was deleted, clear it or pick first available
      if (selectedRecordId === deleteConfirmId) {
        setSelectedRecordId(null);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menghapus data: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

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
              itemDate.getUTCMonth() !== filterDate.getUTCMonth() ||
              itemDate.getUTCFullYear() !== filterDate.getUTCFullYear()
            )
              return false;
          } else if (type === "Triwulan") {
            const qtItem = Math.floor(itemDate.getUTCMonth() / 3);
            const qtFilter = Math.floor(filterDate.getUTCMonth() / 3);
            if (
              qtItem !== qtFilter ||
              itemDate.getUTCFullYear() !== filterDate.getUTCFullYear()
            )
              return false;
          } else if (type === "Semester") {
            const sItem = Math.floor(itemDate.getUTCMonth() / 6);
            const sFilter = Math.floor(filterDate.getUTCMonth() / 6);
            if (
              sItem !== sFilter ||
              itemDate.getUTCFullYear() !== filterDate.getUTCFullYear()
            )
              return false;
          } else if (type === "Tahunan") {
            if (itemDate.getUTCFullYear() !== filterDate.getUTCFullYear())
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
    if (val === undefined || val === null) return undefined;
    if (typeof val === "string") return val.toLowerCase();
    if (typeof val === "boolean") return val ? "ya" : "tidak";
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

  const [dynamicChecklist, setDynamicChecklist] = useState<{id: string, label: string}[] | null>(null);

  useEffect(() => {
    if (!selectedRecordId) {
      setDynamicChecklist(null);
      return;
    }
    const fetchDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("audit_details")
          .select("id, pertanyaan_id, pertanyaan")
          .eq("session_id", selectedRecordId)
          .order("id", { ascending: true });
        
        if (!error && data && data.length > 0) {
          // Sort or preserve order? The database doesn't have an order column but usually inserted in order.
          // We can assume insertion order or natural sort of IDs.
          const uniqueItems = Array.from(new Set(data.map(d => d.pertanyaan_id))).map(id => {
            const item = data.find(d => d.pertanyaan_id === id);
            return {
              id: item!.pertanyaan_id,
              label: item!.pertanyaan
            };
          });
          setDynamicChecklist(uniqueItems);
        } else {
          setDynamicChecklist(null);
        }
      } catch (err) {
        setDynamicChecklist(null);
      }
    };
    fetchDetails();
  }, [selectedRecordId]);

  const checklistItems =
    dynamicChecklist && dynamicChecklist.length > 0
      ? dynamicChecklist
      : indicatorItems && indicatorItems.length > 0
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

  // Ensure scroll resets to top when data loading finishes or selected record changes
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
    }
  }, [loading, selectedRecordId]);

  if (loading && !data.length)
    return <ReportSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">

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
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-xs font-black text-white hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 uppercase tracking-widest cursor-pointer"
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

      <div className="pt-6 border-t border-white/5">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 pl-1">Lembar Laporan Resmi</h4>
      </div>

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
                            className={`font-black text-[10px] sm:text-[14px] ${item.id === "peralatan_berkarat" || item.id === "jarum_suntik_bekas" ? "text-red-600" : "text-emerald-600"}`}
                          >
                            ✓
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-1 sm:px-2 sm:py-2 text-center border border-slate-800 align-middle">
                        {status === "tidak" && (
                          <span
                            className={`font-black text-[10px] sm:text-[14px] ${item.id === "peralatan_berkarat" || item.id === "jarum_suntik_bekas" ? "text-emerald-600" : "text-red-600"}`}
                          >
                            ✗
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-1 sm:px-2 sm:py-2 text-center border border-slate-800 align-middle">
                        {(status === "na" || status === "n/a") && (
                          <span className="font-black text-[12px] sm:text-[16px] text-slate-500">
                            -
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

      {/* Tabel Riwayat Laporan */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-400" />
              Tabel Riwayat Laporan
            </h3>
            <p className="text-xs text-slate-400 mt-1">Daftar laporan kepatuhan yang tercatat pada sistem</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-white/5 text-[11px] uppercase tracking-widest text-slate-400 font-bold border-b border-white/5">
                <th className="py-4 px-6 w-16 text-center">No</th>
                <th className="py-4 px-6">Tanggal Audit</th>
                <th className="py-4 px-6">Unit / Ruangan</th>
                <th className="py-4 px-6">Observer</th>
                <th className="py-4 px-6 text-center">Capaian</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center shadow-sm">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider">
                    Belum Ada Data Audit
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => {
                  const isActive = row.id === selectedRecordId;
                  const score = row.persentase !== undefined ? row.persentase : 0;
                  
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRecordId(row.id)}
                      className={`cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-600/10 hover:bg-blue-600/15 border-l-4 border-l-blue-500"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="py-4 px-6 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium font-mono text-xs">
                        {row.waktu ? format(parseISO(row.waktu), "dd MMMM yyyy HH:mm", { locale: idLocale }) : "-"}
                      </td>
                      <td className="py-4 px-6 text-white font-semibold">
                        {row.unit || "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-400 italic">
                        {row.observer || "-"}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-black text-white">
                        {score}%
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          score >= 85 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          score >= 70 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {score >= 85 ? 'Patuh' : score >= 70 ? 'Cukup' : 'Tidak Patuh'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        {hasEditAccess && tableName !== "audit_hand_hygiene" && tableName !== "audit_apd" ? (
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
