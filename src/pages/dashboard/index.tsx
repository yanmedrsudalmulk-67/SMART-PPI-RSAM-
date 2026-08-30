import { useState, useEffect, useMemo, useRef, ReactElement } from "react";
import dynamic from "next/dynamic";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import {
  AlertCircle,
  Shield,
  ShieldCheck,
  Droplets,
  BarChart2,
  LineChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Calendar,
  ImageOff,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAppContext } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useDashboardStore } from "@/hooks/useDashboardStore";
import { ClockWidget } from "@/components/ClockWidget";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";

import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  LabelList,
} from "@/components/ChartComponents";

// --- Types ---
interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  active: boolean;
  sort_order: number;
}

interface Standard {
  indikator: string;
  nilai_standar: number;
  operator: ">=" | "<=";
}

interface HaisData {
  phlebitis: number;
  isk: number;
  ido: number;
  vap: number;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "s1",
    title: "SMART PPI Terpadu",
    subtitle:
      "Pusat Pemantauan dan Pengendalian Infeksi UOBK RSUD AL-MULK. Mencegah lebih baik daripada mengobati.",
    image_url:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=70&w=1200",
    active: true,
    sort_order: 1,
  },
  {
    id: "s2",
    title: "Standar Keselamatan Pasien",
    subtitle:
      "Mari tingkatkan kepatuhan Kebersihan Tangan dan penggunaan APD demi mewujudkan zero insiden.",
    image_url:
      "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=70&w=1200",
    active: true,
    sort_order: 2,
  },
];

const DEFAULT_STANDARDS: Record<string, Standard> = {
  hh: { indikator: "Kebersihan Tangan", nilai_standar: 85, operator: ">=" },
  apd: {
    indikator: "Kepatuhan Penggunaan APD",
    nilai_standar: 100,
    operator: ">=",
  },
  phlebitis: { indikator: "Phlebitis", nilai_standar: 1.5, operator: "<=" },
  isk: { indikator: "ISK", nilai_standar: 5, operator: "<=" },
  ido: { indikator: "IDO", nilai_standar: 2, operator: "<=" },
  vap: { indikator: "VAP", nilai_standar: 5, operator: "<=" },
  fasilitas_apd: {
    indikator: "Fasilitas APD",
    nilai_standar: 100,
    operator: ">=",
  },
  linen: {
    indikator: "Penatalaksanaan Linen",
    nilai_standar: 100,
    operator: ">=",
  },
};

// --- Standalone Components & Helpers for Performance ---
const getSlideStyles = (isActive: boolean, isPrev: boolean, isNext: boolean, windowWidth: number) => {
  if (windowWidth < 768) {
    return {
      transform: "scale(1)",
      filter: "none",
      opacity: isActive ? 1 : 0.4,
      zIndex: isActive ? 20 : 10,
      transformStyle: "preserve-3d" as const,
      transition: "transform 700ms cubic-bezier(0.25, 1, 0.5, 1), opacity 700ms cubic-bezier(0.25, 1, 0.5, 1)",
    };
  }

  let transform = "scale(1) translateZ(0px) translateX(0px)";
  let filter = "none";
  let opacity = 1;
  let zIndex = 20;

  // Proportional translation to bring the prev/next slides closely overlapping right behind the center active slide
  let translateX = 35; // mobile default
  if (windowWidth >= 1280) {
    translateX = 145; // desktop
  } else if (windowWidth >= 1024) {
    translateX = 115; // large tablet / laptop
  } else if (windowWidth >= 768) {
    translateX = 90; // tablet
  } else if (windowWidth >= 480) {
    translateX = 60; // large mobile
  }

  if (isActive) {
    transform = "scale(1) translateZ(0px) translateX(0px)";
    filter = "none";
    opacity = 1;
    zIndex = 20;
  } else if (isPrev) {
    // Left slide - scaled down and shifted right (towards center) to overlap beautifully
    transform = `scale(0.85) translateZ(-80px) translateX(${translateX}px)`;
    filter = "none";
    opacity = 0.95;
    zIndex = 10;
  } else if (isNext) {
    // Right slide - scaled down and shifted left (towards center) to overlap beautifully
    transform = `scale(0.85) translateZ(-80px) translateX(${-translateX}px)`;
    filter = "none";
    opacity = 0.95;
    zIndex = 10;
  } else {
    // Hidden completely in the depth to avoid background clutter
    transform = "scale(0.7) translateZ(-200px) translateX(0px)";
    filter = "blur(4px)";
    opacity = 0;
    zIndex = 0;
  }

  return {
    transform,
    filter,
    opacity,
    zIndex,
    transformStyle: "preserve-3d" as const,
    transition: "transform 800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), filter 800ms cubic-bezier(0.16, 1, 0.3, 1)",
  };
};

const SliderImage = ({
  slide,
  setImageErrors,
}: {
  slide: any;
  setImageErrors: any;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center blur-[40px] saturate-200 scale-125 transition-opacity duration-700 ease-out"
        style={{
          backgroundImage: `url(${slide.image_url})`,
          opacity: isLoaded ? 0.4 : 0,
        }}
      />
      <div className="absolute inset-0 w-full h-full bg-slate-950/20" />
      <img
        ref={imgRef}
        src={slide.image_url}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover drop-shadow-2xl scale-100 group-[.swiper-slide-active]:scale-105"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 700ms ease-out, transform 15000ms ease-out",
        }}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          console.error("Slider image error", slide.image_url);
          setImageErrors((prev: any) => ({ ...prev, [slide.id]: true }));
        }}
      />
    </>
  );
};

const HeroSlider = ({
  slides,
  isLoading,
}: {
  slides: Slide[];
  isLoading: boolean;
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({
    s1: 1.777,
    s2: 1.777,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1200);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleSlides = useMemo(() => {
    const active = slides.filter((s) => s.active);
    return active.length > 0 ? active : (isLoading ? [] : DEFAULT_SLIDES);
  }, [slides, isLoading]);

  const duplicatedSlides = useMemo(() => {
    if (visibleSlides.length === 0) return [];
    if (visibleSlides.length === 1) return visibleSlides;
    // For Swiper loop mode with fractional slidesPerView and centeredSlides,
    // Swiper requires at least 6-8 slides to loop without warnings
    let result = [...visibleSlides];
    while (result.length < 8) {
      result = [...result, ...visibleSlides];
    }
    return result;
  }, [visibleSlides]);

  useEffect(() => {
    visibleSlides.forEach((slide) => {
      if (slide.image_url && !aspectRatios[slide.id]) {
        const img = new window.Image();
        img.src = slide.image_url;
        img.referrerPolicy = "no-referrer";
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalWidth / img.naturalHeight;
            // Sane ratios (from 1.4 to 2.7)
            const boundedRatio = Math.max(1.4, Math.min(2.7, ratio));
            setAspectRatios((prev) => ({ ...prev, [slide.id]: boundedRatio }));
          }
        };
      }
    });
  }, [visibleSlides, aspectRatios]);

  const currentSlide = visibleSlides[activeIndex] || visibleSlides[0];
  const currentRatio = useMemo(() => {
    if (!currentSlide) return 16 / 9;
    const rawRatio = aspectRatios[currentSlide.id] || 16 / 9;
    if (isMobile) {
      return Math.max(1.3, Math.min(1.8, rawRatio));
    }
    
    // Mathematically perfect scale factor matching slidesPerView to keep the center card widescreen ratio
    // without stretching, which keeps the total vertical height much shorter and polished
    let multiplier = 1.35;
    if (windowWidth >= 1280) multiplier = 1.45;
    else if (windowWidth >= 1024) multiplier = 1.40;
    else if (windowWidth >= 768) multiplier = 1.35;
    
    return rawRatio * multiplier;
  }, [currentSlide, aspectRatios, isMobile, windowWidth]);

  if (isLoading) {
    return (
      <div
        className="w-full relative group rounded-[24px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-200/50 dark:border-white/10 dark:shadow-blue-900/20 mb-8 mt-4 bg-slate-950 flex flex-col justify-end p-8 md:p-14 animate-pulse"
        style={{ aspectRatio: 1.777 }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 opacity-90" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="h-6 w-28 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            Memuat...
          </div>
          <div className="h-8 md:h-12 w-3/4 bg-slate-800/80 rounded-2xl" />
          <div className="h-4 w-5/6 bg-slate-800/50 rounded-xl" />
          <div className="h-4 w-2/3 bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto relative group overflow-hidden md:overflow-visible mb-6 mt-1 bg-transparent transition-all duration-300 ease-in-out transform-gpu will-change-[width,height]"
      style={{ 
        aspectRatio: currentRatio,
        perspective: "1200px"
      }}
    >
      <Swiper
        key={duplicatedSlides.map((s, idx) => `${s.id}-${idx}`).join(",")}
        modules={[Autoplay, Pagination]}
        centeredSlides={true}
        spaceBetween={16}
        slidesPerView={1}
        loop={duplicatedSlides.length > 1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        onSlideChange={(swiper) => {
          if (visibleSlides.length > 0) {
            setActiveIndex(swiper.realIndex % visibleSlides.length);
          }
        }}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 0,
          },
          768: {
            slidesPerView: 1.35,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: 1.40,
            spaceBetween: 20,
          },
          1280: {
            slidesPerView: 1.45,
            spaceBetween: 24,
          }
        }}
        className="w-full h-full bg-transparent !overflow-visible transition-all duration-300 ease-in-out transform-gpu"
        style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
      >
        {duplicatedSlides.map((slide, i) => (
          <SwiperSlide 
            key={`${slide.id}-dup-${i}`} 
            className="overflow-visible flex items-center justify-center p-2 md:p-6"
            style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
          >
            {({ isActive, isPrev, isNext }) => {
              const slideStyle = getSlideStyles(isActive, isPrev, isNext, windowWidth);
              return (
                <div
                  style={slideStyle}
                  className={`relative w-full h-full rounded-[16px] md:rounded-[20px] overflow-hidden transition-all duration-700 ease-out transform-gpu flex items-center justify-center border border-indigo-300/30 ${
                    isActive
                      ? "shadow-[0_20px_50px_rgba(15,10,45,0.45)]"
                      : "shadow-[0_10px_25px_rgba(15,10,45,0.25)]"
                  }`}
                >
                  {slide.image_url && !imageErrors[slide.id] ? (
                    <SliderImage slide={slide} setImageErrors={setImageErrors} />
                  ) : (
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/80 flex flex-col items-center justify-center gap-3">
                      <ImageOff className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-2" />
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Image not available
                      </span>
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 bg-slate-950 transition-opacity duration-700 ease-out pointer-events-none ${
                      isActive ? "opacity-0" : "opacity-55"
                    }`}
                  />
                </div>
              );
            }}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const getStatusColor = (val: number, std: Standard | undefined) => {
  if (!std || typeof std.nilai_standar === "undefined")
    return "text-slate-400 dark:text-slate-500";
  const pass =
    std.operator === ">=" ? val >= std.nilai_standar : val <= std.nilai_standar;
  if (pass) return "text-emerald-600 dark:text-emerald-400";
  return "text-red-600 dark:text-red-400";
};

export default function DashboardPage() {
  const { userRole } = useAppContext();

  const {
    dashboardData,
    setDashboardData,
    isDashboardLoaded,
    isGlobalLoading,
  } = useDashboardStore();

  const [filterPeriodType, setFilterPeriodType] = useState<
    "bulanan" | "triwulan" | "semester" | "tahunan"
  >("tahunan");
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth());
  const [filterQuarter, setFilterQuarter] = useState<number>(
    Math.floor(new Date().getMonth() / 3),
  );
  const [filterSemester, setFilterSemester] = useState<number>(
    Math.floor(new Date().getMonth() / 6),
  );
  const [filterYear, setFilterYear] = useState<number>(
    new Date().getFullYear(),
  );

  const [activeTab, setActiveTab] = useState<
    "hh" | "apd" | "hais" | "fasilitas_apd" | "linen"
  >("hh");
  const [chartMode, setChartMode] = useState<"bar" | "line">("bar");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");

  const slides =
    isDashboardLoaded &&
    dashboardData?.slides &&
    dashboardData.slides.length > 0
      ? dashboardData.slides
      : (isDashboardLoaded ? DEFAULT_SLIDES : []);
  const standards =
    isDashboardLoaded && dashboardData?.standards
      ? dashboardData.standards
      : DEFAULT_STANDARDS;
  const rawData = useMemo(
    () =>
      isDashboardLoaded && dashboardData?.rawData
        ? dashboardData.rawData
        : { hh: [], apd: [], hais: [], fapd: [], linen: [] },
    [isDashboardLoaded, dashboardData?.rawData],
  );
  const isDataLoading = !isDashboardLoaded;
  const isSlidesLoading = !isDashboardLoaded;

  const isDashboardLoadedRef = useRef(isDashboardLoaded);
  useEffect(() => {
    isDashboardLoadedRef.current = isDashboardLoaded;
  }, [isDashboardLoaded]);

  useEffect(() => {
    // If not loaded yet, fetch will be handled by Layout
    // But we still need to subscribe to changes for immediate local updates
    let mounted = true;
    const fetchFresh = async () => {
      try {
        const [slidesRes, stdRes, hhRes, apdRes, haisRes, fapdRes, linenRes] =
          await Promise.all([
            supabase
              .from("dashboard_slider")
              .select("*")
              .order("sort_order", { ascending: true }),
            supabase.from("dashboard_standards").select("*"),
            supabase.from("audit_hand_hygiene").select("*"),
            supabase.from("audit_apd").select("*"),
            supabase
              .from("audit_sessions")
              .select("*")
              .eq("kategori", "Surveilans HAIs"),
            supabase.from("monitoring_fasilitas_apd").select("*"),
            supabase.from("audit_penatalaksanaan_linen").select("*"),
          ]);

        if (!mounted) return;

        const newRawData = {
          hh: hhRes.data || [],
          apd: apdRes.data || [],
          hais: haisRes.data || [],
          fasilitas_apd: fapdRes.data || [],
          linen: linenRes.data || [],
        };

        // Ensure slides fallback to DEFAULT_SLIDES if table is empty
        const newSlides =
          slidesRes.data && slidesRes.data.length > 0
            ? slidesRes.data
            : DEFAULT_SLIDES;

        // Preload active slider images in parallel
        newSlides.forEach((slide: any) => {
          if (slide.image_url && slide.active && typeof window !== "undefined") {
            const img = new window.Image();
            img.src = slide.image_url;
            img.referrerPolicy = "no-referrer";
          }
        });

        const newStandards: any = {
          hh: {
            indikator: "Kebersihan Tangan",
            nilai_standar: 85,
            operator: ">=",
          },
          apd: {
            indikator: "Kepatuhan Penggunaan APD",
            nilai_standar: 100,
            operator: ">=",
          },
          phlebitis: {
            indikator: "Phlebitis",
            nilai_standar: 1.5,
            operator: "<=",
          },
          isk: { indikator: "ISK", nilai_standar: 5, operator: "<=" },
          ido: { indikator: "IDO", nilai_standar: 2, operator: "<=" },
          vap: { indikator: "VAP", nilai_standar: 5, operator: "<=" },
          fasilitas_apd: {
            indikator: "Fasilitas APD",
            nilai_standar: 100,
            operator: ">=",
          },
          linen: {
            indikator: "Penatalaksanaan Linen",
            nilai_standar: 100,
            operator: ">=",
          },
        };
        if (stdRes.data) {
          stdRes.data.forEach((s) => {
            const key = s.indikator.toLowerCase();
            if (key.includes("tangan") || key === "hh")
              newStandards.hh = {
                ...s,
                nilai_standar:
                  s.nilai_standar <= 1
                    ? s.nilai_standar * 100
                    : s.nilai_standar,
              };
            else if (key.includes("apd"))
              newStandards.apd = {
                ...s,
                nilai_standar:
                  s.nilai_standar <= 1
                    ? s.nilai_standar * 100
                    : s.nilai_standar,
              };
            else if (key.includes("phle")) newStandards.phlebitis = s;
            else if (key.includes("isk")) newStandards.isk = s;
            else if (key.includes("ido")) newStandards.ido = s;
            else if (key.includes("vap")) newStandards.vap = s;
            else if (key.includes("fasilitas") || key.includes("fapd"))
              newStandards.fasilitas_apd = s;
            else if (key.includes("linen")) newStandards.linen = s;
            else if (newStandards[key]) newStandards[key] = s;
          });
        }

        setDashboardData({
          slides: newSlides,
          standards: newStandards,
          rawData: newRawData,
        });
      } catch (e) {
        console.error("Manual refresh error", e);
      }
    };

    if (!isDashboardLoadedRef.current) {
      fetchFresh();
    }

    const channels = [
      supabase
        .channel("hh_ch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "audit_hand_hygiene" },
          () => fetchFresh(),
        )
        .subscribe(),
      supabase
        .channel("apd_ch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "audit_apd" },
          () => fetchFresh(),
        )
        .subscribe(),
      supabase
        .channel("hais_ch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "insiden_hais" },
          () => fetchFresh(),
        )
        .subscribe(),
      supabase
        .channel("std_ch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "dashboard_standards" },
          () => fetchFresh(),
        )
        .subscribe(),
      supabase
        .channel("fapd_ch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "monitoring_fasilitas_apd" },
          () => fetchFresh(),
        )
        .subscribe(),
      supabase
        .channel("linen_ch")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "audit_penatalaksanaan_linen",
          },
          () => fetchFresh(),
        )
        .subscribe(),
    ];

    return () => {
      mounted = false;
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [setDashboardData]);

  const { units, stats, chartDataList } = useMemo(() => {
    const isDateMatch = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (d.getFullYear() !== filterYear) return false;
      if (filterPeriodType === "bulanan") return d.getMonth() === filterMonth;
      if (filterPeriodType === "triwulan")
        return Math.floor(d.getMonth() / 3) === filterQuarter;
      if (filterPeriodType === "semester")
        return Math.floor(d.getMonth() / 6) === filterSemester;
      return true; // tahunan
    };

    const hhData = rawData.hh.filter((d: any) =>
      isDateMatch(d.start_time || d.created_at),
    );
    const apdData = rawData.apd.filter((d: any) =>
      isDateMatch(d.tanggal_waktu || d.created_at),
    );
    const haisData = (rawData.hais || []).filter((d: any) =>
      isDateMatch(d.tanggal_waktu || d.created_at),
    );
    const fapdData = (rawData.fasilitas_apd || []).filter((d: any) =>
      isDateMatch(d.tanggal_waktu || d.created_at),
    );
    const linenData = (rawData.linen || []).filter((d: any) =>
      isDateMatch(d.tanggal_waktu || d.created_at),
    );

    const unitSet = new Set<string>();
    [...hhData, ...apdData, ...haisData, ...fapdData, ...linenData].forEach(
      (d) => {
        if (d.unit) unitSet.add(d.unit);
        if (d.ruangan) unitSet.add(d.ruangan);
      },
    );
    const unitsList = ["all", ...Array.from(unitSet).sort()];

    // Helper for grouping - always Monthly breakdown for x-axis
    const getGroupKey = (dateStr: string) => {
      if (!dateStr) return "Unknown";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Unknown";
      const m = date.getMonth();
      const y = date.getFullYear();
      return `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][m]}`;
    };

    const grouped: Record<string, any> = {};

    // Pre-fill months to ensure they show up in the chart even with no data
    const fillMonths = () => {
      let startMonth = 0;
      let endMonth = 11;
      if (filterPeriodType === "bulanan") {
        startMonth = filterMonth;
        endMonth = filterMonth;
      } else if (filterPeriodType === "triwulan") {
        startMonth = filterQuarter * 3;
        endMonth = startMonth + 2;
      } else if (filterPeriodType === "semester") {
        startMonth = filterSemester * 6;
        endMonth = startMonth + 5;
      }

      for (let i = startMonth; i <= endMonth; i++) {
        const k = `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][i]}`;
        grouped[k] = {
          hhSum: 0,
          hhCount: 0,
          apdPatuh: 0,
          apdDin: 0,
          hPhle: 0,
          hIsk: 0,
          hIdo: 0,
          hVap: 0,
          hCount: 0, // for detecting any HAIs data
          fapdSum: 0,
          fapdCount: 0,
          linenSum: 0,
          linenCount: 0,
        };
      }
    };
    fillMonths();

    let totalHhPercSum = 0;
    let hhRecordCount = 0;
    let tApdPatuh = 0;
    let tApdDinilai = 0;
    const tHais = { phlebitis: 0, isk: 0, ido: 0, vap: 0 };
    const tHaisCounts = { phlebitis: 0, isk: 0, ido: 0, vap: 0 };

    const unitMatch = (d: any) =>
      selectedUnit === "all" ||
      d.unit === selectedUnit ||
      d.ruangan === selectedUnit;

    hhData.filter(unitMatch).forEach((d: any) => {
      const k = getGroupKey(d.start_time || d.created_at);
      if (grouped[k]) {
        const p = Number(d.persentase) || 0;
        grouped[k].hhSum += p;
        grouped[k].hhCount++;
      }

      const pTotal = Number(d.persentase) || 0;
      totalHhPercSum += pTotal;
      hhRecordCount++;
    });

    apdData.filter(unitMatch).forEach((d: any) => {
      const k = getGroupKey(d.tanggal_waktu || d.created_at);

      // Recalculate APD to match report logic if necessary
      let p = Number(d.jumlah_patuh) || 0;
      let n = Number(d.jumlah_dinilai) || 0;

      const components = [
        "masker",
        "sarung_tangan",
        "penutup_kepala",
        "apron",
        "goggle",
        "sepatu_boot",
        "gaun_pelindung",
      ];
      let cDinilai = 0;
      let cPatuh = 0;
      components.forEach((comp) => {
        const val = String(d[comp] || "").toLowerCase();
        if (
          val === "ya" ||
          val === "sesuai" ||
          val === "tidak" ||
          val === "tidak sesuai"
        ) {
          cDinilai++;
          if (val === "ya" || val === "sesuai") cPatuh++;
        }
      });

      if (cDinilai > 0) {
        p = cPatuh;
        n = cDinilai;
      }

      if (grouped[k]) {
        grouped[k].apdPatuh += p;
        grouped[k].apdDin += n;
      }

      tApdPatuh += p;
      tApdDinilai += n;
    });

    haisData.filter(unitMatch).forEach((d: any) => {
      const k = getGroupKey(d.tanggal_waktu || d.created_at);
      const r = d.data_indikator?.rate ? parseFloat(d.data_indikator.rate) : 0;
      const type = String(d.indikator_id).toLowerCase();

      if (grouped[k]) {
        grouped[k].hCount++;
        if (type.includes("ph")) grouped[k].hPhle += r;
        else if (type.includes("isk")) grouped[k].hIsk += r;
        else if (type.includes("ido")) grouped[k].hIdo += r;
        else if (type.includes("vap")) grouped[k].hVap += r;
      }

      if (type.includes("ph")) {
        tHais.phlebitis += r;
        tHaisCounts.phlebitis++;
      } else if (type.includes("isk")) {
        tHais.isk += r;
        tHaisCounts.isk++;
      } else if (type.includes("ido")) {
        tHais.ido += r;
        tHaisCounts.ido++;
      } else if (type.includes("vap")) {
        tHais.vap += r;
        tHaisCounts.vap++;
      }
    });

    let totalFapdSum = 0;
    let fapdCount = 0;
    fapdData.filter(unitMatch).forEach((d: any) => {
      const k = getGroupKey(d.tanggal_waktu || d.created_at);
      const p = Number(d.persentase) || 0;
      if (grouped[k]) {
        grouped[k].fapdSum += p;
        grouped[k].fapdCount++;
      }
      totalFapdSum += p;
      fapdCount++;
    });

    let totalLinenSum = 0;
    let linenCount = 0;
    linenData.filter(unitMatch).forEach((d: any) => {
      const k = getGroupKey(d.tanggal_waktu || d.created_at);
      const p = Number(d.persentase) || 0;
      if (grouped[k]) {
        grouped[k].linenSum += p;
        grouped[k].linenCount++;
      }
      totalLinenSum += p;
      linenCount++;
    });

    // Simple string sort
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const getVal = (s: string) => {
        const p = s.split(" ");
        const monthIdx = [
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
        ].indexOf(p[0]);
        return monthIdx === -1 ? 0 : monthIdx;
      };
      return getVal(a) - getVal(b);
    });

    const finalChartData = sortedKeys.map((k) => {
      const g = grouped[k];
      return {
        name: k,
        hh: g.hhCount > 0 ? Number((g.hhSum / g.hhCount).toFixed(1)) : 0,
        apd:
          g.apdDin > 0 ? Number(((g.apdPatuh / g.apdDin) * 100).toFixed(1)) : 0,
        phlebitis: Number(g.hPhle.toFixed(2)),
        isk: Number(g.hIsk.toFixed(2)),
        ido: Number(g.hIdo.toFixed(2)),
        vap: Number(g.hVap.toFixed(2)),
        fasilitas_apd:
          g.fapdCount > 0 ? Number((g.fapdSum / g.fapdCount).toFixed(1)) : 0,
        linen:
          g.linenCount > 0 ? Number((g.linenSum / g.linenCount).toFixed(1)) : 0,
        _hasData: {
          hh: g.hhCount > 0,
          apd: g.apdDin > 0,
          hais: g.hCount > 0,
          fasilitas_apd: g.fapdCount > 0,
          linen: g.linenCount > 0,
        },
      };
    });

    const computedStats = {
      hh: hhRecordCount > 0 ? Math.round(totalHhPercSum / hhRecordCount) : 0,
      apd: tApdDinilai > 0 ? Math.round((tApdPatuh / tApdDinilai) * 100) : 0,
      hais: {
        phlebitis:
          tHaisCounts.phlebitis > 0
            ? Number((tHais.phlebitis / tHaisCounts.phlebitis).toFixed(2))
            : 0,
        isk:
          tHaisCounts.isk > 0
            ? Number((tHais.isk / tHaisCounts.isk).toFixed(2))
            : 0,
        ido:
          tHaisCounts.ido > 0
            ? Number((tHais.ido / tHaisCounts.ido).toFixed(2))
            : 0,
        vap:
          tHaisCounts.vap > 0
            ? Number((tHais.vap / tHaisCounts.vap).toFixed(2))
            : 0,
      },
      fasilitas_apd: fapdCount > 0 ? Math.round(totalFapdSum / fapdCount) : 0,
      linen: linenCount > 0 ? Math.round(totalLinenSum / linenCount) : 0,
    };

    return {
      units: unitsList,
      stats: computedStats,
      chartDataList: finalChartData,
    };
  }, [
    rawData,
    selectedUnit,
    filterPeriodType,
    filterMonth,
    filterQuarter,
    filterSemester,
    filterYear,
  ]);

  const getStatusColor = (val: number, std: Standard | undefined) => {
    if (!std || typeof std.nilai_standar === "undefined")
      return "text-slate-400 dark:text-slate-500";
    const pass =
      std.operator === ">="
        ? val >= std.nilai_standar
        : val <= std.nilai_standar;
    if (pass) return "text-emerald-600 dark:text-emerald-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBarColor = (val: number, stdKey?: string) => {
    const std = stdKey ? standards[stdKey] : Object.values(standards)[0];
    if (!std || typeof std.nilai_standar === "undefined") return "#64748b";
    const target = std.nilai_standar;
    const operator = std.operator;

    if (operator === ">=") {
      if (val >= target) return "#10b981";
      if (val >= target * 0.8) return "#f59e0b";
      return "#f43f5e";
    } else {
      if (val <= target) return "#10b981";
      if (val <= target * 1.5) return "#f59e0b";
      return "#f43f5e";
    }
  };

  const renderTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#181a48]/95 backdrop-blur-xl border border-indigo-300/40 p-4 rounded-2xl shadow-[0_15px_35px_rgba(10,8,35,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] text-white">
          <p className="text-sm font-black text-indigo-200 mb-2">
            {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              let status = "";
              let color = entry.color || entry.fill;
              const stdKey = activeTab === "hais" ? entry.dataKey : activeTab;
              const std = standards[stdKey];
              if (std) {
                const isHais = activeTab === "hais";
                const pass =
                  std.operator === ">="
                    ? entry.value >= std.nilai_standar
                    : entry.value <= std.nilai_standar;
                if (isHais) {
                  status = pass ? "Tercapai" : "Belum Tercapai";
                  color = pass ? "#10b981" : "#f43f5e";
                } else {
                  status =
                    entry.value >= std.nilai_standar
                      ? "Tercapai"
                      : entry.value >= std.nilai_standar * 0.8
                        ? "Mendekati"
                        : "Belum Tercapai";
                  color =
                    entry.value >= std.nilai_standar
                      ? "#10b981"
                      : entry.value >= std.nilai_standar * 0.8
                        ? "#f59e0b"
                        : "#f43f5e";
                }
              }
              return (
                <div
                  key={index}
                  className="flex justify-between gap-4 text-xs font-bold items-center"
                >
                  <span style={{ color: color }}>{entry.name}:</span>
                  <span className="text-slate-200">
                    {entry.value}{" "}
                    {activeTab === "hais"
                      ? entry.dataKey === "ido" ||
                        entry.name?.toLowerCase().includes("ido")
                        ? "%"
                        : "‰"
                      : "%"}
                    {std && (
                      <span
                        className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10"
                        style={{ color }}
                      >
                        {status}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {activeTab !== "hais" && standards[activeTab] && (
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-medium">
              Standar PPI {standards[activeTab].indikator}:{" "}
              {standards[activeTab].operator}{" "}
              {standards[activeTab].nilai_standar}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getAutoInsightAndRecommendation = () => {
    if (chartDataList.length < 1) {
      return {
        analisa: "Belum ada data monitoring yang terekam pada periode observasi yang dipilih.",
        rekomendasi: "Lakukan penginputan audit berkala dan surveilans harian di seluruh unit pelayanan untuk menghasilkan evaluasi mutu yang akurat.",
        status: "neutral" as const,
        label: "Data Belum Tersedia"
      };
    }

    // Find the last valid data point based on active tab
    const hasTabData = (d: any) => {
      if (activeTab === "hh") return d._hasData?.hh ?? true;
      if (activeTab === "apd") return d._hasData?.apd ?? true;
      if (activeTab === "hais") return d._hasData?.hais ?? true;
      if (activeTab === "fasilitas_apd") return d._hasData?.fasilitas_apd ?? true;
      if (activeTab === "linen") return d._hasData?.linen ?? true;
      return true;
    };

    const validData = chartDataList.filter((d: any) => hasTabData(d));
    const dataListToUse = validData.length > 0 ? validData : chartDataList;

    const current = dataListToUse[dataListToUse.length - 1];
    const prev =
      dataListToUse.length > 1 ? dataListToUse[dataListToUse.length - 2] : null;

    // PPI Standards and Kemenkes guidance
    if (activeTab === "hh") {
      const std = standards["hh"]?.nilai_standar || 85;
      const isMet = current.hh >= std;
      const diff = prev ? (current.hh - prev.hh) : 0;
      const trendText = prev 
        ? diff > 0 
          ? `dengan tren peningkatan sebesar +${diff.toFixed(1)}% dari periode sebelumnya` 
          : diff < 0 
            ? `dengan tren penurunan sebesar -${Math.abs(diff).toFixed(1)}% dibandingkan periode sebelumnya` 
            : `dan terpantau stabil dari periode sebelumnya`
        : "";

      const analisa = isMet
        ? `Capaian kepatuhan Hand Hygiene (Kebersihan Tangan) pada periode ini mencapai ${current.hh}% ${trendText}. Angka ini telah MEMENUHI standar mutu nasional PPI Kemenkes (Target ≥ ${std}%). Kepatuhan petugas pada 5 Momen cuci tangan dan implementasi 6 langkah kebersihan tangan berjalan efektif di unit pelayanan.`
        : `Capaian kepatuhan Hand Hygiene (Kebersihan Tangan) saat ini sebesar ${current.hh}% ${trendText}. Angka ini masih BELUM MEMENUHI standar mutu nasional PPI Kemenkes (Target ≥ ${std}%). Teridentifikasi celah ketidakpatuhan terutama pada Momen 1 (Sebelum kontak pasien) dan Momen 5 (Setelah kontak lingkungan sekitar pasien).`;

      const rekomendasi = isMet
        ? `• Pertahankan dan budayakan konsistensi 5 Momen Cuci Tangan di seluruh shift kerja (Pagi, Sore, dan Malam).\n• Lakukan audit fasilitas berkala untuk memastikan ketersediaan handrub dan sabun cuci tangan di setiap titik pelayanan (Point of Care).\n• Berikan apresiasi/reward berkala kepada unit kerja dengan tingkat kepatuhan kebersihan tangan tertinggi.`
        : `• Tingkatkan supervisi aktif dan audit kepatuhan harian oleh Tim PPI / IPCLN di setiap ruang perawatan.\n• Lakukan sosialisasi dan workshop refreshment teknik 6 langkah cuci tangan serta kepatuhan 5 momen secara berkesinambungan.\n• Evaluasi ketersediaan sarana fasilitas kebersihan tangan (dispenser handrub, sabun cair, dan tisu pengering) di setiap tempat tidur pasien.`;

      return {
        analisa,
        rekomendasi,
        status: isMet ? ("optimal" as const) : ("warning" as const),
        label: isMet ? `Target Tercapai (${current.hh}% ≥ ${std}%)` : `Perlu Peningkatan (${current.hh}% < ${std}%)`
      };
    } else if (activeTab === "apd") {
      const std = standards["apd"]?.nilai_standar || 100;
      const isMet = current.apd >= std;
      const diff = prev ? (current.apd - prev.apd) : 0;
      const trendText = prev 
        ? diff > 0 
          ? `(mengalami kenaikan +${diff.toFixed(1)}%)` 
          : diff < 0 
            ? `(mengalami penurunan -${Math.abs(diff).toFixed(1)}%)` 
            : `(stabil)`
        : "";

      const analisa = isMet
        ? `Capaian kepatuhan penggunaan Alat Pelindung Diri (APD) mencapai ${current.apd}% ${trendText}, telah SESUAI dengan standar baku mutu PPI (Target 100%). Tenaga medis dan staf klinis menggunakan APD secara tepat sesuai indikasi dan transmisi risiko paparan cairan tubuh atau agen infeksius.`
        : `Capaian kepatuhan penggunaan APD berada di level ${current.apd}% ${trendText}, masih DI BAWAH standar baku keselamatan PPI (Target 100%). Ditemukan ketidakpatuhan dalam pelepasan APD (doffing sequence) yang berisiko kontaminasi silang atau penggunaan APD yang tidak sesuai indikasi tindakan.`;

      const rekomendasi = isMet
        ? `• Pertahankan ketersediaan buffer stock APD berkualitas (masker medis, sarung tangan, gaun/apron, goggle/face shield) di seluruh unit pelayanan.\n• Lakukan pemantauan berkala terhadap kepatuhan alur pelepasan (doffing) APD yang benar.\n• Lakukan audit berkala pembuangan limbah APD bekas pakai ke wadah limbah infeksius berplastik kuning.`
        : `• Lakukan supervisi langsung 'Head-to-Head' saat tindakan invasif dan prosedur medis berisiko tinggi.\n• Refreshment edukasi mengenai urutan pemakaian (donning) dan pelepasan (doffing) APD yang aman untuk mencegah transmisi nosokomial.\n• Koordinasikan dengan Unit Farmasi dan Logistik Medis untuk memastikan ukuran dan jenis APD selalu siap pakai di setiap ruangan.`;

      return {
        analisa,
        rekomendasi,
        status: isMet ? ("optimal" as const) : ("warning" as const),
        label: isMet ? `Target Tercapai (${current.apd}%)` : `Di Bawah Standar (${current.apd}% < 100%)`
      };
    } else if (activeTab === "hais") {
      const phleStd = standards["phlebitis"]?.nilai_standar || 1.5;
      const iskStd = standards["isk"]?.nilai_standar || 5;
      const idoStd = standards["ido"]?.nilai_standar || 2;
      const vapStd = standards["vap"]?.nilai_standar || 5.8;

      const issues: string[] = [];
      if (current.phlebitis > phleStd) issues.push(`Phlebitis (${current.phlebitis} ‰ > batas ${phleStd} ‰)`);
      if (current.isk > iskStd) issues.push(`ISK (${current.isk} ‰ > batas ${iskStd} ‰)`);
      if (current.ido > idoStd) issues.push(`IDO (${current.ido}% > batas ${idoStd}%)`);
      if (current.vap > vapStd) issues.push(`VAP (${current.vap} ‰ > batas ${vapStd} ‰)`);

      const hasIssues = issues.length > 0;

      const analisa = hasIssues
        ? `Hasil surveilans HAIs menunjukkan adanya indikator laju infeksi yang MELEBIHI batas ambang toleransi standar PPI: ${issues.join(", ")}. Hal ini mengindikasikan perlunya evaluasi ketat terhadap kepatuhan Bundles HAIs pada saat pemasangan dan perawatan alat invasif.`
        : `Hasil surveilans Healthcare-Associated Infections (HAIs) periode ini terpantau AMAN DAN DI BAWAH BATAS MAKSIMAL standar nasional (Phlebitis: ${current.phlebitis} ‰, ISK: ${current.isk} ‰, IDO: ${current.ido}%, VAP: ${current.vap} ‰). Angka kejadian infeksi nosokomial terkendali dengan sangat baik.`;

      const rekomendasi = hasIssues
        ? `• Terapkan Bundles HAIs (Insertion & Maintenance Bundle) secara disiplin pada seluruh pasien dengan infus vena, kateter urine, dan ventilator.\n• Lakukan audit kepatuhan dressing kateter dan evaluasi kebutuhan pelepasan dini jika tidak ada indikasi medis (Prompt Removal).\n• Lakukan Investigasi Kasus (Root Cause Analysis/RCA) oleh Tim IPCN bersama Dokter Penanggung Jawab Pasien (DPJP) dan Kepala Ruangan.`
        : `• Pertahankan kepatuhan pelaksanaan Bundle Pencegahan HAIs di seluruh ruang rawat inap dan intensif.\n• Lakukan observasi harian tempat insersi kateter perifer/sentral dan lakukan pergantian dressing sesuai SOP.\n• Lanjutkan surveilans aktif harian oleh IPCLN untuk deteksi dini tanda-tanda infeksi nosokomial.`;

      return {
        analisa,
        rekomendasi,
        status: hasIssues ? ("danger" as const) : ("optimal" as const),
        label: hasIssues ? `Insiden Melebihi Ambang` : `Laju Infeksi Terkendali`
      };
    } else if (activeTab === "fasilitas_apd") {
      const isMet = current.fasilitas_apd >= 100;
      const analisa = isMet
        ? `Ketersediaan fasilitas dan sarana APD di seluruh unit pelayanan mencapai 100%, sangat memadai untuk mendukung perlindungan tenaga kesehatan dan pencegahan transmisi mikroorganisme.`
        : `Ketersediaan fasilitas APD terpantau di angka ${current.fasilitas_apd}%. Teridentifikasi adanya titik pelayanan atau depo unit yang mengalami kekosongan buffer stock jenis APD tertentu.`;

      const rekomendasi = isMet
        ? `• Pertahankan sistem monitoring logistik harian antara Farmasi, Gudang Medis, dan Unit Pelayanan.\n• Pastikan penyimpanan APD terlindung dari debu, kelembapan, dan paparan langsung sinar matahari.`
        : `• Segera lakukan koordinasi dan pengadaan re-stock APD ke Unit Farmasi dan Logistik Medis.\n• Tetapkan batas minimum stok darurat (Emergency Stock) di setiap ruang tindakan dan IGD.`;

      return {
        analisa,
        rekomendasi,
        status: isMet ? ("optimal" as const) : ("warning" as const),
        label: isMet ? `Fasilitas Lengkap (100%)` : `Perlu Restock (${current.fasilitas_apd}%)`
      };
    } else if (activeTab === "linen") {
      const isMet = current.linen >= 100;
      const analisa = isMet
        ? `Manajemen dan tata kelola penatalaksanaan linen bersih, pemilahan linen infeksius, hingga distribusi linen steril telah berjalan 100% sesuai standar SOP PPI dan Akreditasi Rumah Sakit.`
        : `Tingkat kepatuhan penatalaksanaan linen berada di angka ${current.linen}%. Terdapat catatan evaluasi dalam alur pemilahan kantong linen infeksius (plastik kuning) vs non-infeksius, atau kepatuhan APD staf laundry.`;

      const rekomendasi = isMet
        ? `• Pertahankan pemisahan alur troli linen kotor dan linen bersih (tidak boleh bersilangan).\n• Lakukan uji swab mikrobiologi berkala pada linen bersih pasca proses pencucian dan penyimpanan.`
        : `• Tingkatkan pengawasan pemilahan linen langsung di sumber ruangan (Point of Generation).\n• Pastikan staf laundry menggunakan APD lengkap (apron kedap air, sarung tangan heavy duty, masker, dan sepatu boots).\n• Cek suhu pencucian air panas (minimal 70°C) dan konsentrasi disinfektan/klorin sesuai standar.`;

      return {
        analisa,
        rekomendasi,
        status: isMet ? ("optimal" as const) : ("warning" as const),
        label: isMet ? `Sesuai Standar (100%)` : `Perlu Perbaikan (${current.linen}%)`
      };
    }

    return {
      analisa: "Data monitoring PPI terpantau dinamis pada periode observasi ini.",
      rekomendasi: "Lanjutkan pemantauan dan penginputan audit harian secara konsisten di setiap unit kerja.",
      status: "neutral" as const,
      label: "Monitoring Aktif"
    };
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 pt-6 text-xs font-bold text-slate-300">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-[4px] shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </div>
        ))}
        {activeTab !== "hais" && standards[activeTab] && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#0c1220] rounded-xl border border-cyan-500/30 shadow-inner">
            <div className="w-4 border-t-2 border-dashed border-[#06b6d4] drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
            <span className="text-[#06b6d4] font-bold">
              Standar PPI ({standards[activeTab].nilai_standar}%)
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient uppercase">
            Dashboard SMART PPI
          </h1>
          <div className="mt-1">
            <p
              className="text-slate-400 font-medium leading-tight max-w-[280px] sm:max-w-none mx-auto sm:mx-0 text-[14px]"
              style={{ fontSize: "14px" }}
            >
              Pencegahan Dan Pengendalian Infeksi <br className="sm:hidden" />{" "}
              di UOBK RSUD Al-Mulk Kota Sukabumi
            </p>
          </div>
        </div>

        {/* Widget Jam & Tanggal - Desktop & Landscape */}
        <div className="hidden sm:flex justify-end shrink-0">
          <ClockWidget />
        </div>
      </div>

      <HeroSlider slides={slides} isLoading={isSlidesLoading} />

      {/* Global Period Filter - 3D Tactile Container with Top Bevel Highlight */}
      <section className="relative">
        <div className="group relative bg-[#18193b] rounded-[32px] md:rounded-[36px] p-6 md:p-8 border border-[#2b2d56] transition-all duration-300 transform-gpu overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-10 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div>
                {/* Pill Capsule Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)] mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                    PERIODE MONITORING
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                  Filter & Rentang Waktu
                </h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-1">
                  Sesuaikan rentang waktu pengamatan data audit dan indikator mutu PPI
                </p>
              </div>
            </div>

            {/* Recessed Control Area */}
            <div className="w-full lg:min-w-[580px] bg-[#12132e] rounded-2xl p-3 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {/* Select Period Type */}
                <div className="relative group/select">
                  <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                    Tipe
                  </label>
                  <select
                    value={filterPeriodType}
                    onChange={(e) => setFilterPeriodType(e.target.value as any)}
                    className="w-full bg-[#161735] border border-indigo-900/40 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                  >
                    <option value="bulanan" className="bg-[#18193b] text-white">
                      BULANAN
                    </option>
                    <option value="triwulan" className="bg-[#18193b] text-white">
                      TRIWULAN
                    </option>
                    <option value="semester" className="bg-[#18193b] text-white">
                      SEMESTER
                    </option>
                    <option value="tahunan" className="bg-[#18193b] text-white">
                      TAHUNAN
                    </option>
                  </select>
                </div>

                {/* Select Detail Period */}
                <div className="relative group/select">
                  <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                    {filterPeriodType === "bulanan"
                      ? "Bulan"
                      : filterPeriodType === "triwulan"
                        ? "Triwulan"
                        : filterPeriodType === "semester"
                          ? "Semester"
                          : "Detail"}
                  </label>
                  <div className="relative">
                    {filterPeriodType === "bulanan" && (
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                        className="w-full bg-[#161735] border border-indigo-900/40 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50 hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                      >
                        {[
                          "Januari",
                          "Februari",
                          "Maret",
                          "April",
                          "Mei",
                          "Juni",
                          "Juli",
                          "Agustus",
                          "September",
                          "Oktober",
                          "November",
                          "Desember",
                        ].map((m, i) => (
                          <option key={i} value={i} className="bg-[#18193b] text-white">
                            {m}
                          </option>
                        ))}
                      </select>
                    )}
                    {filterPeriodType === "triwulan" && (
                      <select
                        value={filterQuarter}
                        onChange={(e) =>
                          setFilterQuarter(parseInt(e.target.value))
                        }
                        className="w-full bg-[#161735] border border-indigo-900/40 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                      >
                        <option value={0} className="bg-[#18193b] text-white">
                          TW 1 (Jan-Mar)
                        </option>
                        <option value={1} className="bg-[#18193b] text-white">
                          TW 2 (Apr-Jun)
                        </option>
                        <option value={2} className="bg-[#18193b] text-white">
                          TW 3 (Jul-Sep)
                        </option>
                        <option value={3} className="bg-[#18193b] text-white">
                          TW 4 (Okt-Des)
                        </option>
                      </select>
                    )}
                    {filterPeriodType === "semester" && (
                      <select
                        value={filterSemester}
                        onChange={(e) =>
                          setFilterSemester(parseInt(e.target.value))
                        }
                        className="w-full bg-[#161735] border border-indigo-900/40 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                      >
                        <option value={0} className="bg-[#18193b] text-white">
                          SM 1 (Jan-Jun)
                        </option>
                        <option value={1} className="bg-[#18193b] text-white">
                          SM 2 (Jul-Des)
                        </option>
                      </select>
                    )}
                    {filterPeriodType === "tahunan" && (
                      <div className="w-full bg-[#161735] border border-indigo-900/40 text-white text-sm font-bold rounded-xl px-4 py-3 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
                        Tahun Penuh
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Year */}
                <div className="relative group/select">
                  <label className="absolute -top-2.5 left-3 px-2 bg-[#18193b] border border-indigo-500/20 text-[9px] font-black text-indigo-300 uppercase tracking-widest z-10 rounded-md shadow-sm">
                    Tahun
                  </label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    className="w-full bg-[#161735] border border-indigo-900/40 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y} className="bg-[#18193b] text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6">
        {/* Card 1: HH Card - 3D Tactile Slate Card with Floating Isometric Plate */}
        <div className="group relative bg-[#18193b] p-7 md:p-8 rounded-[32px] md:rounded-[36px] border border-[#2b2d56] transition-all duration-300 transform-gpu hover:-translate-y-2 overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] hover:shadow-[-8px_-8px_24px_rgba(140,165,255,0.1),12px_16px_40px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.25)] flex flex-col justify-between">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div>
            {/* Header: Badge & 3D Floating Isometric Feature Plate */}
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div>
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)] mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                    INDIKATOR MUTU
                  </span>
                </div>
                <h3 className="text-[23px] font-extrabold text-white leading-snug tracking-tight">
                  Kepatuhan Kebersihan Tangan
                </h3>
              </div>

              {/* 3D Floating Isometric Plate */}
              <div className="shrink-0 relative">
                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-[16px] bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-[0_6px_16px_rgba(160,185,129,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                    <Droplets className="w-5 h-5 drop-shadow" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-xs md:text-sm font-medium mb-5 leading-relaxed relative z-10">
              Evaluasi kepatuhan 6 langkah dan 5 momen kebersihan tangan tenaga medis & non-medis.
            </p>
          </div>

          {/* Recessed Tray */}
          <div className="mt-auto bg-[#12132e] rounded-2xl p-4 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] relative z-10">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                  Capaian Periode Ini
                </span>
                <span
                  className={`text-4xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] ${stats.hh >= (standards?.hh?.nilai_standar || 85) ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {stats.hh}%
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Standar: {standards?.hh?.nilai_standar || 85}%
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-3.5 py-1 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] ${stats.hh >= (standards?.hh?.nilai_standar || 85) ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40" : "bg-rose-950/80 text-rose-300 border border-rose-500/40"}`}
                >
                  {stats.hh >= (standards?.hh?.nilai_standar || 85)
                    ? "Tercapai"
                    : "Di Bawah Standar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: APD Card - 3D Tactile Slate Card with Floating Isometric Plate */}
        <div className="group relative bg-[#18193b] p-7 md:p-8 rounded-[32px] md:rounded-[36px] border border-[#2b2d56] transition-all duration-300 transform-gpu hover:-translate-y-2 overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] hover:shadow-[-8px_-8px_24px_rgba(140,165,255,0.1),12px_16px_40px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.25)] flex flex-col justify-between">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div>
            {/* Header: Badge & 3D Floating Isometric Feature Plate */}
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div>
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)] mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                    INDIKATOR MUTU
                  </span>
                </div>
                <h3 className="text-[23px] font-extrabold text-white leading-snug tracking-tight">
                  Kepatuhan Penggunaan APD
                </h3>
              </div>

              {/* 3D Floating Isometric Plate */}
              <div className="shrink-0 relative">
                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-[16px] bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 shadow-[0_6px_16px_rgba(59,130,246,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                    <Shield className="w-5 h-5 drop-shadow" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-xs md:text-sm font-medium mb-5 leading-relaxed relative z-10">
              Monitoring penggunaan alat pelindung diri sesuai transmisi dan risiko tindakan.
            </p>
          </div>

          {/* Recessed Tray */}
          <div className="mt-auto bg-[#12132e] rounded-2xl p-4 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] relative z-10">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                  Capaian Periode Ini
                </span>
                <span
                  className={`text-4xl font-black tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] ${stats.apd >= (standards?.apd?.nilai_standar || 100) ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {stats.apd}%
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Standar: {standards?.apd?.nilai_standar || 100}%
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-3.5 py-1 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] ${stats.apd >= (standards?.apd?.nilai_standar || 100) ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40" : "bg-rose-950/80 text-rose-300 border border-rose-500/40"}`}
                >
                  {stats.apd >= (standards?.apd?.nilai_standar || 100)
                    ? "Tercapai"
                    : "Di Bawah Standar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: HAIs Card - 3D Tactile Slate Card with Floating Isometric Plate */}
        <div className="group relative bg-[#18193b] p-7 md:p-8 rounded-[32px] md:rounded-[36px] border border-[#2b2d56] transition-all duration-300 transform-gpu hover:-translate-y-2 overflow-hidden shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)] hover:shadow-[-8px_-8px_24px_rgba(140,165,255,0.1),12px_16px_40px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.25)] flex flex-col justify-between">
          {/* Top Bevel Highlight */}
          <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <div>
            {/* Header: Badge & 3D Floating Isometric Feature Plate */}
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div>
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#12132e] border border-white/10 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.06)] mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                    INDIKATOR MUTU
                  </span>
                </div>
                <h3 className="text-[23px] font-extrabold text-white leading-snug tracking-tight">
                  Surveilans HAIs
                </h3>
              </div>

              {/* 3D Floating Isometric Plate */}
              <div className="shrink-0 relative">
                <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#272952] to-[#12132d] border-2 border-indigo-400/30 shadow-[-3px_-3px_10px_rgba(140,165,255,0.12),6px_8px_18px_rgba(0,0,0,0.7),inset_1.5px_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                  <div className="w-10 h-10 rounded-[16px] bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 shadow-[0_6px_16px_rgba(168,85,247,0.5),inset_1px_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                    <AlertCircle className="w-5 h-5 drop-shadow" />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-xs md:text-sm font-medium mb-4 leading-relaxed relative z-10">
              Pemantauan insiden infeksi terkait pelayanan kesehatan seperti Phlebitis, ISK, IDO, VAP di seluruh unit rawat inap
            </p>
          </div>

          {/* Recessed Tray with 4 Mini Stats */}
          <div className="mt-auto bg-[#12132e] rounded-2xl p-3 border border-black/40 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] relative z-10">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[#18193b] p-2 rounded-xl border border-white/5 text-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                  Phlebitis
                </p>
                <p
                  className={`text-xs md:text-sm font-black ${stats.hais.phlebitis <= (standards.phlebitis?.nilai_standar || 1.5) ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {stats.hais.phlebitis}‰
                </p>
              </div>
              <div className="bg-[#18193b] p-2 rounded-xl border border-white/5 text-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                  ISK
                </p>
                <p
                  className={`text-xs md:text-sm font-black ${stats.hais.isk <= (standards.isk?.nilai_standar || 5) ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {stats.hais.isk}‰
                </p>
              </div>
              <div className="bg-[#18193b] p-2 rounded-xl border border-white/5 text-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                  IDO
                </p>
                <p
                  className={`text-xs md:text-sm font-black ${stats.hais.ido <= (standards.ido?.nilai_standar || 2) ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {stats.hais.ido}%
                </p>
              </div>
              <div className="bg-[#18193b] p-2 rounded-xl border border-white/5 text-center shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                  VAP
                </p>
                <p
                  className={`text-xs md:text-sm font-black ${stats.hais.vap <= (standards.vap?.nilai_standar || 5) ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {stats.hais.vap}‰
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Analytics Section - 3D Tactile Card Container */}
      <div className="relative group bg-[#18193b] rounded-[32px] md:rounded-[36px] border border-[#2b2d56] overflow-hidden transition-all mt-6 shadow-[-6px_-6px_20px_rgba(140,165,255,0.06),10px_12px_32px_rgba(0,0,0,0.7),inset_1px_1px_1.5px_rgba(255,255,255,0.18),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.5)]">
        {/* Top Bevel Highlight */}
        <div className="absolute top-0 inset-x-10 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-7 border-b border-indigo-900/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#141532]/60 backdrop-blur-md">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "hh",
                label: "KEBERSIHAN TANGAN",
                icon: Droplets,
              },
              {
                id: "apd",
                label: "KEPATUHAN APD",
                icon: Shield,
              },
              {
                id: "hais",
                label: "INSIDEN HAIS",
                icon: AlertCircle,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  activeTab === t.id
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[-2px_-2px_8px_rgba(140,165,255,0.2),4px_6px_16px_rgba(0,0,0,0.6),inset_1px_1px_1.5px_rgba(255,255,255,0.3)] border border-white/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <t.icon className={`w-4 h-4 ${activeTab === t.id ? "text-cyan-300" : "text-slate-400"}`} /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex bg-[#12132e] rounded-xl border border-indigo-900/40 items-center px-3 py-1.5 gap-2 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.6),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={filterPeriodType}
                onChange={(e) => setFilterPeriodType(e.target.value as any)}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-slate-300 cursor-pointer"
              >
                {["bulanan", "triwulan", "semester", "tahunan"].map((p) => (
                  <option
                    key={p}
                    value={p}
                    className="bg-[#18193b] text-white"
                  >
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>

              {filterPeriodType === "bulanan" && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    {[
                      "Januari",
                      "Februari",
                      "Maret",
                      "April",
                      "Mei",
                      "Juni",
                      "Juli",
                      "Agustus",
                      "September",
                      "Oktober",
                      "November",
                      "Desember",
                    ].map((m, i) => (
                      <option
                        key={m}
                        value={i}
                        className="bg-[#18193b] text-white"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {filterPeriodType === "triwulan" && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <select
                    value={filterQuarter}
                    onChange={(e) =>
                      setFilterQuarter(parseInt(e.target.value))
                    }
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    {[
                      "Triwulan 1",
                      "Triwulan 2",
                      "Triwulan 3",
                      "Triwulan 4",
                    ].map((q, i) => (
                      <option
                        key={q}
                        value={i}
                        className="bg-[#18193b] text-white"
                      >
                        {q}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {filterPeriodType === "semester" && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <select
                    value={filterSemester}
                    onChange={(e) =>
                      setFilterSemester(parseInt(e.target.value))
                    }
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    {["Semester 1", "Semester 2"].map((s, i) => (
                      <option
                        key={s}
                        value={i}
                        className="bg-[#18193b] text-white"
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div className="w-px h-4 bg-white/10 mx-1" />
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-200 cursor-pointer"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((y) => (
                  <option
                    key={y}
                    value={y}
                    className="bg-[#18193b] text-white"
                  >
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-[#12132e] border border-indigo-900/40 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-indigo-700/60 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.5),inset_-1px_-1px_2px_rgba(255,255,255,0.05)]"
            >
              {units.map((u) => (
                <option
                  key={u}
                  value={u}
                  className="bg-[#18193b] text-white"
                >
                  {u.toUpperCase()}
                </option>
              ))}
            </select>

            <div className="flex bg-[#12132e] rounded-xl border border-indigo-900/40 overflow-hidden p-0.5 shadow-inner">
              <button
                onClick={() => setChartMode("bar")}
                className={`p-1.5 rounded-lg transition-colors ${chartMode === "bar" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartMode("line")}
                className={`p-1.5 rounded-lg transition-colors ${chartMode === "line" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
              >
                <LineChart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {/* 3D Neumorphic Chart Stage / Plate */}
        <div className="p-4 sm:p-7">
          <div className="p-4 sm:p-6 bg-gradient-to-b from-[#12132e] to-[#0e0f24] rounded-2xl md:rounded-3xl border border-indigo-950/60 shadow-[inset_2.5px_3px_10px_rgba(0,0,0,0.85),inset_-1.5px_-1.5px_4px_rgba(140,165,255,0.06),0_4px_20px_rgba(0,0,0,0.4)] h-[360px] sm:h-[410px] relative overflow-hidden">
            {isDataLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Memuat data monitoring...</p>
              </div>
            ) : chartDataList.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={chartMode}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === "bar" ? (
                      <ComposedChart
                        data={chartDataList}
                        margin={{ top: 28, right: 10, left: -20, bottom: 20 }}
                      >
                        <defs>
                          {/* 3D Bar Dark Shadow Filter Only */}
                          <filter id="bar3DShadow" x="-40%" y="-30%" width="180%" height="160%">
                            {/* Deep dark 3D drop shadow */}
                            <feDropShadow dx="6" dy="10" stdDeviation="5" floodColor="#000000" floodOpacity="0.95" />
                            {/* Soft ambient dark shadow for depth */}
                            <feDropShadow dx="2" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.75" />
                          </filter>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 8, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          domain={
                            activeTab !== "hais" ? [0, 100] : ["auto", "auto"]
                          }
                          axisLine={false}
                          tickLine={false}
                          dx={-5}
                        />
                        <Tooltip
                          content={renderTooltipContent}
                          cursor={{ fill: "rgba(255,255,255,0.02)" }}
                        />
                        {activeTab === "hais" ? (
                          <>
                            <Bar
                              dataKey="phlebitis"
                              name="Phlebitis (‰)"
                              fill="#f43f5e"
                              radius={[4, 4, 0, 0]}
                              stackId="a"
                              filter="url(#bar3DShadow)"
                            />
                            <Bar
                              dataKey="isk"
                              name="ISK (‰)"
                              fill="#3b82f6"
                              radius={[4, 4, 0, 0]}
                              stackId="a"
                              filter="url(#bar3DShadow)"
                            />
                            <Bar
                              dataKey="ido"
                              name="IDO (%)"
                              fill="#10b981"
                              radius={[4, 4, 0, 0]}
                              stackId="a"
                              filter="url(#bar3DShadow)"
                            />
                            <Bar
                              dataKey="vap"
                              name="VAP (‰)"
                              fill="#f59e0b"
                              radius={[4, 4, 0, 0]}
                              stackId="a"
                              filter="url(#bar3DShadow)"
                            />
                          </>
                        ) : activeTab === "hh" ? (
                          <Bar
                            dataKey="hh"
                            name="Capaian HH (%)"
                            radius={[8, 8, 0, 0]}
                            filter="url(#bar3DShadow)"
                          >
                            <LabelList
                              dataKey="hh"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                            {chartDataList.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(entry.hh, "hh")}
                              />
                            ))}
                          </Bar>
                        ) : activeTab === "apd" ? (
                          <Bar
                            dataKey="apd"
                            name="Capaian APD (%)"
                            radius={[8, 8, 0, 0]}
                            filter="url(#bar3DShadow)"
                          >
                            <LabelList
                              dataKey="apd"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                            {chartDataList.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(entry.apd, "apd")}
                              />
                            ))}
                          </Bar>
                        ) : activeTab === "fasilitas_apd" ? (
                          <Bar
                            dataKey="fasilitas_apd"
                            name="Fasilitas APD (%)"
                            radius={[8, 8, 0, 0]}
                            filter="url(#bar3DShadow)"
                          >
                            <LabelList
                              dataKey="fasilitas_apd"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                            {chartDataList.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(
                                  entry.fasilitas_apd,
                                  "fasilitas_apd",
                                )}
                              />
                            ))}
                          </Bar>
                        ) : (
                          <Bar
                            dataKey="linen"
                            name="Linen (%)"
                            radius={[8, 8, 0, 0]}
                            filter="url(#bar3DShadow)"
                          >
                            <LabelList
                              dataKey="linen"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                            {chartDataList.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={getBarColor(entry.linen, "linen")}
                              />
                            ))}
                          </Bar>
                        )}
                        {standards[activeTab] && activeTab !== "hais" && (
                          <ReferenceLine
                            y={standards[activeTab]?.nilai_standar}
                            stroke="#a78bfa"
                            strokeDasharray="5 5"
                            strokeWidth={1.5}
                            label={{
                              position: "top",
                              dy: (standards[activeTab]?.nilai_standar || 85) < 100 ? -28 : -10,
                              value: `Standar ${standards[activeTab]?.nilai_standar}%`,
                              fill: "#c4b5fd",
                              fontSize: 11,
                              fontWeight: "bold",
                            }}
                          />
                        )}
                      </ComposedChart>
                    ) : (
                      <ComposedChart
                        data={chartDataList}
                        margin={{ top: 28, right: 10, left: -20, bottom: 20 }}
                      >
                        <defs>
                          {/* 3D Line Neumorphic Shadow Filter */}
                          <filter id="line3DShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="6" stdDeviation="4.5" floodColor="#000000" floodOpacity="0.8" />
                          </filter>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="rgba(255,255,255,0.05)"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 8, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                          interval={0}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          domain={
                            activeTab !== "hais" ? [0, 100] : ["auto", "auto"]
                          }
                          axisLine={false}
                          tickLine={false}
                          dx={-5}
                        />
                        <Tooltip
                          content={renderTooltipContent}
                          cursor={{ fill: "rgba(255,255,255,0.02)" }}
                        />
                        {activeTab === "hais" ? (
                          <>
                            <Line
                              type="monotone"
                              dataKey="phlebitis"
                              name="Phlebitis"
                              stroke="#f43f5e"
                              strokeWidth={3.5}
                              dot={{ r: 4.5, strokeWidth: 2 }}
                              activeDot={{ r: 7 }}
                              filter="url(#line3DShadow)"
                            />
                            <Line
                              type="monotone"
                              dataKey="isk"
                              name="ISK"
                              stroke="#3b82f6"
                              strokeWidth={3.5}
                              dot={{ r: 4.5, strokeWidth: 2 }}
                              activeDot={{ r: 7 }}
                              filter="url(#line3DShadow)"
                            />
                            <Line
                              type="monotone"
                              dataKey="ido"
                              name="IDO"
                              stroke="#10b981"
                              strokeWidth={3.5}
                              dot={{ r: 4.5, strokeWidth: 2 }}
                              activeDot={{ r: 7 }}
                              filter="url(#line3DShadow)"
                            />
                            <Line
                              type="monotone"
                              dataKey="vap"
                              name="VAP"
                              stroke="#f59e0b"
                              strokeWidth={3.5}
                              dot={{ r: 4.5, strokeWidth: 2 }}
                              activeDot={{ r: 7 }}
                              filter="url(#line3DShadow)"
                            />
                          </>
                        ) : activeTab === "hh" ? (
                          <Line
                            type="monotone"
                            dataKey="hh"
                            name="Capaian HH (%)"
                            stroke="#8b5cf6"
                            strokeWidth={3.5}
                            dot={{ r: 4.5, strokeWidth: 2 }}
                            activeDot={{ r: 7 }}
                            filter="url(#line3DShadow)"
                          >
                            <LabelList
                              dataKey="hh"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                          </Line>
                        ) : activeTab === "apd" ? (
                          <Line
                            type="monotone"
                            dataKey="apd"
                            name="Capaian APD (%)"
                            stroke="#10b981"
                            strokeWidth={3.5}
                            dot={{ r: 4.5, strokeWidth: 2 }}
                            activeDot={{ r: 7 }}
                            filter="url(#line3DShadow)"
                          >
                            <LabelList
                              dataKey="apd"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                          </Line>
                        ) : activeTab === "fasilitas_apd" ? (
                          <Line
                            type="monotone"
                            dataKey="fasilitas_apd"
                            name="Fasilitas APD (%)"
                            stroke="#9333ea"
                            strokeWidth={3.5}
                            dot={{ r: 4.5, strokeWidth: 2 }}
                            activeDot={{ r: 7 }}
                            filter="url(#line3DShadow)"
                          >
                            <LabelList
                              dataKey="fasilitas_apd"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                          </Line>
                        ) : (
                          <Line
                            type="monotone"
                            dataKey="linen"
                            name="Linen (%)"
                            stroke="#f97316"
                            strokeWidth={3.5}
                            dot={{ r: 4.5, strokeWidth: 2 }}
                            activeDot={{ r: 7 }}
                            filter="url(#line3DShadow)"
                          >
                            <LabelList
                              dataKey="linen"
                              position="top"
                              formatter={(val: number) => `${val}%`}
                              fill="#94a3b8"
                              fontSize={11}
                              fontWeight={700}
                            />
                          </Line>
                        )}
                        {standards[activeTab] && activeTab !== "hais" && (
                          <ReferenceLine
                            y={standards[activeTab]?.nilai_standar}
                            stroke="#a78bfa"
                            strokeDasharray="5 5"
                            strokeWidth={1.5}
                            label={{
                              position: "top",
                              dy: (standards[activeTab]?.nilai_standar || 85) < 100 ? -28 : -10,
                              value: `Standar ${standards[activeTab]?.nilai_standar}%`,
                              fill: "#c4b5fd",
                              fontSize: 11,
                              fontWeight: "bold",
                            }}
                          />
                        )}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
                <TrendingUp className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">
                  Tidak ada data untuk periode ini.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Auto Insight & Rekomendasi PPI Card - Matching Reference Style */}
        <div className="px-6 md:px-8 pb-8 pt-2">
          {(() => {
            const insight = getAutoInsightAndRecommendation();
            const isOptimal = insight.status === "optimal";
            const isDanger = insight.status === "danger";
            const isWarning = insight.status === "warning";

            const badgeBg = isOptimal
              ? "bg-[#102d28] text-emerald-300 border-emerald-400/40"
              : isDanger
              ? "bg-[#33141e] text-rose-300 border-rose-400/40"
              : isWarning
              ? "bg-[#332512] text-amber-300 border-amber-400/40"
              : "bg-[#151b31] text-violet-300 border-violet-400/40";

            return (
              <div className="p-6 rounded-2xl bg-[#141a30] border border-black/40 space-y-5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.85),inset_-1px_-1px_2px_rgba(255,255,255,0.06)]">
                {/* Analisa Data Section */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-violet-300 flex items-center gap-2 tracking-wide">
                      <Activity className="w-4 h-4 text-violet-400" />
                      Analisa Data Standar PPI
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${badgeBg}`}>
                      {insight.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 text-justify leading-relaxed">
                    {insight.analisa}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Rekomendasi PPI Section */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    Rekomendasi & Rencana Tindak Lanjut (RTL)
                  </h4>
                  <div className="text-sm text-slate-200 leading-relaxed space-y-1.5 whitespace-pre-line">
                    {insight.rekomendasi}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
