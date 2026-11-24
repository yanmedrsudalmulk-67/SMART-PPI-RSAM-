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
      bgActive: "bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8]",
      textActive: "text-blue-400",
      shadowActive: "shadow-[0_12px_28px_rgba(37,99,235,0.45)]",
      btnHoverBg: "group-hover:bg-[#2563EB]",
      watermark: "text-blue-500/10",
      progressColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
      mainIconBox: "bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-white border border-blue-300/40 shadow-[-3px_-3px_10px_rgba(140,180,255,0.25),8px_10px_24px_rgba(0,0,0,0.65),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.35)]",
      colBorder: "border-blue-400/20 group-hover:border-blue-400/35",
      colIconBox: "bg-gradient-to-br from-blue-500/25 to-blue-600/15 border border-blue-400/30 text-blue-400 shadow-[inset_1px_1px_1.5px_rgba(255,255,255,0.2),2px_3px_6px_rgba(0,0,0,0.4)]"
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
      bgActive: "bg-gradient-to-r from-[#059669] via-[#10B981] to-[#047857]",
      textActive: "text-emerald-400",
      shadowActive: "shadow-[0_12px_28px_rgba(16,185,129,0.45)]",
      btnHoverBg: "group-hover:bg-[#10B981]",
      watermark: "text-emerald-500/10",
      progressColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      mainIconBox: "bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] text-white border border-emerald-300/40 shadow-[-3px_-3px_10px_rgba(110,255,200,0.25),8px_10px_24px_rgba(0,0,0,0.65),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.35)]",
      colBorder: "border-emerald-400/20 group-hover:border-emerald-400/35",
      colIconBox: "bg-gradient-to-br from-emerald-500/25 to-emerald-600/15 border border-emerald-400/30 text-emerald-400 shadow-[inset_1px_1px_1.5px_rgba(255,255,255,0.2),2px_3px_6px_rgba(0,0,0,0.4)]"
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
      bgActive: "bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6D28D9]",
      textActive: "text-purple-400",
      shadowActive: "shadow-[0_12px_28px_rgba(124,58,237,0.45)]",
      btnHoverBg: "group-hover:bg-[#7C3AED]",
      watermark: "text-purple-500/10",
      progressColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
      mainIconBox: "bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] text-white border border-purple-300/40 shadow-[-3px_-3px_10px_rgba(180,140,255,0.25),8px_10px_24px_rgba(0,0,0,0.65),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.35)]",
      colBorder: "border-purple-400/20 group-hover:border-purple-400/35",
      colIconBox: "bg-gradient-to-br from-purple-500/25 to-purple-600/15 border border-purple-400/30 text-purple-400 shadow-[inset_1px_1px_1.5px_rgba(255,255,255,0.2),2px_3px_6px_rgba(0,0,0,0.4)]"
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
      bgActive: "bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#B45309]",
      textActive: "text-amber-400",
      shadowActive: "shadow-[0_12px_28px_rgba(245,158,11,0.45)]",
      btnHoverBg: "group-hover:bg-[#F59E0B]",
      watermark: "text-amber-500/10",
      progressColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      mainIconBox: "bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#b45309] text-white border border-amber-300/40 shadow-[-3px_-3px_10px_rgba(255,200,100,0.25),8px_10px_24px_rgba(0,0,0,0.65),inset_0_1.5px_2px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.35)]",
      colBorder: "border-amber-400/20 group-hover:border-amber-400/35",
      colIconBox: "bg-gradient-to-br from-amber-500/25 to-amber-600/15 border border-amber-400/30 text-amber-400 shadow-[inset_1px_1px_1.5px_rgba(255,255,255,0.2),2px_3px_6px_rgba(0,0,0,0.4)]"
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
      const [sessionsRes, hhRes, apdRes] = await Promise.all([
        supabase
          .from("audit_sessions")
          .select("id, created_at, tanggal_waktu, indikator_id, nama_indikator, kategori, persentase, jumlah_patuh, jumlah_dinilai, unit, observer, profesi"),
        supabase
          .from("audit_hand_hygiene")
          .select("id, created_at, start_time, patuh, peluang, persentase, unit, observer, profesi"),
        supabase
          .from("audit_apd")
          .select("id, created_at, tanggal_waktu, jumlah_patuh, jumlah_dinilai, persentase, unit_ruangan, unit, observer, profesi"),
      ]);

      const sessionList: any[] = sessionsRes.data
        ? sessionsRes.data.map((s: any) => ({
            ...s,
            jumlah_dinilai: Number(s.jumlah_dinilai) || 0,
            jumlah_patuh: Number(s.jumlah_patuh) || 0,
            persentase: Number(s.persentase) || 0,
          }))
        : [];
      const sessionIds = new Set(sessionList.map((s) => s.id));

      if (hhRes.data) {
        hhRes.data.forEach((hh: any) => {
          if (!sessionIds.has(hh.id)) {
            sessionList.push({
              id: hh.id,
              created_at: hh.created_at,
              tanggal_waktu: hh.start_time || hh.created_at,
              indikator_id: "audit_hand_hygiene",
              nama_indikator: "AUDIT KEBERSIHAN TANGAN",
              kategori: "Kewaspadaan Isolasi",
              persentase: Number(hh.persentase) || 0,
              jumlah_patuh: Number(hh.patuh) || 0,
              jumlah_dinilai: Number(hh.peluang) || 0,
              unit: hh.unit,
              observer: hh.observer,
              profesi: hh.profesi,
            });
            sessionIds.add(hh.id);
          }
        });
      }

      if (apdRes.data) {
        apdRes.data.forEach((apd: any) => {
          if (!sessionIds.has(apd.id)) {
            sessionList.push({
              id: apd.id,
              created_at: apd.created_at,
              tanggal_waktu: apd.tanggal_waktu || apd.created_at,
              indikator_id: "audit_apd",
              nama_indikator: "AUDIT APD",
              kategori: "Kewaspadaan Isolasi",
              persentase: Number(apd.persentase) || 0,
              jumlah_patuh: Number(apd.jumlah_patuh) || 0,
              jumlah_dinilai: Number(apd.jumlah_dinilai) || 0,
              unit: apd.unit_ruangan || apd.unit,
              observer: apd.observer,
              profesi: apd.profesi,
            });
            sessionIds.add(apd.id);
          }
        });
      }

      setSessions(sessionList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const todayStr = new Date().toISOString().slice(0, 10);
    fetch(`/api/simrs/hais?startDate=2026-01-01&endDate=${todayStr}&autoSync=true`).catch(() => {});

    const chanSessions = supabase
      .channel("audit_sessions_changes_input")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_sessions" },
        () => fetchSessions(),
      )
      .subscribe();

    const chanHH = supabase
      .channel("audit_hh_changes_input")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_hand_hygiene" },
        () => fetchSessions(),
      )
      .subscribe();

    const chanAPD = supabase
      .channel("audit_apd_changes_input")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_apd" },
        () => fetchSessions(),
      )
      .subscribe();

    const handleWindowMessage = (e: MessageEvent) => {
      if (e.data && (e.data.type === "audit_submitted" || e.data.type === "AUDIT_SUBMITTED")) {
        fetchSessions();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("message", handleWindowMessage);
    }

    return () => {
      supabase.removeChannel(chanSessions);
      supabase.removeChannel(chanHH);
      supabase.removeChannel(chanAPD);
      if (typeof window !== "undefined") {
        window.removeEventListener("message", handleWindowMessage);
      }
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
        (acc, curr) => acc + (Number(curr.jumlah_dinilai) || 0),
        0,
      );
      const totalPatuh = filtered.reduce(
        (acc, curr) => acc + (Number(curr.jumlah_patuh) || 0),
        0,
      );
      const persentase =
        totalDinilai > 0 ? (totalPatuh / totalDinilai) * 100 : 0;
      const avgPersentase =
        filtered.length > 0
          ? filtered.reduce((acc, curr) => acc + (Number(curr.persentase) || 0), 0) /
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
            const transmisiSize = Math.min(transmisiSet.size, 4);
            const monitoringSize = Math.min(monitoringSet.size, 12);
            const totalFilled = standarSize + transmisiSize + monitoringSize;
            const totalExpected = 10 + 4 + 12; // 26
            
            return {
                records: data.length,
                totalDinilai: totalExpected,
                totalPatuh: totalFilled,
                persentase: (totalFilled / totalExpected) * 100,
                avgPersentase: 0,
                standarFilled: standarSize,
                transmisiFilled: transmisiSize,
                monitoringFilled: monitoringSize,
            };
        };

        curr = calcIso(currSessions);
        prev = calcIso(prevSessions);
      } else if (mod.id === "surveilans-hais") {
        curr = calculateStats(currSessions, ["surveilans", "isk", "phlebitis", "vap", "ido"]);
        prev = calculateStats(prevSessions, ["surveilans", "isk", "phlebitis", "vap", "ido"]);
      } else if (mod.id === "bundles-hais") {
        curr = calculateStats(currSessions, ["bundle", "iadp", "cauti", "ido_b", "vap_b"]);
        prev = calculateStats(prevSessions, ["bundle", "iadp", "cauti", "ido_b", "vap_b"]);
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
        finalPersentase = curr.persentase;
        finalPrevPersentase = prev.persentase;
        diff = finalPersentase - finalPrevPersentase;
        valLabel = "RATE";
        statCountLabel = "Tindakan";
        statPatuhLabel = "Insiden HAIs";
        statCountVal = Number(curr.totalDinilai || 0).toLocaleString("id-ID");
        statPatuhVal = Number(curr.totalPatuh || 0).toLocaleString("id-ID");
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
      const trendText = `${Math.abs(Number(diff)).toFixed(2)}% dari sebelumnya`;
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
      let mainCount = Number(curr.totalDinilai || 0).toLocaleString("id-ID");
      if (mod.id === "kewaspadaan-isolasi")
        mainCount = curr.totalPatuh.toString();
      if (mod.id === "surveilans-hais")
        mainCount = Number(finalPersentase || 0).toFixed(2);
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
          value: `${diff > 0 ? "+" : ""}${Number(diff).toFixed(2)}%`,
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
          standardLabel: mod.id === "kewaspadaan-isolasi" 
            ? (isTerpenuhi ? "SUDAH TERPENUHI" : "BELUM TERPENUHI") 
            : (passStandard ? (mod.operator === "<=" ? "SESUAI STANDAR" : "DI ATAS STANDAR") : (mod.operator === "<=" ? "MELEBIHI STANDAR" : "DI BAWAH STANDAR")),
          mainCount,
          mainLabel: mod.id === "surveilans-hais" ? "% RATE" : `${Number(finalPersentase).toFixed(2)}% ${valLabel}`,
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
    <div className="space-y-6 pb-20 transform-gpu">
      <Head>
        <title>Input Data - SMART PPI</title>
      </Head>

      <div className="mb-2 flex flex-col items-center justify-center gap-4 landscape:lg:flex-row landscape:lg:justify-between landscape:lg:text-left">
        <div className="text-center landscape:lg:text-left w-full landscape:lg:w-auto shrink-0">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-300 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            Input Data SMART PPI
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium text-center landscape:lg:text-left">
            Input Data Monitoring PPI Terintegrasi
          </p>
        </div>

        {/* Filter Periode - 3D Tactile Neumorphic Container */}
        <div className="relative group w-full landscape:lg:w-auto flex justify-center landscape:lg:justify-end">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 lg:gap-9">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="flex h-full w-full [content-visibility:auto] [contain-intrinsic-size:0_360px]"
          >
            <Link
              href={mod.href}
              prefetch={false}
              className="relative group p-6 sm:p-8 rounded-[36px] bg-gradient-to-b from-[#1d2042] via-[#171936] to-[#12132a] border border-[#2e3362]/70 flex flex-col overflow-hidden shadow-[-10px_-10px_28px_rgba(140,165,255,0.06),18px_24px_50px_rgba(0,0,0,0.82),inset_1px_1.5px_2px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-[#3d4482]/90 hover:shadow-[-12px_-12px_32px_rgba(140,165,255,0.1),22px_28px_60px_rgba(0,0,0,0.9),inset_1px_1.5px_2px_rgba(255,255,255,0.28)] transition-all duration-300 ease-out transform-gpu w-full"
            >
              {/* Top Neumorphic Specular Highlight Bevel Line */}
              <div className="absolute top-0 inset-x-12 h-[1.5px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none rounded-t-full" />

              {/* Hardware-friendly ambient radial corner glow */}
              <div
                className="absolute -top-12 -right-12 w-56 h-56 pointer-events-none rounded-full opacity-25 transition-opacity duration-300 group-hover:opacity-40 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.35),transparent_70%)]"
              />

              <div className="flex justify-between items-start gap-4 mb-6 relative z-10 flex-1">
                <div className="flex gap-4 sm:gap-5 flex-1 min-w-0 items-center">
                  {/* 3D Convex Pill/Squircle Icon Box */}
                  <div
                    className={`relative w-15 h-15 rounded-[22px] flex flex-shrink-0 items-center justify-center overflow-hidden ${mod.colorTheme.mainIconBox}`}
                  >
                    {/* Inner 3D specular highlight arc */}
                    <div className="absolute top-1 inset-x-2.5 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 h-2 bg-black/25 rounded-b-[22px] pointer-events-none" />
                    <mod.icon
                      className="w-7 h-7 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                      strokeWidth={2.4}
                    />
                  </div>
                  <div className="pt-0.5 flex-1 min-w-0">
                    <h2 className="text-[clamp(19px,2vw,24px)] font-black text-white leading-tight mb-1 group-hover:text-indigo-200 transition-colors break-words whitespace-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tight">
                      {mod.title}
                    </h2>
                    <p className="text-[clamp(12px,1.2vw,14px)] text-slate-300/85 font-medium break-words whitespace-normal leading-snug">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Block */}
              <div className="flex justify-between items-end mb-5 relative z-10">
                <div>
                  <div
                    className={`text-4xl sm:text-5xl font-black ${mod.colorTheme.textActive} leading-none mb-1.5 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]`}
                  >
                    {mod.computed.mainCount}
                  </div>
                  <div
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${mod.colorTheme.textActive}`}
                  >
                    {mod.computed.mainLabel}
                  </div>
                </div>
                {/* 3D Tactile Recessed Status Badge */}
                <div
                  className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.14em] bg-gradient-to-b from-[#14162e] to-[#0e1022] border shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.08),0_4px_10px_rgba(0,0,0,0.4)] ${mod.passStandard ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${mod.passStandard ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse"}`}
                  />
                  <span>
                    {mod.computed.standardLabel || (mod.passStandard ? "SESUAI STANDAR" : "DI BAWAH STANDAR")}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container - 3D Sunken Groove */}
              <div className="mb-6 relative z-10 w-full shrink-0">
                <div className="flex justify-between items-center mb-1.5 px-0.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Progress Realtime</span>
                  <span className="text-slate-200 font-bold">
                    {Number(mod.computed.progress).toFixed(2)}%
                  </span>
                </div>
                <div className="h-3 w-full bg-[#0a0c1a] rounded-full overflow-hidden p-[2.5px] border border-black/60 shadow-[inset_2.5px_2.5px_6px_rgba(0,0,0,0.95),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ease-out shadow-[0_0_12px_currentColor,inset_0_1px_1.5px_rgba(255,255,255,0.45)] ${mod.computed.progressColor}`}
                    style={{ width: `${Math.max(mod.computed.progress, 2)}%` }}
                  />
                </div>
              </div>

              {/* Stats Bar - 3 Deep Sunken Wells */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 mb-6 relative z-10">
                {mod.computed.subStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center bg-gradient-to-b from-[#101227] via-[#131530] to-[#171938] rounded-[22px] py-3.5 px-2 border border-black/50 shadow-[inset_2px_2.5px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2.5px_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.3)] group-hover:border-indigo-400/25 transition-all duration-200"
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-xl ${stat.iconColor} mb-2 shadow-[-2px_-2px_6px_rgba(140,165,255,0.08),3px_4px_8px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)]`}
                    >
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold tracking-wide text-center">
                      {stat.label}
                    </span>
                    <span className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button - 3D Tactile CTA Pill */}
              <div className="mt-0 pt-1 shrink-0 relative z-10">
                <div
                  className={`relative overflow-hidden w-full py-4 rounded-[22px] flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] transition-all duration-200 text-white ${mod.colorTheme.bgActive} shadow-[-3px_-3px_10px_rgba(255,255,255,0.2),8px_12px_26px_rgba(0,0,0,0.65),inset_0_2px_2.5px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.4)] hover:brightness-110 active:translate-y-1 active:shadow-[inset_2px_3px_6px_rgba(0,0,0,0.8)] ${mod.colorTheme.shadowActive}`}
                >
                  {/* Top specular highlight line on button */}
                  <div className="absolute top-0 inset-x-8 h-[1px] bg-white/40 pointer-events-none rounded-t-full" />
                  <span>INPUT SEKARANG</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" strokeWidth={2.5} />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

InputIndexPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
