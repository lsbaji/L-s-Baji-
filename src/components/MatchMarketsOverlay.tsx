import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Activity, Lock, TrendingUp, Tv, Clock } from 'lucide-react';

interface MatchMarketsOverlayProps {
  match: any;
  onClose: () => void;
  onPlaceBet: (match: any, selection: string, odds: number) => void;
}

export function MatchMarketsOverlay({ match, onClose, onPlaceBet }: MatchMarketsOverlayProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [markets, setMarkets] = useState<any[]>([]);

  // Generate deep markets based on sport
  useEffect(() => {
    let initialMarkets: any[] = [];
    
    // Base H2H Market
    initialMarkets.push({
      id: 'm_winner', title: 'Match Winner', type: 'standard',
      selections: [
        { label: match.homeTeam, odds: match.odds?.home || 1.85 },
        match.odds?.draw ? { label: 'Draw', odds: match.odds.draw } : null,
        { label: match.awayTeam, odds: match.odds?.away || 2.15 },
      ].filter(Boolean)
    });

    // Real API Spreads (Handicap) Market
    if (match.odds?.spreads?.home && match.odds?.spreads?.away) {
      initialMarkets.push({
        id: 'm_spreads', title: 'Handicap (Spreads)', type: 'standard',
        selections: [
          { label: `${match.homeTeam} (${match.odds.spreads.home.point > 0 ? '+' : ''}${match.odds.spreads.home.point})`, odds: match.odds.spreads.home.price },
          { label: `${match.awayTeam} (${match.odds.spreads.away.point > 0 ? '+' : ''}${match.odds.spreads.away.point})`, odds: match.odds.spreads.away.price },
        ]
      });
    }

    // Real API Totals (Over/Under) Market
    if (match.odds?.totals?.over && match.odds?.totals?.under) {
      initialMarkets.push({
        id: 'm_totals', title: 'Total Match Points/Goals', type: 'over_under',
        selections: [
          { label: `${match.odds.totals.over.point} Points/Goals`, over: match.odds.totals.over.price, under: match.odds.totals.under.price },
        ]
      });
    }
    
    // Add Fancy/Specific Markets based on sport type (Mocked logic mixed with real API data)
    if (match.sport === 'Cricket') {
      initialMarkets.push(
        {
          id: 'm2', title: 'Fancy Markets (Session)', type: 'fancy',
          selections: [
            { label: '5 Overs Runs - ' + match.homeTeam, line: '45.5', over: 1.90, under: 1.85 },
            { label: '10 Overs Runs - ' + match.homeTeam, line: '85.5', over: 1.95, under: 1.80 },
            { label: '15 Overs Runs - ' + match.homeTeam, line: '120.5', over: 1.85, under: 1.95 },
            { label: '20 Overs Runs - ' + match.homeTeam, line: '165.5', over: 1.90, under: 1.90 },
          ]
        },
        {
          id: 'm3', title: 'Ongoing Over Runs (Next)', type: 'fancy',
          selections: [
            { label: 'Over 16 Runs', line: '8.5', over: 2.10, under: 1.70 },
          ]
        },
        {
          id: 'm4', title: 'Fall of 1st Wicket', type: 'fancy',
          selections: [
            { label: match.homeTeam + ' 1st Wicket', line: '25.5', over: 1.85, under: 1.85 },
          ]
        },
        {
          id: 'm5', title: 'Player Match Runs', type: 'fancy',
          selections: [
            { label: 'Top Batsman Runs', line: '35.5', over: 1.90, under: 1.80 },
            { label: 'Opening Batter Runs', line: '20.5', over: 1.75, under: 1.95 },
          ]
        }
      );
    } else if (match.sport === 'Football') {
      initialMarkets.push(
        {
          id: 'f2', title: 'Alt Total Goals (Over/Under)', type: 'over_under',
          selections: [
            { label: '1.5 Goals', over: 1.25, under: 3.50 },
            { label: '2.5 Goals', over: 1.85, under: 1.95 },
            { label: '3.5 Goals', over: 3.20, under: 1.35 },
          ]
        },
        {
          id: 'f3', title: 'Both Teams to Score', type: 'standard',
          selections: [
            { label: 'Yes', odds: 1.75 },
            { label: 'No', odds: 2.05 },
          ]
        },
        {
          id: 'f4', title: 'Next Goal', type: 'standard',
          selections: [
            { label: match.homeTeam, odds: 2.10 },
            { label: 'No Goal', odds: 4.50 },
            { label: match.awayTeam, odds: 1.80 }
          ]
        }
      );
    } else if (match.sport === 'Tennis') {
      initialMarkets.push(
        {
          id: 't2', title: 'Set 2 Winner', type: 'standard',
          selections: [
            { label: match.homeTeam, odds: 1.55 },
            { label: match.awayTeam, odds: 2.30 },
          ]
        },
        {
          id: 't3', title: 'Total Games (Set 2)', type: 'over_under',
          selections: [
            { label: '9.5 Games', over: 1.85, under: 1.85 },
          ]
        }
      );
    }

    setMarkets(initialMarkets);
  }, [match]);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#050505] overflow-hidden font-sans">
      
      {/* Header - Glassmorphism Style */}
      <div className="flex-shrink-0 bg-black/60 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] pt-6 md:pt-0 z-20">
        <div className="flex justify-between items-start p-4">
          <div className="flex flex-col flex-1 gap-2">
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">{match.sport}</span>
              <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">{match.league}</span>
            </div>

            <div className="text-white font-black text-xl md:text-3xl flex flex-wrap items-center gap-2 mt-1 leading-none tracking-tighter">
              <span className="truncate max-w-[150px] sm:max-w-xs">{match.homeTeam}</span>
              <span className="text-gray-600 text-sm italic font-medium mx-1">vs</span> 
              <span className="truncate max-w-[150px] sm:max-w-xs">{match.awayTeam}</span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              {match.status === 'Live' ? (
                <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                  <Activity size={12} className="text-rose-500" />
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <Clock size={12} className="text-blue-500" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">UPCOMING</span>
                </div>
              )}
              {match.time && (
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  {match.time}
                </span>
              )}
              {match.score && match.score !== '0-0' && match.score !== '0/0' && match.score !== 'VS' && (
                <span className="text-sm md:text-base font-black text-yellow-500 tracking-tighter ml-1 bg-yellow-500/10 px-3 py-0.5 rounded border border-yellow-500/20 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                  {match.score}
                </span>
              )}
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="flex-shrink-0 group flex items-center justify-center p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all text-gray-400 hover:text-yellow-500 shadow-lg"
          >
            <ChevronDown className="rotate-90 sm:mr-1.5" size={18} /> 
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Live Stream / Tracker Bar Placeholder */}
        {match.status === 'Live' && (
          <div className="px-4 pb-4">
             <button className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-3 rounded-2xl text-xs uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-colors border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Tv size={16} className="animate-pulse" /> Watch Live Stream
             </button>
          </div>
        )}

        {/* Tabs - Glass UI */}
        <div className="flex overflow-x-auto hide-scrollbar border-t border-white/10 px-2 mt-2">
          {['all', 'main', 'fancy', 'player', 'session'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-4 text-[11px] font-black uppercase tracking-widest transition-all relative
                ${activeTab === tab ? 'text-yellow-500' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="marketTabUnderline" className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500 rounded-t-full shadow-[0_-2px_10px_rgba(234,179,8,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Markets Content - Solid Dark background, Glass Cards */}
      <div className="flex-1 overflow-y-auto bg-transparent p-3 space-y-4 pb-32">
        <AnimatePresence>
          {markets
            .filter(m => activeTab === 'all' || (activeTab === 'fancy' && m.type === 'fancy') || (activeTab === 'main' && m.type !== 'fancy'))
            .map(market => (
              <MarketAccordion 
                key={market.id} 
                market={market} 
                match={match} 
                onPlaceBet={onPlaceBet} 
                isLive={match.status === 'Live'}
              />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const MarketAccordion: React.FC<{ market: any; match: any; onPlaceBet: any; isLive: boolean }> = ({ market, match, onPlaceBet, isLive }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] rounded-3xl overflow-hidden border border-white/10 shadow-lg backdrop-blur-xl"
    >
      <div 
        className="flex justify-between items-center p-4 bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-extrabold text-xs text-white uppercase tracking-widest flex items-center gap-2.5">
          {market.type === 'fancy' && <TrendingUp size={16} className="text-yellow-500" />}
          {market.type === 'over_under' && <Activity size={16} className="text-blue-500" />}
          {market.title}
        </span>
        <div className={`p-1.5 rounded-full bg-white/5 border border-white/10 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-white/5">
              
              {market.type === 'standard' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {market.selections.map((sel: any, i: number) => (
                    <OddsButton 
                      key={i} 
                      label={sel.label} 
                      odds={sel.odds} 
                      isLive={isLive} 
                      dir={sel.dir}
                      onClick={() => onPlaceBet(match, `${market.title} - ${sel.label}`, sel.odds)} 
                    />
                  ))}
                </div>
              )}

              {(market.type === 'fancy' || market.type === 'over_under') && (
                <div className="space-y-3">
                  {/* Headers for fancy */}
                  <div className="flex text-[9px] text-gray-500 font-black uppercase tracking-widest px-2 pb-1 border-b border-white/5">
                    <div className="flex-1">Selection</div>
                    <div className="w-20 text-center text-blue-400">Yes / Over</div>
                    <div className="w-20 text-center text-rose-400">No / Under</div>
                  </div>
                  {market.selections.map((sel: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex-1 flex flex-col pl-2">
                        <span className="text-xs font-bold text-gray-200 leading-snug">{sel.label}</span>
                        {sel.line && <span className="text-[10px] text-yellow-500 font-black mt-0.5 tracking-wider">Line: {sel.line}</span>}
                      </div>
                      <OddsButton compact bg="bg-blue-500/10 hover:bg-blue-500/20" border="border-blue-500/30 text-blue-400" onClick={() => onPlaceBet(match, `${market.title} - ${sel.label} (Yes/Over)`, sel.over)} odds={sel.over} />
                      <OddsButton compact bg="bg-rose-500/10 hover:bg-rose-500/20" border="border-rose-500/30 text-rose-400" onClick={() => onPlaceBet(match, `${market.title} - ${sel.label} (No/Under)`, sel.under)} odds={sel.under} />
                    </div>
                  ))}
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Customized Odds Button specifically for this detailed overlay, with Glassmorphism
function OddsButton({ label, odds, onClick, isLive, compact = false, bg, border, dir }: any) {
  const [flash, setFlash] = useState<string | null>(null);
  
  useEffect(() => {
    if (dir) {
      setFlash(dir);
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [odds, dir]);

  let flashClass = bg || 'bg-white/5 hover:bg-white/10';
  let bClass = border || 'border-white/10 text-yellow-500';

  if (flash === 'up') {
    flashClass = 'bg-green-500/20 scale-[1.02]'; bClass = 'border-green-500/50 text-green-400';
  } else if (flash === 'down') {
    flashClass = 'bg-rose-500/20 scale-[0.98]'; bClass = 'border-rose-500/50 text-rose-400';
  }

  return (
    <button
      onClick={onClick}
      disabled={!odds || odds <= 0}
      className={`relative overflow-hidden flex flex-col items-center justify-center rounded-2xl transition-all duration-300 border shadow-md group ${flashClass} ${bClass} ${compact ? 'w-20 py-2.5' : 'p-3.5 w-full'}`}
    >
      {!compact && label && <span className="text-[10px] text-gray-400 uppercase font-black text-center tracking-widest leading-tight mb-1">{label}</span>}
      <span className={`font-black tracking-tighter ${compact ? 'text-sm' : 'text-lg drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]'}`}>
        {odds > 0 ? odds.toFixed(2) : <Lock size={14} className="text-gray-500" />}
      </span>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </button>
  );
}
