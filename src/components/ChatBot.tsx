import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, X, Trash2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth, appId } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface Message {
  role: 'user' | 'model' | 'admin';
  text: string;
  id: string;
  userId?: string;
  timestamp?: any;
}

export default function ChatBot({ onClose, isAdmin }: { onClose: () => void, isAdmin: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const quickResponses = [
    { label: 'Deposit Issue', action: 'I am having an issue with my deposit, can you help?' },
    { label: 'Withdrawal Delay', action: 'My withdrawal is delayed, could you check the status?' },
    { label: 'Game Error', action: 'I encountered an error while playing a game.' },
    { label: 'Bonus inquiry', action: 'How do I claim my welcome bonus?' }
  ];

  useEffect(() => {
    if (!auth.currentUser) return;
    const chatRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'chat_messages');
    const q = query(chatRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Message));
        setMessages(msgs);
        
        // Auto-reply logic if user sends a message and no model reply exists recently
        // This is handled in the sendMessage function directly to avoid loop
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, botTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !auth.currentUser) return;
    
    const chatRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'chat_messages');
    
    // Save user message
    await addDoc(chatRef, {
        text,
        role: 'user',
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
    });

    if (isAdmin) return; // If admin is typing, don't trigger AI

    setBotTyping(true);
    
    try {
      // Get AI response
      const history = messages.map(m => ({ role: m.role, text: m.text })).slice(-10); // last 10 messages for context
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });
      
      const data = await res.json();
      
      if (data.text) {
        // Save bot response
        await addDoc(chatRef, {
            text: data.text,
            role: 'model',
            userId: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Chat API error:', err);
    } finally {
      setBotTyping(false);
    }
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const handleSend = async () => {
    const tempInput = input;
    setInput('');
    await sendMessage(tempInput);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      <div className="p-5 flex justify-between items-center border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">Ls Connect Support</h2>
            <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Online - {isAdmin ? 'Admin Panel' : 'Live Agent'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-black/20">
        
        <div className="text-center pb-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Today</p>
        </div>

        {messages.length === 0 && !botTyping && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-4 py-10 opacity-50">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Bot size={32} className="text-gray-400" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-center">Hello! I'm your Live Support Agent.<br/>How can I assist you today?</p>
          </motion.div>
        )}

        {messages.map((m) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={m.id} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-lg ${
              m.role === 'user' 
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-black font-medium text-[13px] rounded-br-sm' 
                : m.role === 'admin'
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white font-medium text-[13px] rounded-bl-sm'
                : 'bg-white/10 backdrop-blur-md text-gray-100 border border-white/10 font-medium text-[13px] rounded-bl-sm'
            }`}>
              {m.text}
              <div className={`text-[8px] mt-1.5 font-bold tracking-widest flex items-center gap-1 ${m.role === 'user' ? 'text-black/60 justify-end' : 'text-white/40 justify-start'}`}>
                {m.timestamp ? new Date(m.timestamp?.toDate ? m.timestamp.toDate() : m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                {m.role === 'user' && <span className="text-[10px]">✓✓</span>}
              </div>
            </div>
          </motion.div>
        ))}

        {botTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
             <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
               <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></span>
             </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
        {/* Quick Replies */}
        {messages.length === 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
            {quickResponses.map((qr, i) => (
              <button 
                  key={i} 
                  onClick={() => handleQuickReply(qr.action)}
                  className="bg-white/5 border border-white/10 text-gray-300 text-[10px] font-black uppercase py-2.5 px-4 rounded-full hover:bg-yellow-500 hover:text-black transition-all whitespace-nowrap shrink-0"
              >
                  {qr.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 bg-black/40 border border-white/10 rounded-full px-5 py-3.5 text-[13px] text-white focus:outline-none focus:border-yellow-500 transition-colors"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={botTyping}
          />
          <button 
            onClick={handleSend}
            disabled={botTyping || !input.trim()}
            className="bg-yellow-500 text-black w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
