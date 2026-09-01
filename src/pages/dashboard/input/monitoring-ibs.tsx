import { useState, useEffect, useMemo, useRef, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  Activity,
  ArrowLeft,
  Save,
  CheckCircle2,
  Settings,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase, broadcastChannelMessage } from "@/lib/supabase";
import { uploadImagesToSupabase } from "@/lib/upload";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { UpayaPerbaikanSection } from "@/components/UpayaPerbaikanSection";
import { useAppContext } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
import { genericAuditConfigs } from "@/lib/audit-configs";
const checklistItems = genericAuditConfigs.monitoring_ibs?.items || [];
const tableName =
  genericAuditConfigs.monitoring_ibs?.tableName || "audit_ruangan_ibs";
type AuditStatus = "ya" | "tidak" | "na" | null;
type Observer = { id: string; nama: string };
export default function MonitoringIBSPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { userRole } = useAppContext();
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState("");
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [pjName, setPjName] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);
  const [upayaPerbaikan, setUpayaPerbaikan] = useState("");
  const [waktuPerbaikan, setWaktuPerbaikan] = useState("");
  const [perbaikanImages, setPerbaikanImages] = useState<DocImage[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState("");
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  const sigRef = useRef<DigitalSignatureRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  useEffect(() => {
    fetchObservers();
    const initialData: Record<string, AuditStatus> = {};
    const initialNotes: Record<string, string> = {};
    checklistItems.forEach((item) => {
      initialData[item.id] = null;
      initialNotes[item.id] = "";
    });
    
    setData(initialData);
    setNotes(initialNotes);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && (mode === "edit" || params.get("edit") === "true")) {
        setIsEditMode(true);
        setEditId(id);
        const loadEditData = async () => {
          let ed: any = null;
          const { data: sessionData } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (sessionData) {
            ed = sessionData;
          } else {
            const { data: nativeData } = await supabase
              .from(tableName || "audit_ruangan_ibs")
              .select("*")
              .eq("id", id)
              .maybeSingle();
            if (nativeData) ed = nativeData;
          }

          if (ed) {
            if (ed.tanggal_waktu || ed.waktu) setStartTime(new Date(ed.tanggal_waktu || ed.waktu));
            if (ed.observer || ed.supervisor) setObserver(ed.observer || ed.supervisor);

            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            const valTemuan = ed.temuan || indicatorsData.temuan || ed.temuan_lapangan || indicatorsData.temuan_lapangan || ed.catatan || indicatorsData.catatan || "";
            if (valTemuan) setTemuan(valTemuan);

            const valRekomendasi = ed.rekomendasi || indicatorsData.rekomendasi || ed.saran || indicatorsData.saran || "";
            if (valRekomendasi) setRekomendasi(valRekomendasi);
            
            const upaya = indicatorsData.upaya_perbaikan || indicatorsData.upayaPerbaikan || ed.upaya_perbaikan || "";
            if (upaya) setUpayaPerbaikan(upaya);

            const waktuPerb = indicatorsData.waktu_perbaikan || indicatorsData.tanggal_perbaikan || ed.waktu_perbaikan || ed.tanggal_perbaikan || "";
            if (waktuPerb) setWaktuPerbaikan(waktuPerb);

            const perbaikanDocs = indicatorsData.foto_perbaikan || indicatorsData.dokumentasi_perbaikan || ed.foto_perbaikan;
            if (perbaikanDocs) {
              const pArr = Array.isArray(perbaikanDocs) ? perbaikanDocs : [perbaikanDocs];
              setPerbaikanImages(
                pArr.map((url: any) => (typeof url === 'string' ? { url, file: null as any } : url))
              );
            }

            const displayPjName = indicatorsData.nama_pj || indicatorsData.nama_pj_ruangan || ed.nama_pj_ruangan || ed.nama_pj || "";
            if (typeof setPjName === "function") setPjName(displayPjName);

            try {
              const parsedData: Record<string, AuditStatus> = {};
              const parsedNotes: Record<string, string> = {};

              checklistItems.forEach((item) => {
                const candidates = [
                  item.id,
                  item.key,
                  String(item.id),
                  Number(item.id)
                ];
                for (const c of candidates) {
                  if (c !== undefined && indicatorsData[c] !== undefined) {
                    const val = indicatorsData[c];
                    if (typeof val === "string" && ["ya", "tidak", "na"].includes(val.toLowerCase())) {
                      parsedData[item.id] = val.toLowerCase() as AuditStatus;
                    } else if (typeof val === "boolean") {
                      parsedData[item.id] = val ? "ya" : "tidak";
                    } else if (val && typeof val === "object") {
                      if (val.status) parsedData[item.id] = val.status.toLowerCase() as AuditStatus;
                      if (val.keterangan) parsedNotes[item.id] = val.keterangan;
                    }
                    break;
                  }
                }
              });

              setData((prev: any) => ({ ...prev, ...parsedData }));
              setNotes((prev: any) => ({ ...prev, ...parsedNotes }));
            } catch (err) {}

            if (indicatorsData.notes_json) {
              setNotes((prev) => ({ ...prev, ...indicatorsData.notes_json }));
            }

            // Prefill signatures
            setTimeout(() => {
              const t1 = ed.ttd_pj_ruangan || ed.ttd_pj || indicatorsData.ttd_pj || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[0]);
              const t2 = ed.ttd_ipcn || indicatorsData.ttd_ipcn || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[1]);
              if (t1 && sigRef.current?.setPjSignature) {
                sigRef.current.setPjSignature(t1);
              }
              if (t2 && sigRef.current?.setSupervisorSignature) {
                sigRef.current.setSupervisorSignature(t2);
              }
            }, 800);

            // Prefill documentation
            const docs = ed.foto || indicatorsData.dokumentasi;
            if (docs) {
              const docArr = Array.isArray(docs) ? docs : [docs];
              setImages(
                docArr.map((url: string) => ({
                  url,
                  file: null as any,
                }))
              );
            }
          }
        };
        loadEditData();
      } else {
        setStartTime(new Date());
      }
    } else {
      setStartTime(new Date());
    }
  }, []);
  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase
        .from("master_observers")
        .select("*")
        .order("nama");
      if ((globalThis as any).error) throw new Error();
      if (data) {
        setObservers(data);
      }
    } catch (err) {
      const fallback = { id: "1", nama: "IPCN_Adi Tresa Purnama" };
      setObservers([fallback]);
    }
  };
  const saveObserver = async () => {
    if (!newObserverName.trim()) return;
    try {
      if (editObserverId) {
        if (!editObserverId.startsWith("local-")) {
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
    if (!confirm("Hapus supervisor ini?")) return;
    try {
      if (!id.startsWith("local-"))
        await supabase.from("master_observers").delete().eq("id", id);
      setObservers((prev) => prev.filter((o) => o.id !== id));
      if (observer === observers.find((o) => o.id === id)?.nama)
        setObserver("");
    } catch (err) {
      console.error(err);
    }
  };
  const toggleItem = (id: string, stat: AuditStatus) => {
    setData((prev) => ({ ...prev, [id]: stat }));
  };
  const handleNoteChange = (id: string, val: string) => {
    setNotes((prev) => ({ ...prev, [id]: val }));
  };
  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    checklistItems.forEach((item) => {
      const val = data[item.id];
      if (!val || val === "na") return;
      dinilai++;
      const isNeg = Boolean(item.isNegative || item.id === 'e_debu' || item.key === 'e_debu');
      if (isNeg) {
        if (val === "tidak") patuh++;
      } else {
        if (val === "ya") patuh++;
      }
    });
    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let status = "Belum Dinilai";
    if (dinilai > 0) {
      status =
        persentase >= 85
          ? "Baik"
          : persentase >= 70
            ? "Cukup"
            : "Perlu Tindak Lanjut";
    }
    return { patuh, dinilai, persentase, status };
  }, [data]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) {
      alert("Harap pilih Supervisor!");
      return;
    }
    if (Object.values(data).some((v) => v === null)) {
      alert("Harap isi semua checklist!");
      return;
    }
    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const uploadedUrls = await uploadImagesToSupabase(
        supabase,
        images,
        "logos",
        "audit",
      );
      const uploadedPerbaikanUrls = perbaikanImages.length > 0 ? await uploadImagesToSupabase(
        supabase,
        perbaikanImages,
        "logos",
        "audit/perbaikan",
      ) : [];
      const payloadIndikator: Record<string, any> = {};
      Object.keys(data).forEach((key) => {
        payloadIndikator[key] = {
          status: data[key],
          keterangan: notes[key] || "",
        };
      });
      const recordId = isEditMode && editId ? editId : crypto.randomUUID();
      const sessionPayloadStats = {
        id: recordId,
        indikator_id: "monitoring_ibs",
        kategori: "Kewaspadaan Isolasi",
        nama_indikator: "MONITORING IBS",
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer: observer,
        unit: "Instalasi Bedah Sentral",
        nama_pj: pjName,
        nama_pj_ruangan: pjName,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        temuan,
        rekomendasi,
        jenis_tindakan: "Bedah",
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        data_indikator: {
          ...data,
          temuan,
          rekomendasi,
          upaya_perbaikan: upayaPerbaikan,
          waktu_perbaikan: waktuPerbaikan,
          tanggal_perbaikan: waktuPerbaikan,
          foto_perbaikan: uploadedPerbaikanUrls,
          dokumentasi: uploadedUrls,
          tanda_tangan: [ttd_pj || null, ttd_ipcn || null],
          nama_pj: pjName,
          nama_pj_ruangan: pjName,
        }
      };

      if (isEditMode && editId) {
        await supabase.from("audit_sessions").upsert([sessionPayloadStats], { onConflict: "id" });
        await supabase.from("audit_details").delete().eq("session_id", recordId);
      } else {
        const { error: sessionError } = await supabase.from("audit_sessions").insert([sessionPayloadStats]);
        if (sessionError) throw sessionError;
      }

      // insert to audit_details
      const detailPayloads = Object.keys(data).map((key) => ({
        session_id: recordId,
        pertanyaan_id: key,
        pertanyaan: checklistItems.find((i) => i.id === key)?.label || key,
        jawaban: String(data[key] || ""),
      }));
      await supabase.from("audit_details").insert(detailPayloads);

      // Safe native table insert / upsert
      try {
        const sessionPayload = {
          id: recordId,
          waktu: startTime?.toISOString() || new Date().toISOString(),
          checklist_json: payloadIndikator,
          persentase: stats.persentase,
          temuan,
          rekomendasi,
          upaya_perbaikan: upayaPerbaikan,
          waktu_perbaikan: waktuPerbaikan,
          tanggal_perbaikan: waktuPerbaikan,
          ttd_pj,
          ttd_ipcn,
          foto: uploadedUrls,
          foto_perbaikan: uploadedPerbaikanUrls,
          nama_pj_ruangan: pjName,
          created_at: new Date().toISOString(),
        };
        if (isEditMode && editId) {
          await supabase.from(tableName || "audit_ruangan_ibs").upsert([sessionPayload], { onConflict: "id" });
        } else {
          await supabase.from(tableName || "audit_ruangan_ibs").insert([sessionPayload]);
        }
      } catch (err) {
        console.warn("Failed to insert native table", err);
      }

      // Broadcast real-time update
      await broadcastChannelMessage(
        `changes_${tableName}`,
        'audit_submitted',
        { indikator_id: 'monitoring_ibs', tableName, id: recordId }
      );

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Group checklist items by section
  const sections = useMemo(() => {
    const grouped: Record<string, typeof checklistItems> = {};
    checklistItems.forEach((item) => {
      const section = item.section || "General";
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(item);
    });
    return grouped;
  }, []);
  return (
    <div className="max-w-3xl mx-auto pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data audit IBS berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-6 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] uppercase">
            Input Audit Instalasi Bedah Sentral (IBS)
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Audit kepatuhan PPI ruang operasi, personel, lingkungan, limbah,
            ventilasi, suhu dan fasilitas sesuai standar rumah sakit.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-white/5 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-sm">
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
              Waktu Input
            </label>
            <input
              type="datetime-local"
              value={
                startTime
                  ? new Date(
                      startTime.getTime() -
                        startTime.getTimezoneOffset() * 60000,
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) => setStartTime(new Date(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark] transition-colors"
            />
          </div>
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center">
              Supervisor
              <button
                type="button"
                onClick={() => setIsObserverModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1"
              >
                <User className="w-3 h-3" /> Tambah / Kelola
              </button>
            </label>
            <div className="relative">
              <select
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none outline-none focus:border-blue-500/50"
              >
                <option value="">Pilih Supervisor...</option>
                {observers.map((o) => (
                  <option key={o.id} value={o.nama}>
                    {o.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            📋 Indikator Kepatuhan
          </h2>
          <div className="space-y-4">
            {checklistItems.map((item, idx) => {
              const selected = data[item.id];
              const isNegativeQuestion = Boolean(
                item.isNegative || item.id === "e_debu" || item.key === "e_debu"
              );
              let borderLeftColor = "border-l-transparent";
              if (selected === "na") {
                borderLeftColor = "border-l-slate-500";
              } else if (selected) {
                borderLeftColor =
                  selected === "ya"
                    ? isNegativeQuestion
                      ? "border-l-red-500"
                      : "border-l-blue-500"
                    : isNegativeQuestion
                      ? "border-l-blue-500"
                      : "border-l-red-500";
              }
              return (
                <div
                  key={item.id}
                  className={`bg-white/5 p-6 rounded-[24px] border border-white/5 border-l-4 ${borderLeftColor} transition-colors duration-300 relative overflow-hidden group`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-white/5 border-white/10 text-slate-500">
                        <span className="text-xs font-black">{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white mb-2">
                          {item.label}
                        </h3>
                      </div>
                    </div>
                    <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit self-end md:self-center">
                      {["ya", "tidak", "na"].map((choice) => {
                        let activeClass = "";
                        if (choice === "na") {
                          activeClass =
                            "bg-slate-500 text-white shadow-[0_0_15px_rgba(100,116,139,0.3)] transform scale-105";
                        } else if (isNegativeQuestion) {
                          activeClass =
                            choice === "ya"
                              ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105"
                              : "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105";
                        } else {
                          activeClass =
                            choice === "ya"
                              ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105"
                              : "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105";
                        }
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => toggleItem(item.id, choice as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                              data[item.id] === choice
                                ? activeClass
                                : "bg-transparent text-slate-400 hover:bg-white/10"
                            }`}
                          >
                            {choice === "na" ? "N/A" : choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <LiveStatisticsCard
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.status}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              📝 Temuan Audit
            </h2>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan audit..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
            />
          </div>
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              💡 Rekomendasi
            </h2>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan rekomendasi tindak lanjut..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
          <DocumentationUploader images={images} setImages={setImages} />
        </div>
        {isEditMode && (
          <UpayaPerbaikanSection
            upayaPerbaikan={upayaPerbaikan}
            setUpayaPerbaikan={setUpayaPerbaikan}
            perbaikanImages={perbaikanImages}
            setPerbaikanImages={setPerbaikanImages}
            waktuPerbaikan={waktuPerbaikan}
            setWaktuPerbaikan={setWaktuPerbaikan}
          />
        )}
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
            ✍️ TANDA TANGAN DIGITAL
          </h2>
          <DigitalSignatureSection
            ref={sigRef}
            pjName={pjName}
            setPjName={setPjName}
            pjLabel="PJ RUANGAN"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !observer || stats.dinilai === 0}
          className="w-full flex justify-center items-center gap-4 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isEditMode ? 'Update Data Audit' : 'Simpan Data Audit'}</span>
        </button>
      </form>
      <AnimatePresence>
        {isObserverModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsObserverModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] p-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                  Kelola Supervisor
                </h3>
                <button
                  type="button"
                  onClick={() => setIsObserverModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 mb-6 text-white">
                <input
                  type="text"
                  value={newObserverName}
                  onChange={(e) => setNewObserverName(e.target.value)}
                  placeholder="Nama Supervisor..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={saveObserver}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-blue-500"
                >
                  {editObserverId ? "OK" : "+"}
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {observers.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl"
                  >
                    <span className="text-sm font-medium text-slate-300">
                      {o.nama}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewObserverName(o.nama);
                          setEditObserverId(o.id);
                        }}
                        className="p-2 text-slate-500 hover:text-blue-400"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
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
  );
}
MonitoringIBSPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};