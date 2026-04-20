import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, Eye, FileText, ChevronRight } from 'lucide-react';

interface PrivacyPolicyOverlayProps {
  onClose: () => void;
}

const PrivacyPolicyOverlay: React.FC<PrivacyPolicyOverlayProps> = ({ onClose }) => {
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
              <Shield className="text-yellow-500" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">Privacy Policy</h2>
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
          <section className="space-y-4">
            <p className="text-gray-400 text-sm leading-relaxed">
              This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Lock className="text-blue-500" size={16} />
              </div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Data Security</h3>
              <p className="text-gray-500 text-[11px] leading-relaxed">We use industry-standard encryption to protect your personal and financial information.</p>
            </div>
            <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <Eye className="text-green-500" size={16} />
              </div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Transparency</h3>
              <p className="text-gray-500 text-[11px] leading-relaxed">We are clear about what data we collect and why we need it to improve your experience.</p>
            </div>
          </div>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              Interpretation and Definitions
            </h2>
            <div className="space-y-4">
              <h3 className="text-yellow-500 font-bold text-xs uppercase tracking-widest">Definitions</h3>
              <ul className="space-y-4">
                {[
                  { term: 'Account', desc: 'A unique account created for You to access our Service or parts of our Service.' },
                  { term: 'Company', desc: 'Refers to L\'s Baji (referred to as either "the Company", "We", "Us" or "Our").' },
                  { term: 'Personal Data', desc: 'Any information that relates to an identified or identifiable individual.' },
                  { term: 'Service', desc: 'Refers to the Website/Application.' },
                  { term: 'Usage Data', desc: 'Data collected automatically, either generated by the use of the Service or from the Service infrastructure itself.' },
                  { term: 'You', desc: 'The individual accessing or using the Service.' }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                    <div className="mt-1">
                      <ChevronRight size={14} className="text-yellow-500" />
                    </div>
                    <div>
                      <strong className="text-white text-sm block mb-1">{item.term}</strong>
                      <p className="text-gray-500 text-[12px] leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              Collecting Your Personal Data
            </h2>
            <div className="space-y-4">
              <h3 className="text-yellow-500 font-bold text-xs uppercase tracking-widest">Types of Data Collected</h3>
              <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 space-y-4">
                <h4 className="text-white font-bold text-sm">Personal Data</h4>
                <p className="text-gray-400 text-xs leading-relaxed">While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. This includes:</p>
                <div className="flex flex-wrap gap-2">
                  {['Email address', 'First name and last name', 'Phone number', 'Usage Data'].map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              Use of Your Personal Data
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { title: 'Service Maintenance', desc: 'To provide and maintain our Service, including to monitor usage.' },
                { title: 'Account Management', desc: 'To manage Your registration as a user of the Service.' },
                { title: 'Communication', desc: 'To contact You by email, telephone calls, SMS, or push notifications.' },
                { title: 'Promotions', desc: 'To provide You with news, special offers and general information.' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase mb-1">{item.title}</h4>
                    <p className="text-gray-500 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-8 rounded-[2rem] bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 space-y-6">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Contact Us</h2>
            <p className="text-gray-400 text-xs leading-relaxed">If you have any questions about this Privacy Policy, You can contact us:</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Eye size={18} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Email</p>
                  <p className="text-white font-bold text-sm">lsbaji@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Phone size={18} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Phone</p>
                  <p className="text-white font-bold text-sm">Coming Soon...</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <FileText size={18} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Address</p>
                  <p className="text-white font-bold text-sm">coljabat, fodnija, jabithom</p>
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

// Helper for Phone icon since it's used in the component
const Phone = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default PrivacyPolicyOverlay;
