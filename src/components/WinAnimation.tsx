import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap } from 'lucide-react';

interface WinAnimationProps {
  amount: number;
  type: 'big' | 'super' | 'mega';
  onComplete: () => void;
}

const WinAnimation: React.FC<WinAnimationProps> = ({ amount, type, onComplete }) => {
  const config = {
    big: { color: 'text-blue-400', label: 'BIG WIN', icon: Star },
    super: { color: 'text-yellow-400', label: 'SUPER WIN', icon: Zap },
    mega: { color: 'text-red-500', label: 'MEGA WIN', icon: Trophy },
  };

  const { color, label, icon: Icon } = config[type];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      onAnimationComplete={() => setTimeout(onComplete, 2000)}
      className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
    >
      <div className={`text-center ${color} drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]`}>
        <Icon size={120} className="mx-auto mb-4 animate-bounce" />
        <h2 className="text-6xl font-black italic tracking-tighter">{label}</h2>
        <p className="text-4xl font-black text-white">৳ {amount.toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

export default WinAnimation;
