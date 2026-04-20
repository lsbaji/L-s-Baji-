import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Share2, Copy, Users, Trophy, Gift, ArrowRight, CheckCircle2, Wallet, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

interface ReferralOverlayProps {
  onClose: () => void;
  userData: any;
  auth: any;
  appId: string;
  db: any;
  onUpdateBalance: (amount: number) => void;
}

const ReferralOverlay: React.FC<ReferralOverlayProps> = ({ onClose, userData, auth, appId, db, onUpdateBalance }) => {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  const referralCode = userData?.referralCode || 'ELITE99';
  const isSunday = new Date().getDay() === 0;

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'artifacts', appId, 'referrals'),
      where('referrerUid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const refs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReferrals(refs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db, appId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://lsbaji.pro/register?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConvert = async () => {
    if (!isSunday || !userData.referralEarnings || userData.referralEarnings <= 0 || converting) return;

    setConverting(true);
    try {
      const amount = userData.referralEarnings;
      const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
      
      await updateDoc(userRef, {
        referralEarnings: 0,
        balance: increment(amount)
      });
      
      onUpdateBalance(amount);
      alert(`Successfully converted ৳${amount} to your main balance!`);
    } catch (error) {
      console.error("Conversion failed", error);
      alert("Failed to convert earnings. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  const steps = [
    { icon: Share2, title: "Share Link", desc: "Invite your friends using your unique referral link." },
    { icon: Users, title: "Friends Join", desc: "Your friends register and start playing on L's Baji." },
    { icon: Gift, title: "Get Rewards", desc: "Earn ৳১০০ for every friend who deposits ৳৫০০+ and bets ৳১,০০০+." }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(234,179,8,0.15)] h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-yellow-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <Share2 className="text-yellow-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Referral</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">রেফার করুন এবং আয় করুন</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* Hero Card */}
          <div className="glass-panel p-6 border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full"></div>
            <Trophy className="text-yellow-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Earn ৳১০০ Per Friend!</h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">আপনার বন্ধুদের ইনভাইট করুন এবং তারা শর্ত পূরণ করলেই আপনি পাবেন বোনাস!</p>
          </div>

          {/* Earnings Dashboard */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Earnings Dashboard</h4>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${isSunday ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isSunday ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[8px] font-black uppercase tracking-widest">{isSunday ? 'Withdrawal Open' : 'Withdrawal Closed'}</span>
              </div>
            </div>
            
            <div className="glass-panel p-6 border-white/5 bg-white/5 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Earnings</p>
                  <p className="text-3xl font-black text-white italic">৳{userData?.referralEarnings || 0}</p>
                </div>
                <button 
                  onClick={handleConvert}
                  disabled={!isSunday || !userData?.referralEarnings || converting}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                    isSunday && userData?.referralEarnings > 0 
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {converting ? <RefreshCw size={14} className="animate-spin" /> : <Wallet size={14} />}
                  Convert
                </button>
              </div>
              
              {!isSunday && (
                <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest">Withdrawals are only available on Sundays.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Lifetime Earned</p>
                  <p className="text-sm font-black text-yellow-500 italic">৳{userData?.totalReferralEarnings || 0}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Referrals</p>
                  <p className="text-sm font-black text-white italic">{userData?.referralCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Referral Link</label>
            <div className="flex gap-3">
              <div className="flex-1 glass-input rounded-2xl py-4 px-6 text-xs font-bold text-gray-300 truncate">
                lsbaji.pro/reg?ref={referralCode}
              </div>
              <button 
                onClick={handleCopy}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${copied ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'}`}
              >
                {copied ? <CheckCircle2 size={24} /> : <Copy size={24} />}
              </button>
            </div>
          </div>

          {/* Referee Activity */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Referee Activity (15% Loss Commission)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 border-white/5 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Wins</span>
                </div>
                <p className="text-lg font-black text-white italic">৳{userData?.referralStats?.refereeWins || 0}</p>
              </div>
              <div className="glass-panel p-4 border-white/5 bg-red-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={14} className="text-red-500" />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total Losses</span>
                </div>
                <p className="text-lg font-black text-white italic">৳{userData?.referralStats?.refereeLosses || 0}</p>
              </div>
            </div>
          </div>

          {/* Referral List */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">My Referrals ({referrals.length})</h4>
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw size={24} className="text-yellow-500 animate-spin" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center p-8 glass-panel border-white/5">
                  <Users size={32} className="text-gray-600 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No referrals yet</p>
                </div>
              ) : (
                referrals.map((ref) => (
                  <div key={ref.id} className="glass-panel p-4 border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-yellow-500 border border-white/10 font-black italic">
                        {ref.refereeUsername?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white uppercase">{ref.refereeUsername}</h5>
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                          Dep: ৳{ref.totalDeposited || 0} / Bet: ৳{ref.totalWagered || 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[8px] font-black uppercase tracking-widest mb-1 ${ref.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {ref.status}
                      </div>
                      <p className="text-[10px] font-black text-white italic">৳{ref.commissionEarned || 0}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">How it works</h4>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                    <step.icon size={18} className="text-yellow-500" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase mb-1">{step.title}</h5>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/50 border-t border-white/5">
          <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2">
            View Referral Terms <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReferralOverlay;

