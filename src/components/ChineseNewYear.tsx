import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Info, Zap, RefreshCw, Play, Pause, Trophy, Star, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../lib/soundManager';

interface ChineseNewYearProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

type SymbolType = 'Lion' | 'Frog' | 'Drum' | 'Envelope' | 'Coins' | 'Firecracker' | 'A' | 'K' | 'Q' | 'J' | '10' | 'Scatter';

interface GameSymbol {
  id: string;
  type: SymbolType;
  isWinning: boolean;
}

const SYMBOLS: SymbolType[] = ['Frog', 'Drum', 'Envelope', 'Coins', 'Firecracker', 'A', 'K', 'Q', 'J', '10'];
const PAYOUTS: Record<SymbolType, number> = {
  'Lion': 0, 'Scatter': 0,
  'Frog': 2.0, 'Drum': 1.5, 'Envelope': 1.0, 'Coins': 0.8, 'Firecracker': 0.6,
  'A': 0.4, 'K': 0.3, 'Q': 0.2, 'J': 0.1, '10': 0.05
};

const SYMBOL_ICONS: Record<SymbolType, { icon: string, color: string }> = {
  'Lion': { icon: '🦁', color: 'text-yellow-500' },
  'Scatter': { icon: '🟢', color: 'text-green-500' },
  'Frog': { icon: '🐸', color: 'text-green-600' },
  'Drum': { icon: '🥁', color: 'text-red-500' },
  'Envelope': { icon: '🧧', color: 'text-red-600' },
  'Coins': { icon: '🪙', color: 'text-yellow-400' },
  'Firecracker': { icon: '🧨', color: 'text-red-500' },
  'A': { icon: 'A', color: 'text-white' },
  'K': { icon: 'K', color: 'text-white' },
  'Q': { icon: 'Q', color: 'text-white' },
  'J': { icon: 'J', color: 'text-white' },
  '10': { icon: '10', color: 'text-white' }
};

const MULTIPLIERS = [1, 2, 3, 6, 12, 24, 48, 96];
const FREE_GAME_MULTIPLIERS = [2, 4, 6, 12, 24, 48, 96, 192, 384, 768, 1536];

const ChineseNewYear: React.FC<ChineseNewYearProps> = ({ onClose, balance, onUpdateBalance }) => {
  const [grid, setGrid] = useState<GameSymbol[][]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [multiplierIndex, setMultiplierIndex] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [winAmount, setWinAmount] = useState(0);
  const [isFreeGame, setIsFreeGame] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [displayWin, setDisplayWin] = useState(0);
  const activeAudios = useRef<HTMLAudioElement[]>([]);

  useEffect(() => {
    soundManager.setMute(isMuted);
  }, [isMuted]);

  const handleClose = () => {
    soundManager.stopAll();
    onClose();
  };

  let symbolIdCounter = 0;
  const generateSymbol = (): GameSymbol => {
    const rand = Math.random();
    let type: SymbolType;
    if (rand < 0.02) type = 'Scatter';
    else if (rand < 0.05) type = 'Lion';
    else type = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    return {
      id: `sym_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${symbolIdCounter++}`,
      type,
      isWinning: false
    };
  };

  const initGrid = () => {
    const newGrid = Array(6).fill(null).map(() => 
      Array(5).fill(null).map(() => generateSymbol())
    );
    setGrid(newGrid);
  };

  useEffect(() => {
    initGrid();
    return () => {
      activeAudios.current.forEach(a => {
        a.pause();
        a.currentTime = 0;
      });
    };
  }, []);

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!isFreeGame && balance < betAmount) {
      alert("Insufficient Balance!");
      setIsAuto(false);
      return;
    }

    if (!isFreeGame) {
      onUpdateBalance(balance - betAmount);
    } else {
      setFreeSpinsLeft(prev => prev - 1);
      if (freeSpinsLeft <= 1) {
        setIsFreeGame(false);
      }
    }

    setIsSpinning(true);
    setWinAmount(0);
    setMultiplierIndex(0);
    soundManager.play('spin');

    const newGrid = Array(6).fill(null).map(() => 
      Array(5).fill(null).map(() => generateSymbol())
    );
    setGrid(newGrid);

    await new Promise(r => setTimeout(r, isTurbo ? 300 : 800));
    checkWins(newGrid, 0, 0);
  };

  const checkWins = async (currentGrid: GameSymbol[][], currentMultIdx: number, currentWin: number) => {
    let winningPositions: { col: number, row: number }[] = [];
    let scatterCount = 0;

    currentGrid.forEach(col => col.forEach(sym => {
      if (sym.type === 'Scatter') scatterCount++;
    }));

    // Simplified Megaways win logic: matching symbols on adjacent reels starting from leftmost
    const firstColSymbols = new Set(currentGrid[0].map(s => s.type));
    
    firstColSymbols.forEach(symType => {
      if (symType === 'Scatter' || symType === 'Lion') return;
      
      let matchCols = 1;
      let tempPositions: { col: number, row: number }[] = [];
      
      // Find all matching in first col
      currentGrid[0].forEach((s, r) => {
        if (s.type === symType || s.type === 'Lion') tempPositions.push({col: 0, row: r});
      });

      for (let col = 1; col < 6; col++) {
        let foundInCol = false;
        currentGrid[col].forEach((s, r) => {
          if (s.type === symType || s.type === 'Lion') {
            tempPositions.push({col, row: r});
            foundInCol = true;
          }
        });
        if (foundInCol) matchCols++;
        else break;
      }

      if (matchCols >= 3) {
        tempPositions.forEach(p => winningPositions.push(p));
      }
    });

    if (winningPositions.length > 0) {
      const updatedGrid = [...currentGrid];
      winningPositions.forEach(p => {
        updatedGrid[p.col][p.row].isWinning = true;
      });
      setGrid(updatedGrid);
      soundManager.play('win');

      const currentMults = isFreeGame ? FREE_GAME_MULTIPLIERS : MULTIPLIERS;
      const mult = currentMults[Math.min(currentMultIdx, currentMults.length - 1)];

      let spinWin = winningPositions.length * 0.2 * betAmount * mult; // Simplified payout calculation
      const totalWin = currentWin + spinWin;
      setWinAmount(totalWin);
      setDisplayWin(totalWin);

      await new Promise(r => setTimeout(r, isTurbo ? 400 : 800));

      // Cascade
      const nextGrid = updatedGrid.map(col => {
        const newCol = col.filter(sym => !sym.isWinning);
        while (newCol.length < 5) {
          newCol.unshift(generateSymbol());
        }
        return newCol;
      });

      setGrid(nextGrid);
      soundManager.play('cascade');
      
      const nextMultIdx = currentMultIdx + 1;
      setMultiplierIndex(nextMultIdx);

      checkWins(nextGrid, nextMultIdx, totalWin);
    } else {
      if (winAmount > 0) {
        onUpdateBalance(balance + winAmount);
      }

      if (scatterCount >= 4 && !isFreeGame) {
        soundManager.play('scatter');
        setIsFreeGame(true);
        setFreeSpinsLeft(10);
      }

      setIsSpinning(false);
    }
  };

  useEffect(() => {
    if ((isAuto || (isFreeGame && freeSpinsLeft > 0)) && !isSpinning) {
      const timer = setTimeout(handleSpin, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuto, isSpinning, isFreeGame, freeSpinsLeft]);

  const currentMults = isFreeGame ? FREE_GAME_MULTIPLIERS : MULTIPLIERS;
  const currentMult = currentMults[Math.min(multiplierIndex, currentMults.length - 1)];

  return (
    <div className="fixed inset-0 z-[600] bg-[#1a0510]/95 backdrop-blur-2xl flex flex-col overflow-y-auto font-sans select-none">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ff0000 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-full">
        {/* Header */}
        <div className="relative z-10 p-4 flex justify-between items-center bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <span className="text-xl">🦁</span>
            </div>
            <div>
              <h2 className="text-xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 tracking-tighter leading-none">Chinese New Year</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                <p className="text-[9px] font-black text-yellow-500/60 uppercase tracking-widest">Moreways</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
              {isMuted ? <Zap size={18} className="opacity-30" /> : <Zap size={18} className="text-yellow-500" />}
            </button>
            <button onClick={() => setShowRules(true)} className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
              <Info size={20} />
            </button>
            <button onClick={handleClose} className="w-10 h-10 bg-red-950/40 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Multiplier Bar */}
        <div className="relative z-10 px-4 py-4 flex justify-center">
          <div className="flex gap-1 sm:gap-2 bg-black/40 backdrop-blur-2xl p-2 rounded-[2rem] border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-x-auto no-scrollbar max-w-full">
            {currentMults.slice(0, 8).map((m, i) => (
              <div 
                key={`cny-mult-${i}-${m}`}
                className={`min-w-[40px] sm:min-w-[50px] py-2 rounded-xl text-center font-black italic transition-all relative overflow-hidden ${currentMult === m ? 'bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-110 z-10' : 'bg-white/5 text-gray-500'}`}
              >
                <span className="relative z-10 text-sm sm:text-base">x{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 relative z-10 min-h-[300px]">
          <AnimatePresence>
            {isFreeGame && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 bg-green-500 text-black px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-30"
              >
                Free Games: {freeSpinsLeft}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative p-1 bg-gradient-to-br from-red-600 via-red-800 to-red-600 rounded-[2rem] shadow-[0_0_50px_rgba(220,38,38,0.2)] w-full max-w-2xl mx-auto">
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5 w-full bg-[#1a0505] p-1.5 sm:p-2 rounded-[1.8rem] relative overflow-hidden">
              {grid.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1 sm:gap-1.5">
                  {col.map((sym) => (
                    <motion.div
                      key={sym.id}
                      layout
                      initial={{ y: -100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`aspect-square rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 ${sym.isWinning ? 'scale-90 brightness-125 z-20 shadow-[0_0_20px_rgba(255,255,255,0.5)]' : ''} bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/10`}
                    >
                      {sym.isWinning && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-white z-10"
                        />
                      )}
                      <span className={`text-2xl sm:text-4xl drop-shadow-md ${SYMBOL_ICONS[sym.type].color}`}>
                        {SYMBOL_ICONS[sym.type].icon}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win Display */}
          <div className="mt-4 sm:mt-6 relative flex flex-col items-center h-20">
            <AnimatePresence>
              {displayWin > 0 && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <p className="text-[10px] font-black text-yellow-500/60 uppercase tracking-[0.3em] mb-1">Win</p>
                  <h3 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 italic tracking-tighter drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                    ৳ {displayWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 p-4 sm:p-6 bg-white/10 backdrop-blur-2xl border-t border-white/20 shadow-[0_-8px_32px_0_rgba(0,0,0,0.3)] space-y-4 sm:space-y-6 mt-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex justify-between w-full sm:w-auto gap-4">
              <div className="bg-white/5 px-4 sm:px-5 py-2 rounded-2xl border border-white/10 flex-1 sm:flex-none">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Balance</p>
                <h4 className="text-base sm:text-lg font-black text-white italic">৳ {balance.toLocaleString()}</h4>
              </div>
              
              <div className="flex items-center gap-4 bg-white/5 px-3 sm:px-4 py-2 rounded-2xl border border-white/10 flex-1 sm:flex-none">
                <div className="text-center w-full">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Bet Amount</p>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setBetAmount(Math.max(1, betAmount - 10))} className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-lg flex items-center justify-center text-yellow-500 font-black hover:bg-white/20 transition-colors">-</button>
                    <span className="text-lg sm:text-xl font-black text-yellow-500 italic min-w-[60px] sm:min-w-[80px] text-center">৳ {betAmount}</span>
                    <button onClick={() => setBetAmount(betAmount + 10)} className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-lg flex items-center justify-center text-yellow-500 font-black hover:bg-white/20 transition-colors">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
              <button 
                onClick={() => setIsTurbo(!isTurbo)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 font-black uppercase text-[9px] sm:text-[10px] flex flex-col items-center justify-center gap-1 transition-all ${isTurbo ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white/5 text-gray-500 border-white/10'}`}
              >
                <Zap size={14} fill={isTurbo ? "currentColor" : "none"} />
                Turbo
              </button>
              
              <button 
                onClick={handleSpin}
                disabled={isSpinning}
                className="relative group"
              >
                <div className="absolute -inset-4 bg-red-600/20 blur-2xl rounded-full group-active:scale-150 transition-transform"></div>
                <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-800 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.4)] active:scale-90 transition-all relative z-10 border-4 border-red-900/40 ${isSpinning ? 'opacity-80' : ''}`}>
                  <RefreshCw size={40} className={`${isSpinning ? 'animate-spin' : ''} drop-shadow-md sm:w-[52px] sm:h-[52px]`} />
                </div>
              </button>

              <button 
                onClick={() => setIsAuto(!isAuto)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 font-black uppercase text-[9px] sm:text-[10px] flex flex-col items-center justify-center gap-1 transition-all ${isAuto ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white/5 text-gray-500 border-white/10'}`}
              >
                {isAuto ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                Auto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChineseNewYear;
