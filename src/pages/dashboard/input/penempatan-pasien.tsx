import { useState, useEffect, useMemo, ReactElement, useRef } from "react";
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
import { uploadImagesToSupabase } from "@/lib/upload";
import DashboardLayout from "@/components/DashboardLayout";
import { LiveStatisticsCard } from "@/components/LiveStatisticsCard";
import { EditableSelect } from "@/components/EditableSelect";
import DigitalSignatureSection, {
  DigitalSignatureRef,
} from "@/components/DigitalSignatureSection";
import {
  DocumentationUploader,
  DocImage,
} from "@/components/DocumentationUploader";
import { UpayaPerbaikanSection } from "@/components/UpayaPerbaikanSection";

const units = [
  "IGD",
  "ICU",
  "Ranap Aisyah",
  "Ranap Fatimah",
  "Ranap Khadijah",
  "Ranap Usman",
];

const auditItems = [
  {
    id: "catatan_infeksi",
    label: "Ada catatan pasien infeksi dan non infeksi",
    key: "catatan_infeksi",
  },
  {
    id: "instruksi_ruang",
    label:
      "Instruksi jelas untuk petugas dan pengunjung di ruang infeksi (tanda)",
    key: "instruksi_ruang",
  },
  {
    id: "poster_pencegahan",
    label:
      "Poster petunjuk pencegahan penularan penyakit (kontak, droplet, airborne)",
    key: "poster_pencegahan",
  },
  {
    id: "apd_tersedia",
    label: "Alat proteksi diri tersedia lengkap saat memasuki ruang isolasi",
    key: "apd_tersedia",
  },
  {
    id: "catatan_klinis",
    label: "Ada catatan kasus/bagan klinis di ruangan isolasi",
    key: "catatan_klinis",
  },
  {
    id: "instruksi_isolasi",
    label:
      "Instruksi jelas untuk petugas dan pengunjung saat pasien di isolasi (contoh: tanda di pintu)",
    key: "instruksi_isolasi",
  },
  {
    id: "pintu_tertutup",
    label: "Pintu selalu ditutup",
    key: "pintu_tertutup",
  },
  {
    id: "alur_pasien",
    label: "Alur pasien masuk terpasang jelas",
    key: "alur_pasien",
  },
] as const;

type AuditStatus = "ya" | "tidak" | "na" | null;

export default function InputPenempatanPasienPage() {
  const router = useRouter();
  const { userRole } = useAppContext();

  const [startTime, setStartTime] = useState<Date | null>(null);

  const [observer, setObserver] = useState("");
  const [unit, setUnit] = useState("");
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [images, setImages] = useState<DocImage[]>([]);
  const [pjName, setPjName] = useState("");
  const [upayaPerbaikan, setUpayaPerbaikan] = useState("");
  const [waktuPerbaikan, setWaktuPerbaikan] = useState("");
  const [perbaikanImages, setPerbaikanImages] = useState<DocImage[]>([]);
  const signatureRef = useRef<DigitalSignatureRef>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [preloadedPjSignature, setPreloadedPjSignature] = useState<string | null>(null);
  const [preloadedIpcnSignature, setPreloadedIpcnSignature] = useState<string | null>(null);

  const [auditData, setAuditData] = useState<Record<string, AuditStatus>>({
    catatan_infeksi: null,
    instruksi_ruang: null,
    poster_pencegahan: null,
    apd_tersedia: null,
    catatan_klinis: null,
    instruksi_isolasi: null,
    pintu_tertutup: null,
    alur_pasien: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const mode = params.get("mode");
      if (id && mode === "edit") {
        setIsEditMode(true);
        setEditId(id);

        const loadEditData = async () => {
          let { data, error } = await supabase
            .from("audit_sessions")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (!data) {
            const { data: fallbackData } = await supabase
              .from("audit_penempatan_pasien")
              .select("*")
              .eq("id", id)
              .maybeSingle();
            if (fallbackData) data = fallbackData;
          }

          if (data) {
            if (data.tanggal_waktu) setStartTime(new Date(data.tanggal_waktu));
            if (data.observer) setObserver(data.observer);
            if (data.unit) setUnit(data.unit);
            
            const indicatorsData = data.data_indikator || data.checklist_json || {};
            const valTemuan = data.temuan || indicatorsData.temuan || data.temuan_lapangan || indicatorsData.temuan_lapangan || data.catatan || indicatorsData.catatan || "";
            if (valTemuan) setTemuan(valTemuan);

            const valRekomendasi = data.rekomendasi || indicatorsData.rekomendasi || data.saran || indicatorsData.saran || "";
            if (valRekomendasi) setRekomendasi(valRekomendasi);

            if (data.nama_pj_ruangan || data.nama_pj || indicatorsData.nama_pj_ruangan || indicatorsData.nama_pj) {
              setPjName(data.nama_pj_ruangan || data.nama_pj || indicatorsData.nama_pj_ruangan || indicatorsData.nama_pj);
            }
            const pjSig = data.ttd_pj_ruangan || data.ttd_pj || data.tanda_tangan_pj || indicatorsData.tanda_tangan_pj || indicatorsData.ttd_pj_ruangan || indicatorsData.ttd_pj || (Array.isArray(indicatorsData.tanda_tangan) ? indicatorsData.tanda_tangan[0] : null);
            const ipcnSig = data.ttd_ipcn || data.tanda_tangan_ipcn || data.tanda_tangan_spv || indicatorsData.tanda_tangan_ipcn || indicatorsData.ttd_ipcn || (Array.isArray(indicatorsData.tanda_tangan) ? indicatorsData.tanda_tangan[1] : null);

            if (pjSig) setPreloadedPjSignature(pjSig);
            if (ipcnSig) setPreloadedIpcnSignature(ipcnSig);

            // Populate checklist items
            setAuditData((prev) => {
              const updated = { ...prev };
              Object.keys(updated).forEach((key) => {
                if (indicatorsData[key] !== undefined) {
                  updated[key] = indicatorsData[key] as AuditStatus;
                }
              });
              return updated;
            });

            // Prefill signatures to signature pads
            if (pjSig && signatureRef.current?.setPjSignature) {
              setTimeout(() => {
                signatureRef.current?.setPjSignature?.(pjSig);
              }, 400);
            }
            if (ipcnSig && signatureRef.current?.setSupervisorSignature) {
              setTimeout(() => {
                signatureRef.current?.setSupervisorSignature?.(ipcnSig);
              }, 400);
            }
            
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

  const handleActionClick = (id: string, stat: AuditStatus) => {
    setAuditData((prev) => ({ ...prev, [id]: stat }));
  };

  const stats = useMemo(() => {
    let patuh = 0;
    let dinilai = 0;

    Object.values(auditData).forEach((val) => {
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
  }, [auditData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(auditData).some((v) => v === null)) {
      alert("Harap isi semua indikator!");
      return;
    }

    setIsSubmitting(true);

    try {
      const pjSig = signatureRef.current?.getPjSignature() || preloadedPjSignature;
      const ipcnSig = signatureRef.current?.getSupervisorSignature() || preloadedIpcnSignature;

      const uploadedImages = await uploadImagesToSupabase(
        supabase,
        images || [],
        "audit_images",
        "images",
      );

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
        temuan,
        rekomendasi,
        ...auditData,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
      };

      const sessionPayload = {
        indikator_id: "penempatan_pasien",
        nama_indikator: "PENEMPATAN PASIEN",
        tanggal_waktu: payload.tanggal_waktu,
        observer,
        unit,
        nama_pj: pjName.trim(),
        nama_pj_ruangan: pjName.trim(),
        ttd_pj_ruangan: pjSig,
        ttd_ipcn: ipcnSig,
        temuan,
        rekomendasi,
        jumlah_dinilai: stats.dinilai,
        jumlah_patuh: stats.patuh,
        persentase: stats.persentase,
        status_kepatuhan: stats.statusText,
        data_indikator: {
          ...auditData,
          temuan,
          rekomendasi,
          dokumentasi: uploadedImages,
          tanda_tangan_pj: pjSig,
          tanda_tangan_ipcn: ipcnSig,
          nama_pj_ruangan: pjName.trim(),
          upaya_perbaikan: upayaPerbaikan,
          waktu_perbaikan: waktuPerbaikan,
          foto_perbaikan: uploadedPerbaikanUrls,
        },
      };

      let sessionError;
      if (isEditMode && editId) {
        const { error } = await supabase
          .from("audit_sessions")
          .update(sessionPayload)
          .eq("id", editId);
        sessionError = error;
      } else {
        const { error } = await supabase
          .from("audit_sessions")
          .insert([sessionPayload]);
        sessionError = error;
      }

      if (sessionError) throw sessionError;

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        if (isEditMode) {
          router.push("/dashboard/reports");
        } else {
          router.push("/dashboard/input/isolasi");
        }
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
            {isEditMode ? "Data berhasil diperbarui" : "Data berhasil disimpan"}
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400">
              Audit Penempatan Pasien
            </h1>
            {isEditMode && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse">
                MODE EDIT DATA
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-blue-400 mt-1">
            Observasi kepatuhan penempatan pasien infeksius
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
            <Activity className="w-4 h-4 text-purple-400" /> Informasi Audit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div>
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
            <FileText className="w-4 h-4 text-amber-400" /> CEKLIST PENEMPATAN
            PASIEN
          </h2>
          <div className="space-y-4">
            {auditItems.map((item, idx) => {
              const selected = auditData[item.id];
              const negativeKeywords = [
                "berkarat",
                "kotor",
                "debu",
                "genangan",
                "tercampur",
                "bercampur",
                "penumpukan",
                "bocor",
                "jarum",
                "menumpuk",
                "sampah medis dan non medis",
                "pembuangan sampah infeksius",
              ];
              const isNegativeQuestion = negativeKeywords.some((kw) =>
                (item.label || (item as any).desc || "")
                  .toLowerCase()
                  .includes(kw),
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
                            onClick={() =>
                              handleActionClick(item.id, choice as any)
                            }
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                              auditData[item.id] === choice
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
          totalDinilai={stats.dinilai || 0}
          totalPatuh={stats.patuh || 0}
          totalTidakPatuh={(stats.dinilai || 0) - (stats.patuh || 0)}
          persentase={stats.persentase || 0}
          statusText={stats.statusText || "Belum Dinilai"}
        />

        <div className="bg-white/5 p-6 rounded-[24px] border border-white/5 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Temuan dan Rekomendasi
          </h2>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
              Temuan Audit
            </label>
            <textarea
              value={temuan}
              onChange={(e) => setTemuan(e.target.value)}
              placeholder="Tuliskan temuan audit..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
              Rekomendasi
            </label>
            <textarea
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              placeholder="Rekomendasi tindakan..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[100px]"
            />
          </div>

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

          <DigitalSignatureSection
            ref={signatureRef}
            pjName={pjName}
            setPjName={setPjName}
            preloadedPjSignature={preloadedPjSignature}
            preloadedIpcnSignature={preloadedIpcnSignature}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-4 py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isEditMode ? "Update Data Audit" : "Simpan Data Audit"}</span>
        </button>
      </form>
    </div>
  );
}

InputPenempatanPasienPage.getLayout = function getLayout(
  page: React.ReactElement,
) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
