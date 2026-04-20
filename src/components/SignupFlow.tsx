import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Phone, User, CheckCircle, Loader2 } from 'lucide-react';

interface SignupFlowProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const SignupFlow: React.FC<SignupFlowProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneConfirm = async () => {
    // Note: Phone auth requires Firebase Phone Auth enabled.
    // This is a placeholder for the phone confirmation step.
    console.log("Phone number confirmed:", phone);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0d1110] border border-white/10 rounded-[2rem] p-8 max-w-sm w-full relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20} /></button>
        
        {step === 1 && (
          <form onSubmit={handleSignup} className="space-y-4">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Create Account</h2>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-gray-500" size={18} />
              <input type="text" placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
              <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
              <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-black uppercase text-sm shadow-lg shadow-yellow-500/20">
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center">
            <CheckCircle className="mx-auto text-green-500" size={48} />
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Verify Email</h2>
            <p className="text-xs text-gray-400">We've sent a verification link to {email}. Please verify to continue.</p>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 text-gray-500" size={18} />
              <input type="tel" placeholder="Phone Number" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <button onClick={handlePhoneConfirm} className="w-full bg-yellow-500 text-black py-3 rounded-xl font-black uppercase text-sm shadow-lg shadow-yellow-500/20">
              Confirm & Login
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
