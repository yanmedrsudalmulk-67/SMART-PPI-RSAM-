import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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

  // Modals
  const [editingRecord, setEditingRecord] = useState<SupervisiRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    type: "before" | "after";
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

  return (
    <DashboardLayout>
      <Head>
        <title>Bukti Supervisi & Tindak Lanjut PPI | SMART PPI RSUD AL-MULK</title>
      </Head>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-6 pb-28 text-slate-900 dark:text-slate-100">
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
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Bukti Supervisi & Tindak Lanjut
                  <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Akreditasi KARS / STARKES
                  </span>
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Rekapitulasi kegiatan supervisi lapangan, temuan ketidaksesuaian, rekomendasi PPI, serta dokumentasi fisik bukti perbaikan.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Supervisi</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cetak PDF F4</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-sm font-bold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* KPI Mini-Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Supervisi
              </span>
              <ClipboardCheck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Kegiatan supervisi terfilter
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Selesai Ditindaklanjuti
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {stats.selesai}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Bukti fisik telah diperbaiki
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Dalam Proses (Pending)
              </span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 mt-1">
              {stats.dalamProses}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              Menunggu respon/perbaikan unit
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                % Penyelesaian
              </span>
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">
              {stats.percentSelesai}%
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              Tingkat kepatuhan resolusi
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari temuan, ruangan, kegiatan, rekomendasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Ruangan */}
            <div className="lg:col-span-3">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Status (Selesai & Proses)</option>
                <option value="Selesai">Hanya Selesai (Closed)</option>
                <option value="Dalam Proses">Hanya Dalam Proses (Open)</option>
              </select>
            </div>
          </div>

          {/* Toggle Options Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={onlyWithFindings}
                  onChange={(e) => setOnlyWithFindings(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Hanya Tampilkan Yang Memiliki Temuan & Foto Dokumentasi</span>
              </label>
            </div>

            <div className="text-slate-500 dark:text-slate-400">
              Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filteredRecords.length}</span> dari{" "}
              {records.length} total data kegiatan
            </div>
          </div>
        </div>

        {/* Main Accreditation Table */}
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="px-3.5 py-3.5 text-center w-12">No</th>
                  <th className="px-3.5 py-3.5 w-32">Tanggal & Waktu</th>
                  <th className="px-3.5 py-3.5 w-44">Kegiatan Supervisi</th>
                  <th className="px-3.5 py-3.5 w-32">Ruangan</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Temuan Lapangan</th>
                  <th className="px-3 py-3.5 text-center w-28">Foto Temuan (Before)</th>
                  <th className="px-4 py-3.5 min-w-[190px]">Rekomendasi PPI</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Tindak Lanjut & Perbaikan</th>
                  <th className="px-3 py-3.5 text-center w-28">Foto Perbaikan (After)</th>
                  <th className="px-3.5 py-3.5 text-center w-28">Status</th>
                  <th className="px-3.5 py-3.5 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
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
                      <p className="text-xs text-slate-500 mt-1">
                        Coba sesuaikan kata kunci pencarian atau ubah filter ruangan/bulan di atas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const dateFormatted = item.tanggal_waktu
                      ? format(new Date(item.tanggal_waktu), "dd MMM yyyy, HH:mm", {
                          locale: idLocale,
                        })
                      : "-";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors"
                      >
                        {/* No */}
                        <td className="px-3.5 py-3.5 text-center font-bold text-slate-500 dark:text-slate-400 align-top">
                          {idx + 1}
                        </td>

                        {/* Tanggal & Waktu */}
                        <td className="px-3.5 py-3.5 align-top">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {dateFormatted.split(",")[0]}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                            {dateFormatted.split(",")[1]}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title={`Observer: ${item.observer}`}>
                            Obs: {item.observer}
                          </span>
                        </td>

                        {/* Kegiatan / Indikator */}
                        <td className="px-3.5 py-3.5 align-top">
                          <span className="font-bold text-slate-900 dark:text-white block leading-snug">
                            {item.nama_kegiatan}
                          </span>
                          <span className="inline-block mt-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {item.indikator_id.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Ruangan */}
                        <td className="px-3.5 py-3.5 align-top">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {item.unit}
                          </span>
                        </td>

                        {/* Temuan */}
                        <td className="px-4 py-3.5 align-top">
                          {item.temuan ? (
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                              {item.temuan}
                            </p>
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              Tidak ada temuan khusus (Sesuai SOP)
                            </span>
                          )}
                        </td>

                        {/* Foto Temuan (Before) */}
                        <td className="px-3 py-3.5 text-center align-top">
                          {item.foto_temuan.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxImage({
                                    url: item.foto_temuan[0],
                                    title: `Foto Temuan (Before) - ${item.unit}`,
                                    subtitle: item.temuan,
                                    type: "before",
                                    compareUrl: item.foto_perbaikan[0],
                                  })
                                }
                                className="relative group w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-300 dark:border-amber-600 shadow-sm hover:scale-105 transition-transform"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.foto_temuan[0]}
                                  alt="Temuan Before"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Eye className="w-4 h-4 text-white opacity-80 group-hover:opacity-100" />
                                </div>
                              </button>
                              {item.foto_temuan.length > 1 && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  +{item.foto_temuan.length - 1} foto
                                </span>
                              )}
                              <span className="text-[9px] uppercase font-bold text-slate-400">
                                Before
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic block">
                              Tidak ada foto
                            </span>
                          )}
                        </td>

                        {/* Rekomendasi PPI */}
                        <td className="px-4 py-3.5 align-top">
                          {item.rekomendasi ? (
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                              {item.rekomendasi}
                            </p>
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              Pertahankan kepatuhan
                            </span>
                          )}
                        </td>

                        {/* Tindak Lanjut & Upaya Perbaikan */}
                        <td className="px-4 py-3.5 align-top">
                          {item.upaya_perbaikan ? (
                            <div>
                              <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium whitespace-pre-wrap">
                                {item.upaya_perbaikan}
                              </p>
                              {item.waktu_perbaikan && (
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mt-1">
                                  Realisasi:{" "}
                                  {format(new Date(item.waktu_perbaikan), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs italic flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              Menunggu tindak lanjut
                            </span>
                          )}
                        </td>

                        {/* Foto Perbaikan (After) */}
                        <td className="px-3 py-3.5 text-center align-top">
                          {item.foto_perbaikan.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setLightboxImage({
                                    url: item.foto_perbaikan[0],
                                    title: `Foto Bukti Perbaikan (After) - ${item.unit}`,
                                    subtitle: item.upaya_perbaikan,
                                    type: "after",
                                    compareUrl: item.foto_temuan[0],
                                  })
                                }
                                className="relative group w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-400 dark:border-emerald-500 shadow-sm hover:scale-105 transition-transform"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.foto_perbaikan[0]}
                                  alt="Perbaikan After"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Eye className="w-4 h-4 text-white opacity-80 group-hover:opacity-100" />
                                </div>
                              </button>
                              {item.foto_perbaikan.length > 1 && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  +{item.foto_perbaikan.length - 1} foto
                                </span>
                              )}
                              <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                                After
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic block">
                              Belum ada bukti foto
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3.5 py-3.5 text-center align-top">
                          {item.status === "Selesai" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3 shrink-0" />
                              Dalam Proses
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-3.5 py-3.5 text-center align-top">
                          <div className="flex flex-col gap-1.5 items-center">
                            <button
                              type="button"
                              onClick={() => handleOpenFollowUp(item)}
                              className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                              title="Update Tindak Lanjut & Upload Foto Perbaikan"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Tindak Lanjut</span>
                            </button>

                            {item.form_path && (
                              <Link
                                href={item.form_path}
                                className="w-full inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="Buka form audit awal"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Form Awal</span>
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
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
        </div>

        {/* MODAL 1: UPDATE TINDAK LANJUT & BUKTI FOTO PERBAIKAN */}
        <AnimatePresence>
          {editingRecord && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => !isSubmittingFollowUp && setEditingRecord(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 overflow-hidden my-auto max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Update Tindak Lanjut & Foto Perbaikan
                      </h3>
                      <p className="text-xs text-slate-500">
                        {editingRecord.nama_kegiatan} • {editingRecord.unit}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingRecord(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  {/* Summary Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Temuan Lapangan Awal (Before)
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {editingRecord.temuan || "Tidak ada rincian temuan khusus."}
                      </p>
                    </div>

                    {editingRecord.rekomendasi && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Rekomendasi PPI
                        </span>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                          {editingRecord.rekomendasi}
                        </p>
                      </div>
                    )}

                    {editingRecord.foto_temuan.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Dokumentasi Foto Before ({editingRecord.foto_temuan.length})
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {editingRecord.foto_temuan.map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={img}
                              alt="Before"
                              className="w-14 h-14 rounded-lg object-cover border border-amber-300 dark:border-amber-600 shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Status Penyelesaian
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStatusInput("Selesai")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                          statusInput === "Selesai"
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
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
                            ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Dalam Proses (Open)</span>
                      </button>
                    </div>
                  </div>

                  {/* Uraian Tindak Lanjut Text */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Rencana & Upaya Tindak Lanjut Perbaikan
                    </label>
                    <textarea
                      rows={3}
                      value={tindakLanjutText}
                      onChange={(e) => setTindakLanjutText(e.target.value)}
                      placeholder="Jelaskan tindakan korektif fisik/perilaku yang telah atau sedang dilakukan oleh unit ruangan..."
                      className="w-full p-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Tanggal Penyelesaian */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Tanggal Realisasi Perbaikan
                    </label>
                    <input
                      type="date"
                      value={waktuPerbaikanInput}
                      onChange={(e) => setWaktuPerbaikanInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Upload Foto Bukti Perbaikan (After) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Bukti Foto Fisik Perbaikan (After)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-2">
                      {perbaikanPhotos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative group w-full aspect-square rounded-xl overflow-hidden border-2 border-emerald-400 dark:border-emerald-600"
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
                      <label className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 cursor-pointer bg-slate-50 dark:bg-slate-900/40 text-slate-500 hover:text-emerald-600 transition-colors">
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
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    disabled={isSubmittingFollowUp}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFollowUp}
                    disabled={isSubmittingFollowUp}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
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

        {/* MODAL 2: TAMBAH SUPERVISI LAPANGAN BARU (AD-HOC RONDE IPCN) */}
        <AnimatePresence>
          {isNewModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => !isSubmittingNew && setIsNewModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 overflow-hidden my-auto max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Tambah Bukti Supervisi Lapangan Baru
                      </h3>
                      <p className="text-xs text-slate-500">
                        Catat hasil ronde keliling, supervisi insidental, atau temuan lapangan baru
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNewModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal & Waktu Supervisi
                      </label>
                      <input
                        type="datetime-local"
                        value={newTanggal}
                        onChange={(e) => setNewTanggal(e.target.value)}
                        className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Ruangan / Unit Kerja
                      </label>
                      <select
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      >
                        {UNITS_LIST.filter((u) => u !== "Semua Ruangan").map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Jenis Kegiatan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kegiatan / Supervisi
                    </label>
                    <select
                      value={newKegiatan}
                      onChange={(e) => setNewKegiatan(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Supervisi Ronde Lapangan IPCN">Supervisi Ronde Lapangan IPCN</option>
                      <option value="Supervisi Pengelolaan Limbah Medis">Supervisi Pengelolaan Limbah Medis</option>
                      <option value="Supervisi Kepatuhan Hand Hygiene & APD">Supervisi Kepatuhan Hand Hygiene & APD</option>
                      <option value="Supervisi Pengendalian Lingkungan">Supervisi Sanitasi & Pengendalian Lingkungan</option>
                      <option value="Supervisi Penatalaksanaan Linen">Supervisi Penatalaksanaan Linen & Laundry</option>
                      <option value="Supervisi Dekontaminasi & Sterilisasi">Supervisi Dekontaminasi & Sterilisasi Alat</option>
                      <option value="Supervisi Fasilitas & Sarana PPI">Supervisi Kesiapan Fasilitas & Sarana PPI</option>
                      <option value="Kustom">Lainnya (Ketik Manual)...</option>
                    </select>

                    {newKegiatan === "Kustom" && (
                      <input
                        type="text"
                        placeholder="Ketikkan nama kegiatan supervisi kustom..."
                        value={newKegiatanCustom}
                        onChange={(e) => setNewKegiatanCustom(e.target.value)}
                        className="w-full mt-2 p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Nama Observer / IPCN
                    </label>
                    <input
                      type="text"
                      value={newObserver}
                      onChange={(e) => setNewObserver(e.target.value)}
                      placeholder="Nama auditor / IPCN..."
                      className="w-full p-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  {/* Temuan */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Uraian Temuan Lapangan (Masalah) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={newTemuan}
                      onChange={(e) => setNewTemuan(e.target.value)}
                      placeholder="Uraikan temuan ketidaksesuaian SOP atau masalah yang ditemukan saat supervisi..."
                      className="w-full p-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  {/* Foto Temuan Before */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Foto Dokumentasi Temuan (Before)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-1.5">
                      {newTemuanPhotos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative group w-full aspect-square rounded-xl overflow-hidden border-2 border-amber-400"
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

                      <label className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-500 cursor-pointer bg-slate-50 dark:bg-slate-900/40 text-slate-500 hover:text-amber-600 transition-colors">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Rekomendasi PPI untuk Unit Kerja
                    </label>
                    <textarea
                      rows={2}
                      value={newRekomendasi}
                      onChange={(e) => setNewRekomendasi(e.target.value)}
                      placeholder="Saran dan arahan perbaikan yang harus dipenuhi oleh unit ruangan..."
                      className="w-full p-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  {/* Status Awal */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Status Supervisi Saat Ini
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewStatus("Dalam Proses")}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          newStatus === "Dalam Proses"
                            ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
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
                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Langsung Selesai (Closed)</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Tindak Lanjut jika langsung selesai */}
                  {newStatus === "Selesai" && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">
                          Tindak Lanjut Perbaikan yang Telah Dilakukan
                        </label>
                        <textarea
                          rows={2}
                          value={newTindakLanjut}
                          onChange={(e) => setNewTindakLanjut(e.target.value)}
                          placeholder="Jelaskan tindakan langsung yang telah dilakukan..."
                          className="w-full p-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">
                          Foto Bukti Perbaikan (After)
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {newPerbaikanPhotos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              className="relative group w-full aspect-square rounded-xl overflow-hidden border-2 border-emerald-500"
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

                          <label className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 cursor-pointer bg-white dark:bg-slate-900/60 text-emerald-600 transition-colors">
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
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    disabled={isSubmittingNew}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewSupervisi}
                    disabled={isSubmittingNew}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
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

        {/* MODAL 3: LIGHTBOX IMAGE VIEWER WITH BEFORE-AFTER COMPARISON */}
        <AnimatePresence>
          {lightboxImage && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-black uppercase ${
                          lightboxImage.type === "before"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {lightboxImage.type === "before" ? "Temuan (Before)" : "Perbaikan (After)"}
                      </span>
                      {lightboxImage.title}
                    </h4>
                    {lightboxImage.subtitle && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {lightboxImage.subtitle}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Body Image */}
                <div className="flex-1 overflow-auto flex items-center justify-center py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightboxImage.url}
                    alt="Preview"
                    className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
                  />
                </div>

                {/* Compare Button if the counter-part image exists */}
                {lightboxImage.compareUrl && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Tersedia foto perbandingan pasangan
                    </span>
                    <button
                      onClick={() =>
                        setLightboxImage((prev) =>
                          prev
                            ? {
                                url: prev.compareUrl!,
                                title:
                                  prev.type === "before"
                                    ? `Foto Bukti Perbaikan (After)`
                                    : `Foto Temuan (Before)`,
                                subtitle: prev.subtitle,
                                type: prev.type === "before" ? "after" : "before",
                                compareUrl: prev.url,
                              }
                            : null
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
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

        {/* MODAL 4: CETAK LEMBAR RESMI F4 (STANDAR AKREDITASI) */}
        <AnimatePresence>
          {isPrintModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-5xl bg-white text-black rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col"
              >
                {/* Print Modal Bar */}
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-sm">
                        Pratinjau Lembar Bukti Supervisi PPI (Standar F4 Akreditasi)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {filteredRecords.length} data kegiatan supervisi tercantum
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Lembar Resmi</span>
                    </button>
                    <button
                      onClick={() => setIsPrintModalOpen(false)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Document Sheet */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 print:bg-white print:p-0">
                  <div
                    id="printable-supervisi-sheet"
                    className="max-w-[215mm] mx-auto bg-white p-8 sm:p-10 shadow-lg print:shadow-none print:p-4 text-black font-sans"
                    style={{ minHeight: "297mm" }}
                  >
                    {/* Kop Surat Resmi UOBK RSUD AL-MULK KOTA SUKABUMI */}
                    <div className="border-b-[2.5px] border-black pb-2 mb-1">
                      <div className="flex items-center justify-center gap-4 max-w-3xl mx-auto">
                        <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                          {hospitalLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={hospitalLogoUrl}
                              alt="Logo RS"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <ShieldCheck className="w-10 h-10 text-black" />
                          )}
                        </div>
                        <div className="text-center">
                          <h1 className="text-[11pt] font-black uppercase tracking-wide leading-tight text-black">
                            TIM PENCEGAHAN DAN PENGENDALIAN INFEKSI (PPI)
                          </h1>
                          <h2 className="text-[11pt] font-black uppercase tracking-wider leading-tight text-black mt-0.5">
                            UOBK RSUD AL-MULK KOTA SUKABUMI
                          </h2>
                          <p className="text-[8pt] text-black italic mt-0.5 leading-tight">
                            Jl. Pelabuhan II No. Km.6, Lembursitu, Kec. Lembursitu, Kota Sukabumi, Jawa Barat 43168
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border-b border-black mb-4" />

                    {/* Judul Dokumen */}
                    <div className="text-center mb-5">
                      <h2 className="text-[13pt] font-black uppercase text-black underline tracking-tight">
                        REKAPITULASI BUKTI SUPERVISI & TINDAK LANJUT PPI
                      </h2>
                      <p className="text-[9.5pt] font-bold text-slate-800 mt-1">
                        STANDAR AKREDITASI RUMAH SAKIT (KARS / STARKES)
                      </p>
                      <div className="flex items-center justify-center gap-4 text-[8.5pt] text-slate-600 mt-1">
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

                    {/* Print Table */}
                    <table className="w-full text-left border-collapse border border-black text-[8pt] mb-6">
                      <thead>
                        <tr className="bg-slate-100 border-b border-black text-black font-extrabold text-center">
                          <th className="border border-black px-1.5 py-2 w-8">No</th>
                          <th className="border border-black px-2 py-2 w-24">Tanggal</th>
                          <th className="border border-black px-2 py-2 w-32">Kegiatan Supervisi</th>
                          <th className="border border-black px-2 py-2 w-20">Ruangan</th>
                          <th className="border border-black px-2.5 py-2">Temuan Lapangan</th>
                          <th className="border border-black px-1.5 py-2 w-20">Foto Before</th>
                          <th className="border border-black px-2.5 py-2">Rekomendasi PPI</th>
                          <th className="border border-black px-2.5 py-2">Tindak Lanjut</th>
                          <th className="border border-black px-1.5 py-2 w-20">Foto After</th>
                          <th className="border border-black px-1.5 py-2 w-16">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((rec, rIdx) => (
                          <tr key={rec.id} className="border-b border-black align-top">
                            <td className="border border-black px-1.5 py-2 text-center font-bold">
                              {rIdx + 1}
                            </td>
                            <td className="border border-black px-2 py-2">
                              {rec.tanggal_waktu
                                ? format(new Date(rec.tanggal_waktu), "dd/MM/yyyy HH:mm")
                                : "-"}
                            </td>
                            <td className="border border-black px-2 py-2 font-bold">
                              {rec.nama_kegiatan}
                            </td>
                            <td className="border border-black px-2 py-2 font-bold">
                              {rec.unit}
                            </td>
                            <td className="border border-black px-2 py-2 whitespace-pre-wrap">
                              {rec.temuan || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center">
                              {rec.foto_temuan.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={rec.foto_temuan[0]}
                                  alt="Before"
                                  className="w-14 h-14 object-cover mx-auto rounded border border-black"
                                />
                              ) : (
                                <span className="text-[7pt] text-slate-400 italic">-</span>
                              )}
                            </td>
                            <td className="border border-black px-2 py-2 whitespace-pre-wrap">
                              {rec.rekomendasi || "-"}
                            </td>
                            <td className="border border-black px-2 py-2 whitespace-pre-wrap">
                              {rec.upaya_perbaikan || "-"}
                              {rec.waktu_perbaikan && (
                                <div className="text-[7pt] text-slate-500 mt-1">
                                  Tgl: {format(new Date(rec.waktu_perbaikan), "dd/MM/yyyy")}
                                </div>
                              )}
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center">
                              {rec.foto_perbaikan.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={rec.foto_perbaikan[0]}
                                  alt="After"
                                  className="w-14 h-14 object-cover mx-auto rounded border border-black"
                                />
                              ) : (
                                <span className="text-[7pt] text-slate-400 italic">-</span>
                              )}
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center font-bold">
                              <span
                                className={
                                  rec.status === "Selesai"
                                    ? "text-emerald-800"
                                    : "text-amber-800"
                                }
                              >
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Lembar Tanda Tangan */}
                    <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-[9pt] text-center break-inside-avoid">
                      <div>
                        <p className="text-slate-700 font-bold mb-16">
                          Mengetahui,<br />
                          <span className="text-black font-black">Ketua Komite PPI</span>
                        </p>
                        <p className="font-black text-black underline text-[9.5pt]">
                          dr. Nurul Iman
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-700 font-bold mb-16">
                          Sukabumi, {format(new Date(), "d MMMM yyyy", { locale: idLocale })}<br />
                          <span className="text-black font-black">Infection Prevention and Control Nurse (IPCN)</span>
                        </p>
                        <p className="font-black text-black underline text-[9.5pt]">
                          Adi Tresa Purnama
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL 5: KONFIRMASI HAPUS */}
        <AnimatePresence>
          {deleteConfirmId && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Data Supervisi?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Data supervisi ini akan dihapus permanen dari sistem rekap dan audit PPI.
                </p>
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(deleteConfirmId)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
