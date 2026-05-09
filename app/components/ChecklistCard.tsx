'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, X, Minus } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  color?: 'blue' | 'red' | 'slate' | 'emerald';
}

interface ChecklistCardProps {
  id: number;
  index: number;
  label: string;
  selectedValue?: string;
  onChange: (id: number, value: any) => void;
  options: Option[];
}

export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  id,
  index,
  label,
  selectedValue,
  onChange,
  options
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold shrink-0 border border-blue-500/20">
              {index + 1}
            </span>
            <p className="text-[14px] leading-relaxed text-slate-200 font-medium group-hover:text-white transition-colors pt-0.5">
              {label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {options.map((opt) => {
            const isActive = selectedValue === opt.value;
            
            let colorClasses = "";
            let icon = null;

            if (opt.value === 'Ya') {
              colorClasses = isActive 
                ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30";
              icon = <Check className="w-3.5 h-3.5" />;
            } else if (opt.value === 'Tidak') {
              colorClasses = isActive 
                ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]" 
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30";
              icon = <X className="w-3.5 h-3.5" />;
            } else {
              colorClasses = isActive 
                ? "bg-slate-600 text-white border-slate-500" 
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-slate-500/20 hover:text-slate-300 hover:border-slate-500/30";
              icon = <Minus className="w-3.5 h-3.5" />;
            }

            return (
              <button
                key={opt.value}
                onClick={() => onChange(id, opt.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all duration-300
                  ${colorClasses}
                `}
              >
                {icon}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
