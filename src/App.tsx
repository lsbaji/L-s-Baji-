/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PinLock from './components/PinLock';
import SecuritySettings from './components/SecuritySettings';
import { 
  Flame, Trophy, LayoutGrid, Gamepad2, Anchor, 
  Menu, Wallet, RefreshCw, Gift, Share2, 
  Calendar, History, TrendingUp, ClipboardList, 
  UserCircle, Lock, Bell, Headphones, Phone, 
  MessageSquare, Mail, X, CheckCircle2, Bot, Image as ImageIcon,
  LogOut, ShieldCheck, Shield, CheckCircle, Send, ArrowUpCircle, Loader2, Zap,
  Activity, Tv, Target, Play, Globe, Sun, Moon, Info, Gavel, Heart, Download, BookOpen, ChevronDown, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, appId } from './lib/firebase';
import { useI18n } from './lib/i18n.tsx';
import { SettingsToggle } from './components/SettingsToggle.tsx';
import { 
  onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut, updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot as firestoreOnSnapshot, collection, query, where, getDocs, limit, increment, orderBy, addDoc } from 'firebase/firestore';
import ChatBot from './components/ChatBot';
import ContactUsOverlay from './components/ContactUsOverlay';
import ImageGenerator from './components/ImageGenerator';
import PrivacyPolicyOverlay from './components/PrivacyPolicyOverlay';
import TermsAndConditionsOverlay from './components/TermsAndConditionsOverlay';
import WalletModal, { PROMOTIONS } from './components/WalletModal';
import SpinWheelOverlay from './components/SpinWheelOverlay';
import ReferralOverlay from './components/ReferralOverlay';
import AviatorGame from './components/AviatorGame';
import CricketCrash from './components/CricketCrash';
import SuperAce from './components/SuperAce';
import CrazyTime from './components/CrazyTime';
import ChineseNewYear from './components/ChineseNewYear';
import { TradingPlatform } from './components/TradingPlatform';
import PromotionBanner from './components/PromotionBanner';
import AffiliatesOverlay from './components/AffiliatesOverlay';
import DownloadAppOverlay from './components/DownloadAppOverlay';
import AdminOverlay from './components/AdminOverlay';
import EWalletAgentOverlay from './components/EWalletAgentOverlay';
import CasinoGameOverlay from './components/CasinoGameOverlay';
import { TaskManagementOverlay } from './components/TaskManagementOverlay';
import { MatchMarketsOverlay } from './components/MatchMarketsOverlay';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { soundManager } from './lib/soundManager';
import { sendTelegramNotification } from './lib/telegramNotifier';

// --- Sound Effects Utility ---
const playSound = (type: any) => {
  soundManager.play(type);
};

// --- Data & Constants ---
const GAMES_DATABASE: Record<string, any[]> = {
  home: [
    { id: '874c49d5d915de9b82f66088f9794789', title: 'Evolution Live', provider: 'Evolution', tag: 'RapidAPI', img: '🎰', color: 'from-amber-400 to-amber-700' },
    { id: 'sa1', title: 'Super Ace', provider: 'JILI', tag: '2000x', img: '🃏', color: 'from-orange-500 to-red-600' },
    { id: 'av1', title: 'Aviator', provider: 'Spribe', tag: 'HOT', img: '✈️', color: 'from-red-600 to-rose-900' },
    { id: 'cny1', title: 'Chinese New Year', provider: 'FA CHAI', tag: 'HOT', img: 'https://images.unsplash.com/photo-1547823065-4cbbb2d4d185?q=80&w=400&auto=format&fit=crop', color: 'from-red-600 to-yellow-600' },
    { id: 'fg3', title: 'Fortune Gems 3', provider: 'JILI', tag: 'NEW', img: '💎', color: 'from-yellow-400 to-orange-600' },
    { id: 'ct1', title: 'Crazy Time', provider: 'Evolution', tag: 'LIVE', img: '🎡', color: 'from-pink-500 to-purple-600' },
    { id: 'go1', title: 'Gates of Olympus', provider: 'Pragmatic', tag: '1000x', img: '⚡', color: 'from-blue-500 to-indigo-600' },
  ],
  sports: [
    { id: 'sp1', title: 'Cricket', provider: "L's Baji", tag: 'LIVE', img: 'https://cdn-icons-png.flaticon.com/128/1048/1048325.png', color: 'from-green-600 to-emerald-700' },
    { id: 'sp2', title: 'Football', provider: 'Saba', tag: 'HOT', img: 'https://cdn-icons-png.flaticon.com/128/2065/2065157.png', color: 'from-blue-600 to-cyan-700' },
    { id: 'sp3', title: 'Tennis', provider: 'Betfair', tag: 'HOT', img: 'https://cdn-icons-png.flaticon.com/128/2756/2756317.png', color: 'from-yellow-600 to-green-700' },
    { id: 'sp4', title: 'Basketball', provider: 'Saba', tag: 'NEW', img: 'https://cdn-icons-png.flaticon.com/128/2525/2525803.png', color: 'from-orange-600 to-orange-700' },
  ],
  casino: [
    { id: '874c49d5d915de9b82f66088f9794789', title: 'Evolution Live', provider: 'Evolution', tag: 'RapidAPI', img: '🎰', color: 'from-amber-400 to-amber-700' },
    { id: 'cs1', title: 'Bac Bo', provider: 'Evolution', tag: 'LIVE', img: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=400&auto=format&fit=crop', color: 'from-green-600 to-emerald-900' },
    { id: 'cs2', title: 'Super Sic Bo', provider: 'Evolution', tag: 'HOT', img: 'https://images.unsplash.com/photo-1595624871930-6e8537998592?q=80&w=400&auto=format&fit=crop', color: 'from-red-600 to-rose-900' },
    { id: 'cs3', title: 'Crazy Time', provider: 'Evolution', tag: 'LIVE', img: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop', color: 'from-pink-500 to-purple-600' },
    { id: 'cs4', title: 'Fan Tan', provider: 'Evolution', tag: 'LIVE', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400&auto=format&fit=crop', color: 'from-red-700 to-red-900' },
    { id: 'cs5', title: 'Funky Time', provider: 'Evolution', tag: 'HOT', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop', color: 'from-yellow-500 to-orange-600' },
    { id: 'cs6', title: 'Auto Roulette', provider: 'Evolution', tag: 'LIVE', img: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=400&auto=format&fit=crop', color: 'from-blue-600 to-indigo-900' },
    { id: 'cs7', title: 'Lightning Roulette', provider: 'Evolution', tag: 'HOT', img: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=400&auto=format&fit=crop', color: 'from-yellow-600 to-red-900' },
    { id: 'cs8', title: 'Crazy Time A', provider: 'Evolution', tag: 'LIVE', img: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop', color: 'from-pink-600 to-purple-700' },
  ],
  slots: [
    { id: 'cny1', title: 'Chinese New Year', provider: 'FA CHAI', tag: 'HOT', img: 'https://images.unsplash.com/photo-1547823065-4cbbb2d4d185?q=80&w=400&auto=format&fit=crop', color: 'from-red-600 to-yellow-600' },
    { id: 'sa1', title: 'Super Ace', provider: 'JILI', tag: '2000x', img: '🃏', color: 'from-orange-500 to-red-600' },
    { id: 'fg3', title: 'Fortune Gems 3', provider: 'JILI', tag: 'NEW', img: '💎', color: 'from-yellow-400 to-orange-600' },
    { id: 'mw1', title: 'Mahjong Ways', provider: 'PG Soft', tag: 'HOT', img: '🀄', color: 'from-green-500 to-emerald-700' },
    { id: 'pw1', title: 'Pinata Wins', provider: 'PG Soft', tag: 'NEW', img: '🪅', color: 'from-purple-500 to-pink-600' },
    { id: 'wb1', title: 'Wild Bandito', provider: 'PG Soft', tag: 'HOT', img: '🤠', color: 'from-yellow-600 to-red-700' },
    { id: 'ps1', title: 'Power Sun', provider: 'BNG', tag: 'HOT', img: '☀️', color: 'from-yellow-400 to-orange-500' },
    { id: 'fb1', title: 'Fruity Bonanza', provider: 'JDB', tag: 'JACKPOT', img: '🍓', color: 'from-pink-400 to-rose-600' },
    { id: 'ph1', title: 'Phonics Fun', provider: 'Education', tag: 'NEW', img: '📚', color: 'from-blue-500 to-indigo-600' },
  ],
  crash: [
    { id: 'av1', title: 'Aviator', provider: 'Spribe', tag: 'HOT', img: '✈️', color: 'from-red-600 to-rose-900' },
    { id: 'fx1', title: 'FlyX', provider: 'Microgaming', tag: 'NEW', img: '🚀', color: 'from-blue-500 to-indigo-700' },
    { id: 'cc1', title: 'Cricket Crash', provider: 'JILI', tag: 'LIVE', img: '🏏', color: 'from-green-600 to-emerald-700' },
    { id: 'cr1', title: 'Mines', provider: 'JILI', tag: 'PRO', img: '💣', color: 'from-gray-600 to-slate-800' },
  ],
  table: [
    { id: 'tb1', title: 'Sic Bo', provider: 'JILI', tag: 'HOT', img: '🎲', color: 'from-red-500 to-red-800' },
    { id: 'tb2', title: 'Baccarat', provider: 'Evolution', tag: 'LIVE', img: '🃏', color: 'from-blue-500 to-indigo-800' },
  ],
  fishing: [
    { id: 'fi1', title: 'Mega Fishing', provider: 'JILI', tag: 'HOT', img: '🦈', color: 'from-cyan-500 to-blue-900' },
    { id: 'fi2', title: 'Jackpot Fishing', provider: 'Spade', tag: 'NEW', img: '🎣', color: 'from-green-500 to-cyan-700' },
    { id: 'fi3', title: 'Ocean King', provider: 'JILI', tag: 'HOT', img: '👑', color: 'from-blue-400 to-blue-600' },
    { id: 'fi4', title: 'Bombing Fishing', provider: 'JILI', tag: 'HOT', img: '💣', color: 'from-red-500 to-orange-600' },
    { id: 'fi5', title: 'Lucky Fisherman', provider: 'JILI', tag: 'HOT', img: '🎣', color: 'from-cyan-500 to-blue-900' },
  ],
  arcade: [
    { id: 'ar1', title: 'Crazy Time', provider: 'Evolution', tag: 'LIVE', img: '🎡', color: 'from-pink-500 to-purple-800' },
    { id: 'ar2', title: 'Dragon Tiger', provider: 'JILI', tag: 'HOT', img: '🐉', color: 'from-red-600 to-yellow-600' },
    { id: 'ar3', title: 'Coin Spinner', provider: 'FA CHAI', tag: 'NEW', img: '🪙', color: 'from-yellow-400 to-orange-500' },
  ],
  lottery: [
    { id: 'lt1', title: 'Number Game', provider: 'JILI', tag: 'HOT', img: '🔢', color: 'from-blue-500 to-indigo-700' },
    { id: 'lt2', title: 'Keno', provider: 'Pragmatic', tag: 'HOT', img: '🎱', color: 'from-purple-500 to-indigo-600' },
    { id: 'lt3', title: '5D Lotto', provider: 'Saba', tag: 'NEW', img: '🎲', color: 'from-green-500 to-emerald-700' },
  ]
};

const CATEGORIES = [
  { id: 'home', label: 'Hot', icon: Flame },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'casino', label: 'Casino', icon: LayoutGrid },
  { id: 'slots', label: 'Slots', icon: Gamepad2 },
  { id: 'crash', label: 'Crash', icon: Zap },
  { id: 'table', label: 'Table', icon: ClipboardList },
  { id: 'fishing', label: 'Fishing', icon: Anchor },
  { id: 'arcade', label: 'Arcade', icon: Bot },
  { id: 'lottery', label: 'Lottery', icon: Calendar },
  { id: 'favorites', label: 'Favorites', icon: Heart },
];

const GameCard: React.FC<{ game: any, onClick: () => void, isFavorite: boolean, onToggleFavorite: (e: React.MouseEvent) => void }> = ({ game, onClick, isFavorite, onToggleFavorite }) => (
  <motion.div 
    onClick={onClick} 
    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(234,179,8,0.3)" }}
    className="relative aspect-[3/4] rounded-2xl overflow-hidden elite-glass active:scale-95 transition-all shadow-xl group cursor-pointer border-white/10 hover:border-yellow-500/50"
  >
    <button onClick={onToggleFavorite} className="absolute top-2.5 left-2.5 z-20 transition-transform hover:scale-110 p-1" aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
      <Heart size={16} className={isFavorite ? "text-yellow-500 fill-yellow-500" : "text-white/50"} />
    </button>
    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90`}></div>
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2.5 text-center relative z-10">
      {game.img.startsWith('http') ? (
        <img src={game.img} alt={game.title} className="w-12 h-12 object-contain mb-2.5 drop-shadow-xl group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
      ) : (
        <span className="text-4xl mb-2.5 drop-shadow-xl group-hover:scale-110 transition-transform">{game.img}</span>
      )}
      <p className="text-[10px] font-black text-white uppercase leading-tight px-1 drop-shadow">{game.title}</p>
      <p className="text-[7px] font-bold text-white/60 uppercase mt-1 tracking-wider">{game.provider}</p>
    </div>
    <div className="absolute top-2.5 right-2.5 bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase relative z-20 tracking-wider">{game.tag}</div>
  </motion.div>
);

const formatDateTime = (isoString?: string) => {
  if (!isoString) return 'Loading...';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// --- Components ---

const APP_LOGO = "https://i.ibb.co/JjnF0Y5p/Gemini-Generated-Image-637gcy637gcy637g.png";
const APP_LINK = "https://l-s-baji.vercel.app/";

const StylishLogo = ({ size = "text-2xl" }: { size?: string }) => (
  <div className="flex flex-col items-center group cursor-pointer">
    <div className="relative">
      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-0.5 shadow-[0_0_20px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform duration-500">
        <div className="w-full h-full bg-[#0d1110] rounded-[14px] flex items-center justify-center overflow-hidden">
          <img 
            src={APP_LOGO} 
            alt="L's Baji Logo" 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = 'https://i.ibb.co/rRrV2068/logo.png';
            }}
          />
        </div>
      </div>
      <div className="absolute -inset-2 bg-yellow-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </div>
    <h1 className="text-sm font-black italic tracking-[0.3em] uppercase leading-none mt-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:text-white transition-colors duration-500 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
      L's Baji
    </h1>
  </div>
);

const OddsButton = ({ label, val, onClick, isLive }: { label: string, val: number, onClick: () => void, isLive: boolean }) => {
  const [flashDir, setFlashDir] = useState<string | null>(null);
  const prevValRef = useRef(val);

  useEffect(() => {
    if (val !== prevValRef.current && val > 0) {
      if (val > prevValRef.current) setFlashDir('up');
      else if (val < prevValRef.current) setFlashDir('down');
      prevValRef.current = val;
      const timer = setTimeout(() => setFlashDir(null), 800);
      return () => clearTimeout(timer);
    }
  }, [val]);

  let flashClass = 'bg-white/5 border-white/5 hover:bg-yellow-500/20 hover:border-yellow-500/50';
  let textClass = isLive ? 'text-yellow-400' : 'text-white';

  if (flashDir === 'up') {
    flashClass = 'bg-green-500/20 border-green-500 scale-105';
    textClass = 'text-green-400';
  } else if (flashDir === 'down') {
    flashClass = 'bg-red-500/20 border-red-500 scale-95';
    textClass = 'text-red-400';
  }

  return (
    <button
      disabled={!val || val <= 0}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`relative w-full overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 border shadow-lg group ripple-effect
        ${(!val || val <= 0) ? 'bg-black/20 border-white/5 opacity-30 cursor-not-allowed' : flashClass}`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 relative z-10">{label}</span>
      <span className={`text-lg font-black tracking-tight transition-colors relative z-10 ${textClass}`}>
        {val > 0 ? val.toFixed(2) : <Lock size={14} className="text-gray-500" />}
      </span>
    </button>
  );
};

const SportsMarket = ({ matches, loading, onBet, onStream, onRefresh, onDetails }: { matches: any[], loading: boolean, onBet: (m: any, s: string, o: number) => void, onStream: (m: any) => void, onRefresh: () => void, onDetails: (m: any) => void }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center px-1">
      <h2 className="text-sm font-black uppercase italic flex items-center gap-2 text-white">
        <Activity size={18} className="text-red-500 animate-pulse" /> 
        Live Sports Market
      </h2>
      <button 
        onClick={() => { playSound('click'); onRefresh(); }}
        className="text-[10px] font-black text-gray-500 flex items-center gap-1.5 hover:text-yellow-500 transition-colors uppercase tracking-widest"
      >
        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
      </button>
    </div>

    {loading ? (
      <div className="grid gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 animate-pulse shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between mb-6">
              <div className="h-4 w-32 bg-white/10 rounded-full"></div>
              <div className="h-4 w-20 bg-white/10 rounded-full"></div>
            </div>
            <div className="flex justify-between items-center mb-8 px-4">
              <div className="h-6 w-24 bg-white/10 rounded-full"></div>
              <div className="h-10 w-16 bg-white/10 rounded-full"></div>
              <div className="h-6 w-24 bg-white/10 rounded-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 rounded-2xl bg-white/10"></div>
              <div className="h-16 rounded-2xl bg-white/10"></div>
              <div className="h-16 rounded-2xl bg-white/10"></div>
            </div>
          </div>
        ))}
      </div>
    ) : matches.length === 0 ? (
      <div className="h-80 glass-panel flex flex-col items-center justify-center border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-yellow-500/5 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
            <Trophy className="text-gray-700 opacity-20" size={48} />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">No Matches Found</h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] text-center max-w-[200px]">
            There are currently no active matches in this category.
          </p>
          <button 
            onClick={onRefresh}
            className="mt-8 px-6 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
          >
            Check Again
          </button>
        </div>
      </div>
    ) : (
      <div className="grid gap-6">
        {matches.map((match, i) => (
          <div key={`match-${match.id}-${i}`} className="bg-black/60 backdrop-blur-2xl p-5 border border-white/10 hover:border-yellow-500/30 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 blur-[80px] rounded-full cursor-pointer pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onDetails(match)}>
                <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-lg text-gray-300 font-bold uppercase border border-white/10 tracking-widest flex items-center gap-1.5">
                  <Trophy size={10} className="text-yellow-500" /> {match.sport} • {match.league}
                </span>
                {match.status === 'Live' ? (
                  <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    <Activity size={12} className="text-rose-500" />
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">LIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Calendar size={12} className="text-blue-500" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Upcoming</span>
                  </div>
                )}
              </div>
              <button onClick={() => onStream(match)} className="text-[9px] font-black text-gray-500 hover:text-yellow-500 flex items-center gap-1.5 transition-colors uppercase tracking-widest">
                <Tv size={12} /> Watch Live
              </button>
            </div>

            <div className="flex justify-between items-center mb-6 px-2 text-center cursor-pointer relative z-10" onClick={() => onDetails(match)}>
              <div className="w-[35%]">
                <h4 className="font-extrabold text-sm sm:text-lg text-white leading-tight capitalize truncate group-hover:text-yellow-500 transition-colors">{match.homeTeam}</h4>
              </div>
              <div className="flex flex-col items-center justify-center flex-1 px-2">
                <div className="text-2xl sm:text-3xl font-black text-yellow-500 tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                  {match.score || 'VS'}
                </div>
                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center justify-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 w-max mx-auto">
                  <Clock size={10} /> {match.time}
                </span>
              </div>
              <div className="w-[35%]">
                <h4 className="font-extrabold text-sm sm:text-lg text-white leading-tight capitalize truncate group-hover:text-yellow-500 transition-colors">{match.awayTeam}</h4>
              </div>
            </div>

            {/* Odds Grid */}
            <div className="grid grid-cols-3 gap-2 relative z-10 mb-4">
              <OddsButton label="Home" val={match.odds?.home} isLive={match.status === 'Live'} onClick={() => onBet(match, match.homeTeam, match.odds.home)} />
              {match.odds?.draw !== undefined && match.odds?.draw !== 0 ? (
                <OddsButton label="Draw" val={match.odds?.draw} isLive={match.status === 'Live'} onClick={() => onBet(match, 'Draw', match.odds.draw)} />
              ) : (
                <div className="w-full flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-600">N/A</div>
              )}
              <OddsButton label="Away" val={match.odds?.away} isLive={match.status === 'Live'} onClick={() => onBet(match, match.awayTeam, match.odds.away)} />
            </div>

            {(match.odds?.spreads?.home || match.odds?.totals?.over) && (
              <div className="mt-3 grid grid-cols-2 gap-3 pb-1 relative z-10">
                {match.odds?.spreads?.home && match.odds?.spreads?.away ? (
                  <div className="flex flex-col gap-1.5 border border-white/10 p-3 rounded-2xl bg-white/5 shadow-inner">
                    <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest text-center mb-1">Handicap</span>
                    <div className="flex justify-between items-center text-[10px] text-white">
                      <span className="truncate max-w-[60%] font-bold text-gray-300">{match.homeTeam.substring(0,3).toUpperCase()} {match.odds.spreads.home.point > 0 ? '+' : ''}{match.odds.spreads.home.point}</span>
                      <button onClick={(e) => { e.stopPropagation(); onBet(match, `Handicap ${match.homeTeam}`, match.odds.spreads.home.price); }} className="text-yellow-500 font-black px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-colors">{match.odds.spreads.home.price?.toFixed(2)}</button>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-white">
                      <span className="truncate max-w-[60%] font-bold text-gray-300">{match.awayTeam.substring(0,3).toUpperCase()} {match.odds.spreads.away.point > 0 ? '+' : ''}{match.odds.spreads.away.point}</span>
                      <button onClick={(e) => { e.stopPropagation(); onBet(match, `Handicap ${match.awayTeam}`, match.odds.spreads.away.price); }} className="text-yellow-500 font-black px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-colors">{match.odds.spreads.away.price?.toFixed(2)}</button>
                    </div>
                  </div>
                ) : <div />}
                
                {match.odds?.totals?.over && match.odds?.totals?.under ? (
                  <div className="flex flex-col gap-1.5 border border-white/10 p-3 rounded-2xl bg-white/5 shadow-inner">
                    <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest text-center mb-1">Total {match.odds.totals.over.point}</span>
                    <div className="flex justify-between items-center text-[10px] text-white">
                      <span className="font-bold text-gray-300">Over</span>
                      <button onClick={(e) => { e.stopPropagation(); onBet(match, `Over ${match.odds.totals.over.point}`, match.odds.totals.over.price); }} className="text-yellow-500 font-black px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-colors">{match.odds.totals.over.price?.toFixed(2)}</button>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-white">
                      <span className="font-bold text-gray-300">Under</span>
                      <button onClick={(e) => { e.stopPropagation(); onBet(match, `Under ${match.odds.totals.under.point}`, match.odds.totals.under.price); }} className="text-yellow-500 font-black px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/30 hover:bg-yellow-500 hover:text-black transition-colors">{match.odds.totals.under.price?.toFixed(2)}</button>
                    </div>
                  </div>
                ) : <div />}
              </div>
            )}

            <div className="flex gap-2 relative z-10 pt-4 mt-2 border-t border-white/10">
              <button onClick={() => onDetails(match)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 transition-colors border border-white/10 shadow-lg">
                <LayoutGrid size={14} /> Full Markets
              </button>
            </div>
            
          </div>
        ))}
      </div>
    )}
  </div>
);

const BetSlipOverlay = ({ bet, balance, onConfirm, onClose }: { bet: any, balance: number, onConfirm: (stake: number) => void, onClose: () => void }) => {
  const [stake, setStake] = useState(100);
  const [isQuickBet, setIsQuickBet] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const handleConfirm = () => {
    if (!isConfirming) {
      setIsConfirming(true);
    } else {
      playSound('click');
      onConfirm(stake);
    }
  };

  useEffect(() => {
    if (isQuickBet && stake > 0 && stake <= balance) {
      const timer = setTimeout(() => handleConfirm(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isQuickBet]);

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full sm:max-w-md bg-[#0d1110] rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-white/10 p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black uppercase text-white italic tracking-tighter">{isConfirming ? 'Final Confirmation' : 'Confirm Wager'}</h3>
          <button onClick={() => { playSound('click'); onClose(); }} className="p-2 bg-white/5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all"><X size={20} /></button>
        </div>
        
        <div className="glass-panel p-6 mb-8 border-white/5 bg-white/5">
          <p className="text-[9px] text-gray-500 font-black mb-2 uppercase tracking-[0.2em]">{bet.match.homeTeam} VS {bet.match.awayTeam}</p>
          <div className="flex justify-between items-center mb-4">
            <p className="text-xl font-black text-white uppercase italic tracking-tighter">{bet.selection}</p>
            <span className="bg-yellow-500 text-black px-4 py-1 rounded-xl font-black text-lg tracking-tighter shadow-lg">{bet.odds.toFixed(2)}</span>
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Potential Return</span>
            <span className="text-lg font-black text-green-500 italic">৳{(stake * bet.odds).toFixed(2)}</span>
          </div>
        </div>

        {!isConfirming && (
          <>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stake Amount (৳)</label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest">Balance: ৳{balance.toLocaleString()}</span>
                  <button 
                    onClick={() => { playSound('click'); setStake(balance); }}
                    className="text-[8px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded-md text-yellow-500 uppercase hover:bg-yellow-500 hover:text-black transition-all"
                  >
                    Max Bet
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1, 2, 5, 10, 20, 50, 100, 500].map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => { playSound('click'); setStake(prev => prev + amt); }}
                    className="text-[10px] font-black py-3 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all ripple-effect"
                  >
                    +৳{amt}
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={stake} 
                  onChange={(e) => setStake(Number(e.target.value))} 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-3xl font-black text-yellow-500 outline-none focus:border-yellow-500 transition-all text-center shadow-inner" 
                  placeholder="0" 
                />
                <button 
                  onClick={() => { playSound('click'); setStake(0); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => { playSound('click'); setIsQuickBet(!isQuickBet); }}
                  className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${isQuickBet ? 'bg-yellow-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isQuickBet ? 'left-6' : 'left-1'}`}></div>
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quick Bet</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Potential Return</span>
                <span className="text-2xl font-black text-green-400 tracking-tighter">৳ {(stake * bet.odds).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}

        <button 
          onClick={handleConfirm} 
          disabled={balance < stake || stake <= 0} 
          className={`w-full py-5 text-black font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all text-sm tracking-[0.2em] disabled:opacity-50 ripple-effect
            ${isQuickBet ? 'bg-orange-500 shadow-orange-500/20' : 'bg-yellow-500 shadow-yellow-500/20'}`}
        >
          {balance < stake ? 'Insufficient Funds' : isConfirming ? 'Confirm Wager?' : isQuickBet ? 'Auto-Confirming...' : 'Place Bet Now'}
        </button>
      </motion.div>
    </div>
  );
};

const TransactionHistoryOverlay = ({ transactions, onClose }: { transactions: any[], onClose: () => void }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md elite-glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Transaction History</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
      </div>
      <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
        {transactions.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <ClipboardList size={40} className="mx-auto text-gray-600" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">No transactions found</p>
          </div>
        ) : (
          transactions.map((tx, i) => (
            <div key={`tx-${i}`} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {tx.type === 'deposit' ? <ArrowUpCircle size={18} className="rotate-180" /> : <ArrowUpCircle size={18} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">{tx.type}</p>
                  <p className="text-[8px] font-bold text-gray-500">{tx.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black italic ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                  {tx.type === 'deposit' ? '+' : '-'}{tx.amount}
                </p>
                <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">{tx.status}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  </div>
);

const LeaderboardOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="content-overlay flash-show">
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Leaderboard</h2>
        <button onClick={onClose} className="p-2 glass-card rounded-full text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="elite-glass p-6 border-white/10 rounded-2xl text-center">
        <p className="text-gray-400">Leaderboard data is coming soon!</p>
      </div>
    </div>
  </div>
);

const BetHistoryOverlay = ({ bets, onClose }: { bets: any[], onClose: () => void }) => (
  <div className="content-overlay flash-show">
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">My Wagers</h2>
        <button onClick={onClose} className="p-2 glass-card rounded-full text-gray-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {bets.length === 0 ? (
          <div className="text-center py-20 glass-panel border-dashed border-white/10">
            <ShieldCheck size={48} className="mx-auto mb-4 text-gray-700" />
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">No Active Wagers Found</p>
          </div>
        ) : (
          bets.map(bet => (
            <div key={bet.id} className="glass-panel p-5 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl rounded-full"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-black text-white uppercase italic tracking-tighter">{bet.selection}</p>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">{bet.match.homeTeam} VS {bet.match.awayTeam}</p>
                </div>
                <span className="text-[8px] bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-green-500/30">Active</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-400 pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-gray-600 mb-1">Stake</span>
                  <span className="text-white font-black">৳{bet.stake}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase text-gray-600 mb-1">Odds</span>
                  <span className="text-yellow-500 font-black">{bet.odds.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black uppercase text-gray-600 mb-1">Potential Win</span>
                  <span className="text-green-400 font-black">৳{(bet.stake * bet.odds).toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

const LiveStreamOverlay = ({ match, onClose }: { match: any, onClose: () => void }) => (
  <div className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-0 sm:p-6 animate-in fade-in zoom-in-[0.99] duration-300">
    <div className="w-full flex justify-between items-center p-4 sm:hidden bg-black/50 border-b border-white/5 absolute top-0 left-0 right-0 z-[620]">
      <div className="flex items-center gap-2">
        <Activity size={12} className="text-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE STREAM</span>
      </div>
      <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-gray-300 hover:text-white transition-all">
         <ChevronDown className="rotate-90" size={14} />
         <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
      </button>
    </div>
    <button onClick={onClose} className="hidden sm:flex absolute top-8 right-8 p-3 bg-white/5 rounded-full z-[610] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-500 transition-all border border-white/10"><X size={24}/></button>
    <div className="w-full h-full sm:h-auto sm:max-w-4xl sm:aspect-video glass-panel border-0 sm:border border-white/10 flex flex-col items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden mt-14 sm:mt-0">
       <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
       <div className="absolute top-8 left-8 flex items-center gap-3">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] drop-shadow-lg">{match.league}</span>
       </div>
       <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="flex items-center gap-16 text-white">
             <div className="text-center w-40">
                <p className="text-2xl font-black italic tracking-tighter uppercase">{match.homeTeam}</p>
             </div>
             <div className="text-5xl font-black text-yellow-500 italic tracking-tighter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">{match.score || 'VS'}</div>
             <div className="text-center w-40">
                <p className="text-2xl font-black italic tracking-tighter uppercase">{match.awayTeam}</p>
             </div>
          </div>
          <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-black shadow-2xl shadow-yellow-500/30 cursor-pointer hover:scale-110 active:scale-90 transition-all group">
            <Play size={40} fill="currentColor" className="ml-2 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Establishing Satellite Feed...</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }}></div>)}
            </div>
          </div>
       </div>
    </div>
  </div>
);
const ProfileGridItem = ({ icon: Icon, label, badge, onClick }: { icon: any, label: string, badge?: string | number, onClick?: () => void }) => (
  <div onClick={() => { playSound('click'); if (onClick) onClick(); }} className="flex flex-col items-center justify-center p-3 elite-glass active:scale-95 transition-all cursor-pointer">
    <div className="relative text-yellow-500 mb-2">
      <Icon size={22} />
      {badge && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[9px] text-white font-black border border-[#0d1110]">{badge}</div>}
    </div>
    <span className="text-[10px] font-bold text-gray-200 text-center uppercase leading-tight">{label}</span>
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2 mb-3 mt-6">
    <div className="w-1.5 h-3.5 bg-yellow-500 rounded-full"></div>
    <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">{title}</h3>
  </div>
);

const OverLayCloseBtn = ({ onClick }: { onClick: () => void }) => (
  <div className="fixed top-5 right-5 z-[500] px-5 py-4 flex justify-end">
    <button onClick={onClick} className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 active:scale-90 transition-all shadow-xl backdrop-blur-lg">
      <X size={24} />
    </button>
  </div>
);

const PromotionOverlay = ({ onClose, onDeposit }: { onClose: () => void, onDeposit: (promo: any) => void }) => {
  return (
    <div className="content-overlay flash-show">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Promotions</h2>
          <button onClick={onClose} className="p-2 glass-card rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {PROMOTIONS.map((promo, i) => (
            <div key={`promo-${promo.id}-${i}`} className="glass-panel overflow-hidden border-white/5 group active:scale-[0.98] transition-all cursor-pointer ripple-effect">
              <div className="relative h-32">
                <img src={promo.img} alt={promo.label} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">HOT</div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-white uppercase mb-3">{promo.label}</h3>
                <div className="text-[10px] text-gray-400 font-bold mb-4">
                  <p className="mb-2 text-gray-300">{promo.description}</p>
                  {promo.fullDetails && (
                    <div className="mt-4 mb-4 p-3 bg-black/20 rounded-xl border border-white/5 whitespace-pre-wrap text-[9px] text-gray-400">
                      {promo.fullDetails}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <p>Bonus: <span className="text-yellow-500">{promo.bonusPercent * 100}%</span></p>
                    <p>Max: <span className="text-yellow-500">{promo.maxBonus} BDT</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onDeposit(promo)} className="flex-1 bg-yellow-500 text-black py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Deposit Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HelpCenterOverlay = ({ onClose, onOpenChat }: { onClose: () => void, onOpenChat: () => void }) => {
  const categories = [
    { icon: Wallet, label: "Deposit", count: 12 },
    { icon: ArrowUpCircle, label: "Withdrawal", count: 8 },
    { icon: Gift, label: "Promotions", count: 15 },
    { icon: UserCircle, label: "Accounts", count: 20 },
    { icon: Gamepad2, label: "Games", count: 45 },
    { icon: Lock, label: "Technical", count: 6 },
  ];

  return (
    <div className="content-overlay flash-show">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Help Center</h2>
          <button onClick={onClose} className="p-2 glass-card rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="glass-panel p-6 mb-8 border-yellow-500/20 bg-yellow-500/5">
          <div className="elite-glass p-6 border-yellow-500/20 bg-yellow-500/5 flex justify-between items-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-yellow-500/20">
                <MessageSquare size={28} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">24/7 Live Support</h3>
                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Connect with our agents instantly</p>
              </div>
            </div>
            <button 
              onClick={() => { 
                playSound('click'); 
                onClose(); 
                onOpenChat();
              }} 
              className="w-full bg-yellow-500 text-black py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all ripple-effect"
            >
              Open Live Chat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat, i) => (
            <div key={`help-cat-${cat.label}-${i}`} className="glass-panel p-5 border-white/5 hover:border-white/20 transition-all cursor-pointer group ripple-effect">
              <cat.icon size={24} className="text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-xs font-black text-white uppercase mb-1">{cat.label}</h4>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{cat.count} Articles</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NotificationOverlay = ({ notifications, onClose, onMarkRead }: { notifications: any[], onClose: () => void, onMarkRead: (id: string) => void }) => (
  <div className="content-overlay animate-in slide-in-from-right duration-500">
    <OverLayCloseBtn onClick={onClose} />
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
          <Bell className="text-yellow-500" size={28} />
        </div>
        <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Notifications</h2>
      </div>
      
      <div className="space-y-5">
        {notifications.length === 0 ? (
          <div className="elite-glass p-16 text-center border-white/10">
            <Mail className="text-gray-700 mx-auto mb-6 opacity-20" size={64} />
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Inbox Empty</p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <motion.div 
              initial={{ x: 50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              key={`notif-${n.id || i}-${i}`} 
              onClick={() => { if (!n.read) onMarkRead(n.id); }}
              className={`elite-glass p-6 border-white/10 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-500 cursor-pointer ${!n.read ? 'border-l-4 border-l-yellow-500' : ''}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-yellow-500 transition-colors">{n.title}</h4>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  {n.time?.seconds ? new Date(n.time.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : n.time}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed relative z-10 font-medium">{n.text}</p>
              {!n.read && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#eab308]"></div>}
            </motion.div>
          ))
        )}
      </div>
    </div>
  </div>
);

const AboutUsOverlay = ({ onClose }: { onClose: () => void }) => (
  <div className="content-overlay animate-in fade-in duration-500">
    <OverLayCloseBtn onClick={onClose} />
    <div className="max-w-2xl mx-auto pb-10">
      <div className="text-center mb-12 flex flex-col items-center">
        <div className="animate-floating">
          <StylishLogo size="text-6xl" />
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mt-6 opacity-40"></div>
        <h2 className="text-[10px] font-black text-gray-500 tracking-[0.5em] uppercase mt-4">আমাদের সম্পর্কে</h2>
      </div>
      
      <div className="space-y-8 text-sm text-gray-300 leading-relaxed font-medium">
        <div className="elite-glass p-8 border-l-4 border-l-yellow-500 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 blur-[80px] rounded-full group-hover:bg-yellow-500/10 transition-all"></div>
          <h3 className="text-2xl font-black text-yellow-500 uppercase tracking-tighter mb-4 italic relative z-10">Application Description</h3>
          <p className="relative z-10 text-gray-400">Life is a bet! প্রতিটি ঝুঁকি, প্রতিটি সিদ্ধান্ত একটি নতুন সম্ভাবনার দুয়ার খুলে দেয়। <span className="font-black text-white">L's Baji Elite</span> তে আমরা বিশ্বাস করি যে সাহসিকতা এবং সঠিক কৌশলের সংমিশ্রণই হলো বিজয়ের চাবিকাঠি। আমরা আপনাকে সেই প্ল্যাটফর্ম দিই যেখানে আপনি আপনার প্রতিটি আবেগকে বিজয়ে রূপান্তর করতে পারেন।</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="elite-glass p-8 border-l-4 border-l-blue-500 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all"></div>
            <h3 className="text-xl font-black text-blue-500 uppercase tracking-tighter mb-4 italic relative z-10">Company Mission</h3>
            <p className="relative z-10 text-gray-400">Our mission is to establish the most secure, transparent, and exhilarating gaming and betting ecosystem in Bangladesh. We are committed to fostering responsible gaming practices while delivering uncompromised entertainment and seamless financial transactions for every user.</p>
          </div>

          <div className="elite-glass p-8 border-l-4 border-l-emerald-500 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-all"></div>
            <h3 className="text-xl font-black text-emerald-500 uppercase tracking-tighter mb-4 italic relative z-10">History & Team</h3>
            <p className="relative z-10 text-gray-400">Founded by a dedicated team of tech innovators and gaming enthusiasts, L's Baji started as a visionary project to redefine online entertainment. Our leadership comprises industry veterans who focus on robust compliance, cutting-edge technology, and unmatched customer satisfaction.</p>
          </div>
        </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="elite-glass p-6 group hover:border-yellow-500/30 transition-all relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-lg"><Gamepad2 size={24} className="text-blue-400"/></div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Games & App</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">আমাদের অ্যাপে রয়েছে বিশ্বমানের ক্যাসিনো গেমস, স্লটস, এবং স্পোর্টস বেটিং। <span className="text-yellow-500 font-bold">Crazy Time, Super Ace, Aviator</span> এর মতো জনপ্রিয় গেমগুলো খেলুন একদম রিয়েল-টাইম অভিজ্ঞতায়। অ্যাপটি ডিজাইন করা হয়েছে প্রিমিয়াম গ্লাসমরফিজম (Glasses Model) স্টাইলে, যা আপনাকে দেবে এক অনন্য এবং স্মুথ গেমিং এক্সপেরিয়েন্স।</p>
            </div>

            <div className="elite-glass p-6 group hover:border-yellow-500/30 transition-all relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 blur-2xl rounded-full"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 shadow-lg"><Wallet size={24} className="text-green-400"/></div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Deposit & Withdraw</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">বিকাশ, নগদ, রকেট সহ সকল জনপ্রিয় পেমেন্ট মেথডের মাধ্যমে <span className="text-yellow-500 font-bold">ইনস্ট্যান্ট ডিপোজিট এবং উইথড্র</span> সুবিধা। আপনার লেনদেন সম্পূর্ণ নিরাপদ এবং স্বয়ংক্রিয়। কোনো ঝামেলা ছাড়াই আপনার জেতা টাকা সরাসরি আপনার একাউন্টে বুঝে নিন।</p>
            </div>

            <div className="elite-glass p-6 group hover:border-yellow-500/30 transition-all relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-lg"><Headphones size={24} className="text-purple-400"/></div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Live Support</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">যেকোনো সমস্যায় আমাদের <span className="text-yellow-500 font-bold">২৪/৭ লাইভ সাপোর্ট</span> টিম আপনার পাশে আছে। আমাদের AI চ্যাটবট 'Sara' এবং রিয়েল হিউম্যান এজেন্টরা সবসময় প্রস্তুত আপনার যেকোনো প্রশ্নের দ্রুত সমাধান দিতে।</p>
            </div>

            <div className="elite-glass p-6 group hover:border-yellow-500/30 transition-all relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 shadow-lg"><Zap size={24} className="text-orange-400"/></div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Future Updates</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">আমরা সবসময় নতুনত্বে বিশ্বাসী। ভবিষ্যতে আসছে আরও নতুন গেমস, <span className="text-yellow-500 font-bold">ভিআইপি রিওয়ার্ডস, টুর্নামেন্ট</span> এবং আরও আকর্ষণীয় ফিচারস। আমাদের সাথেই থাকুন এবং উপভোগ করুন সেরা গেমিং অভিজ্ঞতা।</p>
            </div>
          </div>

          <div className="mt-12 space-y-8">
            <div className="elite-glass p-6 border-white/5">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 text-center">Official Partners</h4>
              <div className="flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
                <img src="https://picsum.photos/seed/partner1/60/30" alt="Partner" className="h-6" referrerPolicy="no-referrer" />
                <img src="https://picsum.photos/seed/partner2/60/30" alt="Partner" className="h-6" referrerPolicy="no-referrer" />
                <img src="https://picsum.photos/seed/partner3/60/30" alt="Partner" className="h-6" referrerPolicy="no-referrer" />
              </div>
            </div>

            <div className="elite-glass p-6 border-white/5">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 text-center">Gaming Licenses</h4>
              <div className="flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={20} className="text-yellow-500" />
                   <span className="text-[9px] font-black uppercase text-white">Curacao Gaming</span>
                </div>
                <div className="flex items-center gap-2">
                   <ShieldCheck size={20} className="text-yellow-500" />
                   <span className="text-[9px] font-black uppercase text-white">iTech Labs</span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  </div>
);

const ContactCallForm = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleBookCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || !email || !phone || !time) return;
    setLoading(true);
    
    // Telegram Notification
    const telegramMessage = `<b>📞 New Call Book Request</b>\n\n` +
      `<b>Name:</b> ${escapeHTML(name)}\n` +
      `<b>Email:</b> ${escapeHTML(email)}\n` +
      `<b>Phone:</b> ${escapeHTML(phone)}\n` +
      `<b>Time:</b> ${escapeHTML(time)}`;
    
    try {
      await sendTelegramNotification(telegramMessage);
    } catch (e) {
      console.error("Telegram notify failed", e);
    }

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="content-overlay animate-in zoom-in duration-300 flex items-center justify-center p-6">
      <OverLayCloseBtn onClick={onClose} />
      <div className="glass-panel w-full max-w-md p-10 my-auto shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {success ? (
          <div className="text-center py-10 space-y-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full border-2 border-green-500 flex items-center justify-center mx-auto text-green-500 shadow-xl shadow-green-500/20">
              <CheckCircle size={40} className="animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">সফল হয়েছে!</h2>
            <p className="text-[11px] uppercase font-bold text-gray-400 tracking-widest">আমাদের এজেন্ট শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-9 flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full border-2 border-yellow-500 flex items-center justify-center mb-4 text-yellow-500 shadow-xl shadow-yellow-500/20"><Phone size={28}/></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">কল বুক করুন</h2>
              <p className="text-[11px] uppercase font-bold text-gray-400 tracking-widest mt-1.5">আপনার নাম এবং জিমেইল/ইমেল দিয়ে সময় দিন</p>
            </div>

            <form onSubmit={handleBookCall} className="space-y-4">
              <input type="text" placeholder="পূর্ণ নাম (Name)" className="w-full glass-input rounded-2xl py-4.5 px-6 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="email" placeholder="জিমেইল/ইমেল (Gmail)" className="w-full glass-input rounded-2xl py-4.5 px-6 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input type="tel" placeholder="ফোন নম্বর (Number)" className="w-full glass-input rounded-2xl py-4.5 px-6 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <input type="text" placeholder="পছন্দসই সময় (e.g. 5:00 PM)" className="w-full glass-input rounded-2xl py-4.5 px-6 text-sm" value={time} onChange={(e) => setTime(e.target.value)} required />

              <button className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all mt-6 flex items-center justify-center gap-3">
                {loading ? 'Processing...' : 'কল বুক করুন (Book Call)'}
                {!loading && <CheckCircle size={18}/>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const SidebarOverlay = ({ isOpen, onClose, user, onNavigate, showToast, userData, isAdmin }: { isOpen: boolean, onClose: () => void, user: any, onNavigate: (page: string) => void, showToast: (msg: string, type?: 'success'|'error'|'info') => void, userData: any, isAdmin: boolean }) => {
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex">
      {/* ... (rest of the component) */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '-100%' }} 
        animate={{ x: 0 }} 
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-4/5 max-w-sm bg-[#0d1110]/95 backdrop-blur-2xl border-r border-white/10 h-full flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 border-b border-white/10 bg-gradient-to-b from-yellow-500/10 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <StylishLogo size="text-3xl" />
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={20} />
            </button>
          </div>
          
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)] relative group">
                  <img src={APP_LOGO} alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.currentTarget.src = APP_LOGO; }} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                </div>
                <div>
                  <p className="text-sm font-black text-white">{user.displayName || 'User'}</p>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider">{user.phoneNumber || 'No Phone Number'}</p>
                </div>
              </div>
              <div className="pl-15">
                <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1.5">
                  <Mail size={10} /> {user.email || 'No Email'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)] relative group">
                <img src={APP_LOGO} alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.currentTarget.src = APP_LOGO; }} />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
              </div>
              <div>
                <p className="text-sm font-black text-white">Guest User</p>
                <p className="text-[10px] font-bold text-gray-500 tracking-wider">Please login</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 no-scrollbar">
          <button onClick={() => { onNavigate('download_app'); onClose(); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-yellow-500 transition-all group">
            <Download size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">Download App</span>
          </button>
          <button onClick={() => { onNavigate('about'); onClose(); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-yellow-500 transition-all group">
            <Info size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">About Us</span>
          </button>
          <button onClick={() => { onNavigate('contact'); onClose(); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-yellow-500 transition-all group">
            <Phone size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">Contact Us</span>
          </button>
          <button onClick={() => { onNavigate('privacy'); onClose(); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-yellow-500 transition-all group">
            <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">Privacy Policy</span>
          </button>
          <button onClick={() => { onNavigate('terms'); onClose(); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-yellow-500 transition-all group">
            <Gavel size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">Terms & Conditions</span>
          </button>
          <button onClick={() => { onNavigate('affiliates'); onClose(); }} className="w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-yellow-500 transition-all group">
            <div className="flex items-center gap-4">
              <Share2 size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-wider">Partner Portal</span>
            </div>
            {userData?.isAffiliate && (
              <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-[8px] font-black text-yellow-500 animate-pulse">ELITE</div>
            )}
          </button>
          
          {/* Admin removed as per user request */}
          <button onClick={() => { onNavigate('ewallet_agent'); onClose(); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-yellow-500 transition-all group">
            <Wallet size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">E-Wallet Agent</span>
          </button>
        </div>

        <div className="p-4 border-t border-white/10 mt-auto">
          <button 
            onClick={() => {
              const el = document.getElementById('community-links');
              if (el) el.classList.toggle('hidden');
            }} 
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all group"
          >
            <Globe size={18} className="group-hover:animate-spin-slow" />
            <span className="text-xs font-black uppercase tracking-wider">Community</span>
          </button>
          
          <div id="community-links" className="hidden mt-3 space-y-3 pt-3 border-t border-white/10">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-1">Our Channels</h4>
            <div className="grid grid-cols-4 gap-2">
              {[ 
                { label: 'Facebook', url: 'https://www.facebook.com/share/17X5ESbJxw/', color: 'hover:text-blue-500', logo: 'https://cdn-icons-png.flaticon.com/128/145/145802.png' }, 
                { label: 'TikTok', url: '#', color: 'hover:text-pink-500', logo: 'https://cdn-icons-png.flaticon.com/128/3046/3046121.png' }, 
                { label: 'IMO', url: '#', color: 'hover:text-orange-500', logo: 'https://cdn-icons-png.flaticon.com/128/2921/2921235.png' }, 
                { label: 'WhatsApp', url: '#', color: 'hover:text-green-500', logo: 'https://cdn-icons-png.flaticon.com/128/174/174879.png' },
                { label: 'Instagram', url: '#', color: 'hover:text-pink-600', logo: 'https://cdn-icons-png.flaticon.com/128/174/174855.png' }, 
                { 
                    label: 'Telegram', 
                    isMenu: true, 
                    items: [
                        { name: 'Bot', url: 'https://t.me/ms_PayViewBot' },
                        { name: 'Group', url: 'https://t.me/adspayHupOffiale' },
                        { name: 'Community', url: 'https://t.me/httpstmevelkybetusersakib' }
                    ], 
                    color: 'hover:text-blue-400', 
                    logo: 'https://cdn-icons-png.flaticon.com/128/2111/2111646.png' 
                }, 
                { label: 'YouTube', url: '#', color: 'hover:text-red-600', logo: 'https://cdn-icons-png.flaticon.com/128/1384/1384060.png' }
              ].map(social => (
                social.isMenu ? (
                  <div key={social.label} className="relative z-50">
                    <button 
                      onClick={() => setIsTelegramOpen(!isTelegramOpen)}
                      className={`w-full flex flex-col items-center justify-center p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/30 transition-all ${social.color}`}
                    >
                      <img src={social.logo} alt={social.label} className="w-6 h-6 mb-1 object-contain" referrerPolicy="no-referrer" />
                      <span className="text-[7px] font-black uppercase text-gray-400">{social.label}</span>
                    </button>
                    {isTelegramOpen && (
                      <div className="absolute bottom-full left-0 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 z-50 mb-2 shadow-2xl block">
                        {social.items.map(item => (
                          <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" className="block p-2 text-[10px] text-gray-300 hover:text-yellow-500 hover:bg-white/5 rounded-lg">
                            {item.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                <a 
                  key={social.label} 
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center p-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/30 transition-all group ${social.color}`}
                >
                  <img src={social.logo} alt={social.label} className="w-6 h-6 mb-1 object-contain transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  <span className="text-[7px] font-black uppercase text-gray-400 group-hover:text-white">{social.label}</span>
                </a>
              )))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-xs"
  >
    <div className={`elite-glass p-4 rounded-2xl border flex items-center gap-3 shadow-2xl ${
      type === 'success' ? 'border-green-500/50 bg-green-500/10' :
      type === 'error' ? 'border-red-500/50 bg-red-500/10' :
      'border-yellow-500/50 bg-yellow-500/10'
    }`}>
      {type === 'success' && <CheckCircle className="text-green-500" size={20} />}
      {type === 'error' && <X size={20} className="text-red-500" />}
      {type === 'info' && <Info size={20} className="text-yellow-500" />}
      <p className="text-xs font-bold text-white uppercase tracking-wider flex-1">{message}</p>
      <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </div>
  </motion.div>
);

/* GameCard is now moved inside App component */

const QuickLink = ({ icon: Icon, label, onClick, color = "text-yellow-500" }: { icon: any, label: string, onClick: () => void, color?: string }) => (
  <div onClick={() => { playSound('click'); onClick(); }} className="flex flex-col items-center gap-2 cursor-pointer group">
    <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${color} group-hover:bg-yellow-500 group-hover:text-black transition-all duration-300 shadow-lg`}>
      <Icon size={22} />
    </div>
    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
  </div>
);

const HomeContent = ({ 
  banners, 
  currentBanner, 
  tickerMessages, 
  activeTab, 
  setActiveTab, 
  handleGameLaunch, 
  handleDeposit, 
  handleWithdraw, 
  setOverlayContent,
  showFullAbout,
  setShowFullAbout,
  favorites,
  toggleFavorite
}: any) => {
  const { t } = useI18n();
  const translatedCategories = CATEGORIES.map(cat => ({ ...cat, label: t(cat.id) }));
  return (
    <div className="space-y-6">
      <PromotionBanner />
      {/* Banner Carousel */}
      <div className="relative h-48 rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
        {banners.map((banner: any, idx: number) => (
          <div key={`banner-${banner.title}-${idx}`} className={`absolute inset-0 ${banner.isGlass ? 'bg-white/5 backdrop-blur-md border border-white/10' : `bg-gradient-to-br ${banner.color}`} transition-all duration-1000 flex items-center ${currentBanner === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
            {banner.isGlass && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
              </div>
            )}
            <img 
              src={banner.img} 
              alt={banner.title}
              className={`absolute inset-0 w-full h-full object-cover ${banner.isGlass ? 'opacity-20' : 'opacity-40'} mix-blend-overlay`}
              referrerPolicy="no-referrer"
            />
            <div className="relative z-10 p-8 max-w-[70%]">
              <h4 className="text-2xl font-black italic uppercase text-white drop-shadow-xl tracking-tighter leading-none mb-2">{banner.title}</h4>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1">স্বাগতম (Welcome)</p>
              <p className="text-sm font-bold text-white drop-shadow-md">{banner.text}</p>
              <button onClick={() => setOverlayContent('promotion')} className="mt-4 bg-yellow-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all ripple-effect">Join Now</button>
            </div>
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_: any, i: number) => (
            <div key={`banner-dot-${i}`} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentBanner ? 'w-6 bg-yellow-500' : 'w-1.5 bg-white/20'}`}></div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-5 gap-2 px-1">
        <QuickLink icon={Wallet} label="Deposit" onClick={handleDeposit} />
        <QuickLink icon={ArrowUpCircle} label="Withdraw" onClick={handleWithdraw} />
        <QuickLink icon={Gift} label="Promo" onClick={() => setOverlayContent('promotion')} />
        <QuickLink icon={Share2} label="Referral" onClick={() => setOverlayContent('referral')} />
        <QuickLink icon={RefreshCw} label="Spin" onClick={() => setOverlayContent('spin')} />
      </div>

      {/* Category Nav */}
      <div className="grid grid-cols-5 gap-2 transition-all duration-500">
        {translatedCategories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveTab(cat.id)} 
            className={`flex flex-col items-center justify-center py-3 rounded-2xl transition-all duration-300 border
              ${activeTab === cat.id 
                ? 'elite-glass-active border-yellow-500/50 text-yellow-500' 
                : 'elite-glass border-white/5 text-gray-400'}`}
          >
            <cat.icon size={18} />
            <span className="text-[8px] font-black uppercase mt-1 tracking-wider">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Trading Pro Banner (Prominent) */}
      <button 
        onClick={() => setOverlayContent('trading')} 
        className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-yellow-500/20 to-blue-500/10 backdrop-blur-xl border border-white/10 rounded-[2rem] group relative overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-yellow-500 rounded-2xl text-black shadow-lg shadow-yellow-500/20">
            <TrendingUp size={24} />
          </div>
          <div className="text-left">
            <span className="block text-lg font-black text-white uppercase tracking-tighter italic">L's Trading Pro</span>
            <span className="block text-[9px] font-black text-yellow-500/60 uppercase tracking-[0.2em]">AI Financial Engine v2.0</span>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Trade Now</span>
          <Zap size={16} className="text-yellow-500 animate-bounce" />
        </div>
      </button>

      {/* Featured Games Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <Flame size={14} className="text-orange-500" /> Hot Games
          </h3>
          <button onClick={() => setActiveTab('home')} className="text-[9px] font-black text-yellow-500 uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          {GAMES_DATABASE['home']?.slice(0, 6).map((game) => (
            <GameCard key={`hot-${game.id}`} game={game} isFavorite={favorites.includes(game.id)} onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(game.id); }} onClick={() => handleGameLaunch(game.id)} />
          ))}
        </div>
      </div>

      {/* Live Casino Preview */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid size={14} className="text-blue-500" /> Live Casino
          </h3>
          <button onClick={() => setActiveTab('casino')} className="text-[9px] font-black text-yellow-500 uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          {GAMES_DATABASE['casino']?.slice(0, 3).map((game) => (
            <GameCard key={`casino-${game.id}`} game={game} isFavorite={favorites.includes(game.id)} onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(game.id); }} onClick={() => handleGameLaunch(game.id)} />
          ))}
        </div>
      </div>

      {/* Slots Preview */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
            <Gamepad2 size={14} className="text-purple-500" /> Slots
          </h3>
          <button onClick={() => setActiveTab('slots')} className="text-[9px] font-black text-yellow-500 uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          {GAMES_DATABASE['slots']?.slice(0, 3).map((game) => (
            <GameCard key={`slots-${game.id}`} game={game} isFavorite={favorites.includes(game.id)} onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(game.id); }} onClick={() => handleGameLaunch(game.id)} />
          ))}
        </div>
      </div>

      {/* Latest Winners */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Trophy size={14} className="text-yellow-500" />
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">Latest Winners</h3>
        </div>
        <div className="glass-panel p-4 border-white/5 space-y-3">
          {[
            { id: 1, user: "rituk***", amount: "৳৫,৪০০", game: "Super Ace", time: "2m ago" },
            { id: 2, user: "elite***", amount: "৳১২,০০০", game: "Aviator", time: "5m ago" },
            { id: 3, user: "baji***", amount: "৳৩,২০০", game: "Crazy Time", time: "8m ago" },
          ].map((winner, i) => (
            <div key={`winner-${winner.id}`} className="flex justify-between items-center text-[10px] font-bold border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-[8px]">
                  {winner.user[0].toUpperCase()}
                </div>
                <span className="text-gray-200">{winner.user}</span>
              </div>
              <span className="text-yellow-500">{winner.amount}</span>
              <span className="text-gray-500 uppercase text-[8px]">{winner.game}</span>
              <span className="text-gray-600 text-[8px]">{winner.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Download App Section */}
      <div className="elite-glass p-6 border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent flex items-center justify-between group overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-sm font-black text-white uppercase tracking-tighter italic mb-1">Download Mobile App</h4>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Get the best experience on Android & iOS</p>
          <button 
            onClick={() => window.open(APP_LINK, '_blank')}
            className="mt-4 bg-yellow-500 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Download Now
          </button>
        </div>
        <div className="relative z-10">
          <Phone size={48} className="text-yellow-500/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
        </div>
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full"></div>
      </div>

      {/* About Section */}
      <div className="mt-12 mb-10 space-y-8">
        <div className="glass-panel p-8 border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full"></div>
          <div className="flex items-center gap-4 mb-6">
            <StylishLogo size="text-xl" />
            <div className="h-8 w-px bg-white/10"></div>
            <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">L's Baji Elite</h3>
          </div>
          
          <div className="space-y-4 text-[11px] text-gray-400 leading-relaxed font-medium">
            <p>
              <span className="text-yellow-500 font-black">L's Baji Bangladesh - Leading Online Gaming and Betting Platform in Bangladesh</span>
              In recent years, the online gaming and betting industry in Bangladesh has seen exponential growth, attracting players who seek excitement and rewarding experiences. As more people embrace digital platforms, the demand for reliable and diverse gaming options has surged. Our platform stands out as a top choice, offering an extensive range of games and betting opportunities from renowned providers worldwide.
            </p>
            <AnimatePresence>
              {showFullAbout && (
                <motion.div 
                  key="full-about"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <p>
                    With online betting becoming a mainstream entertainment choice, players now rely on platforms that offer both trust and variety. Among the most established names are L's Baji, Jeetbuzz, Six6s, Badsha, Bagh, and Citinow. These platforms deliver premium sports and casino betting experiences, featuring a broad spectrum of options including spreads, parlays, live bets, teasers, and prop wagers to satisfy every betting style.
                  </p>
                  <p>
                    <span className="text-yellow-500 font-black">Diverse Gaming Options from Top Providers</span>
                    One of the key factors that set us apart is the sheer variety of gaming options we offer. We’ve partnered with some of the most reputable game providers in the industry to bring you a world-class gaming experience. Whether you're into sports betting, casino games, or unique online gaming experiences, we’ve got you covered.
                  </p>
                  <p>
                    Our platform features games from Microgaming, a leader in the online gaming industry, known for its high-quality slot games and progressive jackpots. For sports enthusiasts, SABA Sports and SBO Sports provide a comprehensive sportsbook covering a wide range of sports, including football, cricket, basketball, and more.
                  </p>
                  <p>
                    If you’re a fan of interactive and visually engaging games, providers like Pocket Games, CQ9, and JDB offer a plethora of options, ranging from slots to arcade-style games. Evolution and Big Gaming deliver a superior live casino experience, bringing the thrill of a real casino directly to your screen with games like live blackjack, roulette, and baccarat.
                  </p>
                  <p>
                    We also cater to poker aficionados with offerings from BPOKER and a range of other card games from providers like KA Gaming and WorldMatch. For a more casual gaming experience, LUDO and So De provide fun, easy-to-play options that are perfect for all ages.
                  </p>
                  <p>
                    <span className="text-yellow-500 font-black">Exclusive Game Providers and Titles</span>
                    Our platform is constantly expanding its game library, and we’re proud to include exclusive providers like Sexy, Red Tiger, Spade Gaming, King Maker, JILI, Play8, Fa Chai, Pragmatic Play, and Playtech. These providers bring a mix of classic and innovative games, ensuring that there’s something for everyone, whether you prefer traditional slots or more modern, feature-rich titles.
                  </p>
                  <p>
                    For those who seek the ultimate in gaming variety, we offer titles from WorldMatch, Play'n Go, SV388, and NETENT, all of which are known for their high-quality graphics and immersive gameplay. UG Sports and PLAYSTAR add to the diversity with a mix of sports betting and casino games, while RICH88, FASTSPIN, ICF, SPRIBE, and HotRoad round out our offerings with fast-paced, exciting games that keep you on the edge of your seat.
                  </p>
                  <p>
                    <span className="text-yellow-500 font-black">Why Choose Us?</span>
                    When it comes to online gaming and betting in Bangladesh, our platform is second to none. We prioritize safety, security, and fair play, ensuring that your gaming experience is both enjoyable and secure. Our platform is licensed and regulated, and we use state-of-the-art encryption technology to protect your personal and financial information.
                  </p>
                  <p>
                    Our user-friendly interface makes it easy to navigate through our extensive range of games and sports betting options, whether you’re a seasoned player or new to online gaming. Plus, with our dedicated customer support team available 24/7, help is always just a click away.
                  </p>
                  <p>
                    <span className="text-yellow-500 font-black">Join Us Today and Start Winning</span>
                    If you’re ready to take your gaming and betting experience to the next level, join us today. Not only will you gain access to an unparalleled selection of games and sports betting opportunities, but you’ll also be able to take advantage of our generous bonuses and promotions.
                  </p>
                  <p>
                    For those who refer friends to our platform, we offer exclusive referral bonuses. Every time your referred friends sign up and start playing, you’ll earn rewards that can be used to enhance your own gaming experience. It’s a win-win situation – the more friends you refer, the more you can win!
                  </p>
                  <p>
                    <span className="text-yellow-500 font-black">Conclusion</span>
                    Don’t miss out on the best online gaming and betting platform in Bangladesh. With top providers like Microgaming, SABA Sports, JDB, CQ9, Pocket Games, and many more, we offer a comprehensive gaming experience that’s unmatched in the region. Sign up today and start exploring all that our platform has to offer. Remember, your next big win could be just a click away!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setShowFullAbout(!showFullAbout)}
            className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all ripple-effect flex items-center justify-center gap-2"
          >
            {showFullAbout ? 'কম দেখুন (Show Less)' : 'আরও দেখুন (Read More)'}
            <ArrowUpCircle size={14} className={`transition-transform duration-300 ${showFullAbout ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Partners & Licenses */}
        <div className="space-y-8">
          <div className="glass-panel p-6 border-white/5">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 text-center">Official Partners</h4>
            <div className="flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
              <img src="https://picsum.photos/seed/partner1/60/30" alt="Partner" className="h-6" referrerPolicy="no-referrer" />
              <img src="https://picsum.photos/seed/partner2/60/30" alt="Partner" className="h-6" referrerPolicy="no-referrer" />
              <img src="https://picsum.photos/seed/partner3/60/30" alt="Partner" className="h-6" referrerPolicy="no-referrer" />
            </div>
          </div>

          <div className="glass-panel p-6 border-white/5">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 text-center">Gaming Licenses</h4>
            <div className="flex justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
              <div className="flex items-center gap-2">
                 <ShieldCheck size={20} className="text-yellow-500" />
                 <span className="text-[9px] font-black uppercase text-white">Curacao Gaming</span>
              </div>
              <div className="flex items-center gap-2">
                 <ShieldCheck size={20} className="text-yellow-500" />
                 <span className="text-[9px] font-black uppercase text-white">iTech Labs</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 border-white/5">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 text-center">Payment Methods</h4>
            <div className="grid grid-cols-4 gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
              <div className="glass-card p-3 flex items-center justify-center text-[8px] font-black uppercase text-white border-white/10">bKash</div>
              <div className="glass-card p-3 flex items-center justify-center text-[8px] font-black uppercase text-white border-white/10">Nagad</div>
              <div className="glass-card p-3 flex items-center justify-center text-[8px] font-black uppercase text-white border-white/10">Rocket</div>
              <div className="glass-card p-3 flex items-center justify-center text-[8px] font-black uppercase text-white border-white/10">Crypto</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Live Chat Integration
  const openLiveChat = () => {
    playSound('click');
    setIsChatOpen(true);
  };

  const { t, formatCurrency } = useI18n();
  const [activeTab, setActiveTab] = useState('home');
  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('favorites') || '[]'));
  
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (gameId: string) => {
    setFavorites(prev => prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]);
  };


  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(5000);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [turnoverRequirement, setTurnoverRequirement] = useState(0);
  const [currentTurnover, setCurrentTurnover] = useState(0);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [overlayContent, setOverlayContent] = useState<string | null>(null);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    // Correctly handle auth persistence and real-time user data
    let unsubUser: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid);
        
        // Subscribe to real-time user data
        if (unsubUser) unsubUser();
        unsubUser = firestoreOnSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            if (user.email === 'ritukhatun7935@gmail.com' && user.emailVerified) {
              setIsAdmin(true);
            } else if (data.role === 'admin') {
              setIsAdmin(true);
            }
          } else {
            // New user registration flow
            const storedRefId = localStorage.getItem('refId');
            const fallbackData = { 
              username: user.displayName || user.email?.split('@')[0] || 'Elite Player', 
              balance: 0, 
              bonusBalance: 0,
              createdAt: new Date().toISOString(),
              uid: user.uid,
              ...(storedRefId ? { referredBy: storedRefId } : {})
            };
            setUserData(fallbackData);
            await setDoc(docRef, fallbackData);
            
            if (storedRefId) {
               try {
                 const referrerRef = doc(db, 'artifacts', appId, 'users', storedRefId);
                 await updateDoc(referrerRef, { 'referralStats.totalSignups': increment(1) });
                 await setDoc(doc(db, 'artifacts', appId, 'referrals', `${storedRefId}_${user.uid}`), {
                   referrerUid: storedRefId,
                   refereeUid: user.uid,
                   refereeName: user.displayName || 'Elite Player',
                   refereeEmail: user.email ? user.email.replace(/(.{3}).*(@.*)/, '$1***$2') : 'No Email',
                   status: 'active',
                   commissionEarned: 0,
                   createdAt: new Date().toISOString()
                 });
                 localStorage.removeItem('refId');
               } catch (e) {
                 console.error("Failed to update referrer", e);
               }
            }
          }
        });
        sendTelegramNotification(`<b>Login:</b> ${user.email}`); 
      } else {
        setIsLoggedIn(false);
        setUserData(null);
        setIsAdmin(false);
        if (unsubUser) {
          unsubUser();
          unsubUser = null;
        }
      }
      setIsAuthReady(true);
    });

    return () => {
      unsubscribe();
      if (unsubUser) unsubUser();
    };
  }, []);

  const tickerMessages = [
    "User ritukhatun7935 won ৳৫,০০০ in Super Ace!",
    "L's Baji: Fastest Deposit & Withdrawal in Bangladesh!",
    "New Jackpot: ৳৫,০০,০০০ in JILI Slots! Play Now.",
    "User ElitePlayer won ৳১২,৫০০ in Aviator!",
    "IPL 2024: Best Odds & Live Exchange only on L's Baji."
  ];

  const [walletInitialTab, setWalletInitialTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [forgotStep, setForgotStep] = useState<'input' | 'code' | 'reset'>('input');
  const [forgotTarget, setForgotTarget] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{email?: string, password?: string, username?: string, phone?: string}>({});

  // --- Sports Betting States ---
  const [matches, setMatches] = useState<any[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [sportsSelectedCat, setSportsSelectedCat] = useState('All');
  const [isLocked, setIsLocked] = useState(true);
  const [betSlip, setBetSlip] = useState<any>(null);
  const [myBets, setMyBets] = useState<any[]>([]);
  // Redundant declaration removed
  const [isStreaming, setIsStreaming] = useState<any>(null);
  const [detailedMatch, setDetailedMatch] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  // Redundant declarations removed
  
  const [profileError, setProfileError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('All');
  
  const [transactions, setTransactions] = useState<any[]>([
    { id: 1, type: 'deposit', amount: '৳৫,০০০', status: 'completed', time: '2026-04-16 20:30' },
    { id: 2, type: 'withdraw', amount: '৳২,০০০', status: 'pending', time: '2026-04-16 21:15' },
    { id: 3, type: 'bet', amount: '৳৫০০', game: 'Aviator', status: 'win', result: '৳১,২০০', time: '2026-04-16 21:40' },
  ]);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showAffiliates, setShowAffiliates] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromoForWallet, setSelectedPromoForWallet] = useState<any>(null);

  useEffect(() => {
    setSelectedProvider('All');
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleUpdateProfile = async () => {
    if (!userData || !auth.currentUser) return;
    setProfileError('');
    
    if (editUsername.length < 3) {
      setProfileError('Username must be at least 3 characters');
      return;
    }
    if (editPhone && !/^\d{10,15}$/.test(editPhone)) {
      setProfileError('Invalid phone number format (10-15 digits)');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        username: editUsername,
        phone: editPhone
      });
      setIsEditingProfile(false);
      playSound('notification');
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      setEditUsername(userData.username || '');
      setEditPhone(userData.phone || '');
    }
  }, [userData]);

  const fetchLiveMarket = useCallback(async (isSilent = false) => {
    if (!isSilent) setSportsLoading(true);
    
    try {
      // First try to load from The Odds API
      const oddsRes = await fetch('/api/odds-v4');
      
      let newMatches: any[] = [];
      
      if (oddsRes.ok) {
        const data = await oddsRes.json();
        if (Array.isArray(data) && data.length > 0) {
          newMatches = data;
        }
      }

      // If we couldn't load Odds API data, use Gemini as fallback
      if (newMatches.length === 0) {
        const fallbackRes = await fetch('/api/sports');
        if (fallbackRes.ok) {
          const text = await fallbackRes.text();
          try {
            const fallbackData = JSON.parse(text);
            if (Array.isArray(fallbackData)) {
               newMatches = fallbackData;
            }
          } catch(e) {
             console.warn("Could not parse sports backup response", e);
          }
        }
      }
      
      if (newMatches.length > 0) {
        setMatches(newMatches);
      } else {
        throw new Error("No valid data fetched");
      }

    } catch (err) {
      console.error("Sports Sync Failed, using fallback", err);
      // Fallback
      setMatches(prev => prev.length === 0 ? [
        { id: 'f1', sport: 'Football', league: 'UEFA Champions League', homeTeam: 'Real Madrid', awayTeam: 'Man City', status: 'Live', score: '2-1', time: '82:00', odds: { home: 1.25, draw: 5.50, away: 8.20 } },
        { id: 'c1', sport: 'Cricket', league: 'IPL 2024', homeTeam: 'CSK', awayTeam: 'MI', status: 'Upcoming', score: '0/0', time: '19:30', odds: { home: 1.85, draw: 15.0, away: 2.10 } },
        { id: 't1', sport: 'Tennis', league: 'ATP Miami', homeTeam: 'Carlos Alcaraz', awayTeam: 'Jannik Sinner', status: 'Live', score: '6-4, 3-2', time: 'Set 2', odds: { home: 1.45, draw: 0, away: 2.80 } },
        { id: 'e1', sport: 'E-Sports', league: 'DOTA 2 TI', homeTeam: 'Team Liquid', awayTeam: 'Gaimin Gladiators', status: 'Upcoming', score: '0-0', time: '22:00', odds: { home: 2.10, draw: 0, away: 1.65 } }
      ] : prev);
    } finally {
      setSportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sports') {
      fetchLiveMarket();
      const interval = setInterval(() => fetchLiveMarket(true), 60000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchLiveMarket]);

  useEffect(() => {
    const oddsTimer = setInterval(() => {
      setMatches(prev => prev.map(match => {
        if (match.status === 'Live') {
          const fluctuate = (v: number) => v > 0 ? Number(Math.max(1.01, v + (Math.random() * 0.1 - 0.05)).toFixed(2)) : 0;
          return {
            ...match,
            odds: {
              home: fluctuate(match.odds.home),
              draw: fluctuate(match.odds.draw),
              away: fluctuate(match.odds.away)
            }
          };
        }
        return match;
      }));
    }, 3000);
    return () => clearInterval(oddsTimer);
  }, []);

  const handlePlaceBet = (stake: number) => {
    if (!userData || userData.balance < stake || stake <= 0 || !betSlip) return;
    
    playSound('click');
    const bet = { 
      ...betSlip, 
      id: Date.now() + Math.random(), 
      time: new Date().toLocaleTimeString(), 
      status: 'Active',
      stake
    };
    setMyBets([bet, ...myBets]);
    
    // Update balance and turnover
    const newBalance = userData.balance - stake;
    const newTurnover = (userData.currentTurnover || 0) + stake;
    
    setUserData({ ...userData, balance: newBalance, currentTurnover: newTurnover });
    setBalance(newBalance);
    setCurrentTurnover(newTurnover);
    
    if (auth.currentUser) {
      updateDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid), { 
        balance: newBalance,
        currentTurnover: newTurnover
      });

      // Update referral wager tracking
      if (userData.referredBy) {
        const referralRef = doc(db, 'artifacts', appId, 'referrals', `${userData.referredBy}_${auth.currentUser.uid}`);
        getDoc(referralRef).then(async (snap) => {
          if (snap.exists()) {
            const refData = snap.data();
            const newTotalWagered = (refData.totalWagered || 0) + stake;
            await updateDoc(referralRef, { totalWagered: newTotalWagered });

            // Check for 100 BDT bonus trigger
            if (!refData.bonusClaimed && newTotalWagered >= 1000 && (refData.totalDeposited || 0) >= 500) {
              const referrerRef = doc(db, 'artifacts', appId, 'users', userData.referredBy);
              await updateDoc(referrerRef, {
                referralEarnings: increment(100),
                totalReferralEarnings: increment(100)
              });
              await updateDoc(referralRef, { bonusClaimed: true, status: 'active' });
            }
          }
        });
      }
    }
    
    setBetSlip(null);
    setOverlayContent('bet_success');
    
    // Simulate match result after 10 seconds
    setTimeout(async () => {
      const isWin = Math.random() > 0.5;
      
      // ... affiliate commission logic ...
      
      if (isWin) {
        playSound('win');
        const winnings = stake * (bet.odds || 2);
        const finalBalance = (userData.balance - stake) + winnings; 
        
        setUserData(prev => ({ ...prev, balance: finalBalance }));
        setBalance(finalBalance);
        
        addNotification(
          "You Won!", 
          `Congratulations! Your bet on ${bet.selection} won ৳${winnings.toFixed(2)}`,
          'win'
        );
        
        // ... 
        if (auth.currentUser) {
            try {
              const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
              await updateDoc(docRef, { balance: finalBalance });
  
              // Update referral win stats
              if (userData.referredBy) {
                const referrerRef = doc(db, 'artifacts', appId, 'users', userData.referredBy);
                await updateDoc(referrerRef, {
                  'referralStats.refereeWins': increment(winnings)
                });
              }
            } catch (e) {
              console.error("Win update failed", e);
            }
        }
      } else {
        playSound('lose');
        
        addNotification(
          "Bet Lost", 
          `Your bet on ${bet.selection} lost. Better luck next time!`,
          'account'
        );
      }
    }, 10000);
    
    setTimeout(() => setOverlayContent(null), 2000);
  };

  const filteredMatches = useMemo(() => {
    let filtered = matches;
    if (sportsSelectedCat !== 'All') {
      filtered = matches.filter(m => m.sport === sportsSelectedCat);
    }
    return filtered;
  }, [matches, sportsSelectedCat]);

  const sportsCategories = [
    { name: 'All', icon: Globe },
    { name: 'Cricket', icon: Target },
    { name: 'Football', icon: Flame },
    { name: 'Tennis', icon: Trophy },
    { name: 'E-Sports', icon: Gamepad2 },
  ];

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const banners = [
    { 
      color: "from-blue-600 to-indigo-900", 
      title: "CRAZY TIME", 
      text: "অবিশ্বাস্য ৫৫% বোনাস নিয়ে এসেছে ক্রেজি টাইম লাইভ ক্যাসিনো!", 
      img: "https://i.ibb.co/fzCbCwSn/Gemini-Generated-Image-jngh67jngh67jngh.png" 
    },
    { 
      color: "from-purple-600 to-pink-900", 
      title: "MEGA BONUS", 
      text: "নতুন ধামাকা অফার আসছে!", 
      img: "https://i.ibb.co/TBTVnzwH/Gemini-Generated-Image-4i4mll4i4mll4i4m.png" 
    },
    { 
      color: "from-yellow-600 to-red-900", 
      title: "SPORTS SPECIAL", 
      text: "১০০% ম্যাচ বোনাস ধামাকা!", 
      img: "https://i.ibb.co/sdQyBcZw/Gemini-Generated-Image-r4k4yer4k4yer4k4.png" 
    }
  ];

  useEffect(() => {
    const tInterval = setInterval(() => setTickerIndex(p => (p + 1) % tickerMessages.length), 4000);
    return () => clearInterval(tInterval);
  }, []);

  useEffect(() => {
    const bInterval = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 8000);
    const sHandler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', sHandler);
    return () => { clearInterval(bInterval); window.removeEventListener('scroll', sHandler); };
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !isLoggedIn) {
      setNotifications([]);
      return;
    }

    // Listen to real-time notifications
    const q = query(
      collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'notifications'),
      orderBy('time', 'desc'),
      limit(50)
    );

    const unsubscribe = firestoreOnSnapshot(q, (snapshot) => {
      const newNotifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifs);
    });

    return () => unsubscribe();
  }, [isLoggedIn, auth.currentUser]);

  const handleMarkNotificationRead = async (notiId: string) => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'notifications', notiId);
      await updateDoc(docRef, { read: true });
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const addNotification = async (title: string, text: string, type: 'promo' | 'update' | 'account' | 'win' = 'update') => {
    if (!auth.currentUser) return;
    try {
      const notiRef = collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'notifications');
      await addDoc(notiRef, {
        title,
        text,
        read: false,
        time: new Date().toISOString(),
        type
      });
    } catch (e) {
      console.error("Notif error:", e);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending code
    setTimeout(() => {
      setForgotStep('code');
      setLoading(false);
    }, 1500);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate code verification
    setTimeout(() => {
      setForgotStep('reset');
      setLoading(false);
    }, 1500);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate password reset
    setTimeout(() => {
      setAuthMode('login');
      setForgotStep('input');
      setLoading(false);
    }, 1500);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // --- Validation ---
    const newFieldErrors: {email?: string, password?: string, username?: string, phone?: string} = {};
    if (authMode === 'signup') {
      if (username.length < 3) newFieldErrors.username = 'Username must be at least 3 characters';
      if (!/^\d{10,15}$/.test(phone)) newFieldErrors.phone = 'Invalid phone number format (10-15 digits)';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newFieldErrors.email = 'Invalid email address';
    if (password.length < 6) newFieldErrors.password = 'Password must be at least 6 characters';

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: username });

        // Telegram Notification for New User
        sendTelegramNotification(`<b>New User Registered:</b>\nEmail: ${email}\nUID: ${userCred.user.uid}`);

        const userRef = doc(db, 'artifacts', appId, 'users', userCred.user.uid);
        const referralCode = `ELITE${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        let referredBy = '';
        if (referralCodeInput) {
          try {
            const usersRef = collection(db, 'artifacts', appId, 'users');
            const q = query(usersRef, where('referralCode', '==', referralCodeInput.toUpperCase()), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const referrerDoc = querySnapshot.docs[0];
              referredBy = referrerDoc.id;
              
              // Create referral record
              await setDoc(doc(db, 'artifacts', appId, 'referrals', `${referredBy}_${userCred.user.uid}`), {
                referrerUid: referredBy,
                refereeUid: userCred.user.uid,
                refereeUsername: username,
                status: 'pending',
                totalDeposited: 0,
                totalWagered: 0,
                bonusClaimed: false,
                commissionEarned: 0,
                timestamp: new Date().toISOString()
              });

              // Increment referrer's count
              await updateDoc(referrerDoc.ref, {
                referralCount: increment(1)
              });
            }
          } catch (e) {
            console.error("Referral tracking failed", e);
          }
        }

        const initialData = {
          username,
          phone,
          email,
          balance: 0,
          coins: 0,
          referralCode,
          referredBy,
          referralEarnings: 0,
          totalReferralEarnings: 0,
          referralCount: 0,
          referralStats: { refereeWins: 0, refereeLosses: 0 },
          totalDeposit: 0,
          currentTurnover: 0,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, initialData);
        setUserData(initialData);
      }
    } catch (err: any) {
      let msg = err.message.replace('Firebase:', '').trim();
      if (msg.includes('auth/operation-not-allowed')) {
        msg = "Email/Password sign-in is not enabled in Firebase Console. Please enable it to continue.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleDeposit = () => {
    setWalletInitialTab('deposit');
    setSelectedPromoForWallet(null);
    setOverlayContent('wallet');
  };

  const handleDepositWithPromo = (promo: any) => {
    setWalletInitialTab('deposit');
    setSelectedPromoForWallet(promo);
    setOverlayContent('wallet');
  };

  const handleWithdraw = () => {
    setWalletInitialTab('withdraw');
    setOverlayContent('wallet');
  };

  const refreshBalance = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    } catch (e) {}
  };

  const handleWalletSuccess = async (amount: number, type: 'deposit' | 'withdraw', bonus?: any) => {
    if(!userData || !auth.currentUser) return;
    
    let amountToAdd = type === 'deposit' ? amount : -amount;
    let newBalance = (userData.balance || 0) + amountToAdd;
    let newBonusBalance = userData.bonusBalance || 0;
    let newTurnoverRequirement = userData.turnoverRequirement || 0;
    let updatedUserData = { ...userData };

    if (type === 'deposit' && bonus) {
      if (bonus.id === 'crazy_time' && userData.welcomeBonusClaimed) {
        showToast("You have already claimed this bonus!", "error");
        return;
      }

      const bonusAmount = Math.min(amount * bonus.bonusPercent, bonus.maxBonus);
      newBonusBalance += bonusAmount;
      
      let multiplier = 1;
      if (bonus.id === 'crazy_time') multiplier = 14;
      else if (bonus.id === 'promo2') multiplier = 10;
      else if (bonus.id === 'promo3') multiplier = 5;
      
      newTurnoverRequirement += (amount + bonusAmount) * multiplier;
      
      if (bonus.id === 'crazy_time') {
        updatedUserData.welcomeBonusClaimed = true;
      }
      
      playSound('notification');
    }

    const newTransaction = {
      id: Date.now(),
      amount,
      type,
      time: new Date().toLocaleString(),
      status: 'Completed'
    };
    setTransactions(prev => [newTransaction, ...prev]);

    setUserData({
      ...updatedUserData,
      balance: newBalance, 
      bonusBalance: newBonusBalance, 
      turnoverRequirement: newTurnoverRequirement 
    });
    setBalance(newBalance);
    setBonusBalance(newBonusBalance);
    setTurnoverRequirement(newTurnoverRequirement);

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { 
        balance: newBalance,
        bonusBalance: newBonusBalance,
        turnoverRequirement: newTurnoverRequirement,
        totalDeposited: (userData.totalDeposited || 0) + (type === 'deposit' ? amount : 0)
      });

      // Save transaction to subcollection
      const txRef = doc(collection(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'transactions'));
      await setDoc(txRef, newTransaction);                

      // Deposit/Withdraw Telegram Notification
      sendTelegramNotification(`<b>${type.toUpperCase()} Successful:</b>\nUser: ${auth.currentUser?.email}\nAmount: ৳${amount}`);

      // Update referral deposit tracking
      if (type === 'deposit' && userData.referredBy) {
        const referralRef = doc(db, 'artifacts', appId, 'referrals', `${userData.referredBy}_${auth.currentUser.uid}`);
        const refSnap = await getDoc(referralRef);
        if (refSnap.exists()) {
          const refData = refSnap.data();
          const newTotalDep = (refData.totalDeposited || 0) + amount;
          await updateDoc(referralRef, { totalDeposited: newTotalDep });
          
          // Check for 100 BDT bonus trigger (500 dep + 1000 bet)
          if (!refData.bonusClaimed && newTotalDep >= 500 && (refData.totalWagered || 0) >= 1000) {
            const referrerRef = doc(db, 'artifacts', appId, 'users', userData.referredBy);
            await updateDoc(referrerRef, {
              referralEarnings: increment(100),
              totalReferralEarnings: increment(100)
            });
            await updateDoc(referralRef, { bonusClaimed: true, status: 'active' });
          }
        }
      }
    } catch (e) {
      console.error("Failed to update wallet:", e);
    }
  };

  const handleUpdateCoins = async (newCoins: number) => {
    if (!auth.currentUser) return;
    setUserData({ ...userData, coins: newCoins });
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { coins: newCoins });
    } catch (e) {
      console.error("Error updating coins:", e);
    }
  };

  const handleTransferAffiliateEarnings = async () => {
    if (!auth.currentUser || !userData?.referralEarnings || userData.referralEarnings <= 0) {
      showToast("No earnings to transfer", "info");
      return;
    }
    
    setLoading(true);
    try {
      const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
      const amount = userData.referralEarnings;
      
      await updateDoc(userRef, {
        balance: increment(amount),
        referralEarnings: 0
      });
      
      showToast(`Successfully moved ৳${amount} to your gaming wallet!`, 'success');
      playSound('win');
    } catch (e) {
      console.error("Transfer failed:", e);
      showToast("Transfer failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const [selectedGameToLaunch, setSelectedGameToLaunch] = useState<string | null>(null);

  const handleGameLaunch = (gameId: string) => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setOverlayContent(null);
      return;
    }
    
    // Internal Games
    if (gameId === 'av1') {
      setOverlayContent('aviator');
    } else if (gameId === 'cc1') {
      setOverlayContent('cricket-crash');
    } else if (gameId === 'sa1' || gameId === 'sl1') {
      setOverlayContent('super-ace');
    } else if (gameId === 'cs3' || gameId === 'ar1' || gameId === 'ct1') {
      setOverlayContent('crazy-time');
    } else if (gameId === 'cny1') {
      setOverlayContent('chinese-new-year');
    } else {
      // Launch via RapidAPI for external providers
      setSelectedGameToLaunch(gameId);
      setOverlayContent('casino_launch');
    }
  };

  const hideHeader = (isLoggedIn && (activeTab !== 'home' && activeTab !== 'profile')) || overlayContent !== null;

  if (!isAuthReady) {
    return (
      <div className="fixed inset-0 bg-[#0d1110] flex flex-col items-center justify-center z-[1000]">
        <StylishLogo size="text-5xl" />
        <div className="mt-12 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden relative border border-white/5 shadow-2xl">
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent shadow-[0_0_25px_#eab308]"
          />
        </div>
        <p className="mt-8 text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] animate-pulse">Initializing Elite Ecosystem...</p>
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="h-[100dvh] flex flex-col overflow-hidden text-gray-100 bg-[#0d1110]">
      
      {/* Overlays */}
      <AnimatePresence>
        <motion.div key="sidebar" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}>
          <SidebarOverlay 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            user={auth.currentUser} 
            userData={userData}
            isAdmin={isAdmin}
            onNavigate={(page) => {
              if (page === 'affiliates') setShowAffiliates(true);
              else if (page === 'download_app') setShowDownloadApp(true);
              else if (page === 'admin') setOverlayContent('admin');
              else setOverlayContent(page);
            }} 
            showToast={showToast} 
          />
        </motion.div>
        {overlayContent === 'promotion' && (
          <motion.div key="promo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PromotionOverlay onClose={() => setOverlayContent(null)} onDeposit={handleDepositWithPromo} />
          </motion.div>
        )}
        {overlayContent === 'help' && (
          <motion.div key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HelpCenterOverlay onClose={() => setOverlayContent(null)} onOpenChat={() => setIsChatOpen(true)} />
          </motion.div>
        )}
        {overlayContent === 'about' && (
          <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AboutUsOverlay onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {showAffiliates && (
          <motion.div key="affiliates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AffiliatesOverlay 
              onClose={() => setShowAffiliates(false)} 
              showToast={showToast} 
              user={auth.currentUser}
              userData={userData}
              appId={appId}
              onTransferEarnings={handleTransferAffiliateEarnings}
            />
          </motion.div>
        )}
        {showDownloadApp && (
          <motion.div key="download" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <DownloadAppOverlay onClose={() => setShowDownloadApp(false)} />
          </motion.div>
        )}
        {overlayContent === 'contact' && (
          <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <ContactUsOverlay onClose={() => setOverlayContent(null)} onOpenCallBook={() => setOverlayContent('call_book')} />
          </motion.div>
        )}
        {overlayContent === 'call_book' && (
          <motion.div key="call_book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <ContactCallForm onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {overlayContent === 'notifications' && (
          <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <NotificationOverlay 
              notifications={notifications} 
              onClose={() => setOverlayContent(null)} 
              onMarkRead={handleMarkNotificationRead}
            />
          </motion.div>
        )}
        {overlayContent === 'image' && (
          <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <ImageGenerator onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {overlayContent === 'wallet' && (
          <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <WalletModal onClose={() => setOverlayContent(null)} onSuccess={handleWalletSuccess} currentBalance={userData?.balance || 0} initialTab={walletInitialTab} initialPromo={selectedPromoForWallet} />
          </motion.div>
        )}
        {overlayContent === 'spin' && (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <SpinWheelOverlay onClose={() => setOverlayContent(null)} onUpdateBalance={(amount) => handleWalletSuccess(amount, 'deposit')} currentCoins={userData?.coins || 0} onUpdateCoins={handleUpdateCoins} userData={userData} auth={auth} />
          </motion.div>
        )}
        {overlayContent === 'referral' && (
          <motion.div key="referral" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <ReferralOverlay onClose={() => setOverlayContent(null)} userData={userData} auth={auth} appId={appId} db={db} onUpdateBalance={(amount) => handleWalletSuccess(amount, 'deposit')} />
          </motion.div>
        )}
        {overlayContent === 'admin' && (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <AdminOverlay onClose={() => setOverlayContent(null)} showToast={showToast} appId={appId} />
          </motion.div>
        )}
        {overlayContent === 'ewallet_agent' && (
          <motion.div key="ewallet_agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <EWalletAgentOverlay onClose={() => setOverlayContent(null)} userData={userData} />
          </motion.div>
        )}
        {overlayContent === 'trading' && (
          <motion.div key="trading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800]">
            <TradingPlatform onClose={() => setOverlayContent(null)} balance={userData?.balance || 0} onUpdateBalance={(newBal) => handleWalletSuccess(Math.abs(newBal - (userData?.balance || 0)), newBal > (userData?.balance || 0) ? 'deposit' : 'withdraw')} />
          </motion.div>
        )}
        {overlayContent === 'aviator' && (
          <motion.div key="aviator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800]">
            <AviatorGame onClose={() => setOverlayContent(null)} balance={userData?.balance || 0} onUpdateBalance={(newBal) => handleWalletSuccess(Math.abs(newBal - (userData?.balance || 0)), newBal > (userData?.balance || 0) ? 'deposit' : 'withdraw')} />
          </motion.div>
        )}
        {overlayContent === 'cricket-crash' && (
          <motion.div key="cricket-crash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800]">
            <CricketCrash onClose={() => setOverlayContent(null)} balance={userData?.balance || 0} onUpdateBalance={(newBal) => handleWalletSuccess(Math.abs(newBal - (userData?.balance || 0)), newBal > (userData?.balance || 0) ? 'deposit' : 'withdraw')} />
          </motion.div>
        )}
        {overlayContent === 'super-ace' && (
          <motion.div key="super-ace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800]">
            <SuperAce onClose={() => setOverlayContent(null)} balance={userData?.balance || 0} onUpdateBalance={(newBal) => handleWalletSuccess(Math.abs(newBal - (userData?.balance || 0)), newBal > (userData?.balance || 0) ? 'deposit' : 'withdraw')} />
          </motion.div>
        )}
        {overlayContent === 'crazy-time' && (
          <motion.div key="crazy-time" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800]">
            <CrazyTime onClose={() => setOverlayContent(null)} balance={userData?.balance || 0} onUpdateBalance={(newBal) => handleWalletSuccess(Math.abs(newBal - (userData?.balance || 0)), newBal > (userData?.balance || 0) ? 'deposit' : 'withdraw')} />
          </motion.div>
        )}
        {overlayContent === 'chinese-new-year' && (
          <motion.div key="chinese-new-year" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[800]">
            <ChineseNewYear onClose={() => setOverlayContent(null)} balance={userData?.balance || 0} onUpdateBalance={(newBal) => handleWalletSuccess(Math.abs(newBal - (userData?.balance || 0)), newBal > (userData?.balance || 0) ? 'deposit' : 'withdraw')} />
          </motion.div>
        )}
        {overlayContent === 'casino_launch' && selectedGameToLaunch && (
          <motion.div key="casino_launch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1200]">
            <CasinoGameOverlay 
              gameId={selectedGameToLaunch} 
              username={userData?.username || auth.currentUser?.email?.split('@')[0] || 'elite_player'} 
              balance={userData?.balance || 0}
              onClose={() => setOverlayContent(null)} 
            />
          </motion.div>
        )}
        {overlayContent === 'privacy' && (
          <motion.div key="privacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <PrivacyPolicyOverlay onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {overlayContent === 'tasks' && (
          <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <TaskManagementOverlay onClose={() => setOverlayContent(null)} userData={userData} auth={auth} appId={appId} db={db} />
          </motion.div>
        )}
        {overlayContent === 'terms' && (
          <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <TermsAndConditionsOverlay onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {overlayContent === 'transactions' && (
          <motion.div key="transactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <TransactionHistoryOverlay transactions={transactions} onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {overlayContent === 'bet_history' && (
          <motion.div key="bet_history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <BetHistoryOverlay bets={myBets} onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {overlayContent === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000]">
            <LeaderboardOverlay onClose={() => setOverlayContent(null)} />
          </motion.div>
        )}
        {isChatOpen && (
          <motion.div key="chatbot" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[1100] md:p-4 pointer-events-none flex justify-end items-end">
            <div className="w-full h-full md:w-[400px] md:h-[600px] pointer-events-auto shadow-2xl">
              <ChatBot onClose={() => setIsChatOpen(false)} isAdmin={isAdmin} />
            </div>
          </motion.div>
        )}
        {overlayContent === 'bet_success' && (
          <div key="bet_success" className="fixed inset-0 z-[1100] flex items-center justify-center pointer-events-none">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-green-500 text-black px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">
              <CheckCircle size={24} /> Bet Placed Successfully!
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {betSlip && (
        <div className="fixed inset-0 z-[1000]">
          <BetSlipOverlay 
            bet={betSlip} 
            balance={userData?.balance || 0} 
            onConfirm={handlePlaceBet} 
            onClose={() => setBetSlip(null)} 
          />
        </div>
      )}

      {isStreaming && (
        <div className="fixed inset-0 z-[1000]">
          <LiveStreamOverlay 
            match={isStreaming} 
            onClose={() => setIsStreaming(null)} 
          />
        </div>
      )}
      
      {detailedMatch && (
        <div className="fixed inset-0 z-[1000]">
          <MatchMarketsOverlay
            match={detailedMatch}
            onClose={() => setDetailedMatch(null)}
            onPlaceBet={(match, selection, odds) => {
              setDetailedMatch(null); // Close detailed view to open bet slip
              setBetSlip({ match, selection, odds });
            }}
          />
        </div>
      )}

      {!isLoggedIn && isAuthReady && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-md p-10 my-auto shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
          >
            <div className="flex justify-center mb-10 scale-125">
              <StylishLogo size="text-3xl" />
            </div>

            <div className="text-center mb-8 pt-3 border-t border-white/5">
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">
                {authMode === 'login' ? 'Login Page' : authMode === 'signup' ? 'Signup Page' : 'Forgot Password'}
              </h2>
              <p className="text-[11px] uppercase font-bold text-gray-400 tracking-widest">
                {authMode === 'login' ? 'Login to your Elite account' : authMode === 'signup' ? 'Create a new Elite account' : 'Recover your account access'}
              </p>
            </div>

            {authMode === 'forgot' ? (
              <div className="space-y-6">
                 {forgotStep === 'input' && (
                   <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <p className="text-[10px] text-gray-500 font-bold uppercase text-center mb-4">Enter your registered Email or Phone</p>
                      <input type="text" placeholder="Email or Phone Number" className="w-full glass-input rounded-2xl py-4 px-6 text-sm" value={forgotTarget} onChange={(e) => setForgotTarget(e.target.value)} required />
                      <button className="w-full bg-yellow-500 text-black py-4.5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all">
                        {loading ? 'Sending Code...' : 'Send Recovery Code'}
                      </button>
                   </form>
                 )}
                 {forgotStep === 'code' && (
                   <form onSubmit={handleCodeSubmit} className="space-y-4">
                      <p className="text-[10px] text-gray-500 font-bold uppercase text-center mb-4">Enter the 6-digit code sent to {forgotTarget}</p>
                      <input type="text" maxLength={6} placeholder="000000" className="w-full glass-input rounded-2xl py-4 px-6 text-center text-2xl font-black tracking-[0.5em]" required />
                      <button className="w-full bg-yellow-500 text-black py-4.5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all">
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                   </form>
                 )}
                 {forgotStep === 'reset' && (
                   <form onSubmit={handleResetSubmit} className="space-y-4">
                      <p className="text-[10px] text-gray-500 font-bold uppercase text-center mb-4">Set your new secure password</p>
                      <input type="password" placeholder="New Password" className="w-full glass-input rounded-2xl py-4 px-6 text-sm" required />
                      <input type="password" placeholder="Confirm Password" className="w-full glass-input rounded-2xl py-4 px-6 text-sm" required />
                      <button className="w-full bg-yellow-500 text-black py-4.5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all">
                        {loading ? 'Updating...' : 'Reset Password'}
                      </button>
                   </form>
                 )}
                 <button onClick={() => setAuthMode('login')} className="w-full text-xs text-gray-500 font-black uppercase tracking-widest hover:text-white transition-colors">Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <>
                    <div>
                      <input type="text" placeholder="Username" className={`w-full glass-input rounded-2xl py-4 px-6 text-sm ${fieldErrors.username ? 'border-red-500/50' : ''}`} value={username} onChange={(e) => setUsername(e.target.value)} required />
                      {fieldErrors.username && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold">{fieldErrors.username}</p>}
                    </div>
                    <div>
                      <input type="tel" placeholder="Phone Number" className={`w-full glass-input rounded-2xl py-4 px-6 text-sm ${fieldErrors.phone ? 'border-red-500/50' : ''}`} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                      {fieldErrors.phone && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold">{fieldErrors.phone}</p>}
                    </div>
                    <input type="text" placeholder="Referral Code (Optional)" className="w-full glass-input rounded-2xl py-4 px-6 text-sm" value={referralCodeInput} onChange={(e) => setReferralCodeInput(e.target.value)} />
                  </>
                )}
                <div>
                  <input type="email" placeholder="Email Address" className={`w-full glass-input rounded-2xl py-4 px-6 text-sm ${fieldErrors.email ? 'border-red-500/50' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  {fieldErrors.email && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold">{fieldErrors.email}</p>}
                </div>
                <div>
                  <input type="password" placeholder="Password" className={`w-full glass-input rounded-2xl py-4 px-6 text-sm ${fieldErrors.password ? 'border-red-500/50' : ''}`} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {fieldErrors.password && <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold">{fieldErrors.password}</p>}
                </div>

                {authMode === 'login' && (
                  <div className="flex justify-between items-center px-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="accent-yellow-500" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                      <span className="text-[10px] uppercase font-bold text-gray-400">Remember Me</span>
                    </label>
                    <button type="button" onClick={() => setAuthMode('forgot')} className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest hover:text-yellow-500 transition-colors">Forgot Password?</button>
                  </div>
                )}

                {error && <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-lg border border-red-500/20">{error}</p>}
                
                <button className="w-full bg-yellow-500 text-black py-4.5 rounded-2xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all ripple-effect">
                  {loading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Sign Up')}
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-5">
              <p className="text-xs text-gray-400">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-yellow-500 font-black ml-2 uppercase underline underline-offset-4">
                  {authMode === 'login' ? 'Register' : 'Login'}
                </button>
              </p>
              <div className="flex gap-8 text-[11px] font-bold text-gray-500 uppercase tracking-widest pt-2">
                <span onClick={() => setOverlayContent('about')} className="cursor-pointer hover:text-yellow-500 transition-colors">About Us</span>
                <span onClick={() => setOverlayContent('privacy')} className="cursor-pointer hover:text-yellow-500 transition-colors">Privacy</span>
                <span onClick={() => setOverlayContent('terms')} className="cursor-pointer hover:text-yellow-500 transition-colors">Terms</span>
                <span onClick={() => setOverlayContent('contact')} className="cursor-pointer hover:text-yellow-500 flex items-center gap-1.5 transition-colors">Contact <Phone size={11}/></span>
              </div>
              <div className="flex flex-col items-center gap-4 mt-4 opacity-40">
                <StylishLogo size="text-xl" />
                <div 
                  onClick={openLiveChat}
                  className="flex items-center gap-2.5 bg-yellow-500/20 border border-yellow-500/40 px-4 py-2 rounded-full cursor-pointer hover:bg-yellow-500/30 transition-all"
                >
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_#eab308]"></div>
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">24/7 CS</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}


      <header className={`fixed top-0 left-0 right-0 z-[600] transition-all duration-700 ease-in-out px-5 py-4 flex justify-between items-center ${scrolled || activeTab === 'profile' ? 'nav-blur border-b border-white/10' : ''} ${hideHeader ? '-translate-y-full opacity-0 scale-95 pointer-events-none' : 'translate-y-0 opacity-100 scale-100'}`}>
        <div className="flex items-center gap-4">
          <Menu onClick={() => { playSound('click'); setIsSidebarOpen(true); }} className="text-yellow-500 cursor-pointer hover:scale-110 transition-transform" size={24}/>
          <div className="scale-75 origin-left">
            <StylishLogo />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SettingsToggle />
          <div 
            onClick={() => { playSound('click'); setOverlayContent('notifications'); }}
            className="relative p-2 bg-white/5 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          >
            <Bell size={20} className="text-gray-400" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-[#0d1110]"></span>
            )}
          </div>
          <div 
            onClick={() => { playSound('click'); openLiveChat(); }}
            className="flex flex-col items-center justify-center p-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer hover:bg-yellow-500/30 transition-all ripple-effect w-12 h-12"
          >
            <span className="text-[10px] font-black text-yellow-500 leading-none">LS</span>
            <span className="text-[6px] font-black text-yellow-500 uppercase leading-none mt-0.5">Live Chat</span>
          </div>
        </div>
      </header>

      {/* Chat Bot Overlay */}

      <main className={`flex-1 overflow-y-auto overscroll-y-contain ${hideHeader ? 'pt-4' : 'pt-24'} px-5 pb-24 max-w-lg mx-auto w-full no-scrollbar transition-all duration-500`}>
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            userData ? (
              <motion.div
                key="profile-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 text-white/5">
                      <ShieldCheck size={170} />
                    </div>
                    <div className="flex items-center gap-5 mb-5 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)] relative group">
                        <img src="/profile-logo.png" alt="Profile" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300" onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/user/200/200'; }} />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                      </div>
                      <div className="flex-1">
                        {isEditingProfile ? (
                          <div className="space-y-2">
                            <input 
                              type="text" 
                              value={editUsername} 
                              onChange={(e) => setEditUsername(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                              placeholder="Username"
                            />
                            <input 
                              type="tel" 
                              value={editPhone} 
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-yellow-500 outline-none"
                              placeholder="Phone"
                            />
                            {profileError && <p className="text-red-500 text-[10px] font-bold">{profileError}</p>}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl font-black text-white italic">{userData?.username || 'Elite Player'}</h2>
                              <CheckCircle2 size={16} className="text-green-500" />
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                              Joined: {userData?.createdAt ? formatDateTime(userData.createdAt) : '...'}
                            </p>
                          </>
                        )}
                      </div>
                      <button 
                        onClick={() => { playSound('click'); isEditingProfile ? handleUpdateProfile() : setIsEditingProfile(true); }}
                        className="p-2 bg-white/5 rounded-xl border border-white/10 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
                      >
                        {isEditingProfile ? (loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />) : <UserCircle size={18} />}
                      </button>
                    </div>
                    <div className="pt-5 border-t border-white/5 flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[10px] text-yellow-500 font-bold uppercase mb-1 flex items-center gap-1.5"><Wallet size={11} /> Main Wallet</p>
                        <h3 className="text-3xl font-black text-white italic leading-none">{formatCurrency(userData?.balance || 0)}</h3>
                      </div>
                      <div onClick={refreshBalance} className="bg-[#1a1a1a] p-3.5 rounded-xl border border-white/5 active:rotate-180 transition-transform cursor-pointer shadow-lg shadow-black/50">
                        <RefreshCw size={20} className="text-yellow-500" />
                      </div>
                    </div>

                    {/* Bonus Turnover Progress */}
                    {userData?.turnoverRequirement > 0 && (
                      <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Zap size={11} className="text-yellow-500" /> Bonus Turnover Progress
                          </p>
                          <p className="text-[10px] font-mono font-black text-yellow-500">
                             {formatCurrency(userData?.totalWagered || 0)} / {formatCurrency(userData?.turnoverRequirement)}
                          </p>
                        </div>
                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(((userData?.totalWagered || 0) / (userData?.turnoverRequirement || 1)) * 100, 100)}%` }}
                            className="h-full bg-yellow-500 shadow-[0_0_10px_#eab308]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

              <SectionTitle title="AI & Trading (এআই ও ট্রেডিং)" />
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setOverlayContent('trading')} 
                  className="w-full flex items-center justify-center gap-5 p-7 bg-white/5 backdrop-blur-[40px] border border-white/20 hover:border-yellow-500/50 hover:bg-white/10 transition-all duration-700 shadow-[0_25px_60px_rgba(0,0,0,0.5)] group relative overflow-hidden rounded-[2.5rem]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500"></div>
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-500/20 blur-[60px] rounded-full group-hover:bg-yellow-500/30 transition-all duration-700"></div>
                  <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700"></div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
                    <TrendingUp size={40} className="text-yellow-500 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] relative z-10" />
                  </div>
                  
                  <div className="text-left relative z-10">
                    <span className="block text-2xl font-black text-white uppercase tracking-tighter italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">L's Trading Pro</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">AI Financial Engine v2.0</span>
                    </div>
                  </div>
                  
                  <div className="ml-auto flex flex-col items-end relative z-10">
                    <Zap size={24} className="text-yellow-500 animate-bounce mb-1" />
                    <span className="text-[8px] font-black text-yellow-500/60 uppercase tracking-widest">Live Now</span>
                  </div>
                </button>
              </div>

              <SectionTitle title="Funds (তহবিল)" />
              <div className="grid grid-cols-3 gap-3">
                <ProfileGridItem onClick={handleDeposit} icon={Wallet} label="Deposit (+500)" />
                <ProfileGridItem onClick={handleWithdraw} icon={ArrowUpCircle} label="Withdraw" />
                <ProfileGridItem onClick={() => setOverlayContent('spin')} icon={RefreshCw} label="L's Baji Spin" />
              </div>

              <SectionTitle title="Promotion (আমার প্রচার)" />
              <div className="grid grid-cols-4 gap-2.5">
                <ProfileGridItem icon={Gift} label="Bonus" onClick={() => setOverlayContent('promotion')} />
                <ProfileGridItem icon={Share2} label="Referral" onClick={() => setOverlayContent('referral')} />
                <ProfileGridItem icon={Trophy} label="Leaderboard" onClick={() => setOverlayContent('leaderboard')} />
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    playSound('click');
                    // Roulette-style animation logic
                    const winCoins = Math.floor(Math.random() * (500 - 10 + 1)) + 10;
                    showToast(`Congratulations! You won ${winCoins} L's Baji Coins!`, "success");
                    handleUpdateCoins((userData?.coins || 0) + winCoins);
                  }}
                  className="flex flex-col items-center justify-center p-3 glass-card active:scale-95 transition-all cursor-pointer"
                >
                  <div className="relative text-yellow-500 mb-2">
                    <RefreshCw size={22} className="animate-spin-slow" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-200 text-center uppercase leading-tight">Free Spin</span>
                </motion.div>
              </div>

              <SectionTitle title="History (হিস্ট্রি)" />
              <div className="grid grid-cols-3 gap-3">
                <ProfileGridItem onClick={() => setOverlayContent('bet_history')} icon={History} label="My Wagers" badge={myBets.length > 0 ? myBets.length : undefined} />
                <ProfileGridItem icon={TrendingUp} label="Turnover" />
                <ProfileGridItem onClick={() => setOverlayContent('transactions')} icon={ClipboardList} label="Trans." />
              </div>

                  <SectionTitle title="Personal (আমার)" />
                  <div className="grid grid-cols-4 gap-3">
                    <ProfileGridItem onClick={() => setOverlayContent('tasks')} icon={CheckCircle} label="Tasks" />
                    <ProfileGridItem onClick={() => setIsEditingProfile(!isEditingProfile)} icon={UserCircle} label={isEditingProfile ? "Cancel" : "Profile"} />
                    <ProfileGridItem onClick={() => setOverlayContent('privacy')} icon={Shield} label="Privacy" />
                    <ProfileGridItem onClick={() => setOverlayContent('terms')} icon={Gavel} label="Terms" />
                    <ProfileGridItem onClick={toggleTheme} icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? "Light Mode" : "Dark Mode"} />
                  </div>

              <SectionTitle title="Contact (যোগাযোগ)" />
              <div className="grid grid-cols-4 gap-2.5 mb-12">
                <ProfileGridItem onClick={openLiveChat} icon={Headphones} label="24/7 CS" />
                <ProfileGridItem icon={Phone} onClick={() => { playSound('click'); setOverlayContent('contact'); }} label="কল বুক করুন (Call)" />
                <ProfileGridItem onClick={() => window.open('https://wa.me/message/YOUR_WHATSAPP', '_blank')} icon={MessageSquare} label="WhatsApp" />
                <ProfileGridItem onClick={() => window.location.href = 'mailto:support@lsbaji.com'} icon={Mail} label="Email" />
              </div>

              <div className="pb-10">
                <button onClick={handleLogout} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <LogOut size={20} />
                  Logout Account
                </button>
              </div>
              </motion.div>
            ) : (
              <motion.div
                key="profile-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[60vh] space-y-6 px-10 text-center"
              >
                <div className="relative">
                  <Loader2 className="text-yellow-500 animate-spin" size={64} />
                  <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-black text-white uppercase tracking-[0.3em]">Loading Profile</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Please wait while we sync your data...</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                >
                  Refresh Page
                </button>
              </motion.div>
            )
          ) : (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 space-y-6"
            >
              {/* Content */}
              <div className={!isLoggedIn ? 'opacity-40 pointer-events-none filter blur-md' : ''}>
                {activeTab === 'home' ? (
                  <HomeContent 
                    banners={banners}
                    currentBanner={currentBanner}
                    tickerMessages={tickerMessages}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handleGameLaunch={handleGameLaunch}
                    handleDeposit={handleDeposit}
                    handleWithdraw={handleWithdraw}
                    setOverlayContent={setOverlayContent}
                    showFullAbout={showFullAbout}
                    setShowFullAbout={setShowFullAbout}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                  />
                ) : activeTab === 'sports' ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1 mb-2">
                       <span className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Target size={14} className="text-yellow-500" /> Sports Menu</span>
                       <button 
                         onClick={() => { playSound('click'); setActiveTab('home'); setSportsSelectedCat('All'); }}
                         className="text-[10px] font-black text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 hover:text-black hover:bg-yellow-500 transition-all"
                       >
                         <ChevronDown size={14} className="rotate-90" /> Back to Home
                       </button>
                    </div>
                    {/* Sports Sub-Categories - Full Visibility Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {sportsCategories.map(cat => (
                        <button
                          key={cat.name}
                          onClick={() => setSportsSelectedCat(cat.name)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] transition-all duration-300 border shadow-lg relative overflow-hidden group
                            ${sportsSelectedCat === cat.name 
                              ? 'elite-glass-active border-yellow-500/50 text-yellow-500' 
                              : 'elite-glass border-white/10 text-gray-400'}`}
                        >
                          {/* Unique Glass Reflection */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          <cat.icon size={14} className="relative z-10" />
                          <span className="uppercase tracking-wider relative z-10">{cat.name}</span>
                          {cat.name === 'Cricket' && (
                            <span className="absolute top-1 right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <SportsMarket 
                      matches={filteredMatches} 
                      loading={sportsLoading} 
                      onBet={(match, selection, odds) => setBetSlip({ match, selection, odds })} 
                      onStream={(match) => setIsStreaming(match)}
                      onRefresh={() => fetchLiveMarket()}
                      onDetails={(match) => setDetailedMatch(match)}
                    />
                    {sportsLoading && (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Provider Filter - Glass Style */}
                    {activeTab !== 'home' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <LayoutGrid size={14} className="text-yellow-500" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Providers</span>
                          </div>
                          <button 
                            onClick={() => { playSound('click'); setActiveTab('home'); }}
                            className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors"
                          >
                            <ArrowUpCircle size={12} className="rotate-[-90deg]" /> Back to Home
                          </button>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="px-1">
                          <input
                            type="text"
                            placeholder="Search games..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-4 text-[12px] text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-all"
                          />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                          {['All', ...Array.from(new Set(GAMES_DATABASE[activeTab]?.map(g => g.provider) || []))].map(provider => (
                            <button
                              key={provider}
                              onClick={() => { playSound('click'); setSelectedProvider(provider); }}
                              className={`whitespace-nowrap px-5 py-2.5 rounded-full font-black text-[10px] transition-all duration-300 border shadow-lg relative overflow-hidden group
                                ${selectedProvider === provider 
                                  ? 'elite-glass-active border-yellow-500/50 text-yellow-500' 
                                  : 'elite-glass border-white/10 text-gray-400'}`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                              <span className="uppercase tracking-widest relative z-10">{provider}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3.5">
                      {(activeTab === 'favorites' ? Object.values(GAMES_DATABASE).flat().filter(game => favorites.includes(game.id)) : GAMES_DATABASE[activeTab])
                        ?.filter(game => 
                          (selectedProvider === 'All' || game.provider === selectedProvider) &&
                          (game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           game.provider.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           game.tag.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        ?.map((game) => (
                          <GameCard key={`${activeTab}-${game.id}`} game={game} isFavorite={favorites.includes(game.id)} onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(game.id); }} onClick={() => handleGameLaunch(game.id)} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

    <div className="mt-12 mb-28 elite-glass p-6 border-white/10 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 via-purple-500/20 to-blue-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative z-10 space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 drop-shadow-md">
              Copyright © {new Date().getFullYear()} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">L's Baji</span>
            </p>
            <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center justify-center gap-2">
              Powered by 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 font-black text-sm drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                MT L's Baji
              </span>
            </p>
          </div>
        </div>
    </main>

      {/* Footer Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 nav-blur border-t border-white/10 flex justify-around items-end py-3 z-[200] transition-all duration-300 ${!isLoggedIn ? 'translate-y-24' : ''}`}>
        <button onClick={() => { playSound('click'); setActiveTab('home'); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-yellow-500' : 'text-gray-500'}`}>
          <LayoutGrid size={22} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => { playSound('click'); setOverlayContent('promotion'); }} className={`flex flex-col items-center gap-1 transition-all ${overlayContent === 'promotion' ? 'text-yellow-500' : 'text-gray-500'}`}>
          <Gift size={22} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Promotion</span>
        </button>
        <div className="relative -mt-6">
          <div onClick={() => { playSound('click'); handleDeposit(); }} className="bg-yellow-500/90 backdrop-blur-md w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 border-[#0d1110] shadow-[0_0_20px_rgba(234,179,8,0.4)] active:scale-90 transition-transform cursor-pointer ripple-effect">
            <Wallet size={20} className="text-black" />
            <span className="text-[8px] font-black uppercase text-black leading-none mt-1">Deposit</span>
          </div>
        </div>
        <button onClick={() => { playSound('click'); setOverlayContent('trading'); }} className={`flex flex-col items-center gap-1 transition-all ${overlayContent === 'trading' ? 'text-yellow-500' : 'text-gray-500'}`}>
            <BookOpen size={22} />
            <span className="text-[9px] font-black uppercase tracking-tighter">LS PRO</span>
        </button>
        <button onClick={() => { playSound('click'); setActiveTab('profile'); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-yellow-500' : 'text-gray-500'}`}>
          <UserCircle size={22} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Account</span>
        </button>
      </nav>


      <AnimatePresence>
        {showTransactionHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-2xl flex flex-col"
          >
            <div className="p-5 flex justify-between items-center border-b border-white/10">
              <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">Transaction History</h2>
              <button onClick={() => setShowTransactionHistory(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                  <div>
                    <p className={`text-xs font-black uppercase ${tx.type === 'deposit' ? 'text-green-500' : tx.type === 'withdraw' ? 'text-red-500' : 'text-blue-500'}`}>{tx.type}</p>
                    <p className="text-[10px] text-gray-500">{tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{tx.amount}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
