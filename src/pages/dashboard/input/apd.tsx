import React, { useState, useEffect, useMemo, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  Building2,
  Stethoscope,
  Activity,
  Settings,
  AlertCircle,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAppContext } from "@/components/Providers";
import { supabase, broadcastChannelMessage } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import { DocImage } from "@/components/DocumentationUploader";

type Observer = { id: string; nama: string };

import { EditableSelect } from "@/components/EditableSelect";

const units = [
  "IGD",
  "ICU",
  "IBS",
  "Rawat Jalan",
  "Ranap Aisyah",
  "Ranap Fatimah",
  "Ranap Khadijah",
  "Ranap Usman",
  "Radiologi",
  "Laboratorium",
  "Pantry",
  "Emergency Kebidanan",
];

const professions = [
  "Dokter Umum",
  "Dokter Spesialis",
  "Perawat",
  "Bidan",
  "Analis Laboratorium",
  "Radiografer",
  "Pramusaji",
];

const listTindakanOptions = [
  "Mengukur TTV",
  "Visite Dokter",
  "Pemasangan Infus",
  "Pemasangan Kateter Urin",
  "Pemberian Obat Injeksi",
  "Menolong Persalinan",
  "Mengambil sampel darah",
  "Pemeriksaan EKG",
  "Perawatan Luka",
  "Hecting luka",
  "Melakukan Aff Infus",
  "Pemberian Oksigenasi",
  "Resusitasi Jantung Paru (RJP)",
  "Pemeriksaan sampling darah",
  "Pemeriksaan Rontgen",
];

const apdItems = [
  { id: "masker", label: "1. Masker", key: "masker" },
  { id: "sarung_tangan", label: "2. Sarung Tangan", key: "sarung_tangan" },
  { id: "penutup_kepala", label: "3. Penutup Kepala", key: "penutup_kepala" },
  { id: "apron", label: "4. Apron", key: "apron" },
  { id: "goggle", label: "5. Kaca Mata / Goggle", key: "goggle" },
  { id: "sepatu_boot", label: "6. Sepatu Boot", key: "sepatu_boot" },
  {
    id: "gaun_pelindung",
    label: "7. Gaun / Baju Pelindung",
    key: "gaun_pelindung",
  },
] as const;

type ApdStatus = "ya" | "tidak" | "na" | null;

export default function InputApdPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [profesi, setProfesi] = useState("");
  const [tindakan, setTindakan] = useState("");
  const [tindakanOption, setTindakanOption] = useState("");
  const [customTindakan, setCustomTindakan] = useState("");

  const handleTindakanOptionChange = (opt: string) => {
    setTindakanOption(opt);
    if (opt === "Lainnya") {
      setTindakan(customTindakan);
    } else {
      setTindakan(opt);
    }
  };

  const handleCustomTindakanChange = (val: string) => {
    setCustomTindakan(val);
    setTindakan(val);
  };

  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState("");
  const [editObserverId, setEditObserverId] = useState<string | null>(null);

  const [apdData, setApdData] = useState<Record<string, ApdStatus>>({
    masker: null,
    sarung_tangan: null,
    penutup_kepala: null,
    apron: null,
    goggle: null,
    sepatu_boot: null,
    gaun_pelindung: null,
  });

  const [upayaPerbaikan, setUpayaPerbaikan] = useState("");
  const [waktuPerbaikan, setWaktuPerbaikan] = useState("");
  const [perbaikanImages, setPerbaikanImages] = useState<DocImage[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchObservers();
    const d = new Date();
    setNow(d);
    const timer = setInterval(() => setNow(new Date()), 60000);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      const paramObserver = params.get("observer") || "";
      const paramUnit = params.get("unit") || "";
      const paramProfesi = params.get("profesi") || "";
      const paramTime = params.get("time") || "";
      const paramTindakan = params.get("tindakan") || "";

      let sessionStored: any = null;
      try {
        const raw = sessionStorage.getItem("smartppi_edit_apd");
        if (raw) sessionStored = JSON.parse(raw);
      } catch (e) {}

      // Prioritas 1: Ambil langsung dari parameter URL atau sessionStorage agar input langsung terisi instan tanpa delay!
      const initObserver = paramObserver || sessionStored?.observer || "";
      const initUnit = paramUnit || sessionStored?.unit || "";
      const initProfesi = paramProfesi || sessionStored?.profesi || "";
      const initTimeStr = paramTime || sessionStored?.tanggal_waktu || sessionStored?.end_time || sessionStored?.start_time || "";
      const initTindakan = paramTindakan || sessionStored?.tindakan || "";

      if (initObserver) setObserver(initObserver);
      if (initUnit) setUnit(initUnit);
      if (initProfesi) setProfesi(initProfesi);

      if (initTimeStr) {
        try {
          const parsed = new Date(initTimeStr);
          if (!isNaN(parsed.getTime())) {
            setStartTime(parsed);
          } else {
            setStartTime(d);
          }
        } catch (_) {
          setStartTime(d);
        }
      } else {
        setStartTime(d);
      }

      if (initTindakan) {
        setTindakan(initTindakan);
        if (listTindakanOptions.includes(initTindakan)) {
          setTindakanOption(initTindakan);
          setCustomTindakan("");
        } else {
          setTindakanOption("Lainnya");
          setCustomTindakan(initTindakan);
        }
      }

      if (sessionStored) {
        const hasApd = sessionStored.masker !== undefined && sessionStored.masker !== null;
        if (hasApd) {
          setApdData({
            masker: sessionStored.masker || null,
            sarung_tangan: sessionStored.sarung_tangan || null,
            penutup_kepala: sessionStored.penutup_kepala || null,
            apron: sessionStored.apron || null,
            goggle: sessionStored.goggle || null,
            sepatu_boot: sessionStored.sepatu_boot || null,
            gaun_pelindung: sessionStored.gaun_pelindung || null,
          });
        }
        if (sessionStored.upaya_perbaikan) setUpayaPerbaikan(sessionStored.upaya_perbaikan);
        if (sessionStored.waktu_perbaikan) setWaktuPerbaikan(sessionStored.waktu_perbaikan);
        if (sessionStored.foto_perbaikan) {
          const pArr = Array.isArray(sessionStored.foto_perbaikan) ? sessionStored.foto_perbaikan : [sessionStored.foto_perbaikan];
          setPerbaikanImages(pArr.map((url: string) => (typeof url === 'string' ? { url } : url)));
        }
      }

      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);
        const loadEditData = async () => {
          try {
            // 1. Ambil data sesi audit
            const { data: sessionData } = await supabase
              .from("audit_sessions")
              .select("*")
              .eq("id", id)
              .maybeSingle();

            // 2. Ambil data spesifik audit_apd jika ada
            const { data: apdDataRes } = await supabase
              .from("audit_apd")
              .select("*")
              .eq("id", id)
              .maybeSingle();

            // 3. Ambil data audit_hand_hygiene jika sesi berasal dari HH
            const { data: hhNative } = await supabase
              .from("audit_hand_hygiene")
              .select("*")
              .eq("id", id)
              .maybeSingle();

            // 4. Cari juga jika ada sesi APD dengan id terhubung
            let apdSessionData: any = null;
            if (sessionData?.indikator_id === "audit_hand_hygiene" || sessionData?.indikator_id === "hand_hygiene") {
              const { data: linkedApdSession } = await supabase
                .from("audit_sessions")
                .select("*")
                .eq("id", `apd-${id}`)
                .maybeSingle();
              apdSessionData = linkedApdSession;
            }

            const rawJson = apdDataRes?.data_indikator || apdSessionData?.data_indikator || sessionData?.data_indikator || sessionData?.checklist_json || {};
            const indicatorsData = typeof rawJson === "string" ? (() => { try { return JSON.parse(rawJson); } catch { return {}; } })() : rawJson;

            // Observer, Unit, Profesi (Otomatis muncul dari Kepatuhan Kebersihan Tangan atau APD)
            const loadedObserver = apdDataRes?.observer || apdSessionData?.observer || sessionData?.observer || hhNative?.observer || "";
            const loadedUnit = apdDataRes?.unit || apdDataRes?.ruangan || apdSessionData?.unit || sessionData?.unit || hhNative?.unit || "";
            const loadedProfesi = apdDataRes?.profesi || apdSessionData?.profesi || sessionData?.profesi || hhNative?.profesi || "";

            if (loadedObserver) setObserver(prev => prev || loadedObserver);
            if (loadedUnit) setUnit(prev => prev || loadedUnit);
            if (loadedProfesi) setProfesi(prev => prev || loadedProfesi);

            // Waktu: otomatis dimunculkan waktu selesai dari Kepatuhan Kebersihan Tangan
            const waktuSelesaiStr = apdDataRes?.tanggal_waktu || apdSessionData?.tanggal_waktu || indicatorsData.waktu_selesai || indicatorsData.end_time || hhNative?.end_time || sessionData?.tanggal_waktu || hhNative?.start_time;
            if (waktuSelesaiStr) {
              try {
                const parsed = new Date(waktuSelesaiStr);
                if (!isNaN(parsed.getTime())) {
                  setStartTime(prev => prev || parsed);
                }
              } catch (_) {}
            }

            // Tindakan: jika sudah pernah diisi, otomatis muncul
            const tindakanVal = apdDataRes?.tindakan || apdDataRes?.jenis_tindakan || apdSessionData?.jenis_tindakan || sessionData?.jenis_tindakan || indicatorsData.tindakan || indicatorsData.jenis_tindakan || "";
            if (tindakanVal) {
              setTindakan(prev => prev || tindakanVal);
              if (listTindakanOptions.includes(tindakanVal)) {
                setTindakanOption(prev => prev || tindakanVal);
              } else {
                setTindakanOption(prev => prev || "Lainnya");
                setCustomTindakan(prev => prev || tindakanVal);
              }
            }

            // APD yang digunakan
            const apdSource = apdDataRes || apdSessionData?.data_indikator || indicatorsData.apd || indicatorsData;
            if (apdSource && (apdSource.masker !== undefined || apdSource.sarung_tangan !== undefined)) {
              setApdData(prev => ({
                masker: apdSource.masker ?? prev.masker,
                sarung_tangan: apdSource.sarung_tangan ?? prev.sarung_tangan,
                penutup_kepala: apdSource.penutup_kepala ?? prev.penutup_kepala,
                apron: apdSource.apron ?? prev.apron,
                goggle: apdSource.goggle ?? prev.goggle,
                sepatu_boot: apdSource.sepatu_boot ?? prev.sepatu_boot,
                gaun_pelindung: apdSource.gaun_pelindung ?? prev.gaun_pelindung,
              }));
            }

            const upaya = indicatorsData.upaya_perbaikan || indicatorsData.upayaPerbaikan || apdDataRes?.upaya_perbaikan || apdSessionData?.data_indikator?.upaya_perbaikan || "";
            if (upaya) setUpayaPerbaikan(prev => prev || upaya);

            const waktuPerb = indicatorsData.waktu_perbaikan || indicatorsData.tanggal_perbaikan || apdDataRes?.waktu_perbaikan || apdSessionData?.data_indikator?.waktu_perbaikan || "";
            if (waktuPerb) setWaktuPerbaikan(prev => prev || waktuPerb);

            const perbaikanDocs = indicatorsData.foto_perbaikan || indicatorsData.dokumentasi_perbaikan || apdDataRes?.foto_perbaikan || apdSessionData?.data_indikator?.foto_perbaikan;
            if (perbaikanDocs) {
              const pArr = Array.isArray(perbaikanDocs) ? perbaikanDocs : [perbaikanDocs];
              setPerbaikanImages(pArr.map((url: string) => (typeof url === 'string' ? { url } : url)));
            }
          } catch (err) {
            console.error("Error loading edit data:", err);
          }
        };
        loadEditData();
      } else {
        setStartTime(d);
      }
    } else {
      setStartTime(d);
    }

    return () => clearInterval(timer);
  }, []);

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase
        .from("master_observers")
        .select("*")
        .order("nama");
      if ((globalThis as any).error) throw new Error();

      let finalData = data || [];
      const hasAdi = finalData.some((s) => s.nama === "IPCN_Adi Tresa Purnama");
      if (!hasAdi) {
        finalData = [
          { id: "adi-static", nama: "IPCN_Adi Tresa Purnama" },
          ...finalData,
        ];
      }
      setObservers(finalData);
    } catch (err) {
      setObservers([{ id: "1", nama: "IPCN_Adi Tresa Purnama" }]);
    }
  };

  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      if (editObserverId) {
        if (
          !editObserverId.startsWith("local-") &&
          editObserverId !== "adi-static"
        ) {
          await supabase
            .from("master_observers")
            .update({ nama: newObserverName })
            .eq("id", editObserverId);
        }
        setObservers((prev) =>
          prev
            .map((o) =>
              o.id === editObserverId ? { ...o, nama: newObserverName } : o,
            )
            .sort((a, b) => a.nama.localeCompare(b.nama)),
        );
      } else {
        const { data, error } = await supabase
          .from("master_observers")
          .insert([{ nama: newObserverName }])
          .select();
        if (!error && data && data.length > 0) {
          setObservers((prev) =>
            [...prev, data[0]].sort((a, b) => a.nama.localeCompare(b.nama)),
          );
        } else {
          setObservers((prev) =>
            [
              ...prev,
              { id: "local-" + Date.now().toString(), nama: newObserverName },
            ].sort((a, b) => a.nama.localeCompare(b.nama)),
          );
        }
      }
      setNewObserverName("");
      setEditObserverId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    alert(`Error: ${err.message || "Terjadi kesalahan sistem"}`);
  };

  const handleActionClick = (id: string, stat: ApdStatus) => {
    setApdData((prev) => ({ ...prev, [id]: stat }));
  };

  
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      // Adjust for local timezeone
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  const formatTimeForInput = (date: Date | null) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split("-").map(Number);
    setStartTime((prev) => {
      const newD = prev ? new Date(prev) : new Date();
      newD.setFullYear(year, month - 1, day);
      return newD;
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [hours, minutes] = e.target.value.split(":").map(Number);
    setStartTime((prev) => {
      const newD = prev ? new Date(prev) : new Date();
      newD.setHours(hours, minutes);
      return newD;
    });
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;

    Object.values(apdData).forEach((val) => {
      if (val === "ya") {
        patuh++;
        dinilai++;
      } else if (val === "tidak") {
        dinilai++;
      }
    });

    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let statusText = "Belum Dinilai";
    if (dinilai > 0) {
      statusText = persentase === 100 ? "Patuh" : "Tidak Patuh";
    }
    return { patuh, dinilai, persentase, statusText };
  }, [apdData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!observer) {
      alert("Silakan pilih observer terlebih dahulu.");
      return;
    }

    const finalTindakan = tindakanOption === "Lainnya" ? customTindakan.trim() : tindakanOption;
    if (!finalTindakan) {
      alert("Silakan pilih atau ketik jenis tindakan terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedPerbaikanUrls: string[] = [];
      for (const img of perbaikanImages) {
        if (typeof img === "string") {
          uploadedPerbaikanUrls.push(img);
        } else if (img.url && !img.url.startsWith("blob:")) {
          uploadedPerbaikanUrls.push(img.url);
        } else if (img.file) {
          const fileExt = img.file.name.split(".").pop();
          const fileName = `perbaikan_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `perbaikan/${fileName}`;
          const { error: uploadErr } = await supabase.storage.from("dokumentasi").upload(filePath, img.file);
          if (!uploadErr) {
            const { data: pUrl } = supabase.storage.from("dokumentasi").getPublicUrl(filePath);
            if (pUrl?.publicUrl) uploadedPerbaikanUrls.push(pUrl.publicUrl);
          }
        }
      }

      const payload = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        profesi,
        tindakan: finalTindakan,
        masker: apdData.masker,
        sarung_tangan: apdData.sarung_tangan,
        penutup_kepala: apdData.penutup_kepala,
        apron: apdData.apron,
        goggle: apdData.goggle,
        sepatu_boot: apdData.sepatu_boot,
        gaun_pelindung: apdData.gaun_pelindung,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
      };

      const sessionPayload = {
        indikator_id: "audit_apd",
        nama_indikator: "AUDIT KEPATUHAN PENGGUNAAN APD",
        tanggal_waktu: payload.tanggal_waktu,
        observer,
        unit,
        profesi,
        jenis_tindakan: finalTindakan,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        data_indikator: {
          masker: apdData.masker,
          sarung_tangan: apdData.sarung_tangan,
          penutup_kepala: apdData.penutup_kepala,
          apron: apdData.apron,
          goggle: apdData.goggle,
          sepatu_boot: apdData.sepatu_boot,
          gaun_pelindung: apdData.gaun_pelindung,
          upaya_perbaikan: upayaPerbaikan,
          waktu_perbaikan: waktuPerbaikan,
          foto_perbaikan: uploadedPerbaikanUrls,
        },
      };

      let createdSessionId = editId;
      if (isEditMode && editId) {
        // Cek apakah sesi ini adalah sesi audit_hand_hygiene
        const { data: existingSession } = await supabase
          .from("audit_sessions")
          .select("id, indikator_id, data_indikator")
          .eq("id", editId)
          .maybeSingle();

        if (existingSession && (existingSession.indikator_id === "audit_hand_hygiene" || existingSession.indikator_id === "hand_hygiene")) {
          // JAGA AGAR DATA KEPATUHAN KEBERSIHAN TANGAN TIDAK HILANG / BERUBAH INDIKATORNYA!
          // Simpan jenis tindakan ke sesi tersebut dan perbarui data_indikator
          const currJson = existingSession.data_indikator || {};
          await supabase
            .from("audit_sessions")
            .update({
              jenis_tindakan: finalTindakan,
              data_indikator: {
                ...currJson,
                tindakan: finalTindakan,
                apd: payload,
              }
            })
            .eq("id", editId);

          // Simpan juga sesi khusus APD di audit_sessions agar indikator APD tercatat
          const apdSessionId = `apd-${editId}`;
          await supabase
            .from("audit_sessions")
            .upsert([{
              ...sessionPayload,
              id: apdSessionId,
              data_indikator: {
                ...sessionPayload.data_indikator,
                hh_id: editId,
              }
            }]);
        } else if (existingSession && (existingSession.indikator_id === "audit_apd" || existingSession.indikator_id === "apd")) {
          await supabase
            .from("audit_sessions")
            .update(sessionPayload)
            .eq("id", editId);
        } else {
          // Jika belum ada di audit_sessions, buat sesi baru
          await supabase
            .from("audit_sessions")
            .upsert([{ ...sessionPayload, id: editId }]);
        }

        // Upsert ke audit_apd dengan id sesi tersebut
        const { data: existingApd } = await supabase
          .from("audit_apd")
          .select("id")
          .eq("id", editId)
          .maybeSingle();

        if (existingApd) {
          await supabase.from("audit_apd").update(payload).eq("id", editId);
        } else {
          await supabase.from("audit_apd").insert([{ ...payload, id: editId }]);
        }
      } else {
        const newSessionId = (typeof crypto !== "undefined" && crypto.randomUUID)
          ? crypto.randomUUID()
          : ("apd-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9));
        createdSessionId = newSessionId;

        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([{ ...sessionPayload, id: newSessionId }]);
        if (sessionError) throw sessionError;

        const nativePayload = { ...payload, id: newSessionId };
        await supabase.from("audit_apd").insert([nativePayload]);
      }

      // Siarkan pembaruan realtime secara eksplisit via REST/httpSend agar tabel laporan langsung sinkron tanpa peringatan deprecation
      try {
        await broadcastChannelMessage('audit_apd_realtime_all', 'audit_submitted', {
          indikator_id: 'audit_apd',
          id: editId || createdSessionId
        });
      } catch (_) {}

      // Bersihkan sessionStorage edit data setelah berhasil disimpan
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('smartppi_edit_apd');
        }
      } catch (_) {}

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const returnUrl = params?.get("returnUrl") || (isEditMode ? "/dashboard/reports" : "/dashboard/input/isolasi");
        router.push(returnUrl);
      }, 1200);
    } catch (err: any) {
      handleError(err);
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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-blue-400/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data Audit APD Berhasil Disimpan & Disinkronkan!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link
          href={typeof window !== 'undefined' && new URLSearchParams(window.location.search).get("returnUrl") || (isEditMode ? "/dashboard/reports" : "/dashboard/input/isolasi")}
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xs min-[360px]:text-sm min-[410px]:text-base sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase whitespace-nowrap">
              Audit Kepatuhan Penggunaan APD
            </h1>
            {isEditMode && (
              <span className="px-3 py-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                Sinkronisasi Kepatuhan Kebersihan Tangan
              </span>
            )}
          </div>
          <p className="text-[8px] min-[360px]:text-[9px] min-[410px]:text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-emerald-600 dark:text-blue-400 mt-1">
            {isEditMode 
              ? "Data Observer, Unit, Profesi, dan Waktu Selesai otomatis tersinkron dari Kepatuhan Kebersihan Tangan. Silakan pilih Tindakan dan APD yang digunakan."
              : "Observasi penggunaan Alat Pelindung Diri petugas"}
          </p>
        </div>
      </div>

      
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[32px] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-400">
              <Clock className="w-5 h-5" /> Waktu Observasi
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative group overflow-hidden bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-inner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">
                Tanggal Audit
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={formatDateForInput(startTime)}
                  onChange={handleDateChange}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <div className="absolute right-0 pointer-events-none bg-blue-500/20 p-2 rounded-xl group-hover:bg-blue-500/40 transition-colors">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="relative group overflow-hidden bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-inner">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 block">
                Waktu Audit
              </label>
              <div className="relative flex items-center">
                <input
                  type="time"
                  value={formatTimeForInput(startTime)}
                  onChange={handleTimeChange}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <div className="absolute right-0 pointer-events-none bg-blue-500/20 p-2 rounded-xl group-hover:bg-blue-500/40 transition-colors">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <EditableSelect
              label="Observer"
              value={observer}
              onChange={setObserver}
              options={[]}
              isIPCN={isIPCN}
              table="master_observers"
              placeholder="Pilih Observer..."
            />
            <EditableSelect
              label="Unit"
              value={unit}
              onChange={setUnit}
              options={units}
              isIPCN={isIPCN}
              storageKey="smartppi_units"
              placeholder="Pilih Unit..."
            />
            <EditableSelect
              label="Profesi"
              value={profesi}
              onChange={setProfesi}
              options={professions}
              isIPCN={isIPCN}
              storageKey="smartppi_professions"
              placeholder="Pilih Profesi..."
            />
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              <FileText className="w-4 h-4 text-amber-400" /> Tindakan
            </h2>
            {tindakanOption === "Lainnya" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Ketik Manual
              </span>
            )}
          </div>

          <div className="space-y-3">
            <select
              value={tindakanOption}
              onChange={(e) => handleTindakanOptionChange(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 focus:border-amber-400/60 rounded-xl px-4 py-3 text-sm text-white outline-none cursor-pointer transition-all"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                -- Pilih Jenis Tindakan --
              </option>
              {listTindakanOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-white">
                  {opt}
                </option>
              ))}
              <option value="Lainnya" className="bg-slate-900 text-amber-400 font-bold">
                Lainnya
              </option>
            </select>

            {tindakanOption === "Lainnya" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-1"
              >
                <input
                  type="text"
                  value={customTindakan}
                  onChange={(e) => handleCustomTindakanChange(e.target.value)}
                  placeholder="Ketik jenis tindakan manual di sini..."
                  autoFocus
                  className="w-full bg-white/5 border border-amber-400/40 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 transition-colors shadow-inner"
                />
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {apdItems.map((apd) => {
            const selected = apdData[apd.id];
            const borderLeftColor =
              selected === "ya"
                ? "border-l-blue-500"
                : selected === "tidak"
                  ? "border-l-red-500"
                  : selected === "na"
                    ? "border-l-slate-500"
                    : "border-l-transparent";
            return (
              <div
                key={apd.id}
                className={`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 ${borderLeftColor} transition-colors duration-300`}
              >
                <h3 className="text-sm font-bold text-white mb-4">
                  {apd.label}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["ya", "tidak", "na"].map((choice) => {
                    let activeClass = "";
                    if (choice === "ya")
                      activeClass =
                        "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]";
                    if (choice === "tidak")
                      activeClass =
                        "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                    if (choice === "na")
                      activeClass =
                        "bg-slate-500 text-white border-slate-400 shadow-[0_0_15px_rgba(100,116,139,0.3)]";
                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => handleActionClick(apd.id, choice as any)}
                        className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          selected === choice
                            ? activeClass
                            : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {choice === "na" ? "N/A" : choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <LiveStatisticsCard
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
          title="KEPATUHAN PENGGUNAAN APD"
        />

        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !observer ||
            !unit ||
            !profesi ||
            !tindakan ||
            stats.dinilai === 0
          }
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isEditMode ? "Update Data Audit" : "Simpan Data Audit"}</span>
        </button>
      </div>
    </div>
  );
}

InputApdPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
