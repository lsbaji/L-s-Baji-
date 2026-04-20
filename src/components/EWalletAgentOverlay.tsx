import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Wallet, TrendingUp, DollarSign, Download, List, Plus, 
  CreditCard, LogOut, Bell, Home, User, Settings,
  CheckCircle, ArrowRight, Star, Shield, Users, Phone, Mail,
  Smartphone, Briefcase, HelpCircle, Activity, Globe, Award, Lock, ShieldCheck, Zap, AlertCircle, BookOpen, Loader2, RefreshCcw, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { db, auth, appId } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { sendTelegramNotification } from '../lib/telegramNotifier';

interface EWalletAgentOverlayProps {
  onClose: () => void;
  userData: any;
}

export default function EWalletAgentOverlay({ onClose, userData }: EWalletAgentOverlayProps) {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'deposit' | 'activation' | 'payment-methods' | 'deposit-history' | 'withdrawal-management' | 'profile' | 'add-balance'>(userData?.isEWalletAgent ? 'dashboard' : 'landing');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [creds, setCreds] = useState({ identifier: '', password: '', fullname: '' });
  const [depositData, setDepositData] = useState({ amount: '', method: 'bKash', transId: '' });
  const [methods, setMethods] = useState<{name: string, type: string, number: string, active: boolean}[]>(userData?.paymentMethods || []);
  const [activationData, setActivationData] = useState({ provider: 'bKash', type: 'Agent', number: '' });
  const [agentAddBalanceData, setAgentAddBalanceData] = useState({ amount: '', method: 'bKash', transId: '' });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ 
    username: userData?.username || userData?.displayName || 'Agent Name', 
    phone: userData?.phone || '01XXXXXXXXX' 
  });

  // Sync profile data when userData updates
  React.useEffect(() => {
    if (userData) {
      setProfileData({
        username: userData.username || userData.displayName || 'Agent Name',
        phone: userData.phone || '01XXXXXXXXX'
      });
    }
  }, [userData]);
  const [confirmObj, setConfirmObj] = useState<{action: string, req: any} | null>(null);

  const deposits = userData?.agentDeposits || [];
  const withdrawals = userData?.agentWithdrawals || [];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getBonus = (method: string) => {
    switch(method) {
      case 'bKash': return 0.05;
      case 'Nagad': return 0.07;
      case 'Rocket': return 0.03;
      default: return 0.02;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creds.identifier || !creds.password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, creds.identifier, creds.password);
      setView('dashboard');
    } catch (error: any) {
      console.error('Login error', error);
      alert(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creds.identifier || !creds.password) return;
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, creds.identifier, creds.password);
      await setDoc(doc(db, 'artifacts', appId, 'users', userCred.user.uid), {
        email: userCred.user.email,
        isEWalletAgent: true,
        username: creds.fullname || creds.identifier.split('@')[0],
        displayName: creds.fullname || creds.identifier.split('@')[0],
        eWalletBalance: 0,
        eWalletTodayCommission: 0,
        eWalletTotalCommission: 0,
        eWalletDepositReceived: 0,
        eWalletWithdrawSent: 0,
        agentDeposits: [],
        agentWithdrawals: [],
        paymentMethods: [],
        createdAt: new Date().toISOString()
      }, { merge: true });
      setView('dashboard');
    } catch (error: any) {
      console.error('Registration error', error);
      alert(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (type: 'deposit' | 'withdraw', amount: number, txDetails: any = null) => {
    if (!auth.currentUser) return;
    const commission = type === 'deposit' ? (amount * 15 / 1000) : (amount * 8 / 1000);
    
    // Check if enough balance
    if (type === 'deposit') {
      if ((Number(userData.eWalletBalance) || 0) < amount) {
        alert("Insufficient E-Wallet Balance. Please add funds first.");
        return false;
      }
    }
    
    const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
    
      const newDocObj: any = {
      eWalletBalance: type === 'deposit' 
                        ? (Number(userData.eWalletBalance) || 0) - amount + commission 
                        : (Number(userData.eWalletBalance) || 0) + amount + commission,
      eWalletTodayCommission: (Number(userData.eWalletTodayCommission) || 0) + commission,
      eWalletTotalCommission: (Number(userData.eWalletTotalCommission) || 0) + commission,
      eWalletDepositReceived: type === 'deposit' ? (Number(userData.eWalletDepositReceived) || 0) + amount : (Number(userData.eWalletDepositReceived) || 0),
      eWalletWithdrawSent: type === 'withdraw' ? (Number(userData.eWalletWithdrawSent) || 0) + amount : (Number(userData.eWalletWithdrawSent) || 0)
    };

    if (type === 'deposit' && txDetails) {
      newDocObj.agentDeposits = [{
        id: `DP-${Math.floor(Math.random()*100000)}`,
        amount: amount,
        method: txDetails.method || 'bKash',
        transId: txDetails.transId || 'N/A',
        date: new Date().toLocaleDateString(),
        status: 'approved'
      }, ...(userData.agentDeposits || [])].slice(0, 50); // Keep last 50
    }

    if (type === 'withdraw' && txDetails) {
      newDocObj.agentWithdrawals = [{
        id: `WD-${Math.floor(Math.random()*100000)}`,
        amount: amount,
        method: txDetails.method || 'bKash',
        transId: txDetails.transId || 'N/A',
        user: txDetails.user || 'Unknown User',
        date: new Date().toLocaleDateString(),
        status: 'approved'
      }, ...(userData.agentWithdrawals || [])].slice(0, 50);
    }

    await updateDoc(userRef, newDocObj);

    await sendTelegramNotification(`💰 <b>Transaction ${type.toUpperCase()}</b>\n<b>Agent:</b> ${userData?.username}\n<b>Amount:</b> ${amount} ৳\n<b>Status:</b> Success`);
    alert(`Success!`);
    return true;
  };

  const confirmAction = async () => {
    if (!confirmObj || !auth.currentUser) return;
    const { action, req } = confirmObj;

    try {
      const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);

      if (action === 'approve_withdraw') {
        const commission = (req.amount * 8) / 1000;
        const updatedWithdrawals = (userData.agentWithdrawals || []).map((w: any) =>
          w.id === req.id ? { ...w, status: 'approved' } : w
        );

        await updateDoc(userRef, {
          eWalletBalance: (Number(userData.eWalletBalance) || 0) + Number(req.amount) + commission,
          eWalletTodayCommission: (Number(userData.eWalletTodayCommission) || 0) + commission,
          eWalletTotalCommission: (Number(userData.eWalletTotalCommission) || 0) + commission,
          eWalletWithdrawSent: (Number(userData.eWalletWithdrawSent) || 0) + Number(req.amount),
          agentWithdrawals: updatedWithdrawals
        });
        await sendTelegramNotification(`💰 <b>Withdrawal Approved</b>\n<b>Agent:</b> ${userData?.username}\n<b>Amount:</b> ${req.amount} ৳\n<b>Status:</b> Success`);

      } else if (action === 'cancel_withdraw') {
        const updatedWithdrawals = (userData.agentWithdrawals || []).map((w: any) =>
          w.id === req.id ? { ...w, status: 'cancelled' } : w
        );
        await updateDoc(userRef, {
          agentWithdrawals: updatedWithdrawals
        });
        await sendTelegramNotification(`🚫 <b>Withdrawal Cancelled</b>\n<b>Agent:</b> ${userData?.username}\n<b>Amount:</b> ${req.amount} ৳`);
      }
    } catch (error) {
      console.error('Error confirming action:', error);
      alert("Error completing transaction");
    }
    setConfirmObj(null);
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending' || s === 'processing') {
      return (
         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
           <Clock size={10} className="animate-spin" /> {status}
         </span>
      );
    }
    if (s === 'approved' || s === 'success') {
      return (
         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
           <CheckCircle2 size={10} /> {status}
         </span>
      );
    }
    if (s === 'cancelled' || s === 'failed') {
      return (
         <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-rose-500/10 text-rose-500 border-rose-500/20">
           <XCircle size={10} /> {status}
         </span>
      );
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-gray-500/10 text-gray-500 border-gray-500/20">{status}</span>;
  };

  const renderPaymentMethods = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"><ArrowRight className="rotate-180" size={16}/></button>
        <h3 className="text-xl font-black text-white">Manage Payment Methods</h3>
      </div>
      {methods.map((m, i) => (
        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
          <div><p className="text-white font-bold">{m.name} ({m.type})</p><p className="text-gray-400 text-xs">{m.number}</p></div>
          <button onClick={async () => {
            const newMethods = [...methods];
            newMethods[i].active = !newMethods[i].active;
            setMethods(newMethods);
            if (auth.currentUser) {
              await updateDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid), {
                paymentMethods: newMethods
              });
            }
            sendTelegramNotification(`⚠️ <b>Payment Method Updated</b>\n<b>Agent:</b> ${userData?.username}\n<b>Method:</b> ${m.name} is now ${newMethods[i].active ? 'Active' : 'Inactive'}`);
          }} className={`px-3 py-1 rounded-lg text-[10px] font-black ${m.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {m.active ? 'ACTIVE' : 'INACTIVE'}
          </button>
        </div>
      ))}
    </div>
  );

  const renderActivationSection = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"><ArrowRight className="rotate-180" size={16}/></button>
        <h3 className="text-xl font-black text-white">Activate Number</h3>
      </div>
      {userData?.eWalletBalance === 0 ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold text-center">
            Sir, please activate your e-wallet account first by adding balance to your e-wallet agent account. An active account enables all e-wallet services.
        </div>
      ) : (
        <form className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10" onSubmit={e => e.preventDefault()}>
          <select onChange={e => setActivationData({...activationData, provider: e.target.value})} className="w-full bg-black/40 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:border-yellow-500">
             {['bKash', 'Nagot', 'Upay', 'Mcash'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select onChange={e => setActivationData({...activationData, type: e.target.value})} className="w-full bg-black/40 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:border-yellow-500">
             <option value="Agent">Agent</option><option value="Personal">Personal</option>
          </select>
          <input type="text" placeholder="Enter account number" onChange={e => setActivationData({...activationData, number: e.target.value})} className="w-full bg-black/40 text-white p-3 rounded-lg border border-white/10 focus:outline-none focus:border-yellow-500" />
          <button onClick={async () => {
            if (!activationData.number) return alert('Please enter a number');
            await sendTelegramNotification(`✅ <b>New Agent Number Activated</b>\n<b>Agent:</b> ${userData?.username}\n<b>Provider:</b> ${activationData.provider} (${activationData.type})\n<b>Number:</b> ${activationData.number}`);
            alert('Activation request submitted!');
            setView('dashboard');
          }} className="w-full bg-yellow-500 text-black font-black p-3 rounded-lg hover:bg-yellow-400 transition-colors uppercase tracking-wider">Activate Number</button>
        </form>
      )}
    </div>
  );

  const renderAddBalance = () => (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"><ArrowRight className="rotate-180" size={16}/></button>
        <h3 className="text-xl font-black text-white">Add Agent Balance</h3>
      </div>
      <form className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg" onSubmit={async (e) => {
        e.preventDefault();
        const amount = parseFloat(agentAddBalanceData.amount);
        if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');
        if (!agentAddBalanceData.transId) return alert('Enter Transaction ID');
        
        await sendTelegramNotification(`⏳ <b>Agent Add Balance Request</b>\n<b>Agent:</b> ${userData?.username || 'Unknown'}\n<b>Amount:</b> ৳${amount}\n<b>Method:</b> ${agentAddBalanceData.method}\n<b>Trans ID:</b> ${agentAddBalanceData.transId}`);
        alert(`Add balance request of ৳${amount} submitted! Waiting for admin approval via Telegram.`);
        setView('dashboard');
      }}>
         <div>
           <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">Deposit Amount (৳)</label>
           <input type="number" required value={agentAddBalanceData.amount} onChange={e => setAgentAddBalanceData({...agentAddBalanceData, amount: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-white border border-white/10 focus:outline-none focus:border-yellow-500" placeholder="e.g. 5000" />
         </div>
         <div>
           <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">Payment Method</label>
           <select required value={agentAddBalanceData.method} onChange={e => setAgentAddBalanceData({...agentAddBalanceData, method: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-white border border-white/10 focus:outline-none focus:border-yellow-500">
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
              <option value="Bank">Bank Transfer</option>
              <option value="Binance">Binance</option>
              <option value="USDT">USDT</option>
           </select>
         </div>
         <div>
           <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">Transaction ID</label>
           <input type="text" required value={agentAddBalanceData.transId} onChange={e => setAgentAddBalanceData({...agentAddBalanceData, transId: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-white border border-white/10 focus:outline-none focus:border-yellow-500" placeholder="Enter Trans ID" />
         </div>
         <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 transition-colors text-black font-black p-4 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)] uppercase tracking-wider text-sm flex justify-center items-center gap-2 mt-4">
           Submit Request
         </button>
      </form>
    </div>
  );

  const renderDepositSection = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"><ArrowRight className="rotate-180" size={16}/></button>
        <h3 className="text-xl font-black text-white">Process Deposit</h3>
      </div>
      <form className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg" onSubmit={async (e) => {
        e.preventDefault();
        const amount = parseFloat(depositData.amount);
        if (isNaN(amount) || amount <= 0) return;
        
        const success = await handleTransaction('deposit', amount, depositData);
        if(success) {
          setView('dashboard');
          setDepositData({ amount: '', method: 'bKash', transId: '' });
        }
      }}>
         <div>
           <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">Deposit Amount (৳)</label>
           <input type="number" required value={depositData.amount} onChange={e => setDepositData({...depositData, amount: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-white border border-white/10 focus:outline-none focus:border-emerald-500" placeholder="e.g. 500" />
         </div>
         <div>
           <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">Payment Method</label>
           <select required value={depositData.method} onChange={e => setDepositData({...depositData, method: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-white border border-white/10 focus:outline-none focus:border-emerald-500">
              <option value="bKash">bKash</option><option value="Nagad">Nagad</option><option value="Rocket">Rocket</option>
           </select>
         </div>
         <div className="text-emerald-400 font-bold text-sm bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-center">
            Player will receive {(parseFloat(depositData.amount || '0') * getBonus(depositData.method)).toFixed(2)}৳ Bonus!
         </div>
         <div>
           <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">Transaction ID</label>
           <input type="text" required value={depositData.transId} onChange={e => setDepositData({...depositData, transId: e.target.value})} className="w-full bg-black/40 p-3 rounded-lg text-white border border-white/10 focus:outline-none focus:border-emerald-500" placeholder="Enter Trans ID" />
         </div>
         <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 transition-colors text-black font-black p-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-wider text-sm flex justify-center items-center gap-2">
           Confirm & Process Deposit
         </button>
      </form>
    </div>
  );
  const renderDepositHistory = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"><ArrowRight className="rotate-180" size={16}/></button>
        <h3 className="text-xl font-black text-white">Deposit History</h3>
      </div>
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/40 text-gray-400 font-bold border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Trans ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 border-t border-white/5">
              {deposits.map((dep: any) => (
                <tr key={dep.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-black text-white">৳ {dep.amount}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 text-xs font-bold">{dep.method}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{dep.transId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">{dep.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">{renderStatusBadge(dep.status)}</td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 font-bold text-xs uppercase tracking-widest">No history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderWithdrawalManagement = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"><ArrowRight className="rotate-180" size={16}/></button>
          <h3 className="text-xl font-black text-white">Withdrawal Requests</h3>
        </div>
        <button onClick={async () => {
          if (!auth.currentUser) return;
          const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
          const demoReq = {
            id: `WD-${Math.floor(Math.random()*100000)}`,
            amount: 500 + Math.floor(Math.random()*2000),
            method: ['bKash', 'Nagad', 'Rocket'][Math.floor(Math.random()*3)],
            transId: 'DEMO' + Math.floor(Math.random()*100000),
            user: 'User_' + Math.floor(Math.random()*999),
            date: new Date().toLocaleDateString(),
            status: 'pending'
          };
          await updateDoc(userRef, {
            agentWithdrawals: [demoReq, ...(userData?.agentWithdrawals || [])].slice(0, 50)
          });
        }} className="px-3 py-1.5 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-yellow-500/30 transition-colors">+ TEST REQ</button>
      </div>
      <div className="space-y-4">
        {withdrawals.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 font-bold text-xs uppercase tracking-widest bg-white/5 rounded-2xl border border-white/10">No pending withdrawals</div>
        )}
        {withdrawals.map((req: any) => (
          <div key={req.id} className="bg-white/5 rounded-2xl border border-white/10 p-5 shadow-lg relative overflow-hidden group hover:bg-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10"><List size={40} className="text-white group-hover:scale-110 transition-transform"/></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">User</p>
                <p className="text-sm font-bold text-white">{req.user}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</p>
                {renderStatusBadge(req.status)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 relative z-10 p-3 bg-black/20 rounded-xl border border-white/5">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Amount</p>
                <p className="text-lg font-black text-rose-400">৳ {req.amount}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Method</p>
                <p className="text-sm font-bold text-white">{req.method}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Trans ID</p>
                <p className="text-xs font-mono text-gray-300">{req.transId}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</p>
                <p className="text-xs text-gray-400">{req.date}</p>
              </div>
            </div>
            {req.status === 'pending' && (
              <div className="flex gap-2 relative z-10">
                <button onClick={() => setConfirmObj({ action: 'approve_withdraw', req })} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex justify-center items-center gap-1.5"><CheckCircle2 size={14}/> Approve</button>
                <button onClick={() => setConfirmObj({ action: 'cancel_withdraw', req })} className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex justify-center items-center gap-1.5"><XCircle size={14}/> Cancel</button>
              </div>
            )}
          </div>
        ))}
        {withdrawals.length === 0 && (
           <div className="p-8 text-center text-gray-500 font-bold tracking-widest uppercase text-xs">
             No pending withdrawals
           </div>
        )}
      </div>
    </div>
  );

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.currentUser) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid), {
        username: profileData.username,
        phone: profileData.phone
      });
      alert('Profile updated successfully!');
    }
    setIsEditingProfile(false);
  };

  const renderProfile = () => (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-white">Agent Profile</h3>
        {!isEditingProfile && (
           <button onClick={() => setIsEditingProfile(true)} className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">Edit Profile</button>
        )}
      </div>
      
      {isEditingProfile ? (
        <form onSubmit={handleProfileUpdate} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4 shadow-lg">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Username</label>
            <input type="text" value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})} className="w-full bg-black/40 text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Phone Number</label>
            <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full bg-black/40 text-white p-3 rounded-lg border border-white/10 focus:border-yellow-500 outline-none" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-yellow-500 text-black font-black p-3 rounded-xl hover:bg-yellow-400 transition-colors">Save</button>
            <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 bg-white/10 text-white font-bold p-3 rounded-xl hover:bg-white/20 transition-colors">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-yellow-600 flex items-center justify-center text-black shadow-lg">
             <User size={32} />
          </div>
          <div>
            <h4 className="text-xl font-black text-white">{profileData.username}</h4>
            <p className="text-sm text-gray-400 font-mono mt-1">{profileData.phone}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
         <h5 className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-2">Account Settings</h5>
         <button className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 text-gray-200">
               <Lock size={18} className="text-yellow-500" />
               <span className="font-bold text-sm">Change Password</span>
            </div>
            <ArrowRight size={16} className="text-gray-500" />
         </button>
         <button className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 text-gray-200">
               <Shield size={18} className="text-blue-400" />
               <span className="font-bold text-sm">Privacy Settings</span>
            </div>
            <ArrowRight size={16} className="text-gray-500" />
         </button>
      </div>

      <div className="space-y-3">
         <h5 className="text-[10px] uppercase font-black tracking-widest text-gray-500 ml-2">App & Community</h5>
         <button className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 text-gray-200">
               <BookOpen size={18} className="text-emerald-400" />
               <span className="font-bold text-sm">Terms & Conditions</span>
            </div>
            <ArrowRight size={16} className="text-gray-500" />
         </button>
         <a href="https://t.me/lsbajiofficial" target="_blank" rel="noreferrer" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center gap-3 text-gray-200">
               <Globe size={18} className="text-blue-500" />
               <span className="font-bold text-sm">Official Telegram Channel</span>
            </div>
            <ArrowRight size={16} className="text-gray-500" />
         </a>
         <a href="https://t.me/lsbajisupport" target="_blank" rel="noreferrer" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-blue-500/10 transition-colors">
            <div className="flex items-center gap-3 text-gray-200">
               <HelpCircle size={18} className="text-blue-500" />
               <span className="font-bold text-sm">Agent Support (Telegram)</span>
            </div>
            <ArrowRight size={16} className="text-gray-500" />
         </a>
      </div>

      <button onClick={async () => {
        try {
          await auth.signOut();
          window.location.reload();
        } catch (err) {
          console.error('Logout error', err);
        }
      }} className="w-full mt-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 active:bg-rose-500/30 p-4 rounded-xl font-black uppercase tracking-wider text-sm flex justify-center items-center gap-2 transition-all shadow-sm">
         <LogOut size={18} /> Logout E-Wallet
      </button>
    </div>
  );

  const renderLanding = () => (
    <div className="min-h-full pb-20 bg-black">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Shield className="text-yellow-500 max-w-full drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" size={24} />
          <span className="font-black text-white tracking-wider uppercase drop-shadow-md">L's Baji</span>
        </div>
        <button onClick={() => setView('login')} className="px-5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all font-black rounded-full uppercase tracking-wider text-xs">LOGIN</button>
      </div>

      <div className="p-6 text-center mt-6">
        <h1 className="text-4xl font-black text-white leading-tight drop-shadow-md">Join Today To<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">Earn Today</span></h1>
        <p className="mt-4 text-gray-300 font-medium">Get Ready with your Wallet & to earn commition for every tranction sussesfully.</p>
        
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {['Individual', 'Easy & Trusted', 'Fast Support', 'Higher Trafic', 'Easy Mobile apps', 'friendly Support', 'higher Commtion', 'Best payment Getway'].map((tag, i) => (
             <span key={i} className="px-3 py-1.5 bg-white/10 border border-white/20 backdrop-blur-md text-gray-200 text-xs font-bold rounded-full shadow-sm">{tag}</span>
          ))}
        </div>
        
        <button className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all text-white font-bold rounded-full shadow-lg w-full mb-12">Learn more</button>
      </div>

      <div className="bg-black/60 backdrop-blur-xl border-y border-white/10 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <h2 className="text-2xl font-black text-white">Join Now With L's Baji</h2>
        <p className="mt-3 text-sm text-yellow-500 font-bold">Only need any Wallet for earn money unlimited From L's Baji</p>
        <p className="mt-3 text-xs text-gray-300">You can connect to L's Baji Payment Gateway with just one wallet. Join now to earn easily and profitably.</p>
        <p className="mt-3 text-xs text-gray-400 font-bold italic">Build your life with L's Baji Payment Gateway and earn easily through your wallet.</p>
        <button onClick={() => setView('register')} className="mt-8 px-8 py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black hover:scale-[1.02] active:scale-95 transition-all rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] uppercase w-full">JOIN NOW</button>
      </div>

      <div className="p-6 mt-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgb(0,0,0,0.4)] p-6 border border-white/10 border-t-emerald-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Download className="text-emerald-500" size={64}/></div>
          <h3 className="text-xl font-black text-white">Deposit Receiver E-Wallet Agent</h3>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]">L's Baji APPS</p>
          <p className="mt-4 text-sm text-gray-300 leading-relaxed font-medium">খেলোয়াড়দের ডিপজিট এর অর্থ গ্রহন করুন আপনার ওয়ালেট এর মাধ্যমে প্রতিটি লেনদেন এ পাচ্ছেন ৫% কমিশন । এছারাও টপআপ এবং টার্গেট পুরন করে পাচ্ছেন অতিরিক্ত আয় করার সুযোগ। যেকোনো একটি ওয়ালেট ই যতেষ্ট ।</p>
          <div className="flex flex-wrap gap-2 mt-4 relative z-10">
            <span className="text-[10px] font-bold bg-white/10 text-gray-200 px-2 py-1 rounded">any-time any whare</span>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">Automatic</span>
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">Verified</span>
            <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30">25000</span>
            <span className="text-[10px] font-bold bg-white/10 text-gray-200 px-2 py-1 rounded">Bangladesh</span>
          </div>
          <button onClick={() => setView('register')} className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-black font-black rounded-lg transition-colors relative z-10 uppercase tracking-wider text-sm">Register Now</button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgb(0,0,0,0.4)] p-6 border border-white/10 border-t-rose-500 mt-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><List className="text-rose-500" size={64}/></div>
          <h3 className="text-xl font-black text-white">Withdraw Sender E-Wallet Agent</h3>
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mt-1 drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]">L's Baji APPS</p>
          <p className="mt-4 text-sm text-gray-300 leading-relaxed font-medium">খেলোয়াড়দের উইথড্র এর অর্থ প্রদান করুন আপনার ওয়ালেট এর মাধ্যমে। প্রতিটি লেনদেন প্রদান করে পাচ্ছেন ২% কমিশন ।</p>
          <div className="flex flex-wrap gap-2 mt-4 relative z-10">
             <span className="text-[10px] font-bold bg-white/10 px-2 py-1 text-gray-200 rounded">any-time any whare</span>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded">Automatic</span>
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded">Verified</span>
            <span className="text-[10px] font-bold bg-white/10 text-gray-200 px-2 py-1 rounded">00</span>
            <span className="text-[10px] font-bold bg-white/10 text-gray-200 px-2 py-1 rounded">Bangladesh</span>
          </div>
          <button onClick={() => setView('register')} className="mt-6 w-full py-3 bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] text-white font-black rounded-lg transition-colors relative z-10 uppercase tracking-wider text-sm">Register Now</button>
        </div>
      </div>

      <div className="mt-4 p-8 bg-black/60 border-y border-white/10 backdrop-blur-xl text-center">
        <h2 className="text-2xl font-black text-white">Why you Join L's Baji</h2>
        <p className="mt-2 text-sm text-yellow-500 font-medium">এটি সহজ , লাভজনক , এবং নিরাপদ।</p>
        <h3 className="mt-8 text-lg font-bold text-white drop-shadow-md">L's Baji কিভাবে কাজ করে ।</h3>
        <p className="mt-4 text-sm text-gray-400 leading-relaxed">সহজে আয় করার মাধ্যম<br/>L's Baji প্রায় ১ দশকের বেশি সময় ধরে বাংলাদেশের ৩০ টির বেশি অন্যতম বেটিং সাইটের লেনদেন পরিচালনায় বিশেষ ভুমিকা পালন করে আসছে । এজেন্ট এর ওয়ালেট এ সর্বোচ্চ ট্রাফিক প্রদান করতে ওয়েবসাইট গুলোটে অটোমেটিক সিস্টেম এ নাম্বার প্রদর্শন করে , এজেন্ট উক্ত অর্থ বুঝে পেয়ে L's Baji এপ্সের মাধেমে টা সরাসরি খেলোয়াড় এর এক্যাউন্ট এ জমা হয় । একইভাবে খেলোয়াড় উইথড্র এর জন্য আবেদন করলে তা এজেন্টের মাধ্যমে তা সরাসরি খেলোয়াড় দের ওয়ালেট এ প্রদান করে।সকল লেনদেন এর উপর L's Baji নির্দিষ্ট কমিশন পায় যার বেশিরভাগ অংশ এজেন্টের সাথে ভাগ করা হয় ।</p>
        <button onClick={() => setView('register')} className="mt-8 px-8 py-3 bg-white/10 border border-white/20 text-white hover:bg-white/20 font-black rounded-xl shadow-lg w-full uppercase tracking-wider">Register Now</button>
      </div>

      <div className="p-6 text-center mt-6">
        <h2 className="text-2xl font-black text-white">Top Agent From lust 30 Days</h2>
        <p className="mt-1 text-sm text-yellow-500 font-medium tracking-wide">আমাদের সেরা এজেন্টদের তালিকা</p>
        
        <div className="mt-6 space-y-4">
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/10 text-left flex gap-4 hover:bg-white/10 transition-colors cursor-default">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black rounded-full flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(234,179,8,0.5)]">1</div>
            <div>
              <h4 className="font-black text-white">Ehsan Kabir <span className="text-[10px] font-normal text-gray-400 ml-2">joined - 2021</span></h4>
              <p className="text-[10px] text-gray-400 mt-1">মাসঃ অক্টোবর | ওয়ালেটঃ <span className="text-[#e2136e] font-bold">বিকাশ এজেন্ট</span></p>
              <p className="text-[10px] font-bold text-emerald-400 mt-1">মোট ট্রাফিকঃ ৬,৩৯৮,৩৭৬ টাকা</p>
              <p className="text-[10px] font-bold text-blue-400">১ দিনের সর্বোচ্চঃ ৪৮৭,৫৬৪ টাকা</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/10 text-left flex gap-4 hover:bg-white/10 transition-colors cursor-default">
            <div className="w-12 h-12 bg-white/10 border border-white/20 text-gray-300 rounded-full flex items-center justify-center font-black text-xl">2</div>
            <div>
              <h4 className="font-black text-white">Nabil Haque <span className="text-[10px] font-normal text-gray-400 ml-2">joined - 2024</span></h4>
              <p className="text-[10px] text-gray-400 mt-1">মাসঃ অক্টোবর | ওয়ালেটঃ <span className="text-[#f15a24] font-bold">নগদ এজেন্ট</span></p>
              <p className="text-[10px] font-bold text-emerald-400 mt-1">মোট ট্রাফিকঃ ৫,৩৭৬,৩৪২ টাকা</p>
              <p className="text-[10px] font-bold text-blue-400">১ দিনের সর্বোচ্চঃ ৩৪২,৫৪২ টাকা</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-black/60 border-t border-white/10 backdrop-blur-xl text-white p-8 pb-12">
        <h2 className="text-2xl font-black">CONTACT US</h2>
        <p className="mt-2 text-sm text-yellow-500">এখনি যোগদান করুন আর উপার্জন করুন</p>
        <p className="mt-4 text-xs text-gray-400 leading-relaxed">L's Baji offers a complete Bangladeshi payment gateway solution tailored to online businesses of any size. It provides over 100 global methods for transactions. These include cards, mobile solutions, digital wallets, and direct bank transfers. This wide compatibility increases your conversion options.</p>
        <div className="mt-6 space-y-3 text-sm">
          <p><strong>Address:</strong> Gambaling bangladesh, Dhaka, 1212</p>
          <p><strong>Contact:</strong> <a href="https://m.me/LsBajiOfficial" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">https://m.me/LsBajiOfficial</a></p>
          <p><strong>Email:</strong> admin@lsbaji.com</p>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-[10px] text-gray-500">
          <div className="flex justify-center gap-6 mb-4">
            <a href="#" className="hover:text-yellow-500 transition-colors">Home</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">Contact Us</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">Services</a>
          </div>
          <p>Copyright L's Baji. All rights reserved.</p>
        </div>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="h-full flex flex-col p-4 relative z-10">
      <div className="flex justify-between items-center mb-10 pt-4">
        <button onClick={() => setView('landing')} className="text-gray-400 bg-white/5 p-2 rounded-full border border-white/10 hover:bg-white/10"><X size={20}/></button>
        <span className="font-black tracking-widest text-white uppercase text-xs">Payment Gateway</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 max-w-md w-full mx-auto p-2">
        <div className="text-center mb-10 relative">
          <Shield className="mx-auto text-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" size={48} />
          <h1 className="text-2xl font-black text-white">L's Baji | Nagad | Rocket</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mt-2">Agent Portal Gateway</p>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">সবচেয়ে নির্ভরযোগ্য এবং নিরাপদ পেমেন্ট সলিউশন। Agent Portal এ লগইন করুন অথবা নতুন একাউন্ট তৈরি করুন।</p>
          <p className="text-sm font-bold text-emerald-400 mt-4 bg-emerald-500/10 inline-block px-4 py-1.5 rounded-full border border-emerald-500/20">সিস্টেমে ফিরে আসায় স্বাগতম!</p>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10">
          <h2 className="text-xl font-black text-white mb-1">লগইন করুন</h2>
          <p className="text-xs text-gray-400 mb-6 font-medium">আপনার একাউন্টে প্রবেশ করতে ক্রেডেনশিয়াল দিন</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">ইউজারনেম / ইমেইল / ফোন</label>
              <input 
                type="text" 
                required
                value={creds.identifier}
                onChange={e => setCreds({...creds, identifier: e.target.value})}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 focus:bg-black/60 transition-colors placeholder:text-gray-600"
                placeholder="ইউজারনেম, ইমেইল অথবা ফোন"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">পাসওয়ার্ড</label>
              <input 
                type="password" 
                required
                value={creds.password}
                onChange={e => setCreds({...creds, password: e.target.value})}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 focus:bg-black/60 transition-colors placeholder:text-gray-600"
                placeholder="আপনার পাসওয়ার্ড"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black py-4 rounded-xl mt-4 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] active:scale-[0.98] transition-all uppercase tracking-wider text-sm flex justify-center items-center gap-2"
            >
              {loading ? <span className="animate-spin w-5 h-5 border-2 border-black/20 border-t-black rounded-full"></span> : 'লগইন করুন'}
            </button>
          </form>

          <div className="mt-8 space-y-3">
             <div className="flex items-center gap-3 text-[11px] text-gray-300 font-bold bg-white/5 p-3 rounded-xl border border-white/5"><ShieldCheck size={16} className="text-emerald-500"/> ১০০% নিরাপদ ও এনক্রিপ্টেড</div>
             <div className="flex items-center gap-3 text-[11px] text-gray-300 font-bold bg-white/5 p-3 rounded-xl border border-white/5"><Zap size={16} className="text-yellow-500"/> দ্রুত এবং সহজ লেনদেন</div>
          </div>
          
          <button onClick={() => setView('register')} className="w-full mt-6 py-3.5 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 text-sm transition-colors uppercase tracking-wider">নতুন একাউন্ট তৈরি করুন</button>
        </div>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="h-full flex flex-col p-4 relative z-10">
      <div className="flex justify-between items-center mb-10 pt-4">
        <button onClick={() => setView('landing')} className="text-gray-400 bg-white/5 p-2 rounded-full border border-white/10 hover:bg-white/10"><X size={20}/></button>
        <span className="font-black tracking-widest text-white uppercase text-xs">L's Baji Training</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 max-w-md w-full mx-auto p-2">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <Award className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white">রেজিস্ট্রেশন করুন</h1>
          <p className="text-sm text-gray-400 mt-2">সহজে রেজিস্ট্রেশন করুন এবং ট্রেনিং শুরু করুন।</p>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">সম্পূর্ণ নাম</label>
              <input 
                type="text" 
                required 
                value={creds.fullname}
                onChange={e => setCreds({...creds, fullname: e.target.value})}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 focus:bg-black/60 transition-colors placeholder:text-gray-600" 
                placeholder="আপনার নাম" 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">ফোন নম্বর / ইমেইল</label>
              <input 
                type="text" 
                required 
                value={creds.identifier}
                onChange={e => setCreds({...creds, identifier: e.target.value})}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 focus:bg-black/60 transition-colors placeholder:text-gray-600" 
                placeholder="e.g. 017XXXXXX / email@..." 
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5 ml-1">পাসওয়ার্ড</label>
              <input 
                type="password" 
                required 
                value={creds.password}
                onChange={e => setCreds({...creds, password: e.target.value})}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 focus:bg-black/60 transition-colors placeholder:text-gray-600" 
                placeholder="পাসওয়ার্ড দিন" 
              />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black py-4 rounded-xl mt-6 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] active:scale-[0.98] transition-all uppercase tracking-wider text-sm flex justify-center items-center gap-2">
               {loading ? <span className="animate-spin w-5 h-5 border-2 border-black/20 border-t-black rounded-full"></span> : 'রেজিস্ট্রেশন সম্পূর্ণ করুন'}
            </button>
          </form>
          
          <button onClick={() => setView('login')} className="w-full mt-4 py-3.5 text-yellow-500 font-bold rounded-xl hover:bg-yellow-500/10 text-sm transition-colors border border-yellow-500/20 uppercase tracking-wider">রয়েছে? লগইন</button>

          <p className="text-[10px] text-center text-gray-500 mt-6 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
            রেজিষ্ট্রেশন সম্পন্ন হওয়ার পর আপনি আপনার জিমেইলে একটি লগইন কী পাবেন। নির্দিষ্ট স্থানে আপনার মোবাইল নম্বর, পাসওয়ার্ড এবং লগইন কোড দিয়ে লগইন করুন।
          </p>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="h-full flex flex-col relative overflow-hidden z-10 bg-black">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 bg-black sticky top-0 z-10 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Shield className="text-yellow-500" size={18} />
          <span className="font-black tracking-widest text-sm uppercase text-white">L's Baji Gateway</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-full border border-white/10">
            <button onClick={() => setIsOnline(!isOnline)} className="text-[10px] font-black uppercase w-8 text-center text-white">
              {isOnline ? 'ON' : 'OFF'}
            </button>
            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors ${isOnline ? 'bg-emerald-400 text-emerald-400' : 'bg-rose-500 text-rose-500'}`} />
          </div>
          <button className="text-white hover:text-yellow-500 bg-black/40 p-2 rounded-lg border border-white/10 relative">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          <button onClick={() => setView('landing')} className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 px-3 py-2 rounded-lg border border-rose-500/30 hover:bg-rose-500/30 text-white flex items-center gap-1 transition-colors">
            <LogOut size={12}/> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-4 mt-2">
          
          <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-2xl p-6 shadow-[0_8px_32px_rgba(79,70,229,0.3)] relative overflow-hidden border border-white/10">
            <div className="absolute -top-4 -right-4 p-4 opacity-10"><Shield size={120}/></div>
            <div className="relative z-10 flex justify-between items-start">
               <div>
                 <h2 className="text-2xl font-black text-white">Welcome, {userData?.username || userData?.displayName || userData?.email?.split('@')[0] || 'Agent'}!</h2>
                 <p className="text-xs text-blue-100 mt-1 font-medium tracking-wide italic opacity-80 backdrop-blur-sm">{userData?.email}</p>
                 <p className="text-[10px] text-blue-200 mt-2 font-medium tracking-wide">Manage your payment gateway efficiently.</p>
               </div>
               <div className="flex flex-col gap-2">
                 <button onClick={() => window.open('https://m.me/LsBajiOfficial', '_blank')} className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all">
                   <BookOpen size={12}/> Get Training
                 </button>
                 <button onClick={handleRefresh} className="bg-indigo-500/40 hover:bg-indigo-500/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all">
                   <RefreshCcw size={12} className={refreshing ? 'animate-spin' : ''}/> Refresh
                 </button>
               </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
                <div className="inline-block px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-white tracking-widest uppercase">
                    LEVEL: APPRENTICE
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
              <span className="text-[9px] font-black tracking-widest text-[#93c5fd] mb-1">WALLET BALANCE</span>
              <span className="text-xl font-black tracking-wider text-white">৳ {(Number(userData?.eWalletBalance) || 0).toFixed(2)}</span>
              <div className="mt-4 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]"><Wallet size={18}/></div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
              <span className="text-[9px] font-black tracking-widest text-[#86efac] mb-1">TODAY'S COMMISSION</span>
              <span className="text-xl font-black tracking-wider text-white">৳ {(Number(userData?.eWalletTodayCommission) || 0).toFixed(2)}</span>
              <div className="mt-4 w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]"><TrendingUp size={18}/></div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
              <span className="text-[9px] font-black tracking-widest text-[#fde047] mb-1">TOTAL COMMISSION</span>
              <span className="text-xl font-black tracking-wider text-white">৳ {(Number(userData?.eWalletTotalCommission) || 0).toFixed(2)}</span>
              <div className="mt-4 w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]"><DollarSign size={18}/></div>
            </div>
            
            <div className="grid grid-rows-2 gap-3">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-3 border border-white/10 text-center flex flex-col justify-center relative overflow-hidden shadow-lg group">
                <div className="absolute right-0 bottom-0 p-2 opacity-5 scale-150 group-hover:scale-110 transition-transform"><Download size={40}/></div>
                <span className="text-[8px] font-black tracking-widest text-emerald-400 mb-1 leading-tight text-left relative z-10">TOTAL DEPOSIT RECEIVED</span>
                <span className="text-base font-black text-white text-left relative z-10">৳ {(Number(userData?.eWalletDepositReceived) || 0).toFixed(2)}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-3 border border-white/10 text-center flex flex-col justify-center relative overflow-hidden shadow-lg group">
                <div className="absolute right-0 bottom-0 p-2 opacity-5 scale-150 group-hover:scale-110 transition-transform"><List size={40}/></div>
                <span className="text-[8px] font-black tracking-widest text-rose-400 mb-1 leading-tight text-left relative z-10">TOTAL WITHDRAW SENT</span>
                <span className="text-base font-black text-white text-left relative z-10">৳ {(Number(userData?.eWalletWithdrawSent) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-black text-white mt-8 mb-2 drop-shadow-md">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setView('add-balance')} className="col-span-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between hover:bg-yellow-500/30 transition-all shadow-lg group">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"><Wallet size={24}/></div>
                 <div className="text-left">
                   <h4 className="font-bold text-sm text-white">Add Balance</h4>
                   <p className="text-[10px] text-gray-400 mt-1 leading-relaxed font-medium">Add funds to e-wallet account</p>
                 </div>
              </div>
              <ArrowRight className="text-yellow-500" size={20} />
            </button>
            <button onClick={() => setView('deposit')} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:bg-white/10 hover:border-emerald-500/30 transition-all shadow-lg group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"><Plus size={24}/></div>
              <h4 className="font-bold text-sm text-white">Process Deposit</h4>
              <p className="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium">Add received player deposit</p>
            </button>
            <button onClick={() => setView('activation')} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:bg-white/10 hover:border-rose-500/30 transition-all shadow-lg group">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"><Activity size={24}/></div>
              <h4 className="font-bold text-sm text-white">Activate Number</h4>
              <p className="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium">Toggle agent account numbers</p>
            </button>
          </div>

          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 backdrop-blur-xl rounded-2xl flex items-start gap-3 shadow-[0_4px_20px_rgba(244,63,94,0.1)]">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 animate-pulse"/>
            <p className="text-xs font-bold text-red-200 mt-0.5 leading-relaxed tracking-wide">ব্যালেন্স ০৳ হলে গেটওয়ে ব্যবহার করা যাবে না। অনুগ্রহ করে ব্যালেন্স এড করুন।</p>
          </div>

          <button onClick={() => setView('payment-methods')} className="w-full mt-4 border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between hover:bg-emerald-500/20 transition-colors cursor-pointer text-left">
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">Manage Payment Methods <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full tracking-widest font-black uppercase">ACTIVE</span></h4>
              <p className="text-[10px] text-gray-300 mt-1">Configure your active transaction numbers</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative flex-shrink-0">
               <CreditCard size={20} className="text-emerald-400"/>
              <div className="absolute -bottom-1 -right-1 text-emerald-500 bg-black rounded-full border border-black"><CheckCircle size={16}/></div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
            <button onClick={() => setView('deposit-history')} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:bg-white/10 hover:border-emerald-500/30 transition-all shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Clock size={40}/></div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10"><Clock size={24}/></div>
              <h4 className="font-bold text-sm text-white relative z-10">Deposit History</h4>
              <p className="text-[10px] text-gray-400 mt-1 relative z-10">View processed deposits</p>
            </button>
            <button onClick={() => setView('withdrawal-management')} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:bg-white/10 hover:border-rose-500/30 transition-all shadow-lg group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><List size={40}/></div>
              <span className="absolute top-3 right-3 flex h-3 w-3 z-10">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative z-10"><List size={24}/></div>
              <h4 className="font-bold text-sm text-white relative z-10">Withdrawals</h4>
              <p className="text-[10px] text-gray-400 mt-1 relative z-10">Manage user requests</p>
            </button>
          </div>
          
          <div className="h-6"></div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 bg-black border-t border-white/10 flex justify-around items-center p-3 pb-safe z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-gray-500 hover:text-white'} transition-colors`}>
          <Home size={20} className={view === 'dashboard' ? 'fill-current' : ''} />
          <span className="text-[9px] font-black uppercase tracking-widest">HOME</span>
        </button>
        <button onClick={() => setView('payment-methods')} className={`flex flex-col items-center gap-1 ${view === 'payment-methods' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-gray-500 hover:text-white'} transition-colors`}>
          <CreditCard size={20} className={view === 'payment-methods' ? 'fill-current' : ''} />
          <span className="text-[9px] font-bold uppercase tracking-widest">METHODS</span>
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-gray-500 hover:text-white'} transition-colors`}>
          <User size={20} className={view === 'profile' ? 'fill-current' : ''} />
          <span className="text-[9px] font-bold uppercase tracking-widest">PROFILE</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
           key={view}
           initial={{ opacity: 0, scale: 0.98, y: 10 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 1.02, y: -10 }}
           transition={{ duration: 0.3, ease: 'easeOut' }}
           className="h-full overflow-y-auto overflow-x-hidden relative"
        >
          {view === 'landing' && renderLanding()}
          {view === 'login' && renderLogin()}
          {view === 'register' && renderRegister()}
          {view === 'dashboard' && renderDashboard()}
          {view === 'deposit' && renderDepositSection()}
          {view === 'activation' && renderActivationSection()}
          {view === 'payment-methods' && renderPaymentMethods()}
          {view === 'add-balance' && renderAddBalance()}
          {view === 'deposit-history' && renderDepositHistory()}
          {view === 'withdrawal-management' && renderWithdrawalManagement()}
          {view === 'profile' && renderProfile()}
        </motion.div>
      </AnimatePresence>
      
      {/* Global Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white z-[9999] hover:bg-white/20 transition-colors shadow-lg">
        <X size={20} />
      </button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmObj && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-black/80 backdrop-blur-2xl border border-white/20 p-6 rounded-3xl w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              <div className="flex justify-center mb-4">
                  {confirmObj.action === 'approve_withdraw' ? (
                     <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]"><CheckCircle2 size={32} /></div>
                  ) : (
                     <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)]"><XCircle size={32} /></div>
                  )}
              </div>
              <h3 className="text-xl font-black text-center text-white uppercase tracking-wider mb-2">
                {confirmObj.action === 'approve_withdraw' ? 'Approve Request?' : 'Reject Request?'}
              </h3>
              <p className="text-center text-sm text-gray-400 font-medium mb-6 leading-relaxed">
                {confirmObj.action === 'approve_withdraw' 
                  ? `Are you sure you want to approve this request of ৳${confirmObj.req.amount}? This will transfer the amount and your 8% commission to your wallet.`
                  : `Are you sure you want to REJECT this withdrawal? The request will be marked as cancelled in history.`}
              </p>
              <div className="flex gap-3">
                  <button onClick={() => setConfirmObj(null)} className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold tracking-widest text-[10px] uppercase hover:bg-white/10 transition-colors">Go Back</button>
                  <button onClick={confirmAction} className={`flex-1 px-4 py-3 rounded-xl font-black tracking-widest text-[10px] uppercase text-white shadow-lg transition-colors ${confirmObj.action === 'approve_withdraw' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}>
                    {confirmObj.action === 'approve_withdraw' ? 'Confirm' : 'Reject'}
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
