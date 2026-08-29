import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/components/Providers';
import { AppLogo } from '@/components/AppLogo';

export default function LoginPage() {
  const router = useRouter();
  const { setUserRole } = useAppContext();
  const [role, setRole] = useState('IPCN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (role === 'IPCN') {
      if ((username === 'PPI RSAM' || username === 'admin') && (password === 'PPI RSAM' || password === 'admin')) {
        setUserRole('IPCN');
        router.push('/dashboard');
      } else {
        setError('Username atau password salah untuk IPCN.');
        setIsLoading(false);
      }
    } else {
      if (username && password) {
         setUserRole('IPCLN');
         router.push('/dashboard');
      } else {
         setError('Harap isi username dan password.');
         setIsLoading(false);
      }
    }
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen transition-colors duration-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans ${isDark ? 'bg-[#0a0f1c]' : 'bg-white'}`}>
      {/* Dynamic Animated Background Blob like index page */}
      <motion.div
        animate={{
          scale: [1, 1.2, 0.9, 1.1, 1],
          rotate: [0, 90, 180, 270, 360],
          borderRadius: ["40% 60% 70% 30%", "50% 50% 30% 70%", "60% 40% 50% 50%", "30% 70% 70% 30%", "40% 60% 70% 30%"]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-gradient-to-tr blur-[80px] opacity-60 pointer-events-none transition-colors duration-1000 ${isDark ? 'mix-blend-screen from-blue-600/40 via-purple-600/40 to-emerald-500/40' : 'mix-blend-multiply from-[#38C968]/30 via-[#0F3D2E]/20 to-[#38C968]/30 opacity-70 blur-[100px]'}`}
      />

      {/* Background Glows */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-700 ${isDark ? 'bg-blue-600/10' : 'bg-blue-600/5'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none transition-colors duration-700 ${isDark ? 'bg-purple-600/10' : 'bg-purple-600/5'}`} />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="mb-0">
            <AppLogo className="w-20 h-20" iconClassName="w-12 h-12" />
          </div>
        </motion.div>
        <h2 className={`mt-1.5 text-center text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r bg-[length:200%_auto] animate-gradient uppercase ${isDark ? 'from-blue-400 via-purple-500 to-blue-400' : 'from-blue-500 via-emerald-500 to-blue-500'}`}>
          SMART PPI
        </h2>
        <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          Silakan masuk ke akun Anda
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="bg-slate-50/50 dark:bg-white/5 backdrop-blur-sm p-8 sm:px-10 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Role Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Login Sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                {['IPCN', 'IPCLN'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setError('');
                    }}
                    className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${
                      role === r 
                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                Email / Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white rounded-2xl outline-none transition-all placeholder:text-slate-400 shadow-inner dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"
                  placeholder={role === 'IPCN' ? "PPI RSAM" : "Masukkan username"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 block w-full pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white rounded-2xl outline-none transition-all placeholder:text-slate-400 shadow-inner dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/20 text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all disabled:opacity-70 group"
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
                {!isLoading && (
                  <motion.div 
                    animate={{ x: [0, 6, 0], scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </motion.div>
                )}
              </button>
            </div>
            
            {role === 'IPCLN' && (
              <div className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400">Belum punya akun? </span>
                <button onClick={(e) => { e.preventDefault(); router.push('/register'); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-purple-300 transition-colors bg-transparent border-none p-0 cursor-pointer text-[10px] font-bold uppercase tracking-widest">
                  Daftar di sini
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}
