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
    desc: "Audit Kewaspadaan Standar & Transmisi",
    icon: Shield,
    colorTheme: {
      bgActive: "bg-[#2563EB]",
      textActive: "text-[#2563EB]",
      shadowActive: "shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)]",
      btnHoverBg: "group-hover:bg-[#2563EB]",
      watermark: "text-blue-500/5 dark:text-blue-500/10",
      progressColor: "bg-blue-600",
      mainIconBox: "bg-blue-500/5 dark:bg-blue-500/10 border-[1.5px] border-blue-500/60 shadow-[inset_0_0_20px_rgba(37,99,235,0.1),0_0_15px_rgba(37,99,235,0.15)] text-blue-600 dark:text-blue-400",
      colBorder: "border-blue-500/20 dark:border-blue-500/25 group-hover:border-blue-500/50",
      colIconBox: "bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400"
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
      bgActive: "bg-[#10B981]",
      textActive: "text-[#10B981]",
      shadowActive: "shadow-[0_8px_16px_-6px_rgba(16,185,129,0.4)]",
      btnHoverBg: "group-hover:bg-[#10B981]",
      watermark: "text-emerald-500/5 dark:text-emerald-500/10",
      progressColor: "bg-emerald-500", // Although less means better, we map rate slightly differently
      mainIconBox: "bg-emerald-500/5 dark:bg-emerald-500/10 border-[1.5px] border-emerald-500/60 shadow-[inset_0_0_20px_rgba(16,185,129,0.1),0_0_15px_rgba(16,185,129,0.15)] text-emerald-600 dark:text-emerald-400",
      colBorder: "border-emerald-500/20 dark:border-emerald-500/25 group-hover:border-emerald-500/50",
      colIconBox: "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
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
      bgActive: "bg-[#7C3AED]",
      textActive: "text-[#7C3AED]",
      shadowActive: "shadow-[0_8px_16px_-6px_rgba(124,58,237,0.4)]",
      btnHoverBg: "group-hover:bg-[#7C3AED]",
      watermark: "text-purple-500/5 dark:text-purple-500/10",
      progressColor: "bg-purple-600",
      mainIconBox: "bg-purple-500/5 dark:bg-purple-500/10 border-[1.5px] border-purple-500/60 shadow-[inset_0_0_20px_rgba(124,58,237,0.1),0_0_15px_rgba(124,58,237,0.15)] text-purple-600 dark:text-purple-400",
      colBorder: "border-purple-500/20 dark:border-purple-500/25 group-hover:border-purple-500/50",
      colIconBox: "bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400"
    },
    href: "/dashboard/input/bundles",
    standard: 90,
    operator: ">=",
  },
  {
    id: "diklat",
    title: "Pendidikan & Pelatihan Staff",
    desc: "Input pelatihan & edukasi petugas kesehatan",
    icon: GraduationCap,
    colorTheme: {
      bgActive: "bg-[#F59E0B]",
      textActive: "text-[#F59E0B]",
      shadowActive: "shadow-[0_8px_16px_-6px_rgba(245,158,11,0.4)]",
      btnHoverBg: "group-hover:bg-[#F59E0B]",
      watermark: "text-amber-500/5 dark:text-amber-500/10",
      progressColor: "bg-amber-500",
      mainIconBox: "bg-amber-500/5 dark:bg-amber-500/10 border-[1.5px] border-amber-500/60 shadow-[inset_0_0_20px_rgba(245,158,11,0.1),0_0_15px_rgba(245,158,11,0.15)] text-amber-600 dark:text-amber-400",
      colBorder: "border-amber-500/20 dark:border-amber-500/25 group-hover:border-amber-500/50",
      colIconBox: "bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400"
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
      let curr = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
      };
      let prev = {
        records: 0,
        totalDinilai: 0,
        totalPatuh: 0,
        persentase: 0,
        avgPersentase: 0,
      };

      if (mod.id === "kewaspadaan-isolasi") {
        curr = calculateStats(currSessions, [
          "audit_hand_hygiene",
          "audit_apd",
          "audit_ruang_isolasi",
          "audit_tps",
          "audit_ruang_tunggu",
        ]);
        prev = calculateStats(prevSessions, [
          "audit_hand_hygiene",
          "audit_apd",
          "audit_ruang_isolasi",
          "audit_tps",
          "audit_ruang_tunggu",
        ]);
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

      if (mod.id === "surveilans-hais") {
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
      if (mod.id === "surveilans-hais")
        mainCount = (curr.totalDinilai - curr.totalPatuh).toString();
      if (mod.id === "diklat") mainCount = curr.records.toString();

      return {
        ...mod,
        passStandard,
        computed: {
          mainCount,
          mainLabel: `${finalPersentase.toFixed(1)}% ${valLabel}`,
          trendUp: isTrendUp,
          // Up is good except for HAIs
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
          subStats: [
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
          ],
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

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-start gap-4">
        <div className="text-left w-full md:w-auto shrink-0">
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">
            Input Data SMART PPI
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Input Data Monitoring PPI Terintegrasi
          </p>
        </div>

        {/* Filter Periode */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tipe Periode */}
          <select
            value={filterPeriodType}
            onChange={(e) => setFilterPeriodType(e.target.value as any)}
            className="h-12 px-[18px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] text-[#111827] dark:text-white text-sm font-semibold rounded-[14px] outline-none hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_14px_center] bg-no-repeat pr-10 shadow-sm backdrop-blur-[10px]"
          >
            <option value="bulanan" className="dark:bg-slate-800">📅 Bulanan</option>
            <option value="triwulan" className="dark:bg-slate-800">📅 Triwulan</option>
            <option value="semester" className="dark:bg-slate-800">📅 Semester</option>
            <option value="tahunan" className="dark:bg-slate-800">📅 Tahunan</option>
          </select>

          {/* Sub Periode */}
          {filterPeriodType === "bulanan" && (
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="h-12 px-[18px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] text-[#111827] dark:text-white text-sm font-semibold rounded-[14px] outline-none hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_14px_center] bg-no-repeat pr-10 shadow-sm backdrop-blur-[10px]"
            >
              {months.map((m, i) => (
                <option key={i} value={i} className="dark:bg-slate-800">{m}</option>
              ))}
            </select>
          )}
          {filterPeriodType === "triwulan" && (
            <select
              value={filterQuarter}
              onChange={(e) => setFilterQuarter(parseInt(e.target.value))}
              className="h-12 px-[18px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] text-[#111827] dark:text-white text-sm font-semibold rounded-[14px] outline-none hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_14px_center] bg-no-repeat pr-10 shadow-sm backdrop-blur-[10px]"
            >
              <option value={0} className="dark:bg-slate-800">Q1 (Jan-Mar)</option>
              <option value={1} className="dark:bg-slate-800">Q2 (Apr-Jun)</option>
              <option value={2} className="dark:bg-slate-800">Q3 (Jul-Sep)</option>
              <option value={3} className="dark:bg-slate-800">Q4 (Okt-Des)</option>
            </select>
          )}
          {filterPeriodType === "semester" && (
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(parseInt(e.target.value))}
              className="h-12 px-[18px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] text-[#111827] dark:text-white text-sm font-semibold rounded-[14px] outline-none hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_14px_center] bg-no-repeat pr-10 shadow-sm backdrop-blur-[10px]"
            >
              <option value={0} className="dark:bg-slate-800">Semester 1</option>
              <option value={1} className="dark:bg-slate-800">Semester 2</option>
            </select>
          )}

          {/* Tahun */}
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="h-12 px-[18px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#E5E7EB] dark:border-[rgba(255,255,255,0.08)] text-[#111827] dark:text-white text-sm font-semibold rounded-[14px] outline-none hover:scale-[1.02] focus:scale-[1.02] focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_14px_center] bg-no-repeat pr-10 shadow-sm backdrop-blur-[10px]"
          >
            <option value={2026} className="dark:bg-slate-800">2026</option>
            <option value={2025} className="dark:bg-slate-800">2025</option>
            <option value={2024} className="dark:bg-slate-800">2024</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {modules.map((mod, i) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex h-full"
          >
            <Link
              href={mod.href}
              prefetch={false}
              className="relative group p-6 rounded-[28px] bg-white/70 dark:bg-[#0F172A]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 w-full"
            >
              {/* Background gradient hint */}
              <div
                className={`absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none rounded-bl-full filter blur-3xl transition-opacity duration-700 group-hover:opacity-20 ${mod.colorTheme.bgActive}`}
              />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex gap-4">
                  <div
                    className={`w-14 h-14 rounded-[18px] flex flex-shrink-0 items-center justify-center ${mod.colorTheme.mainIconBox}`}
                  >
                    <mod.icon
                      className="w-7 h-7"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="pt-0.5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-emerald-500 transition-colors">
                      {mod.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {mod.desc}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pt-0.5 hidden sm:block">
                  <div
                    className={`text-4xl font-black ${mod.colorTheme.textActive} leading-none mb-1`}
                  >
                    {mod.computed.mainCount}
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest ${mod.colorTheme.textActive}`}
                  >
                    {mod.computed.mainLabel}
                  </div>
                  {/* Status Badge */}
                  <div
                    className={`mt-2 inline-flex border border-current px-2 py-0.5 rounded-full items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${mod.passStandard ? "text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"}`}
                  >
                    {mod.passStandard ? "DI ATAS STANDAR" : "DI BAWAH STANDAR"}
                  </div>
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="flex justify-between items-end mb-5 sm:hidden">
                <div>
                  <div
                    className={`text-3xl font-black ${mod.colorTheme.textActive} leading-none mb-1`}
                  >
                    {mod.computed.mainCount}
                  </div>
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest ${mod.colorTheme.textActive}`}
                  >
                    {mod.computed.mainLabel}
                  </div>
                </div>
                <div
                  className={`inline-flex border border-current px-2 py-0.5 rounded-full items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${mod.passStandard ? "text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"}`}
                >
                  {mod.passStandard ? "DI ATAS STANDAR" : "DI BAWAH STANDAR"}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="mb-6 relative z-10 w-full shrink-0">
                <div className="flex justify-between items-center mb-1.5 px-0.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <span>Progress Realtime</span>
                  <span className="text-slate-400">
                    {Math.round(mod.computed.progress)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-black/30 rounded-full overflow-hidden shrink-0 border border-black/5 dark:border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-[1500ms] shadow-[0_0_10px_currentcolor] ${mod.computed.progressColor}`}
                    style={{ width: `${Math.max(mod.computed.progress, 2)}%` }}
                  />
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {mod.computed.subStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl py-3 border ${mod.colorTheme.colBorder} transition-colors`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-xl ${stat.iconColor} mb-2`}
                    >
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {stat.label}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}{" "}
              </div>

              <div className="mt-auto pt-2 shrink-0">
                <div
                  className={`w-full py-3.5 rounded-full flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${mod.colorTheme.bgActive} text-white hover:opacity-90 shadow-lg ${mod.colorTheme.shadowActive}`}
                >
                  <span>INPUT SEKARANG</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}{" "}
      </div>
    </div>
  );
}

InputIndexPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
