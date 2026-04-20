import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldCheck, Users, CheckCircle2, 
  XCircle, Clock, Search, Filter,
  ArrowUpRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';

interface AdminOverlayProps {
  onClose: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  appId: string;
}

const AdminOverlay: React.FC<AdminOverlayProps> = ({ onClose, showToast, appId }) => {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'affiliateRegistrations'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      setRegistrations(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (reg: any) => {
    try {
      // 1. Update registration status
      await updateDoc(doc(db, 'affiliateRegistrations', reg.uid), {
        status: 'approved'
      });

      // 2. Update user document
      const userRef = doc(db, 'artifacts', appId, 'users', reg.uid);
      await updateDoc(userRef, {
        isAffiliate: true,
        role: 'affiliate'
      });

      if (showToast) showToast(`Approved ${reg.fullName}`, 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Approval failed', 'error');
    }
  };

  const handleReject = async (reg: any) => {
    try {
      await updateDoc(doc(db, 'affiliateRegistrations', reg.uid), {
        status: 'rejected'
      });
      if (showToast) showToast(`Rejected ${reg.fullName}`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = registrations.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl">
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-4xl glass-panel h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Admin Header */}
        <div className="p-8 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="text-red-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Command Center</h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Elite Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <span className="text-xs font-black text-white">{registrations.length}</span>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"><X /></button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-8 pb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
            <input 
              type="text" 
              placeholder="Search Partners..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-red-500/50 outline-none transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0">
            {['all', 'pending', 'approved'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 no-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="animate-spin text-red-500" size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <AlertCircle size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">No matching applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((reg, i) => (
                <motion.div 
                  key={reg.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="elite-glass p-6 rounded-3xl border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                      <Users className="text-gray-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase italic">{reg.fullName}</h3>
                      <p className="text-xs text-gray-500 font-medium">{reg.email}</p>
                      {reg.telegram && <p className="text-[10px] text-blue-500 font-black mt-1 uppercase tracking-widest">{reg.telegram}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 lg:border-l lg:border-white/10 lg:pl-6">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">XP Level</p>
                      <p className="text-xs font-black text-white uppercase">{reg.experience}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Status</p>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                        reg.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {reg.status === 'approved' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {reg.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {reg.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleApprove(reg)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(reg)}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                    <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOverlay;
