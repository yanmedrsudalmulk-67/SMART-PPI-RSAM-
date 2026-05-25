import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/Providers';
import { ShieldCheck, Activity, Clock, Sun, Moon, BarChart3, TrendingUp } from 'lucide-react';

import { supabase } from '@/lib/supabase';

export default function WelcomePage() {
  const router = useRouter();
  const { hospitalLogoUrl } = useAppContext();
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeBackground, setActiveBackground] = useState<{ url: string; type: string } | null>({
    url: 'https://labs.google/fx/api/og-video/shared/c011686b-71a2-4cb1-909a-f47eb46eeb28',
    type: 'video/mp4'
  });

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 640);
    
    // Fetch active background
    const fetchBackground = async () => {
      try {
        const { data, error } = await supabase
          .from('welcome_backgrounds')
          .select('public_url, file_type')
          .eq('is_active', true)
          .limit(1)
          .single();
        if (data && !error) {
          setActiveBackground({ url: data.public_url, type: data.file_type });
        }
      } catch (err) {
        // Table might not exist yet, fallback gracefully
      }
    };
    fetchBackground();
    
    // Resume correct theme from local storage if available
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
    } else {
      setIsDark(true);
    }
    setTime(new Date());

    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);

    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sync theme changes with HTML root
  useEffect(() => {
    if (!mounted) return;
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark, mounted]);

  return (
    <div className={`h-screen w-full transition-colors duration-700 ease-in-out relative flex flex-col items-center justify-center overflow-hidden font-sans ${isDark ? 'bg-[#0a0f1c] text-white' : 'bg-gradient-to-br from-white via-emerald-50 to-emerald-100 text-[#0A2F1D]'}`}>
      <Head>
        <link rel="preload" as="video" href="https://labs.google/fx/api/og-video/shared/c011686b-71a2-4cb1-909a-f47eb46eeb28" type="video/mp4" />
      </Head>
      {/* Background Media */}
      {isDark && (
        <>
          {activeBackground ? (
            activeBackground.type.startsWith('image/') ? (
              <div 
                className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0 bg-no-repeat bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: `url(${activeBackground.url})` }}
              />
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: `
                  <video
                    autoplay="autoplay"
                    loop="loop"
                    muted="muted"
                    defaultMuted="true"
                    playsinline="playsinline"
                    webkit-playsinline="true"
                    preload="auto"
                    oncontextmenu="return false;"
                    class="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0 transition-opacity duration-1000"
                    src="${activeBackground.url}"
                  ></video>
                ` }}
              />
            )
          ) : (
            <div 
              dangerouslySetInnerHTML={{ __html: `
                <video
                  autoplay="autoplay"
                  loop="loop"
                  muted="muted"
                  defaultMuted="true"
                  playsinline="playsinline"
                  webkit-playsinline="true"
                  preload="auto"
                  oncontextmenu="return false;"
                  class="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0 transition-opacity duration-1000"
                  src="https://labs.google/fx/api/og-video/shared/c011686b-71a2-4cb1-909a-f47eb46eeb28"
                ></video>
              ` }}
            />
          )}
          {/* Top / Bottom Black Shadow Gradients for Video */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-black/90 to-transparent pointer-events-none z-0" />
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-0" />
        </>
      )}

      {/* Decorative Floating Glass UI Widgets */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden max-w-[1440px] mx-auto w-full z-10">
        {/* Widget 1: Digital Clock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, type: "spring", bounce: 0.5 }}
          className="absolute md:top-[20%] md:left-[8%] lg:top-[20%] lg:left-[12%] hidden md:block z-30 md:scale-100 lg:scale-100 origin-top-left"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
            className={`flex items-center gap-3 backdrop-blur-xl shadow-2xl pointer-events-auto transition-colors duration-500 p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80 text-[#0F3D2E]'}`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-500 drop-shadow flex-shrink-0 ${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-[#38C968]/20 border-[#38C968]/30'}`}>
              <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-[#0A2F1D]'}`} />
            </div>
            <div className="flex flex-col min-w-[70px]">
              <motion.span 
                 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
                 className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-bold transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}
              >
                Waktu Sistem
              </motion.span>
              <motion.span 
                 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }}
                 className={`text-xs sm:text-sm font-bold font-mono tracking-widest leading-none mt-0.5 transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0A2F1D]'}`}
              >
                {time ? time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'}
              </motion.span>
            </div>
          </motion.div>
        </motion.div>

        {/* Widget 2: Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.8, type: "spring", bounce: 0.5 }}
          className="absolute md:bottom-[25%] md:right-[15%] lg:bottom-[25%] lg:right-[15%] hidden md:block z-30 md:scale-100 lg:scale-100 origin-bottom-right"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className={`flex items-center gap-3 backdrop-blur-xl shadow-2xl pointer-events-auto transition-colors duration-500 p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80 text-[#0F3D2E]'}`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-500 drop-shadow flex-shrink-0 ${isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-[#38C968]/20 border-[#38C968]/30'}`}>
              <Activity className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDark ? 'text-emerald-400' : 'text-[#0F3D2E]'}`} />
            </div>
            <div className="flex flex-col">
              <motion.span 
                 initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
                 className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-right transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}
              >
                Standar PPI
              </motion.span>
              <motion.span 
                 initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}
                 className={`text-xs sm:text-sm font-bold text-right leading-none mt-0.5 transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0A2F1D]'}`}
              >
                Real-time
              </motion.span>
            </div>
          </motion.div>
        </motion.div>

        {/* Widget 3: Percentage (Capaian) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.9, type: "spring", bounce: 0.5 }}
          className="absolute md:top-[45%] md:left-[5%] lg:top-[48%] lg:left-[10%] hidden md:block z-30 md:scale-100 lg:scale-100 origin-top-left"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className={`flex items-center gap-3 backdrop-blur-xl shadow-2xl pointer-events-auto transition-colors duration-500 p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80 text-[#0F3D2E]'}`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-500 drop-shadow flex-shrink-0 ${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-[#38C968]/20 border-[#38C968]/30'}`}>
              <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-[#0A2F1D]'}`} />
            </div>
            <div className="flex flex-col min-w-[60px]">
              <span className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-bold transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}>CAPAIAN</span>
              <span className={`text-sm sm:text-xl font-black tracking-tighter leading-none mt-0.5 transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0A2F1D]'}`}>98%</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Widget 4: Graph (Visual) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1, type: "spring", bounce: 0.5 }}
          className="absolute md:top-[32%] md:right-[8%] lg:top-[35%] lg:right-[12%] hidden md:block z-30 md:scale-100 lg:scale-100 origin-top-right"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className={`flex items-center gap-4 backdrop-blur-xl shadow-2xl pointer-events-auto transition-colors duration-500 p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/60 border-white/80 hover:bg-white/80 text-[#0F3D2E]'}`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-colors duration-500 drop-shadow flex-shrink-0 ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-[#38C968]/20 border-[#38C968]/30'}`}>
              <BarChart3 className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-purple-400' : 'text-[#0A2F1D]'}`} />
            </div>
            <div className="flex flex-col">
              <span className={`text-[8px] sm:text-[10px] uppercase tracking-wider font-bold transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}>GRAFIK</span>
              <div className="flex items-end gap-1 mt-1 h-3 sm:h-4">
                {[40, 75, 55, 90, 60].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [`${h}%`, `${h+10}%`, `${h}%`] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                    className={`w-1.5 sm:w-2 rounded-t-[2px] ${isDark ? 'bg-purple-500/60' : 'bg-[#38C968]/60'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full px-6 md:px-12 py-6 flex items-center justify-between z-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <div className={`w-12 h-12 flex-shrink-0 border rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-md transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/80 shadow-sm'}`}>
            {hospitalLogoUrl ? (
              <img src={hospitalLogoUrl} alt="Logo RS" className="w-full h-full object-contain p-1" />
            ) : (
              <ShieldCheck className={`w-6 h-6 transition-colors duration-500 ${isDark ? 'text-blue-500' : 'text-[#0F3D2E]'}`} />
            )}
          </div>
          
          <div className="flex flex-col text-left transition-colors duration-500">
            <span className={`font-heading font-bold text-sm md:text-base tracking-wide leading-tight transition-colors duration-500 ${isDark ? 'text-white' : 'text-[#0F3D2E]'}`}>
              UOBK RSUD AL-MULK
            </span>
            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}>
              KOTA SUKABUMI
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <AnimatePresence mode="wait">
            <motion.span 
              key={isDark ? "dark" : "light"}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`font-heading font-bold text-lg md:text-xl transition-colors duration-500 tracking-wide hidden sm:block ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/60'}`}
            >
              {isDark ? 'Dark' : 'Light'}
            </motion.span>
          </AnimatePresence>
          
          <button
            onClick={() => setIsDark(!isDark)}
            className={`relative w-[84px] sm:w-[94px] h-[40px] sm:h-[48px] rounded-full p-1.5 flex items-center transition-all duration-500 ease-in-out cursor-pointer overflow-hidden ${
              isDark 
                ? 'bg-[#1e293b]/80 backdrop-blur-md shadow-inner border border-slate-700/50' 
                : 'bg-white/80 backdrop-blur-md shadow-inner border border-white/80'
            }`}
          >
            <div className={`absolute left-[12px] sm:left-[14px] top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${!isDark ? 'opacity-100' : 'opacity-30'}`}>
              <Sun className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-[#0F3D2E]/50'}`} />
            </div>
            
            <div className={`absolute right-[12px] sm:right-[14px] top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
              <Moon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500 ${isDark ? 'text-slate-600' : 'text-[#0F3D2E]'}`} />
            </div>

            <motion.div
              animate={{ 
                x: isDark ? (isMobile ? 44 : 46) : 0, 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`relative h-[28px] w-[28px] sm:h-[36px] sm:w-[36px] flex items-center justify-center rounded-full shadow-lg z-10 transition-colors duration-500 ${isDark ? 'bg-blue-600' : 'bg-[#38C968]'}`}
            >
                {isDark ? <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
            </motion.div>
          </button>
        </motion.div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 mt-12 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          className="text-center max-w-4xl w-full flex flex-col items-center"
        >
          <h1 className="text-6xl md:text-[100px] lg:text-[120px] font-black leading-[1.1] tracking-tighter relative mb-6 md:mb-10 lg:mb-8">
              <motion.span 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ duration: 0.8, delay: 0.6 }}
                className={`block text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient ${isDark ? 'from-blue-400 via-purple-500 to-blue-400' : 'from-blue-500 via-emerald-500 to-blue-500'}`}
              >
                SMART PPI
              </motion.span>
          </h1>
          
          <motion.div 
             initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }}
             className={`text-[14px] sm:text-[16px] md:text-2xl lg:text-[20px] max-w-3xl mx-auto mb-14 flex flex-col leading-relaxed text-center font-medium gap-1 transition-colors duration-500 ${isDark ? 'text-slate-300' : 'text-[#0F3D2E]/80'}`}
          >
            <span>Sistem Monitoring, Audit dan Supervisi Terintegrasi</span>
            <span>Pencegahan dan Pengendalian Infeksi</span>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 1 }}
            className="z-30 relative"
          >
            <button 
              onClick={() => router.push('/login')}
              className={`group relative inline-flex items-center justify-center px-14 py-5 font-bold text-white text-lg rounded-full shadow-lg hover:-translate-y-1 w-full transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              <span className="relative z-10 flex items-center gap-3 tracking-wider">
                Ayo Mulai
                <motion.span 
                  animate={{ x: [0, 5, 0] }} 
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block"
                >
                  →
                </motion.span>
              </span>
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
