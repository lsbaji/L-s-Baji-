import React from 'react';
import { useI18n } from '../lib/i18n.tsx';
import { Settings } from 'lucide-react';

export const SettingsToggle = () => {
  const { language, setLanguage, currency, setCurrency } = useI18n();

  return (
    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
      <Settings size={16} className="text-yellow-500" />
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as 'en' | 'bn')}
        className="bg-transparent text-[10px] font-black uppercase text-white outline-none"
        aria-label="Select Language"
      >
        <option value="en">EN</option>
        <option value="bn">BN</option>
      </select>
      <select 
        value={currency} 
        onChange={(e) => setCurrency(e.target.value as 'BDT' | 'USD')}
        className="bg-transparent text-[10px] font-black uppercase text-white outline-none"
        aria-label="Select Currency"
      >
        <option value="BDT">BDT</option>
        <option value="USD">USD</option>
      </select>
    </div>
  );
};
