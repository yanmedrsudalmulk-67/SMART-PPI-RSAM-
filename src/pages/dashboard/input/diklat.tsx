import { ReactElement, useState, useEffect } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  Save,
  X,
  RefreshCw,
  Edit3,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { MateriUploader } from "@/components/MateriUploader";

export interface TrainingMaterial {
  id: string;
  kegiatan_id: string;
  nama_file: string;
  jenis_file: string;
  ukuran_file: number;
  storage_path: string;
  public_url: string;
  uploaded_by: string;
  created_at?: string;
}

function generateUUID() {
  if (typeof window !== "undefined" && window.crypto) {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function DiklatPage() {
  const router = useSafeRouter();
  const { id, editId } = router.query;
  const targetEditId = (editId || id) as string | undefined;

  const [activityId, setActivityId] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(false);

  const [judulPendidikan, setJudulPendidikan] = useState("");
  const [jenisPendidikan, setJenisPendidikan] = useState("sosialisasi");
  const [waktu, setWaktu] = useState(new Date().toISOString().slice(0, 16));
  const [tempat, setTempat] = useState("");
  const [narasumber, setNarasumber] = useState("");
  const [peserta, setPeserta] = useState<string[]>([]);
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [images, setImages] = useState<DocImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPesertaDropdownOpen, setIsPesertaDropdownOpen] = useState(false);

  // Initialize or fetch edit record
  useEffect(() => {
    if (!router.isReady) return;

    if (targetEditId) {
      const fetchEditRecord = async () => {
        setLoadingEditData(true);
        try {
          const { data, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", targetEditId)
            .single();

          if (error) throw error;
          if (data) {
            setIsEditMode(true);
            setActivityId(data.id);
            if (data.tanggal_waktu) {
              const dt = new Date(data.tanggal_waktu);
              const pad = (n: number) => n.toString().padStart(2, "0");
              const localIso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
              setWaktu(localIso);
            }
            setTempat(data.unit || "");
            setNarasumber(data.observer || "");
            setJenisPendidikan(data.jenis_tindakan || "sosialisasi");

            const json = data.data_indikator || {};
            setJudulPendidikan(json.judul || data.nama_indikator || "");
            setPeserta(json.peserta || []);
            setMaterials(json.materials || []);
            if (Array.isArray(json.images)) {
              setImages(
                json.images.map((url: string, idx: number) => ({
                  id: `img_${idx}`,
                  url: url,
                  file: null,
                }))
              );
            }
          }
        } catch (err: any) {
          console.error("Gagal memuat data edit pelatihan:", err);
          alert("Gagal memuat data edit: " + (err.message || err));
        } finally {
          setLoadingEditData(false);
        }
      };

      fetchEditRecord();
    } else {
      setIsEditMode(false);
      setActivityId((prev) => prev || generateUUID());
    }
  }, [router.isReady, targetEditId]);

  const handleResetToNew = () => {
    setIsEditMode(false);
    setActivityId(generateUUID());
    setJudulPendidikan("");
    setPeserta([]);
    setNarasumber("");
    setTempat("");
    setMaterials([]);
    setImages([]);
    setWaktu(new Date().toISOString().slice(0, 16));
    router.push("/dashboard/input/diklat", undefined, { shallow: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (peserta.length === 0) {
      alert("Harap pilih minimal 1 peserta!");
      return;
    }
    if (!judulPendidikan) {
      alert("Harap isi judul pendidikan!");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload documentation images if any new files
      const uploadedUrls: string[] = [];
      const newImages = images.filter((img) => img.file !== null && img.file !== undefined);

      for (let i = 0; i < newImages.length; i++) {
        const fileExt = newImages[i].file!.name.split(".").pop();
        const fileName = `${activityId}_${i}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("audit_images")
          .upload(`images/${fileName}`, newImages[i].file!);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("audit_images")
            .getPublicUrl(`images/${fileName}`);
          if (publicUrlData) {
            uploadedUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      // Combine existing and newly uploaded images
      const existingUrls = images.filter((img) => img.url && !img.file).map((img) => img.url);
      const finalImageUrls = [...existingUrls, ...uploadedUrls];

      // 2. Build payload
      const currentId = activityId || generateUUID();
      const payload = {
        id: currentId,
        indikator_id: "diklat_ppi",
        nama_indikator: "PENDIDIKAN DAN PELATIHAN PPI",
        tanggal_waktu: new Date(waktu).toISOString(),
        observer: narasumber,
        unit: tempat,
        jenis_tindakan: jenisPendidikan,
        jumlah_dinilai: peserta.length,
        jumlah_patuh: peserta.length,
        persentase: 100,
        status_kepatuhan: "Terlaksana",
        kategori: "Pendidikan dan Pelatihan",
        data_indikator: {
          judul: judulPendidikan,
          peserta: peserta,
          materials: materials,
          images: finalImageUrls,
        },
      };

      if (isEditMode && targetEditId) {
        const { error } = await supabase
          .from("audit_sessions")
          .update(payload)
          .eq("id", targetEditId);

        if (error) throw error;
        alert("Data kegiatan pelatihan berhasil diperbarui!");
        router.push("/dashboard/reports");
      } else {
        const { error } = await supabase.from("audit_sessions").insert([payload]);
        if (error) throw error;

        alert("Data pelatihan dan materi berhasil disimpan!");
        handleResetToNew();
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isEditMode ? "Edit Pelatihan" : "Pendidikan & Pelatihan"} - SMART PPI</title>
      </Head>

      <div className="max-w-2xl mx-auto pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/input"
            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase bg-clip-text">
              Pendidikan & Pelatihan
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mt-1">
              {isEditMode ? "Edit Data Pelatihan PPI" : "Input Data Pelatihan PPI"}
            </p>
          </div>
        </div>

        {/* Edit mode alert banner */}
        {isEditMode && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Mode Edit Data Pelatihan
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Mengubah riwayat pengisian kegiatan sebelumnya
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetToNew}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Batal Edit
            </button>
          </div>
        )}

        {loadingEditData ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-sm border border-white/5 rounded-[2.5rem] text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs uppercase tracking-widest font-bold">Memuat data riwayat kegiatan...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-8 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                    Waktu Kegiatan
                  </label>
                  <input
                    type="datetime-local"
                    value={waktu}
                    onChange={(e) => setWaktu(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                    Tempat
                  </label>
                  <input
                    type="text"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Masukkan lokasi..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                    Nama Kegiatan / Pelatihan
                  </label>
                  <input
                    type="text"
                    value={judulPendidikan}
                    onChange={(e) => setJudulPendidikan(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Nama pelatihan..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                    Narasumber / Instruktur
                  </label>
                  <input
                    type="text"
                    value={narasumber}
                    onChange={(e) => setNarasumber(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="Nama narasumber..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                  Peserta Pelatihan
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsPesertaDropdownOpen(!isPesertaDropdownOpen)
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-left text-white outline-none focus:border-blue-500/50 transition-colors flex justify-between items-center"
                  >
                    <span className="truncate">
                      {peserta.length > 0
                        ? `${peserta.length} Profesi Terpilih`
                        : "Pilih Profesi Peserta..."}
                    </span>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-slate-500 font-medium">
                        Buka
                      </span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isPesertaDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                      >
                        <div className="max-h-60 overflow-y-auto p-2">
                          {[
                            "Dokter Umum",
                            "Dokter Spesialis",
                            "Perawat",
                            "Bidan",
                            "Analis Laboratorium",
                            "Radiografer",
                            "Pramusaji",
                            "Pekarya",
                            "Satpam",
                            "Cleaning Service",
                            "Manajemen",
                            "Staf Administrasi",
                          ].map((p) => (
                            <label
                              key={p}
                              className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={peserta.includes(p)}
                                onChange={(e) => {
                                  if (e.target.checked)
                                    setPeserta([...peserta, p]);
                                  else setPeserta(peserta.filter((x) => x !== p));
                                }}
                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900"
                              />
                              <span className="text-sm text-slate-300 font-medium">
                                {p}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {peserta.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {peserta.map((p) => (
                      <span
                        key={p}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg flex items-center gap-2"
                      >
                        {p}
                        <button
                          type="button"
                          onClick={() =>
                            setPeserta(peserta.filter((x) => x !== p))
                          }
                          className="hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Dokumen Materi Pelatihan Card */}
              {activityId && (
                <div>
                  <MateriUploader
                    materials={materials}
                    setMaterials={setMaterials}
                    activityId={activityId}
                    uploadedBy={narasumber || "Assessor Staff"}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                  Dokumentasi Kegiatan
                </label>
                <DocumentationUploader images={images} setImages={setImages} />
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !waktu ||
                  !tempat ||
                  !narasumber ||
                  peserta.length === 0
                }
                className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-8"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : isEditMode ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>
                  {isSubmitting
                    ? "Menyimpan Data..."
                    : isEditMode
                    ? "Perbarui Data Pelatihan"
                    : "Simpan Pelatihan & Materi"}
                </span>
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </>
  );
}

DiklatPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
