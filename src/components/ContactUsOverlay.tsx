import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Phone, MapPin, Send, Facebook, Youtube, Share2, PhoneCall } from 'lucide-react';
import { sendTelegramNotification } from '../lib/telegramNotifier';

interface ContactUsOverlayProps {
  onClose: () => void;
  onOpenCallBook: () => void;
}

const ContactUsOverlay: React.FC<ContactUsOverlayProps> = ({ onClose, onOpenCallBook }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Helper to escape HTML for Telegram
  const escapeHTML = (text: string) => {
    return text.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m] || m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    // Format message for Telegram
    const telegramMessage = `<b>📩 New Contact Form Submission</b>\n\n` +
      `<b>Name:</b> ${escapeHTML(formData.name)}\n` +
      `<b>Email:</b> ${escapeHTML(formData.email)}\n` +
      `<b>Phone:</b> ${escapeHTML(formData.phone || 'N/A')}\n\n` +
      `<b>Message:</b>\n${escapeHTML(formData.message)}`;

    try {
      await sendTelegramNotification(telegramMessage);
      setStatus('sent');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to send contact message via Telegram:', error);
      // Even if telegram fails, we might want to show an error, but user just wants it to go to telegram.
      // I'll keep the sending state and then switch back after a bit if it fails, 
      // but usually sendTelegramNotification handles errors internally.
      setStatus('idle');
    }
  };

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
        className="relative w-full max-w-3xl h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(234,179,8,0.15)] z-[700]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-yellow-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <Mail className="text-yellow-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Contact Us</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">আমাদের সাথে যোগাযোগ করুন</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenCallBook}
              className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-black uppercase text-[10px] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
            >
              <PhoneCall size={14} />
              Call Book
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Form Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Send a Message</h3>
                <p className="text-gray-500 text-xs">আপনার যেকোনো প্রশ্ন বা সহায়তার জন্য আমাদের লিখুন।</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="আপনার নাম (Name)" 
                      className="w-full glass-input rounded-2xl py-4 px-6 text-sm focus:border-yellow-500 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="email" 
                      placeholder="ইমেইল (Email)" 
                      className="w-full glass-input rounded-2xl py-4 px-6 text-sm focus:border-yellow-500 transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="tel" 
                      placeholder="ফোন নম্বর (Phone)" 
                      className="w-full glass-input rounded-2xl py-4 px-6 text-sm focus:border-yellow-500 transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="relative group">
                    <textarea 
                      placeholder="আপনার বার্তা (Message)" 
                      rows={4}
                      className="w-full glass-input rounded-2xl py-4 px-6 text-sm focus:border-yellow-500 transition-all resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                    ></textarea>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={status !== 'idle'}
                  className={`w-full py-4.5 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                    status === 'sent' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black shadow-yellow-500/20'
                  }`}
                >
                  {status === 'idle' && <><Send size={18} /> বার্তা পাঠান (Send)</>}
                  {status === 'sending' && <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>}
                  {status === 'sent' && <>সফলভাবে পাঠানো হয়েছে!</>}
                </button>
              </form>
            </div>

            {/* Info Section */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Contact Info</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 group hover:border-yellow-500/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Address</p>
                      <p className="text-white font-bold text-sm leading-relaxed">coljabat, fodnija, jabithom</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 group hover:border-yellow-500/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email</p>
                      <p className="text-white font-bold text-sm leading-relaxed">lsbaji@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 group hover:border-yellow-500/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Phone</p>
                      <p className="text-white font-bold text-sm leading-relaxed">Coming Soon...</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Follow Us</h4>
                <div className="flex gap-3">
                  <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/20 transition-all">
                    <Facebook size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all">
                    <Youtube size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/20 transition-all">
                    <Share2 size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Our Location</h3>
            <div className="w-full h-64 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.902!2d90.4125!3d23.7500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b3c!2sDhaka!5e0!3m2!1sbn!2sbd!4v1234567890" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }} 
                allowFullScreen={true} 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/50 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">© 2025 L's Baji Elite. All Rights Reserved.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ContactUsOverlay;
