import React, { ReactElement, useState, useEffect, useMemo, useRef, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { utils, writeFile } from "xlsx";
import {
  FileText,
  Search,
  Plus,
  Printer,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Edit,
  Trash2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  ShieldCheck,
  Activity,
  Wind,
  ClipboardCheck,
  Users,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Eye,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/components/Providers";
import ZoomableReportViewer from "@/components/reports/ZoomableReportViewer";
import { parseImageUrls, normalizeImageUrl } from "@/utils/imageHelper";

interface SupervisiRecord {
  id: string;
  tanggal_waktu: string;
  indikator_id: string;
  nama_kegiatan: string;
  kategori: string;
  unit: string;
  observer: string;
  nama_pj: string;
  temuan: string;
  rekomendasi: string;
  foto_temuan: string[];
  upaya_perbaikan: string;
  waktu_perbaikan: string;
  foto_perbaikan: string[];
  status: "Selesai" | "Dalam Proses";
  form_path?: string;
  raw_data: any;
}

const INDICATOR_TO_FORM_PATH: Record<string, string> = {
  etika_batuk: "/dashboard/input/etika-batuk",
  penempatan_pasien: "/dashboard/input/penempatan-pasien",
  dekontaminasi_alat: "/dashboard/input/dekontaminasi-alat",
  pengelolaan_limbah_medis: "/dashboard/input/pengelolaan-limbah-medis",
  pengelolaan_limbah_tajam: "/dashboard/input/pengelolaan-limbah-tajam",
  penatalaksanaan_linen: "/dashboard/input/penatalaksanaan-linen",
  pengendalian_lingkungan: "/dashboard/input/pengendalian-lingkungan",
  penyuntikan_aman: "/dashboard/input/penyuntikan-aman",
  perlindungan_petugas: "/dashboard/input/perlindungan-petugas",
  monitoring_airborne: "/dashboard/input/monitoring-airborne",
  monitoring_jenazah: "/dashboard/input/monitoring-jenazah",
  monitoring_laboratorium: "/dashboard/input/monitoring-laboratorium",
  monitoring_cssd: "/dashboard/input/monitoring-cssd",
  monitoring_farmasi: "/dashboard/input/monitoring-farmasi",
  monitoring_gizi: "/dashboard/input/monitoring-gizi",
  monitoring_ibs: "/dashboard/input/monitoring-ibs",
  monitoring_immuno: "/dashboard/input/monitoring-immuno",
  monitoring_radiologi: "/dashboard/input/monitoring-radiologi",
  monitoring_ruang_isolasi: "/dashboard/input/monitoring-ruang_isolasi",
  ppi_ruang_isolasi: "/dashboard/input/ppi-ruang-isolasi",
  monitoring_tps: "/dashboard/input/monitoring-tps",
  monitoring_tunggu: "/dashboard/input/monitoring-tunggu",
  monitoring_ambulance: "/dashboard/input/monitoring-ambulance",
  monitoring_fasilitas_hand_hygiene: "/dashboard/input/monitoring-fasilitas_hh",
  monitoring_fasilitas_apd: "/dashboard/input/monitoring-fasilitas_apd",
  audit_apd: "/dashboard/input/apd",
  audit_hand_hygiene: "/dashboard/input/hand-hygiene",
};

const INDICATOR_TITLES: Record<string, string> = {
  pengelolaan_limbah_medis: "Pengelolaan Limbah Medis",
  dekontaminasi_alat: "Dekontaminasi Alat Kesehatan",
  pengendalian_lingkungan: "Pengendalian Lingkungan Rumah Sakit",
  pengelolaan_limbah_tajam: "Pengelolaan Limbah Benda Tajam",
  penatalaksanaan_linen: "Penatalaksanaan Linen & Laundry",
  penyuntikan_aman: "Praktik Menyuntik Yang Aman",
  perlindungan_petugas: "Kesehatan & Perlindungan Petugas",
  penempatan_pasien: "Penempatan Pasien & Transmisi",
  etika_batuk: "Edukasi & Penerapan Etika Batuk",
  monitoring_fasilitas_hand_hygiene: "Monitoring Fasilitas Hand Hygiene",
  monitoring_fasilitas_apd: "Monitoring Fasilitas APD",
  audit_hand_hygiene: "Audit Kepatuhan Kebersihan Tangan",
  audit_apd: "Audit Kepatuhan Penggunaan APD",
  monitoring_cssd: "Supervisi & Monitoring CSSD",
  monitoring_ibs: "Supervisi Ruang Bedah (IBS)",
  monitoring_farmasi: "Supervisi & Monitoring Farmasi",
  monitoring_gizi: "Supervisi Dapur & Gizi",
  monitoring_laboratorium: "Supervisi Laboratorium",
  monitoring_radiologi: "Supervisi Radiologi",
  monitoring_jenazah: "Supervisi Pemulasaraan Jenazah",
  monitoring_tps: "Supervisi TPS Limbah B3",
  monitoring_ambulance: "Supervisi Unit Ambulance",
  monitoring_ruang_isolasi: "Supervisi Ruang Isolasi",
  ppi_ruang_isolasi: "Supervisi PPI Ruang Isolasi",
  supervisi_lapangan: "Supervisi Ronde Lapangan IPCN",
};

const UNITS_LIST = [
  "Semua Ruangan",
  "IGD",
  "ICU",
  "IBS",
  "Ranap Aisyah",
  "Ranap Fatimah",
  "Ranap Khadijah",
  "Ranap Usman",
  "Ranap Dewasa",
  "Ranap Anak",
  "Ranap Kebidanan",
  "Ranap Bedah",
  "Rawat Jalan",
  "Radiologi",
  "Laboratorium",
  "Farmasi",
  "Gizi / Pantry",
  "CSSD",
  "Kamar Jenazah",
  "TPS Limbah",
  "Ambulance",
  "Ruang Tunggu",
];

const MONTHS_LIST = [
  { value: "all", label: "Semua Bulan" },
  { value: "0", label: "Januari" },
  { value: "1", label: "Februari" },
  { value: "2", label: "Maret" },
  { value: "3", label: "April" },
  { value: "4", label: "Mei" },
  { value: "5", label: "Juni" },
  { value: "6", label: "Juli" },
  { value: "7", label: "Agustus" },
  { value: "8", label: "September" },
  { value: "9", label: "Oktober" },
  { value: "10", label: "November" },
  { value: "11", label: "Desember" },
];

function extractPhotos(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          return (item.url || item.file_url || item.path || "").trim();
        }
        return "";
      })
      .filter((url) => Boolean(url) && !url.startsWith("blob:"));
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractPhotos(parsed);
      } catch (e) {
        return [trimmed];
      }
    }
    if (trimmed.length > 0 && !trimmed.startsWith("blob:")) {
      return [trimmed];
    }
  }
  return [];
}

export default function BuktiSupervisiPage() {
  const { hospitalLogoUrl, userRole } = useAppContext();
  const [records, setRecords] = useState<SupervisiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("Semua Ruangan");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "Selesai" | "Dalam Proses">("all");
  const [onlyWithFindings, setOnlyWithFindings] = useState(true);

  // Pagination State for tablet & mobile performance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedUnit, selectedMonth, selectedYear, selectedStatus, onlyWithFindings]);

  // Modals
  const [editingRecord, setEditingRecord] = useState<SupervisiRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState("");
  const [lightboxImage, setLightboxImage] = useState<{
    images: string[];
    currentIndex: number;
    url: string;
    title: string;
    subtitle?: string;
    type: "before" | "after";
    compareImages?: string[];
    compareUrl?: string;
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit / Follow-up State
  const [tindakLanjutText, setTindakLanjutText] = useState("");
  const [waktuPerbaikanInput, setWaktuPerbaikanInput] = useState("");
  const [statusInput, setStatusInput] = useState<"Selesai" | "Dalam Proses">("Selesai");
  const [perbaikanPhotos, setPerbaikanPhotos] = useState<Array<{ url: string; file?: File }>>([]);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // New Supervisi State
  const [newTanggal, setNewTanggal] = useState("");
  const [newKegiatan, setNewKegiatan] = useState("Supervisi Ronde Lapangan IPCN");
  const [newKegiatanCustom, setNewKegiatanCustom] = useState("");
  const [newUnit, setNewUnit] = useState("Ranap Aisyah");
  const [newObserver, setNewObserver] = useState("Adi Tresa Purnama");
  const [newTemuan, setNewTemuan] = useState("");
  const [newRekomendasi, setNewRekomendasi] = useState("");
  const [newTemuanPhotos, setNewTemuanPhotos] = useState<Array<{ url: string; file?: File }>>([]);
  const [newTindakLanjut, setNewTindakLanjut] = useState("");
  const [newPerbaikanPhotos, setNewPerbaikanPhotos] = useState<Array<{ url: string; file?: File }>>([]);
  const [newStatus, setNewStatus] = useState<"Selesai" | "Dalam Proses">("Dalam Proses");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lightbox keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!lightboxImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLightboxImage((prev) => {
          if (!prev || prev.images.length <= 1) return prev;
          const newIdx = (prev.currentIndex - 1 + prev.images.length) % prev.images.length;
          return { ...prev, currentIndex: newIdx, url: prev.images[newIdx] };
        });
      } else if (e.key === "ArrowRight") {
        setLightboxImage((prev) => {
          if (!prev || prev.images.length <= 1) return prev;
          const newIdx = (prev.currentIndex + 1) % prev.images.length;
          return { ...prev, currentIndex: newIdx, url: prev.images[newIdx] };
        });
      } else if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  // 1. Fetch Realtime Data from audit_sessions
  useEffect(() => {
    let isMounted = true;

    const fetchSupervisiData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("audit_sessions")
          .select("*")
          .order("tanggal_waktu", { ascending: false });

        if (error) {
          console.error("Error fetching audit_sessions:", error);
          return;
        }

        if (!data || !isMounted) return;

        const mapped: SupervisiRecord[] = [];

        data.forEach((row: any) => {
          let parsedJson: any = {};
          if (row.data_indikator) {
            try {
              parsedJson =
                typeof row.data_indikator === "string"
                  ? JSON.parse(row.data_indikator)
                  : row.data_indikator;
            } catch (e) {
              parsedJson = {};
            }
          }

          const temuan =
            row.temuan ||
            parsedJson.temuan ||
            parsedJson.temuan_lapangan ||
            parsedJson.catatan ||
            "";

          const rekomendasi =
            row.rekomendasi ||
            parsedJson.rekomendasi ||
            parsedJson.saran ||
            "";

          const fotoTemuan = extractPhotos(
            parsedJson.dokumentasi ||
              parsedJson.foto ||
              row.dokumentasi ||
              row.foto
          );

          const upayaPerbaikan =
            row.upaya_perbaikan ||
            parsedJson.upaya_perbaikan ||
            parsedJson.upayaPerbaikan ||
            "";

          const waktuPerbaikan =
            row.waktu_perbaikan ||
            parsedJson.waktu_perbaikan ||
            parsedJson.tanggal_perbaikan ||
            row.tanggal_perbaikan ||
            "";

          const fotoPerbaikan = extractPhotos(
            row.foto_perbaikan ||
              parsedJson.foto_perbaikan ||
              parsedJson.dokumentasi_perbaikan
          );

          // Tentukan status
          let status: "Selesai" | "Dalam Proses" = "Dalam Proses";
          if (row.status_supervisi) {
            status = row.status_supervisi === "Selesai" ? "Selesai" : "Dalam Proses";
          } else if (parsedJson.status_supervisi) {
            status = parsedJson.status_supervisi === "Selesai" ? "Selesai" : "Dalam Proses";
          } else if (upayaPerbaikan.trim().length > 0 && fotoPerbaikan.length > 0) {
            status = "Selesai";
          } else if (upayaPerbaikan.trim().length > 15) {
            status = "Selesai";
          } else if (!temuan && !rekomendasi) {
            status = "Selesai";
          }

          const namaKegiatan =
            INDICATOR_TITLES[row.indikator_id] ||
            row.nama_indikator ||
            (row.indikator_id
              ? row.indikator_id.replace(/_/g, " ").toUpperCase()
              : "SUPERVISI PPI");

          const formPath = INDICATOR_TO_FORM_PATH[row.indikator_id]
            ? `${INDICATOR_TO_FORM_PATH[row.indikator_id]}?id=${row.id}&mode=edit`
            : undefined;

          mapped.push({
            id: row.id,
            tanggal_waktu: row.tanggal_waktu || row.created_at || new Date().toISOString(),
            indikator_id: row.indikator_id || "supervisi_lapangan",
            nama_kegiatan: namaKegiatan,
            kategori: row.kategori || "Supervisi PPI",
            unit: row.unit || row.ruangan || parsedJson.unit || parsedJson.ruangan || "Umum",
            observer: row.observer || parsedJson.observer || "IPCN",
            nama_pj: row.nama_pj || row.nama_pj_ruangan || parsedJson.nama_pj_ruangan || "-",
            temuan: temuan.trim(),
            rekomendasi: rekomendasi.trim(),
            foto_temuan: fotoTemuan,
            upaya_perbaikan: upayaPerbaikan.trim(),
            waktu_perbaikan: waktuPerbaikan,
            foto_perbaikan: fotoPerbaikan,
            status,
            form_path: formPath,
            raw_data: { ...row, parsedJson },
          });
        });

        setRecords(mapped);
      } catch (err) {
        console.error("Fatal error fetching supervisi:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSupervisiData();

    // Listen to real-time events
    const handleRealtimeChange = (e: any) => {
      fetchSupervisiData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("smart_ppi_realtime", handleRealtimeChange);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("smart_ppi_realtime", handleRealtimeChange);
      }
    };
  }, [refreshTrigger]);

  // Set default datetime on mount
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    setNewTanggal(
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}`
    );
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // 1. Only with findings or all
      if (onlyWithFindings) {
        const hasFindings =
          Boolean(item.temuan && item.temuan.trim().length > 0) ||
          Boolean(item.rekomendasi && item.rekomendasi.trim().length > 0) ||
          item.foto_temuan.length > 0 ||
          item.foto_perbaikan.length > 0;
        if (!hasFindings) return false;
      }

      // 2. Unit
      if (selectedUnit !== "Semua Ruangan" && item.unit !== selectedUnit) {
        return false;
      }

      // 3. Status
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }

      // 4. Date (Month & Year)
      if (item.tanggal_waktu) {
        try {
          const d = new Date(item.tanggal_waktu);
          if (selectedYear !== "all" && d.getFullYear().toString() !== selectedYear) {
            return false;
          }
          if (selectedMonth !== "all" && d.getMonth().toString() !== selectedMonth) {
            return false;
          }
        } catch (e) {}
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = item.nama_kegiatan.toLowerCase().includes(q);
        const matchUnit = item.unit.toLowerCase().includes(q);
        const matchTemuan = item.temuan.toLowerCase().includes(q);
        const matchRekomendasi = item.rekomendasi.toLowerCase().includes(q);
        const matchUpaya = item.upaya_perbaikan.toLowerCase().includes(q);
        const matchObserver = item.observer.toLowerCase().includes(q);
        if (
          !matchNama &&
          !matchUnit &&
          !matchTemuan &&
          !matchRekomendasi &&
          !matchUpaya &&
          !matchObserver
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    records,
    onlyWithFindings,
    selectedUnit,
    selectedStatus,
    selectedYear,
    selectedMonth,
    searchQuery,
  ]);

  // Paginated Pages for Official F4 Landscape Report (Modal Preview & Multi-page PDF Export)
  // Mengacu presisi pada ukuran kertas F4 Landscape (330mm x 215mm) dengan margin 1,5 cm (15mm) keliling.
  // Area bersih dalam margin: lebar 300mm x tinggi 185mm.
  // Memaksimalkan ruang isi halaman hingga baris mendekati batas margin bawah / footer sebelum pindah halaman.
  const paginatedSupervisiPages = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) {
      return [
        {
          pageNumber: 1,
          records: [] as Array<{ record: SupervisiRecord; globalIndex: number }>,
          isFirstPage: true,
          isLastPage: true,
        },
      ];
    }

    const countWrappedLines = (text: string, charsPerLine: number): number => {
      if (!text || !text.trim()) return 1;
      return text
        .trim()
        .split(/\r?\n/)
        .reduce((acc, paragraph) => {
          const trimmed = paragraph.trim();
          if (!trimmed) return acc + 1;
          const words = trimmed.split(/\s+/);
          let lines = 1;
          let currentLen = 0;
          for (const word of words) {
            if (currentLen === 0) {
              if (word.length > charsPerLine) {
                lines += Math.floor((word.length - 1) / charsPerLine);
                currentLen = ((word.length - 1) % charsPerLine) + 1;
              } else {
                currentLen = word.length;
              }
            } else if (currentLen + 1 + word.length <= charsPerLine) {
              currentLen += 1 + word.length;
            } else {
              lines += 1;
              if (word.length > charsPerLine) {
                lines += Math.floor((word.length - 1) / charsPerLine);
                currentLen = ((word.length - 1) % charsPerLine) + 1;
              } else {
                currentLen = word.length;
              }
            }
          }
          return acc + lines;
        }, 0);
    };

    const estimateRowHeightMm = (rec: SupervisiRecord): number => {
      const beforeCount = rec.foto_temuan ? rec.foto_temuan.length : 0;
      const afterCount = rec.foto_perbaikan ? rec.foto_perbaikan.length : 0;
      const maxPhotos = Math.max(beforeCount, afterCount);

      const kegiatanLines = countWrappedLines(rec.nama_kegiatan || "Supervisi PPI", 18);
      const unitLines = countWrappedLines(rec.unit || "Umum", 13);
      const temuanLines = countWrappedLines(rec.temuan || "-", 28);
      const rekomLines = countWrappedLines(rec.rekomendasi || "-", 45);
      const tindakLines =
        countWrappedLines(rec.upaya_perbaikan || "-", 16) + (rec.waktu_perbaikan ? 1.5 : 0);

      const maxTextLines = Math.max(
        kegiatanLines,
        unitLines,
        temuanLines,
        rekomLines,
        tindakLines,
        2
      );

      // Tinggi teks: ~3.55mm per baris (font 8pt line-height 1.25) + 4mm padding atas/bawah sel
      const textHeightMm = maxTextLines * 3.55 + 4;

      // Tinggi foto: setiap foto w-[20mm] h-[15.5mm] + 1.2mm gap antar foto + 4mm padding sel
      const photoHeightMm =
        maxPhotos > 0 ? maxPhotos * 15.5 + (maxPhotos - 1) * 1.2 + 4 : 12;

      return Math.max(textHeightMm, photoHeightMm, 15);
    };

    // Tinggi ruang tabel aktual dalam area bersih 185mm:
    // Halaman 1: 185mm - (Kop+Judul 35mm + Thead 8mm + Footer 7mm + Buffer 5mm) = 130mm
    // Halaman 2+: 185mm - (Header 8.5mm + Thead 8mm + Footer 7mm + Buffer 5.5mm) = 156mm
    const FIRST_PAGE_MAX_HEIGHT_MM = 130;
    const NEXT_PAGE_MAX_HEIGHT_MM = 156;
    const SIGNATURE_BLOCK_HEIGHT_MM = 34;

    const pagesData: Array<{
      items: Array<{ record: SupervisiRecord; globalIndex: number }>;
      usedHeightMm: number;
    }> = [];

    let currentItems: Array<{ record: SupervisiRecord; globalIndex: number }> = [];
    let currentHeightMm = 0;
    let isFirst = true;

    for (let i = 0; i < filteredRecords.length; i++) {
      const rec = filteredRecords[i];
      const rowHeight = estimateRowHeightMm(rec);
      const maxAllowedHeight = isFirst ? FIRST_PAGE_MAX_HEIGHT_MM : NEXT_PAGE_MAX_HEIGHT_MM;
      const maxAllowedRows = isFirst ? 8 : 10;

      if (
        currentItems.length > 0 &&
        (currentHeightMm + rowHeight > maxAllowedHeight || currentItems.length >= maxAllowedRows)
      ) {
        pagesData.push({ items: currentItems, usedHeightMm: currentHeightMm });
        currentItems = [{ record: rec, globalIndex: i + 1 }];
        currentHeightMm = rowHeight;
        isFirst = false;
      } else {
        currentItems.push({ record: rec, globalIndex: i + 1 });
        currentHeightMm += rowHeight;
      }
    }

    if (currentItems.length > 0) {
      pagesData.push({ items: currentItems, usedHeightMm: currentHeightMm });
    }

    // Pastikan halaman terakhir memiliki ruang yang cukup untuk blok tanda tangan (34mm)
    // tanpa menyentuh garis margin bawah. Jika penuh, pindahkan baris dari akhir ke halaman baru.
    if (pagesData.length > 0) {
      const lastPageIndex = pagesData.length - 1;
      const lastPage = pagesData[lastPageIndex];
      const lastPageBudget =
        lastPageIndex === 0 ? FIRST_PAGE_MAX_HEIGHT_MM : NEXT_PAGE_MAX_HEIGHT_MM;

      if (
        lastPage.usedHeightMm + SIGNATURE_BLOCK_HEIGHT_MM > lastPageBudget &&
        lastPage.items.length > 1
      ) {
        const movedItems: Array<{ record: SupervisiRecord; globalIndex: number }> = [];
        let movedHeightMm = 0;

        while (
          lastPage.usedHeightMm + SIGNATURE_BLOCK_HEIGHT_MM > lastPageBudget &&
          lastPage.items.length > 1
        ) {
          const movedItem = lastPage.items.pop()!;
          const itemHeight = estimateRowHeightMm(movedItem.record);
          lastPage.usedHeightMm = Math.max(0, lastPage.usedHeightMm - itemHeight);
          movedItems.unshift(movedItem);
          movedHeightMm += itemHeight;
        }

        if (movedItems.length > 0) {
          pagesData.push({
            items: movedItems,
            usedHeightMm: movedHeightMm,
          });
        }
      }
    }

    return pagesData.map((p, idx) => ({
      pageNumber: idx + 1,
      records: p.items,
      isFirstPage: idx === 0,
      isLastPage: idx === pagesData.length - 1,
    }));
  }, [filteredRecords]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    let selesai = 0;
    let dalamProses = 0;
    let totalFoto = 0;

    filteredRecords.forEach((r) => {
      if (r.status === "Selesai") selesai++;
      else dalamProses++;
      totalFoto += r.foto_temuan.length + r.foto_perbaikan.length;
    });

    const percentSelesai = total > 0 ? Math.round((selesai / total) * 100) : 0;

    return { total, selesai, dalamProses, percentSelesai, totalFoto };
  }, [filteredRecords]);

  // Paginated records for smooth 60-120fps scrolling on tablet & phone
  const totalItems = filteredRecords.length;
  const totalPages = itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    if (itemsPerPage === "all") return filteredRecords;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Open Edit Follow-Up Modal
  const handleOpenFollowUp = (rec: SupervisiRecord) => {
    setEditingRecord(rec);
    setTindakLanjutText(rec.upaya_perbaikan || "");
    const defaultTime = rec.waktu_perbaikan || new Date().toISOString().split("T")[0];
    setWaktuPerbaikanInput(defaultTime);
    setStatusInput(rec.status);
    setPerbaikanPhotos(rec.foto_perbaikan.map((url) => ({ url })));
  };

  // Image Upload Helper to Base64 (Extreme Reliability in Local Mode)
  const processImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo Selection for Follow-up
  const handleAddPerbaikanPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64Url = await processImageFile(file);
      setPerbaikanPhotos((prev) => [...prev, { url: base64Url, file }]);
    }
  };

  // Handle Photo Selection for New Supervisi
  const handleAddNewTemuanPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64Url = await processImageFile(file);
      setNewTemuanPhotos((prev) => [...prev, { url: base64Url, file }]);
    }
  };

  const handleAddNewPerbaikanPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64Url = await processImageFile(file);
      setNewPerbaikanPhotos((prev) => [...prev, { url: base64Url, file }]);
    }
  };

  // Save Follow-Up
  const handleSaveFollowUp = async () => {
    if (!editingRecord) return;
    setIsSubmittingFollowUp(true);

    try {
      const finalPhotoUrls = perbaikanPhotos.map((p) => p.url).filter(Boolean);

      const raw = editingRecord.raw_data || {};
      const currentParsed = raw.parsedJson || {};

      const updatedDataIndikator = {
        ...currentParsed,
        upaya_perbaikan: tindakLanjutText.trim(),
        waktu_perbaikan: waktuPerbaikanInput,
        foto_perbaikan: finalPhotoUrls,
        status_supervisi: statusInput,
      };

      const payload: Record<string, any> = {
        upaya_perbaikan: tindakLanjutText.trim(),
        waktu_perbaikan: waktuPerbaikanInput,
        foto_perbaikan: JSON.stringify(finalPhotoUrls),
        status_supervisi: statusInput,
        data_indikator: updatedDataIndikator,
      };

      const { error } = await supabase
        .from("audit_sessions")
        .update(payload)
        .eq("id", editingRecord.id);

      if (error) {
        throw error;
      }

      showToast("Tindak lanjut dan bukti foto perbaikan berhasil disimpan!");
      setEditingRecord(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error("Save follow-up error:", err);
      alert(`Gagal menyimpan: ${err.message || "Terjadi kesalahan"}`);
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  // Save New Supervisi Lapangan
  const handleSaveNewSupervisi = async () => {
    if (!newTemuan.trim()) {
      alert("Silakan isi temuan lapangan terlebih dahulu!");
      return;
    }

    setIsSubmittingNew(true);
    try {
      const temuanUrls = newTemuanPhotos.map((p) => p.url).filter(Boolean);
      const perbaikanUrls = newPerbaikanPhotos.map((p) => p.url).filter(Boolean);

      const kegiatanFinal =
        newKegiatan === "Kustom"
          ? newKegiatanCustom.trim() || "Supervisi Lapangan IPCN"
          : newKegiatan;

      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sup_${Date.now()}`;

      const dataIndikatorObj = {
        temuan: newTemuan.trim(),
        rekomendasi: newRekomendasi.trim(),
        dokumentasi: temuanUrls,
        upaya_perbaikan: newTindakLanjut.trim(),
        waktu_perbaikan: newTindakLanjut.trim() ? newTanggal : "",
        foto_perbaikan: perbaikanUrls,
        status_supervisi: newStatus,
        nama_pj_ruangan: "-",
      };

      const payload = {
        id: newId,
        indikator_id: "supervisi_lapangan",
        nama_indikator: kegiatanFinal,
        tanggal_waktu: newTanggal ? new Date(newTanggal).toISOString() : new Date().toISOString(),
        observer: newObserver.trim() || "IPCN",
        unit: newUnit,
        temuan: newTemuan.trim(),
        rekomendasi: newRekomendasi.trim(),
        upaya_perbaikan: newTindakLanjut.trim(),
        waktu_perbaikan: newTindakLanjut.trim() ? newTanggal : "",
        foto_perbaikan: JSON.stringify(perbaikanUrls),
        status_supervisi: newStatus,
        persentase: newStatus === "Selesai" ? 100 : 75,
        status_kepatuhan: newStatus === "Selesai" ? "Patuh" : "Tidak Patuh",
        data_indikator: dataIndikatorObj,
      };

      const { error } = await supabase.from("audit_sessions").insert([payload]);

      if (error) {
        throw error;
      }

      showToast("Supervisi lapangan baru berhasil ditambahkan!");
      setIsNewModalOpen(false);
      // Reset form
      setNewTemuan("");
      setNewRekomendasi("");
      setNewTindakLanjut("");
      setNewTemuanPhotos([]);
      setNewPerbaikanPhotos([]);
      setNewStatus("Dalam Proses");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error("Save new supervisi error:", err);
      alert(`Gagal menyimpan supervisi: ${err.message || "Terjadi kesalahan"}`);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from("audit_sessions").delete().eq("id", id);
      if (error) throw error;
      showToast("Data supervisi berhasil dihapus.");
      setDeleteConfirmId(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.error("Delete error:", err);
      alert(`Gagal menghapus: ${err.message || "Terjadi kesalahan"}`);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const excelData = filteredRecords.map((r, idx) => ({
        No: idx + 1,
        "Tanggal Pelaksanaan": format(new Date(r.tanggal_waktu), "dd/MM/yyyy HH:mm"),
        "Kegiatan Supervisi": r.nama_kegiatan,
        "Ruangan / Unit": r.unit,
        "Observer / IPCN": r.observer,
        "Temuan Lapangan (Masalah)": r.temuan || "-",
        "Rekomendasi PPI": r.rekomendasi || "-",
        "Tindak Lanjut / Perbaikan": r.upaya_perbaikan || "-",
        "Tanggal Selesai": r.waktu_perbaikan
          ? format(new Date(r.waktu_perbaikan), "dd/MM/yyyy")
          : "-",
        "Status Penyelesaian": r.status,
        "Jumlah Foto Temuan": r.foto_temuan.length,
        "Jumlah Foto Perbaikan": r.foto_perbaikan.length,
      }));

      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Rekap Supervisi PPI");
      writeFile(wb, `Rekap_Bukti_Supervisi_PPI_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Gagal mengunduh file Excel.");
    }
  };

  // Unduh PDF Resmi Standar F4 Landscape Multi-Halaman (100% 1:1 Sama Persis Tampilan Pratinjau Aplikasi)
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    setPdfProgressText("Menyiapkan dokumen...");
    try {
      const pageElements = document.querySelectorAll<HTMLElement>("[data-pdf-page='true']");
      if (!pageElements || pageElements.length === 0) {
        alert("Tidak ada lembar dokumen untuk diunduh.");
        return;
      }

      // Pastikan seluruh gambar pada setiap lembar pratinjau telah ter-decode penuh
      const allImgs = Array.from(
        document.querySelectorAll<HTMLImageElement>("[data-pdf-page='true'] img")
      );
      await Promise.all(
        allImgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Format Kertas F4 Landscape Standar Indonesia (330mm x 215mm)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [330, 215],
        compress: true,
      });

      const totalPages = pageElements.length;

      for (let i = 0; i < totalPages; i++) {
        setPdfProgressText(`Menyusun Halaman ${i + 1} dari ${totalPages}...`);
        const pageEl = pageElements[i];

        if (i > 0) {
          pdf.addPage([330, 215], "landscape");
        }

        const exactWidth = pageEl.offsetWidth || 1248;
        const exactHeight = pageEl.offsetHeight || 813;

        const canvas = await html2canvas(pageEl, {
          scale: 2.2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: exactWidth,
          height: exactHeight,
          windowWidth: exactWidth,
          windowHeight: exactHeight,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const clonedPages = clonedDoc.querySelectorAll<HTMLElement>("[data-pdf-page='true']");
            const targetClonedPage = clonedPages[i];
            if (targetClonedPage) {
              targetClonedPage.style.width = "330mm";
              targetClonedPage.style.minWidth = "330mm";
              targetClonedPage.style.maxWidth = "330mm";
              targetClonedPage.style.height = "215mm";
              targetClonedPage.style.minHeight = "215mm";
              targetClonedPage.style.maxHeight = "215mm";
              targetClonedPage.style.padding = "15mm";
              targetClonedPage.style.boxSizing = "border-box";
              targetClonedPage.style.overflow = "hidden";
              targetClonedPage.style.backgroundColor = "#ffffff";
              targetClonedPage.style.color = "#000000";
              targetClonedPage.style.boxShadow = "none";
              targetClonedPage.style.margin = "0";
              const allEls = targetClonedPage.querySelectorAll("*");
              allEls.forEach((el: any) => {
                el.style.color = "#000000";
                el.style.webkitTextFillColor = "#000000";
                if (el.tagName === "TD") {
                  el.style.verticalAlign = "top";
                  el.style.backgroundColor = "#ffffff";
                  el.style.borderColor = "#000000";
                }
                if (
                  el.tagName === "TH" ||
                  el.tagName === "THEAD" ||
                  el.classList.contains("bg-slate-100")
                ) {
                  el.style.backgroundColor = "#f1f5f9";
                  el.style.textAlign = "center";
                  el.style.verticalAlign = "middle";
                  el.style.borderColor = "#000000";
                }
              });
            }
          },
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", 0, 0, 330, 215, undefined, "FAST");
      }

      const dateStr = format(new Date(), "yyyyMMdd");
      pdf.save(`Bukti_Supervisi_PPI_RSUD_Al-Mulk_F4_Landscape_${dateStr}.pdf`);
      showToast("Dokumen PDF Bukti Supervisi berhasil diunduh.");
    } catch (err) {
      console.error("Gagal mengunduh PDF:", err);
      alert("Gagal mengunduh PDF. Silakan gunakan tombol Cetak Lembar sebagai alternatif.");
    } finally {
      setIsDownloadingPdf(false);
      setPdfProgressText("");
    }
  };

  // Cetak Resmi Menggunakan Standard Dialog Print Browser
  const handlePrintOfficial = () => {
    document.body.classList.add("printing-supervisi");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-supervisi");
    }, 1000);
  };

  return (
    <>
      <Head>
        <title>Bukti Supervisi & Tindak Lanjut PPI | SMART PPI RSUD AL-MULK</title>
      </Head>

      <div className="w-full max-w-full mx-auto px-0.5 sm:px-1 py-1 pb-28 text-slate-900 dark:text-slate-100">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-2xl border border-emerald-400/40"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-gta title-ultra-bold text-3xl sm:text-4xl lg:text-[42px] font-black tracking-wide leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_2px_10px_rgba(99,102,241,0.35)]">
              Bukti Supervisi & Tindak Lanjut
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Rekapitulasi kegiatan supervisi lapangan, temuan ketidaksesuaian, rekomendasi PPI, serta dokumentasi fisik bukti perbaikan.
            </p>
          </div>

          {/* Action Icon Buttons (Pojok Kanan Atas) */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              title="Tambah Supervisi Baru"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              title="Cetak Lembar Resmi PDF F4"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Mini-Cards with 3D Neumorphism */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141738] border border-slate-200/80 dark:border-indigo-500/20 shadow-[5px_5px_15px_rgba(0,0,0,0.06),-5px_-5px_15px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_18px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.04)] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Supervisi
              </span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/90 flex items-center justify-center shadow-inner">
                <ClipboardCheck className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Kegiatan supervisi terfilter
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-700/30 shadow-[5px_5px_15px_rgba(16,185,129,0.08),-5px_-5px_15px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_18px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(16,185,129,0.05)] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Selesai Ditindaklanjuti
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
              {stats.selesai}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Bukti fisik telah diperbaiki
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-700/30 shadow-[5px_5px_15px_rgba(245,158,11,0.08),-5px_-5px_15px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_18px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(245,158,11,0.05)] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Dalam Proses (Pending)
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shadow-inner">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 mt-2">
              {stats.dalamProses}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              Menunggu respon/perbaikan unit
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-700/30 shadow-[5px_5px_15px_rgba(59,130,246,0.08),-5px_-5px_15px_rgba(255,255,255,0.8)] dark:shadow-[6px_6px_18px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(59,130,246,0.05)] relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                % Penyelesaian
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shadow-inner">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 mt-2">
              {stats.percentSelesai}%
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Tingkat kepatuhan resolusi
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#10132b]/95 border border-slate-200 dark:border-slate-700/80 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari temuan, ruangan, kegiatan, rekomendasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#161a38] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Ruangan */}
            <div className="lg:col-span-3">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#161a38] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {UNITS_LIST.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Bulan */}
            <div className="lg:col-span-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#161a38] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {MONTHS_LIST.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="lg:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#161a38] border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Status (Selesai & Proses)</option>
                <option value="Selesai">Hanya Selesai (Closed)</option>
                <option value="Dalam Proses">Hanya Dalam Proses (Open)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Accreditation Table */}
        <div className="bg-white dark:bg-[#10132b]/95 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xl overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-center border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#161938] border-b border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider text-[12px]">
                  <th className="px-1 py-3 text-center align-middle w-7 min-w-[32px] border-r border-slate-200 dark:border-slate-700/80">No</th>
                  <th className="px-1.5 py-3 text-center align-middle w-24 min-w-[90px] border-r border-slate-200 dark:border-slate-700/80">Tanggal & Waktu</th>
                  <th className="px-2 py-3 text-center align-middle w-32 min-w-[120px] border-r border-slate-200 dark:border-slate-700/80">Kegiatan Supervisi</th>
                  <th className="px-1.5 py-3 text-center align-middle w-20 min-w-[75px] border-r border-slate-200 dark:border-slate-700/80">Ruangan</th>
                  <th className="px-2.5 py-3 text-center align-middle w-36 min-w-[135px] border-r border-slate-200 dark:border-slate-700/80">Temuan Lapangan</th>
                  <th className="px-2.5 py-3 text-center align-middle w-64 min-w-[250px] lg:w-72 lg:min-w-[280px] border-r border-slate-200 dark:border-slate-700/80">Foto Temuan (Before)</th>
                  <th className="px-3.5 py-3 text-center align-middle w-64 min-w-[250px] lg:w-72 lg:min-w-[280px] border-r border-slate-200 dark:border-slate-700/80">Rekomendasi PPI</th>
                  <th className="px-2.5 py-3 text-center align-middle w-36 min-w-[135px] border-r border-slate-200 dark:border-slate-700/80">Tindak Lanjut & Perbaikan</th>
                  <th className="px-2.5 py-3 text-center align-middle w-64 min-w-[250px] lg:w-72 lg:min-w-[280px] border-r border-slate-200 dark:border-slate-700/80">Foto Perbaikan (After)</th>
                  <th className="px-1.5 py-3 text-center align-middle w-24 min-w-[85px] border-r border-slate-200 dark:border-slate-700/80">Status</th>
                  <th className="px-1.5 py-3 text-center align-middle w-20 min-w-[75px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Memuat data bukti supervisi realtime...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        Tidak ada data supervisi yang sesuai filter.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Coba sesuaikan kata kunci pencarian atau ubah filter ruangan/bulan di atas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((item, idx) => {
                    const rowNumber =
                      itemsPerPage === "all"
                        ? idx + 1
                        : (currentPage - 1) * itemsPerPage + idx + 1;

                    const dateFormatted = item.tanggal_waktu
                      ? format(new Date(item.tanggal_waktu), "dd MMM yyyy, HH:mm", {
                          locale: idLocale,
                        })
                      : "-";

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* No */}
                        <td className="px-1 py-3 text-center align-top font-bold text-slate-500 dark:text-slate-400 text-[12px] border-r border-slate-200 dark:border-slate-700/80">
                          {rowNumber}
                        </td>

                        {/* Tanggal & Waktu */}
                        <td className="px-1.5 py-3 text-center align-top text-[12px] border-r border-slate-200 dark:border-slate-700/80">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-[12px]">
                            {dateFormatted.split(",")[0]}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono mt-0.5">
                            {dateFormatted.split(",")[1]}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate" title={`Observer: ${item.observer}`}>
                            Obs: {item.observer}
                          </span>
                        </td>

                        {/* Kegiatan / Indikator */}
                        <td className="px-2 py-3 text-center align-top text-[12px] border-r border-slate-200 dark:border-slate-700/80">
                          <span className="font-bold text-slate-900 dark:text-white block leading-snug text-[12px]">
                            {item.nama_kegiatan}
                          </span>
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1b2044] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                            {item.indikator_id.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Ruangan - Cukup Nama Saja Tanpa Icon & Tanpa Garis Card */}
                        <td className="px-1.5 py-3 text-center align-top text-[12px] border-r border-slate-200 dark:border-slate-700/80">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-[12px]">
                            {item.unit}
                          </span>
                        </td>

                        {/* Temuan */}
                        <td className="px-2.5 py-3 text-center align-top text-[12px] border-r border-slate-200 dark:border-slate-700/80">
                          {item.temuan ? (
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap text-[12px]">
                              {item.temuan}
                            </p>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                              Tidak ada temuan khusus
                            </span>
                          )}
                        </td>

                        {/* Foto Temuan (Before) - Seluruh Foto Berjajar ke Bawah */}
                        <td className="px-2.5 py-3 text-center align-top border-r border-slate-200 dark:border-slate-700/80">
                          {item.foto_temuan.length > 0 ? (
                            <div className="flex flex-col items-center justify-start gap-2.5 mx-auto">
                              {item.foto_temuan.map((imgUrl, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() =>
                                    setLightboxImage({
                                      images: [imgUrl],
                                      currentIndex: 0,
                                      url: imgUrl,
                                      title: `Foto Temuan (Before) #${imgIdx + 1} - ${item.unit}`,
                                      subtitle: item.temuan,
                                      type: "before",
                                    })
                                  }
                                  title={`Klik untuk memperbesar Foto Temuan #${imgIdx + 1}`}
                                  className="relative group w-48 h-32 sm:w-56 sm:h-36 lg:w-64 lg:h-44 rounded-2xl overflow-hidden border-2 border-amber-400/90 shadow-md hover:scale-[1.02] hover:shadow-amber-500/20 hover:brightness-105 transition-all bg-slate-900 cursor-pointer block mx-auto shrink-0"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={normalizeImageUrl(imgUrl)}
                                    alt={`Temuan Before ${imgIdx + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover rounded-2xl"
                                  />
                                </button>
                              ))}
                              <span className="text-[10.5px] font-black uppercase text-amber-500 dark:text-amber-400 tracking-wider mt-0.5 block">
                                Before {item.foto_temuan.length > 1 ? `(${item.foto_temuan.length} Foto)` : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block pt-1">
                              Tidak ada foto
                            </span>
                          )}
                        </td>

                        {/* Rekomendasi PPI - Diperlebar Sama Lebar dengan Foto Temuan */}
                        <td className="px-3.5 py-3 text-center align-top text-[12px] w-64 min-w-[250px] lg:w-72 lg:min-w-[280px] border-r border-slate-200 dark:border-slate-700/80">
                          {item.rekomendasi ? (
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap text-[12px] text-left">
                              {item.rekomendasi}
                            </p>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                              Pertahankan kepatuhan
                            </span>
                          )}
                        </td>

                        {/* Tindak Lanjut & Upaya Perbaikan */}
                        <td className="px-2.5 py-3 text-center align-top text-[12px] border-r border-slate-200 dark:border-slate-700/80">
                          {item.upaya_perbaikan ? (
                            <div>
                              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium whitespace-pre-wrap text-[12px]">
                                {item.upaya_perbaikan}
                              </p>
                              {item.waktu_perbaikan && (
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-1">
                                  Realisasi: {format(new Date(item.waktu_perbaikan), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] italic flex items-center justify-center gap-1">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Menunggu tindak lanjut
                            </span>
                          )}
                        </td>

                        {/* Foto Perbaikan (After) - Seluruh Foto Berjajar ke Bawah */}
                        <td className="px-2.5 py-3 text-center align-top border-r border-slate-200 dark:border-slate-700/80">
                          {item.foto_perbaikan.length > 0 ? (
                            <div className="flex flex-col items-center justify-start gap-2.5 mx-auto">
                              {item.foto_perbaikan.map((imgUrl, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() =>
                                    setLightboxImage({
                                      images: [imgUrl],
                                      currentIndex: 0,
                                      url: imgUrl,
                                      title: `Foto Bukti Perbaikan (After) #${imgIdx + 1} - ${item.unit}`,
                                      subtitle: item.upaya_perbaikan,
                                      type: "after",
                                    })
                                  }
                                  title={`Klik untuk memperbesar Foto Perbaikan #${imgIdx + 1}`}
                                  className="relative group w-48 h-32 sm:w-56 sm:h-36 lg:w-64 lg:h-44 rounded-2xl overflow-hidden border-2 border-emerald-400/90 shadow-md hover:scale-[1.02] hover:shadow-emerald-500/20 hover:brightness-105 transition-all bg-slate-900 cursor-pointer block mx-auto shrink-0"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={normalizeImageUrl(imgUrl)}
                                    alt={`Perbaikan After ${imgIdx + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover rounded-2xl"
                                  />
                                </button>
                              ))}
                              <span className="text-[10.5px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mt-0.5 block">
                                After {item.foto_perbaikan.length > 1 ? `(${item.foto_perbaikan.length} Foto)` : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block pt-1">
                              Belum ada bukti foto
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-1.5 py-3 text-center align-top text-[12px] border-r border-slate-200 dark:border-slate-700/80">
                          {item.status === "Selesai" ? (
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              Dalam Proses
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-1.5 py-3 text-center align-top text-[12px]">
                          <div className="flex flex-col gap-1.5 items-center justify-center">
                            <button
                              type="button"
                              onClick={() => handleOpenFollowUp(item)}
                              className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                              title="Update Tindak Lanjut & Upload Foto Perbaikan"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Tindak Lanjut</span>
                            </button>

                            {item.form_path && (
                              <Link
                                href={item.form_path}
                                className="w-full inline-flex items-center justify-center gap-0.5 px-1 py-0.5 rounded text-[9.5px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                title="Buka form audit awal"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Form Awal</span>
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="text-slate-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                              title="Hapus data supervisi ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION BAR FOR TABLET & MOBILE PERFORMANCE */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-slate-50/60 dark:bg-[#0c0e22]/90 border-t border-slate-200 dark:border-slate-800 text-xs">
              {/* Info Text */}
              <div className="text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                Menampilkan{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {itemsPerPage === "all" ? 1 : (currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                –{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {itemsPerPage === "all"
                    ? totalItems
                    : Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {totalItems}
                </span>{" "}
                kegiatan supervisi
              </div>

              {/* Controls (Page Size + Buttons) */}
              <div className="flex items-center flex-wrap justify-center gap-3">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="text-[11px]">Tampilkan:</span>
                  <div className="flex items-center bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700/60">
                    {[15, 30, "all"].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setItemsPerPage(size as number | "all");
                          setCurrentPage(1);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          itemsPerPage === size
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {size === "all" ? "Semua" : size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Navigation Buttons */}
                {itemsPerPage !== "all" && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentPage === pageNum
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50"
                                  : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <span
                              key={pageNum}
                              className="px-1 text-slate-400 text-xs"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Halaman Berikutnya"
                    >
                      <span className="hidden sm:inline">Berikutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: UPDATE TINDAK LANJUT & BUKTI FOTO PERBAIKAN (BLUR GLASSMORPHISM) */}
        <AnimatePresence>
          {editingRecord && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-all duration-300"
                onClick={() => !isSubmittingFollowUp && setEditingRecord(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-[#0e112a]/95 backdrop-blur-2xl rounded-3xl border border-indigo-500/35 shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-6 overflow-hidden my-auto max-h-[90vh] flex flex-col text-slate-100 ring-1 ring-white/10"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-indigo-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Update Tindak Lanjut & Foto Perbaikan
                      </h3>
                      <p className="text-xs text-indigo-300/80 font-medium">
                        {editingRecord.nama_kegiatan} • {editingRecord.unit}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingRecord(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl bg-[#161a3c] border border-indigo-900/60 shadow-inner space-y-2.5">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300/80 block">
                        Temuan Lapangan Awal (Before)
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-100 mt-0.5 leading-relaxed">
                        {editingRecord.temuan || "Tidak ada rincian temuan khusus."}
                      </p>
                    </div>

                    {editingRecord.rekomendasi && (
                      <div className="pt-2.5 border-t border-indigo-900/50">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300/80 block">
                          Rekomendasi PPI
                        </span>
                        <p className="text-xs font-medium text-slate-200 mt-0.5 leading-relaxed">
                          {editingRecord.rekomendasi}
                        </p>
                      </div>
                    )}

                    {editingRecord.foto_temuan.length > 0 && (
                      <div className="pt-2.5 border-t border-indigo-900/50">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300/80 block mb-1.5">
                          Dokumentasi Foto Before ({editingRecord.foto_temuan.length})
                        </span>
                        <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                          {editingRecord.foto_temuan.map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={img}
                              alt="Before"
                              onClick={() =>
                                setLightboxImage({
                                  images: editingRecord.foto_temuan,
                                  currentIndex: i,
                                  url: img,
                                  title: `Foto Temuan (Before) - ${editingRecord.unit}`,
                                  subtitle: editingRecord.temuan,
                                  type: "before",
                                  compareImages: editingRecord.foto_perbaikan,
                                  compareUrl: editingRecord.foto_perbaikan[0],
                                })
                              }
                              className="w-16 h-16 rounded-xl object-cover border-2 border-amber-400/90 shadow-md shrink-0 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-400 transition-all"
                              title={`Klik untuk memperbesar / slider foto ke-${i + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Status Penyelesaian
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStatusInput("Selesai")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                          statusInput === "Selesai"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50"
                            : "bg-[#141838] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-[#191e46]"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selesai (Closed)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusInput("Dalam Proses")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                          statusInput === "Dalam Proses"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50"
                            : "bg-[#141838] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-[#191e46]"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Dalam Proses (Open)</span>
                      </button>
                    </div>
                  </div>

                  {/* Uraian Tindak Lanjut Text */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Rencana & Upaya Tindak Lanjut Perbaikan
                    </label>
                    <textarea
                      rows={3}
                      value={tindakLanjutText}
                      onChange={(e) => setTindakLanjutText(e.target.value)}
                      placeholder="Jelaskan tindakan korektif fisik/perilaku yang telah atau sedang dilakukan oleh unit ruangan..."
                      className="w-full p-3 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* Tanggal Penyelesaian */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Tanggal Realisasi Perbaikan
                    </label>
                    <input
                      type="date"
                      value={waktuPerbaikanInput}
                      onChange={(e) => setWaktuPerbaikanInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Upload Foto Bukti Perbaikan (After) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Bukti Foto Fisik Perbaikan (After)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2">
                      {perbaikanPhotos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative group w-full aspect-square rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt="Bukti After"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPerbaikanPhotos((prev) => prev.filter((_, idx) => idx !== pIdx))
                            }
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add photo button */}
                      <label className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer bg-[#090b1c] text-slate-400 hover:text-emerald-400 transition-colors">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold text-center">Tambah Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddPerbaikanPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      Upload foto kondisi ruangan atau fasilitas setelah dilakukan perbaikan sebagai bukti fisik kepada surveior akreditasi.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-indigo-900/50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    disabled={isSubmittingFollowUp}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFollowUp}
                    disabled={isSubmittingFollowUp}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingFollowUp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 2: TAMBAH SUPERVISI LAPANGAN BARU (BLUR GLASSMORPHISM) */}
        <AnimatePresence>
          {isNewModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-all duration-300"
                onClick={() => !isSubmittingNew && setIsNewModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-[#0e112a]/95 backdrop-blur-2xl rounded-3xl border border-indigo-500/35 shadow-[0_25px_70px_rgba(0,0,0,0.9)] p-6 overflow-hidden my-auto max-h-[90vh] flex flex-col text-slate-100 ring-1 ring-white/10"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-indigo-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Tambah Bukti Supervisi Lapangan Baru
                      </h3>
                      <p className="text-xs text-indigo-300/80 font-medium">
                        Catat hasil ronde keliling, supervisi insidental, atau temuan lapangan baru
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNewModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Tanggal & Waktu Supervisi
                      </label>
                      <input
                        type="datetime-local"
                        value={newTanggal}
                        onChange={(e) => setNewTanggal(e.target.value)}
                        className="w-full p-2.5 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Ruangan / Unit Kerja
                      </label>
                      <select
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full p-2.5 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {UNITS_LIST.filter((u) => u !== "Semua Ruangan").map((u) => (
                          <option key={u} value={u} className="bg-[#090b1c] text-slate-100">
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Jenis Kegiatan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Jenis Kegiatan / Supervisi
                    </label>
                    <select
                      value={newKegiatan}
                      onChange={(e) => setNewKegiatan(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Supervisi Ronde Lapangan IPCN" className="bg-[#090b1c] text-slate-100">Supervisi Ronde Lapangan IPCN</option>
                      <option value="Supervisi Pengelolaan Limbah Medis" className="bg-[#090b1c] text-slate-100">Supervisi Pengelolaan Limbah Medis</option>
                      <option value="Supervisi Kepatuhan Hand Hygiene & APD" className="bg-[#090b1c] text-slate-100">Supervisi Kepatuhan Hand Hygiene & APD</option>
                      <option value="Supervisi Pengendalian Lingkungan" className="bg-[#090b1c] text-slate-100">Supervisi Sanitasi & Pengendalian Lingkungan</option>
                      <option value="Supervisi Penatalaksanaan Linen" className="bg-[#090b1c] text-slate-100">Supervisi Penatalaksanaan Linen & Laundry</option>
                      <option value="Supervisi Dekontaminasi & Sterilisasi" className="bg-[#090b1c] text-slate-100">Supervisi Dekontaminasi & Sterilisasi Alat</option>
                      <option value="Supervisi Fasilitas & Sarana PPI" className="bg-[#090b1c] text-slate-100">Supervisi Kesiapan Fasilitas & Sarana PPI</option>
                      <option value="Kustom" className="bg-[#090b1c] text-slate-100">Lainnya (Ketik Manual)...</option>
                    </select>

                    {newKegiatan === "Kustom" && (
                      <input
                        type="text"
                        placeholder="Ketikkan nama kegiatan supervisi kustom..."
                        value={newKegiatanCustom}
                        onChange={(e) => setNewKegiatanCustom(e.target.value)}
                        className="w-full mt-2 p-2.5 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Nama Observer / IPCN
                    </label>
                    <input
                      type="text"
                      value={newObserver}
                      onChange={(e) => setNewObserver(e.target.value)}
                      placeholder="Nama auditor / IPCN..."
                      className="w-full p-2.5 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Temuan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Uraian Temuan Lapangan (Masalah) <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={newTemuan}
                      onChange={(e) => setNewTemuan(e.target.value)}
                      placeholder="Uraikan temuan ketidaksesuaian SOP atau masalah yang ditemukan saat supervisi..."
                      className="w-full p-3 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Foto Temuan Before */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Foto Dokumentasi Temuan (Before)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-1.5">
                      {newTemuanPhotos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative group w-full aspect-square rounded-xl overflow-hidden border-2 border-amber-400 shadow-md"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt="Temuan Before"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewTemuanPhotos((prev) => prev.filter((_, idx) => idx !== pIdx))
                            }
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <label className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500 cursor-pointer bg-[#090b1c] text-slate-400 hover:text-amber-400 transition-colors">
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold text-center">Foto Before</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAddNewTemuanPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Rekomendasi */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Rekomendasi PPI untuk Unit Kerja
                    </label>
                    <textarea
                      rows={2}
                      value={newRekomendasi}
                      onChange={(e) => setNewRekomendasi(e.target.value)}
                      placeholder="Saran dan arahan perbaikan yang harus dipenuhi oleh unit ruangan..."
                      className="w-full p-3 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Status Awal */}
                  <div className="pt-2 border-t border-indigo-900/50">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Status Supervisi Saat Ini
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewStatus("Dalam Proses")}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          newStatus === "Dalam Proses"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50"
                            : "bg-[#141838] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-[#191e46]"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Dalam Proses (Open)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewStatus("Selesai")}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          newStatus === "Selesai"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50"
                            : "bg-[#141838] border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-[#191e46]"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Langsung Selesai (Closed)</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Tindak Lanjut jika langsung selesai */}
                  {newStatus === "Selesai" && (
                    <div className="p-4 rounded-2xl bg-[#161a3c] border border-emerald-900/50 shadow-inner space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">
                          Tindak Lanjut Perbaikan yang Telah Dilakukan
                        </label>
                        <textarea
                          rows={2}
                          value={newTindakLanjut}
                          onChange={(e) => setNewTindakLanjut(e.target.value)}
                          placeholder="Jelaskan tindakan langsung yang telah dilakukan..."
                          className="w-full p-2.5 rounded-xl text-sm bg-[#090b1c] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
                          Foto Bukti Perbaikan (After)
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {newPerbaikanPhotos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative group w-full aspect-square rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.url}
                                alt="Perbaikan After"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setNewPerbaikanPhotos((prev) =>
                                    prev.filter((_, idx) => idx !== pIdx)
                                  )
                                }
                                className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          <label className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer bg-[#090b1c] text-slate-400 hover:text-emerald-400 transition-colors">
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-bold text-center">Foto After</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleAddNewPerbaikanPhoto}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-indigo-900/50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    disabled={isSubmittingNew}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewSupervisi}
                    disabled={isSubmittingNew}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingNew ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Simpan Supervisi</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 3: LIGHTBOX IMAGE VIEWER WITH BEFORE-AFTER COMPARISON & SLIDER */}
        <AnimatePresence>
          {lightboxImage && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-4xl w-full bg-[#0e112a]/95 backdrop-blur-2xl border border-indigo-500/35 rounded-3xl p-4 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col max-h-[95vh] text-slate-100 ring-1 ring-white/10"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-indigo-900/50">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-black uppercase shrink-0 ${
                        lightboxImage.type === "before"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {lightboxImage.type === "before" ? "Temuan (Before)" : "Perbaikan (After)"}
                    </span>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <span>{lightboxImage.title}</span>
                        {lightboxImage.images && lightboxImage.images.length > 1 && (
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shrink-0">
                            Foto {lightboxImage.currentIndex + 1} dari {lightboxImage.images.length}
                          </span>
                        )}
                      </h4>
                      {lightboxImage.subtitle && (
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                          {lightboxImage.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    title="Tutup (Esc)"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Body Image with Slider Arrows */}
                <div className="relative flex-1 overflow-hidden flex items-center justify-center py-4 min-h-[300px]">
                  {/* Prev Button */}
                  {lightboxImage.images && lightboxImage.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage((prev) => {
                          if (!prev || !prev.images || prev.images.length <= 1) return prev;
                          const newIdx =
                            (prev.currentIndex - 1 + prev.images.length) % prev.images.length;
                          return { ...prev, currentIndex: newIdx, url: prev.images[newIdx] };
                        })
                      }
                      title="Foto Sebelumnya (Panah Kiri ◀)"
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
                    >
                      <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </button>
                  )}

                  {/* Active Photo */}
                  <div className="w-full h-full flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`${lightboxImage.type}-${lightboxImage.currentIndex}`}
                        src={
                          (lightboxImage.images && lightboxImage.images[lightboxImage.currentIndex]) ||
                          lightboxImage.url
                        }
                        alt={`Dokumentasi ${lightboxImage.currentIndex + 1}`}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="max-h-[62vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700/80 select-none"
                      />
                    </AnimatePresence>
                  </div>

                  {/* Next Button */}
                  {lightboxImage.images && lightboxImage.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage((prev) => {
                          if (!prev || !prev.images || prev.images.length <= 1) return prev;
                          const newIdx = (prev.currentIndex + 1) % prev.images.length;
                          return { ...prev, currentIndex: newIdx, url: prev.images[newIdx] };
                        })
                      }
                      title="Foto Berikutnya (Panah Kanan ▶)"
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
                    >
                      <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </button>
                  )}
                </div>

                {/* Dot Pagination for multiple photos */}
                {lightboxImage.images && lightboxImage.images.length > 1 && (
                  <div className="flex items-center justify-center gap-2 pb-2">
                    {lightboxImage.images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setLightboxImage((prev) =>
                            prev ? { ...prev, currentIndex: i, url: prev.images[i] } : null
                          )
                        }
                        className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                          i === lightboxImage.currentIndex
                            ? lightboxImage.type === "before"
                              ? "w-8 bg-amber-400 shadow-md shadow-amber-400/50"
                              : "w-8 bg-emerald-400 shadow-md shadow-emerald-400/50"
                            : "w-2.5 bg-slate-600 hover:bg-slate-400"
                        }`}
                        title={`Buka foto ke-${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Compare Button if the counter-part image exists */}
                {((lightboxImage.compareImages && lightboxImage.compareImages.length > 0) ||
                  lightboxImage.compareUrl) && (
                  <div className="pt-3 border-t border-indigo-900/50 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Tersedia dokumentasi{" "}
                      {lightboxImage.type === "before" ? "Perbaikan (After)" : "Temuan (Before)"}
                    </span>
                    <button
                      onClick={() =>
                        setLightboxImage((prev) =>
                          prev
                            ? {
                                images:
                                  prev.compareImages && prev.compareImages.length > 0
                                    ? prev.compareImages
                                    : [prev.compareUrl!],
                                currentIndex: 0,
                                url:
                                  (prev.compareImages && prev.compareImages[0]) ||
                                  prev.compareUrl!,
                                title:
                                  prev.type === "before"
                                    ? `Foto Bukti Perbaikan (After)`
                                    : `Foto Temuan (Before)`,
                                subtitle: prev.subtitle,
                                type: prev.type === "before" ? "after" : "before",
                                compareImages: prev.images,
                                compareUrl: prev.url,
                              }
                            : null
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        Beralih ke Foto {lightboxImage.type === "before" ? "After (Perbaikan)" : "Before (Temuan)"}
                      </span>
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 4: CETAK LEMBAR RESMI F4 LANDSCAPE (STANDAR AKREDITASI MULTI-HALAMAN) */}
        <AnimatePresence>
          {isPrintModalOpen && (
            <div
              id="supervisi-print-modal-container"
              className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-[98vw] xl:max-w-[360mm] bg-[#141634] text-black rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col border border-indigo-900/40"
              >
                {/* Print Modal Bar */}
                <div className="print-modal-bar p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-sm sm:text-base tracking-wide uppercase text-white">
                        PRATINJAU BUKTI SUPERVISI
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {/* Tombol Unduh PDF (Icon Merah di Pojok Kanan Atas) */}
                    <button
                      type="button"
                      disabled={isDownloadingPdf}
                      onClick={handleDownloadPdf}
                      className="w-10 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
                      title={isDownloadingPdf ? (pdfProgressText || "Menyusun PDF...") : "Unduh PDF Bukti Supervisi"}
                    >
                      {isDownloadingPdf ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrintModalOpen(false)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Tutup"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Document Sheets Preview Area (Multi-Page F4 Landscape) */}
                <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-900/90 print:bg-white print:p-0 flex flex-col items-center gap-8">
                  {paginatedSupervisiPages.map((page) => {
                    const totalPagesCount = paginatedSupervisiPages.length;
                    return (
                      <div
                        key={page.pageNumber}
                        id={page.isFirstPage ? "printable-supervisi-sheet" : undefined}
                        data-pdf-page="true"
                        className="supervisi-page-sheet official-report-sheet official-pdf-page bg-white bg-force-white w-[330mm] min-w-[330mm] max-w-[330mm] h-[215mm] min-h-[215mm] max-h-[215mm] p-[15mm] shadow-2xl text-black font-sans box-border relative flex flex-col justify-between overflow-hidden shrink-0"
                        style={{
                          width: "330mm",
                          minWidth: "330mm",
                          maxWidth: "330mm",
                          height: "215mm",
                          minHeight: "215mm",
                          maxHeight: "215mm",
                          padding: "15mm",
                          boxSizing: "border-box",
                          overflow: "hidden",
                          backgroundColor: "#ffffff",
                          color: "#000000",
                        }}
                      >
                        <div className="w-full">
                          {/* Kop Surat Resmi UOBK RSUD AL-MULK KOTA SUKABUMI (Hanya Halaman 1) */}
                          {page.isFirstPage ? (
                            <>
                              <div className="border-b-[2.5px] border-black pb-1.5 mb-0.5">
                                <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
                                  <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                                    {hospitalLogoUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={hospitalLogoUrl}
                                        alt="Logo RS"
                                        crossOrigin="anonymous"
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    ) : (
                                      <ShieldCheck className="w-9 h-9 text-black" />
                                    )}
                                  </div>
                                  <div className="text-center">
                                    <h1 className="text-[11.5pt] font-black uppercase tracking-wide leading-tight text-black">
                                      TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
                                    </h1>
                                    <h2 className="text-[11.5pt] font-black uppercase tracking-wider leading-tight text-black mt-0.5">
                                      UOBK RSUD AL-MULK KOTA SUKABUMI
                                    </h2>
                                    <p className="text-[8pt] text-black italic mt-0.5 leading-tight">
                                      Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="border-b border-black mb-2.5" />

                              {/* Judul Dokumen */}
                              <div className="text-center mb-3">
                                <h2 className="text-[12pt] font-black uppercase text-black underline tracking-tight">
                                  REKAPITULASI BUKTI SUPERVISI & TINDAK LANJUT PPI
                                </h2>
                                <div className="flex items-center justify-center gap-4 text-[8.5pt] text-black mt-1">
                                  <span>
                                    Periode:{" "}
                                    <strong>
                                      {selectedMonth === "all"
                                        ? `Tahun ${selectedYear}`
                                        : `${MONTHS_LIST.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`}
                                    </strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Ruangan: <strong>{selectedUnit}</strong>
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Subsequent Pages: Official Running Header */
                            <div className="border-b-[1.5px] border-black pb-1.5 mb-2.5 flex items-center justify-between text-[8pt] text-black">
                              <div className="flex items-center gap-2">
                                {hospitalLogoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={hospitalLogoUrl}
                                    alt="Logo"
                                    crossOrigin="anonymous"
                                    className="w-5 h-5 object-contain"
                                  />
                                ) : (
                                  <ShieldCheck className="w-4 h-4 text-black" />
                                )}
                                <span className="font-extrabold uppercase tracking-wide text-black">
                                  TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI) • UOBK RSUD AL-MULK
                                </span>
                              </div>
                              <div className="text-right italic font-semibold text-black">
                                Rekapitulasi Bukti Supervisi & Tindak Lanjut PPI
                              </div>
                            </div>
                          )}

                          {/* Print Table - Proporsional Kertas F4 Landscape dengan Margin 1,5 cm dan Header Rata Tengah */}
                          <table
                            className="w-full table-fixed text-left border-collapse border border-black text-[8pt] leading-snug mb-2 bg-white"
                            style={{ backgroundColor: "#ffffff" }}
                          >
                            <thead>
                              <tr
                                className="bg-slate-100 border-b border-black text-black font-extrabold text-center"
                                style={{ backgroundColor: "#f1f5f9" }}
                              >
                                <th
                                  className="border border-black px-1 py-2 w-[3.5%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  No
                                </th>
                                <th
                                  className="border border-black px-1.5 py-2 w-[7.5%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Tanggal
                                </th>
                                <th
                                  className="border border-black px-2 py-2 w-[11%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Kegiatan Supervisi
                                </th>
                                <th
                                  className="border border-black px-1.5 py-2 w-[7.5%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Ruangan
                                </th>
                                <th
                                  className="border border-black px-2 py-2 w-[16%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Temuan Lapangan
                                </th>
                                <th
                                  className="border border-black px-1.5 py-2 w-[9%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Foto Before
                                </th>
                                <th
                                  className="border border-black px-2 py-2 w-[22.5%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Rekomendasi PPI
                                </th>
                                <th
                                  className="border border-black px-2 py-2 w-[9.5%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Tindak Lanjut
                                </th>
                                <th
                                  className="border border-black px-1.5 py-2 w-[8%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Foto After
                                </th>
                                <th
                                  className="border border-black px-1 py-2 w-[5.5%] text-center align-middle"
                                  style={{ backgroundColor: "#f1f5f9", textAlign: "center" }}
                                >
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody style={{ backgroundColor: "#ffffff" }}>
                              {page.records.map(({ record: rec, globalIndex }) => (
                                <tr
                                  key={rec.id}
                                  className="border-b border-black align-top text-black bg-white break-inside-avoid"
                                  style={{
                                    backgroundColor: "#ffffff",
                                    color: "#000000",
                                    pageBreakInside: "avoid",
                                    breakInside: "avoid",
                                  }}
                                >
                                  <td
                                    className="border border-black px-1 py-1.5 text-center font-bold text-black align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      textAlign: "center",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {globalIndex}
                                  </td>
                                  <td
                                    className="border border-black px-1.5 py-1.5 text-center text-black align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      textAlign: "center",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.tanggal_waktu
                                      ? format(new Date(rec.tanggal_waktu), "dd/MM/yyyy HH:mm")
                                      : "-"}
                                  </td>
                                  <td
                                    className="border border-black px-2 py-1.5 font-bold text-black align-top break-words"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.nama_kegiatan || "Supervisi PPI"}
                                  </td>
                                  <td
                                    className="border border-black px-1.5 py-1.5 font-bold text-center text-black align-top break-words"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      textAlign: "center",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.unit || "Umum"}
                                  </td>
                                  <td
                                    className="border border-black px-2 py-1.5 whitespace-pre-wrap break-words text-black align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.temuan && rec.temuan.trim() ? rec.temuan : "-"}
                                  </td>
                                  <td
                                    className="border border-black px-1 py-1.5 text-center align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.foto_temuan.length > 0 ? (
                                      <div className="flex flex-col items-center justify-start gap-1 mx-auto">
                                        {rec.foto_temuan.map((imgUrl, fIdx) => (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            key={fIdx}
                                            src={normalizeImageUrl(imgUrl)}
                                            alt={`Before ${fIdx + 1}`}
                                            crossOrigin="anonymous"
                                            className="w-[20mm] h-[15.5mm] object-cover mx-auto rounded border border-black"
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[7.5pt] text-black italic">-</span>
                                    )}
                                  </td>
                                  <td
                                    className="border border-black px-2 py-1.5 whitespace-pre-wrap break-words text-black font-medium align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.rekomendasi && rec.rekomendasi.trim()
                                      ? rec.rekomendasi
                                      : "-"}
                                  </td>
                                  <td
                                    className="border border-black px-2 py-1.5 whitespace-pre-wrap break-words text-black align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.upaya_perbaikan && rec.upaya_perbaikan.trim()
                                      ? rec.upaya_perbaikan
                                      : "-"}
                                    {rec.waktu_perbaikan && (
                                      <div className="text-[7pt] text-black mt-0.5 font-mono">
                                        Tgl: {format(new Date(rec.waktu_perbaikan), "dd/MM/yyyy")}
                                      </div>
                                    )}
                                  </td>
                                  <td
                                    className="border border-black px-1 py-1.5 text-center align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {rec.foto_perbaikan.length > 0 ? (
                                      <div className="flex flex-col items-center justify-start gap-1 mx-auto">
                                        {rec.foto_perbaikan.map((imgUrl, fIdx) => (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            key={fIdx}
                                            src={normalizeImageUrl(imgUrl)}
                                            alt={`After ${fIdx + 1}`}
                                            crossOrigin="anonymous"
                                            className="w-[20mm] h-[15.5mm] object-cover mx-auto rounded border border-black"
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[7.5pt] text-black italic">-</span>
                                    )}
                                  </td>
                                  <td
                                    className="border border-black px-1 py-1.5 text-center font-bold text-black align-top"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      textAlign: "center",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    <span className="inline-block px-1 py-0.5 rounded text-[7.5pt] font-extrabold border border-black text-black leading-tight">
                                      {rec.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Lembar Tanda Tangan Resmi HANYA pada Halaman Terakhir */}
                          {page.isLastPage && (
                            <div
                              className="mt-3 pt-2.5 border-t border-black grid grid-cols-2 gap-16 text-[9pt] text-center break-inside-avoid text-black bg-white"
                              style={{ backgroundColor: "#ffffff" }}
                            >
                              <div>
                                <p className="text-black font-bold mb-11">
                                  Mengetahui,<br />
                                  <span className="text-black font-black">Ketua Komite PPI</span>
                                </p>
                                <p className="font-black text-black underline text-[9.5pt]">
                                  dr. Nurul Iman
                                </p>
                              </div>
                              <div>
                                <p className="text-black font-bold mb-11">
                                  Sukabumi, {format(new Date(), "d MMMM yyyy", { locale: idLocale })}<br />
                                  <span className="text-black font-black">Infection Prevention and Control Nurse (IPCN)</span>
                                </p>
                                <p className="font-black text-black underline text-[9.5pt]">
                                  Adi Tresa Purnama
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Running Footer Nomor Halaman */}
                        <div
                          className="mt-auto pt-1.5 border-t border-slate-300 flex items-center justify-between text-[7.5pt] text-slate-700 font-mono bg-white shrink-0"
                          style={{ backgroundColor: "#ffffff" }}
                        >
                          <span>TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI) • UOBK RSUD AL-MULK</span>
                          <span className="font-bold">
                            Halaman {page.pageNumber} dari {totalPagesCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 5: KONFIRMASI HAPUS (BLUR GLASSMORPHISM) */}
        <AnimatePresence>
          {deleteConfirmId && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-[#0e112a]/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-rose-500/35 text-center text-slate-100 ring-1 ring-white/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-md">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Hapus Data Supervisi?
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Data supervisi ini akan dihapus permanen dari sistem rekap dan audit PPI.
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(deleteConfirmId)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

BuktiSupervisiPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
