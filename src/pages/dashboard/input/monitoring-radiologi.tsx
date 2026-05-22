import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import {
  Activity,
  ArrowLeft,
  Save,
  CheckCircle2,
  Settings,
  Trash2,
  X,
  Plus,
  Image as ImageIcon,
  RefreshCw,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { uploadImagesToSupabase } from "@/lib/upload";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { useAppContext } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";

const checklistItems = [
  {
    section: "A. KONTROL LINGKUNGAN",
    items: [
      {
        id: "a1",
        label:
          "Permukaan lingkungan termasuk troli, meja, rak, perlengkapan, hiasan, dan tumbuhan bebas dari debu/kotoran",
      },
      {
        id: "a2",
        label: "Kipas angin, AC, dan langit-langit bersih dan bebas jamur",
      },
      { id: "a3", label: "Langit-langit bersih dari noda" },
      {
        id: "a4",
        label: "Benda sesuai disimpan di bawah wastafel dalam wadah tertutup",
      },
      {
        id: "a5",
        label:
          "Petugas mengetahui jadwal rutin disinfeksi lingkungan dengan disinfektan RS",
      },
      { id: "a6", label: "Tersedia fasilitas memadai untuk kebersihan tangan" },
      { id: "a7", label: "Tempat cuci tangan tidak digunakan mencuci alat" },
      { id: "a8", label: "Poster kebersihan tangan tersedia di area petugas" },
      {
        id: "a9",
        label: "Tersedia handrub, botol baik, ada tanggal buka & expired",
      },
      { id: "a10", label: "Cek kemampuan petugas melakukan kebersihan tangan" },
    ],
  },
  {
    section: "B. MANAJEMEN LIMBAH",
    items: [
      { id: "b1", label: "Petugas tahu prosedur pemisahan limbah" },
      { id: "b2", label: "Limbah klinis umum dibuang di kantung plastik" },
      { id: "b3", label: "Limbah berdarah dibuang di kantung biohazard" },
      { id: "b4", label: "Tempat sampah, tutup, pedal kaki berfungsi baik" },
      { id: "b5", label: "Tidak ada kantung berlebih isi" },
      { id: "b6", label: "Tersedia spill kit tumpahan darah" },
    ],
  },
  {
    section: "C. PRAKTIK KONTROL INFEKSI",
    items: [
      { id: "c1", label: "Petugas berkuku pendek, bersih, tidak diwarnai" },
      {
        id: "c2",
        label: "Petugas melakukan kebersihan tangan sesuai indikasi",
      },
      { id: "c3", label: "Tidak menangani barang umum setelah kontak pasien" },
      {
        id: "c4",
        label: "Sarung tangan digunakan bila risiko kontak biohazard",
      },
      { id: "c5", label: "Gown berlengan panjang digunakan bila perlu" },
      { id: "c6", label: "Masker/pelindung mata bila risiko percikan" },
      { id: "c7", label: "Respirator N95 digunakan bila risiko airborne" },
      { id: "c8", label: "Fit test N95 dilakukan sebelum penggunaan" },
      { id: "c9", label: "APD dilepas di area kerja sesuai prosedur" },
      {
        id: "c10",
        label: "Disinfeksi lead apron/mobile lead screen setiap hari",
      },
      { id: "c11", label: "Lead apron/mobile lead screen bersih visual" },
      {
        id: "c12",
        label: "Alat pasien (mamogram dll) didisinfeksi tiap ganti pasien",
      },
      { id: "c13", label: "Makanan tidak dibawa ke ruang X-Ray" },
      { id: "c14", label: "Tidak ada bukti makan/minum di area kerja" },
      { id: "c15", label: "Obat dan alat kontras tidak kadaluarsa" },
      {
        id: "c16",
        label: "Tersedia alat radiologi mobile untuk pasien isolasi",
      },
      {
        id: "c17",
        label: "Ada alur pengambilan foto & laporan pasien infeksi khusus",
      },
      {
        id: "c18",
        label: "SPO pemeriksaan pasien infeksi khusus tersedia jelas",
      },
      { id: "c19", label: "Poster profilaksis pasca pajanan tersedia jelas" },
      { id: "c20", label: "Pemeriksaan suhu berkala petugas dilakukan" },
    ],
  },
];

type AuditStatus = "ya" | "tidak" | "na" | null;
type Observer = { id: string; nama: string };

export default function RadiologiInputPage() {
  const router = useRouter();
  const { userRole } = useAppContext();

  const [waktu, setWaktu] = useState<Date | null>(null);
  const [ruangan, setRuangan] = useState("Radiologi");
  const [observer, setObserver] = useState("");
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [pjName, setPjName] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);
  const [observers, setObservers] = useState<Observer[]>([]);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [newObserverName, setNewObserverName] = useState("");
  const [editObserverId, setEditObserverId] = useState<string | null>(null);
  const sigRef = useRef<DigitalSignatureRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchObservers();
    const initialData: Record<string, AuditStatus> = {};
    checklistItems.forEach((sec) =>
      sec.items.forEach((item) => (initialData[item.id] = null)),
    );
    setWaktu(new Date());
    setData(initialData);
  }, []);

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase
        .from("master_observers")
        .select("*")
        .order("nama");
      if (error) throw error;
      if (data && data.length > 0) {
        setObservers(data);
      } else {
        setObservers([{ id: "1", nama: "IPCN_Adi Tresa Purnama" }]);
      }
    } catch (err) {
      setObservers([{ id: "1", nama: "IPCN_Adi Tresa Purnama" }]);
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
    if (!confirm("Hapus observer ini?")) return;
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

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.values(data).forEach((val) => {
      if (val === "ya") {
        patuh++;
        dinilai++;
      } else if (val === "tidak") {
        dinilai++;
      }
    });
    const persentase = dinilai > 0 ? Math.round((patuh / dinilai) * 100) : 0;
    let status = "Belum Dinilai";
    if (dinilai > 0)
      status =
        persentase >= 85
          ? "Baik"
          : persentase >= 70
            ? "Cukup"
            : "Perlu Tindak Lanjut";
    return { patuh, dinilai, persentase, status };
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) {
      alert("Harap pilih Supervisor!");
      return;
    }
    if (Object.values(data).some((v) => v === null)) {
      alert("Harap lengkapi semua checklist!");
      return;
    }

    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const uploadedUrls = await uploadImagesToSupabase(
        supabase,
        images,
        "dokumentasi",
        "audit",
      );

      const payload = {
        waktu: waktu?.toISOString() || new Date().toISOString(),
        ruangan,
        supervisor: observer,
        checklist_json: data,
        persentase: stats.persentase,
        status: stats.status,
        temuan,
        rekomendasi,
        dokumentasi: uploadedUrls,
        nama_pj: pjName.trim(),
        ttd_pj,
        ttd_ipcn,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("audit_radiologi_monitoring")
        .insert([payload]);
      if (error) throw error;

      // Save to audit_sessions for global dashboard
      const sessionPayload = {
        indikator_id: "monitoring_radiologi",
        nama_indikator: "MONITORING RADIOLOGI",
        tanggal_waktu: payload.waktu,
        observer: observer,
        unit: ruangan,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        temuan,
        rekomendasi,
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        dokumentasi: uploadedUrls,
        data_indikator: data,
      };

      const { data: sessionData, error: sessionError } = await supabase
        .from("audit_sessions")
        .insert([sessionPayload])
        .select("*")
        .single();
      if (sessionError) throw sessionError;

      // Flatten details
      const detailPayloads: any[] = [];
      checklistItems.forEach((sec) => {
        sec.items.forEach((item) => {
          if (data[item.id] !== null) {
            detailPayloads.push({
              session_id: sessionData.id,
              pertanyaan_id: item.id,
              pertanyaan: item.label,
              jawaban: String(data[item.id]),
            });
          }
        });
      });
      await supabase.from("audit_details").insert(detailPayloads);

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

  return (
    <div className="max-w-7xl mx-auto pb-40">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Audit Radiologi berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-6 py-6 border-b border-slate-200 dark:border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white dark:bg-white/5 shadow-sm rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-400 uppercase">
            Audit Radiologi
          </h1>
          <p className="text-[11px] lg:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-blue-400 mt-1">
            Monitoring Pencegahan dan Pengendalian Infeksi Area Radiologi
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid xl:grid-cols-12 gap-8 items-start"
      >
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white dark:bg-[#111827] shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/5 pb-4">
              1. INFORMASI UMUM
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Waktu Audit
                </label>
                <input
                  type="datetime-local"
                  value={
                    waktu
                      ? new Date(
                          waktu.getTime() - waktu.getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => setWaktu(new Date(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-blue-500/50 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Ruangan
                </label>
                <select
                  value={ruangan}
                  onChange={(e) => setRuangan(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none"
                >
                  <option value="Radiologi" className="dark:bg-slate-900">
                    Radiologi
                  </option>
                </select>
              </div>
              <div className="space-y-3 sm:col-span-2 md:col-span-1">
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
          </div>

          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              📋 Indikator Kepatuhan
            </h2>
            <div className="space-y-8">
              {checklistItems.map((section) => (
                <div key={section.section} className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/80 mb-4 px-2">
                    {section.section}
                  </h2>
                  <div className="grid gap-4">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/5 p-6 rounded-[24px] border border-white/5 group hover:border-blue-500/30 transition-all duration-300"
                      >
                        <h3 className="text-sm font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                          {item.label}
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {["ya", "tidak", "na"].map((choice) => (
                            <button
                              type="button"
                              key={choice}
                              onClick={() => toggleItem(item.id, choice as any)}
                              className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                data[item.id] === choice
                                  ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                  : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
                              }`}
                            >
                              {choice === "na" ? "N/A" : choice}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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

          <div className="bg-white/5 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
            <DocumentationUploader images={images} setImages={setImages} />
          </div>

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
            <span>Simpan Data Audit</span>
          </button>
        </div>
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

RadiologiInputPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
