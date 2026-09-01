import { useState, useEffect, ReactElement } from "react";
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Activity,
  RefreshCw,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAppContext } from "@/components/Providers";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import { EditableSelect } from "@/components/EditableSelect";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { UpayaPerbaikanSection } from "@/components/UpayaPerbaikanSection";
import DigitalSignature, { DigitalSignatureRef } from "@/components/DigitalSignatureSection";
import { useRef } from "react";

const units = [
  "IGD",
  "ICU",
  "Ranap Aisyah",
  "Ranap Fatimah",
  "Ranap Khadijah",
  "Ranap Usman",
];

const materiOptions = [
  "Etika batuk",
  "Cuci tangan 5 momen dan 6 langkah",
] as const;

const sasaranOptions = ["Pasien", "Keluarga pasien", "Pengunjung"] as const;

export default function InputEtikaBatukPage() {
  const router = useRouter();
  const { userRole } = useAppContext();

  const [startTime, setStartTime] = useState<Date | null>(null);

  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);

  const [selectedMateri, setSelectedMateri] = useState<string[]>([]);
  const [selectedSasaran, setSelectedSasaran] = useState<string[]>([]);
  const [pjName, setPjName] = useState("");
  const [preloadedPjSignature, setPreloadedPjSignature] = useState<string | null>(null);
  const [preloadedIpcnSignature, setPreloadedIpcnSignature] = useState<string | null>(null);
  const [upayaPerbaikan, setUpayaPerbaikan] = useState("");
  const [waktuPerbaikan, setWaktuPerbaikan] = useState("");
  const [perbaikanImages, setPerbaikanImages] = useState<DocImage[]>([]);
  const sigRef = useRef<DigitalSignatureRef>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);

        const loadEditData = async () => {
          const { data, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .single();

          if (data && !error) {
            if (data.tanggal_waktu) setStartTime(new Date(data.tanggal_waktu));
            if (data.observer) setObserver(data.observer);
            if (data.unit) setUnit(data.unit);
            
            const indicatorsData = data.data_indikator || {};
            if (indicatorsData.materi_edukasi) setSelectedMateri(indicatorsData.materi_edukasi);
            if (indicatorsData.sasaran_edukasi) setSelectedSasaran(indicatorsData.sasaran_edukasi);
            
            const displayPjName = indicatorsData.nama_pj_ruangan || data.nama_pj_ruangan || "";
            setPjName(displayPjName);
            
            const pjSig = data.ttd_pj_ruangan || data.ttd_pj || data.tanda_tangan_pj || indicatorsData.tanda_tangan_pj || indicatorsData.ttd_pj_ruangan || indicatorsData.ttd_pj || (Array.isArray(indicatorsData.tanda_tangan) ? indicatorsData.tanda_tangan[0] : null);
            const ipcnSig = data.ttd_ipcn || data.tanda_tangan_ipcn || data.tanda_tangan_spv || indicatorsData.tanda_tangan_ipcn || indicatorsData.ttd_ipcn || (Array.isArray(indicatorsData.tanda_tangan) ? indicatorsData.tanda_tangan[1] : null);

            if (pjSig) setPreloadedPjSignature(pjSig);
            if (ipcnSig) setPreloadedIpcnSignature(ipcnSig);

            // Prefill signatures to signature pads
            setTimeout(() => {
              if (pjSig && sigRef.current?.setPjSignature) {
                sigRef.current.setPjSignature(pjSig);
              }
              if (ipcnSig && sigRef.current?.setSupervisorSignature) {
                sigRef.current.setSupervisorSignature(ipcnSig);
              }
            }, 400);
            
            // Prefill documentation
            const docs = indicatorsData.dokumentasi || data.dokumentasi || indicatorsData.foto || data.foto;
            if (Array.isArray(docs)) {
              setImages(docs.map((url: any) => typeof url === 'string' ? { url, file: null as any } : url));
            } else if (typeof docs === 'string' && docs.length > 0) {
              setImages([{ url: docs, file: null as any }]);
            }

            const upaya = indicatorsData.upaya_perbaikan || indicatorsData.upayaPerbaikan || data.upaya_perbaikan || "";
            if (upaya) setUpayaPerbaikan(upaya);

            const waktuPerb = indicatorsData.waktu_perbaikan || indicatorsData.tanggal_perbaikan || data.waktu_perbaikan || data.tanggal_perbaikan || "";
            if (waktuPerb) setWaktuPerbaikan(waktuPerb);

            const perbaikanDocs = indicatorsData.foto_perbaikan || indicatorsData.dokumentasi_perbaikan || data.foto_perbaikan;
            if (perbaikanDocs) {
              const pArr = Array.isArray(perbaikanDocs) ? perbaikanDocs : [perbaikanDocs];
              setPerbaikanImages(pArr.map((url: string) => (typeof url === 'string' ? { url } : url)));
            }
          }
        };
        loadEditData();
      } else {
        const d = new Date();
        setStartTime(d);
      }
    }
  }, []);

  const handleError = (err: any) => {
    console.error(err);
    alert(`Error: ${err.message || "Terjadi kesalahan sistem"}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setStartTime(new Date(val));
    }
  };

  const formattedDate = startTime
    ? new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  const toggleMateri = (materi: string) => {
    setSelectedMateri((prev) =>
      prev.includes(materi)
        ? prev.filter((m) => m !== materi)
        : [...prev, materi],
    );
  };

  const toggleSasaran = (sasaran: string) => {
    setSelectedSasaran((prev) =>
      prev.includes(sasaran)
        ? prev.filter((s) => s !== sasaran)
        : [...prev, sasaran],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMateri.length === 0) {
      alert("Harap pilih minimal 1 materi edukasi!");
      return;
    }
    if (selectedSasaran.length === 0) {
      alert("Harap pilih minimal 1 sasaran edukasi!");
      return;
    }
    if (!observer || !unit) {
      alert("Harap isi Supervisor dan Unit!");
      return;
    }

    setIsSubmitting(true);

    try {
      let ttd_pj = sigRef.current?.getPjSignature()?.trim() || preloadedPjSignature || null;
      let ttd_ipcn = sigRef.current?.getSupervisorSignature()?.trim() || preloadedIpcnSignature || null;

      const existingUrls = images.filter(img => img.url && !img.file).map(img => img.url);

      const payload: any = {
        tanggal_waktu: startTime?.toISOString() || new Date().toISOString(),
        observer,
        unit,
        materi_edukasi: selectedMateri,
        sasaran_edukasi: selectedSasaran,
        dokumentasi: existingUrls,
        ttd_pj_ruangan: ttd_pj,
        ttd_ipcn: ttd_ipcn,
        nama_pj_ruangan: pjName.trim(),
      };

      const newImages = images.filter(img => img.file !== null && img.file !== undefined);
      const uploadedUrls: string[] = [];
      const idForUpload = editId || "etika_batuk_temp";

      for (let i = 0; i < newImages.length; i++) {
        const fileExt = newImages[i].file!.name.split(".").pop();
        const fileName = `${idForUpload}_${i}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("audit_images")
          .upload(`images/${fileName}`, newImages[i].file!);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("audit_images")
            .getPublicUrl(`images/${fileName}`);
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      payload.dokumentasi = [...existingUrls, ...uploadedUrls];

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

      payload.upaya_perbaikan = upayaPerbaikan;
      payload.waktu_perbaikan = waktuPerbaikan;
      payload.foto_perbaikan = uploadedPerbaikanUrls;

      let sessionError;
      if (isEditMode && editId) {
        const { error } = await supabase
          .from("audit_sessions")
          .update({
            tanggal_waktu: payload.tanggal_waktu,
            observer,
            unit,
            jumlah_dinilai: 1,
            jumlah_patuh: 1,
            persentase: 100,
            status_kepatuhan: "Patuh",
            kategori: "Kewaspadaan Isolasi",
            ttd_pj_ruangan: ttd_pj,
            ttd_ipcn: ttd_ipcn,
            nama_pj_ruangan: pjName.trim(),
            upaya_perbaikan: upayaPerbaikan,
            waktu_perbaikan: waktuPerbaikan,
            tanggal_perbaikan: waktuPerbaikan,
            foto_perbaikan: uploadedPerbaikanUrls,
            data_indikator: { ...payload },
          })
          .eq("id", editId);
        sessionError = error;
      } else {
        const { data: sessionData, error: insertError } = await supabase
          .from("audit_sessions")
          .insert([
            {
              indikator_id: "etika_batuk",
              nama_indikator: "ETIKA BATUK",
              tanggal_waktu: payload.tanggal_waktu,
              observer,
              unit,
              jumlah_dinilai: 1,
              jumlah_patuh: 1,
              persentase: 100,
              status_kepatuhan: "Patuh",
              kategori: "Kewaspadaan Isolasi",
              ttd_pj_ruangan: ttd_pj,
              ttd_ipcn: ttd_ipcn,
              nama_pj_ruangan: pjName.trim(),
              upaya_perbaikan: upayaPerbaikan,
              waktu_perbaikan: waktuPerbaikan,
              tanggal_perbaikan: waktuPerbaikan,
              foto_perbaikan: uploadedPerbaikanUrls,
              data_indikator: { ...payload },
            },
          ])
          .select("id")
          .single();

        sessionError = insertError;
      }

      if (sessionError) throw sessionError;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push("/dashboard/input/isolasi");
      }, 2000);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-widest text-xs border border-blue-400/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            Data berhasil disimpan
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4 mb-8 py-6 border-b border-white/5">
        <Link
          href="/dashboard/input/isolasi"
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400 uppercase">
            Audit Etika Batuk
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">
            Dokumentasi kepatuhan etika batuk dan bersin
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Informasi Audit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Waktu Audit
              </label>
              <input
                type="datetime-local"
                value={formattedDate}
                onChange={handleDateChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <EditableSelect
                label="Supervisor"
                value={observer}
                onChange={setObserver}
                options={["IPCN_Adi Tresa Purnama"]}
                isIPCN={userRole === "ipcn"}
                table="master_observers"
                storageKey="local_obs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="" className="bg-slate-900">
                  Pilih Unit...
                </option>
                {units.map((u) => (
                  <option key={u} value={u} className="bg-slate-900">
                    {u}
                  </option>
                ))}{" "}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST ETIKA BATUK
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 block">
                Materi Edukasi
              </h3>
              <div className="flex flex-col gap-3">
                {materiOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedMateri.includes(opt) ? "bg-blue-600 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]" : "bg-black/20 border-white/10 group-hover:bg-black/40"}`}
                    >
                      {selectedMateri.includes(opt) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                      {opt}
                    </span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedMateri.includes(opt)}
                      onChange={() => toggleMateri(opt)}
                    />
                  </label>
                ))}{" "}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 block">
                Sasaran Edukasi
              </h3>
              <div className="flex flex-col gap-3">
                {sasaranOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedSasaran.includes(opt) ? "bg-purple-600 border-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.4)]" : "bg-black/20 border-white/10 group-hover:bg-black/40"}`}
                    >
                      {selectedSasaran.includes(opt) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                      {opt}
                    </span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedSasaran.includes(opt)}
                      onChange={() => toggleSasaran(opt)}
                    />
                  </label>
                ))}{" "}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-6 sm:p-8 rounded-[2.5rem] border border-white/5 shadow-sm space-y-6">
          <DocumentationUploader images={images} setImages={setImages} />
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
        </div>

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <DigitalSignature
            ref={sigRef}
            pjName={pjName}
            setPjName={setPjName}
            preloadedPjSignature={preloadedPjSignature}
            preloadedIpcnSignature={preloadedIpcnSignature}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !observer ||
            !unit ||
            selectedMateri.length === 0 ||
            selectedSasaran.length === 0
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

InputEtikaBatukPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
