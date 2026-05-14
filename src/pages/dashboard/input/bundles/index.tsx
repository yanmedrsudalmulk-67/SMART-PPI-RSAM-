import { Syringe, Droplets, Activity, Wind, ClipboardCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ReactElement } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

const bundlesCategories = [
  {
    category: 'Bundles PLABSI',
    icon: Syringe,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    items: [
      { id: 'plabsi-insersi', title: 'Bundles PLABSI Insersi' },
      { id: 'plabsi-maintenance', title: 'Bundles PLABSI Maintenance' }
    ]
  },
  {
    category: 'Bundles CAUTI',
    icon: Droplets,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    items: [
      { id: 'cauti-insersi', title: 'Bundles CAUTI Insersi' },
      { id: 'cauti-maintenance', title: 'Bundles CAUTI Maintenance' }
    ]
  },
  {
    category: 'Bundles IDO',
    icon: Activity,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    items: [
      { id: 'ido-pre-operasi', title: 'Bundles IDO Pre Operasi' },
      { id: 'ido-intra-operasi', title: 'Bundles IDO Intra Operasi' },
      { id: 'ido-post-operasi', title: 'Bundles IDO Post Operasi' }
    ]
  },
  {
    category: 'Bundles VAP',
    icon: Wind,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    items: [
      { id: 'vap-insersi', title: 'Bundles VAP Insersi' },
      { id: 'vap-maintenance', title: 'Bundles VAP Maintenance' }
    ]
  }
];

export default function BundlesMenuPage() {
  return (
    <div className="max-w-6xl mx-auto pb-28">
      <div className="flex items-center gap-4 mb-8 py-4 border-b border-white/5">
        <Link href="/dashboard/input" className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_10px_rgba(59,130,246,0.4)] from-blue-400 via-purple-500 to-blue-400">Bundles HAIs</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400 mt-1">Monitoring & Audit Kepatuhan</p>
        </div>
      </div>

      <div className="space-y-12">
        {bundlesCategories.map((group, gIdx) => (
          <motion.div key={group.category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gIdx * 0.1 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${group.bg}`}>
                <group.icon className={`w-5 h-5 ${group.color}`} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">{group.category}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((item, iDx) => (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (gIdx * 0.1) + (iDx * 0.05) }}
                  className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all"
                >
                  <div className="space-y-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-2xl inline-block group-hover:scale-110 transition-transform">
                      <ClipboardCheck className={`w-6 h-6 ${group.color}`} />
                    </div>
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  </div>

                  <Link href={`/dashboard/input/bundles/${item.id}`}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    INPUT DATA
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

BundlesMenuPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
