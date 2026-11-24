import React, { useState, ReactElement } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { HardHat, Calculator } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import IcraProgramTab from '@/components/icra/IcraProgramTab';
import IcraConstructionTab from '@/components/icra/IcraConstructionTab';

type IcraTabType = 'program' | 'konstruksi';

export default function IcraPage() {
  const [activeTab, setActiveTab] = useState<IcraTabType>('program');

  return (
    <>
      <Head>
        <title>ICRA PPI - SMART PPI RSUD Al-Mulk</title>
      </Head>

      <div className="space-y-6 pb-20 sm:pb-8">
        {/* Header & Tab Switcher - 3D Neumorphic Bento Banner */}
        <div className="relative rounded-[32px] bg-gradient-to-b from-[#1c1e42] via-[#161836] to-[#11122a] border border-[#2c3060]/80 p-5 sm:p-7 shadow-[-8px_-8px_24px_rgba(140,165,255,0.06),16px_20px_45px_rgba(0,0,0,0.8),inset_1px_1.5px_2px_rgba(255,255,255,0.2),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Top Bevel Highlight Line */}
          <div className="absolute top-0 inset-x-12 h-[1.5px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none rounded-t-full" />
          
          {/* Corner Ambient Glow */}
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-2 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.3)]">
                Standar PMK 27/2017 & STARKES PPI
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-black tracking-tight leading-tight whitespace-nowrap flex flex-wrap items-baseline gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 uppercase font-black tracking-wider">
                  ICRA
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 italic font-bold text-xs sm:text-sm lg:text-base xl:text-lg">
                  (Infection Control Risk Assessment)
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl font-medium leading-relaxed">
                Penilaian prioritas risiko infeksi program tahunan & manajemen izin kerja konstruksi/renovasi bangunan UOBK RSUD Al-Mulk.
              </p>
            </div>

            {/* 2-Tab Selector - Neumorphic Inset Well */}
            <div className="flex items-center bg-[#0c0e24] p-1.5 rounded-[22px] border border-black/50 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] self-start lg:self-center shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('program')}
                className={`relative flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-[18px] text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'program'
                    ? 'bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 text-white shadow-[-3px_-3px_8px_rgba(255,255,255,0.2),4px_6px_16px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.4)]'
                    : 'text-white hover:text-white hover:bg-white/10'
                }`}
              >
                {activeTab === 'program' && (
                  <div className="absolute top-0 inset-x-4 h-[1px] bg-white/40 rounded-t-full pointer-events-none" />
                )}
                <Calculator className="w-4 h-4 text-white" />
                <span className={activeTab === 'program' ? 'text-white font-black' : 'text-white font-bold'}>ICRA Program PPI</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('konstruksi')}
                className={`relative flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-[18px] text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'konstruksi'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black shadow-[-3px_-3px_8px_rgba(255,255,255,0.25),4px_6px_16px_rgba(0,0,0,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.5)]'
                    : 'text-white hover:text-white hover:bg-white/10'
                }`}
              >
                {activeTab === 'konstruksi' && (
                  <div className="absolute top-0 inset-x-4 h-[1px] bg-white/50 rounded-t-full pointer-events-none" />
                )}
                <HardHat className={`w-4 h-4 ${activeTab === 'konstruksi' ? 'text-slate-950' : 'text-white'}`} />
                <span className={activeTab === 'konstruksi' ? 'text-slate-950 font-black' : 'text-white font-bold'}>ICRA Konstruksi & Renovasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'program' ? (
            <motion.div
              key="icra-program"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <IcraProgramTab />
            </motion.div>
          ) : (
            <motion.div
              key="icra-konstruksi"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <IcraConstructionTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

IcraPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
