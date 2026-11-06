import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BarChart3, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportNavTabs() {
  const router = useRouter();
  const currentPath = router.pathname;

  const isResmi = currentPath.startsWith('/dashboard/reports/resmi');
  const isAudit = !isResmi && currentPath.startsWith('/dashboard/reports');

  return (
    <div className="w-full mb-6 print:hidden">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 sm:p-2 bg-[#12132b]/80 border border-indigo-900/40 backdrop-blur-md rounded-2xl shadow-[-3px_-3px_10px_rgba(140,165,255,0.06),4px_6px_16px_rgba(0,0,0,0.5)]">
        {/* Tab Buttons */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1">
          {/* Tab 1: Rekap Laporan PPI */}
          <Link
            href="/dashboard/reports"
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 relative ${
              isAudit
                ? 'bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-blue-700/30 text-white border border-blue-400/40 shadow-[-2px_-2px_6px_rgba(140,165,255,0.1),3px_4px_12px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${isAudit ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="truncate">Rekap Laporan PPI</span>
          </Link>

          {/* Tab 2: Laporan PPI */}
          <Link
            href="/dashboard/reports/resmi"
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 relative ${
              isResmi
                ? 'bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-blue-700/30 text-white border border-blue-400/40 shadow-[-2px_-2px_6px_rgba(140,165,255,0.1),3px_4px_12px_rgba(0,0,0,0.5)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <FileText className={`w-4 h-4 ${isResmi ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span className="truncate">Laporan PPI</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
