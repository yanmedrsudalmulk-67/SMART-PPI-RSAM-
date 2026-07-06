import { useState, useEffect, useMemo, useRef, ReactElement } from "react";
import dynamic from "next/dynamic";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import {
  AlertCircle,
  Shield,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAppContext } from "@/components/Providers";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useDashboardStore } from "@/hooks/useDashboardStore";

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
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);
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
    if (visibleSlides.length === 2) {
      return [...visibleSlides, ...visibleSlides, ...visibleSlides, ...visibleSlides];
    }
    if (visibleSlides.length === 3) {
      return [...visibleSlides, ...visibleSlides, ...visibleSlides];
    }
    return visibleSlides;
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
    if (!mounted) return 1.777;
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
  }, [mounted, currentSlide, aspectRatios, isMobile, windowWidth]);

  if (isLoading || !mounted) {
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
      className="w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto relative group overflow-hidden md:overflow-visible mb-6 mt-1 bg-slate-950/10 transition-all duration-300 ease-in-out transform-gpu will-change-[width,height]"
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
                  className={`relative w-full h-full rounded-[16px] md:rounded-[20px] overflow-hidden transition-all duration-700 ease-out transform-gpu flex items-center justify-center ${
                    isActive
                      ? "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]"
                      : "shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
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
        <div className="bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 mb-2">
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
                  <span className="text-slate-700 dark:text-slate-300">
                    {entry.value}{" "}
                    {activeTab === "hais"
                      ? entry.dataKey === "ido" ||
                        entry.name?.toLowerCase().includes("ido")
                        ? "%"
                        : "‰"
                      : "%"}
                    {std && (
                      <span
                        className="ml-2 text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded"
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
            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-medium">
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

  const generateAutoInsight = () => {
    if (chartDataList.length < 1)
      return "Data belum tersedia untuk periode observasi ini.";

    // Find the last valid data point based on active tab
    const hasTabData = (d: any) => {
      if (activeTab === "hh") return d._hasData.hh;
      if (activeTab === "apd") return d._hasData.apd;
      if (activeTab === "hais") return d._hasData.hais;
      if (activeTab === "fasilitas_apd") return d._hasData.fasilitas_apd;
      if (activeTab === "linen") return d._hasData.linen;
      return false;
    };

    const validData = chartDataList.filter((d: any) => hasTabData(d));
    const dataListToUse = validData.length > 0 ? validData : chartDataList;

    const current = dataListToUse[dataListToUse.length - 1];
    const prev =
      dataListToUse.length > 1 ? dataListToUse[dataListToUse.length - 2] : null;

    // PPI Standards and Kemenkes guidance
    // HH >= 85%, APD = 100%
    if (activeTab === "hh") {
      const std = standards["hh"]?.nilai_standar || 85;
      const isCurrentMeets = current.hh >= std;
      let text = `Analisis Capaian HH: Saat ini berada di angka ${current.hh}%. `;

      if (isCurrentMeets) {
        text += `Sudah mencapai Target Kemenkes (>= ${std}%). Pertahankan budaya cuci tangan 5 momen & 6 langkah. `;
      } else {
        text += `Belum mencapai target PPI (Target ${std}%). Rekomendasi: Lakukan audit fasilitas HH (Ketersediaan Handrub/Sabun) dan edukasi ulang (Refreshment) kepada seluruh staff. `;
      }

      if (prev) {
        const diff = current.hh - prev.hh;
        if (diff > 0)
          text += `Tren menunjukkan progres positif (+${diff.toFixed(1)}%). `;
        else if (diff < 0)
          text += `Waspadai penurunan tren sebesar ${Math.abs(diff).toFixed(1)}%. Segera lakukan investigasi kepatuhan per departemen. `;
        else text += `Tren kepatuhan terpantau stabil. `;
      }
      return text;
    } else if (activeTab === "apd") {
      const std = standards["apd"]?.nilai_standar || 100;
      const isCurrentMeets = current.apd >= std;
      let text = `Analisis Kepatuhan APD: Capaian saat ini ${current.apd}%. `;

      if (isCurrentMeets) {
        text += `Sangat Baik, sesuai standar Kemenkes/PPI. Pastikan ketersediaan stock APD tetap terjaga sesuai beban kerja. `;
      } else {
        text += `Perlu perhatian khusus karena di bawah standar (${std}%). Rekomendasi: Evaluasi ketersediaan APD di titik pelayanan dan lakukan supervisi langsung (Head to Head) pada saat tindakan medis berisiko. `;
      }

      if (prev) {
        const diff = current.apd - prev.apd;
        if (diff > 0)
          text += `Terdapat kenaikan kepatuhan (+${diff.toFixed(1)}%). `;
        else if (diff < 0)
          text += `Terdeteksi penurunan tren (${Math.abs(diff).toFixed(1)}%). Segera lakukan audit 'Peer Review' antar unit. `;
      }
      return text;
    } else if (activeTab === "hais") {
      const phleStd = standards["phlebitis"]?.nilai_standar || 1.5;
      const iskStd = standards["isk"]?.nilai_standar || 5;
      let text = "Analisis HAIs: ";
      const issues: string[] = [];
      if (current.phlebitis > phleStd)
        issues.push(
          `Phlebitis (${current.phlebitis} ‰) di atas batas ${phleStd} ‰`,
        );
      if (current.isk > iskStd)
        issues.push(`ISK (${current.isk} ‰) di atas batas ${iskStd} ‰`);

      if (issues.length > 0) {
        text += `Ditemukan insiden yang melebihi standar: ${issues.join(", ")}. Rekomendasi: Terapkan bundle monitoring secara ketat (Pemasangan & Maintenance line). `;
      } else {
        text +=
          "Seluruh indikator HAIs bulan ini berada dalam batas normal sesuai standar Kemenkes. Tetap lakukan kewaspadaan standar. ";
      }
      return text;
    } else if (activeTab === "fasilitas_apd") {
      let text = `Fasilitas APD: Ketersediaan di angka ${current.fasilitas_apd}%. `;
      if (current.fasilitas_apd < 100)
        text +=
          "Ditemukan beberapa titik point yang kekosongan stock. Koordinasikan dengan bagian Farmasi/Logistik untuk pemenuhan fasilitas. ";
      else
        text +=
          "Ketersediaan fasilitas sangat baik dan mendukung kepatuhan pencegahan infeksi. ";
      return text;
    } else if (activeTab === "linen") {
      let text = `Penatalaksanaan Linen: Capaian ${current.linen}%. `;
      if (current.linen < 100)
        text +=
          "Belum optimal sesuai standar. Rekomendasi: Pastikan alur pemisahan linen infeksius dan non-infeksius serta penggunaan APD yang benar di Laundry. ";
      else text += "Pengeleloaan linen sudah sesuai dengan standar PPI. ";
      return text;
    }
    return "Data monitoring PPI terpantau dinamis.";
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 pt-6 text-xs font-bold text-slate-600 dark:text-slate-400">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-[3px]"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </div>
        ))}
        {activeTab !== "hais" && standards[activeTab] && (
          <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="w-4 border-t-2 border-dashed border-[#06b6d4] drop-shadow-[0_0_2px_rgba(6,182,212,0.8)]" />
            <span className="text-[#06b6d4]">
              Standar PPI ({standards[activeTab].nilai_standar}%)
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-2">
        <div className="text-center lg:text-left w-full lg:w-auto">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 dark:from-blue-400 dark:via-purple-500 dark:to-blue-400 bg-[length:200%_auto] animate-gradient transition-all uppercase">
            Dashboard SMART PPI
          </h1>
          <div className="mt-1">
            <p
              className="text-slate-900 dark:text-slate-400 font-normal leading-tight max-w-[280px] sm:max-w-none mx-auto md:mx-0 text-[14px] sm:text-[14px] xl:text-[14px]"
              style={{ fontSize: "14px" }}
            >
              Pencegahan Dan Pengendalian Infeksi <br className="sm:hidden" />{" "}
              di UOBK RSUD Al-Mulk Kota Sukabumi
            </p>
          </div>
        </div>
      </div>

      <HeroSlider slides={slides} isLoading={isSlidesLoading} />

      {/* Global Period Filter - Control Center Style */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm rounded-[32px] p-6 md:p-8 border border-slate-200 dark:border-white/10 shadow-sm transition-all overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Activity className="w-24 h-24" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Pilih Periode Monitoring
                </p>
              </div>
            </div>

            <div className="glowing-border-container w-full md:w-auto lg:min-w-[600px]">
              {/* Spinning gradient layer */}
              <div className="glowing-border-bg" />
              {/* Glowing shadow layer underneath */}
              <div className="glowing-border-shadow" />

              <div className="glowing-border-inner rounded-[14px] p-2.5 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  {/* Select Period Type */}
                  <div className="relative group/select">
                    <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#111827] text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10">
                      Tipe
                    </label>
                    <select
                      value={filterPeriodType}
                      onChange={(e) => setFilterPeriodType(e.target.value as any)}
                      className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="bulanan" className="dark:bg-slate-900">
                        BULANAN
                      </option>
                      <option value="triwulan" className="dark:bg-slate-900">
                        TRIWULAN
                      </option>
                      <option value="semester" className="dark:bg-slate-900">
                        SEMESTER
                      </option>
                      <option value="tahunan" className="dark:bg-slate-900">
                        TAHUNAN
                      </option>
                    </select>
                  </div>

                  {/* Select Detail Period */}
                  <div className="relative group/select">
                    <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#111827] text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10">
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
                          className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
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
                            <option key={i} value={i} className="dark:bg-slate-900">
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
                          className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value={0} className="dark:bg-slate-900">
                            TW 1 (Jan-Mar)
                          </option>
                          <option value={1} className="dark:bg-slate-900">
                            TW 2 (Apr-Jun)
                          </option>
                          <option value={2} className="dark:bg-slate-900">
                            TW 3 (Jul-Sep)
                          </option>
                          <option value={3} className="dark:bg-slate-900">
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
                          className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                        >
                          <option value={0} className="dark:bg-slate-900">
                            SM 1 (Jan-Jun)
                          </option>
                          <option value={1} className="dark:bg-slate-900">
                            SM 2 (Jul-Des)
                          </option>
                        </select>
                      )}
                      {filterPeriodType === "tahunan" && (
                        <div className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 text-sm font-bold rounded-2xl px-4 py-4">
                          Tahun Penuh
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select Year */}
                  <div className="relative group/select">
                    <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-[#111827] text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10">
                      Tahun
                    </label>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(parseInt(e.target.value))}
                      className="w-full bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y} className="dark:bg-slate-900">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-6">
        {/* HH Card */}
        <div className="group relative bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <Droplets className="w-16 h-16 text-blue-600" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">
                Indikator Mutu
              </h3>
              <p className="text-[20px] font-bold text-slate-700 dark:text-slate-300">
                Kepatuhan Kebersihan Tangan
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span
              className={`text-6xl font-black tracking-tighter ${getStatusColor(stats.hh, standards.hh)}`}
            >
              {stats.hh}%
            </span>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[15px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Capaian
            </span>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Standard: {standards?.hh?.nilai_standar || 85}%
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${stats.hh >= (standards?.hh?.nilai_standar || 85) ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
              >
                {stats.hh >= (standards?.hh?.nilai_standar || 85)
                  ? "Tercapai"
                  : "Di Bawah Standar"}
              </span>
            </div>
          </div>
        </div>

        {/* APD Card */}
        <div className="group relative bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <Shield className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-600/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">
                Indikator Mutu
              </h3>
              <p className="text-[20px] font-bold text-slate-700 dark:text-slate-300">
                Kepatuhan Penggunaan APD
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <span
              className={`text-6xl font-black tracking-tighter ${getStatusColor(stats.apd, standards.apd)}`}
            >
              {stats.apd}%
            </span>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-[15px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Capaian
            </span>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1">
                Standard: {standards?.apd?.nilai_standar || 100}%
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${stats.apd >= (standards?.apd?.nilai_standar || 100) ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
              >
                {stats.apd >= (standards?.apd?.nilai_standar || 100)
                  ? "Tercapai"
                  : "Di Bawah Standar"}
              </span>
            </div>
          </div>
        </div>

        {/* HAIs Card */}
        <div className="group relative bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-600/20 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none mb-1">
                Indikator Mutu
              </h3>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                INSIDEN HAIs
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-[12px] border border-slate-100 dark:border-white/5">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                Phlebitis
              </p>
              <p
                className={`text-sm font-black ${getStatusColor(stats.hais.phlebitis, standards.phlebitis)}`}
              >
                {stats.hais.phlebitis} ‰
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-[12px] border border-slate-100 dark:border-white/5">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                ISK
              </p>
              <p
                className={`text-sm font-black ${getStatusColor(stats.hais.isk, standards.isk)}`}
              >
                {stats.hais.isk} ‰
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-[12px] border border-slate-100 dark:border-white/5">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                IDO
              </p>
              <p
                className={`text-sm font-black ${getStatusColor(stats.hais.ido, standards.ido)}`}
              >
                {stats.hais.ido}%
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-[12px] border border-slate-100 dark:border-white/5">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                VAP
              </p>
              <p
                className={`text-sm font-black ${getStatusColor(stats.hais.vap, standards.vap)}`}
              >
                {stats.hais.vap} ‰
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none transition-all mt-8">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "hh",
                label: "KEBERSIHAN TANGAN",
                icon: Droplets,
                c: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-500/10 dark:bg-white/10",
              },
              {
                id: "apd",
                label: "KEPATUHAN APD",
                icon: Shield,
                c: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10 dark:bg-white/10",
              },
              {
                id: "hais",
                label: "INSIDEN HAIS",
                icon: AlertCircle,
                c: "text-red-600 dark:text-red-400",
                bg: "bg-red-500/10 dark:bg-white/10",
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === t.id ? `${t.bg} ${t.c}` : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 items-center px-3 py-1 gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterPeriodType}
                onChange={(e) => setFilterPeriodType(e.target.value as any)}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 cursor-pointer"
              >
                {["bulanan", "triwulan", "semester", "tahunan"].map((p) => (
                  <option
                    key={p}
                    value={p}
                    className="bg-white dark:bg-slate-900"
                  >
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>

              {filterPeriodType === "bulanan" && (
                <>
                  <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
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
                        className="bg-white dark:bg-slate-900"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {filterPeriodType === "triwulan" && (
                <>
                  <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                  <select
                    value={filterQuarter}
                    onChange={(e) => setFilterQuarter(parseInt(e.target.value))}
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
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
                        className="bg-white dark:bg-slate-900"
                      >
                        {q}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {filterPeriodType === "semester" && (
                <>
                  <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                  <select
                    value={filterSemester}
                    onChange={(e) =>
                      setFilterSemester(parseInt(e.target.value))
                    }
                    className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {["Semester 1", "Semester 2"].map((s, i) => (
                      <option
                        key={s}
                        value={i}
                        className="bg-white dark:bg-slate-900"
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((y) => (
                  <option
                    key={y}
                    value={y}
                    className="bg-white dark:bg-slate-900"
                  >
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none"
            >
              {units.map((u) => (
                <option
                  key={u}
                  value={u}
                  className="bg-white dark:bg-slate-900"
                >
                  {u.toUpperCase()}
                </option>
              ))}
            </select>

            <div className="flex bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
              <button
                onClick={() => setChartMode("bar")}
                className={`p-2 transition-colors ${chartMode === "bar" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 dark:text-slate-500"}`}
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartMode("line")}
                className={`p-2 transition-colors ${chartMode === "line" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 dark:text-slate-500"}`}
              >
                <LineChart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-8 h-[350px] sm:h-[400px]">
          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                      margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 8, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
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
                      <Legend content={renderCustomLegend} />
                      {activeTab === "hais" ? (
                        <>
                          <Bar
                            dataKey="phlebitis"
                            name="Phlebitis (‰)"
                            fill="#f43f5e"
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                          />
                          <Bar
                            dataKey="isk"
                            name="ISK (‰)"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                          />
                          <Bar
                            dataKey="ido"
                            name="IDO (%)"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                          />
                          <Bar
                            dataKey="vap"
                            name="VAP (‰)"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                          />
                        </>
                      ) : activeTab === "hh" ? (
                        <Bar
                          dataKey="hh"
                          name="Capaian HH (%)"
                          radius={[8, 8, 0, 0]}
                        >
                          <LabelList
                            dataKey="hh"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
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
                        >
                          <LabelList
                            dataKey="apd"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
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
                        >
                          <LabelList
                            dataKey="fasilitas_apd"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
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
                        >
                          <LabelList
                            dataKey="linen"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
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
                          stroke="#06b6d4"
                          strokeDasharray="5 5"
                          label={{
                            position: "top",
                            value: `Standar ${standards[activeTab]?.nilai_standar}%`,
                            fill: "#06b6d4",
                            fontSize: 10,
                          }}
                        />
                      )}
                    </ComposedChart>
                  ) : (
                    <ComposedChart
                      data={chartDataList}
                      margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 8, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
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
                      <Legend content={renderCustomLegend} />
                      {activeTab === "hais" ? (
                        <>
                          <Line
                            type="monotone"
                            dataKey="phlebitis"
                            name="Phlebitis"
                            stroke="#f43f5e"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="isk"
                            name="ISK"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="ido"
                            name="IDO"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="vap"
                            name="VAP"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </>
                      ) : activeTab === "hh" ? (
                        <Line
                          type="monotone"
                          dataKey="hh"
                          name="Capaian HH (%)"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            dataKey="hh"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
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
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            dataKey="apd"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
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
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            dataKey="fasilitas_apd"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
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
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            dataKey="linen"
                            position="top"
                            formatter={(val: number) => `${val}%`}
                            fill="#64748b"
                            fontSize={11}
                            fontWeight={700}
                          />
                        </Line>
                      )}
                      {standards[activeTab] && activeTab !== "hais" && (
                        <ReferenceLine
                          y={standards[activeTab]?.nilai_standar}
                          stroke="#06b6d4"
                          strokeDasharray="5 5"
                          label={{
                            position: "top",
                            value: `Standar ${standards[activeTab]?.nilai_standar}%`,
                            fill: "#06b6d4",
                            fontSize: 10,
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

        {/* Auto Insight Card */}
        <div className="px-8 pb-8 pt-2">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-[#1e293b]/50 border border-blue-100 dark:border-white/5">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Analisa Data
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 text-justify leading-relaxed">
                {generateAutoInsight()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
