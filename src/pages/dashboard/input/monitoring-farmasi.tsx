import { useState, useEffect, useMemo, useRef, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Activity,
  RefreshCw,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
import { EditableSelect } from "@/components/EditableSelect";
import { useAppContext } from "@/components/Providers";
import { uploadImagesToSupabase } from "@/lib/upload";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { UpayaPerbaikanSection } from "@/components/UpayaPerbaikanSection";
const checklistGroups = [
  {
    title: "A. Lingkungan Umum",
    items: [
      {
        id: "lu_1",
        label: "Fasilitas yang memadai, kebersihan tangan tersedia dan memadai",
      },
      {
        id: "lu_2",
        label: "Kipas angin / AC bersih dan bebas dari debu",
      },
      {
        id: "lu_3",
        label: "Langit - langit / papan langit – langit bebas dari noda",
      },
      {
        id: "lu_4",
        label: "Mebelair bersih dan terbebas dari debu",
      },
    ],
  },
  {
    title: "B. Ruangan Bersih",
    items: [
      {
        id: "rb_1",
        label:
          "Sebelum dan sesudah bekerja, permukaan harus di bersihkan dengan bahan sesuai dengan pedoman PPI di Rumah Sakit Al-Mulk",
      },
    ],
  },
  {
    title: "C. Kulkas Obat",
    items: [
      {
        id: "ko_1",
        label: "Suhu kulkas obat di jaga dalam sushu 2 – 8 °C",
      },
      {
        id: "ko_2",
        label:
          "Pemantauan suhu dicatat setiap hari dan jika suhu tidak sesuai standar maka diambil tindakan yang sesuai (suhu lemari penyimpanan berkisar 2 – 8 °C)",
      },
      {
        id: "ko_3",
        label:
          "Suhu lemari pembeku dijaga dalam kisaran suhu – 18 ° C atau lebih rendah",
      },
      {
        id: "ko_4",
        label:
          "Pemantauan suhu dicatat setiap hari dan jika suhu tidak sesuai standar maka akan diambil tindakan yang sesuai ( suhu lemari pembeku berkisar antara – 18 °C atau lebih rendah )",
      },
      {
        id: "ko_5",
        label:
          "Suhu ruang penyimpanan dijaga dalam kisaran 25 °C atau lebih rendah",
      },
      {
        id: "ko_6",
        label:
          "Pemantauan suhu tercatat tiap bulannya dan jika suhu tidak sesuai standar maka di ambil tindakan yang sesuai",
      },
    ],
  },
  {
    title: "D. Penyimpanan Obat",
    items: [
      {
        id: "po_1",
        label:
          "Suhu penyimpanan dijaga dalam kisaran 25 °C atau lebih rendah",
      },
    ],
  },
  {
    title: "E. Limbah Umum",
    items: [
      {
        id: "lm_1",
        label: "Limbah medis umum dibuang ke dalam plastik hitam",
      },
      {
        id: "lm_2",
        label:
          "Limbah khusus ditandai dengan jelas, misal : biohazard, radioaktif, kemoterapi",
      },
      {
        id: "lm_3",
        label: "Pastikan tidak ada kantung limbah yang terlampau penuh",
      },
    ],
  },
  {
    title: "F. Penanganan Yang Aman dan Pembuangan Benda Tajam",
    items: [
      {
        id: "bt_1",
        label: "Tempat sampah bebas dari benda tajam yang terjulur",
      },
      {
        id: "bt_2",
        label: "Semua tempat sampah tersusun dengan benar",
      },
      {
        id: "bt_3",
        label:
          "Seluruh tempat sampah benda tajam adalah safety box yang terstandar WHO",
      },
      {
        id: "bt_4",
        label: "Jarum tidak dibengkokkan, dipotong atau digunakan kembali",
      },
      {
        id: "bt_5",
        label:
          "Jarum / benda tajam langsung dibuang ke tempat sampah benda tajam setelah sesesai digunakan",
      },
      {
        id: "bt_6",
        label: "Jarum bebas pakai tidak boleh digunakan lagi",
      },
    ],
  },
  {
    title: "G. Fasilitas Cuci Tangan",
    items: [
      {
        id: "fct_1",
        label: "Tersedia fasilitas yang memadai untuk cuci tangan",
      },
      {
        id: "fct_2",
        label:
          "Wastafel cuci tangan bebas dari alat – alat yang telah dipakai dan benda – benda yang tidak sesuai",
      },
      {
        id: "fct_3",
        label:
          "Poster cara dan 5 saat kebersihan tangan berada di dekat alkohol hand rub atau wastafel",
      },
      {
        id: "fct_4",
        label:
          "Tersedia hand rub, botol berfungsi baik, ada tanggal saat botol dibuka dan tanggal expired",
      },
    ],
  },
  {
    title: "H. Petunjuk Umum",
    items: [
      {
        id: "pu_1",
        label: "Kuku dipotong pendek, bersih, dan bebas dari cat kuku",
      },
      {
        id: "pu_2",
        label:
          "Poster promosi kebersihan tangan tersedia dan terpajang di area yang terlihat oleh staf",
      },
    ],
  },
];
type AuditStatus = "ya" | "tidak" | "na" | null;
export default function InputMonitoringFarmasiPage() {
  const router = useRouter();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const { userRole } = useAppContext();
  const isIPCN = userRole === "IPCN" || userRole === "Admin";
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [observer, setObserver] = useState("");
  const [data, setData] = useState<Record<string, AuditStatus>>({});
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);
  const [upayaPerbaikan, setUpayaPerbaikan] = useState("");
  const [waktuPerbaikan, setWaktuPerbaikan] = useState("");
  const [perbaikanImages, setPerbaikanImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState("");
  const sigRef = useRef<DigitalSignatureRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      "A. Lingkungan Umum": true,
      "B. Ruangan Bersih": true,
      "C. Kulkas Obat": true,
      "D. Penyimpanan Obat": true,
      "E. Limbah Umum": true,
      "F. Penanganan Yang Aman dan Pembuangan Benda Tajam": true,
      "G. Fasilitas Cuci Tangan": true,
      "H. Petunjuk Umum": true,
    },
  );
  useEffect(() => {
    const initialData: Record<string, AuditStatus> = {};
    checklistGroups.forEach((group) => {
      group.items.forEach((item) => {
        initialData[item.id] = null;
      });
    });
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
        setStartTime(new Date());
      }
    } else {
      setStartTime(new Date());
    }
  }, []);
  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };
  const handleActionClick = (id: string, stat: AuditStatus) => {
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
    let statusText = "Belum Dinilai";
    if (dinilai > 0) {
      if (persentase >= 85) statusText = "Baik";
      else if (persentase >= 70) statusText = "Cukup";
      else statusText = "Perlu Tindak Lanjut";
    }
    return { patuh, dinilai, persentase, statusText };
  }, [data]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observer) return alert("Pilih Supervisor terlebih dahulu");
    setIsSubmitting(true);
    try {
      const ttd_pj = sigRef.current?.getPjSignature();
      const ttd_ipcn = sigRef.current?.getSupervisorSignature();
      const uploadedUrls = images.length > 0 ? await uploadImagesToSupabase(
        supabase,
        images,
        "audit_images",
        "monitoring_farmasi",
      ) : [];
      const uploadedPerbaikanUrls = perbaikanImages.length > 0 ? await uploadImagesToSupabase(
        supabase,
        perbaikanImages,
        "audit_images",
        "monitoring_farmasi/perbaikan",
      ) : [];
      const payload = {
        waktu: startTime?.toISOString() || new Date().toISOString(),
        checklist_json: {
          data,
        },
        persentase: stats.persentase,
        temuan,
        rekomendasi,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        status_kepatuhan: stats.statusText,
        ttd_pj,
        ttd_ipcn,
      };
      const sessionPayload = {
        indikator_id: "monitoring_farmasi",
        kategori: "Kewaspadaan Isolasi",
        nama_indikator: "MONITORING FARMASI",
        tanggal_waktu: payload.waktu,
        observer: observer,
        unit: "Farmasi",
        nama_pj: pjName.trim(),
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        temuan,
        rekomendasi,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        data_indikator: {
          ...data,
          temuan,
          rekomendasi,
          upaya_perbaikan: upayaPerbaikan,
          waktu_perbaikan: waktuPerbaikan,
          tanggal_perbaikan: waktuPerbaikan,
          foto_perbaikan: uploadedPerbaikanUrls,
          nama_pj: pjName.trim(),
          ttd_pj,
          ttd_ipcn,
          dokumentasi: uploadedUrls,
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
      // Insert into audit_details
      const allChecklistItems = checklistGroups.flatMap((group) => group.items);
      const detailPayloads = Object.keys(data).map((key) => ({
        session_id: sessionId,
        pertanyaan_id: key,
        pertanyaan: allChecklistItems.find((i) => i.id === key)?.label || key,
        jawaban: String(data[key]),
      }));
      await supabase.from("audit_details").insert(detailPayloads);
      // Save to native audit_farmasi table (optional/fallback)
      try {
        await supabase.from("audit_farmasi").insert([payload]);
      } catch (err) {
        console.warn("Failed to insert native audit_farmasi table", err);
      }
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || "Gagal menyimpan data"}`);
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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data Audit Farmasi Berhasil Disimpan
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-6 mb-8 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-blue-500/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-[length:200%_auto] animate-gradient uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Audit Farmasi
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-blue-500/80 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Audit kepatuhan PPI ruang Farmasi
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white/5 p-5 sm:p-6 lg:p-8 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Data Subjek
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 [color-scheme:dark]"
              />
            </div>
            <EditableSelect
              label="Supervisor"
              value={observer}
              onChange={setObserver}
              options={[]}
              isIPCN={isIPCN}
              table="master_observers"
              placeholder="Pilih Supervisor..."
            />
          </div>
        </div>
        <div className="bg-white/5 p-5 sm:p-6 lg:p-8 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            📋 Checklist Audit Farmasi
          </h2>
          <div className="space-y-6">
            {checklistGroups.map((group) => (
              <div
                key={group.title}
                className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-bold text-white uppercase tracking-widest">
                    {group.title}
                  </span>
                  {expandedGroups[group.title] ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedGroups[group.title] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-4 sm:p-5 space-y-4">
                        {group.items.map((item, idx) => (
                          <div
                            key={item.id}
                            className="bg-white/5 p-4 sm:p-5 md:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] border border-white/5 relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
                          >
                            <div className="flex gap-4 items-start relative z-10">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border bg-white/5 border-white/10 text-slate-400 font-black text-xs">
                                {idx + 1}
                              </div>
                              <div className="mt-0.5 sm:mt-1 flex-1">
                                <h3 className="text-sm font-bold text-white leading-relaxed">
                                  {item.label}
                                </h3>
                              </div>
                            </div>
                            <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-white/5 w-full sm:w-fit shrink-0 self-end md:self-center z-10">
                              {["ya", "tidak", "na"].map((choice) => (
                                <button
                                  key={choice}
                                  onClick={() =>
                                    handleActionClick(item.id, choice as any)
                                  }
                                  type="button"
                                  className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                                    data[item.id] === choice
                                      ? choice === "ya"
                                        ? "bg-blue-600 text-white shadow-lg transform scale-105"
                                        : choice === "tidak"
                                          ? "bg-red-600 text-white shadow-lg transform scale-105"
                                          : "bg-slate-600 text-white shadow-lg transform scale-105"
                                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                  }`}
                                >
                                  {choice === "na" ? "N/A" : choice}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        <LiveStatisticsCard
          totalDinilai={stats.dinilai}
          totalPatuh={stats.patuh}
          totalTidakPatuh={stats.dinilai - stats.patuh}
          persentase={stats.persentase}
          statusText={stats.statusText}
          title="KEPATUHAN FARMASI"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              📝 TEMUAN
            </h2>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan audit...&#10;Contoh:&#10;Tissue towel habis&#10;Rak obat berdebu&#10;Tempat sampah tajam penuh"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"
            />
          </div>
          <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              💡 REKOMENDASI
            </h2>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Tuliskan rekomendasi tindak lanjut...&#10;Contoh:&#10;Tambah stok tissue towel&#10;Jadwalkan pembersihan rak"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32 outline-none"
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
          onClick={handleSubmit}
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
      </div>
    </div>
  );
}
InputMonitoringFarmasiPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};