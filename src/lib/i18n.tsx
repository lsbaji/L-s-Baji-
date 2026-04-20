import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';
type Currency = 'BDT' | 'USD';

interface I18nContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'home': 'Home',
    'sports': 'Sports',
    'casino': 'Casino',
    'slots': 'Slots',
    'crash': 'Crash',
    'table': 'Table',
    'fishing': 'Fishing',
    'arcade': 'Arcade',
    'lottery': 'Lottery',
    'deposit': 'Deposit',
    'withdraw': 'Withdraw',
    'balance': 'Balance',
    'settings': 'Settings',
  },
  bn: {
    'home': 'হোম',
    'sports': 'স্পোর্টস',
    'casino': 'ক্যাসিনো',
    'slots': 'স্লটস',
    'crash': 'ক্র্যাশ',
    'table': 'টেবিল',
    'fishing': 'ফিশিং',
    'arcade': 'আর্কেড',
    'lottery': 'লটারি',
    'deposit': 'ডিপোজিট',
    'withdraw': 'উইথড্র',
    'balance': 'ব্যালেন্স',
    'settings': 'সেটিংস',
  }
};

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'en');
  const [currency, setCurrency] = useState<Currency>(() => (localStorage.getItem('curr') as Currency) || 'BDT');

  useEffect(() => {
    localStorage.setItem('lang', language);
    localStorage.setItem('curr', currency);
  }, [language, currency]);

  const t = (key: string) => translations[language][key] || key;

  const formatCurrency = (amount: number) => {
    const rate = 120; // 1 USD = 120 BDT
    const converted = currency === 'USD' ? amount / rate : amount;
    return currency === 'BDT' 
      ? `৳ ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$ ${(converted || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const contextValue = { language, currency, setLanguage, setCurrency, t, formatCurrency };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};
