import React, { useState, useEffect, useMemo, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  Calendar,
  CheckCircle2,
  Clock,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAppContext } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";

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

const moments = [
  { id: "m1", label: "Momen 1", desc: "Sebelum kontak dengan pasien" },
  { id: "m2", label: "Momen 2", desc: "Sebelum melakukan tindakan aseptik" },
  { id: "m3", label: "Momen 3", desc: "Sesudah menyentuh cairan tubuh pasien" },
  { id: "m4", label: "Momen 4", desc: "Sesudah kontak dengan pasien" },
  { id: "m5", label: "Momen 5", desc: "Sesudah menyentuh lingkungan pasien" },
] as const;

type Action = "hr" | "hw" | "miss" | "na" | null;

export default function HandHygieneAuditPage() {
  const router = useRouter();
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [profesi, setProfesi] = useState("");

  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState("");
  const [editObserverId, setEditObserverId] = useState<string | null>(null);

  const [momenData, setMomenData] = useState<Record<string, Action>>({
    m1: null,
    m2: null,
    m3: null,
    m4: null,
    m5: null,
  });

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
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);
        const loadEditData = async () => {
          let { data: ed } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (!ed) {
            const { data: nativeEd } = await supabase
              .from("audit_hand_hygiene")
              .select("*")
              .eq("id", id)
              .maybeSingle();
            if (nativeEd) ed = nativeEd;
          }

          if (ed) {
            if (ed.tanggal_waktu || ed.start_time) setStartTime(new Date(ed.tanggal_waktu || ed.start_time));
            if (ed.observer) setObserver(ed.observer);
            if (ed.unit) setUnit(ed.unit);
            if (ed.profesi) setProfesi(ed.profesi);
            
            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            setMomenData({
              m1: indicatorsData.m1 || ed.m1 || null,
              m2: indicatorsData.m2 || ed.m2 || null,
              m3: indicatorsData.m3 || ed.m3 || null,
              m4: indicatorsData.m4 || ed.m4 || null,
              m5: indicatorsData.m5 || ed.m5 || null,
            });
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

  const deleteObserver = async (id: string) => {
    if (id === "adi-static" || !confirm("Hapus observer ini?")) return;
    try {
      if (!id.startsWith("local-")) {
        await supabase.from("master_observers").delete().eq("id", id);
      }
      setObservers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionClick = (momenId: string, action: Action) => {
    setMomenData((prev) => ({ ...prev, [momenId]: action }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let peluang = 0;

    Object.values(momenData).forEach((val) => {
      if (val === "hr" || val === "hw") {
        patuh++;
        peluang++;
      } else if (val === "miss") {
        peluang++;
      }
    });

    const persentase = peluang > 0 ? Math.round((patuh / peluang) * 100) : 0;
    let statusText = "Belum Dinilai";

    if (peluang > 0) {
      if (persentase >= 85) statusText = "Baik";
      else if (persentase >= 70) statusText = "Cukup";
      else statusText = "Perlu Perbaikan";
    }

    return { patuh, peluang, persentase, statusText };
  }, [momenData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!observer) {
      alert("Silakan pilih observer terlebih dahulu.");
      return;
    }

    const end = endTime || new Date();
    setEndTime(end);
    setIsSubmitting(true);

    try {
      const payload = {
        observer,
        unit,
        profesi,
        m1: momenData.m1,
        m2: momenData.m2,
        m3: momenData.m3,
        m4: momenData.m4,
        m5: momenData.m5,
        patuh: stats.patuh,
        peluang: stats.peluang,
        persentase: stats.persentase,
        start_time: startTime?.toISOString() || new Date().toISOString(),
        end_time: end.toISOString(),
      };

      const sessionPayload = {
        indikator_id: "audit_hand_hygiene",
        nama_indikator: "AUDIT KEBERSIHAN TANGAN",
        tanggal_waktu: payload.start_time,
        observer,
        unit,
        profesi,
        jenis_tindakan: "Kebersihan Tangan Observation",
        jumlah_dinilai: stats.peluang,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        data_indikator: {
          m1: payload.m1,
          m2: payload.m2,
          m3: payload.m3,
          m4: payload.m4,
          m5: payload.m5,
        },
      };

      let createdSessionId = editId;
      if (isEditMode && editId) {
        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .update(sessionPayload)
          .eq("id", editId);
        if (sessionError) throw sessionError;
      } else {
        const { data: sessionData, error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([sessionPayload])
          .select("*")
          .single();
        if (sessionError) throw sessionError;
        if (sessionData && sessionData.id) {
          createdSessionId = sessionData.id;
        }
      }

      try {
        if (isEditMode && editId) {
          await supabase.from("audit_hand_hygiene").update([payload]).eq("id", editId);
        } else {
          const nativePayload = createdSessionId ? { ...payload, id: createdSessionId } : payload;
          await supabase.from("audit_hand_hygiene").insert([nativePayload]);
        }
      } catch (err) {
        console.warn("Failed to insert native hand hygiene table", err);
      }

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  const formatTimeForInput = (date: Date | null) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");
      return `${hours}:${mins}`;
    } catch (e) {
      return "";
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split("-").map(Number);
    if (!year) return;

    if (startTime) {
      const newD = new Date(startTime);
      newD.setFullYear(year, month - 1, day);
      setStartTime(newD);
    }
    if (endTime) {
      const newD = new Date(endTime);
      newD.setFullYear(year, month - 1, day);
      setEndTime(newD);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, mins] = e.target.value.split(":").map(Number);
    if (startTime) {
      const newD = new Date(startTime);
      newD.setHours(hours, mins);
      setStartTime(newD);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, mins] = e.target.value.split(":").map(Number);
    const newD = endTime
      ? new Date(endTime)
      : startTime
        ? new Date(startTime)
        : new Date();
    newD.setHours(hours, mins);
    setEndTime(newD);
  };

  const getDuration = () => {
    if (!startTime) return "0 Menit";
    const end = endTime || now || new Date();
    const diff = Math.floor((end.getTime() - startTime.getTime()) / 60000);
    return `${diff} Menit`;
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
            Data Audit Tersimpan!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-base min-[360px]:text-lg min-[410px]:text-xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase whitespace-nowrap">
            Audit Kebersihan Tangan
          </h1>
          <p className="text-[8px] min-[360px]:text-[10px] sm:text-xs font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-emerald-600 dark:text-blue-400 mt-1 whitespace-nowrap">
            Kepatuhan 5 Momen dan 6 Langkah Cuci Tangan
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-[32px] border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-400">
                  <Clock className="w-5 h-5" /> Waktu Observasi
                </h2>
                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />{" "}
                    Durasi: {getDuration()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                    Jam Mulai
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="time"
                      value={formatTimeForInput(startTime)}
                      onChange={handleStartTimeChange}
                      className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <div className="absolute right-0 pointer-events-none bg-blue-500/20 p-2 rounded-xl group-hover:bg-blue-500/40 transition-colors">
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden bg-white/5 p-6 rounded-[24px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-inner border-l-4 border-l-blue-500/30">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-4 block flex items-center justify-between">
                    Jam Selesai
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="time"
                      value={formatTimeForInput(endTime || now || new Date())}
                      onChange={handleEndTimeChange}
                      className="w-full bg-transparent text-xl font-bold text-white outline-none cursor-pointer [appearance:none] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <div className="absolute right-0 pointer-events-none bg-blue-500/20 p-2 rounded-xl group-hover:bg-blue-500/40 transition-colors ring-2 ring-blue-500/20">
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-[24px] border border-white/5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <EditableSelect
                  label="Supervisor"
                  value={observer}
                  onChange={setObserver}
                  options={[]}
                  isIPCN={isIPCN}
                  table="master_observers"
                  placeholder="Pilih Supervisor..."
                />
                <EditableSelect
                  label="Ruangan / Unit"
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

            <div className="space-y-4">
              {moments.map((m) => {
                const selectedOpt = momenData[m.id];
                const activeColorLine =
                  selectedOpt === "hr" || selectedOpt === "hw"
                    ? "border-l-blue-500 bg-blue-500/5"
                    : selectedOpt === "miss"
                      ? "border-l-red-500 bg-red-500/5"
                      : selectedOpt === "na"
                        ? "border-l-slate-400 bg-slate-500/5"
                        : "border-l-transparent";

                return (
                  <div
                    key={m.id}
                    className={`bg-white/5 backdrop-blur-sm p-6 rounded-[24px] border border-white/5 relative overflow-hidden transition-all duration-300 border-l-4 ${activeColorLine}`}
                  >
                    <div className="mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full mb-2 inline-block">
                        {m.label}
                      </span>
                      <p className="text-sm font-bold text-white">{m.desc}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        {
                          id: "hr",
                          label: "Handrub",
                          activeClass:
                            "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20",
                        },
                        {
                          id: "hw",
                          label: "Handwash",
                          activeClass:
                            "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20",
                        },
                        {
                          id: "miss",
                          label: "Tidak HH",
                          activeClass:
                            "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20",
                        },
                        {
                          id: "na",
                          label: "N/A",
                          activeClass:
                            "bg-slate-500 text-white border-slate-400 shadow-lg shadow-slate-500/20",
                        },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => handleActionClick(m.id, btn.id as any)}
                          className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            momenData[m.id] === btn.id
                              ? btn.activeClass
                              : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-slate-300"
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <LiveStatisticsCard
            totalDinilai={stats.peluang}
            totalPatuh={stats.patuh}
            totalTidakPatuh={stats.peluang - stats.patuh}
            persentase={stats.persentase}
            statusText={stats.statusText}
          />

          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !observer ||
              !unit ||
              !profesi ||
              stats.peluang === 0
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

        <AnimatePresence>
          {isObserverModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div
                onClick={() => setIsObserverModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" /> Kelola Observer
                  </h3>
                  <button
                    onClick={() => setIsObserverModalOpen(false)}
                    className="p-2 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newObserverName}
                    onChange={(e) => setNewObserverName(e.target.value)}
                    placeholder="Nama Observer..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
                  />
                  <button
                    onClick={saveObserver}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    {editObserverId ? "Update" : "Tambah"}
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 text-white">
                  {observers.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                    >
                      <span className="text-sm text-slate-300">{o.nama}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setNewObserverName(o.nama);
                            setEditObserverId(o.id);
                          }}
                          className="p-2 text-slate-500 hover:text-blue-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteObserver(o.id)}
                          className="p-2 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

HandHygieneAuditPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
