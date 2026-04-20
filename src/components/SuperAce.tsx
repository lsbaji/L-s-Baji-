import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Info, Zap, RefreshCw, Play, Pause, 
  Trophy, Star, ShieldCheck, Coins, Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../lib/soundManager';

interface SuperAceProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

type SymbolType = 'A' | 'K' | 'Q' | 'J' | 'Spade' | 'Heart' | 'Club' | 'Diamond' | 'Scatter' | 'SmallJoker' | 'BigJoker';

interface GameSymbol {
  id: string;
  type: SymbolType;
  isGolden: boolean;
  isWinning: boolean;
}

const SYMBOLS: SymbolType[] = ['A', 'K', 'Q', 'J', 'Spade', 'Heart', 'Club', 'Diamond'];
const PAYOUTS: Record<SymbolType, number> = {
  'A': 0.1, 'K': 0.08, 'Q': 0.06, 'J': 0.04,
  'Spade': 0.02, 'Heart': 0.015, 'Club': 0.01, 'Diamond': 0.005,
  'Scatter': 0, 'SmallJoker': 0, 'BigJoker': 0
};

const SYMBOL_ICONS: Record<SymbolType, { icon: string, color: string }> = {
  'A': { icon: 'A', color: 'text-white' },
  'K': { icon: 'K', color: 'text-white' },
  'Q': { icon: 'Q', color: 'text-white' },
  'J': { icon: 'J', color: 'text-white' },
  'Spade': { icon: '♠', color: 'text-slate-900' },
  'Heart': { icon: '♥', color: 'text-red-600' },
  'Club': { icon: '♣', color: 'text-blue-700' },
  'Diamond': { icon: '♦', color: 'text-cyan-500' },
  'Scatter': { icon: 'SCATTER', color: 'text-yellow-500' },
  'SmallJoker': { icon: 'WILD', color: 'text-purple-500' },
  'BigJoker': { icon: 'WILD', color: 'text-orange-500' }
};

const SuperAce: React.FC<SuperAceProps> = ({ onClose, balance, onUpdateBalance }) => {
  const [grid, setGrid] = useState<GameSymbol[][]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [comboCount, setComboCount] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [winAmount, setWinAmount] = useState(0);
  const [jackpot, setJackpot] = useState(10000);
  const [isFreeGame, setIsFreeGame] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showBigWin, setShowBigWin] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [displayWin, setDisplayWin] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const activeAudios = useRef<HTMLAudioElement[]>([]);

  const updateJackpot = (win: number) => {
    if (win > betAmount * 10) {
      setJackpot(10000); // Reset
    } else {
      setJackpot(prev => prev + Math.floor(betAmount * 0.1));
    }
  };

  useEffect(() => {
    soundManager.setMute(isMuted);
  }, [isMuted]);

  let symbolIdCounter = 0;
  const generateSymbol = (colIndex: number): GameSymbol => {
    const rand = Math.random();
    let type: SymbolType;
    if (rand < 0.03) type = 'Scatter';
    else type = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    const isGolden = (colIndex >= 1 && colIndex <= 3) && Math.random() < 0.15 && type !== 'Scatter';
    
    return {
      id: `sym_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${symbolIdCounter++}`,
      type,
      isGolden,
      isWinning: false
    };
  };

  const initGrid = () => {
    const newGrid = Array(5).fill(null).map((_, col) => 
      Array(4).fill(null).map(() => generateSymbol(col))
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

  const handleClose = () => {
    activeAudios.current.forEach(a => {
      a.pause();
      a.currentTime = 0;
    });
    onClose();
  };

  const generateLosingGrid = (): GameSymbol[][] => {
    const grid: GameSymbol[][] = Array(5).fill(null).map(() => []);
    const col0Symbols: SymbolType[] = ['A', 'K', 'Q', 'J'];
    const col1Symbols: SymbolType[] = ['Spade', 'Heart', 'Club', 'Diamond'];
    for(let r=0; r<4; r++) {
      grid[0][r] = { id: Math.random().toString(36).substr(2, 9), type: col0Symbols[r], isGolden: false, isWinning: false };
      grid[1][r] = { id: Math.random().toString(36).substr(2, 9), type: col1Symbols[r], isGolden: false, isWinning: false };
      grid[2][r] = { id: Math.random().toString(36).substr(2, 9), type: SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)], isGolden: false, isWinning: false };
      grid[3][r] = { id: Math.random().toString(36).substr(2, 9), type: SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)], isGolden: false, isWinning: false };
      grid[4][r] = { id: Math.random().toString(36).substr(2, 9), type: SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)], isGolden: false, isWinning: false };
    }
    return grid;
  };

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
    setComboCount(0);
    setMultiplier(isFreeGame ? 2 : 1);
    soundManager.play('spin');

    setSpinCount(prev => prev + 1);

    let newGrid: GameSymbol[][];
    // 10% win rate after 5 spins
    if (spinCount >= 5 && Math.random() > 0.10 && !isFreeGame) {
       newGrid = generateLosingGrid();
    } else {
       newGrid = Array(5).fill(null).map((_, col) => 
         Array(4).fill(null).map(() => generateSymbol(col))
       );
    }
    setGrid(newGrid);

    await new Promise(r => setTimeout(r, isTurbo ? 300 : 800));
    checkWins(newGrid, isFreeGame ? 2 : 1, 0);
    updateJackpot(0);
  };

  const checkWins = async (currentGrid: GameSymbol[][], currentMult: number, currentWin: number) => {
    let winningPositions: { col: number, row: number }[] = [];
    let scatterCount = 0;

    currentGrid.forEach(col => col.forEach(sym => {
      if (sym.type === 'Scatter') scatterCount++;
    }));

    const winSymbols = new Set<string>();
    for (let row = 0; row < 4; row++) {
      const firstSym = currentGrid[0][row].type;
      if (firstSym === 'Scatter') continue;

      let matchCount = 1;
      let positions = [{ col: 0, row }];

      for (let col = 1; col < 5; col++) {
        let found = false;
        for (let r = 0; r < 4; r++) {
          if (currentGrid[col][r].type === firstSym || currentGrid[col][r].type === 'SmallJoker' || currentGrid[col][r].type === 'BigJoker') {
            positions.push({ col, row: r });
            found = true;
          }
        }
        if (found) matchCount++;
        else break;
      }

      if (matchCount >= 3) {
        positions.forEach(p => winningPositions.push(p));
        winSymbols.add(firstSym);
      }
    }

    if (winningPositions.length > 0) {
      const updatedGrid = [...currentGrid];
      winningPositions.forEach(p => {
        updatedGrid[p.col][p.row].isWinning = true;
      });
      setGrid(updatedGrid);
      soundManager.play('win');

      let spinWin = 0;
      winningPositions.forEach(p => {
        spinWin += (PAYOUTS[updatedGrid[p.col][p.row].type] || 0) * betAmount * currentMult;
      });

      const totalWin = currentWin + spinWin;
      setWinAmount(totalWin);
      
      const steps = 20;
      const increment = spinWin / steps;
      let current = currentWin;
      const timer = setInterval(() => {
        current += increment;
        if (current >= totalWin) {
          setDisplayWin(totalWin);
          clearInterval(timer);
        } else {
          setDisplayWin(current);
        }
      }, 30);

      if (totalWin > betAmount * 20) {
        setShowBigWin(true);
        setIsShaking(true);
        setTimeout(() => {
          setShowBigWin(false);
          setIsShaking(false);
        }, 2000);
      }

      await new Promise(r => setTimeout(r, isTurbo ? 400 : 1000));

      const nextGrid = updatedGrid.map((col, colIdx) => {
        const newCol = col.filter(sym => !sym.isWinning);
        col.forEach(sym => {
          if (sym.isWinning && sym.isGolden) {
            newCol.unshift({
              id: Math.random().toString(36).substr(2, 9),
              type: Math.random() > 0.5 ? 'BigJoker' : 'SmallJoker',
              isGolden: false,
              isWinning: false
            });
            soundManager.play('joker');
          }
        });
        while (newCol.length < 4) {
          newCol.unshift(generateSymbol(colIdx));
        }
        return newCol;
      });

      setGrid(nextGrid);
      
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      const mults = isFreeGame ? [2, 4, 6, 10] : [1, 2, 3, 5];
      const nextMult = mults[Math.min(nextCombo, 3)];
      setMultiplier(nextMult);

      checkWins(nextGrid, nextMult, totalWin);
    } else {
      if (winAmount > 0) {
        onUpdateBalance(balance + winAmount);
        setHistory(prev => [winAmount, ...prev].slice(0, 5));
        updateJackpot(winAmount);
      }

      if (scatterCount >= 3 && !isFreeGame) {
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

  return (
    <div className="fixed inset-0 z-[600] bg-[#0a0505]/90 backdrop-blur-2xl flex flex-col overflow-y-auto font-sans select-none">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffd700 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-full">
        {/* Header */}
        <div className="relative z-10 p-4 flex justify-between items-center bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] sticky top-0">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-red-900 to-red-700 px-4 py-2 rounded-xl border border-red-500/30 shadow-lg">
              <p className="text-[9px] font-black text-red-200 uppercase tracking-widest mb-0.5">Jackpot</p>
              <h4 className="text-lg font-black text-white italic">৳ {jackpot.toLocaleString()}</h4>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-700 rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] hidden sm:flex">
              <Trophy size={22} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 tracking-tighter leading-none">Super Ace</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                <p className="text-[9px] font-black text-yellow-500/60 uppercase tracking-widest">Elite Gaming</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              {isMuted ? <Zap size={18} className="opacity-30" /> : <Zap size={18} className="text-yellow-500" />}
            </button>
            <button 
              onClick={() => setShowRules(true)}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={handleClose}
              className="w-10 h-10 bg-red-950/40 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Multiplier Bar - Elite Style */}
        <div className="relative z-10 px-6 py-4 flex justify-center">
          <div className="flex gap-2 bg-black/60 backdrop-blur-2xl p-2 rounded-[2rem] border border-yellow-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {(isFreeGame ? [2, 4, 6, 10] : [1, 2, 3, 5]).map((m, i) => (
              <div 
                key={m}
                className={`w-12 sm:w-16 py-2 sm:py-3 rounded-2xl text-center font-black italic transition-all relative overflow-hidden ${multiplier === m ? 'bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 text-black shadow-[0_0_30px_rgba(234,179,8,0.5)] scale-110 z-10' : 'bg-white/5 text-gray-500'}`}
              >
                <span className="relative z-10 text-lg sm:text-xl">x{m}</span>
                {multiplier === m && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 min-h-[400px]">
          <AnimatePresence>
            {isFreeGame && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 bg-yellow-500 text-black px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-30"
              >
                Free Games: {freeSpinsLeft}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid Frame */}
          <div className="relative p-1 bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-400 rounded-[2.5rem] shadow-[0_0_100px_rgba(234,179,8,0.2)] w-full max-w-md mx-auto">
            <motion.div 
              animate={isShaking ? { x: [-3, 3, -3, 3, 0], y: [-3, 3, 3, -3, 0] } : {}}
              transition={{ duration: 0.1, repeat: isShaking ? Infinity : 0 }}
              className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full aspect-[5/4] bg-[#0a0505] p-2 sm:p-3 rounded-[2.2rem] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none"></div>
              
              {grid.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1.5 sm:gap-2">
                  {col.map((sym) => (
                    <motion.div
                      key={sym.id}
                      layout
                      initial={{ y: -200, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`flex-1 rounded-lg sm:rounded-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${sym.isWinning ? 'scale-90 brightness-125 z-20 shadow-[0_0_30px_rgba(255,255,255,0.5)]' : ''} ${sym.isGolden ? 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 border-2 border-yellow-200 shadow-[inset_0_0_15px_rgba(255,255,255,0.5)]' : 'bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/10'}`}
                    >
                      {sym.isWinning && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-white z-10"
                        />
                      )}
                      
                      <div className={`flex flex-col items-center justify-center ${sym.isGolden ? 'text-black' : SYMBOL_ICONS[sym.type].color}`}>
                        {sym.type === 'Scatter' ? (
                          <div className="relative">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-yellow-200 shadow-lg">
                               <Coins size={20} className="text-yellow-900 sm:w-6 sm:h-6 w-4 h-4" />
                            </div>
                            <span className="absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 text-[6px] sm:text-[7px] font-black text-yellow-400 uppercase">Scatter</span>
                          </div>
                        ) : sym.type === 'BigJoker' || sym.type === 'SmallJoker' ? (
                          <div className="flex flex-col items-center">
                             <Star size={20} fill="currentColor" className="animate-pulse text-yellow-500 sm:w-7 sm:h-7 w-5 h-5" />
                             <span className="text-[6px] sm:text-[8px] font-black uppercase mt-0.5 sm:mt-1 text-yellow-500">Wild</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-lg sm:text-2xl font-black leading-none drop-shadow-md">{SYMBOL_ICONS[sym.type].icon}</span>
                            <span className="text-[6px] sm:text-[8px] font-bold opacity-40 mt-0.5 sm:mt-1">{sym.type}</span>
                          </>
                        )}
                      </div>

                      {sym.isGolden && (
                        <motion.div 
                          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Win Display - Elite Style */}
          <div className="mt-6 sm:mt-8 relative flex flex-col items-center">
            <div className="absolute -inset-20 bg-yellow-500/10 blur-[100px] rounded-full"></div>
            
            <div className="flex gap-2 mb-4 sm:mb-6 flex-wrap justify-center max-w-full px-4">
              {history.map((h, i) => (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={`superace-hist-${i}-${h}`} 
                  className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[9px] font-black text-yellow-500 border border-yellow-500/20 shadow-lg"
                >
                  ৳{h.toFixed(1)}
                </motion.div>
              ))}
            </div>

            <p className="text-[10px] font-black text-yellow-500/40 uppercase tracking-[0.5em] mb-1 sm:mb-2 text-center">Elite Win</p>
            <motion.h3 
              key={winAmount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-500 to-yellow-800 italic tracking-tighter drop-shadow-[0_0_30px_rgba(234,179,8,0.4)]"
            >
              ৳ {displayWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </motion.h3>
          </div>
        </div>

        {/* Controls - Elite Style */}
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
                    <button onClick={() => setBetAmount(Math.max(1, betAmount - 10))} className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-lg flex items-center justify-center text-yellow-500 font-black hover:bg-white/20 transition-colors ripple-effect">-</button>
                    <span className="text-lg sm:text-xl font-black text-yellow-500 italic min-w-[60px] sm:min-w-[80px] text-center">৳ {betAmount}</span>
                    <button onClick={() => setBetAmount(betAmount + 10)} className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-lg flex items-center justify-center text-yellow-500 font-black hover:bg-white/20 transition-colors ripple-effect">+</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
               {[10, 20, 50, 100, 500, 1000].map(amt => (
                 <button 
                   key={amt} 
                   onClick={() => { soundManager.play('click'); setBetAmount(amt); }}
                   className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all ripple-effect border whitespace-nowrap
                     ${betAmount === amt ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/5 border-white/10 text-yellow-500/60 hover:text-yellow-500 hover:border-yellow-500/40'}`}
                 >
                   ৳{amt}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
              <button 
                onClick={() => { soundManager.play('click'); setIsTurbo(!isTurbo); }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 font-black uppercase text-[9px] sm:text-[10px] flex flex-col items-center justify-center gap-1 transition-all ripple-effect ${isTurbo ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-white/5 text-gray-500 border-white/10'}`}
              >
                <Zap size={14} fill={isTurbo ? "currentColor" : "none"} />
                Turbo
              </button>
              
              <button 
                onClick={handleSpin}
                disabled={isSpinning}
                className="relative group ripple-effect"
              >
                <div className="absolute -inset-4 bg-yellow-500/20 blur-2xl rounded-full group-active:scale-150 transition-transform"></div>
                <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 flex items-center justify-center text-black shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.8)] active:scale-90 transition-all relative z-10 border-4 border-yellow-900/20 ${isSpinning ? 'opacity-80' : ''}`}>
                  <RefreshCw size={40} className={`${isSpinning ? 'animate-spin' : ''} drop-shadow-md sm:w-[52px] sm:h-[52px]`} />
                </div>
              </button>

              <button 
                onClick={() => { soundManager.play('click'); setIsAuto(!isAuto); }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 font-black uppercase text-[9px] sm:text-[10px] flex flex-col items-center justify-center gap-1 transition-all ripple-effect ${isAuto ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-white/5 text-gray-500 border-white/10'}`}
              >
                {isAuto ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                Auto
              </button>
            </div>

            <button 
              onClick={handleSpin}
              disabled={isSpinning}
              className={`w-full max-w-[200px] py-3 sm:py-4 rounded-full font-black uppercase text-xs sm:text-sm tracking-[0.2em] transition-all ripple-effect border-b-4 active:translate-y-1 active:border-b-0
                ${isSpinning ? 'bg-gray-600 border-gray-800 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 border-yellow-700 text-black shadow-[0_10px_20px_rgba(234,179,8,0.3)] hover:bg-yellow-400'}`}
            >
              {isSpinning ? 'Spinning...' : 'Spin Now'}
            </button>
          </div>
        </div>
      </div>

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
              className="bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl overflow-y-auto max-h-[80vh]"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500">
                  <Trophy size={28} />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Super Ace Rules</h3>
              </div>

              <div className="space-y-6 text-sm text-gray-400 font-medium leading-relaxed">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-black shrink-0">1</div>
                  <p>এটি একটি ৫x৪ স্লট গেম। ৩টি বা তার বেশি একই সিম্বল বাম থেকে ডানে মিললে উইন হবে।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-black shrink-0">2</div>
                  <p><span className="text-yellow-500">Golden Cards:</span> রিল ২, ৩ এবং ৪-এ গোল্ডেন কার্ড আসবে যা উইন হলে জোকার (Wild) কার্ডে পরিণত হবে।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-black shrink-0">3</div>
                  <p><span className="text-yellow-500">Multipliers:</span> প্রতিটি কম্বো উইন-এর সাথে মাল্টিপ্লায়ার বাড়বে (১x, ২x, ৩x, ৫x)।</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-black shrink-0">4</div>
                  <p><span className="text-yellow-500">Free Games:</span> ৩টি স্ক্যাটার সিম্বল ১০টি ফ্রি স্পিন দেয় যেখানে মাল্টিপ্লায়ার দ্বিগুণ হয় (২x, ৪x, ৬x, ১০x)।</p>
                </div>
              </div>

              <button 
                onClick={() => setShowRules(false)}
                className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase text-sm mt-10 shadow-xl shadow-yellow-500/20 active:scale-95 transition-all"
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

export default SuperAce;
