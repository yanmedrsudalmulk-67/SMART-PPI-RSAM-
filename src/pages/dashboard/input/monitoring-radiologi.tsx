import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
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
import { motion, AnimatePresence } from "framer-motion";
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
const checklistGroups = [
  {
    category: "I. KONTROL LINGKUNGAN",
    section: "A. Lingkungan umum",
    items: [
      {
        id: "rad_i_a_1",
        label:
          "Permukaan lingkungan termasuk troli, meja, rak, perlengkapan, hiasan, dan tumbuhan bebas dari debu, kotoran, dll",
      },
      {
        id: "rad_i_a_2",
        label: "Kipas angin, AC, dan langit – langit bersih dan bebas jamur",
      },
      {
        id: "rad_i_a_3",
        label: "Langit – langit bersih dari noda",
      },
      {
        id: "rad_i_a_4",
        label:
          "Benda yang sesuai disimpan di bawah wastapel ( termasuk cairan pembersih, cairan kimia, dalam wadah tertutup )",
      },
      {
        id: "rad_i_a_5",
        label:
          "Petugas tahu jadwal rutin disinfeksi permukaan lingkungan dengan disinfektan yang disetujui rumah sakit",
      },
    ],
  },
  {
    category: "I. KONTROL LINGKUNGAN",
    section: "B. Fasilitas kebersihan tangan",
    items: [
      {
        id: "rad_i_b_1",
        label: "Tersedia fasilitas yang memadai untuk kebersihan tangan",
      },
      {
        id: "rad_i_b_2",
        label: "Tempat mencuci tangan tidak digunakan untuk memcuci alat",
      },
      {
        id: "rad_i_b_3",
        label:
          "Poster yang menganjurkan kebersihan tangan tersedia dan tersedia di area petugas",
      },
      {
        id: "rad_i_b_4",
        label:
          "Tersedia hand rub, botol berfungsi baik, ada tanggal saat botol dibuka dan tanggal expired",
      },
      {
        id: "rad_i_b_5",
        label:
          "Cek kemampuan melakukan kebersihan tangan pada petugas kesehatan ( termasuk dokter )",
      },
    ],
  },
  {
    category: "II. MANAJEMEN LIMBAH",
    section: "A. Tindakan umum",
    items: [
      {
        id: "rad_ii_a_1",
        label: "Petugas harus tahu prosedur pemisahan limbah",
      },
      {
        id: "rad_ii_a_2",
        label: "Limbah klinis umum dibuang di dalam kantung plastik",
      },
      {
        id: "rad_ii_a_3",
        label:
          "Limbah klinis yang tercampur darah, terkena darah, atau berisi darah segar dibuang dalam kantung biohazard",
      },
      {
        id: "rad_ii_a_4",
        label:
          "Tempat sampah termasuk tutup dan pedal, pedal kaki bekerja dengan baik",
      },
      {
        id: "rad_ii_a_5",
        label: "Tidak ada kantung dengan isi berlebih",
      },
      {
        id: "rad_ii_a_6",
        label: "Tersedia spill kit untuk tumpahan darah",
      },
    ],
  },
  {
    category: "III. PRAKTIK KONTROL INSPEKSI",
    section: "A. Kebersihan tangan",
    items: [
      {
        id: "rad_iii_a_1",
        label: "Petugas harus berkuku pendek, bersih, dan tidak diwarnai",
      },
      {
        id: "rad_iii_a_2",
        label: "Petugas melakukan kebersihan tangan sesuai indikasi",
      },
      {
        id: "rad_iii_a_3",
        label:
          "Petugas tidak menangani barang umum ( seperti gagang pintu dan telepon )",
      },
    ],
  },
  {
    category: "III. PRAKTIK KONTROL INSPEKSI",
    section: "B. Alat pelindung diri",
    items: [
      {
        id: "rad_iii_b_1",
        label:
          "Sarung tangan digunakan saat ada risiko kontak langsung dengan zat biohazard",
      },
      {
        id: "rad_iii_b_2",
        label:
          "Gown berlengan panjang dipakai pada saat ada resiko terciprat cairan tubuh atau saat petugas menderita dermatitis",
      },
      {
        id: "rad_iii_b_3",
        label:
          "Masker perlindungan mata digunakan saat ada resiko zat biohazard terciprat ke wajah dan mata",
      },
      {
        id: "rad_iii_b_4",
        label:
          "Respirator N95 yang cocok, digunakan saat ada resiko penularan patogen airbone",
      },
      {
        id: "rad_iii_b_5",
        label:
          "Pengecekan ukuran respirator N95 secara cepat dilakukan sebelum pemakaian ( fit test )",
      },
      {
        id: "rad_iii_b_6",
        label: "APD dilepas di area kerja saat digunakan",
      },
    ],
  },
  {
    category: "III. PRAKTIK KONTROL INSPEKSI",
    section: "C. Umum",
    items: [
      {
        id: "rad_iii_c_1",
        label:
          "Setiap hari dilakukan disinfektan lead apron / mobile lead screens",
      },
      {
        id: "rad_iii_c_2",
        label: "lead apron / mobile lead screens bersih ( secara visual )",
      },
      {
        id: "rad_iii_c_3",
        label:
          "Barang yang telah digunakan terhadap pasien ( contoh : mesin mamogram ) disinfeksi mengunakan disinfektan, setiap berganti pasien",
      },
      {
        id: "rad_iii_c_4",
        label: "Makanan tidak dibawa ke ruangan X – ray atau di simpan di lemari",
      },
      {
        id: "rad_iii_c_5",
        label: "Tidak ada bukti petugas makan, minum di area kerja",
      },
      {
        id: "rad_iii_c_6",
        label: "Obat – obatan dan alat kontras tidak ada yang kadaluarsa",
      },
    ],
  },
  {
    category: "III. PRAKTIK KONTROL INSPEKSI",
    section:
      "D. Infeksi khusus (termasuk penularan airbone/droplet) : ebola, insfluenza H5N1, MERS-CoV, TB Paru, Difteria, Covid – 19 dll",
    items: [
      {
        id: "rad_iii_d_1",
        label:
          "Tersedia alat radiologi mobile untuk pemeriksaan pasien dengan infeksi khusus yang telah dirawat di ruang isolasi",
      },
      {
        id: "rad_iii_d_2",
        label:
          "Ada alur cara pengambilan foto, ekspertise, dan laporan hasil pemeriksaan radiologi pasien dengan infeksi khusus. Dapat jelas di baca dan dimengerti oleh seluruh petugas",
      },
      {
        id: "rad_iii_d_3",
        label:
          "SPO pemeriksaan pasien infeksi khusus jelas dapat dibaca dan dimengerti oleh petugas",
      },
      {
        id: "rad_iii_d_4",
        label:
          "Tersedia poster profilaksis pasca pajanan, jelas terbaca dan dimengerti oleh seluruh petugas",
      },
      {
        id: "rad_iii_d_5",
        label:
          "Pemeriksaan suhu berkala pada petugas yang melakukan pemeriksaan pada pasien dengan infeksi khusus",
      },
    ],
  },
];
type AuditStatus = "ya" | "tidak" | "na" | null;
type Observer = { id: string; nama: string };
export default function RadiologiInputPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
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
    checklistGroups.forEach((sec) =>
      sec.items.forEach((item) => (initialData[item.id] = null)),
    );
    setWaktu(new Date());
    setData(initialData);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);
        const loadEditData = async () => {
          const { data: ed, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .single();
          if (ed && !error) {
            if (ed.tanggal_waktu) setWaktu(new Date(ed.tanggal_waktu));
            if (ed.observer) setObserver(ed.observer);
            if (ed.unit) setRuangan(ed.unit);

            const indicatorsData = ed.data_indikator || ed.checklist_json || {};
            if (indicatorsData.temuan) setTemuan(indicatorsData.temuan);
            if (indicatorsData.rekomendasi) setRekomendasi(indicatorsData.rekomendasi);
            
            const displayPjName = indicatorsData.nama_pj || indicatorsData.nama_pj_ruangan || ed.nama_pj_ruangan || "";
            if (typeof setPjName === "function") setPjName(displayPjName);

            try {
              setData((prev: any) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((key) => {
                  if (indicatorsData[key] !== undefined) {
                    updated[key] = indicatorsData[key];
                  }
                });
                return updated;
              });
            } catch (err) {}

            

            // Prefill signatures
            setTimeout(() => {
              const t1 = ed.ttd_pj_ruangan || indicatorsData.ttd_pj || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[0]);
              const t2 = ed.ttd_ipcn || indicatorsData.ttd_ipcn || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[1]);
              if (t1 && sigRef.current?.setPjSignature) {
                sigRef.current.setPjSignature(t1);
              }
              if (t2 && sigRef.current?.setSupervisorSignature) {
                sigRef.current.setSupervisorSignature(t2);
              }
            }, 800);

            // Prefill documentation
            if (indicatorsData.dokumentasi) {
              setImages(
                indicatorsData.dokumentasi.map((url: string) => ({
                  url,
                  file: null as any,
                }))
              );
            }
          }
        };
        loadEditData();
      } else {
        setWaktu(new Date());
      }
    } else {
      setWaktu(new Date());
    }
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
        checklist_json: data,
        persentase: stats.persentase,
        status: stats.status,
        temuan,
        rekomendasi,
        ttd_pj,
        ttd_ipcn,
        updated_at: new Date().toISOString(),
      };
      // Save to audit_sessions for global dashboard
      const sessionPayload = {
        indikator_id: "monitoring_radiologi",
        kategori: "Kewaspadaan Isolasi",
        nama_indikator: "MONITORING RADIOLOGI",
        tanggal_waktu: payload.waktu,
        observer: observer,
        unit: ruangan,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.status,
        data_indikator: {
          ...data,
          temuan,
          rekomendasi,
          dokumentasi: uploadedUrls,
          tanda_tangan: [ttd_pj || null, ttd_ipcn || null],
          nama_pj: pjName.trim(),
          nama_pj_ruangan: pjName.trim(),
        },
      };
      let sessionId = editId;

      if (isEditMode && editId) {
        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .update(sessionPayload)
          .eq("id", editId);
        if (sessionError) throw sessionError;

        await supabase.from("audit_details").delete().eq("session_id", editId);
      } else {
        const { data: sessionData, error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([sessionPayload])
          .select("id")
          .single();
        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      }
      // Flatten details
      const detailPayloads: any[] = [];
      checklistGroups.forEach((sec) => {
        sec.items.forEach((item) => {
          if (data[item.id] !== null) {
            detailPayloads.push({
              session_id: sessionId,
              pertanyaan_id: item.id,
              pertanyaan: item.label,
              jawaban: String(data[item.id]),
            });
          }
        });
      });
      await supabase.from("audit_details").insert(detailPayloads);
      // Safe native table insert
      try {
        await supabase
          .from("audit_radiologi_monitoring")
          .insert([payload]);
      } catch (err) {
        console.warn("Failed to insert native table", err);
      }
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
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
        className="mt-8 space-y-8 w-full"
      >
        <div className="bg-white dark:bg-[#111827] shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/5 pb-4">
            1. INFORMASI UMUM
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <div className="space-y-3 sm:col-span-2 lg:col-span-1">
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
        <div className="bg-white/5 p-5 sm:p-6 lg:p-8 rounded-[24px] border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              📋 Indikator Kepatuhan Monitoring Radiologi
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated: Record<string, AuditStatus> = {};
                  checklistGroups.forEach((g) =>
                    g.items.forEach((it) => (updated[it.id] = "ya"))
                  );
                  setData((prev) => ({ ...prev, ...updated }));
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs font-semibold tracking-wide transition-all border border-blue-500/30"
              >
                ✓ Set Semua YA
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated: Record<string, AuditStatus> = {};
                  checklistGroups.forEach((g) =>
                    g.items.forEach((it) => (updated[it.id] = null))
                  );
                  setData((prev) => ({ ...prev, ...updated }));
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 text-xs font-semibold tracking-wide transition-all border border-white/10"
              >
                ↺ Reset
              </button>
            </div>
          </div>
          <div className="space-y-10">
            {checklistGroups.map((group, groupIdx) => {
              const isFirstOfCategory =
                groupIdx === 0 ||
                checklistGroups[groupIdx - 1].category !== group.category;

              return (
                <div key={`${group.category}-${group.section}`} className="space-y-4">
                  {isFirstOfCategory && (
                    <div className="pt-2 pb-1">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        {group.category}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 border-b border-white/10 pb-2.5 px-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400/80" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                      {group.section}
                    </h3>
                  </div>

                  <div className="grid gap-4">
                    {group.items.map((item, idx) => {
                      const selected = data[item.id];
                      let borderLeftColor = "border-l-transparent";
                      if (selected === "ya") {
                        borderLeftColor = "border-l-blue-500";
                      } else if (selected === "tidak") {
                        borderLeftColor = "border-l-red-500";
                      } else if (selected === "na") {
                        borderLeftColor = "border-l-slate-500";
                      }

                      return (
                        <div
                          key={item.id}
                          className={`bg-white/5 p-5 sm:p-6 rounded-[24px] border border-white/5 border-l-4 ${borderLeftColor} transition-colors duration-300 relative overflow-hidden group`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
                            <div className="flex gap-4 items-start">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-white/5 border-white/10 text-slate-400">
                                <span className="text-xs font-black">{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white leading-relaxed mt-1">
                                  {item.label}
                                </h4>
                              </div>
                            </div>
                            <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 w-full sm:w-fit self-end md:self-center shrink-0">
                              {["ya", "tidak", "na"].map((choice) => {
                                let activeClass = "";
                                if (choice === "na") {
                                  activeClass =
                                    "bg-slate-500 text-white shadow-[0_0_15px_rgba(100,116,139,0.3)] transform scale-105";
                                } else if (choice === "ya") {
                                  activeClass =
                                    "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transform scale-105";
                                } else {
                                  activeClass =
                                    "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transform scale-105";
                                }

                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    onClick={() =>
                                      toggleItem(item.id, choice as any)
                                    }
                                    className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
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
RadiologiInputPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};