import React, { ReactElement, useState, useEffect, useMemo } from "react";
import Head from "next/head";
import {
  Shield,
  Activity,
  Package,
  GraduationCap,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

// Define the modules statically to maintain the layout configuration
const STATIC_MODULES = [
  {
    id: "kewaspadaan-isolasi",
    title: "Kewaspadaan Isolasi",
    desc: "Audit Kewaspadaan Standar, Transmisi & Monitoring lainnya",
    icon: Shield,
    colorTheme: {
      bgActive: "bg-gradient-to-r from-[#2563EB] to-[#1D4ED8]",
      textActive: "text-blue-400",
      shadowActive: "shadow-[0_12px_24px_-6px_rgba(37,99,235,0.45)]",
      btnHoverBg: "group-hover:bg-[#2563EB]",
      watermark: "text-blue-500/10",
      progressColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
      mainIconBox: "bg-gradient-to-br from-blue-500/25 via-[#232752] to-[#141634] border border-blue-400/30 text-blue-400 shadow-[-3px_-3px_8px_rgba(100,150,255,0.15),5px_5px_14px_rgba(0,0,0,0.55),inset_1px_1px_1.5px_rgba(255,255,255,0.2)]",
      colBorder: "border-blue-400/20 group-hover:border-blue-400/35",
      colIconBox: "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/25 text-blue-400 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),2px_2px_5px_rgba(0,0,0,0.35)]"
    },
    href: "/dashboard/input/isolasi",
    standard: 85,
    operator: ">=",
  },
  {
    id: "surveilans-hais",
    title: "Surveilans HAIs",
    desc: "Input kasus Phlebitis, ISK, IDO, VAP",
    icon: Activity,
    colorTheme: {
      bgActive: "bg-gradient-to-r from-[#10B981] to-[#059669]",
      textActive: "text-emerald-400",
      shadowActive: "shadow-[0_12px_24px_-6px_rgba(16,185,129,0.45)]",
      btnHoverBg: "group-hover:bg-[#10B981]",
      watermark: "text-emerald-500/10",
      progressColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      mainIconBox: "bg-gradient-to-br from-emerald-500/25 via-[#1d2d46] to-[#141634] border border-emerald-400/30 text-emerald-400 shadow-[-3px_-3px_8px_rgba(100,255,180,0.15),5px_5px_14px_rgba(0,0,0,0.55),inset_1px_1px_1.5px_rgba(255,255,255,0.2)]",
      colBorder: "border-emerald-400/20 group-hover:border-emerald-400/35",
      colIconBox: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-400/25 text-emerald-400 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),2px_2px_5px_rgba(0,0,0,0.35)]"
    },
    href: "/dashboard/input/surveilans",
    standard: 1.5,
    operator: "<=",
  },
  {
    id: "bundles-hais",
    title: "Monitoring Bundles HAIs",
    desc: "Monitoring kepatuhan bundle HAIs",
    icon: Package,
    colorTheme: {
      bgActive: "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9]",
      textActive: "text-purple-400",
      shadowActive: "shadow-[0_12px_24px_-6px_rgba(124,58,237,0.45)]",
      btnHoverBg: "group-hover:bg-[#7C3AED]",
      watermark: "text-purple-500/10",
      progressColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
      mainIconBox: "bg-gradient-to-br from-purple-500/25 via-[#2b224e] to-[#141634] border border-purple-400/30 text-purple-400 shadow-[-3px_-3px_8px_rgba(180,120,255,0.15),5px_5px_14px_rgba(0,0,0,0.55),inset_1px_1px_1.5px_rgba(255,255,255,0.2)]",
      colBorder: "border-purple-400/20 group-hover:border-purple-400/35",
      colIconBox: "bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/25 text-purple-400 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),2px_2px_5px_rgba(0,0,0,0.35)]"
    },
    href: "/dashboard/input/bundles",
    standard: 90,
    operator: ">=",
  },
  {
    id: "diklat",
    title: "Pendidikan & Pelatihan Staff",
    desc: "Input dokumentasi Pendidikan & Pelatihan Staff",
    icon: GraduationCap,
    colorTheme: {
      bgActive: "bg-gradient-to-r from-[#F59E0B] to-[#D97706]",
      textActive: "text-amber-400",
      shadowActive: "shadow-[0_12px_24px_-6px_rgba(245,158,11,0.45)]",
      btnHoverBg: "group-hover:bg-[#F59E0B]",
      watermark: "text-amber-500/10",
      progressColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      mainIconBox: "bg-gradient-to-br from-amber-500/25 via-[#34293f] to-[#141634] border border-amber-400/30 text-amber-400 shadow-[-3px_-3px_8px_rgba(255,200,100,0.15),5px_5px_14px_rgba(0,0,0,0.55),inset_1px_1px_1.5px_rgba(255,255,255,0.2)]",
      colBorder: "border-amber-400/20 group-hover:border-amber-400/35",
      colIconBox: "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/25 text-amber-400 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),2px_2px_5px_rgba(0,0,0,0.35)]"
    },
    href: "/dashboard/input/diklat",
    standard: 80,
    operator: ">=",
  },
];

export default function InputIndexPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filterPeriodType, setFilterPeriodType] = useState<
    "bulanan" | "triwulan" | "semester" | "tahunan"
  >("bulanan");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterQuarter, setFilterQuarter] = useState(
    Math.floor(new Date().getMonth() / 3),
  );
  const [filterSemester, setFilterSemester] = useState(
    Math.floor(new Date().getMonth() / 6),
  );

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase.from("audit_sessions").select("*");
      if (!error && data) {
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const chan = supabase
      .channel("audit_sessions_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_sessions" },
        () => {
          // Debounce or fetch straight away for realtime
          fetchSessions();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(chan);
    };
  }, []);

  const isDateMatch = (
    dateStr: string,
    periodType: string,
    month: number,
    quarter: number,
    semester: number,
    year: number,
  ) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (d.getFullYear() !== year) return false;
    if (periodType === "bulanan") return d.getMonth() === month;
    if (periodType === "triwulan")
      return Math.floor(d.getMonth() / 3) === quarter;
    if (periodType === "semester")
      return Math.floor(d.getMonth() / 6) === semester;
    return true; // tahunan
  };

  const modules = useMemo(() => {
    const getPreviousPeriodParams = () => {
      let prevYear = filterYear;
      let prevMonth = filterMonth;
      let prevQuarter = filterQuarter;
      let prevSemester = filterSemester;

      if (filterPeriodType === "bulanan") {
        if (prevMonth === 0) {
          prevMonth = 11;
          prevYear--;
        } else {
          prevMonth--;
        }
      } else if (filterPeriodType === "triwulan") {
        if (prevQuarter === 0) {
          prevQuarter = 3;
          prevYear--;
        } else {
          prevQuarter--;
        }
      } else if (filterPeriodType === "semester") {
        if (prevSemester === 0) {
          prevSemester = 1;
          prevYear--;
        } else {
          prevSemester--;
        }
      } else if (filterPeriodType === "tahunan") {
        prevYear--;
      }
      return { prevYear, prevMonth, prevQuarter, prevSemester };
    };

    const prevParams = getPreviousPeriodParams();

    const currSessions = sessions.filter((s) => {
      return isDateMatch(
        s.tanggal_waktu || s.created_at,
        filterPeriodType,
        filterMonth,
        filterQuarter,
        filterSemester,
        filterYear,
      );
    });

    const prevSessions = sessions.filter((s) => {
      return isDateMatch(
        s.tanggal_waktu || s.created_at,
        filterPeriodType,
        prevParams.prevMonth,
        prevParams.prevQuarter,
        prevParams.prevSemester,
        prevParams.prevYear,
      );
    });

    const calculateStats = (data: any[], indIds: string[]) => {
      const filtered = data.filter((d) =>
        indIds.some((id) => d.indikator_id?.includes(id)),
      );
      const totalDinilai = filtered.reduce(
        (acc, curr) => acc + (curr.jumlah_dinilai || 0),
        0,
      );
      const totalPatuh = filtered.reduce(
        (acc, curr) => acc + (curr.jumlah_patuh || 0),
        0,
      );
      const persentase =
        totalDinilai > 0 ? (totalPatuh / totalDinilai) * 100 : 0;
      const avgPersentase =
        filtered.length > 0
          ? filtered.reduce((acc, curr) => acc + (curr.persentase || 0), 0) /
            filtered.length
          : 0;
      return {
        records: filtered.length,
        totalDinilai,
        totalPatuh,
        persentase,
        avgPersentase,
      };
    };

    return STATIC_MODULES.map((mod) => {
      let curr: any = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
        standarFilled: 0,
        transmisiFilled: 0,
        monitoringFilled: 0,
      };
      let prev: any = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
        standarFilled: 0,
        transmisiFilled: 0,
        monitoringFilled: 0,
      };

      if (mod.id === "kewaspadaan-isolasi") {
        const standarIds = [
          "audit_hand_hygiene", "audit_apd", "dekontaminasi_alat", 
          "pengendalian_lingkungan", "pengelolaan_limbah_medis", 
          "pengelolaan_limbah_tajam", "penatalaksanaan_linen", 
          "perlindungan_petugas", "penempatan_pasien", 
          "etika_batuk", "penyuntikan_aman"
        ];
        const transmisiIds = [
          "monitoring_ppi_ruang_isolasi", "ppi_ruang_isolasi", 
          "monitoring_airborne", "monitoring_immuno"
        ];
        const monitoringIds = [
          "monitoring_fasilitas_hand_hygiene", "monitoring_fasilitas_apd", 
          "monitoring_ibs", "monitoring_cssd", "monitoring_laboratorium", 
          "monitoring_radiologi", "monitoring_farmasi", "monitoring_gizi", 
          "monitoring_jenazah", "monitoring_ambulance", "monitoring_tps", 
          "monitoring_tunggu"
        ];
        
        const calcIso = (data: any[]) => {
            const standarSet = new Set(data.filter(d => standarIds.some(id => d.indikator_id?.includes(id))).map(d => standarIds.find(id => d.indikator_id?.includes(id))));
            const transmisiSet = new Set(data.filter(d => transmisiIds.some(id => d.indikator_id?.includes(id))).map(d => transmisiIds.find(id => d.indikator_id?.includes(id))));
            const monitoringSet = new Set(data.filter(d => monitoringIds.some(id => d.indikator_id?.includes(id))).map(d => monitoringIds.find(id => d.indikator_id?.includes(id))));
            
            const standarSize = Math.min(standarSet.size, 10);
            const totalFilled = standarSize + transmisiSet.size + monitoringSet.size;
            const totalExpected = 10 + 4 + 12; // 26
            
            return {
                records: data.length,
                totalDinilai: totalExpected,
                totalPatuh: totalFilled,
                persentase: (totalFilled / totalExpected) * 100,
                avgPersentase: 0,
                standarFilled: standarSize,
                transmisiFilled: transmisiSet.size,
                monitoringFilled: monitoringSet.size,
            };
        };

        curr = calcIso(currSessions);
        prev = calcIso(prevSessions);
      } else if (mod.id === "surveilans-hais") {
        curr = calculateStats(currSessions, ["surveilans"]);
        prev = calculateStats(prevSessions, ["surveilans"]);
      } else if (mod.id === "bundles-hais") {
        curr = calculateStats(currSessions, ["bundles"]);
        prev = calculateStats(prevSessions, ["bundles"]);
      } else if (mod.id === "diklat") {
        curr = calculateStats(currSessions, ["diklat"]);
        prev = calculateStats(prevSessions, ["diklat"]);
      }

      // Handle the different display semantics
      let finalPersentase = curr.persentase;
      let finalPrevPersentase = prev.persentase;
      let diff = 0;
      let valLabel = "PATUH";
      let statCountLabel = "Total Audit";
      let statCountVal = curr.totalDinilai.toString();
      let statPatuhLabel = "Patuh";
      let statPatuhVal = curr.totalPatuh.toString();
      let isTerpenuhi = false;

      if (mod.id === "kewaspadaan-isolasi") {
        valLabel = "TERPENUHI";
        isTerpenuhi = curr.totalPatuh >= curr.totalDinilai;
      } else if (mod.id === "surveilans-hais") {
        finalPersentase = curr.avgPersentase;
        finalPrevPersentase = prev.avgPersentase;
        diff = finalPersentase - finalPrevPersentase;
        valLabel = "RATE";
        statCountLabel = "Tindakan";
        statPatuhLabel = "Insiden HAIs";
        statPatuhVal = (curr.totalDinilai - curr.totalPatuh).toString(); // total dinilai - patuh is insiden count
      } else if (mod.id === "diklat") {
        // Diklat PPI => Kegiatan
        finalPersentase = curr.records > 0 ? 100 : 0; // If any activities, 100% terlaksana? Just fallback logic
        const expectedActivities = 4; // Mock standard activities
        finalPersentase = Math.min(
          (curr.records / expectedActivities) * 100,
          100,
        );
        finalPrevPersentase = Math.min(
          (prev.records / expectedActivities) * 100,
          100,
        );
        diff = finalPersentase - finalPrevPersentase;
        valLabel = "TERLAKSANA";
        statCountLabel = "Total Kegiatan";
        statCountVal = curr.records.toString();
        statPatuhLabel = "Peserta";
        statPatuhVal = curr.totalDinilai.toString(); // We used dinilai for peserta count
      } else {
        diff = finalPersentase - finalPrevPersentase;
      }

      const isTrendUp = diff > 0;
      const trendText = `${Math.abs(diff).toFixed(1)}% dari sebelumnya`;
      const passStandard =
        mod.operator === ">="
          ? finalPersentase >= mod.standard
          : finalPersentase <= mod.standard;

      // Progress Bar Logic
      let progressColor = mod.colorTheme.progressColor;
      if (mod.id !== "surveilans-hais") {
        if (finalPersentase >= 85) progressColor = "bg-emerald-500";
        else if (finalPersentase >= 70) progressColor = "bg-amber-500";
        else progressColor = "bg-red-500";
      } else {
        if (finalPersentase <= 1.5) progressColor = "bg-emerald-500";
        else if (finalPersentase <= 2.5) progressColor = "bg-amber-500";
        else progressColor = "bg-red-500";
      }

      // Format count text
      let mainCount = curr.totalDinilai.toString();
      if (mod.id === "kewaspadaan-isolasi")
        mainCount = curr.totalPatuh.toString();
      if (mod.id === "surveilans-hais")
        mainCount = (curr.totalDinilai - curr.totalPatuh).toString();
      if (mod.id === "diklat") mainCount = curr.records.toString();

      let subStatsArray = [
        {
          label: statCountLabel,
          value: statCountVal,
          icon: mod.icon,
          iconColor: mod.colorTheme.colIconBox,
        },
        {
          label: statPatuhLabel,
          value: statPatuhVal,
          icon: CheckCircle2,
          iconColor: passStandard 
            ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
            : "bg-red-500/5 dark:bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400",
        },
        {
          label: "Trend",
          value: `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`,
          icon: isTrendUp ? TrendingUp : TrendingDown,
          iconColor: mod.colorTheme.colIconBox,
        },
      ];

      if (mod.id === "kewaspadaan-isolasi") {
        subStatsArray = [
          {
            label: "Standar",
            value: `${curr.standarFilled}/10`,
            icon: ShieldCheck,
            iconColor: mod.colorTheme.colIconBox,
          },
          {
            label: "Transmisi",
            value: `${curr.transmisiFilled}/4`,
            icon: ShieldAlert,
            iconColor: mod.colorTheme.colIconBox,
          },
          {
            label: "Monitoring",
            value: `${curr.monitoringFilled}/12`,
            icon: Activity,
            iconColor: mod.colorTheme.colIconBox,
          },
        ];
      }

      return {
        ...mod,
        passStandard: mod.id === "kewaspadaan-isolasi" ? isTerpenuhi : passStandard,
        computed: {
          standardLabel: mod.id === "kewaspadaan-isolasi" ? (isTerpenuhi ? "SUDAH TERPENUHI" : "BELUM TERPENUHI") : (passStandard ? "DI ATAS STANDAR" : "DI BAWAH STANDAR"),
          mainCount,
          mainLabel: `${finalPersentase.toFixed(1)}% ${valLabel}`,
          trendUp: isTrendUp,
          trendColor:
            mod.id === "surveilans-hais"
              ? isTrendUp
                ? "text-red-500"
                : "text-emerald-500"
              : isTrendUp
                ? "text-emerald-500"
                : "text-red-500",
          trendText,
          progress: Math.min(Math.max(finalPersentase, 0), 100),
          progressColor,
          subStats: subStatsArray,
        },
      };
    });
  }, [
    sessions,
    filterPeriodType,
    filterMonth,
    filterYear,
    filterQuarter,
    filterSemester,
  ]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  return (
    <div className="space-y-6 pb-20">
      <Head>
        <title>Input Data - SMART PPI</title>
      </Head>

      <div className="mb-2 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left w-full sm:w-auto shrink-0">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">
            Input Data SMART PPI
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Input Data Monitoring PPI Terintegrasi
          </p>
        </div>

        {/* Filter Periode - 3D Tactile Neumorphic Container */}
        <div className="relative group w-full lg:w-auto">
          <div className="relative bg-[#18193b] rounded-[24px] p-2.5 sm:p-3 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
            {/* Top Bevel Specular Highlight */}
            <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 relative z-10">
              {/* Neumorphic Capsule Badge */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                  PERIODE
                </span>
              </div>

              {/* Tipe Periode - Recessed Neumorphic Well */}
              <div className="relative">
                <select
                  value={filterPeriodType}
                  onChange={(e) => setFilterPeriodType(e.target.value as any)}
                  className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] capitalize"
                >
                  <option value="bulanan" className="bg-[#18193b] text-white">Bulanan</option>
                  <option value="triwulan" className="bg-[#18193b] text-white">Triwulan</option>
                  <option value="semester" className="bg-[#18193b] text-white">Semester</option>
                  <option value="tahunan" className="bg-[#18193b] text-white">Tahunan</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Sub Periode - Recessed Neumorphic Well */}
              {filterPeriodType === "bulanan" && (
                <div className="relative">
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i} className="bg-[#18193b] text-white">{m}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {filterPeriodType === "triwulan" && (
                <div className="relative">
                  <select
                    value={filterQuarter}
                    onChange={(e) => setFilterQuarter(parseInt(e.target.value))}
                    className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                  >
                    <option value={0} className="bg-[#18193b] text-white">TW 1 (Jan-Mar)</option>
                    <option value={1} className="bg-[#18193b] text-white">TW 2 (Apr-Jun)</option>
                    <option value={2} className="bg-[#18193b] text-white">TW 3 (Jul-Sep)</option>
                    <option value={3} className="bg-[#18193b] text-white">TW 4 (Okt-Des)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {filterPeriodType === "semester" && (
                <div className="relative">
                  <select
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(parseInt(e.target.value))}
                    className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                  >
                    <option value={0} className="bg-[#18193b] text-white">SM 1 (Jan-Jun)</option>
                    <option value={1} className="bg-[#18193b] text-white">SM 2 (Jul-Des)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* Tahun - Recessed Neumorphic Well */}
              <div className="relative">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value))}
                  className="bg-[#12132e] border border-indigo-900/40 text-slate-200 text-xs sm:text-sm font-bold rounded-xl pl-3.5 pr-8 py-2 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                >
                  <option value={2026} className="bg-[#18193b] text-white">2026</option>
                  <option value={2025} className="bg-[#18193b] text-white">2025</option>
                  <option value={2024} className="bg-[#18193b] text-white">2024</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {modules.map((mod, i) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex h-full w-full"
          >
            <Link
              href={mod.href}
              prefetch={false}
              className="relative group p-6 sm:p-7 rounded-[30px] bg-gradient-to-br from-[#241e4a]/85 via-[#1b1c3e]/80 to-[#12132d]/90 backdrop-blur-2xl border border-indigo-200/15 flex flex-col overflow-hidden shadow-[-8px_-8px_24px_rgba(130,145,230,0.07),14px_14px_32px_rgba(0,0,0,0.65),inset_1.5px_1.5px_2px_rgba(255,255,255,0.12),inset_-1.5px_-1.5px_2px_rgba(0,0,0,0.35)] hover:-translate-y-2 hover:border-indigo-200/30 hover:shadow-[-12px_-12px_28px_rgba(130,145,230,0.12),20px_20px_42px_rgba(0,0,0,0.75),inset_1.5px_1.5px_2.5px_rgba(255,255,255,0.18)] transition-all duration-300 ease-out transform-gpu w-full"
            >
              {/* Top Neumorphic Specular Highlight Bevel */}
              <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

              {/* Background gradient hint */}
              <div
                className={`absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none rounded-bl-full filter blur-3xl transition-opacity duration-700 group-hover:opacity-25 ${mod.colorTheme.bgActive}`}
              />

              <div className="flex justify-between items-start gap-4 mb-6 relative z-10 flex-1">
                <div className="flex gap-4 flex-1 min-w-0 items-center">
                  {/* Neumorphic Extruded Convex Icon Box */}
                  <div
                    className={`w-14 h-14 rounded-[20px] flex flex-shrink-0 items-center justify-center ${mod.colorTheme.mainIconBox}`}
                  >
                    <mod.icon
                      className="w-7 h-7"
                      strokeWidth={2.3}
                    />
                  </div>
                  <div className="pt-0.5 flex-1 min-w-0">
                    <h2 className="text-[clamp(18px,2vw,24px)] font-bold text-white leading-tight mb-1 group-hover:text-indigo-200 transition-colors break-words whitespace-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                      {mod.title}
                    </h2>
                    <p className="text-[clamp(12px,1.2vw,14px)] text-slate-300/80 font-medium break-words whitespace-normal leading-snug">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Block */}
              <div className="flex justify-between items-end mb-5">
                <div>
                  <div
                    className={`text-4xl sm:text-5xl font-black ${mod.colorTheme.textActive} leading-none mb-1 drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)]`}
                  >
                    {mod.computed.mainCount}
                  </div>
                  <div
                    className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${mod.colorTheme.textActive}`}
                  >
                    {mod.computed.mainLabel}
                  </div>
                </div>
                {/* Neumorphic Raised Status Badge */}
                <div
                  className={`inline-flex max-w-fit px-3.5 py-1.5 rounded-full items-center justify-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em] bg-gradient-to-br from-[#1e1c3c] to-[#111226] border shadow-[-2px_-2px_6px_rgba(255,255,255,0.05),3px_3px_8px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.1)] ${mod.passStandard ? "border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]" : "border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]"}`}
                >
                  {mod.computed.standardLabel || (mod.passStandard ? "DI ATAS STANDAR" : "DI BAWAH STANDAR")}
                </div>
              </div>

              {/* Progress Bar Container - Neumorphic Sunken Groove */}
              <div className="mb-6 relative z-10 w-full shrink-0">
                <div className="flex justify-between items-center mb-1.5 px-0.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <span>Progress Realtime</span>
                  <span className="text-slate-300 font-semibold">
                    {Math.round(mod.computed.progress)}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-[#0d0f22] rounded-full overflow-hidden p-[1px] border border-white/5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                  <div
                    className={`h-full rounded-full transition-all duration-[1200ms] shadow-[0_0_12px_currentColor,inset_0_1px_1px_rgba(255,255,255,0.4)] ${mod.computed.progressColor}`}
                    style={{ width: `${Math.max(mod.computed.progress, 2)}%` }}
                  />
                </div>
              </div>

              {/* Stats Bar - 3 Neumorphic Inset Wells */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6">
                {mod.computed.subStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center bg-gradient-to-b from-[#13152c]/90 to-[#181a38]/90 rounded-2xl py-3 px-2 border border-indigo-300/10 shadow-[inset_2.5px_2.5px_6px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(140,150,230,0.06),0_2px_4px_rgba(0,0,0,0.2)] group-hover:border-indigo-300/25 transition-all duration-200`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-xl ${stat.iconColor} mb-2 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),2px_2px_6px_rgba(0,0,0,0.4)]`}
                    >
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {stat.label}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button - Neumorphic Tactile CTA */}
              <div className="mt-0 pt-2 shrink-0">
                <div
                  className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] transition-all duration-300 ${mod.colorTheme.bgActive} text-white shadow-[-3px_-3px_8px_rgba(130,150,255,0.2),6px_8px_20px_rgba(0,0,0,0.5),inset_1px_1px_2px_rgba(255,255,255,0.35),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] hover:brightness-110 active:translate-y-0.5 active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.2)] ${mod.colorTheme.shadowActive}`}
                >
                  <span>INPUT SEKARANG</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

InputIndexPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
