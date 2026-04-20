import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Delete, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, appId } from '../lib/firebase';

export default function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);

  useEffect(() => {
    const fetchUserPin = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data().pin) {
          setStoredPin(userDoc.data().pin);
        } else {
          setIsSettingPin(true);
        }
      }
    };
    fetchUserPin();
  }, []);

  const savePin = async (newPin: string) => {
    if (auth.currentUser) {
      await setDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid), { pin: newPin }, { merge: true });
      setStoredPin(newPin);
      setIsSettingPin(false);
      onUnlock();
    }
  };

  const handlePress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        if (isSettingPin) {
          savePin(newPin);
        } else if (newPin === storedPin) {
          onUnlock();
        } else {
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6"
    >
      <div className="mb-10 text-center">
        <ShieldCheck size={64} className="text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-white uppercase tracking-widest">
          {isSettingPin ? 'Set New Pin' : 'Enter Pin to Unlock'}
        </h2>
      </div>

      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 border-yellow-500 ${pin.length > i ? 'bg-yellow-500' : 'bg-transparent'}`} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button key={digit} onClick={() => handlePress(digit.toString())} className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-2xl font-black text-white hover:bg-yellow-500 hover:text-black transition-all">
            {digit}
          </button>
        ))}
        <div />
        <button onClick={() => handlePress('0')} className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-2xl font-black text-white hover:bg-yellow-500 hover:text-black transition-all">0</button>
        <button onClick={handleBackspace} className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all">
          <Delete size={32} />
        </button>
      </div>
    </motion.div>
  );
}
