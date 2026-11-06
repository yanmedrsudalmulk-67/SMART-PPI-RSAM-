import { useState } from 'react';
import { useSafeRouter as useRouter } from '@/hooks/useSafeRouter';
import { Lock, User, ArrowRight, Building2, AtSign, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLogo } from '@/components/AppLogo';

/* ================= Gaya Neumorphism (Dark) ================= */
// Permukaan timbul (raised) untuk card utama
const neuCard =
  'bg-gradient-to-br from-[#121a2e] to-[#0b1120] border border-white/[0.04] ' +
  'shadow-[-12px_-12px_28px_rgba(255,255,255,0.035),16px_16px_36px_rgba(0,0,0,0.8),inset_1px_1px_1px_rgba(255,255,255,0.06)]';

// Permukaan cekung (pressed / inset) untuk kolom isian
const neuInput =
  'bg-[#0d1324] border border-white/[0.03] block w-full pl-12 pr-4 py-3.5 text-sm text-white rounded-2xl outline-none ' +
  'placeholder:text-slate-600 transition-all duration-300 ' +
  'shadow-[inset_5px_5px_10px_rgba(0,0,0,0.7),inset_-4px_-4px_9px_rgba(255,255,255,0.035)] ' +
  'focus:border-blue-500/30 focus:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.7),inset_-4px_-4px_9px_rgba(255,255,255,0.035),0_0_0_3px_rgba(59,130,246,0.12)]';

// Wadah ikon kecil timbul di dalam kolom
const neuIconWrap = 'absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none';
const neuIcon = 'h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]';

const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2.5 pl-1';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [unit, setUnit] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Simpan akun IPCLN ke server lokal (SQLite)
      const res = await fetch('/api/auth/ipcln', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          fullName: fullName.trim(),
          username: username.trim(),
          unit,
          password,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.ok) {
        setError(result.error || 'Gagal mendaftarkan akun. Coba lagi.');
        setIsLoading(false);
        return;
      }

      setSuccess(`Akun "${result.user.username}" berhasil didaftarkan. Mengalihkan ke halaman login...`);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError('Tidak dapat terhubung ke server SMART PPI. Pastikan server sedang berjalan.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          {/* Plat logo neumorphic */}
          <div className="mb-2 p-3 rounded-[28px] bg-gradient-to-br from-[#121a2e] to-[#0b1120] shadow-[-8px_-8px_18px_rgba(255,255,255,0.035),10px_10px_24px_rgba(0,0,0,0.8),inset_1px_1px_1px_rgba(255,255,255,0.06)]">
            <AppLogo className="w-16 h-16" iconClassName="w-10 h-10" />
          </div>
        </motion.div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white tracking-widest uppercase drop-shadow-[3px_3px_6px_rgba(0,0,0,0.8)]">
          Daftar Akun IPCLN
        </h2>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className={`${neuCard} p-8 sm:px-10 rounded-[32px]`}>
          <form className="space-y-5" onSubmit={handleRegister}>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-medium shadow-[inset_3px_3px_8px_rgba(0,0,0,0.5)]">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-400 text-xs font-medium shadow-[inset_3px_3px_8px_rgba(0,0,0,0.5)]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Nama Lengkap
              </label>
              <div className="relative group">
                <div className={neuIconWrap}>
                  <User className={neuIcon} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={neuInput}
                  placeholder="Nama lengkap Anda"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className={labelClass}>
                Username
              </label>
              <div className="relative group">
                <div className={neuIconWrap}>
                  <AtSign className={neuIcon} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  minLength={3}
                  maxLength={32}
                  pattern="[A-Za-z0-9._\-]{3,32}"
                  title="3-32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung (tanpa spasi)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  className={neuInput}
                  placeholder="Contoh: ipcln.igd"
                />
              </div>
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="unit" className={labelClass}>
                Unit Kerja
              </label>
              <div className="relative group">
                <div className={neuIconWrap}>
                  <Building2 className={neuIcon} />
                </div>
                <select
                  id="unit"
                  name="unit"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`${neuInput} appearance-none cursor-pointer`}
                >
                  <option value="" className="bg-[#0a0f1c]">Pilih Unit Kerja</option>
                  <option value="igd" className="bg-[#0a0f1c]">IGD</option>
                  <option value="icu" className="bg-[#0a0f1c]">ICU</option>
                  <option value="ranap" className="bg-[#0a0f1c]">Rawat Inap</option>
                  <option value="ok" className="bg-[#0a0f1c]">Kamar Operasi</option>
                  <option value="poli" className="bg-[#0a0f1c]">Poliklinik</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative group">
                <div className={neuIconWrap}>
                  <Lock className={neuIcon} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={neuInput}
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-400/30 focus:outline-none transition-all duration-200 disabled:opacity-70 shadow-[-6px_-6px_14px_rgba(255,255,255,0.04),8px_8px_18px_rgba(0,0,0,0.75),inset_1px_1px_1px_rgba(255,255,255,0.3)] hover:from-blue-400 hover:to-blue-600 active:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.45),inset_-3px_-3px_8px_rgba(255,255,255,0.12)] active:scale-[0.99]"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Mendaftarkan...' : 'Daftar Akun'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">Sudah punya akun? </span>
              <button onClick={(e) => { e.preventDefault(); router.push('/login'); }} className="text-blue-400 hover:text-purple-300 transition-colors bg-transparent border-none p-0 cursor-pointer text-[10px] font-bold uppercase tracking-widest">
                Login di sini
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
