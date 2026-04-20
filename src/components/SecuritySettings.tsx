import React, { useState, useEffect } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight, Fingerprint, Lock } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth, appId } from '../lib/firebase';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ pinEnabled: false, biometricEnabled: false });

  useEffect(() => {
    const fetchSettings = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setSettings({ 
            pinEnabled: !!userDoc.data().pinEnabled,
            biometricEnabled: !!userDoc.data().biometricEnabled
          });
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const toggleSetting = async (key: 'pinEnabled' | 'biometricEnabled') => {
    if (auth.currentUser) {
      const newSettings = { ...settings, [key]: !settings[key] };
      await updateDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid), { [key]: newSettings[key] });
      setSettings(newSettings);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
      <h3 className="text-xs font-black text-yellow-500 uppercase flex items-center gap-2 mb-4">
        <ShieldCheck size={14} /> Security Settings
      </h3>
      
      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-3 bg-black/20 rounded-xl text-[11px] font-bold text-gray-300 hover:text-white border border-white/5">
          <span className="flex items-center gap-2"><Lock size={14} /> Change Password</span>
          <span>→</span>
        </button>

        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
          <span className="text-[11px] font-bold text-gray-300 flex items-center gap-2">
            <Lock size={14} /> PIN Lock
          </span>
          <button onClick={() => toggleSetting('pinEnabled')}>
            {settings.pinEnabled ? <ToggleRight className="text-yellow-500" size={24} /> : <ToggleLeft className="text-gray-500" size={24} />}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
          <span className="text-[11px] font-bold text-gray-300 flex items-center gap-2">
            <Fingerprint size={14} /> Biometric Login
          </span>
          <button onClick={() => toggleSetting('biometricEnabled')}>
            {settings.biometricEnabled ? <ToggleRight className="text-yellow-500" size={24} /> : <ToggleLeft className="text-gray-500" size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
}
