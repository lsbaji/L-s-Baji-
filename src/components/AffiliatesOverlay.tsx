import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trophy, Send, User, Mail, Zap, Calendar, 
  ChevronRight, Copy, ExternalLink, BarChart3, 
  Users, Wallet, ShieldCheck, CheckCircle2, 
  Clock, AlertCircle, Share2, ArrowRightLeft,
  LayoutDashboard, Network, Megaphone, Info
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

interface AffiliatesOverlayProps {
  onClose: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  user: any;
  userData: any;
  appId: string;
  onTransferEarnings: () => void;
}

type SubTab = 'overview' | 'network' | 'marketing';

const AffiliatesOverlay: React.FC<AffiliatesOverlayProps> = ({ onClose, showToast, user, userData, appId, onTransferEarnings }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fullName: userData?.username || '',
    email: user?.email || '',
    telegram: '',
    experience: 'Beginner',
    marketingChannels: [] as string[]
  });

  const channels = ['YouTube', 'Telegram', 'Facebook', 'WhatsApp', 'Other Website'];

  // Fetch registration status
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'affiliateRegistrations', user.uid), (doc) => {
      if (doc.exists()) {
        setRegistration(doc.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Fetch referrals when network tab is active
  useEffect(() => {
    if (activeSubTab === 'network' && user && appId) {
      const fetchReferrals = async () => {
        try {
          const q = query(
            collection(db, 'artifacts', appId, 'referrals'),
            where('referrerUid', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          const snap = await getDocs(q);
          setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("Referral fetch failed:", e);
        }
      };
      fetchReferrals();
    }
  }, [activeSubTab, user, appId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (showToast) showToast('Please login to continue', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const regData = {
        ...formData,
        uid: user.uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'affiliateRegistrations', user.uid), regData);

      // Notify admin (Telegram bypass)
      await fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `🚀 *New Affiliate Application*\n\n👤 Name: ${formData.fullName}\n📧 Email: ${formData.email}\n📱 Telegram: ${formData.telegram}\n📈 Exp: ${formData.experience}` 
        })
      });

      if (showToast) showToast('Application submitted successfully!', 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Submission failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferralLink = () => {
    const link = `https://l-s-baji.vercel.app/?ref=${user.uid}`;
    navigator.clipboard.writeText(link);
    if (showToast) showToast('Referral link copied!', 'success');
  };

  const renderRegistrationForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              required 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:border-yellow-500/50 outline-none transition-all" 
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              placeholder="Full Name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Telegram Username</label>
          <div className="relative">
            <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              required 
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:border-yellow-500/50 outline-none transition-all" 
              value={formData.telegram}
              onChange={e => setFormData({...formData, telegram: e.target.value})}
              placeholder="@username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Experience Level</label>
          <div className="grid grid-cols-3 gap-2">
            {['Beginner', 'Intermediate', 'Pro'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({...formData, experience: level})}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  formData.experience === level 
                    ? 'bg-yellow-500 text-black border-yellow-500' 
                    : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Marketing Channels</label>
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => {
                  const newChannels = formData.marketingChannels.includes(channel)
                    ? formData.marketingChannels.filter(c => c !== channel)
                    : [...formData.marketingChannels, channel];
                  setFormData({...formData, marketingChannels: newChannels});
                }}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${
                  formData.marketingChannels.includes(channel)
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}
              >
                {channel}
                {formData.marketingChannels.includes(channel) && <CheckCircle2 size={12} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        disabled={submitting}
        className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
      >
        {submitting ? 'Processing...' : 'Apply as Partner'}
      </button>
    </form>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Earnings Card */}
      <div className="elite-glass p-8 border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <Wallet size={80} className="rotate-12" />
        </div>
        
        <div className="relative z-10">
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-2">Available Earnings</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black text-white italic tracking-tighter">৳{(userData?.referralEarnings || 0).toLocaleString()}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">BDT</span>
          </div>
          
          <button 
            onClick={onTransferEarnings}
            disabled={!userData?.referralEarnings || userData.referralEarnings <= 0}
            className="flex items-center gap-3 px-6 py-4 bg-yellow-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
          >
            <ArrowRightLeft size={16} />
            Transfer to Main Balance
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Signups', value: userData?.referralStats?.totalSignups || 0, icon: Users, color: 'text-blue-500' },
          { label: 'Active Players', value: userData?.referralStats?.activePlayers || 0, icon: Zap, color: 'text-yellow-500' },
          { label: 'Lifetime Earn', value: `৳${(userData?.totalReferralEarnings || 0).toLocaleString()}`, icon: Trophy, color: 'text-green-500' },
          { label: 'Network Wins', value: userData?.referralStats?.refereeWins || 0, icon: BarChart3, color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="elite-glass p-5 rounded-3xl border-white/5 hover:border-white/10 transition-all">
            <stat.icon className={`${stat.color} mb-3`} size={18} />
            <p className="text-xl font-black text-white tracking-tighter">{stat.value}</p>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Partner Link</label>
          <span className="text-[10px] font-bold text-yellow-500">Commission: ৳১৫ per bet</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-400 font-mono overflow-hidden whitespace-nowrap mask-fade-right">
            https://l-s-baji.vercel.app/?ref={user.uid}
          </div>
          <button 
            onClick={copyReferralLink}
            className="w-14 h-14 bg-white/5 border border-white/10 text-yellow-500 flex items-center justify-center rounded-2xl active:scale-95 hover:bg-white/10 transition-all"
          >
            <Copy size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNetwork = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white uppercase italic tracking-wider">My Network</h3>
        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
          {referrals.length} Recent
        </span>
      </div>

      <div className="space-y-3">
        {referrals.length > 0 ? referrals.map((ref, i) => (
          <div key={i} className="elite-glass p-4 rounded-2xl border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase italic">{ref.refereeName}</p>
                <p className="text-[10px] text-gray-500 font-medium">{ref.refereeEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-green-500 tracking-tighter">৳{ref.commissionEarned || 0}</p>
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Commission</p>
            </div>
          </div>
        )) : (
          <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
            <Users size={40} className="mb-3" />
            <p className="text-xs font-black uppercase tracking-widest">No partners joined yet</p>
            <p className="text-[10px] mt-2 font-medium">Share your link to start building your network</p>
          </div>
        )}
      </div>
      
      {referrals.length > 0 && (
        <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-widest">
          Showing last 20 referrals. All data is real-time.
        </p>
      )}
    </div>
  );

  const renderMarketing = () => (
    <div className="space-y-6">
      <div className="elite-glass p-6 border-blue-500/20 bg-blue-500/5 rounded-3xl">
        <div className="flex items-start gap-4">
          <Info className="text-blue-500 shrink-0" size={20} />
          <div className="space-y-2">
            <h4 className="text-xs font-black text-white uppercase">How it works</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Copy any game link from the app and add <code className="bg-white/10 px-1 rounded text-yellow-500">?ref={user.uid}</code> to the end. Anyone who registers within 24 hours of clicking will be your referee.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { title: 'Welcome Bonus 100%', img: 'https://i.ibb.co/fzCbCwSn/Gemini-Generated-Image-jngh67jngh67jngh.png' },
          { title: 'Live Cricket Exchange', img: 'https://i.ibb.co/sdQyBcZw/Gemini-Generated-Image-r4k4yer4k4yer4k4.png' }
        ].map((promo, i) => (
          <div key={i} className="relative aspect-video rounded-3xl overflow-hidden elite-glass">
            <img src={promo.img} className="w-full h-full object-cover opacity-50" alt={promo.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex flex-col justify-end p-6">
              <h4 className="text-sm font-black text-white uppercase italic mb-3">{promo.title}</h4>
              <button onClick={copyReferralLink} className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md hover:bg-white/20 transition-all">
                Copy Promo Link
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSubTab) {
      case 'overview': return renderOverview();
      case 'network': return renderNetwork();
      case 'marketing': return renderMarketing();
      default: return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl glass-panel overflow-hidden flex flex-col h-[85vh]"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center">
              <Trophy size={28} className="text-yellow-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Partner Portal</h2>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_#eab308] ${
                  registration?.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {registration?.status === 'approved' ? 'Active Elite Partner' : 'Elite Partner Program'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Sub Navigation */}
        {registration?.status === 'approved' && (
          <div className="px-8 mt-4 flex items-center gap-2 relative z-10 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'network', label: 'Network', icon: Network },
              { id: 'marketing', label: 'Marketing', icon: Megaphone },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-6 py-3 rounded-xl flex items-center gap-3 transition-all whitespace-nowrap border ${
                  activeSubTab === tab.id 
                  ? 'bg-yellow-500 text-black border-yellow-500 font-black' 
                  : 'bg-white/5 text-gray-500 border-white/5 font-bold hover:bg-white/10'
                } text-[10px] uppercase tracking-widest`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 no-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Syncing Network...</p>
            </div>
          ) : !user ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase italic">Authentication Required</h3>
              <button onClick={onClose} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Go to Login</button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={registration ? activeSubTab : 'form'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {registration ? renderContent() : renderRegistrationForm()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AffiliatesOverlay;
