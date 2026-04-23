import React, { useState, useEffect } from 'react';
import { X, Loader2, Maximize2, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CasinoGameOverlayProps {
  gameId: string;
  username: string;
  balance: number;
  onClose: () => void;
}

const CasinoGameOverlay: React.FC<CasinoGameOverlayProps> = ({ gameId, username, balance, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const fetchGameUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/casino/game-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username, 
            gameId,
            currency: 'BDT',
            balance: balance || 0
          }),
        });

        const data = await response.json();
        
        if (data.code === 0 && data.payload?.game_launch_url) {
          setGameUrl(data.payload.game_launch_url);
        } else {
          setError(data.msg || 'Failed to get game launch URL');
        }
      } catch (err) {
        console.error('Error launching game:', err);
        setError('Network error: Could not connect to game server');
      } finally {
        setLoading(false);
      }
    };

    fetchGameUrl();
  }, [gameId, username]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[1200] bg-black flex flex-col ${isFullScreen ? 'p-0' : 'p-0 md:p-4'}`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1110] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400/10 rounded-lg flex items-center justify-center border border-yellow-500/20 text-yellow-500">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">L's Secure Gaming</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Authenticated Session</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
          >
            <Maximize2 size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all text-red-500"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#050706] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0d1110]/95 backdrop-blur-md"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-yellow-500 animate-pulse tracking-tighter">LB</span>
                </div>
              </div>
              <p className="mt-8 text-sm font-black text-white uppercase tracking-[0.4em] animate-pulse">Initializing Table...</p>
              <div className="mt-4 flex gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#0d1110]"
            >
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                <AlertCircle className="text-red-500" size={48} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-3">Launch Error</h2>
              <p className="text-sm text-gray-500 max-w-sm mb-10 leading-relaxed uppercase tracking-tight">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 hover:bg-white/10"
                >
                  <RefreshCw size={18} /> Reload Engine
                </button>
                <button 
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-red-500/20 transition-all active:scale-95"
                >
                  Close Terminal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {gameUrl && !error && (
          <iframe 
            src={gameUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; camera; microphone; geolocation"
            title="Casino Game"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>

      <div className="px-5 py-3 bg-[#0d1110] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-md border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Stable Connection</span>
          </div>
          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.2em] font-mono">LBX-SECURE-PRO-v4</span>
        </div>
        
        <div className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <span>Evolution Live Node</span>
          <span className="text-gray-700">•</span>
          <span>BD/S104</span>
        </div>
      </div>
    </motion.div>
  );
};

export default CasinoGameOverlay;
