import { useState, useMemo, useEffect, ReactElement } from 'react';
import { 
  FileText, Download, Calendar, Filter, FileSpreadsheet, Search, ArrowLeft, 
  Activity, ShieldCheck, ClipboardCheck, GraduationCap, Building2, User, AlertTriangle, Truck, Users, Wind, ShieldAlert,
  ChevronDown, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/components/Providers';
import DashboardLayout from '@/components/DashboardLayout';
import { genericAuditConfigs } from '@/lib/audit-configs';

import GenericAuditReport from '@/components/reports/GenericAuditReport';
import HandHygieneReport from '@/components/reports/HandHygieneReport';
import ApdReport from '@/components/reports/ApdReport';

const INDICATORS_MAP: Record<string, { cat: string, subcat?: string, title: string, id: string, icon: any }> = {
  // Kewaspadaan Isolasi - Standar
  'audit_hand_hygiene': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Kepatuhan Kebersihan Tangan', id: 'audit_hand_hygiene', icon: Activity },
  'audit_apd': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Kepatuhan Penggunaan APD', id: 'audit_apd', icon: ShieldCheck },
  'etika_batuk': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Etika Batuk', id: 'etika_batuk', icon: Wind },
  'penempatan_pasien': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Penempatan Pasien', id: 'penempatan_pasien', icon: Users },
  'dekontaminasi_alat': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Dekontaminasi Alat', id: 'dekontaminasi_alat', icon: ClipboardCheck },
  'pengelolaan_limbah_medis': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Pengelolaan Limbah Medis', id: 'pengelolaan_limbah_medis', icon: AlertTriangle },
  'pengelolaan_limbah_tajam': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Pengelolaan Limbah Tajam', id: 'pengelolaan_limbah_tajam', icon: AlertTriangle },
  'penatalaksanaan_linen': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Penatalaksanaan Linen', id: 'penatalaksanaan_linen', icon: ClipboardCheck },
  'pengendalian_lingkungan': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Pengendalian Lingkungan', id: 'pengendalian_lingkungan', icon: Wind },
  'penyuntikan_aman': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Penyuntikan Aman', id: 'penyuntikan_aman', icon: ShieldAlert },
  'perlindungan_petugas': { cat: 'Kewaspadaan Isolasi', subcat: 'Standar', title: 'Perlindungan Petugas', id: 'perlindungan_petugas', icon: ShieldCheck },

  // Kewaspadaan Isolasi - Transmisi
  'monitoring_airborne': { cat: 'Kewaspadaan Isolasi', subcat: 'Transmisi', title: 'Transmisi Airborne', id: 'monitoring_airborne', icon: Wind },

  // Kewaspadaan Isolasi - Monitoring
  'monitoring_jenazah': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Kamar Jenazah', id: 'monitoring_jenazah', icon: Building2 },
  'monitoring_laboratorium': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Laboratorium', id: 'monitoring_laboratorium', icon: Activity },
  'monitoring_radiologi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Radiologi', id: 'monitoring_radiologi', icon: Activity },
  'monitoring_ppi_ruang_isolasi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ruang Isolasi', id: 'monitoring_ppi_ruang_isolasi', icon: Users },
  'monitoring_immuno': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Immunocompromised', id: 'monitoring_immuno', icon: ShieldAlert },
  'monitoring_fasilitas_hand_hygiene': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Fasilitas Hand Hygiene', id: 'monitoring_fasilitas_hand_hygiene', icon: Activity },
  'monitoring_fasilitas_apd': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Fasilitas APD', id: 'monitoring_fasilitas_apd', icon: ShieldCheck },
  'monitoring_farmasi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Farmasi', id: 'monitoring_farmasi', icon: Building2 },
  'monitoring_ibs': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ruangan IBS', id: 'monitoring_ibs', icon: Building2 },
  'monitoring_cssd': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'CSSD', id: 'monitoring_cssd', icon: Building2 },
  'monitoring_gizi': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Gizi', id: 'monitoring_gizi', icon: Building2 },
  'monitoring_ambulance': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ambulance', id: 'monitoring_ambulance', icon: Truck },
  'monitoring_tunggu': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'Ruang Tunggu', id: 'monitoring_tunggu', icon: Users },
  'monitoring_tps': { cat: 'Kewaspadaan Isolasi', subcat: 'Monitoring', title: 'TPS Limbah', id: 'monitoring_tps', icon: AlertTriangle },
  
  // Surveilans HAIs
  'isk': { cat: 'Surveilans HAIs', title: 'Infeksi Saluran Kemih (ISK)', id: 'isk', icon: Activity },
  'phlebitis': { cat: 'Surveilans HAIs', title: 'Phlebitis', id: 'phlebitis', icon: Activity },
  'vap': { cat: 'Surveilans HAIs', title: 'Ventilator Associated Pneumonia (VAP)', id: 'vap', icon: Activity },
  'ido': { cat: 'Surveilans HAIs', title: 'Infeksi Daerah Operasi (IDO)', id: 'ido', icon: Activity },
};

const CATEGORIES = [
  'Kewaspadaan Isolasi',
  'Surveilans HAIs',
  'Monitoring Bundles',
  'Pendidikan dan Pelatihan'
];

const SUB_CATEGORIES = {
  'Kewaspadaan Isolasi': ['Standar', 'Transmisi', 'Monitoring']
};

const SummaryCard = ({ indicator, stats, onClick }: any) => {
  const avgPercent = stats ? stats.avgPercent : 0;
  const count = stats ? stats.count : 0;
  
  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-500/10';
  let borderClass = 'border-slate-500/20';
  let targetStatus = 'Belum ada data';
  
  if (count > 0) {
    if (avgPercent < 75) {
      colorClass = 'text-red-500'; bgClass = 'bg-red-500/10'; borderClass = 'border-red-500/30';
      targetStatus = 'Di bawah target';
    }
    else if (avgPercent < 85) {
      colorClass = 'text-yellow-500'; bgClass = 'bg-yellow-500/10'; borderClass = 'border-yellow-500/30';
      targetStatus = 'Mendekati target';
    }
    else {
      colorClass = 'text-emerald-500'; bgClass = 'bg-emerald-500/10'; borderClass = 'border-emerald-500/30';
      targetStatus = 'Target tercapai';
    }
  }

  const Icon = indicator.icon;

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }} 
      onClick={onClick}
      className={`bg-white dark:bg-[#111827]/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border ${borderClass} cursor-pointer group relative overflow-hidden transition-all shadow-sm hover:shadow-lg dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between min-h-[220px]`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -z-10 opacity-20 transition-all duration-500 group-hover:opacity-40 group-hover:scale-150 ${bgClass.replace('/10', '')}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-3xl font-black font-mono tracking-tighter drop-shadow-md transition-colors ${colorClass}`}>
            {Math.round(avgPercent)}%
          </span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Capaian Rata-rata</span>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-tight leading-snug group-hover:text-blue-500 transition-colors">
          {indicator.title}
        </h3>
        
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
          <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{count} Audit</span>
             <span className={`text-[10px] font-bold ${colorClass}`}>{targetStatus}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors text-slate-400">
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </div>
        </div>
      </div>
      
      {/* Decorative Target Line */}
       <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-white/5">
         <div className={`h-full ${bgClass.replace('/10', '')} transition-all duration-1000 ease-out`} style={{ width: `${avgPercent}%` }} />
      </div>
    </motion.div>
  );
};

export default function ReportsPage() {
  const [periode, setPeriode] = useState('Bulanan');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [selectedSemester, setSelectedSemester] = useState(Math.floor(new Date().getMonth() / 6));
  const [kategori, setKategori] = useState('Kewaspadaan Isolasi');
  const [subKategori, setSubKategori] = useState('Standar');
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  
  const [statsMap, setStatsMap] = useState<Map<string, { count: number, sum: number, avgPercent: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  const startDateISO = useMemo(() => {
    if (periode === 'Bulanan') {
      return new Date(selectedYear, selectedMonth, 1).toISOString();
    }
    if (periode === 'Triwulan') {
      return new Date(selectedYear, selectedQuarter * 3, 1).toISOString();
    }
    if (periode === 'Semester') {
      return new Date(selectedYear, selectedSemester * 6, 1).toISOString();
    }
    if (periode === 'Tahunan') {
      return new Date(selectedYear, 0, 1).toISOString();
    }
    
    return new Date().toISOString();
  }, [periode, selectedMonth, selectedYear, selectedQuarter, selectedSemester]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('audit_sessions')
          .select('indikator_id, persentase, tanggal_waktu')
          .gte('tanggal_waktu', startDateISO);
          
        if (data) {
          const map = new Map<string, { count: number, sum: number, avgPercent: number }>();
          data.forEach((row: any) => {
             const key = row.indikator_id;
             if (!map.has(key)) map.set(key, { count: 0, sum: 0, avgPercent: 0 });
             const entry = map.get(key)!;
             entry.count += 1;
             entry.sum += (row.persentase || 0);
          });
          
          for (let [key, val] of Array.from(map.entries())) {
             val.avgPercent = val.count > 0 ? (val.sum / val.count) : 0;
          }
          setStatsMap(map);
        } else {
          setStatsMap(new Map());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    const channel = supabase.channel('audit_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_sessions' }, () => {
         fetchStats();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDateISO]);

  // Compute displayed indicators based on category/subcategory
  const displayedIndicators = useMemo(() => {
    return Object.values(INDICATORS_MAP).filter(ind => {
      if (ind.cat !== kategori) return false;
      if (subKategori && ind.subcat !== subKategori) return false;
      return true;
    });
  }, [kategori, subKategori]);

  const handleBack = () => {
     setSelectedIndicator(null);
  };

  const selectedData = INDICATORS_MAP[selectedIndicator || ''];

  return (
    <div className="max-w-[1600px] mx-auto pb-32">
      <AnimatePresence mode="wait">
        {!selectedIndicator && (
          <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, scale: 0.98 }} className="space-y-8">
            
            {/* Header & Filter Periode */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
                   Laporan SMART PPI
                </h1>
                <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                   Pusat analisis data pencegahan dan pengendalian infeksi terintegrasi.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
                   <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                     <Calendar className="w-5 h-5" />
                   </div>
                   <select 
                     value={periode} 
                     onChange={(e) => setPeriode(e.target.value)}
                     className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                   >
                     {['Bulanan', 'Triwulan', 'Semester', 'Tahunan'].map(p => (
                       <option key={p} value={p} className="bg-white dark:bg-slate-900">{p}</option>
                     ))}
                   </select>

                   {periode === 'Bulanan' && (
                     <>
                       <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                       <select 
                         value={selectedMonth} 
                         onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                         className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                       >
                         {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                           <option key={m} value={i} className="bg-white dark:bg-slate-900">{m}</option>
                         ))}
                       </select>
                     </>
                   )}

                   {periode === 'Triwulan' && (
                     <>
                       <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                       <select 
                         value={selectedQuarter} 
                         onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                         className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                       >
                         {["Triwulan 1", "Triwulan 2", "Triwulan 3", "Triwulan 4"].map((q, i) => (
                           <option key={q} value={i} className="bg-white dark:bg-slate-900">{q}</option>
                         ))}
                       </select>
                     </>
                   )}

                   {periode === 'Semester' && (
                     <>
                       <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                       <select 
                         value={selectedSemester} 
                         onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                         className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                       >
                         {["Semester 1", "Semester 2"].map((s, i) => (
                           <option key={s} value={i} className="bg-white dark:bg-slate-900">{s}</option>
                         ))}
                       </select>
                     </>
                   )}

                   <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                   <select 
                     value={selectedYear} 
                     onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                     className="bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-white pr-2 cursor-pointer"
                   >
                     {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                       <option key={y} value={y} className="bg-white dark:bg-slate-900">{y}</option>
                     ))}
                   </select>
                </div>
              </div>
            </div>

            {/* Navigation Filter Kategori & Sub */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-2 shadow-lg dark:shadow-[0_0_40px_rgba(0,0,0,0.2)]">
               <div className="flex flex-wrap items-center gap-2">
                 {CATEGORIES.map(cat => (
                   <button
                     key={cat}
                     onClick={() => { setKategori(cat); setSubKategori((SUB_CATEGORIES as any)[cat]?.[0] || null); }}
                     className={`px-5 py-3 rounded-2xl text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all \${
                       kategori === cat 
                         ? 'bg-blue-600 text-white shadow-md' 
                         : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
               
               <AnimatePresence>
                 {(SUB_CATEGORIES as any)[kategori] && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-2 overflow-hidden"
                   >
                     {(SUB_CATEGORIES as any)[kategori].map((sub: string) => (
                       <button
                         key={sub}
                         onClick={() => setSubKategori(sub)}
                         className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 \${
                           subKategori === sub 
                             ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                             : 'border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                         }`}
                       >
                         {subKategori === sub && <CheckCircle2 className="w-3 h-3" />}
                         {sub}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Indicator Grid */}
            <div className="pt-4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1,2,3,4,5,6].map(n => <div key={n} className="h-56 bg-white dark:bg-white/5 rounded-3xl animate-pulse"></div>)}
                </div>
              ) : displayedIndicators.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center bg-white/50 dark:bg-[#111827]/50 rounded-3xl border border-slate-200 dark:border-white/5">
                  <Filter className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kategori Belum Tersedia</h3>
                  <p className="text-sm font-medium text-slate-500">Silakan pilih kategori lain yang tersedia.</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {displayedIndicators.map((ind, idx) => (
                    <motion.div
                      key={ind.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <SummaryCard
                        indicator={ind}
                        stats={statsMap.get(ind.id)}
                        onClick={() => setSelectedIndicator(ind.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

          </motion.div>
        )}

        {selectedIndicator && (
          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            
            {/* Header Detail View */}
            <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-lg sticky top-6 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <button onClick={handleBack} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300">
                   <ArrowLeft className="w-5 h-5" />
                 </button>
                 <div>
                   <h1 className="text-xl sm:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase leading-none">
                     {selectedData?.title}
                   </h1>
                   <div className="flex items-center gap-2 mt-2 font-medium text-[11px] text-slate-500 uppercase tracking-widest">
                     <span>{selectedData?.cat}</span>
                     {selectedData?.subcat && (
                       <>
                         <ChevronRight className="w-3 h-3" />
                         <span>{selectedData.subcat}</span>
                       </>
                     )}
                   </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-3 self-end md:self-auto">
                 <div className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center gap-2">
                   <Calendar className="w-4 h-4" /> Periode: {periode}
                 </div>
                 <button className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-colors flex items-center justify-center group" title="Export Excel">
                   <FileSpreadsheet className="w-5 h-5" />
                 </button>
               </div>
            </div>

            {/* Dynamic Report Content */}
            <div className="pt-2">
              {selectedIndicator === 'audit_hand_hygiene' ? (
                 <HandHygieneReport filters={{ searchQuery: '', periode: startDateISO, type: periode }} />
              ) : selectedIndicator === 'audit_apd' ? (
                 <ApdReport filters={{ searchQuery: '', periode: startDateISO, type: periode }} />
              ) : (
                 <GenericAuditReport 
                    tableName={selectedIndicator}
                    indicatorItems={genericAuditConfigs[selectedIndicator]?.items || []}
                    title={selectedData?.title || 'Laporan'}
                    filters={{ searchQuery: '', periode: startDateISO, type: periode }}
                  />
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

ReportsPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

;
