import React from 'react';

export function ReportSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Selection Row Skeleton */}
      <div className="bg-white dark:bg-[#111827]/80 backdrop-blur-sm rounded-[2rem] p-4 sm:p-6 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="flex-1 w-full">
          <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded mb-2"></div>
          <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="flex-1 w-full">
          <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded mb-2"></div>
          <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>

      {/* Report Card Skeleton */}
      <div className="p-4 md:p-6 break-inside-avoid w-full max-w-[800px] mx-auto bg-white mb-8 border border-slate-200 dark:border-white/10 rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
        
        {/* Title */}
        <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded mx-auto mb-6"></div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>

        {/* Table */}
        <div className="space-y-2 mb-8">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded col-span-1"></div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded col-span-1"></div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded col-span-1"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-white/10 animate-pulse">
      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
      <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded w-full"></div>
    </div>
  );
}
