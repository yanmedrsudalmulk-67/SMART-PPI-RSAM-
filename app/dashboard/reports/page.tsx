'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Download, Calendar, Filter, FileSpreadsheet, FileIcon, Search,
  ArrowLeft, Activity, ShieldCheck, ClipboardCheck, GraduationCap, Info,
  ChevronRight, ChevronDown, MoreVertical, Wind, ShieldAlert, Truck, Users, Building2, User, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '@/lib/supabase';
import { useAppContext } from '@/components/providers';
import { format, parseISO } from 'date-fns';

const GenericAuditReport = dynamic(() => import('@/components/reports/GenericAuditReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat...</div>
});
const DekontaminasiAlatReport = dynamic(() => import('@/components/reports/DekontaminasiAlatReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat...</div>
});
const HandHygieneReport = dynamic(() => import('@/components/reports/HandHygieneReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat...</div>
});
const ApdReport = dynamic(() => import('@/components/reports/ApdReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat...</div>
});
const AirborneReport = dynamic(() => import('@/components/reports/AirborneReport'), {
  loading: () => <div className="h-96 flex items-center justify-center animate-pulse bg-white/5 rounded-3xl">Memuat...</div>
});

import { genericAuditConfigs } from '@/lib/audit-configs';

type ReportModule = 'hub' | 'isolasi' | 'surveilans' | 'bundles' | 'diklat';
type IsolasiCategory = 'Semua' | 'Standar' | 'Transmisi' | 'Monitoring';

const indicators: Record<string, any[]> = {
  isolasi: [
    { id: 'hh', name: 'Kepatuhan Kebersihan Tangan', category: 'Standar', standard: 85, compliance: 85, trend: '+2%', icon: Activity },
    { id: 'apd', name: 'Kepatuhan Penggunaan APD', category: 'Standar', standard: 100, compliance: 78, trend: '-5%', icon: ShieldCheck },
    { id: 'dekontaminasi_alat', name: 'Dekontaminasi Alat', category: 'Standar', standard: 100, compliance: 92, trend: '+1%', icon: ClipboardCheck },
    { id: 'pengendalian_lingkungan', name: 'Pengendalian Lingkungan', category: 'Standar', standard: 80, compliance: 88, trend: '+3%', icon: Building2 },
    { id: 'limbah_m', name: 'Pengelolaan Limbah Medis', category: 'Standar', standard: 100, compliance: 85, trend: '0%', icon: AlertTriangle },
    { id: 'limbah_t', name: 'Pengelolaan Limbah Tajam', category: 'Standar', standard: 100, compliance: 95, trend: '+5%', icon: AlertTriangle },
    { id: 'linen', name: 'Penatalaksanaan Linen', category: 'Standar', standard: 100, compliance: 65, trend: '-10%', icon: ClipboardCheck },
    { id: 'penyuntikan_aman', name: 'Penyuntikan Yang Aman', category: 'Standar', standard: 100, compliance: 98, trend: '+1%', icon: ShieldCheck },
    { id: 'perlindungan_petugas', name: 'Perlindungan Kesehatan Petugas', category: 'Standar', standard: 100, compliance: 90, trend: '+2%', icon: ShieldCheck },
    { id: 'etika_batuk', name: 'Etika Batuk', category: 'Standar', standard: 100, compliance: 92, trend: '+1%', icon: Activity },
    { id: 'penempatan_pasien', name: 'Penempatan Pasien', category: 'Standar', standard: 100, compliance: 100, trend: '0%', icon: User },
    { id: 'ppi_ruang_isolasi', name: 'PPI di Ruang Isolasi', category: 'Transmisi', standard: 100, compliance: 95, trend: '+2%', icon: ShieldAlert },
    { id: 'airborne', name: 'Penempatan Pasien Airborne', category: 'Transmisi', standard: 100, compliance: 95, trend: '+2%', icon: Wind },
    { id: 'immuno', name: 'Penempatan Pasien Immunocompromised', category: 'Transmisi', standard: 100, compliance: 96, trend: '+1%', icon: ShieldCheck },
    { id: 'fasilitas_hh', name: 'Fasilitas Kebersihan Tangan', category: 'Monitoring', standard: 100, compliance: 92, trend: '+0%', icon: Activity },
    { id: 'fasilitas_apd', name: 'Fasilitas APD', category: 'Monitoring', standard: 100, compliance: 85, trend: '-2%', icon: ShieldCheck },
    { id: 'farmasi', name: 'Farmasi', category: 'Monitoring', standard: 100, compliance: 98, trend: '+1%', icon: Building2 },
    { id: 'ruangan_ibs', name: 'Instalasi Bedah Sentral (IBS)', category: 'Monitoring', standard: 100, compliance: 95, trend: '+4%', icon: Activity },
    { id: 'ambulance', name: 'Ambulance', category: 'Monitoring', standard: 100, compliance: 90, trend: '+0%', icon: Truck },
    { id: 'tps', name: 'Tempat Pembuangan Sampah (TPS)', category: 'Monitoring', standard: 100, compliance: 85, trend: '+1%', icon: AlertTriangle },
    { id: 'tunggu', name: 'Ruang Tunggu', category: 'Monitoring', standard: 100, compliance: 88, trend: '+2%', icon: Users },
  ],
  surveilans: [
    { id: 'phl', name: 'Surveilans Phlebitis', standard: 5, rate: 2.4, trend: '-0.2', type: '‰', icon: Activity },
    { id: 'isk', name: 'Surveilans CAUTI (ISK)', standard: 4.7, rate: 1.8, trend: '+0.5', type: '‰', icon: Activity },
    { id: 'vap', name: 'Surveilans VAP', standard: 5.8, rate: 3.1, trend: '-0.1', type: '‰', icon: Activity },
    { id: 'ido', name: 'Surveilans IDO', standard: 2, rate: 1.2, trend: '0.0', type: '%', icon: Activity },
  ],
  bundles: [
    { id: 'iadp', name: 'Bundles PLABSI', standard: 100, compliance: 94, trend: '+4%', icon: ShieldCheck },
    { id: 'cauti', name: 'Bundles CAUTI', standard: 100, compliance: 88, trend: '+2%', icon: ShieldCheck },
    { id: 'ido_b', name: 'Bundles IDO', standard: 100, compliance: 82, trend: '-3%', icon: ShieldCheck },
    { id: 'vap_b', name: 'Bundles VAP', standard: 100, compliance: 75, trend: '-5%', icon: ShieldCheck },
  ],
  diklat: [
    { id: 'sos', name: 'Sosialisasi PPI', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
    { id: 'ws', name: 'Workshop Hand Hygiene', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
    { id: 'sim', name: 'Simulasi BHD & PPI', standard: 100, compliance: 100, trend: '0%', icon: GraduationCap },
  ]
};

const StatCard = ({ title, value, subValue, icon: Icon, color, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -5 }} onClick={onClick}
    className="glass-card p-6 rounded-[2rem] border-white/5 shadow-xl cursor-pointer group relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full -z-10 bg-gradient-to-br ${color} opacity-20`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 text-white shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
    <p className="text-xs text-slate-400 line-clamp-2">{subValue}</p>
  </motion.div>
);

export default function ReportsPage() {
  const { userRole } = useAppContext();
  const [view, setView] = useState<ReportModule>('hub');
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [selectedIsolasiCat, setSelectedIsolasiCat] = useState<IsolasiCategory>('Semua');
  const [realtimeData, setRealtimeData] = useState<Record<string, { value: number, count: number }>>({});
  const supabase = getSupabase();
  const [unitFilter, setUnitFilter] = useState('Semua Unit');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('Bulanan');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredIndicators = useMemo(() => {
    let base = [];
    if (view === 'hub') base = [];
    else if (view !== 'isolasi') base = indicators[view] || [];
    else if (selectedIsolasiCat === 'Semua') base = indicators.isolasi || [];
    else base = (indicators.isolasi || []).filter(i => i.category === selectedIsolasiCat);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return base.filter(i => i.name.toLowerCase().includes(q));
    }
    return base;
  }, [view, selectedIsolasiCat, debouncedSearch]);

  const dateRange = useMemo(() => {
    const d = new Date(selectedDate);
    const y = d.getFullYear();
    const m = d.getMonth();
    const safeDateSplit = (dt: Date) => dt.toISOString().split('T')[0];
    
    if (period === 'Harian') return { from: selectedDate, to: selectedDate };
    if (period === 'Bulanan') return { from: safeDateSplit(new Date(y, m, 1)), to: safeDateSplit(new Date(y, m + 1, 0)) };
    if (period === 'Triwulan') {
       const q = Math.floor(m / 3);
       return { from: safeDateSplit(new Date(y, q * 3, 1)), to: safeDateSplit(new Date(y, (q + 1) * 3, 0)) };
    }
    if (period === 'Semester') {
       const h = m < 6 ? 0 : 6;
       return { from: safeDateSplit(new Date(y, h, 1)), to: safeDateSplit(new Date(y, h + 6, 0)) };
    }
    return { from: `\${y}-01-01`, to: `\${y}-12-31` };
  }, [selectedDate, period]);

  useEffect(() => {
    // only auto-select if nothing is selected and we are NOT in the hub. 
    // Wait, let's just NOT auto-select. We allow selectedIndicator to be null.
  }, [filteredIndicators]);

  useEffect(() => {
    const fetchRealtime = async () => {
      if (!filteredIndicators.length || view === 'hub') return;
      const results: Record<string, {value: number, count: number}> = {};
      
      const promises = filteredIndicators.map(async (ind) => {
        const config = genericAuditConfigs[ind.id];
        if (!config || !config.tableName) return;
        
        let sessionQuery = supabase.from('audit_sessions').select('*').eq('indikator_id', config.tableName);
        let tableQuery = supabase.from(config.tableName).select('*');
        if (config.extraFilter) {
          sessionQuery = sessionQuery.match(config.extraFilter);
          tableQuery = tableQuery.match(config.extraFilter);
        }
        
        const { data: sessionData } = await sessionQuery;
        let tableData = null;
        try {
          const { data } = await tableQuery;
          tableData = data;
        } catch (e) {
          tableData = null;
        }
        
        const rawData = [...(sessionData || []), ...(tableData || [])];
        const ids = new Set();
        const data = rawData.filter(d => {
           const key = d.id;
           if (key && ids.has(key)) return false;
           if (key) ids.add(key);
           return true; 
        });
        
        const error = null;
        if (!error && data) {
           const filtered = data.filter((row: any) => {
             const dtStr = String(row.waktu || row.tanggal_waktu || row.created_at || '').split('T')[0];
             if (dateRange && dtStr && dtStr !== 'undefined' && dtStr !== 'null') {
                if (dtStr < dateRange.from || dtStr > dateRange.to) return false;
             }
             if (unitFilter !== 'Semua Unit') {
                const u = row.unit || row.nama_ruangan || row.ruangan;
                if (u && u !== unitFilter) return false;
             }
             return true;
           });
           
           if (ind.id === 'hh') {
             let n = 0, d = 0;
             filtered.forEach((r: any) => { 
                n += Number(r.jumlah_patuh || r.patuh || 0); 
                d += Number(r.jumlah_peluang || r.peluang || r.jumlah_dinilai || r.dinilai || 0); 
             });
             results[ind.id] = { value: d > 0 ? Math.round((n/d)*100) : 0, count: filtered.length };
           } else if (ind.id === 'apd') {
             let n = 0, d = 0;
             filtered.forEach((r: any) => { 
                n += Number(r.jumlah_patuh || r.patuh || 0); 
                d += Number(r.jumlah_dinilai || r.dinilai || 0); 
             });
             results[ind.id] = { value: d > 0 ? Math.round((n/d)*100) : 0, count: filtered.length };
           } else {
             let n = 0, count = 0;
             filtered.forEach((r: any) => { 
                if (r.persentase !== undefined && r.persentase !== null) {
                   n += Number(r.persentase); count++; 
                } 
             });
             results[ind.id] = { value: count > 0 ? Math.round(n/count) : 0, count: filtered.length };
           }
        }
      });
      await Promise.all(promises);
      setRealtimeData(results);
    };
    fetchRealtime();
  }, [filteredIndicators, dateRange, unitFilter, supabase, view]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-32 px-4 sm:px-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          {(view !== 'hub' || selectedIndicator) && (
            <button onClick={() => selectedIndicator ? setSelectedIndicator(null) : setView('hub')} className="p-2.5 bg-white/5 rounded-xl hover:text-white transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
          )}
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-heading font-bold text-gradient">Laporan SMART PPI</h1>
          </div>
        </div>
      </div>

      {/* 2. Global Filters */}
      <div className="glass-card p-6 rounded-[2rem] border-white/5 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-white/5 p-4 rounded-xl text-white outline-none focus:border-blue-500 border border-white/5" />
          <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-white/5 p-4 rounded-xl text-white outline-none focus:border-blue-500 border border-white/5">
            {['Harian', 'Bulanan', 'Triwulan', 'Semester', 'Tahunan'].map(p => <option key={p} className="bg-slate-900" value={p}>{p}</option>)}
          </select>
          <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="bg-white/5 p-4 rounded-xl text-white outline-none focus:border-blue-500 border border-white/5">
            <option value="Semua Unit" className="bg-slate-900">Semua Unit</option>
            {['IGD', 'ICU', 'IBS', 'Ranap Aisyah', 'Ranap Khadijah', 'Poli'].map(u => <option key={u} className="bg-slate-900" value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'hub' && (
          <motion.div key="hub" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Kewaspadaan Isolasi" value="88%" subValue="Hand Hygiene, APD..." icon={ShieldCheck} color="from-blue-500" onClick={() => setView('isolasi')} />
            <StatCard title="Surveilans HAIs" value="2.1‰" subValue="Phlebitis, ISK..." icon={Activity} color="from-rose-500" onClick={() => setView('surveilans')} />
            <StatCard title="Monitoring Bundles" value="91%" subValue="Bundles IADP, CAUTI..." icon={ClipboardCheck} color="from-purple-500" onClick={() => setView('bundles')} />
            <StatCard title="Pendidikan & Pelatihan" value="12" subValue="Sosialisasi PPI..." icon={GraduationCap} color="from-emerald-500" onClick={() => setView('diklat')} />
          </motion.div>
        )}

        {view !== 'hub' && (
          <motion.div key="detail" className="space-y-8">
            {/* If no indicator is selected, show them as a nice grid */}
            <div className={selectedIndicator ? "flex gap-4 overflow-x-auto pb-8 snap-x" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
                 {filteredIndicators.map((ind: any) => {
                   const rt = realtimeData[ind.id];
                   const currentValue = rt && rt.count > 0 ? rt.value : ind.compliance || ind.rate;
                   const isActive = selectedIndicator === ind.id;
                   
                   return (
                     <button key={ind.id} onClick={() => setSelectedIndicator(ind.id)}
                       className={selectedIndicator 
                         ? `flex flex-col w-[80vw] sm:w-[35vw] p-8 rounded-3xl border transition-all text-left shrink-0 shadow-lg ${isActive ? 'bg-white border-blue-500/50 shadow-blue-500/30' : 'bg-slate-100 border-slate-300'}`
                         : `flex flex-col p-8 rounded-3xl border transition-all text-left shadow-lg bg-slate-100 border-slate-300 hover:-translate-y-1 hover:shadow-xl`
                       }>
                       <h4 className="text-xl font-black text-black">{ind.name}</h4>
                       <div className="mt-4 flex gap-2 items-baseline">
                         <span className="text-5xl font-black text-blue-600">{currentValue}</span>
                         <span className="text-xl text-blue-400">{ind.type || '%'}</span>
                       </div>
                     </button>
                   );
                 })}
            </div>

            {selectedIndicator === 'hh' ? <HandHygieneReport filters={{ dateRange, unitFilter, searchQuery }} /> :
             selectedIndicator === 'apd' ? <ApdReport filters={{ dateRange, unitFilter, searchQuery }} /> :
             selectedIndicator === 'dekontaminasi_alat' ? <DekontaminasiAlatReport filters={{ dateRange, unitFilter, searchQuery }} /> :
             selectedIndicator === 'airborne' ? <AirborneReport filters={{ dateRange, unitFilter, searchQuery }} /> :
             selectedIndicator && genericAuditConfigs[selectedIndicator] ? (
               <GenericAuditReport 
                  filters={{ dateRange, unitFilter, searchQuery }}
                  tableName={genericAuditConfigs[selectedIndicator].tableName}
                  indicatorItems={genericAuditConfigs[selectedIndicator].items || []}
                  title={indicators[view]?.find((i:any) => i.id === selectedIndicator)?.name || 'Laporan'}
                  extraFilter={(genericAuditConfigs[selectedIndicator] as any).extraFilter}
                />
             ) : (
                <div className="text-slate-400 p-8 text-center bg-white/5 rounded-3xl">Pilih indikator</div>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      
    </div>
  );
}
