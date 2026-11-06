import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Copy, Check, Wifi, X, Globe, ShieldCheck, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

interface WifiAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WifiAccessModal: React.FC<WifiAccessModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'online' | 'local'>('online');
  const [networkUrl, setNetworkUrl] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string | null>('https://www.rsudalmulkmobile.xyz');
  const [customDomain, setCustomDomain] = useState<string>('https://www.rsudalmulkmobile.xyz');
  const [isTunnelActive, setIsTunnelActive] = useState<boolean>(true);
  const [primaryIp, setPrimaryIp] = useState<string>('');
  const [port, setPort] = useState<string>('3001');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNetworkInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/network-info');
      if (res.ok) {
        const data = await res.json();
        setPrimaryIp(data.primaryIp);
        setPort(data.port);
        const local = data.networkUrl || `http://${data.primaryIp}:${data.port}`;
        setNetworkUrl(local);

        const domain = data.customDomain || 'https://www.rsudalmulkmobile.xyz';
        setCustomDomain(domain);

        const online = data.publicUrl || domain;
        setPublicUrl(online);
        setIsTunnelActive(!!data.publicUrl || !!data.isTunnelConfigured);

        const targetUrl = (activeTab === 'online') ? online : local;
        const qr = await QRCode.toDataURL(targetUrl, {
          width: 260,
          margin: 1.5,
          color: {
            dark: '#0e1026',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(qr);
      }
    } catch (err) {
      console.error('Failed to load network info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNetworkInfo();
    }
  }, [isOpen]);

  // Update QR Code when tab changes
  useEffect(() => {
    const updateQr = async () => {
      const targetUrl = activeTab === 'online' ? (publicUrl || customDomain) : networkUrl;
      if (!targetUrl) return;
      try {
        const qr = await QRCode.toDataURL(targetUrl, {
          width: 260,
          margin: 1.5,
          color: {
            dark: '#0e1026',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(qr);
      } catch (e) {
        console.error('Failed to update QR:', e);
      }
    };
    if (isOpen) {
      updateQr();
    }
  }, [activeTab, publicUrl, customDomain, networkUrl, isOpen]);

  const currentDisplayUrl = activeTab === 'online' ? (publicUrl || customDomain) : networkUrl;

  const handleCopy = () => {
    if (!currentDisplayUrl) return;
    navigator.clipboard.writeText(currentDisplayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-3xl overflow-hidden border border-indigo-400/30 bg-gradient-to-b from-[#1b1938] via-[#14152e] to-[#0c0e1e] p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_1px_1px_2px_rgba(255,255,255,0.2)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 border-b border-indigo-900/50 pb-4">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-lg text-white tracking-wide">
                Akses HP & Tablet Petugas
              </h3>
            </div>
            <p className="text-xs text-indigo-200/75 mt-0.5">
              UOBK RSUD AL-MULK — Akses Input & Monitoring Lapangan
            </p>
          </div>
        </div>

        {/* Tabs: Online vs Lokal */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#0e1026] border border-indigo-900/60 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('online')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'online'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Online (Bebas WiFi)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'local'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-indigo-400" />
            <span>WiFi RSUD Al-Mulk</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4">
          {activeTab === 'online' ? (
            /* TAB ONLINE */
            <>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#0d0f22]/70 border border-emerald-500/30">
                {/* QR Code display */}
                <div className="relative shrink-0 flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-lg">
                  {loading ? (
                    <div className="w-[150px] h-[150px] flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  ) : qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Online Cloudflare"
                      className="w-[150px] h-[150px] rounded-xl object-contain block"
                    />
                  ) : (
                    <div className="w-[150px] h-[150px] flex items-center justify-center text-slate-500 text-xs text-center p-2">
                      Gagal memuat QR
                    </div>
                  )}
                  <span className="text-[10px] text-slate-600 font-bold mt-1 tracking-tight">
                    Scan via HP (Bebas WiFi)
                  </span>
                </div>

                {/* Petunjuk Online */}
                <div className="flex-1 space-y-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Domain Resmi Aktif
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    Petugas bisa membuka aplikasi dari HP menggunakan <strong>paket data seluler biasa</strong> (Telkomsel, Indosat, XL, dll) di mana saja.
                  </p>
                  <p className="text-slate-300/80 text-[11px]">
                    🔒 Database dan data rekam medik PPI tetap aman tersimpan di komputer server RSUD Al-Mulk.
                  </p>
                </div>
              </div>

              {/* URL Online Box */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Domain Resmi SMART PPI (Cloudflare HTTPS):
                  </span>
                  <a
                    href={publicUrl || customDomain}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 hover:underline"
                  >
                    Buka Website <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl bg-[#090b17] border border-emerald-500/40 text-emerald-300 select-all overflow-x-auto truncate">
                    {publicUrl || customDomain}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md active:scale-95 transition-all shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAB LOKAL WIFI */
            <>
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#0d0f22]/70 border border-indigo-900/40">
                {/* QR Code display */}
                <div className="relative shrink-0 flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl shadow-lg">
                  {loading ? (
                    <div className="w-[150px] h-[150px] flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  ) : qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Akses SMART PPI"
                      className="w-[150px] h-[150px] rounded-xl object-contain block"
                    />
                  ) : (
                    <div className="w-[150px] h-[150px] flex items-center justify-center text-slate-500 text-xs text-center p-2">
                      Gagal memuat QR
                    </div>
                  )}
                  <span className="text-[10px] text-slate-600 font-bold mt-1 tracking-tight">
                    Scan via WiFi RSUD
                  </span>
                </div>

                {/* Quick Steps */}
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/30 text-cyan-300 font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-slate-200">
                      Pastikan HP terhubung ke <strong>WiFi RSUD AL-MULK</strong> yang sama.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/30 text-cyan-300 font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-slate-200">
                      Scan QR Code di samping atau ketik alamat IP di Chrome/Safari HP.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/30 text-cyan-300 font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-slate-200">
                      Data otomatis tersimpan langsung ke komputer server.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct URL Box */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  Alamat IP Lokal (Browser HP):
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl bg-[#090b17] border border-indigo-800/60 text-cyan-300 select-all overflow-x-auto truncate">
                    {networkUrl || (loading ? 'Mendeteksi IP...' : `http://${primaryIp}:${port}`)}
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={!networkUrl}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md active:scale-95 transition-all shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Note Info */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200/90 text-[11px] leading-relaxed flex items-start gap-2">
            <span className="font-bold text-amber-400 shrink-0">💡 Catatan Server:</span>
            <span>
              Komputer server di RSUD Al-Mulk harus tetap menyala dan terhubung ke internet agar petugas di lapangan dapat menginput dan memonitor data secara real-time.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={fetchNetworkInfo}
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Perbarui Status</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
