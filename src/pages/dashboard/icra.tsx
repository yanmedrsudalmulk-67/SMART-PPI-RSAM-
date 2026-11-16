import React, { useState, ReactElement } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, HardHat, Calculator } from 'lucide-react';
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
        {/* Header & Tab Switcher */}
        <div className="rounded-3xl bg-gradient-to-br from-[#191b42] via-[#131535] to-[#0d0f26] border border-indigo-500/30 p-5 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.12)] relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-rose-500/25 via-indigo-500/20 to-cyan-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shadow-[0_8px_20px_rgba(0,0,0,0.5)] shrink-0">
                <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-1.5">
                  Standar PMK 27/2017 & STARKES PPI
                </div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
                  ICRA PPI (Infection Control Risk Assessment)
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl">
                  Penilaian prioritas risiko infeksi program tahunan & manajemen izin kerja konstruksi/renovasi bangunan UOBK RSUD Al-Mulk.
                </p>
              </div>
            </div>

            {/* 2-Tab Selector */}
            <div className="flex items-center bg-[#0b0d22] p-1.5 rounded-2xl border border-indigo-800/50 shadow-inner self-start lg:self-center shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('program')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'program'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_4px_14px_rgba(6,182,212,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>ICRA Program PPI</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('konstruksi')}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'konstruksi'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_4px_14px_rgba(245,158,11,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <HardHat className="w-4 h-4" />
                <span>ICRA Konstruksi & Renovasi</span>
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
