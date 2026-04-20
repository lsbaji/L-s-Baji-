import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Volume2, VolumeX, History, Coins, CircleDollarSign, Target, Sparkles, Users, MessageSquare } from 'lucide-react';
import { soundManager } from '../lib/soundManager';

interface CrazyTimeProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

const BET_OPTIONS = [
  { id: '1', label: '1', multiplier: 1, color: 'bg-blue-400', hexColor: '#60a5fa', textColor: 'text-blue-900', type: 'number' },
  { id: '2', label: '2', multiplier: 2, color: 'bg-yellow-400', hexColor: '#facc15', textColor: 'text-yellow-900', type: 'number' },
  { id: '5', label: '5', multiplier: 5, color: 'bg-pink-400', hexColor: '#f472b6', textColor: 'text-pink-900', type: 'number' },
  { id: '10', label: '10', multiplier: 10, color: 'bg-purple-400', hexColor: '#c084fc', textColor: 'text-purple-900', type: 'number' },
  { id: 'coin_flip', label: 'Coin Flip', multiplier: 0, color: 'bg-blue-600', hexColor: '#2563eb', textColor: 'text-white', type: 'bonus', icon: <CircleDollarSign size={20} /> },
  { id: 'pachinko', label: 'Pachinko', multiplier: 0, color: 'bg-purple-600', hexColor: '#9333ea', textColor: 'text-white', type: 'bonus', icon: <Sparkles size={20} /> },
  { id: 'cash_hunt', label: 'Cash Hunt', multiplier: 0, color: 'bg-green-600', hexColor: '#16a34a', textColor: 'text-white', type: 'bonus', icon: <Target size={20} /> },
  { id: 'crazy_time', label: 'Crazy Time', multiplier: 0, color: 'bg-red-600', hexColor: '#dc2626', textColor: 'text-white', type: 'bonus', icon: <Sparkles size={20} /> },
];

// Wheel segments distribution (approximate real Crazy Time distribution)
// 1: 21 segments, 2: 13 segments, 5: 7 segments, 10: 4 segments
// Coin Flip: 4, Pachinko: 2, Cash Hunt: 2, Crazy Time: 1
// Total: 54 segments
const WHEEL_SEGMENTS = [
  '1', '2', '1', '5', '1', '2', '1', '10', '1', '2', '1', 'coin_flip', '1', '2', '1', '5', '1', '2', '1', 'pachinko', '1', '2', '1', '5', '1', '2', '1', '10', '1', '2', '1', 'cash_hunt', '1', '2', '1', '5', '1', '2', '1', 'crazy_time', '1', '2', '1', '5', '1', '2', '1', '10', '1', '2', '1', 'coin_flip', '1', '2'
];

const CrazyTime: React.FC<CrazyTimeProps> = ({ onClose, balance, onUpdateBalance }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [betAmount, setBetAmount] = useState(10);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(15);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [history, setHistory] = useState<string[]>(['1', '5', '2', 'coin_flip', '1']);
  const [topSlot, setTopSlot] = useState<{ option: string, multiplier: number } | null>(null);
  const [players, setPlayers] = useState(12450);
  const [chat, setChat] = useState<{user: string, text: string}[]>([]);
  const [showChat, setShowChat] = useState(true);

  const wheelRef = useRef<HTMLDivElement>(null);

  const CHAT_MESSAGES = [
    { user: 'Rahim***', text: 'Crazy time plzzzz' },
    { user: 'Kuddus99', text: '10 e 500 lagaisi' },
    { user: 'Boss***', text: 'Pachinko asbe ebar' },
    { user: 'User442', text: 'Loss cover korte hobe' },
    { user: 'KingKhan', text: 'Wow big win!' },
    { user: 'Nusrat**', text: 'Coin flip de' },
    { user: 'HeroAlom', text: 'Ami 1000 jitlam' },
    { user: 'Sabbir_x', text: 'Khela hobe' },
    { user: 'Rana_Vai', text: '5 e maro sobai' },
    { user: 'LitonDas', text: 'Ajke kopal kharap' }
  ];

  useEffect(() => {
    soundManager.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const playerInterval = setInterval(() => {
      setPlayers(prev => prev + Math.floor(Math.random() * 15) - 5);
    }, 3000);
    
    const chatInterval = setInterval(() => {
      const randomMsg = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
      setChat(prev => [...prev, randomMsg].slice(-8));
    }, 2500);

    return () => {
      clearInterval(playerInterval);
      clearInterval(chatInterval);
    };
  }, []);

  // Betting timer
  useEffect(() => {
    if (gameState === 'betting' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'betting' && timeLeft === 0) {
      startSpin();
    }
  }, [gameState, timeLeft]);

  const placeBet = (optionId: string) => {
    if (gameState !== 'betting') return;
    if (balance >= betAmount) {
      onUpdateBalance(balance - betAmount);
      soundManager.play('bet');
      setBets(prev => ({
        ...prev,
        [optionId]: (prev[optionId] || 0) + betAmount
      }));
    }
  };

  const clearBets = () => {
    if (gameState !== 'betting') return;
    const totalBets = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBets > 0) {
      onUpdateBalance(balance + totalBets);
      setBets({});
    }
  };

  const startSpin = () => {
    setGameState('spinning');
    soundManager.play('spin');
    
    // Simulate Top Slot
    const randomOption = BET_OPTIONS[Math.floor(Math.random() * BET_OPTIONS.length)].id;
    const multipliers = [2, 3, 4, 5, 7, 10, 15, 20, 25, 50];
    const randomMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    setTopSlot({ option: randomOption, multiplier: randomMultiplier });

    // Calculate winning segment
    const targetIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const targetSegment = WHEEL_SEGMENTS[targetIndex];
    
    // Calculate rotation (5-10 full spins + target segment angle)
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const targetAngle = 360 - (targetIndex * segmentAngle);
    const spins = 5 + Math.floor(Math.random() * 5);
    const totalRotation = wheelRotation + (spins * 360) + targetAngle - (wheelRotation % 360);
    
    setWheelRotation(totalRotation);

    // Wait for spin to finish (css transition is 8s)
    setTimeout(() => {
      setWinningSegment(targetSegment);
      handleResult(targetSegment, randomOption, randomMultiplier);
    }, 8000);
  };

  const handleResult = (segment: string, topSlotOption: string, topSlotMult: number) => {
    setGameState('result');
    setHistory(prev => [segment, ...prev].slice(0, 10));

    let totalWin = 0;
    const betOnSegment = bets[segment] || 0;

    if (betOnSegment > 0) {
      const optionDef = BET_OPTIONS.find(o => o.id === segment);
      if (optionDef?.type === 'number') {
        let mult = optionDef.multiplier;
        if (topSlotOption === segment) {
          mult = topSlotMult;
        }
        totalWin = betOnSegment + (betOnSegment * mult);
      } else {
        // Bonus game logic (simplified for now, just random multiplier)
        let bonusMult = Math.floor(Math.random() * 50) + 10;
        if (topSlotOption === segment) {
          bonusMult *= topSlotMult;
        }
        totalWin = betOnSegment + (betOnSegment * bonusMult);
      }
    }

    if (totalWin > 0) {
      setWinAmount(totalWin);
      onUpdateBalance(balance + totalWin);
      soundManager.play('win');
    }

    // Reset for next round
    setTimeout(() => {
      setGameState('betting');
      setTimeLeft(15);
      setBets({});
      setWinningSegment(null);
      setWinAmount(0);
      setTopSlot(null);
    }, 5000);
  };

  const getSegmentColor = (segment: string) => {
    const opt = BET_OPTIONS.find(o => o.id === segment);
    return opt ? opt.color : 'bg-gray-500';
  };

  return (
    <div className="fixed inset-0 z-[600] bg-[#1a0b2e] flex flex-col overflow-y-auto font-sans select-none">
      {/* Studio Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0b2e]/80 via-transparent to-[#1a0b2e]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-600/20 blur-[150px] rounded-full"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 flex justify-between items-center bg-white/10 backdrop-blur-2xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 tracking-tighter leading-none drop-shadow-md">Crazy Time</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Live Show</p>
              <div className="flex items-center gap-1 ml-2 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                <Users size={10} className="text-green-400" />
                <span className="text-[10px] font-bold text-green-400">{players.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all glass-panel"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} className="text-yellow-500" />}
          </button>
          <button 
            onClick={() => setShowRules(true)}
            className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all glass-panel"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all glass-panel"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 min-h-[400px]">
        
        {/* Live Chat Overlay */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="absolute left-4 top-24 bottom-48 w-48 sm:w-64 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col z-30 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hidden sm:flex"
            >
              <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-white/80">
                  <MessageSquare size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Chat</span>
                </div>
                <button onClick={() => setShowChat(false)} className="text-white/50 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-end gap-2">
                {chat.map((msg, i) => (
                  <motion.div 
                    key={`chat-${i}-${msg.user}`} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] sm:text-xs leading-tight"
                  >
                    <span className="font-bold text-yellow-400">{msg.user}: </span>
                    <span className="text-white/90">{msg.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Chat Toggle Button (if hidden) */}
        {!showChat && (
          <button 
            onClick={() => setShowChat(true)}
            className="absolute left-4 top-24 z-30 w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full hidden sm:flex items-center justify-center text-white/80 hover:text-white shadow-lg"
          >
            <MessageSquare size={18} />
          </button>
        )}

        {/* Top Slot */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl border-2 border-yellow-500/30 rounded-2xl p-2 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20">
          <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
            <AnimatePresence mode="wait">
              {topSlot ? (
                <motion.div
                  key="result"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`w-full h-full flex items-center justify-center font-black text-2xl ${BET_OPTIONS.find(o => o.id === topSlot.option)?.color.replace('bg-', 'text-')}`}
                >
                  {BET_OPTIONS.find(o => o.id === topSlot.option)?.label}
                </motion.div>
              ) : (
                <motion.div
                  key="spinning"
                  animate={{ y: [0, -100] }}
                  transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                  className="flex flex-col items-center gap-4 text-gray-500 blur-[1px]"
                >
                  <span>1</span><span>2</span><span>5</span><span>10</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
             <AnimatePresence mode="wait">
              {topSlot ? (
                <motion.div
                  key="result-mult"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="w-full h-full flex items-center justify-center font-black text-2xl text-yellow-500"
                >
                  {topSlot.multiplier}x
                </motion.div>
              ) : (
                <motion.div
                  key="spinning-mult"
                  animate={{ y: [0, -100] }}
                  transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                  className="flex flex-col items-center gap-4 text-yellow-500/50 blur-[1px]"
                >
                  <span>2x</span><span>5x</span><span>10x</span><span>50x</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Wheel Container */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 mt-16 mb-8">
          {/* Wheel Pointer */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-yellow-400"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-inner"></div>
          </div>

          {/* The Wheel */}
          <div 
            className="w-full h-full rounded-full border-[12px] border-[#2a1b42] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden transition-transform"
            style={{ 
              transform: `rotate(${wheelRotation}deg)`,
              transitionDuration: gameState === 'spinning' ? '8s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          >
            {WHEEL_SEGMENTS.map((segment, index) => {
              const angle = (360 / WHEEL_SEGMENTS.length) * index;
              const option = BET_OPTIONS.find(o => o.id === segment);
              return (
                <div 
                  key={index}
                  className="absolute top-0 left-1/2 w-8 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-2 border-r border-black/20"
                  style={{ 
                    transform: `rotate(${angle}deg)`,
                    backgroundColor: option?.hexColor || '#ccc'
                  }}
                >
                  <span className={`font-black text-xs sm:text-sm ${option?.textColor} transform -rotate-90 mt-4 drop-shadow-sm`}>
                    {option?.type === 'number' ? option.label : option?.label.substring(0,2)}
                  </span>
                </div>
              );
            })}
            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border-4 border-[#2a1b42] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center z-20">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-[#1a0b2e] rounded-full flex items-center justify-center shadow-inner">
                <Sparkles className="text-yellow-500 w-5 h-5 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>

          {/* Status Overlay */}
          {gameState === 'betting' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <p className="text-green-400 font-black uppercase tracking-widest text-sm sm:text-base whitespace-nowrap">Place Your Bets</p>
              <p className="text-white text-center font-mono text-xl">{timeLeft}s</p>
            </div>
          )}
          
          {gameState === 'result' && winAmount > 0 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black px-8 py-4 rounded-3xl border-4 border-white shadow-[0_0_50px_rgba(234,179,8,0.8)] text-center"
            >
              <p className="font-black uppercase tracking-widest text-xs mb-1">You Won</p>
              <p className="font-black text-3xl sm:text-4xl italic">৳{winAmount}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Betting Interface - Glassmorphism */}
      <div className="relative z-20 bg-white/10 backdrop-blur-2xl border-t border-white/20 p-4 sm:p-6 mt-auto rounded-t-[2rem] shadow-[0_-8px_32px_0_rgba(0,0,0,0.3)]">
        
        {/* History */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          {history.map((h, i) => {
            const opt = BET_OPTIONS.find(o => o.id === h);
            return (
              <div key={`hist-${i}-${h}`} className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${opt?.color} ${opt?.textColor}`}>
                {opt?.type === 'number' ? opt.label : opt?.label.substring(0,1)}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="bg-black/40 px-5 py-2 rounded-2xl border border-white/5 flex-1 w-full sm:w-auto">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Balance</p>
            <h4 className="text-lg font-black text-white italic">৳ {balance.toLocaleString()}</h4>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto">
             {[10, 50, 100, 500, 1000].map(amt => (
               <button 
                 key={amt} 
                 onClick={() => { soundManager.play('click'); setBetAmount(amt); }}
                 className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs transition-all shrink-0
                   ${betAmount === amt ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
               >
                 {amt >= 1000 ? `${amt/1000}k` : amt}
               </button>
             ))}
          </div>
        </div>

        {/* Betting Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* Numbers */}
          {BET_OPTIONS.filter(o => o.type === 'number').map(option => (
            <button
              key={option.id}
              onClick={() => placeBet(option.id)}
              disabled={gameState !== 'betting'}
              className={`relative h-20 sm:h-24 rounded-2xl border-2 transition-all overflow-hidden group
                ${gameState === 'betting' ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-80 cursor-not-allowed'}
                ${option.color.replace('bg-', 'border-')}/50 bg-black/40`}
            >
              <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity ${option.color}`}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <span className={`text-3xl sm:text-4xl font-black italic ${option.color.replace('bg-', 'text-')} drop-shadow-md`}>{option.label}</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase mt-1">Pays {option.multiplier}x</span>
              </div>
              {bets[option.id] && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg z-20">
                  ৳{bets[option.id]}
                </div>
              )}
            </button>
          ))}
          
          {/* Bonus Games */}
          {BET_OPTIONS.filter(o => o.type === 'bonus').map(option => (
            <button
              key={option.id}
              onClick={() => placeBet(option.id)}
              disabled={gameState !== 'betting'}
              className={`relative h-20 sm:h-24 rounded-2xl border-2 transition-all overflow-hidden group
                ${gameState === 'betting' ? 'hover:-translate-y-1 cursor-pointer' : 'opacity-80 cursor-not-allowed'}
                ${option.color.replace('bg-', 'border-')}/50 bg-black/40 col-span-2 sm:col-span-1`}
            >
              <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity ${option.color}`}></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className={`${option.color.replace('bg-', 'text-')} mb-1 drop-shadow-md`}>{option.icon}</div>
                <span className={`text-xs sm:text-sm font-black uppercase text-center leading-tight ${option.color.replace('bg-', 'text-')} drop-shadow-md px-1`}>{option.label}</span>
              </div>
              {bets[option.id] && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg z-20">
                  ৳{bets[option.id]}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-4">
          <button 
            onClick={clearBets}
            disabled={gameState !== 'betting' || Object.keys(bets).length === 0}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-black uppercase text-xs hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Clear Bets
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrazyTime;
