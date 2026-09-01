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
  RefreshCw,
  Upload,
  Sparkles,
  Coffee,
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
import { UpayaPerbaikanSection } from "@/components/UpayaPerbaikanSection";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
const checklistItems = [
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_1",
    label: "Tersedianya ventilasi mekanikal yang cukup",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_2",
    label: "Sistem ventilasi dipelihara dan dibersihkan",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_3",
    label:
      "Permukaan lingkungan meliputi troli, meja dan peralatan terbebas dari cipratan, tanah, substansi tubuh, debu, dan tumpahan",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_4",
    label: "Kipas angin / Exhaust Fan bersih dan bebas debu",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_5",
    label: "Langit-langit / papan langit-langit bebas noda",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_6",
    label:
      "Cairan pembersih atau bahan kimia tersimpan dalam wadah tertutup di bawah bak cuci",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_7",
    label: "Lantai bersih dan kering",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Lingkungan Umum",
    id: "gizi_a_1_8",
    label:
      "Pengecekan kontrol hama dilakukan regular (cek record), tersedia insect killer / pest control",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan",
    id: "gizi_a_2_1",
    label: "Tersedia fasilitas memadai untuk kebersihan tangan",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan",
    id: "gizi_a_2_2",
    label: "Bak cuci tangan bebas dari alat bekas pakai dan benda tidak sesuai",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan",
    id: "gizi_a_2_3",
    label: "Poster dekontaminasi tangan diletakkan di area mudah terlihat staf",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan",
    id: "gizi_a_2_4",
    label: "Tersedia sabun cuci tangan",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Fasilitas Kebersihan Tangan",
    id: "gizi_a_2_5",
    label: "Cek kemampuan melakukan kebersihan tangan pada petugas",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Peralatan",
    id: "gizi_a_3_1",
    label: "Papan pemotong dalam kondisi baik",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Peralatan",
    id: "gizi_a_3_2",
    label:
      "Kontainer/perkakas bersih, tidak rusak, tidak berkarat, tidak terkelupas",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Peralatan",
    id: "gizi_a_3_3",
    label: "Semua peralatan disimpan dalam kondisi baik",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Peralatan",
    id: "gizi_a_3_4",
    label: "Jika ada kerusakan dilakukan pelaporan ke penanggung jawab dapur",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Peralatan",
    id: "gizi_a_3_5",
    label: "Membersihkan troli makanan / meja setiap selesai penyajian",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Peralatan",
    id: "gizi_a_3_6",
    label: "Temperatur mesin cuci piring diatur suhu 50–85°C",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_1",
    label:
      "Daging mentah, ikan, sayuran mentah tidak kontak dengan makanan siap saji",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_2",
    label:
      "Pisahkan dan tempatkan makanan dalam wadah tertutup di refrigerator",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_3",
    label: "Makanan beku disimpan suhu di bawah -12°C",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_4",
    label: "Makanan tetap dingin dan segar pada suhu 0–4°C",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_5",
    label: "Makanan dicairkan pada suhu 0–4°C",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_6",
    label:
      "Ada bukti pencatatan suhu harian dan tindakan bila standar tidak terpenuhi",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_7",
    label: "Perlindungan makanan yang disimpan dari kontaminasi",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Penyimpanan Makanan",
    id: "gizi_a_4_8",
    label: "Pendingin dan freezer bersih dan bebas bau tidak sedap",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Perpindahan Makanan",
    id: "gizi_a_5_1",
    label: "Perpindahan makanan dilakukan bersih dan tertutup baik",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Perpindahan Makanan",
    id: "gizi_a_5_2",
    label: "Gunakan wadah yang tepat (tidak retak, terkelupas, kotor)",
  },
  {
    group: "A. PENGENDALIAN LINGKUNGAN - Perpindahan Makanan",
    id: "gizi_a_5_3",
    label: "Staf memakai pakaian bersih dan alat bantu sesuai",
  },
  {
    group: "B. PENANGANAN LIMBAH",
    id: "gizi_b_1_1",
    label: "Perpindahan limbah makanan dilakukan bersih dan tertutup",
  },
  {
    group: "B. PENANGANAN LIMBAH",
    id: "gizi_b_1_2",
    label: "Sisa makanan tertutup dalam wadah untuk dibuang",
  },
  {
    group: "B. PENANGANAN LIMBAH",
    id: "gizi_b_1_3",
    label: "Wadah limbah berkualitas baik, memiliki tutup, dibersihkan berkala",
  },
  {
    group: "B. PENANGANAN LIMBAH",
    id: "gizi_b_1_4",
    label: "Area penyimpanan limbah dirancang baik dan dijaga kebersihannya",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_1",
    label:
      "Pemeriksaan harian staf untuk memastikan staf sakit tidak menangani makanan",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_2",
    label:
      "Semua pengolah makanan mendapat pelatihan kebersihan pribadi dan dapur berkala",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_3",
    label: "Tidak memakai perhiasan, arloji dan cat kuku saat memasak",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_4",
    label: "Staf melakukan cuci tangan sebelum mengolah makanan",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_5",
    label: "Gunakan sarung tangan saat mempersiapkan makanan",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_6",
    label: "Staf cuci tangan setelah membuka sarung tangan",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_7",
    label: "Personil divaksinasi setiap 3 tahun sesuai aturan",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_8",
    label:
      "Personil dengan sakit kuning, diare, penyakit kulit, dll tidak menangani makanan dan dilaporkan ke supervisor",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_9",
    label:
      "Pengolah makanan memakai pelindung, penutup kepala, alas kaki saat tugas catering",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_10",
    label:
      "Pakaian personil dijaga bersih dan diganti setiap hari / bila perlu",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_11",
    label: "Luka terbuka ditutup waterproof dressing",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_12",
    label:
      "Saat menyiapkan makanan, tangan tidak menyentuh rambut/wajah/hidung/mulut",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_13",
    label: "Staf tidak merokok saat menangani makanan / di area makanan",
  },
  {
    group: "C. PRAKTIK PENGENDALIAN INFEKSI - Personal / Staf",
    id: "gizi_c_1_14",
    label:
      "Pengunjung area makanan memakai penutup kepala dan mematuhi kebersihan",
  },
];
type AuditStatus = "ya" | "tidak" | "na" | null;
type Observer = { id: string; nama: string };
export default function MonitoringGiziPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [ruangan, setRuangan] = useState("Gizi");
  const [observer, setObserver] = useState("");
  const [data, setData] = useState<Record<string, AuditStatus>>({});
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
  const sigRef = useRef<DigitalSignatureRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  useEffect(() => {
    fetchObservers();
    const initialData: Record<string, AuditStatus> = {};
    checklistItems.forEach((item) => (initialData[item.id] = null));
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
            if (ed.tanggal_waktu) setStartTime(new Date(ed.tanggal_waktu));
            if (ed.observer) setObserver(ed.observer);
            if (ed.unit) setRuangan(ed.unit);

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

            const displayPjName = indicatorsData.nama_pj || indicatorsData.nama_pj_ruangan || ed.nama_pj_ruangan || ed.nama_pj || ed.auditee || "";
            setPjName(displayPjName);

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
              const t1 = ed.ttd_pj_ruangan || ed.ttd_pj || ed.tanda_tangan_1 || indicatorsData.ttd_pj_ruangan || indicatorsData.ttd_pj || indicatorsData.tanda_tangan_pj || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[0]) || (ed.tanda_tangan && ed.tanda_tangan[0]);
              const t2 = ed.ttd_ipcn || ed.tanda_tangan_2 || indicatorsData.ttd_ipcn || indicatorsData.tanda_tangan_ipcn || indicatorsData.tanda_tangan_spv || (indicatorsData.tanda_tangan && indicatorsData.tanda_tangan[1]) || (ed.tanda_tangan && ed.tanda_tangan[1]);
              if (t1 && sigRef.current?.setPjSignature) {
                sigRef.current.setPjSignature(t1);
              }
              if (t2 && sigRef.current?.setSupervisorSignature) {
                sigRef.current.setSupervisorSignature(t2);
              }
            }, 800);

            // Prefill documentation
            const docs = indicatorsData.dokumentasi || ed.dokumentasi || ed.foto || indicatorsData.foto;
            if (docs) {
              const docArr = Array.isArray(docs) ? docs : [docs];
              setImages(
                docArr.map((url: any) => (typeof url === 'string' ? { url, file: null as any } : url))
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
      if (data) setObservers(data);
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
  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;
    Object.entries(data).forEach(([, val]) => {
      if (val === "ya" || val === "tidak") {
        dinilai++;
        if (val === "ya") {
          patuh++;
        }
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
      alert("Harap isi semua checklist!");
      return;
    }
    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature() || null;
      const ttd_ipcn = sigRef.current?.getSupervisorSignature() || null;
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
      const payload: any = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        checklist_json: data,
        persentase: stats.persentase,
        status: stats.status,
        temuan,
        rekomendasi,
        upaya_perbaikan: upayaPerbaikan,
        foto_perbaikan: uploadedPerbaikanUrls,
        ttd_pj,
        ttd_pj_ruangan: ttd_pj,
        tanda_tangan_1: ttd_pj,
        ttd_ipcn,
        tanda_tangan_2: ttd_ipcn,
        tanda_tangan: [ttd_pj, ttd_ipcn],
        nama_pj: pjName.trim(),
        nama_pj_ruangan: pjName.trim(),
      };
      const sessionPayload: any = {
        indikator_id: "monitoring_gizi",
        kategori: "Kewaspadaan Isolasi",
        nama_indikator: "MONITORING GIZI",
        tanggal_waktu: payload.waktu,
        observer,
        unit: ruangan,
        nama_pj: pjName.trim(),
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        temuan,
        rekomendasi,
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
          nama_pj: pjName.trim(),
          nama_pj_ruangan: pjName.trim(),
          ttd_pj,
          ttd_pj_ruangan: ttd_pj,
          tanda_tangan_1: ttd_pj,
          tanda_tangan_pj: ttd_pj,
          ttd_ipcn,
          tanda_tangan_2: ttd_ipcn,
          tanda_tangan_ipcn: ttd_ipcn,
          tanda_tangan: [ttd_pj, ttd_ipcn],
          dokumentasi: uploadedUrls,
        },
      };
      let sessionId = editId;

      if (isEditMode && editId) {
        // Update existing session
        const { error: sessionError } = await supabase
          .from("audit_sessions")
          .update(sessionPayload)
          .eq("id", editId);
        if (sessionError) throw sessionError;

        // Clean up detail entries for update
        await supabase.from("audit_details").delete().eq("session_id", editId);
      } else {
        // Insert new session
        const { data: sessionData, error: sessionError } = await supabase
          .from("audit_sessions")
          .insert([sessionPayload])
          .select("id")
          .single();
        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      }

      const detailPayloads = Object.keys(data).map((key) => ({
        session_id: sessionId,
        pertanyaan_id: key,
        pertanyaan: checklistItems.find((i) => i.id === key)?.label || key,
        jawaban: String(data[key]),
      }));
      await supabase.from("audit_details").insert(detailPayloads);

      // Safe native table insert
      try {
        if (isEditMode && editId) {
          await supabase.from("audit_gizi").update([
            {
              ...payload,
              updated_at: new Date().toISOString(),
            }
          ]).eq("id", editId);
        } else {
          await supabase.from("audit_gizi").insert([
            {
              ...payload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.warn("Failed to insert/update native table", err);
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
  const groupedChecklist = checklistItems.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof checklistItems>,
  );
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Data Audit Gizi berhasil disimpan
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
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-400 uppercase">
            Input Audit Gizi
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-blue-400 mt-1">
            Audit kepatuhan Pencegahan dan Pengendalian Infeksi area Gizi
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-8 w-full"
      >
        <div className="bg-white dark:bg-[#111827] shadow-sm p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-white/5 pb-4 mb-6">
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
                <option value="Gizi" className="dark:bg-slate-900">
                  Gizi
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
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            📋 Indikator Kepatuhan
          </h2>
          <div className="space-y-6">
            {checklistItems.map((item, idx) => {
              const selected = data[item.id];
              const prevItem = idx > 0 ? checklistItems[idx - 1] : null;
              const isNewGroup = !prevItem || prevItem.group !== item.group;

              let borderLeftColor = "border-l-transparent bg-white/5";
              if (selected === "na") {
                borderLeftColor = "border-l-slate-500 bg-slate-500/5";
              } else if (selected === "ya") {
                borderLeftColor = "border-l-blue-500 bg-blue-500/5";
              } else if (selected === "tidak") {
                borderLeftColor = "border-l-red-500 bg-red-500/5";
              }
              return (
                <div key={item.id} className="space-y-4">
                  {isNewGroup && (
                    <div className="flex items-center gap-3 border-b border-white/10 pb-2.5 px-1 pt-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-blue-400">
                        {item.group}
                      </h3>
                    </div>
                  )}
                  <div
                    className={`p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-white/5 border-l-4 ${borderLeftColor} transition-colors duration-300 relative overflow-hidden group`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-white/5 border-white/10 text-slate-400 font-black text-xs">
                          {idx + 1}
                        </div>
                        <h4 className="text-sm font-bold text-white leading-relaxed pt-1">
                          {item.label}
                        </h4>
                      </div>
                      <div className="flex p-1.5 bg-slate-900/80 rounded-2xl border border-white/10 w-full sm:w-fit self-end md:self-center shrink-0">
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
                              onClick={() => toggleItem(item.id, choice as any)}
                              className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
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
MonitoringGiziPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};