import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Smartphone, Apple, Download, Globe, ShieldCheck } from 'lucide-react';

interface DownloadAppOverlayProps {
  onClose: () => void;
}

const APP_LINK = "https://l-s-baji.vercel.app/";

const DownloadAppOverlay: React.FC<DownloadAppOverlayProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDownload = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('App Installed');
      }
      setDeferredPrompt(null);
      onClose();
    } else {
      // Fallback for iOS or if already installed/unsupported
      window.open(APP_LINK, '_blank');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#060808]/90 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg glass-panel overflow-hidden"
      >
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="p-8 pb-4 border-b border-white/10 flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-1">Install Mobile App</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available for Android & iOS</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 relative z-10">
          {/* Main Download Card */}
          <div 
            onClick={handleDownload}
            className="elite-glass p-1 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-[2rem] cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 group"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-24 h-24 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden p-1">
                <div className="w-full h-full rounded-2xl overflow-hidden">
                  <img src="https://i.ibb.co/JjnF0Y5p/Gemini-Generated-Image-637gcy637gcy637g.png" alt="App Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Official App Experience</h3>
                <p className="text-xs font-medium text-gray-400 mt-1">Tap here to install directly to your phone</p>
                <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest group-hover:bg-yellow-400 transition-colors">
                  <Download size={14} /> {deferredPrompt ? 'Install App Now' : 'Download Now'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* iOS Instructions */}
            <div className="elite-glass p-6 border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <Apple size={24} className="text-gray-300 group-hover:text-white" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">iOS (Safari)</h4>
              </div>
              <ul className="text-[10px] space-y-2 text-gray-400 font-bold uppercase leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">1</span>
                  <span>Open URL in Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">2</span>
                  <span>Tap the 'Share' icon</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">3</span>
                  <span>Select 'Add to Home Screen'</span>
                </li>
              </ul>
            </div>

            {/* Android Instructions */}
            <div className="elite-glass p-6 border-white/5 hover:border-green-500/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone size={24} className="text-gray-300 group-hover:text-green-500" />
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Android (Chrome)</h4>
              </div>
              <ul className="text-[10px] space-y-2 text-gray-400 font-bold uppercase leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">1</span>
                  <span>Click 'Install App Now' above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">2</span>
                  <span>Or tap Chrome 3-dots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px]">3</span>
                  <span>Tap 'Install App'</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="pt-4 flex items-center justify-center gap-6 opacity-60">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-yellow-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Secure Install</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Web App</span>
            </div>
          </div>
        </div>

        <div className="p-8 pt-0 relative z-10">
          <button 
            onClick={handleDownload}
            className="w-full py-4 bg-yellow-500 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-yellow-500/20 active:scale-95 transition-all"
          >
            {deferredPrompt ? 'Install to Phone' : 'Open in Browser'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DownloadAppOverlay;
