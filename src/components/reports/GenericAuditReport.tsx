import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { utils, writeFile } from "xlsx";
import { supabase } from "@/lib/supabase";
import { ReportSkeleton } from '@/components/SkeletonLoading';
import { forceScrollToTop } from '@/utils/scrollHelper';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import PdfDownloadButton from "@/components/reports/PdfDownloadButton";
import ZoomableReportViewer from "@/components/reports/ZoomableReportViewer";
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
  upaya_perbaikan?: string;
  waktu_perbaikan?: string;
  foto_perbaikan?: string[];
  foto?: string[];
  dokumentasi?: string[];
  tanda_tangan_1?: string;
  tanda_tangan_2?: string;
  ttd_pj_ruangan?: string;
  ttd_ipcn?: string;
  tanda_tangan?: string[];
  nama_pj_ruangan?: string;
  nama_pj?: string;
  keterangan_json?: any;
  keterangan?: any;
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
  'audit_ruang_isolasi': '/dashboard/input/monitoring-ruang_isolasi',
  'ruang_isolasi': '/dashboard/input/monitoring-ruang_isolasi',
  'monitoring_ruang_isolasi': '/dashboard/input/monitoring-ruang_isolasi',
  'ppi_ruang_isolasi': '/dashboard/input/ppi-ruang-isolasi',
  'monitoring_immuno': '/dashboard/input/monitoring-immuno',
  'monitoring_fasilitas_hand_hygiene': '/dashboard/input/monitoring-fasilitas_hh',
  'fasilitas_hh': '/dashboard/input/monitoring-fasilitas_hh',
  'monitoring_fasilitas_apd': '/dashboard/input/monitoring-fasilitas_apd',
  'fasilitas_apd': '/dashboard/input/monitoring-fasilitas_apd',
  'monitoring_farmasi': '/dashboard/input/monitoring-farmasi',
  'monitoring_ibs': '/dashboard/input/monitoring-ibs',
  'monitoring_cssd': '/dashboard/input/monitoring-cssd',
  'monitoring_gizi': '/dashboard/input/monitoring-gizi',
  'monitoring_ambulance': '/dashboard/input/monitoring-ambulance',
  'monitoring_tunggu': '/dashboard/input/monitoring-tunggu',
  'monitoring_tps': '/dashboard/input/monitoring-tps',
  'hand_hygiene': '/dashboard/input/hand-hygiene',
  'audit_hand_hygiene': '/dashboard/input/hand-hygiene',
  'apd': '/dashboard/input/apd',
  'audit_apd': '/dashboard/input/apd',
  'surveilans': '/dashboard/input/surveilans',
  'surveilans_hais': '/dashboard/input/surveilans',
  'diklat': '/dashboard/input/diklat',
  'diklat_ppi': '/dashboard/input/diklat',
  'iadp': '/dashboard/input/bundles/iadp',
  'cauti': '/dashboard/input/bundles/cauti',
  'ido_b': '/dashboard/input/bundles/ido',
  'vap_b': '/dashboard/input/bundles/vap',
  'plebitis': '/dashboard/input/bundles/plebitis',
  'bundle_iadp': '/dashboard/input/bundles/iadp',
  'bundle_cauti': '/dashboard/input/bundles/cauti',
  'bundle_isk': '/dashboard/input/bundles/cauti',
  'bundle_ido': '/dashboard/input/bundles/ido',
  'bundle_vap': '/dashboard/input/bundles/vap',
  'bundle_plebitis': '/dashboard/input/bundles/plebitis',
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
    section?: string;
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
    let jsonFallback =
      item.checklist_json ||
      item.data_indikator ||
      item.checklist_data ||
      {};
      
    // Handle nested data structures like { data: { iso_1: 'ya' }, keterangan: ... }
    if (jsonFallback.data && typeof jsonFallback.data === 'object' && !Array.isArray(jsonFallback.data)) {
      jsonFallback = { ...jsonFallback.data, ...jsonFallback };
    }

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
        item.tanda_tangan_pj ||
        jsonFallback.ttd_pj_ruangan ||
        jsonFallback.ttd_pj ||
        jsonFallback.tanda_tangan_pj ||
        jsonFallback.tanda_tangan_1 ||
        (Array.isArray(jsonFallback.tanda_tangan) ? jsonFallback.tanda_tangan[0] : null) ||
        (Array.isArray(item.tanda_tangan) ? item.tanda_tangan[0] : null) ||
        (typeof item.tanda_tangan_1 === 'string' ? item.tanda_tangan_1 : null) ||
        (typeof jsonFallback.tanda_tangan_1 === 'string' ? jsonFallback.tanda_tangan_1 : null) ||
        null,
      tanda_tangan_2:
        item.ttd_ipcn ||
        item.tanda_tangan_2 ||
        item.tanda_tangan_ipcn ||
        item.tanda_tangan_spv ||
        jsonFallback.ttd_ipcn ||
        jsonFallback.tanda_tangan_ipcn ||
        jsonFallback.tanda_tangan_spv ||
        jsonFallback.tanda_tangan_2 ||
        (Array.isArray(jsonFallback.tanda_tangan) ? jsonFallback.tanda_tangan[1] : null) ||
        (Array.isArray(item.tanda_tangan) ? item.tanda_tangan[1] : null) ||
        (typeof item.tanda_tangan_2 === 'string' ? item.tanda_tangan_2 : null) ||
        (typeof jsonFallback.tanda_tangan_2 === 'string' ? jsonFallback.tanda_tangan_2 : null) ||
        null,
      foto:
        (Array.isArray(item.dokumentasi) ? item.dokumentasi : typeof item.dokumentasi === 'string' && item.dokumentasi.length > 0 ? [item.dokumentasi] : null) || 
        (Array.isArray(item.foto) ? item.foto : typeof item.foto === 'string' && item.foto.length > 0 ? [item.foto] : null) || 
        (Array.isArray(jsonFallback.dokumentasi) ? jsonFallback.dokumentasi : typeof jsonFallback.dokumentasi === 'string' && jsonFallback.dokumentasi.length > 0 ? [jsonFallback.dokumentasi] : []) || [],
      nama_pj_ruangan:
        item.nama_pj_ruangan ||
        item.nama_pj ||
        item.auditee ||
        item.penanggung_jawab ||
        item.nama_penanggung_jawab ||
        item.pj_ruangan ||
        item.pj_name ||
        item.pjName ||
        jsonFallback.nama_pj_ruangan ||
        jsonFallback.nama_pj ||
        jsonFallback.penanggung_jawab ||
        jsonFallback.nama_penanggung_jawab ||
        jsonFallback.pj_name ||
        jsonFallback.pjName ||
        jsonFallback.pj_ruangan ||
        jsonFallback.auditee ||
        "",
      supervisor: item.supervisor || item.observer || item.ipcn || jsonFallback.supervisor || jsonFallback.observer || jsonFallback.ipcn || "",
      observer: item.observer || item.supervisor || item.ipcn || jsonFallback.observer || jsonFallback.supervisor || jsonFallback.ipcn || "",
      unit: item.unit || item.ruangan || jsonFallback.unit || jsonFallback.ruangan || (tableName === "monitoring_airborne" ? "Ruang Isolasi" : tableName === "monitoring_immuno" ? "Ruang Isolasi" : tableName === "monitoring_jenazah" ? "Kamar Jenazah" : tableName === "monitoring_ambulance" ? "Ambulance" : ""),
      ruangan: item.ruangan || item.unit || jsonFallback.ruangan || jsonFallback.unit || (tableName === "monitoring_airborne" ? "Ruang Isolasi" : tableName === "monitoring_immuno" ? "Ruang Isolasi" : tableName === "monitoring_jenazah" ? "Kamar Jenazah" : tableName === "monitoring_ambulance" ? "Ambulance" : ""),
      temuan: item.temuan || jsonFallback.temuan || "",
      rekomendasi: item.rekomendasi || jsonFallback.rekomendasi || "",
      upaya_perbaikan: item.upaya_perbaikan || jsonFallback.upaya_perbaikan || jsonFallback.upayaPerbaikan || item.upayaPerbaikan || "",
      waktu_perbaikan: item.waktu_perbaikan || item.tanggal_perbaikan || jsonFallback.waktu_perbaikan || jsonFallback.tanggal_perbaikan || jsonFallback.waktuPerbaikan || "",
      foto_perbaikan:
        (Array.isArray(item.foto_perbaikan) ? item.foto_perbaikan : typeof item.foto_perbaikan === 'string' && item.foto_perbaikan.length > 0 ? [item.foto_perbaikan] : null) ||
        (Array.isArray(jsonFallback.foto_perbaikan) ? jsonFallback.foto_perbaikan : typeof jsonFallback.foto_perbaikan === 'string' && jsonFallback.foto_perbaikan.length > 0 ? [jsonFallback.foto_perbaikan] : []) ||
        (Array.isArray(jsonFallback.dokumentasi_perbaikan) ? jsonFallback.dokumentasi_perbaikan : typeof jsonFallback.dokumentasi_perbaikan === 'string' && jsonFallback.dokumentasi_perbaikan.length > 0 ? [jsonFallback.dokumentasi_perbaikan] : []) ||
        [],
    };
  }, [tableName]);

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
        ascending: true,
      });

      let tableData: any[] = [];
      try {
        const actualTable = config?.tableName || tableName;
        let tableQuery = supabase.from(actualTable).select("*");
        if (finalExtraFilter) tableQuery = tableQuery.match(finalExtraFilter);
        const { data: tData } = await tableQuery;
        if (tData) tableData = tData;
        
        if (tableName && actualTable !== tableName) {
          let oldQuery = supabase.from(tableName).select("*");
          if (finalExtraFilter) oldQuery = oldQuery.match(finalExtraFilter);
          const { data: tOldData } = await oldQuery;
          if (tOldData) {
            tableData = [...tableData, ...tOldData];
          }
        }
      } catch (e) {
        console.error("Error fetching native table", e);
      }

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
          (a, b) => new Date(a.waktu || 0).getTime() - new Date(b.waktu || 0).getTime(),
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
            return nextData.sort((a,b) => new Date(a.waktu || 0).getTime() - new Date(b.waktu || 0).getTime());
         });
      } else if (payload.eventType === 'DELETE') {
         setData(prev => prev.filter(p => p.id !== payload.old.id));
      }
    };

    const chTarget = supabase
      .channel(`changes_${tableName}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_sessions", filter: `indikator_id=eq.${tableName}` }, handlePayload)
      .on("postgres_changes", { event: "*", schema: "public", table: actualTable }, handlePayload)
      .on("broadcast", { event: "audit_submitted" }, (payload) => {
        if (payload.payload?.indikator_id === tableName || payload.payload?.tableName === tableName) {
          fetchData(); // Bypassing table publications by forcing a refresh on broadcast match
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chTarget);
    };
  }, [tableName, fetchData, normalizeItem]);

  const handleEditClick = (recordId: string) => {
    let formPath = INDICATOR_TO_FORM_PATH[tableName];
    if (!formPath && extraFilter?.indikator_id) {
      formPath = INDICATOR_TO_FORM_PATH[extraFilter.indikator_id];
    }
    if (!formPath && extraFilter?.bundle_id) {
      formPath = `/dashboard/input/bundles/${extraFilter.bundle_id}`;
    }
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
    const checklistJson: any = selectedRecord.checklist_json || (selectedRecord as any).data_indikator || {};
    
    // Check direct or key variants (e.g. '1', 1, 'item_1', 'fapd_1', 'fasilitas_apd_1')
    const keyCandidates = [
      itemId,
      String(itemId),
      Number(itemId),
      `item_${itemId}`,
      `fapd_${itemId}`,
      `fasilitas_apd_${itemId}`,
      itemId.replace(/^item_/, ''),
      itemId.replace(/^fapd_/, ''),
      itemId.replace(/^fasilitas_apd_/, '')
    ];

    for (const key of keyCandidates) {
      if (key !== undefined && key !== null && checklistJson[key] !== undefined) {
        const val = checklistJson[key];
        if (typeof val === "string") return val.toLowerCase();
        if (typeof val === "boolean") return val ? "ya" : "tidak";
        if (val && typeof val === "object") {
          if ("status" in val && typeof val.status === "string") return val.status.toLowerCase();
          if ("jawaban" in val && typeof val.jawaban === "string") return val.jawaban.toLowerCase();
        }
      }
    }
    return undefined;
  };

  const checkIsNegative = (itemId: string) => {
    // Indikator Pengelolaan Limbah Medis: seluruh pertanyaan nomor 1-10 adalah indikator kepatuhan positif (Ya = Patuh, Tidak = Tidak Patuh)
    if (
      tableName === "pengelolaan_limbah_medis" ||
      tableName === "audit_pengelolaan_limbah_medis" ||
      tableName.includes("limbah_medis")
    ) {
      return false;
    }

    const configItems = (indicatorItems && indicatorItems.length > 0)
      ? indicatorItems
      : genericAuditConfigs[tableName]?.items || [];
    const found = configItems?.find((i) => i.id === itemId || i.key === itemId);
    if (found && typeof found.isNegative === 'boolean') {
      return found.isNegative;
    }
    return (
      itemId === "peralatan_berkarat" ||
      itemId === "jarum_suntik_bekas" ||
      itemId === "e_debu"
    );
  };

  const [detailsKeteranganMap, setDetailsKeteranganMap] = useState<Record<string, string>>({});

  const getKeterangan = (itemId: string) => {
    if (!selectedRecord) return "";
    
    // Cast checklist_json to any for flexible nested object navigation
    const checklistJson: any = selectedRecord.checklist_json || (selectedRecord as any).data_indikator || {};
    const rawDataIndikator: any = (selectedRecord as any).data_indikator || {};
    
    const keyCandidates = [
      itemId,
      String(itemId),
      Number(itemId),
      `item_${itemId}`,
      `fapd_${itemId}`,
      `fasilitas_apd_${itemId}`,
      itemId.replace(/^item_/, ''),
      itemId.replace(/^fapd_/, ''),
      itemId.replace(/^fasilitas_apd_/, '')
    ];

    // Check direct in audit_details map
    for (const k of keyCandidates) {
      if (k !== undefined && k !== null && detailsKeteranganMap[k as string]) {
        return detailsKeteranganMap[k as string];
      }
    }

    // Check if there is a flat keterangan object mapping from itemId inside data_indikator or checklist_json
    const directKet = rawDataIndikator.keterangan || checklistJson.keterangan || rawDataIndikator.keterangan_json || checklistJson.keterangan_json;
    if (directKet && typeof directKet === 'object') {
      const ketObj = directKet.data && typeof directKet.data === 'object' ? directKet.data : directKet;
      for (const k of keyCandidates) {
        if (k !== undefined && k !== null && ketObj[k as any] && typeof ketObj[k as any] === "string") {
          return ketObj[k as any];
        }
      }
    }

    // Check if there is keterangan nested as custom column keterangan_json
    if (selectedRecord.keterangan_json?.data && typeof selectedRecord.keterangan_json.data === 'object') {
       for (const k of keyCandidates) {
         if (k !== undefined && k !== null) {
           const ketVal = (selectedRecord.keterangan_json.data as any)[k];
           if (ketVal && typeof ketVal === "string") return ketVal;
         }
       }
    } else if (selectedRecord.keterangan_json && typeof selectedRecord.keterangan_json === 'object') {
       for (const k of keyCandidates) {
         if (k !== undefined && k !== null) {
           const ketVal = (selectedRecord.keterangan_json as any)[k];
           if (ketVal && typeof ketVal === "string") return ketVal;
         }
       }
    }

    // Check item-level nested objects
    for (const k of keyCandidates) {
      if (k !== undefined && k !== null) {
        const val: any = checklistJson[k] ?? rawDataIndikator[k];
        if (
          val &&
          typeof val === "object" &&
          "keterangan" in val &&
          typeof val.keterangan === "string"
        ) {
          return val.keterangan;
        }
      }
    }
    return "";
  };

  const toSentenceCase = (str: string) => {
    if (!str) return "";
    const cleaned = str.replace(/_/g, " ");
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  };

  const [dynamicChecklist, setDynamicChecklist] = useState<{
    id: string;
    label: string;
    key?: string;
    section?: string;
    isNegative?: boolean;
  }[] | null>(null);

  useEffect(() => {
    if (!selectedRecordId) {
      setDynamicChecklist(null);
      setDetailsKeteranganMap({});
      return;
    }
    const fetchDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("audit_details")
          .select("id, pertanyaan_id, pertanyaan, keterangan, jawaban")
          .eq("session_id", selectedRecordId)
          .order("id", { ascending: true });
        
        if (!error && data && data.length > 0) {
          const ketMap: Record<string, string> = {};
          data.forEach((d: any) => {
            if (d.pertanyaan_id && d.keterangan) {
              ketMap[d.pertanyaan_id] = d.keterangan;
            }
          });
          setDetailsKeteranganMap(ketMap);

          const uniqueItems = Array.from(new Set(data.map(d => d.pertanyaan_id))).map(id => {
            const item = data.find(d => d.pertanyaan_id === id);
            return {
              id: item!.pertanyaan_id,
              label: item!.pertanyaan,
              key: item!.pertanyaan_id
            };
          });
          setDynamicChecklist(uniqueItems);
        } else {
          setDetailsKeteranganMap({});
          setDynamicChecklist(null);
        }
      } catch (err) {
        setDetailsKeteranganMap({});
        setDynamicChecklist(null);
      }
    };
    fetchDetails();
  }, [selectedRecordId]);

  const checklistItems = useMemo<{
    id: string;
    label: string;
    key?: string;
    section?: string;
    isNegative?: boolean;
  }[]>(() => {
    // 1. Get predefined config items if available
    const configItems = (indicatorItems && indicatorItems.length > 0)
      ? indicatorItems
      : genericAuditConfigs[tableName]?.items || [];

    if (configItems && configItems.length > 0) {
      return configItems.map((item, idx) => ({
        id: item.key || item.id || String(idx + 1),
        label: item.label || `Indikator ${idx + 1}`,
        key: item.key || item.id || String(idx + 1),
        section: item.section,
        isNegative: item.isNegative
      }));
    }

    if (dynamicChecklist && dynamicChecklist.length > 0) {
      return dynamicChecklist;
    }

    if (selectedRecord?.checklist_json) {
      return Object.keys(selectedRecord.checklist_json)
        .filter(k => !['temuan', 'rekomendasi', 'dokumentasi', 'tanda_tangan', 'ttd_pj', 'ttd_pj_ruangan', 'ttd_ipcn', 'nama_pj', 'nama_pj_ruangan', 'tanda_tangan_1', 'tanda_tangan_2', 'tanda_tangan_pj', 'tanda_tangan_ipcn', 'keterangan', 'keterangan_json'].includes(k))
        .map((k) => ({
          id: k,
          label: toSentenceCase(k),
          key: k
        }));
    }

    return [];
  }, [dynamicChecklist, indicatorItems, tableName, selectedRecord]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("record-selected", { detail: { id: selectedRecordId } }),
    );
  }, [selectedRecordId]);

  const isInitialLoadRef = useRef(true);

  // Ensure scroll resets to top when navigating to report and after initial data load
  useEffect(() => {
    forceScrollToTop();
  }, []);

  useEffect(() => {
    if (!loading && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      forceScrollToTop();
    }
  }, [loading]);

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

      <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-3 mb-4">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 pl-1">Lembar Laporan Resmi</h4>
        {filteredRecords.length > 0 && selectedRecord && (
          <PdfDownloadButton
            targetElementId="generic-official-report"
            filename={`Laporan_Resmi_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${(selectedRecord.unit || selectedRecord.ruangan || 'Unit').replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`}
            title="Download PDF Laporan Resmi"
          />
        )}
      </div>

      {filteredRecords.length > 0 && selectedRecord ? (() => {
        const auditDate = selectedRecord.waktu || selectedRecord.tanggal_waktu;
        const formattedDate = auditDate
          ? format(parseISO(auditDate), "dd MMMM yyyy HH:mm", { locale: idLocale })
          : "-";
        const supervisorName = selectedRecord.supervisor || selectedRecord.observer || "-";
        const unitName = selectedRecord.unit || selectedRecord.ruangan || "-";
        const pjName = selectedRecord.nama_pj_ruangan || selectedRecord.nama_pj || "";

        const patuhCount = checklistItems.filter((item) => {
          const status = getStatus(item.id);
          return checkIsNegative(item.id) ? status === "tidak" : status === "ya";
        }).length;
        const tidakPatuhCount = checklistItems.filter((item) => {
          const status = getStatus(item.id);
          return checkIsNegative(item.id) ? status === "ya" : status === "tidak";
        }).length;
        const naCount = checklistItems.filter((item) => {
          const status = getStatus(item.id);
          return status === "na" || status === "n/a";
        }).length;
        const totalDinilai = patuhCount + tidakPatuhCount;
        const persentaseVal = totalDinilai > 0
          ? Math.round((patuhCount / totalDinilai) * 100)
          : (selectedRecord.persentase || 0);
        const isSesuai = persentaseVal >= 85;

        const photosList = Array.isArray(selectedRecord.foto)
          ? selectedRecord.foto
          : (typeof selectedRecord.foto === "string" && selectedRecord.foto ? [selectedRecord.foto] : []);
        const perbaikanPhotosList = Array.isArray(selectedRecord.foto_perbaikan)
          ? selectedRecord.foto_perbaikan
          : (typeof selectedRecord.foto_perbaikan === "string" && selectedRecord.foto_perbaikan ? [selectedRecord.foto_perbaikan] : []);
        const hasPerbaikanContent = Boolean(
          selectedRecord.upaya_perbaikan ||
          selectedRecord.waktu_perbaikan ||
          perbaikanPhotosList.length > 0
        );
        const hasPhotos = photosList.length > 0 || perbaikanPhotosList.length > 0;

        // Checklist items are rendered in a single unified proportional table
        const pageItems = checklistItems;

        const renderKopSurat = () => (
          <div className="mb-2">
            <div className="flex items-center gap-3 sm:gap-4 border-b-[2.5px] border-black pb-2 mb-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center pl-1.5 sm:pl-2.5">
                {hospitalLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hospitalLogoUrl}
                    alt="Logo RS"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
                )}
              </div>
              <div className="text-center flex-1 pr-10 sm:pr-14">
                <h1 className="text-[11pt] sm:text-[12pt] font-black uppercase tracking-wide leading-tight text-black">
                  TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
                </h1>
                <h2 className="text-[11pt] sm:text-[12pt] font-black uppercase tracking-wider leading-tight text-black mt-0.5">
                  UOBK RSUD AL-MULK KOTA SUKABUMI
                </h2>
                <p className="text-[8pt] sm:text-[8.5pt] text-black italic mt-0.5 leading-tight">
                  Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168
                </p>
              </div>
            </div>
            {/* Garis batas ganda kop surat standar dinas */}
            <div className="border-b border-black mb-3" />
          </div>
        );

        const renderMetadata = () => (
          <table className="w-full border-collapse border border-black mb-3 text-[11pt]" style={{ backgroundColor: "#ffffff" }}>
            <tbody>
              <tr>
                <td className="w-1/3 border border-black p-2 bg-slate-50 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[9pt] font-bold uppercase text-slate-700">Waktu Pelaksanaan</div>
                  <div className="text-[11pt] font-bold text-black mt-0.5">{formattedDate}</div>
                </td>
                <td className="w-1/3 border border-black p-2 bg-slate-50 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[9pt] font-bold uppercase text-slate-700">Supervisor / Observer</div>
                  <div className="text-[11pt] font-bold text-black mt-0.5 uppercase">{supervisorName}</div>
                </td>
                <td className="w-1/3 border border-black p-2 bg-slate-50 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[9pt] font-bold uppercase text-slate-700">Unit / Ruangan</div>
                  <div className="text-[11pt] font-bold text-black mt-0.5 uppercase">{unitName}</div>
                </td>
              </tr>
            </tbody>
          </table>
        );

        const renderTable = (items: typeof checklistItems, startIndex: number) => (
          <table className="w-full border-collapse border border-black text-[11pt] text-black mb-3 bg-white" style={{ backgroundColor: "#ffffff" }}>
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-black" style={{ backgroundColor: "#f1f5f9" }}>
                <th className="border border-black px-2 py-1.5 text-center w-10 text-[11pt]">NO</th>
                <th className="border border-black px-3 py-1.5 text-center text-[11pt]">INDIKATOR</th>
                <th className="border border-black px-2 py-1.5 text-center w-12 text-[11pt]">YA</th>
                <th className="border border-black px-2 py-1.5 text-center w-14 text-[11pt]">TIDAK</th>
                <th className="border border-black px-2 py-1.5 text-center w-12 text-[11pt]">N/A</th>
                <th className="border border-black px-3 py-1.5 text-center w-36 text-[11pt]">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, localIdx) => {
                const globalIdx = startIndex + localIdx;
                const status = getStatus(item.id);
                const ket = getKeterangan(item.id);
                const isNegative = checkIsNegative(item.id);
                const prevItem = globalIdx > 0 ? checklistItems[globalIdx - 1] : null;
                const showSectionHeader = Boolean(item.section && (!prevItem || prevItem.section !== item.section));

                return (
                  <React.Fragment key={item.id}>
                    {showSectionHeader && (
                      <tr className="bg-slate-100 font-bold border-y border-black text-black" style={{ backgroundColor: "#f1f5f9" }}>
                        <td
                          colSpan={6}
                          className="px-3 py-1 font-black uppercase text-[10pt] tracking-wide border border-black text-black"
                        >
                          {item.section}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-black text-black bg-white" style={{ backgroundColor: "#ffffff" }}>
                      <td className="px-2 py-1.5 text-center border border-black font-bold text-[11pt]">
                        {globalIdx + 1}
                      </td>
                      <td className="px-3 py-1.5 font-medium border border-black text-[11pt] leading-snug">
                        {item.label.replace(/^\d+\.\s*/, "")}
                      </td>
                      <td className="px-2 py-1.5 text-center border border-black align-middle">
                        {status === "ya" && (
                          <span className={`font-black text-[12pt] ${isNegative ? "text-red-700" : "text-emerald-700"}`}>
                            {isNegative ? "✗" : "✓"}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center border border-black align-middle">
                        {status === "tidak" && (
                          <span className={`font-black text-[12pt] ${isNegative ? "text-emerald-700" : "text-red-700"}`}>
                            {isNegative ? "✓" : "✗"}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center border border-black align-middle text-[11pt] font-bold text-slate-600">
                        {(status === "na" || status === "n/a") ? "-" : ""}
                      </td>
                      <td className="px-3 py-1.5 text-[10.5pt] italic border border-black leading-snug break-words">
                        {ket}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        );

        const renderSummaryScore = () => (
          <table className="w-full border-collapse border-2 border-black mb-3 text-black" style={{ backgroundColor: "#ffffff" }}>
            <tbody>
              <tr>
                <td className="w-1/4 border border-black p-2 bg-slate-50 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[9pt] font-bold uppercase text-slate-700">Patuh</div>
                  <div className="text-[16pt] font-black text-black mt-0.5">{patuhCount}</div>
                </td>
                <td className="w-1/4 border border-black p-2 bg-slate-50 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[9pt] font-bold uppercase text-slate-700">Tidak Patuh</div>
                  <div className="text-[16pt] font-black text-black mt-0.5">{tidakPatuhCount}</div>
                </td>
                <td className="w-1/4 border border-black p-2 bg-slate-50 text-center" style={{ backgroundColor: "#f8fafc" }}>
                  <div className="text-[9pt] font-bold uppercase text-slate-700">N/A</div>
                  <div className="text-[16pt] font-black text-black mt-0.5">{naCount}</div>
                </td>
                <td className="w-1/4 border border-black p-2 bg-slate-100 text-center" style={{ backgroundColor: "#f1f5f9" }}>
                  <div className="text-[9pt] font-bold uppercase text-slate-700">Persentase Capaian</div>
                  <div className="text-[18pt] font-black text-black mt-0.5">{persentaseVal}%</div>
                  <div className={`text-[9pt] font-black uppercase mt-0.5 ${isSesuai ? "text-emerald-700" : "text-rose-700"}`}>
                    {isSesuai ? "SESUAI STANDAR" : "TIDAK SESUAI"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        );

        const renderFindingsAndRecommendations = () => {
          if (tableName === "perlindungan_petugas") return null;
          return (
            <table className="w-full border-collapse border border-black mb-3 text-[11pt] text-black bg-white" style={{ backgroundColor: "#ffffff" }}>
              <tbody>
                <tr>
                  <td className="w-1/2 border border-black p-2.5 align-top bg-white" style={{ backgroundColor: "#ffffff" }}>
                    <div className="text-[10pt] font-black uppercase text-black border-b border-black pb-1 mb-1.5">
                      Temuan Lapangan
                    </div>
                    <div className="text-[11pt] leading-snug whitespace-pre-wrap">
                      {selectedRecord.temuan || "Tidak ada temuan spesifik yang dicatat."}
                    </div>
                  </td>
                  <td className="w-1/2 border border-black p-2.5 align-top bg-white" style={{ backgroundColor: "#ffffff" }}>
                    <div className="text-[10pt] font-black uppercase text-black border-b border-black pb-1 mb-1.5">
                      Rekomendasi & Tindak Lanjut
                    </div>
                    <div className="text-[11pt] leading-snug whitespace-pre-wrap">
                      {selectedRecord.rekomendasi || "Sesuai dengan standar prosedur operasional yang berlaku."}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          );
        };

        const renderSignatures = () => (
          <div className="mt-3 mb-2">
            {tableName === "perlindungan_petugas" ? (
              <div className="flex justify-end pr-6">
                <div className="text-center w-64">
                  <div className="font-bold text-black uppercase text-[11pt]">TIM PPI RS</div>
                  <div className="h-16 flex items-center justify-center my-1">
                    {(selectedRecord.tanda_tangan_2 || selectedRecord.tanda_tangan_1) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedRecord.tanda_tangan_2 || selectedRecord.tanda_tangan_1}
                        className="max-h-16 object-contain filter brightness-0"
                        alt="TTD IPCN"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span className="text-[9pt] text-slate-400 italic">Tanpa Tanda Tangan</span>
                    )}
                  </div>
                  <div className="font-bold text-black uppercase text-[11pt] underline">
                    ( {supervisorName || "........................................"} )
                  </div>
                </div>
              </div>
            ) : (
              <table className="w-full border-none text-[11pt] text-black">
                <tbody>
                  <tr>
                    <td className="w-1/2 text-center align-top p-1">
                      <div className="font-bold text-black uppercase text-[11pt]">Petugas / PJ Ruangan</div>
                      <div className="h-16 flex items-center justify-center my-1">
                        {selectedRecord.tanda_tangan_1 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedRecord.tanda_tangan_1}
                            className="max-h-16 object-contain filter brightness-0"
                            alt="TTD PJ"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span className="text-[9pt] text-slate-400 italic">Tanpa Tanda Tangan</span>
                        )}
                      </div>
                      <div className="font-bold text-black uppercase text-[11pt] underline">
                        ( {pjName || "........................................"} )
                      </div>
                    </td>
                    <td className="w-1/2 text-center align-top p-1">
                      <div className="font-bold text-black uppercase text-[11pt]">Tim PPI</div>
                      <div className="h-16 flex items-center justify-center my-1">
                        {selectedRecord.tanda_tangan_2 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedRecord.tanda_tangan_2}
                            className="max-h-16 object-contain filter brightness-0"
                            alt="TTD IPCN"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span className="text-[9pt] text-slate-400 italic">Tanpa Tanda Tangan</span>
                        )}
                      </div>
                      <div className="font-bold text-black uppercase text-[11pt] underline">
                        ( {supervisorName || "........................................"} )
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        );

        return (
          <div className="w-full">
            <ZoomableReportViewer>
              <div
                id="generic-official-report"
                data-pdf-page="true"
                className="official-report-paper official-pdf-page w-full min-w-[650px] sm:min-w-0 sm:w-full max-w-[210mm] mx-auto bg-force-white text-black p-4 sm:p-8 md:p-10 border border-slate-300 rounded-2xl shadow-xl print:shadow-none print:border-none print:p-0 my-2 sm:my-4"
                style={{
                  fontFamily: "'Calibri', 'Carlito', 'Candara', 'Segoe UI', Arial, sans-serif",
                  fontSize: "11pt",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  boxSizing: "border-box",
                }}
              >
                {/* 1. Kop Surat Resmi RSUD AL-MULK */}
                {renderKopSurat()}

                {/* 2. Judul Lembar Audit */}
                <div className="text-center mb-3">
                  <h2 className="text-[12pt] font-black uppercase tracking-wider text-black underline decoration-1 underline-offset-4">
                    LEMBAR AUDIT {title.toUpperCase()}
                  </h2>
                </div>

                {/* 3. Metadata Pelaksanaan */}
                {renderMetadata()}

                {/* 4. Tabel Checklist Indikator Utuh */}
                {renderTable(pageItems, 0)}

                {/* 5. Rekap Skor & Capaian Standar */}
                {renderSummaryScore()}

                {/* 6. Temuan & Rekomendasi */}
                {renderFindingsAndRecommendations()}

                {/* 7. Foto Dokumentasi Temuan Audit (Jika Ada) */}
                {photosList.length > 0 && (
                  <div className="mb-4 border border-black p-3 bg-white">
                    <h4 className="text-[11pt] font-black uppercase tracking-wide text-black mb-2 flex items-center gap-2 border-b border-black pb-1">
                      <Camera className="w-4 h-4 text-black" /> FOTO DOKUMENTASI AUDIT
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {photosList.map((url: string, i: number) => (
                        <div
                          key={i}
                          onClick={() => setZoomedImage(url)}
                          className="aspect-video relative border border-slate-800 p-1 cursor-zoom-in bg-white shadow-sm"
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
                          <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[8pt] px-1 font-mono font-bold">
                            Foto #{i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Tindak Lanjut & Upaya Perbaikan (Jika Ada) */}
                {hasPerbaikanContent && (
                  <div className="mb-4 border-2 border-black p-3 bg-slate-50">
                    <h4 className="text-[11pt] font-black uppercase tracking-wide text-black mb-2 border-b border-black pb-1 flex items-center justify-between">
                      <span>🛠️ TINDAK LANJUT &amp; UPAYA PERBAIKAN</span>
                      <span className="text-[9pt] px-2 py-0.5 border border-black font-bold uppercase bg-white">
                        HASIL PERBAIKAN
                      </span>
                    </h4>
                    {selectedRecord.waktu_perbaikan && (
                      <div className="text-[10pt] font-bold text-black mb-2 flex items-center gap-1.5 border border-black px-2.5 py-1 bg-white w-fit">
                        <span>📅 Tanggal &amp; Waktu Perbaikan:</span>
                        <span className="font-mono">
                          {selectedRecord.waktu_perbaikan.includes("T")
                            ? selectedRecord.waktu_perbaikan.replace("T", " ")
                            : selectedRecord.waktu_perbaikan}
                        </span>
                      </div>
                    )}
                    {selectedRecord.upaya_perbaikan && (
                      <div className="text-[11pt] text-black leading-relaxed whitespace-pre-wrap font-medium mb-3 p-2 bg-white border border-slate-300">
                        {selectedRecord.upaya_perbaikan}
                      </div>
                    )}
                    {perbaikanPhotosList.length > 0 && (
                      <div>
                        <p className="text-[10pt] font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-black" /> Foto Bukti Upaya Perbaikan:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {perbaikanPhotosList.map((url: string, i: number) => (
                            <div
                              key={i}
                              onClick={() => setZoomedImage(url)}
                              className="aspect-video relative border-2 border-black bg-white p-1 cursor-zoom-in shadow-sm"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Foto Perbaikan ${i + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                                crossOrigin="anonymous"
                              />
                              <div className="absolute bottom-1 left-1 bg-black text-white text-[8pt] px-1 py-0.5 font-mono font-bold">
                                Bukti #{i + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 9. Tanda Tangan Pengesahan (Paling Bawah - Tunggal, Tidak Duplikat) */}
                {renderSignatures()}
              </div>
            </ZoomableReportViewer>
          </div>
        );
      })() : (
        <div className="h-full bg-slate-50 dark:bg-[#111827]/80 rounded-[2rem] border border-slate-200/80 dark:border-white/10 flex flex-col items-center justify-center p-12 md:p-20 text-center text-slate-500 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.08),0_4px_10px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.8)] min-h-[400px]">
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
      <div className="bg-[#18193b] rounded-[28px] md:rounded-[32px] border border-[#2b2d56] shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden relative group">
        {/* Top Bevel Highlight */}
        <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="p-6 border-b border-indigo-900/30 bg-[#141532]/60 backdrop-blur-md flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-cyan-400" />
              Tabel Riwayat Laporan
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Daftar laporan kepatuhan yang tercatat pada sistem</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#12132e] text-[11px] uppercase tracking-widest text-slate-400 font-black border-b border-indigo-900/30">
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
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
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
                          ? "bg-indigo-600/20 hover:bg-indigo-600/30 border-l-4 border-l-cyan-400"
                          : "hover:bg-white/[0.03]"
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] ${
                          score >= 85 ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' :
                          score >= 70 ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' :
                          'bg-rose-950/80 border-rose-500/40 text-rose-300'
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
