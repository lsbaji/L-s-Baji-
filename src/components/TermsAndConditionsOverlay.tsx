import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, Gavel, AlertCircle, FileCheck, ChevronRight, Info } from 'lucide-react';

interface TermsAndConditionsOverlayProps {
  onClose: () => void;
}

const TermsAndConditionsOverlay: React.FC<TermsAndConditionsOverlayProps> = ({ onClose }) => {
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
        className="relative w-full max-w-2xl h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(234,179,8,0.15)]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-yellow-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <Gavel className="text-yellow-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Terms & Conditions</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Last updated: December 10, 2025</p>
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
          <section className="p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 space-y-3">
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertCircle size={18} />
              <h3 className="font-black uppercase italic text-sm">Acknowledgment</h3>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Please read these terms and conditions carefully before using Our Service. By accessing or using the Service You agree to be bound by these Terms and Conditions. You represent that you are over the age of 18.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              Definitions
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { term: 'Affiliate', desc: 'An entity that controls, is controlled by, or is under common control with a party.' },
                { term: 'Company', desc: 'Refers to L\'s Baji Elite (referred to as either "the Company", "We", "Us" or "Our").' },
                { term: 'Terms', desc: 'These Terms and Conditions that form the entire agreement between You and the Company.' },
                { term: 'Service', desc: 'Refers to the Website and Application platform.' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <ChevronRight size={14} className="text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase mb-1">{item.term}</h4>
                    <p className="text-gray-500 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              Limitation of Liability
            </h2>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
              <p className="text-gray-400 text-sm leading-relaxed">
                Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms shall be limited to the amount actually paid by You through the Service or 100 USD.
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <Scale size={16} className="text-red-500" />
                <p className="text-[10px] text-red-500/80 font-bold uppercase tracking-wider">Maximum liability is limited to the extent permitted by law.</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              Termination & Suspension
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              We may terminate or suspend Your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions. Upon termination, Your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              "AS IS" Disclaimer
            </h2>
            <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
              <p className="text-gray-400 text-sm leading-relaxed italic">
                "The Service is provided to You 'AS IS' and 'AS AVAILABLE' and with all faults and defects without warranty of any kind. We do not warrant that the Service will meet Your requirements or achieve any intended results."
              </p>
            </div>
          </section>

          <section className="p-8 rounded-[2rem] bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Contact Us</h2>
            <p className="text-gray-400 text-xs leading-relaxed">If you have any questions about these Terms and Conditions, You can contact us:</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Info size={18} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Email</p>
                  <p className="text-white font-bold text-sm">lsbaji@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <FileCheck size={18} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Phone</p>
                  <p className="text-white font-bold text-sm">Coming Soon...</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/50 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">© 2025 L's Baji Elite. All Rights Reserved.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TermsAndConditionsOverlay;
