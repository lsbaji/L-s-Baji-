import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, TrendingUp, History, Wallet, 
  AlertCircle, X, ChevronRight, Zap, 
  ShieldCheck, Info, Clock, Trophy,
  Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../lib/soundManager';

interface AviatorGameProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

const AviatorGame: React.FC<AviatorGameProps> = ({ onClose, balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(100);
  const [multiplier, setMultiplier] = useState(1.0);
  const [isFlying, setIsFlying] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [gameHistory, setGameHistory] = useState([1.45, 2.10, 1.12, 5.40, 1.05, 1.88, 3.22, 1.10]);
  const [crashPoint, setCrashPoint] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [showRules, setShowRules] = useState(false);
  
  const [isAutoTab, setIsAutoTab] = useState(false);
  const [autoBetEnabled, setAutoBetEnabled] = useState(false);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState(2.0);
  
  // Visual feedback states
  const [flashColor, setFlashColor] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const activeAudios = useRef<HTMLAudioElement[]>([]);

  const hasCashedOutRef = useRef(false);
  const autoBetEnabledRef = useRef(false);
  const autoCashoutEnabledRef = useRef(false);
  const autoCashoutValueRef = useRef(2.0);
  const betAmountRef = useRef(100);
  const balanceRef = useRef(balance);
  const isFlyingRef = useRef(false);
  const isCrashedRef = useRef(false);

  useEffect(() => { autoBetEnabledRef.current = autoBetEnabled; }, [autoBetEnabled]);
  useEffect(() => { autoCashoutEnabledRef.current = autoCashoutEnabled; }, [autoCashoutEnabled]);
  useEffect(() => { autoCashoutValueRef.current = autoCashoutValue; }, [autoCashoutValue]);
  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { isFlyingRef.current = isFlying; }, [isFlying]);
  useEffect(() => { isCrashedRef.current = isCrashed; }, [isCrashed]);

  useEffect(() => {
    soundManager.setMute(isMuted);
  }, [isMuted]);

  const stopAllSounds = () => {
    soundManager.stopAll();
  };

  const triggerFlash = (color: string) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 500);
  };

  const cashOut = (exactMultiplier?: number) => {
    if (!isFlyingRef.current || hasCashedOutRef.current || isCrashedRef.current) return;
    
    const finalMultiplier = exactMultiplier || multiplier;
    const winAmount = betAmountRef.current * finalMultiplier;
    onUpdateBalance(balanceRef.current + winAmount);
    soundManager.play('win');
    triggerFlash('green');
    setHasCashedOut(true);
    hasCashedOutRef.current = true;
  };

  const startGame = () => {
    if (balanceRef.current < betAmountRef.current) {
      alert("Insufficient Balance!");
      setAutoBetEnabled(false);
      return;
    }
    
    const random = Math.random();
    let point;
    if (random < 0.15) point = 1.0 + Math.random() * 0.1;
    else if (random < 0.75) point = 1.1 + Math.random() * 2.5;
    else point = 3.5 + Math.random() * 12.0;

    setCrashPoint(point);
    onUpdateBalance(balanceRef.current - betAmountRef.current);
    soundManager.play('bet');
    setTimeout(() => soundManager.play('takeoff'), 500);
    setMultiplier(1.0);
    setIsFlying(true);
    setIsCrashed(false);
    setHasCashedOut(false);
    hasCashedOutRef.current = false;
    isFlyingRef.current = true;
    isCrashedRef.current = false;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newMultiplier = Math.pow(1.18, elapsed * gameSpeed);
      
      if (newMultiplier >= point) {
        handleCrash(point);
      } else {
        setMultiplier(newMultiplier);
        if (autoCashoutEnabledRef.current && newMultiplier >= autoCashoutValueRef.current && !hasCashedOutRef.current) {
          cashOut(newMultiplier);
        }
      }
    }, 50);
  };

  const handleCrash = (finalPoint: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    soundManager.play('crash');
    triggerFlash('red');
    setIsCrashed(true);
    setIsFlying(false);
    isCrashedRef.current = true;
    isFlyingRef.current = false;
    setGameHistory(prev => [parseFloat(finalPoint.toFixed(2)), ...prev].slice(0, 12));
  };

  useEffect(() => {
    if (isCrashed && autoBetEnabled) {
      const timer = setTimeout(() => {
        if (autoBetEnabledRef.current) {
          startGame();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isCrashed, autoBetEnabled]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAllSounds();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[600] bg-[#05050a]/90 backdrop-blur-2xl flex flex-col overflow-y-auto font-sans select-none">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-full">
        {/* Header */}
        <div className="relative z-10 p-4 flex justify-between items-center bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <Plane size={22} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">Aviator</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Server</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-red-500" />}
            </button>
            <button 
              onClick={() => setShowRules(true)}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-red-950/40 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* History Bar */}
        <div className="relative z-10 px-4 py-3 bg-black/20 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <History size={14} className="text-gray-500 shrink-0" />
          {gameHistory.map((h, i) => (
            <div 
              key={`history-${i}-${h}`} 
              className={`px-3 py-1 rounded-full text-[10px] font-black border backdrop-blur-md transition-all ${h >= 2 ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}
            >
              {h.toFixed(2)}x
            </div>
          ))}
        </div>

        {/* Main Game Display */}
        <div className={`flex-1 relative flex flex-col items-center justify-center p-6 min-h-[300px] overflow-hidden transition-colors duration-300 ${flashColor === 'green' ? 'bg-green-900/20' : flashColor === 'red' ? 'bg-red-900/20' : ''}`}>
          <div className="relative z-20 text-center">
            <motion.h1 
              key={multiplier}
              className={`text-6xl sm:text-8xl font-black italic tracking-tighter transition-colors duration-300 ${isCrashed ? 'text-red-600' : 'text-white'}`}
              style={{ textShadow: isCrashed ? '0 0 40px rgba(220,38,38,0.5)' : '0 0 40px rgba(255,255,255,0.2)' }}
            >
              {multiplier.toFixed(2)}x
            </motion.h1>
            {isCrashed && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 bg-red-600 text-white px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest shadow-xl inline-block"
              >
                Flew Away!
              </motion.div>
            )}
          </div>

          <div className="absolute inset-0 z-10">
            <AnimatePresence>
              {isFlying && (
                <motion.div
                  initial={{ x: -100, y: 100, opacity: 0 }}
                  animate={{ 
                    x: 200, 
                    y: -200, 
                    opacity: 1,
                    rotate: -15
                  }}
                  exit={{ x: 500, y: -500, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute bottom-1/4 left-1/4 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                >
                  <Plane size={80} fill="currentColor" />
                  <div className="absolute -left-4 top-1/2 w-8 h-4 bg-orange-500 blur-md rounded-full animate-pulse"></div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
            </div>
          </div>
        </div>

        {/* Controls Area */}
        <div className="relative z-10 p-4 sm:p-6 bg-black/60 backdrop-blur-xl border-t border-white/10 space-y-4 sm:space-y-6 mt-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3 bg-white/5 p-1 rounded-xl border border-white/5">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setGameSpeed(s)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all ${gameSpeed === s ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Balance</p>
                <h4 className="text-base sm:text-lg font-black text-white italic">৳ {balance.toLocaleString()}</h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex bg-white/5 rounded-xl p-1 mb-4">
                <button onClick={() => setIsAutoTab(false)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isAutoTab ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Bet</button>
                <button onClick={() => setIsAutoTab(true)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isAutoTab ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Auto</button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setBetAmount(Math.max(10, betAmount - 10))} className="w-12 h-12 shrink-0 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all ripple-effect border border-white/10">-</button>
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    value={betAmount} 
                    onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))} 
                    className="w-full bg-black/50 border-2 border-white/10 rounded-xl h-12 px-4 text-xl font-black text-white italic focus:outline-none focus:border-red-500 transition-all text-center"
                  />
                  <p className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0f172a] px-2 text-[8px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Bet Amount</p>
                </div>
                <button onClick={() => setBetAmount(betAmount + 10)} className="w-12 h-12 shrink-0 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all ripple-effect border border-white/10">+</button>
              </div>

              {!isAutoTab ? (
                <>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                     {[1, 2, 5, 10, 20, 50, 100, 500, 1000].map(amt => (
                       <button 
                         key={amt} 
                         onClick={() => { soundManager.play('click'); setBetAmount(amt); }}
                         className={`py-2 rounded-xl text-[10px] font-black transition-all ripple-effect border
                           ${betAmount === amt ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-white/5 border-white/10 text-red-500/60 hover:text-red-500 hover:border-red-500/40'}`}
                       >
                         ৳{amt}
                       </button>
                     ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setBetAmount(betAmount * 2)} className="py-2 bg-white/5 rounded-lg text-[10px] font-black uppercase text-gray-400 hover:bg-white/10 ripple-effect">Double</button>
                    <button onClick={() => setBetAmount(Math.floor(betAmount / 2))} className="py-2 bg-white/5 rounded-lg text-[10px] font-black uppercase text-gray-400 hover:bg-white/10 ripple-effect">Half</button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">Auto Bet</p>
                    </div>
                    <button 
                      onClick={() => setAutoBetEnabled(!autoBetEnabled)}
                      className={`w-10 h-5 rounded-full p-1 transition-colors ${autoBetEnabled ? 'bg-green-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoBetEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">Auto Cashout</p>
                      </div>
                      <button 
                        onClick={() => setAutoCashoutEnabled(!autoCashoutEnabled)}
                        className={`w-10 h-5 rounded-full p-1 transition-colors ${autoCashoutEnabled ? 'bg-orange-500' : 'bg-white/10'}`}
                      >
                        <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoCashoutEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    {autoCashoutEnabled && (
                      <div className="flex items-center justify-between bg-black/40 rounded-lg p-2 border border-white/5">
                        <button onClick={() => setAutoCashoutValue(Math.max(1.1, autoCashoutValue - 0.1))} className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:text-white">-</button>
                        <span className="text-sm font-black text-orange-400 italic">{autoCashoutValue.toFixed(2)}x</span>
                        <button onClick={() => setAutoCashoutValue(autoCashoutValue + 0.1)} className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:text-white">+</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-4 mt-4 sm:mt-0">
              {!isFlying ? (
                <div className="relative">
                  <button 
                    onClick={startGame}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] border-4 border-green-500 bg-green-600 hover:bg-green-500 hover:shadow-[0_0_50px_rgba(34,197,94,0.5)]"
                  >
                    <span className="text-xl sm:text-2xl font-black italic text-white uppercase leading-none">Play</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => cashOut()}
                    disabled={hasCashedOut}
                    className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] border-4 border-orange-500 bg-orange-600 hover:bg-orange-500 hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] ${hasCashedOut ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    <span className="text-xl sm:text-2xl font-black italic text-white uppercase leading-none">Cash</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      ৳{(betAmount * multiplier).toFixed(0)}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                  <Info size={28} />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Aviator Rules</h3>
              </div>

              <div className="space-y-6 text-sm text-gray-400 font-medium leading-relaxed">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">1</div>
                  <p>আপনার বাজির পরিমাণ (Bet Amount) সেট করুন এবং "BET" বাটনে ক্লিক করুন।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">2</div>
                  <p>প্লেনটি ওড়া শুরু করলে মাল্টিপ্লায়ার (Multiplier) বাড়তে থাকবে।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">3</div>
                  <p>প্লেনটি ক্র্যাশ হওয়ার আগেই "CASH OUT" বাটনে ক্লিক করে আপনার লাভ সংগ্রহ করুন।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">4</div>
                  <p>যদি প্লেনটি ক্র্যাশ হওয়ার আগে আপনি ক্যাশ আউট না করেন, তবে আপনি আপনার বাজি হারাবেন।</p>
                </div>
              </div>

              <button 
                onClick={() => setShowRules(false)}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-sm mt-10 shadow-xl shadow-red-600/20 active:scale-95 transition-all"
              >
                বুঝেছি (Got it)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AviatorGame;
