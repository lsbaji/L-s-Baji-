import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Info } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, appId } from '../lib/firebase';
import WinAnimation from './WinAnimation';

interface SpinWheelOverlayProps {
  onClose: () => void;
  onUpdateBalance: (amount: number) => void;
  currentCoins: number;
  onUpdateCoins: (coins: number) => void;
  userData: any;
  auth: any;
}

const SpinWheelOverlay: React.FC<SpinWheelOverlayProps> = ({ onClose, onUpdateBalance, currentCoins, onUpdateCoins, userData, auth }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [winType, setWinType] = useState<'big' | 'super' | 'mega' | null>(null);
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [exchangeMode, setExchangeMode] = useState<'binance' | 'balance' | null>(null);
  const [exchangeData, setExchangeData] = useState({ username: '', id: '', coins: 0 });

  useEffect(() => {
    const deposit = userData?.totalDeposit || 0;
    if (deposit >= 5000) setSpinsLeft(5);
    else if (deposit >= 100) setSpinsLeft(1);
    else setSpinsLeft(0);
  }, [userData]);

  const getPossibleCoins = () => {
    const deposit = userData?.totalDeposit || 0;
    if (deposit >= 5000) return [100, 200, 300, 400, 500];
    if (deposit >= 1000) return [50, 100, 200, 300, 400, 500];
    if (deposit >= 500) return [30, 50, 100, 200, 300];
    if (deposit >= 100) return [10, 30, 50, 100];
    return [0];
  };

  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0) return;
    setIsSpinning(true);
    setResult(null);

    const possibleCoins = getPossibleCoins();
    const randomCoins = possibleCoins[Math.floor(Math.random() * possibleCoins.length)];
    const newRotation = rotation + 1800 + Math.floor(Math.random() * 360);

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(randomCoins);
      onUpdateCoins(currentCoins + randomCoins);
      setSpinsLeft(prev => prev - 1);
      
      if (randomCoins >= 400) setWinType('mega');
      else if (randomCoins >= 200) setWinType('super');
      else if (randomCoins >= 50) setWinType('big');
    }, 3000);
  };

  const handleExchangeSubmit = async () => {
    if (exchangeData.coins > currentCoins || exchangeData.coins < 100) {
      alert("Invalid coin amount!");
      return;
    }
    const bdtAmount = Math.floor(exchangeData.coins / 100) * 23;
    
    if (exchangeMode === 'balance') {
      onUpdateBalance(bdtAmount);
    }
    
    onUpdateCoins(currentCoins - exchangeData.coins);
    
    // Add notification
    const notification = {
      title: 'Exchange Success',
      message: `Exchanged ${exchangeData.coins} coins for ${bdtAmount} BDT via ${exchangeMode}`,
      timestamp: new Date().toISOString()
    };
    await updateDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid), {
      notifications: arrayUnion(notification)
    });

    alert(`Exchanged for ${bdtAmount} BDT!`);
    setExchangeMode(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[700] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4"
    >
      <AnimatePresence>
        {winType && result && (
          <WinAnimation amount={result} type={winType} onComplete={() => setWinType(null)} />
        )}
      </AnimatePresence>
      <div className="bg-white/10 border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white"><X /></button>
        <button onClick={() => setShowRules(!showRules)} className="absolute top-4 left-4 text-yellow-500"><Info /></button>
        
        {showRules ? (
          <div className="text-white text-xs space-y-2 h-64 overflow-y-auto bg-black/40 p-4 rounded-xl border border-white/10">
            <h3 className="font-bold text-yellow-500 text-sm mb-2">L's Baji Spin Rules:</h3>
            <p>• <strong>No deposit:</strong> 0 coins.</p>
            <p>• <strong>100 - 400 BDT deposit:</strong> 10 coins (1 spin/24h).</p>
            <p>• <strong>500 BDT deposit:</strong> 30 coins.</p>
            <p>• <strong>1000 BDT deposit:</strong> 50 coins.</p>
            <p>• <strong>5000 - 10000 BDT deposit:</strong> 5 free spins daily.</p>
            <p>• <strong>Exchange Rate:</strong> 100 L's Baji Coins = 23 BDT.</p>
            <p>• Coins can be transferred to Main Balance or withdrawn via Binance.</p>
            <p>• All transactions are logged in your Notifications.</p>
          </div>
        ) : exchangeMode ? (
          <div className="space-y-4">
            <h3 className="text-white font-bold text-center">Exchange to {exchangeMode.toUpperCase()}</h3>
            <input type="text" placeholder="Username" className="w-full p-2 rounded bg-white/10 text-white" onChange={(e) => setExchangeData({...exchangeData, username: e.target.value})} />
            <input type="text" placeholder="ID" className="w-full p-2 rounded bg-white/10 text-white" onChange={(e) => setExchangeData({...exchangeData, id: e.target.value})} />
            <input type="number" placeholder="Coins to sell" className="w-full p-2 rounded bg-white/10 text-white" onChange={(e) => setExchangeData({...exchangeData, coins: parseInt(e.target.value)})} />
            <p className="text-yellow-500 text-sm">You will get: {Math.floor(exchangeData.coins / 100) * 23} BDT</p>
            <button onClick={handleExchangeSubmit} className="w-full py-2 bg-green-600 rounded text-white font-bold">Submit</button>
            <button onClick={() => setExchangeMode(null)} className="w-full py-2 bg-red-600 rounded text-white font-bold">Cancel</button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-white text-center mb-6 italic">L's Baji Spin</h2>
            <div className="relative w-64 h-64 mx-auto mb-8">
              <motion.div 
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
                className="w-full h-full rounded-full border-8 border-yellow-500/30 bg-gradient-to-tr from-yellow-600 to-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.5)] flex items-center justify-center relative overflow-hidden"
              >
                {[10, 30, 50, 100, 200, 300, 400, 500].map((coin, i) => {
                  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];
                  return (
                    <div 
                      key={i} 
                      className={`absolute w-full h-full ${colors[i % colors.length]} clip-path-slice flex items-center justify-center`}
                      style={{ transform: `rotate(${i * 45}deg)` }}
                    >
                      <span className="absolute top-10 font-black text-white text-lg rotate-45">{coin}</span>
                    </div>
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-black rounded-full border-4 border-yellow-500"></div>
                </div>
              </motion.div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-8 bg-yellow-500 clip-path-pointer shadow-lg z-20"></div>
            </div>
            {result !== null && <div className="text-center text-2xl font-black text-yellow-400 mb-6 italic">You won {result} L's Baji Coins!</div>}
            <button onClick={handleSpin} disabled={isSpinning || spinsLeft <= 0} className="w-full py-4 bg-yellow-500 rounded-2xl font-black text-black italic text-lg shadow-lg hover:bg-yellow-400 transition-all active:scale-95 mb-4">
              {isSpinning ? 'Spinning...' : spinsLeft > 0 ? `Spin (${spinsLeft} left)` : 'No spins left'}
            </button>
            <div className="flex gap-2">
              <button onClick={() => setExchangeMode('binance')} className="flex-1 py-2 bg-blue-600 rounded text-white font-bold">Binance</button>
              <button onClick={() => setExchangeMode('balance')} className="flex-1 py-2 bg-purple-600 rounded text-white font-bold">Main Balance</button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default SpinWheelOverlay;
