import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Info, Zap, RefreshCw, Play, Pause, 
  Trophy, Star, ShieldCheck, Coins, Gift,
  Volume2, VolumeX, History, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../lib/soundManager';

interface CricketCrashProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

const CricketCrash: React.FC<CricketCrashProps> = ({ onClose, balance, onUpdateBalance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [lastResults, setLastResults] = useState(['6', '4', '1', 'W', '2', '6', '1']);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [isWinner, setIsWinner] = useState(false);
  const [activeBets, setActiveBets] = useState(Math.floor(Math.random() * 500) + 200);
  const [isMuted, setIsMuted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [gameState, setGameState] = useState<'betting' | 'bowling' | 'result'>('betting');
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    soundManager.setMute(isMuted);
  }, [isMuted]);

  const runGame = () => {
    if (balance < betAmount) {
      alert("Insufficient Balance!");
      return;
    }
    if (!selectedRun) {
      alert("Please select a run (1, 2, 4, 6)!");
      return;
    }

    onUpdateBalance(balance - betAmount);
    soundManager.play('bet');
    setGameState('bowling');
    setCurrentResult(null);
    setIsWinner(false);

    const baseDelay = 2000 / gameSpeed;

    setTimeout(() => {
      const results = ['1', '2', '4', '6', 'W', '1', '2', 'W', '4', '6'];
      const result = results[Math.floor(Math.random() * results.length)];
      
      setGameState('result');
      setCurrentResult(result);
      setLastResults(prev => [result, ...prev].slice(0, 8));

      if (result === selectedRun) {
        setIsWinner(true);
        const multiplier = parseInt(result);
        onUpdateBalance(balance - betAmount + (betAmount * multiplier));
        soundManager.play('win');
      } else if (result === 'W') {
        soundManager.play('out');
      } else {
        soundManager.play('hit');
      }

      setTimeout(() => {
        setGameState('betting');
        setSelectedRun(null);
      }, baseDelay);
    }, baseDelay);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBets(prev => Math.max(100, prev + (Math.random() > 0.5 ? 5 : -5)));
    }, 3000);
    return () => {
      clearInterval(interval);
      soundManager.stopAll();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[600] bg-[#0a1a0a]/90 backdrop-blur-2xl flex flex-col overflow-hidden font-sans select-none">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 flex justify-between items-center bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Trophy size={22} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">Cricket Crash</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Elite League</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-green-500" />}
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
        {lastResults.map((r, i) => (
          <div 
            key={`cricket-hist-${i}-${r}`} 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border backdrop-blur-md transition-all ${r === 'W' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}
          >
            {r}
          </div>
        ))}
      </div>

      {/* Main Game Display */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="relative z-20 text-center">
          <AnimatePresence mode="wait">
            {gameState === 'betting' && (
              <motion.div
                key="betting"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="space-y-4"
              >
                <div className="w-32 h-32 bg-white/5 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center mx-auto">
                   <Clock size={48} className="text-yellow-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Place Your Bets</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{activeBets} Players Online</p>
              </motion.div>
            )}

            {gameState === 'bowling' && (
              <motion.div
                key="bowling"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="space-y-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 bg-red-600 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)] flex items-center justify-center mx-auto animate-bounce">
                     <div className="w-full h-1 bg-white/30 rotate-45"></div>
                  </div>
                </div>
                <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter animate-pulse">Bowling...</h3>
              </motion.div>
            )}

            {gameState === 'result' && (
              <motion.div
                key="result"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  className={`text-9xl font-black italic tracking-tighter ${currentResult === 'W' ? 'text-red-600' : 'text-green-500'}`}
                  style={{ textShadow: `0 0 50px ${currentResult === 'W' ? 'rgba(220,38,38,0.5)' : 'rgba(34,197,94,0.5)'}` }}
                >
                  {currentResult}
                </motion.div>
                {isWinner && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-4 bg-yellow-500 text-black px-8 py-2 rounded-full font-black uppercase text-xs tracking-widest shadow-xl"
                  >
                    BIG HIT! ৳{(betAmount * parseInt(currentResult || '0')).toFixed(2)}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pitch Lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-col items-center justify-end pb-20">
           <div className="w-64 h-[400px] border-x-2 border-white/20 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/20"></div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"></div>
           </div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="relative z-10 p-6 bg-black/60 backdrop-blur-xl border-t border-white/10 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setGameSpeed(s)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${gameSpeed === s ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                {s}x
              </button>
            ))}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Balance</p>
            <h4 className="text-lg font-black text-white italic">৳ {balance.toLocaleString()}</h4>
          </div>
        </div>

        {/* Run Selectors */}
        <div className="grid grid-cols-4 gap-3">
          {['1', '2', '4', '6'].map((run) => (
            <button
              key={run}
              onClick={() => setSelectedRun(run)}
              disabled={gameState !== 'betting'}
              className={`py-4 rounded-2xl border-2 font-black text-xl transition-all ripple-effect ${selectedRun === run ? 'bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
            >
              {run}x
            </button>
          ))}
        </div>

        {/* Betting Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setBetAmount(Math.max(1, betAmount - 10))} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white ripple-effect">-</button>
              <div className="text-center">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Bet</p>
                <span className="text-xl font-black text-white italic">৳ {betAmount}</span>
              </div>
              <button onClick={() => setBetAmount(betAmount + 10)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-white ripple-effect">+</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
               {[1, 2, 5, 10, 20, 50, 100, 500, 1000].map(amt => (
                 <button 
                   key={amt} 
                   onClick={() => { soundManager.play('click'); setBetAmount(amt); }}
                   className={`py-2 rounded-xl text-[10px] font-black transition-all ripple-effect border
                     ${betAmount === amt ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 border-white/10 text-yellow-500/60 hover:text-yellow-500 hover:border-yellow-500/40'}`}
                 >
                   ৳{amt}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <button 
              onClick={runGame}
              disabled={gameState !== 'betting' || !selectedRun}
              className="w-32 h-32 aspect-square bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(234,179,8,0.3)] active:scale-95 transition-all border-b-4 border-yellow-800 disabled:opacity-50 disabled:grayscale ripple-effect mx-auto"
            >
              <span className="text-2xl font-black italic text-black uppercase leading-none">Play</span>
              <span className="text-[10px] font-black text-yellow-900 uppercase tracking-widest">Start</span>
            </button>
            <button 
              onClick={runGame}
              disabled={gameState !== 'betting' || !selectedRun}
              className={`w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-sm rounded-full shadow-xl shadow-yellow-900/20 active:translate-y-1 transition-all border-b-4 border-yellow-700 ${gameState !== 'betting' || !selectedRun ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              Play Now
            </button>
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0a1a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                  <Info size={28} />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Cricket Rules</h3>
              </div>

              <div className="space-y-6 text-sm text-gray-400 font-medium leading-relaxed">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">1</div>
                  <p>আপনার বাজির পরিমাণ সেট করুন এবং একটি রান (১, ২, ৪, ৬) সিলেক্ট করুন।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">2</div>
                  <p>"Play" বাটনে ক্লিক করুন এবং বল ডেলিভারি হওয়া পর্যন্ত অপেক্ষা করুন।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">3</div>
                  <p>যদি আপনার সিলেক্ট করা রানটি আসে, তবে আপনি সেই গুণ লাভ পাবেন।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">4</div>
                  <p>যদি "W" (Wicket) আসে বা অন্য কোনো রান আসে, তবে আপনি আপনার বাজি হারাবেন।</p>
                </div>
              </div>

              <button 
                onClick={() => setShowRules(false)}
                className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase text-sm mt-10 shadow-xl shadow-red-600/20 active:scale-95 transition-all"
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

export default CricketCrash;
