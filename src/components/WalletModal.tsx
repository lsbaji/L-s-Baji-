import React, { useState, useEffect } from 'react';
import { 
  X, ChevronDown, Copy, CheckCircle, 
  CreditCard, Smartphone, Bitcoin, Loader2,
  ArrowRight, Info, AlertCircle, Gift, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db, auth, appId } from '../lib/firebase';
import { sendTelegramNotification } from '../lib/telegramNotifier';

interface WalletModalProps {
  onClose: () => void;
  onSuccess: (amount: number, type: 'deposit' | 'withdraw', bonus?: any) => void;
  currentBalance: number;
  initialTab?: Tab;
  initialPromo?: any;
}

type Tab = 'deposit' | 'withdraw' | 'history';
type Step = 'config' | 'payment' | 'processing' | 'success';

export const PROMOTIONS = [
  { id: 'elite', label: "ELITE WELCOME: 100% up to 10,000 BDT", description: "Start your journey with double the balance. 100% bonus up to 10,000 BDT. Turnover: 15x.", bonusPercent: 1.0, maxBonus: 10000, img: "https://i.ibb.co/fzCbCwSn/Gemini-Generated-Image-jngh67jngh67jngh.png" },
  { id: 'mega', label: "MEGA BONUS: 50% Reload", description: "Get a 50% bonus on your next deposit up to 5,000 BDT. Turnover: 10x.", bonusPercent: 0.5, maxBonus: 5000, img: "https://i.ibb.co/TBTVnzwH/Gemini-Generated-Image-4i4mll4i4mll4i4m.png" },
  { id: 'sports', label: "SPORTS SPECIAL: 100% Match Bonus", description: "Double your first sports deposit up to 5,000 BDT. Turnover: 5x.", bonusPercent: 1.0, maxBonus: 5000, img: "https://i.ibb.co/sdQyBcZw/Gemini-Generated-Image-r4k4yer4k4yer4k4.png" },
  { 
    id: 'crazy_time', 
    label: "অবিশ্বাস্য ৫৫% বোনাস নিয়ে এসেছে ক্রেজি টাইম লাইভ ক্যাসিনো! 🎰✨", 
    description: "আপনার লাইভ ক্যাসিনো অভিজ্ঞতার মোড় ঘুরিয়ে দিতে প্রস্তুত! আমাদের সাথে খেলুন আপনার প্রিয় 'Crazy Time' লাইভ গেম এবং আপনার প্রথম ডিপোজিটে জিতে নিন সরাসরি ৫৫% বোনাস! 💸 আমরা আপনার প্রথম ডিপোজিটের উপর ৳ ৫,০০০ পর্যন্ত অতিরিক্ত ৫৫% বোনাস দিচ্ছি।",
    fullDetails: `হুক: আপনার কি মনে হয় আজ আপনার ভাগ্যের চাকা ঘুরবে? তাহলে এখনই প্রস্তুত হোন!

আপনার কি পাচিনকো, ক্যাশ হান্ট, বা কয়েন ফ্লিপ পছন্দ? এই অবিশ্বাস্য বোনাসটি সব ধরণের গেমের ক্ষেত্রে প্রযোজ্য। আপনার জয়ের সুযোগ বাড়ান এবং আরও বেশি রোমাঞ্চ উপভোগ করুন। এখনই আপনার ভাগ্য পরিবর্তন করুন!

🎁 ধাপে ধাপে নির্দেশিকা: বোনাসটি কীভাবে নেবেন?
১. রেজিস্ট্রেশন করুন: যদি আপনি নতুন ইউজার হন, তাহলে আমাদের ওয়েবসাইটে যান এবং একটি নতুন একাউন্ট তৈরি করুন। যদি বিদ্যমান ইউজার হন, তাহলে আপনার একাউন্টে লগইন করুন।
২. ডিপোজিট করুন: আপনার একাউন্টে যান এবং 'ডিপোজিট' অপশনটি বেছে নিন। আপনার প্রথম ডিপোজিট করুন (ন্যূনতম পরিমাণ চেক করুন)।
৩. বোনাস সক্রিয় করুন: ডিপোজিট করার সময়, 'প্রমোশন' পেজে গিয়ে বা ডিপোজিট ফর্মে '৫৫% প্রথম ডিপোজিট বোনাস' সক্রিয় করার বিকল্পটি নির্বাচন করুন। বোনাসটি সক্রিয় করতে ভুলবেন না।
৪. অভিনন্দন!: আপনার বোনাস পরিমাণ স্বয়ংক্রিয়ভাবে আপনার ডিপোজিটের সাথে যোগ করা হবে। আপনার একাউন্ট ব্যালেন্স চেক করুন।
৫. খেলা শুরু করুন: 'Crazy Time' চাকা ঘোরান এবং খেলা শুরু করুন! আপনার অতিরিক্ত ব্যালেন্স দিয়ে সব কিছুতেই বোনাস জেতার সুযোগ নিন।

🚀 ভবিষ্যতের আরও চমক (Features):
এই প্রমোশনের পরেও আমরা আপনার জন্য আরও অনেক কিছু নিয়ে আসছি:
লয়্যালটি প্রোগ্রাম: নিয়মিত খেলে পয়েন্ট অর্জন করুন এবং আরও একচেটিয়া বোনাস এবং উপহারের সুযোগ পান।
বিশেষ টুর্নামেন্ট: অন্যান্য খেলোয়াড়দের সাথে প্রতিযোগিতা করুন এবং বড় পুরস্কার জেতার সুযোগ পান।
আরও ডিপোজিট বোনাস: আমাদের নিয়মিত বোনাস অফারগুলো উপভোগ করুন।
নতুন গেমের ঘোষণা: সবসময় নতুন এবং রোমাঞ্চকর গেমের ঘোষণা।

CTA: আপনার ভাগ্যের চাকা ঘোরানোর এই সুবর্ণ সুযোগ মিস করবেন না! এখনই খেলুন! 👇
দায়িত্বশীল গেমিং অস্বীকৃতি: শর্তাবলী প্রযোজ্য। ১৮ বছরের বেশি বয়সীদের জন্য।`,
    bonusPercent: 0.55, 
    maxBonus: 5000,
    img: "https://i.ibb.co/fzCbCwSn/Gemini-Generated-Image-jngh67jngh67jngh.png" 
  }
];

const PAYMENT_METHODS = [
  { id: 'bkash', label: 'বিকাশ', icon: 'Bkash', bonus: '+3.5%' },
  { id: 'nagad', label: 'নগদ', icon: 'Nagad', bonus: '+3.5%' },
  { id: 'rocket', label: 'রকেট', icon: 'Rocket', bonus: '+3.5%' },
  { id: 'upay', label: 'UPay', icon: 'UPay', bonus: '+3.5%' },
  { id: 'usdt', label: 'USDT TRC20', icon: 'USDT', bonus: '+30%' },
  { id: 'btc', label: 'BTC', icon: 'BTC', bonus: '+30%' },
  { id: 'eth', label: 'ETH', icon: 'ETH', bonus: '+30%' },
];

const WITHDRAW_METHODS = [
  { id: 'bkash', label: 'বিকাশ', icon: 'Bkash', min: 500, max: 25000 },
  { id: 'nagad', label: 'নগদ', icon: 'Nagad', min: 500, max: 20000 },
  { id: 'rocket', label: 'রকেট', icon: 'Rocket', min: 500, max: 20000 },
  { id: 'upay', label: 'UPay', icon: 'UPay', min: 500, max: 20000 },
];

const CHANNELS = [
  { id: 'ssp', label: 'SSP (CashOut)' },
  { id: 'atp', label: 'ATP (CashOut)' },
  { id: 'ess', label: 'ESS (SendMoney)' },
  { id: 'exp', label: 'EXP (SendMoney)' },
];

const AMOUNTS = [200, 500, 1000, 5000, 10000, 15000, 20000, 25000, 50000];
const WITHDRAW_AMOUNTS = [500, 1000, 5000, 10000, 15000, 20000, 25000];

export default function WalletModal({ onClose, onSuccess, currentBalance, initialTab = 'deposit', initialPromo }: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [step, setStep] = useState<Step>('config');

  useEffect(() => {
    setActiveTab(initialTab);
    setStep('config');
    setAmount('');
  }, [initialTab]);
  const [selectedPromo, setSelectedPromo] = useState(initialPromo || PROMOTIONS[0]);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState(WITHDRAW_METHODS[0]);
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]);
  const [history] = useState([
     { id: 1, type: 'deposit', amount: 1000, status: 'completed', timestamp: '2026-04-16 10:00' },
     { id: 2, type: 'withdraw', amount: 500, status: 'completed', timestamp: '2026-04-15 15:30' },
     { id: 3, type: 'deposit', amount: 2000, status: 'pending', timestamp: '2026-04-16 20:00' }
  ]);
  const [amount, setAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPromoList, setShowPromoList] = useState(false);
  const [activeAgents, setActiveAgents] = useState<any[]>([]);
  const [assignedAgentNumber, setAssignedAgentNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const q = query(collection(db, 'artifacts', appId, 'users'), where('isEWalletAgent', '==', true));
        const snap = await getDocs(q);
        const agents: any[] = [];
        snap.forEach(doc => {
          const d = doc.data();
          if (d.paymentMethods && Array.isArray(d.paymentMethods)) {
            d.paymentMethods.forEach((m: any) => {
              if (m.active) agents.push({ ...m, agentUID: doc.id });
            });
          }
        });
        setActiveAgents(agents);
      } catch (err) {
        console.error("Failed to load active agents.", err);
      }
    };
    fetchAgents();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getBonusAmount = (amount: string, promo: typeof PROMOTIONS[0]) => {
    const val = parseInt(amount) || 0;
    const bonus = val * promo.bonusPercent;
    return Math.min(bonus, promo.maxBonus);
  };

  const handleConfigSubmit = () => {
    if (!amount || parseInt(amount) < 200) {
      alert("Minimum deposit is 200 BDT");
      return;
    }
    
    // Find active agents for the selected method
    const matchingAgents = activeAgents.filter(a => a.name.toLowerCase() === selectedMethod.id.toLowerCase());
    
    if (matchingAgents.length > 0) {
      const randomAgent = matchingAgents[Math.floor(Math.random() * matchingAgents.length)];
      setAssignedAgentNumber(randomAgent.number);
    } else {
      setAssignedAgentNumber(null);
    }
    
    setStep('payment');
  };

  const handleWithdrawSubmit = async () => {
    const val = parseInt(amount);
    const limit = selectedWithdrawMethod;
    
    if (!amount || val < limit.min || val > limit.max) {
      alert(`Withdrawal limit for ${limit.label} is ৳${limit.min} - ৳${limit.max}`);
      return;
    }
    if (val > currentBalance) {
      alert("Insufficient balance!");
      return;
    }
    if (!phoneNumber) {
      alert("Please enter phone number");
      return;
    }
    setLoading(true);
    setStep('processing');
    try {
      if (!auth.currentUser) throw new Error("Not logged in");
      await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions'), {
        uid: auth.currentUser?.uid,
        type: 'withdraw',
        amount: val,
        method: selectedWithdrawMethod.id,
        status: 'pending',
        phoneNumber: phoneNumber,
        timestamp: serverTimestamp()
      });
      // Telegram Notification for Withdraw
      sendTelegramNotification(`<b>New Withdraw Request:</b>\nUser: ${auth.currentUser?.email}\nAmount: ৳${val}\nMethod: ${selectedWithdrawMethod.label}\nPhone: +880${phoneNumber}`);
      setStep('success');
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
      setStep('config');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!txId) {
      alert("Please enter Transaction ID");
      return;
    }
    setLoading(true);
    setStep('processing');
    try {
      if (!auth.currentUser) throw new Error("Not logged in");
      await addDoc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions'), {
        uid: auth.currentUser?.uid,
        type: 'deposit',
        amount: parseInt(amount),
        method: selectedMethod.id,
        status: 'pending',
        txId: txId,
        timestamp: serverTimestamp()
      });
      // Telegram Notification for Deposit
      sendTelegramNotification(`<b>New Deposit Request:</b>\nUser: ${auth.currentUser?.email}\nAmount: ৳${amount}\nMethod: ${selectedMethod.label}`);                
      setStep('success');
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
      setStep('config');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalClose = () => {
    onSuccess(parseInt(amount), activeTab, activeTab === 'deposit' ? selectedPromo : null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-xl flex flex-col overflow-y-auto">
      <div className="max-w-md mx-auto w-full min-h-screen flex flex-col p-4">
        
        {/* Header Tabs */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-white/5 rounded-2xl p-1 w-full mr-4">
            <button 
              onClick={() => { setActiveTab('deposit'); setStep('config'); setAmount(''); }}
              className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'deposit' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}
            >
              ডিপোজিট
            </button>
            <button 
              onClick={() => { setActiveTab('withdraw'); setStep('config'); setAmount(''); }}
              className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'withdraw' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}
            >
              উইথড্র
            </button>
            <button 
              onClick={() => { setActiveTab('history'); }}
              className={`flex-1 py-3 rounded-xl font-black uppercase text-xs transition-all ${activeTab === 'history' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}
            >
              হিস্ট্রি
            </button>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
            <X size={24} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pb-10"
            >
              {history.map(item => (
                <div key={item.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-black text-white uppercase">{item.type === 'deposit' ? 'ডিপোজিট' : 'উইথড্র'}</p>
                        <p className="text-[10px] text-gray-400">{item.timestamp}</p>
                    </div>
                    <div className="text-right">
                        <p className={`text-lg font-black ${item.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                            {item.type === 'deposit' ? '+' : '-'}৳ {item.amount}
                        </p>
                        <p className={`text-[10px] font-black uppercase ${item.status === 'completed' ? 'text-green-700' : 'text-yellow-500'}`}>
                            {item.status}
                        </p>
                    </div>
                </div>
              ))}
            </motion.div>
          ) : activeTab === 'deposit' ? (
            step === 'config' ? (
              <motion.div 
                key="dep-config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-10"
              >
                {/* Promotion Select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Gift size={12} className="text-yellow-500" /> প্রমোশন
                  </label>
                  <div className="relative">
                    <button 
                      onClick={() => setShowPromoList(!showPromoList)}
                      className="w-full glass-input rounded-2xl py-4 px-6 text-sm flex justify-between items-center text-left"
                    >
                      <div className="flex flex-col">
                        <span className="truncate font-bold">{selectedPromo.label}</span>
                        <span className="text-[10px] text-gray-500">{selectedPromo.description}</span>
                      </div>
                      <ChevronDown size={20} className={`text-yellow-500 transition-transform ${showPromoList ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showPromoList && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                        >
                          {PROMOTIONS.map(p => (
                            <button 
                              key={p.id}
                              onClick={() => { setSelectedPromo(p); setShowPromoList(false); }}
                              className={`w-full px-6 py-4 text-left border-b border-white/5 last:border-0 hover:bg-yellow-500/10 transition-colors ${selectedPromo.id === p.id ? 'text-yellow-500' : 'text-gray-400'}`}
                            >
                              <div className="font-black text-sm mb-1">{p.label}</div>
                              <div className="text-[11px] text-gray-300 leading-relaxed bg-white/5 p-2 rounded-lg border border-white/5">
                                {p.description}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone size={12} className="text-yellow-500" /> পেমেন্ট পদ্ধতি
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setSelectedMethod(m)}
                        className={`relative p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedMethod.id === m.id ? 'bg-yellow-500/10 border-yellow-500' : 'bg-white/5 border-white/5'}`}
                      >
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-black text-white">
                          {m.label.charAt(0)}
                        </div>
                        <span className="text-[10px] font-black text-white uppercase">{m.label}</span>
                        <div className="absolute -top-2 -right-2 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white">
                          {m.bonus}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channels */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={12} className="text-yellow-500" /> ডিপোজিট চ্যানেল
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {CHANNELS.map(c => (
                      <button 
                        key={c.id}
                        onClick={() => setSelectedChannel(c)}
                        className={`py-4 rounded-2xl border text-[10px] font-black uppercase transition-all ${selectedChannel.id === c.id ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 border-white/5 text-gray-400'}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ডিপোজিট পরিমাণ</label>
                    <span className="text-[10px] font-black text-yellow-500">৳ ২০০.০০ - ৳ ৫০,০০০.০০</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {AMOUNTS.map(a => (
                      <button 
                        key={a}
                        onClick={() => setAmount(a.toString())}
                        className={`py-3 rounded-xl border text-xs font-black transition-all ${amount === a.toString() ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 border-white/5 text-gray-400'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-500 font-black">৳</div>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full glass-input rounded-2xl py-5 pl-12 pr-6 text-xl font-black"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  {/* Bonus Display */}
                  {amount && parseInt(amount) >= 200 && (
                    <div className="glass-panel p-4 border-yellow-500/20 bg-yellow-500/5 flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase">বোনাস পরিমাণ:</span>
                      <span className="text-sm font-black text-yellow-500">৳ {getBonusAmount(amount, selectedPromo).toLocaleString()}.০০</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleConfigSubmit}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'সাবমিট'}
                </button>
              </motion.div>
            ) : step === 'payment' ? (
              <motion.div 
                key="dep-payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-10"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-full border-2 border-yellow-500 flex items-center justify-center mx-auto text-yellow-500 mb-4">
                    <Smartphone size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-white italic uppercase">পেমেন্ট ডিটেইলস</h2>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">নিচের নম্বরে ক্যাশ আউট করুন</p>
                </div>

                <div className="glass-panel p-8 space-y-8">
                  <div className="flex justify-between items-center pb-6 border-b border-white/5">
                    <span className="text-xs font-black text-gray-400 uppercase">পরিমাণ:</span>
                    <span className="text-2xl font-black text-yellow-500">৳ {amount}.০০</span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-white/5">
                    <span className="text-xs font-black text-gray-400 uppercase">বোনাস:</span>
                    <span className="text-2xl font-black text-yellow-500">৳ {getBonusAmount(amount, selectedPromo).toLocaleString()}.০০</span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-white/5">
                    <span className="text-xs font-black text-gray-400 uppercase">মোট:</span>
                    <span className="text-2xl font-black text-white">৳ {(parseInt(amount) + getBonusAmount(amount, selectedPromo)).toLocaleString()}.০০</span>
                  </div>

                  {assignedAgentNumber ? (
                    <>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ক্যাশ আউট এজেন্ট নম্বর:</label>
                        <div className="flex gap-3">
                          <div className="flex-1 glass-input rounded-2xl py-4 px-6 text-xl font-black tracking-widest text-white">
                            {assignedAgentNumber}
                          </div>
                          <button 
                            onClick={() => { handleCopy(assignedAgentNumber); alert('Number Copied!'); }}
                            className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-black active:scale-90 transition-all"
                          >
                            <Copy size={24} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ট্রানজেকশন আইডি:</label>
                        <input 
                          type="text" 
                          placeholder="Transaction ID লিখুন" 
                          className="w-full glass-input rounded-2xl py-5 px-6 text-lg font-black tracking-widest uppercase"
                          value={txId}
                          onChange={(e) => setTxId(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col items-center gap-3 text-center">
                      <AlertCircle className="text-rose-400" size={32} />
                      <p className="text-sm font-bold text-rose-200">বর্তমানে এই পেমেন্ট পদ্ধতির কোনো এজেন্ট সক্রিয় নেই।</p>
                      <p className="text-xs text-gray-400">দয়া করে অন্য পদ্ধতি বেছে নিন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
                      <button onClick={() => setStep('config')} className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase rounded-lg border border-white/10 transition-colors">ফিরে যান</button>
                    </div>
                  )}
                </div>

                {assignedAgentNumber && (
                  <button 
                    onClick={handlePaymentSubmit}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'জমা দিন'}
                  </button>
                )}
              </motion.div>
            ) : step === 'processing' ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-yellow-500/20 rounded-full animate-spin border-t-yellow-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={48} className="text-yellow-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Processing...</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">আপনার অনুরোধ প্রসেস করা হচ্ছে</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                  <CheckCircle size={64} />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">SUCCESSFUL!</h2>
                  <p className="text-sm text-green-500 font-black uppercase tracking-widest">আপনার লেনদেন সফল হয়েছে</p>
                </div>
                <button 
                  onClick={handleFinalClose}
                  className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all"
                >
                  ঠিক আছে
                </button>
              </motion.div>
            )
          ) : (
            /* Withdraw Tab */
            step === 'config' ? (
              <motion.div 
                key="with-config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 pb-10"
              >
                <div className="glass-panel p-6 border-yellow-500/20 bg-yellow-500/5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">উইথড্রয়াল একাউন্ট</p>
                    <h3 className="text-xl font-black text-white italic leading-none">৳ {currentBalance.toLocaleString()}</h3>
                  </div>
                  <Wallet size={24} className="text-yellow-500" />
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Smartphone size={12} className="text-yellow-500" /> পেমেন্ট পদ্ধতি
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {WITHDRAW_METHODS.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => setSelectedWithdrawMethod(m)}
                        className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedWithdrawMethod.id === m.id ? 'bg-yellow-500/10 border-yellow-500' : 'bg-white/5 border-white/5'}`}
                      >
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                          {m.label.charAt(0)}
                        </div>
                        <span className="text-[8px] font-black text-white uppercase">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">উইথড্র পরিমাণ</label>
                    <span className="text-[10px] font-black text-yellow-500">৳ {selectedWithdrawMethod.min} - ৳ {selectedWithdrawMethod.max}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {WITHDRAW_AMOUNTS.map(a => (
                      <button 
                        key={a}
                        onClick={() => setAmount(a.toString())}
                        className={`py-3 rounded-xl border text-[10px] font-black transition-all ${amount === a.toString() ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 border-white/5 text-gray-400'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-500 font-black">৳</div>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full glass-input rounded-2xl py-5 pl-12 pr-6 text-xl font-black"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ফোন নম্বর নির্বাচন করুন</label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">+880</div>
                    <input 
                      type="tel" 
                      placeholder="1XXXXXXXXX" 
                      className="w-full glass-input rounded-2xl py-5 pl-20 pr-6 text-lg font-black tracking-widest"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleWithdrawSubmit}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'সাবমিট'}
                </button>
              </motion.div>
            ) : step === 'processing' ? (
              <motion.div 
                key="with-processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-yellow-500/20 rounded-full animate-spin border-t-yellow-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={48} className="text-yellow-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Processing...</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">আপনার উইথড্র অনুরোধ প্রসেস করা হচ্ছে</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="with-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                  <CheckCircle size={64} />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">SUCCESSFUL!</h2>
                  <p className="text-sm text-green-500 font-black uppercase tracking-widest">আপনার উইথড্র অনুরোধ সফল হয়েছে</p>
                </div>
                <button 
                  onClick={handleFinalClose}
                  className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all"
                >
                  ঠিক আছে
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
