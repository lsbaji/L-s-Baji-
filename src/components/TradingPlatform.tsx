import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { X, TrendingUp, TrendingDown, DollarSign, Activity, PieChart, Clock, Zap, Users, Shield, Globe, ArrowUpRight, ArrowDownRight, MousePointer2, PenTool, Minus, Hash, Layers, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TradingPlatformProps {
  onClose: () => void;
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
}

const STOCKS = [
  { id: "L's Baji", name: "L's Baji Token", basePrice: 369.00, volatility: 12, color: '#eab308' },
  { id: 'BTC', name: 'Bitcoin', basePrice: 8270581.50, volatility: 12300, color: '#f7931a' },
  { id: 'ETH', name: 'Ethereum', basePrice: 424374.60, volatility: 1845, color: '#627eea' },
  { id: 'BNB', name: 'Binance Coin', basePrice: 71389.20, volatility: 615, color: '#f3ba2f' }
];

// Simulated Live Traders
const TRADER_NAMES = ['Sakib', 'Elite_99', 'Rahat', 'Baji_King', 'Crypto_Guru', 'Moon_Walker', 'L_Elite', 'Pro_Trader'];
const ASSETS = ['BTC', 'ETH', 'LSB', 'BNB', 'SOL'];

export const TradingPlatform: React.FC<TradingPlatformProps> = ({ onClose, balance, onUpdateBalance }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  
  const [selectedStock, setSelectedStock] = useState(STOCKS[0]);
  const [currentPrice, setCurrentPrice] = useState(STOCKS[0].basePrice);
  const [portfolio, setPortfolio] = useState<Record<string, number>>({ "L's Baji": 100.0, "BTC": 0.05, "ETH": 1.2 });
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [orderBook, setOrderBook] = useState<{buys: any[], sells: any[]}>({ buys: [], sells: [] });
  const [liveStats, setLiveStats] = useState({ activeUsers: 12450, totalVolume: 89234500 });
  const [activeTab, setActiveTerminalTab] = useState<'SPOT' | 'QUICK'>('QUICK');
  const [quickTradeTime, setQuickTradeTime] = useState(30);
  const [isTrading, setIsTrading] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingTradeDirection, setPendingTradeDirection] = useState<'UP' | 'DOWN' | null>(null);

  const confirmTrade = () => {
    if (pendingTradeDirection) {
      handleQuickTrade(pendingTradeDirection);
    }
    setShowConfirmation(false);
    setPendingTradeDirection(null);
  };
  const [sentiment, setSentiment] = useState({ buy: 55, sell: 45 });
  const [tradeResult, setTradeResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [liveTraders, setLiveTraders] = useState([
    { id: 'initial-1', name: 'Sakib', action: 'BUY', amount: '0.45 BTC', time: 'Just now' },
    { id: 'initial-2', name: 'Elite_99', action: 'SELL', amount: '1200 USDT', time: '2s ago' },
    { id: 'initial-3', name: 'Rahat', action: 'BUY', amount: '5.2 ETH', time: '5s ago' },
    { id: 'initial-4', name: 'Baji_King', action: 'BUY', amount: '50000 LSB', time: '8s ago' },
  ]);
  const [aiSignal, setAiSignal] = useState({ type: 'STRONG BUY', confidence: 94, reason: 'Bullish divergence detected on 1h timeframe.' });

  // Advanced Trading State
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<'CURSOR' | 'TRENDLINE' | 'HLINE' | 'FIB' | 'RECT'>('CURSOR');
  const [drawings, setDrawings] = useState<any[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<any>(null);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Drawing Logic
  const handleChartClick = (e: React.MouseEvent) => {
    if (activeTool === 'CURSOR') return;

    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'HLINE') {
      setDrawings(prev => [...prev, { type: 'HLINE', y, id: `drawing-${Date.now()}-${Math.random()}` }]);
      return;
    }

    if (!currentDrawing) {
      setCurrentDrawing({ type: activeTool, start: { x, y }, end: { x, y }, id: `drawing-${Date.now()}-${Math.random()}` });
    } else {
      setDrawings(prev => [...prev, { ...currentDrawing, end: { x, y } }]);
      setCurrentDrawing(null);
    }
  };

  const handleChartMouseMove = (e: React.MouseEvent) => {
    if (!currentDrawing) return;

    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentDrawing((prev: any) => ({ ...prev, end: { x, y } }));
  };

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#eab308', width: 1, style: 2 },
        horzLine: { color: '#eab308', width: 1, style: 2 },
      }
    });

    const series = chart.addCandlestickSeries({
      upColor: '#2ebd85',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#2ebd85',
      wickDownColor: '#f6465d',
    });

    setChartInstance(chart);
    setCandleSeries(series);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Generate Data & Stream
  useEffect(() => {
    if (!candleSeries) return;

    // Generate initial data
    const data = [];
    let lastPrice = selectedStock.basePrice;
    const now = Math.floor(Date.now() / 1000);
    
    for(let i = 0; i < 100; i++) {
      let open = lastPrice;
      let close = open + (Math.random() - 0.5) * (selectedStock.basePrice * 0.02);
      let high = Math.max(open, close) + (Math.random() * (selectedStock.basePrice * 0.01));
      let low = Math.min(open, close) - (Math.random() * (selectedStock.basePrice * 0.01));
      data.push({ time: now - (100 - i) * 60, open, high, low, close });
      lastPrice = close;
    }
    
    candleSeries.setData(data);
    setCurrentPrice(lastPrice);

    // Price Stream
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        // More realistic price movement with momentum
        const volatility = selectedStock.volatility / selectedStock.basePrice;
        const changePercent = (Math.random() - 0.5) * volatility * 0.05;
        let newPrice = prev * (1 + changePercent);
        
        if (selectedStock.id === "L's Baji" && newPrice < 0.5) newPrice = 0.51;

        candleSeries.update({
          time: Math.floor(Date.now() / 1000),
          open: prev,
          close: newPrice,
          high: Math.max(prev, newPrice) * (1 + Math.random() * 0.001),
          low: Math.min(prev, newPrice) * (1 - Math.random() * 0.001),
        });

        // Update Order Book
        const buys = Array(6).fill(0).map(() => ({
          price: (newPrice - (Math.random() * (newPrice * 0.002))).toFixed(4),
          amount: (Math.random() * 5).toFixed(2)
        })).sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

        const sells = Array(6).fill(0).map(() => ({
          price: (newPrice + (Math.random() * (newPrice * 0.002))).toFixed(4),
          amount: (Math.random() * 5).toFixed(2)
        })).sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

        setOrderBook({ buys, sells });

        // Update Live Stats
        setLiveStats(prev => ({
          activeUsers: prev.activeUsers + (Math.random() > 0.5 ? 1 : -1),
          totalVolume: prev.totalVolume + Math.random() * 1000
        }));

        // Update Sentiment
        setSentiment(prev => {
          const shift = (Math.random() - 0.5) * 2;
          const newBuy = Math.min(Math.max(prev.buy + shift, 20), 80);
          return { buy: newBuy, sell: 100 - newBuy };
        });

        // Check Pending Orders
        setPendingOrders(prev => {
          const executed: any[] = [];
          const remaining = prev.filter(order => {
            if (order.asset !== selectedStock.id) return true;
            
            let shouldExecute = false;
            if (order.type === 'LIMIT') {
              if (order.side === 'BUY' && newPrice <= order.price) shouldExecute = true;
              if (order.side === 'SELL' && newPrice >= order.price) shouldExecute = true;
            } else if (order.type === 'STOP') {
              if (order.side === 'BUY' && newPrice >= order.price) shouldExecute = true;
              if (order.side === 'SELL' && newPrice <= order.price) shouldExecute = true;
            }

            if (shouldExecute) {
              executed.push(order);
              return false;
            }
            return true;
          });

          executed.forEach(order => {
            const cost = order.amount * newPrice;
            if (order.side === 'BUY') {
              if (cost <= balance) {
                onUpdateBalance(balance - cost);
                setPortfolio(p => ({ ...p, [order.asset]: (p[order.asset] || 0) + order.amount }));
                setTradeHistory(h => [{
                  id: Date.now() + Math.random(),
                  time: new Date().toLocaleTimeString(),
                  pair: `${order.asset}/USDT`,
                  side: 'BUY',
                  price: newPrice,
                  amount: order.amount,
                  type: order.type
                }, ...h]);
              }
            } else {
              if (portfolio[order.asset] >= order.amount) {
                onUpdateBalance(balance + cost);
                setPortfolio(p => ({ ...p, [order.asset]: p[order.asset] - order.amount }));
                setTradeHistory(h => [{
                  id: Date.now() + Math.random(),
                  time: new Date().toLocaleTimeString(),
                  pair: `${order.asset}/USDT`,
                  side: 'SELL',
                  price: newPrice,
                  amount: order.amount,
                  type: order.type
                }, ...h]);
              }
            }
          });

          return remaining;
        });

        // Randomly update AI signal
        if (Math.random() > 0.95) {
          const signals = ['STRONG BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG SELL'];
          const reasons = [
            'RSI oversold on daily chart.',
            'MACD crossover confirmed.',
            'Breaking through major resistance.',
            'Whale accumulation detected.',
            'Market sentiment turning bullish.'
          ];
          setAiSignal({
            type: signals[Math.floor(Math.random() * signals.length)],
            confidence: 70 + Math.floor(Math.random() * 29),
            reason: reasons[Math.floor(Math.random() * reasons.length)]
          });
        }

        // Randomly add live trader
        if (Math.random() > 0.7) {
          const newTrader = {
            id: `trader-${Date.now()}-${Math.random()}`,
            name: TRADER_NAMES[Math.floor(Math.random() * TRADER_NAMES.length)],
            action: Math.random() > 0.5 ? 'BUY' : 'SELL',
            amount: (Math.random() * 10).toFixed(2) + ' ' + ASSETS[Math.floor(Math.random() * ASSETS.length)],
            time: 'Just now'
          };
          setLiveTraders(prev => [newTrader, ...prev.slice(0, 3)]);
        }

        return newPrice;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedStock, candleSeries]);

  const handleTrade = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (orderType !== 'MARKET') {
      const price = parseFloat(limitPrice);
      if (isNaN(price) || price <= 0) return;
      
      setPendingOrders(prev => [...prev, {
        id: Date.now(),
        asset: selectedStock.id,
        type: orderType,
        side: tradeMode,
        price,
        amount,
        sl: stopLoss ? parseFloat(stopLoss) : null,
        tp: takeProfit ? parseFloat(takeProfit) : null
      }]);
      setTradeAmount('');
      setLimitPrice('');
      return;
    }

    const cost = amount * currentPrice;

    if (tradeMode === 'BUY') {
      if (cost > balance) return;
      onUpdateBalance(balance - cost);
      setPortfolio(prev => ({
        ...prev,
        [selectedStock.id]: (prev[selectedStock.id] || 0) + amount
      }));
    } else {
      if (!portfolio[selectedStock.id] || portfolio[selectedStock.id] < amount) return;
      onUpdateBalance(balance + cost);
      setPortfolio(prev => ({
        ...prev,
        [selectedStock.id]: prev[selectedStock.id] - amount
      }));
    }

    setTradeHistory(prev => [{
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      pair: `${selectedStock.id}/USDT`,
      side: tradeMode,
      price: currentPrice,
      amount: amount,
      type: 'MARKET',
      sl: stopLoss,
      tp: takeProfit
    }, ...prev]);

    setTradeAmount('');
    setStopLoss('');
    setTakeProfit('');
  };

  const handleQuickTrade = (direction: 'UP' | 'DOWN') => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    onUpdateBalance(balance - amount);
    setIsTrading(true);
    const entryPrice = currentPrice;
    
    // Create Chart Marker
    let priceLine: any = null;
    if (candleSeries) {
      priceLine = candleSeries.createPriceLine({
        price: entryPrice,
        color: direction === 'UP' ? '#2ebd85' : '#f6465d',
        lineWidth: 2,
        lineStyle: 2, // Dotted
        axisLabelVisible: true,
        title: direction === 'UP' ? 'CALL' : 'PUT',
      });
    }

    const tradeId = Date.now();
    setPendingTrade({
      id: tradeId,
      direction,
      amount,
      entryPrice,
      timeLeft: quickTradeTime,
      asset: selectedStock.id,
      priceLine
    });

    const timer = setInterval(() => {
      setPendingTrade((prev: any) => {
        if (!prev || prev.timeLeft <= 0) {
          clearInterval(timer);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(timer);
      setIsTrading(false);
      
      // Market Bias Logic (House Edge)
      // If user is on the crowded side, they are more likely to lose.
      const isCrowdedSide = (direction === 'UP' && sentiment.buy > 50) || (direction === 'DOWN' && sentiment.sell > 50);
      
      // 80% chance to lose if on crowded side, otherwise 50/50 or slightly better
      const winProbability = isCrowdedSide ? 0.2 : 0.6;
      const won = Math.random() < winProbability;
      
      // Force price to reflect the outcome visually for a moment if needed
      // (The stream will handle the actual price, but we decide the win here)
      
      if (won) {
        const profit = amount * 1.9; // 90% profit
        onUpdateBalance(balance - amount + profit);
        setTradeResult('WIN');
        
        // Visual Marker on Chart
        if (candleSeries) {
          candleSeries.setMarkers([
            {
              time: Math.floor(Date.now() / 1000),
              position: 'aboveBar',
              color: '#2ebd85',
              shape: 'arrowUp',
              text: `WIN +৳${profit.toFixed(2)}`,
            }
          ]);
        }

        setTradeHistory(prev => [{
          id: tradeId,
          time: new Date().toLocaleTimeString(),
          pair: `${selectedStock.id}/USDT`,
          side: direction === 'UP' ? 'CALL' : 'PUT',
          price: entryPrice,
          amount: amount,
          status: 'WIN',
          payout: profit
        }, ...prev]);
      } else {
        setTradeResult('LOSS');
        // Visual Marker on Chart
        if (candleSeries) {
          candleSeries.setMarkers([
            {
              time: Math.floor(Date.now() / 1000),
              position: 'belowBar',
              color: '#f6465d',
              shape: 'arrowDown',
              text: `LOSS -৳${amount.toFixed(2)}`,
            }
          ]);
        }

        setTradeHistory(prev => [{
          id: tradeId,
          time: new Date().toLocaleTimeString(),
          pair: `${selectedStock.id}/USDT`,
          side: direction === 'UP' ? 'CALL' : 'PUT',
          price: entryPrice,
          amount: amount,
          status: 'LOSS',
          payout: 0
        }, ...prev]);
      }

      // Remove Price Line after a delay
      setTimeout(() => {
        if (candleSeries && priceLine) {
          candleSeries.removePriceLine(priceLine);
        }
        setTradeResult(null);
      }, 3000);

      setPendingTrade(null);
    }, quickTradeTime * 1000);

    setTradeAmount('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/95 text-gray-200 overflow-y-auto font-sans no-scrollbar"
    >
      {/* Bet Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 w-full max-w-sm space-y-6"
            >
              <h3 className="text-lg font-black text-white italic text-center">Confirm Bet</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 font-bold uppercase">Stake</span>
                  <span className="font-mono text-sm font-black text-white">৳{parseFloat(tradeAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 font-bold uppercase">Odds</span>
                  <span className="font-mono text-sm font-black text-yellow-500">{currentPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 font-bold uppercase">Est. Return</span>
                  <span className="font-mono text-sm font-black text-green-500">৳{(parseFloat(tradeAmount) * currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowConfirmation(false)} className="py-3 rounded-xl border border-white/10 font-black text-xs uppercase text-gray-400">Cancel</button>
                <button onClick={confirmTrade} className="py-3 rounded-xl bg-yellow-500 text-black font-black text-xs uppercase shadow-xl shadow-yellow-500/20">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Sticky Trade Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[400] bg-black/95 backdrop-blur-3xl border-t border-white/10 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex gap-4">
          <button 
            onClick={() => handleQuickTrade('UP')}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-br from-green-600 to-green-400 font-black uppercase tracking-[0.1em] text-xs text-white shadow-lg shadow-green-500/20 active:scale-95 transition-all"
          >
            CALL (UP)
          </button>
          <button 
            onClick={() => handleQuickTrade('DOWN')}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-400 font-black uppercase tracking-[0.1em] text-xs text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            PUT (DOWN)
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-[310] bg-white/5 backdrop-blur-2xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-2xl flex items-center justify-center font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] rotate-3">L</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white italic leading-none">L'S TRADING PRO</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">AI-Powered Real-Time Engine</span>
              </div>
            </div>
          </div>

          {/* Asset Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsAssetSelectorOpen(!isAssetSelectorOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px]" style={{ backgroundColor: `${selectedStock.color}20`, color: selectedStock.color }}>{selectedStock.id[0]}</div>
              <span className="text-sm font-black text-white italic">{selectedStock.id}/USDT</span>
              <ChevronDown size={14} className={`text-gray-500 transition-transform ${isAssetSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isAssetSelectorOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl z-[400] p-4"
                >
                  <div className="relative mb-4">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search assets..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto no-scrollbar">
                    {STOCKS.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                      <button 
                        key={s.id}
                        onClick={() => {
                          setSelectedStock(s);
                          setIsAssetSelectorOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedStock.id === s.id ? 'bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px]" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{s.id[0]}</div>
                          <div className="text-left">
                            <p className="text-xs font-black text-white italic leading-none">{s.id}</p>
                            <p className="text-[8px] text-gray-500 font-bold uppercase mt-0.5">{s.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono font-black text-white">৳{s.basePrice.toLocaleString()}</p>
                          <p className="text-[8px] text-green-500 font-bold">+2.4%</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 border-r border-white/10 pr-8">
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Active Traders</p>
              <p className="text-sm font-black text-white font-mono">{liveStats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">24h Volume</p>
              <p className="text-sm font-black text-yellow-500 font-mono">৳{(liveStats.totalVolume/1000000).toFixed(2)}M</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Main Balance</p>
            <p className="text-lg font-black text-white italic font-mono">৳{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all active:scale-90">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Markets & Activity */}
        <div className="lg:col-span-3 space-y-6">
          {/* AI Signal Box */}
          <div className="glass-panel p-5 rounded-[2rem] border border-yellow-500/20 bg-yellow-500/5 shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Zap size={80} className="text-yellow-500" />
            </div>
            <h2 className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} /> AI Trading Signal
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-lg font-black italic ${aiSignal.type.includes('BUY') ? 'text-green-500' : aiSignal.type.includes('SELL') ? 'text-red-500' : 'text-gray-400'}`}>
                  {aiSignal.type}
                </span>
                <div className="text-right">
                  <p className="text-[8px] text-gray-500 font-bold uppercase">Confidence</p>
                  <p className="text-sm font-black text-white font-mono">{aiSignal.confidence}%</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${aiSignal.confidence}%` }}
                  className={`h-full ${aiSignal.type.includes('BUY') ? 'bg-green-500' : aiSignal.type.includes('SELL') ? 'bg-red-500' : 'bg-gray-400'}`}
                />
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-medium italic">"{aiSignal.reason}"</p>
            </div>
          </div>

          {/* Sentiment Indicator */}
          <div className="glass-panel p-5 rounded-[2rem] border border-white/10 shadow-2xl">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <PieChart size={14} className="text-orange-500" /> Market Sentiment
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span className="text-green-500">Buy {sentiment.buy.toFixed(0)}%</span>
                <span className="text-red-500">Sell {sentiment.sell.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                <motion.div 
                  animate={{ width: `${sentiment.buy}%` }}
                  className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]"
                />
                <motion.div 
                  animate={{ width: `${sentiment.sell}%` }}
                  className="h-full bg-red-500 shadow-[0_0_10px_#ef4444]"
                />
              </div>
              <p className="text-[8px] text-gray-500 font-bold uppercase text-center italic">Crowded side has higher risk of liquidation</p>
            </div>
          </div>

          {/* Markets */}
          <div className="glass-panel p-5 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Globe size={80} />
            </div>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2 relative z-10">
              <Activity size={14} className="text-yellow-500" /> Global Markets
            </h2>
            <div className="space-y-3 relative z-10">
              {STOCKS.map(s => (
                <motion.div 
                  key={s.id}
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => setSelectedStock(s)}
                  className={`flex justify-between items-center p-4 rounded-2xl cursor-pointer transition-all border ${selectedStock.id === s.id ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px]" style={{ backgroundColor: `${s.color}20`, color: s.color }}>{s.id[0]}</div>
                    <div>
                      <div className="font-black text-white text-sm italic">{s.id}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">{s.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-black text-white">৳{s.basePrice.toLocaleString()}</div>
                    <div className="text-[9px] text-green-500 font-bold">+2.4%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Live Activity */}
          <div className="glass-panel p-5 rounded-[2rem] border border-white/10 shadow-2xl">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Users size={14} className="text-blue-500" /> Live Activity
            </h2>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {liveTraders.map((trader) => (
                  <motion.div 
                    key={trader.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black text-gray-400">{trader.name[0]}</div>
                      <div>
                        <p className="text-[11px] font-black text-white leading-none mb-1">{trader.name}</p>
                        <p className={`text-[9px] font-bold uppercase ${trader.action === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{trader.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-bold text-gray-300">{trader.amount}</p>
                      <p className="text-[8px] text-gray-600 font-bold uppercase">{trader.time}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        {/* Middle Column: Chart & Vertical Order Book */}
        <div className="lg:col-span-6 space-y-6">
          {/* Chart Section */}
          <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 shadow-2xl h-[550px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
            
            {/* Chart Sidebar Tools */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
              {[
                { id: 'CURSOR', icon: MousePointer2 },
                { id: 'TRENDLINE', icon: PenTool },
                { id: 'HLINE', icon: Minus },
                { id: 'RECT', icon: Search },
                { id: 'FIB', icon: Hash },
                { id: 'LAYERS', icon: Layers }
              ].map(tool => (
                <button 
                  key={`tool-${tool.id}`}
                  onClick={() => {
                    if (tool.id === 'LAYERS') {
                      setDrawings([]);
                      setCurrentDrawing(null);
                    } else {
                      setActiveTool(tool.id as any);
                    }
                  }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${activeTool === tool.id ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  <tool.icon size={16} />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10 pl-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <TrendingUp className="text-yellow-500" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter leading-none">{selectedStock.id}/USDT</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Real-Time Market Data</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Current Price</p>
                  <p className="text-xl font-black text-white font-mono">৳{currentPrice.toFixed(4)}</p>
                </div>
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-green-500" />
                  <span className="text-sm font-black text-green-500 font-mono">+2.45%</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-4 relative z-10">
              <div 
                ref={chartContainerRef} 
                className="flex-1 relative cursor-crosshair rounded-2xl overflow-hidden border border-white/5 bg-black/20" 
                onClick={handleChartClick}
                onMouseMove={handleChartMouseMove}
              >
                {/* Drawing Overlay */}
                <svg className="absolute inset-0 pointer-events-none z-30 w-full h-full">
                  {drawings.map(d => (
                    <g key={d.id}>
                      {d.type === 'HLINE' && (
                        <line x1="0" y1={d.y} x2="100%" y2={d.y} stroke="#eab308" strokeWidth="1" strokeDasharray="4" />
                      )}
                      {d.type === 'TRENDLINE' && (
                        <line x1={d.start.x} y1={d.start.y} x2={d.end.x} y2={d.end.y} stroke="#eab308" strokeWidth="2" />
                      )}
                      {d.type === 'RECT' && (
                        <rect 
                          x={Math.min(d.start.x, d.end.x)} 
                          y={Math.min(d.start.y, d.end.y)} 
                          width={Math.abs(d.end.x - d.start.x)} 
                          height={Math.abs(d.end.y - d.start.y)} 
                          fill="rgba(234,179,8,0.1)" 
                          stroke="#eab308" 
                          strokeWidth="1"
                        />
                      )}
                      {d.type === 'FIB' && (
                        <g>
                          {[0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map((level, idx) => {
                            const y = d.start.y + (d.end.y - d.start.y) * level;
                            return (
                              <g key={`${d.id}-level-${idx}`}>
                                <line x1={Math.min(d.start.x, d.end.x)} y1={y} x2={Math.max(d.start.x, d.end.x)} y2={y} stroke="rgba(234,179,8,0.3)" strokeWidth="1" />
                                <text x={Math.max(d.start.x, d.end.x) + 5} y={y + 3} fill="rgba(255,255,255,0.4)" fontSize="8">{level}</text>
                              </g>
                            );
                          })}
                        </g>
                      )}
                    </g>
                  ))}
                  {currentDrawing && (
                    <g>
                      {currentDrawing.type === 'TRENDLINE' && (
                        <line x1={currentDrawing.start.x} y1={currentDrawing.start.y} x2={currentDrawing.end.x} y2={currentDrawing.end.y} stroke="#eab308" strokeWidth="2" strokeDasharray="4" />
                      )}
                      {currentDrawing.type === 'RECT' && (
                        <rect 
                          x={Math.min(currentDrawing.start.x, currentDrawing.end.x)} 
                          y={Math.min(currentDrawing.start.y, currentDrawing.end.y)} 
                          width={Math.abs(currentDrawing.end.x - currentDrawing.start.x)} 
                          height={Math.abs(currentDrawing.end.y - currentDrawing.start.y)} 
                          fill="rgba(234,179,8,0.05)" 
                          stroke="rgba(234,179,8,0.2)" 
                        />
                      )}
                      {currentDrawing.type === 'FIB' && (
                        <rect 
                          x={Math.min(currentDrawing.start.x, currentDrawing.end.x)} 
                          y={Math.min(currentDrawing.start.y, currentDrawing.end.y)} 
                          width={Math.abs(currentDrawing.end.x - currentDrawing.start.x)} 
                          height={Math.abs(currentDrawing.end.y - currentDrawing.start.y)} 
                          fill="rgba(234,179,8,0.05)" 
                          stroke="rgba(234,179,8,0.2)" 
                        />
                      )}
                    </g>
                  )}
                </svg>
              </div>

              {/* Vertical Order Book */}
              <div className="w-48 flex flex-col gap-2 bg-black/40 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl">
                <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest text-center mb-1">Order Book</h4>
                
                {/* Sells (Top) */}
                <div className="flex-1 flex flex-col-reverse gap-1 overflow-hidden">
                  {orderBook.sells.map((s, i) => (
                    <div key={`sell-${s.price}-${i}`} className="flex justify-between text-[9px] font-mono relative group">
                      <div className="absolute inset-y-0 right-0 bg-red-500/10 transition-all duration-500" style={{ width: `${Math.min(parseFloat(s.amount) * 20, 100)}%` }}></div>
                      <span className="text-red-400 relative z-10 group-hover:text-red-300 transition-colors">{s.price}</span>
                      <span className="text-gray-400 relative z-10">{s.amount}</span>
                    </div>
                  ))}
                </div>

                <div className="py-2.5 bg-white/5 rounded-xl text-center text-sm font-black font-mono text-white border border-white/10 shadow-inner">
                  {currentPrice.toFixed(4)}
                </div>

                {/* Buys (Bottom) */}
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {orderBook.buys.map((b, i) => (
                    <div key={`buy-${b.price}-${i}`} className="flex justify-between text-[9px] font-mono relative group">
                      <div className="absolute inset-y-0 right-0 bg-green-500/10 transition-all duration-500" style={{ width: `${Math.min(parseFloat(b.amount) * 20, 100)}%` }}></div>
                      <span className="text-green-400 relative z-10 group-hover:text-green-300 transition-colors">{b.price}</span>
                      <span className="text-gray-400 relative z-10">{b.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="glass-panel p-5 rounded-[2rem] border border-white/10 flex flex-col h-[250px] shadow-2xl">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={14} className="text-purple-500" /> Recent Wagers
            </h2>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-[10px]">
                <thead className="text-gray-600 uppercase tracking-widest font-black sticky top-0 bg-black/40 backdrop-blur-md z-10">
                  <tr>
                    <th className="pb-3 pl-2">Time</th>
                    <th className="pb-3">Side</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3 text-right pr-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="font-mono font-bold">
                  {tradeHistory.filter(h => h.pair.startsWith(selectedStock.id)).map(h => (
                    <tr key={h.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2.5 pl-2 text-gray-500">{h.time}</td>
                      <td className={`py-2.5 ${h.side.includes('BUY') || h.side === 'CALL' ? 'text-green-500' : 'text-red-500'}`}>{h.side}</td>
                      <td className="py-2.5 text-white">{h.price.toFixed(2)}</td>
                      <td className={`py-2.5 text-right pr-2 ${h.status === 'WIN' ? 'text-green-400' : h.status === 'LOSS' ? 'text-red-400' : 'text-white'}`}>
                        {h.status ? (h.status === 'WIN' ? `+৳${h.payout.toFixed(2)}` : `-৳${h.amount.toFixed(2)}`) : h.amount.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                  {tradeHistory.filter(h => h.pair.startsWith(selectedStock.id)).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-700 font-black uppercase tracking-[0.3em]">No Data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
     </div>

        {/* Right Column: Terminal & Portfolio */}
        <div className="lg:col-span-3 space-y-6">
          {/* Trading Terminal */}
          <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col min-h-[500px]">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Shield size={100} />
            </div>

            <div className="flex bg-white/5 rounded-2xl p-1 mb-6 relative z-10">
              <button 
                onClick={() => setActiveTerminalTab('QUICK')}
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'QUICK' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:text-white'}`}
              >
                Quick Trade
              </button>
              <button 
                onClick={() => setActiveTerminalTab('SPOT')}
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'SPOT' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Spot Trade
              </button>
            </div>
            
            {activeTab === 'SPOT' ? (
              <div className="space-y-4 relative z-10 flex-1 overflow-y-auto no-scrollbar pr-1">
                <div className="flex bg-white/5 rounded-2xl p-1.5">
                  <button 
                    onClick={() => setTradeMode('BUY')}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tradeMode === 'BUY' ? 'bg-green-500 text-black' : 'text-gray-500'}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setTradeMode('SELL')}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tradeMode === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-500'}`}
                  >
                    Sell
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl">
                  {['MARKET', 'LIMIT', 'STOP'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setOrderType(type as any)}
                      className={`py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${orderType === type ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {orderType !== 'MARKET' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Price</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-mono text-sm text-white focus:outline-none focus:border-yellow-500/50"
                          placeholder="0.00"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500 uppercase">USDT</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Amount</label>
                      <span className="text-[8px] font-bold text-yellow-500 uppercase">Max: {tradeMode === 'BUY' ? balance.toFixed(2) : (portfolio[selectedStock.id] || 0).toFixed(4)}</span>
                    </div>
                    <div className="relative group">
                      <input 
                        type="number" 
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 font-mono text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-all"
                        placeholder="0.00"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500 uppercase">{selectedStock.id}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[25, 50, 75, 100].map(pct => (
                      <button 
                        key={pct}
                        onClick={() => {
                          if (tradeMode === 'BUY') {
                            setTradeAmount(((balance * (pct/100)) / currentPrice).toFixed(4));
                          } else {
                            setTradeAmount(((portfolio[selectedStock.id] || 0) * (pct/100)).toFixed(4));
                          }
                        }}
                        className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[8px] font-black text-gray-400 transition-all"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Stop Loss</label>
                      <input 
                        type="number" 
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 font-mono text-xs text-white focus:outline-none focus:border-red-500/50"
                        placeholder="Price"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Take Profit</label>
                      <input 
                        type="number" 
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 font-mono text-xs text-white focus:outline-none focus:border-green-500/50"
                        placeholder="Price"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Est. Total</span>
                      <span className="font-mono text-sm font-black text-white">
                        ৳{tradeAmount ? (parseFloat(tradeAmount) * (orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                      </span>
                    </div>
                    
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTrade}
                      className={`w-full py-3.5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] text-white shadow-2xl transition-all relative overflow-hidden group ${tradeMode === 'BUY' ? 'bg-gradient-to-br from-green-600 to-green-400' : 'bg-gradient-to-br from-red-600 to-red-400'}`}
                    >
                      {orderType} {tradeMode}
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 relative z-10 flex-1">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Investment Amount</label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 font-mono text-lg text-white focus:outline-none focus:border-yellow-500/50 transition-all"
                        placeholder="0.00"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500 uppercase">USDT</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[30, 60, 120].map(t => (
                        <button 
                          key={t}
                          onClick={() => setQuickTradeTime(t)}
                          className={`py-2 rounded-xl text-[10px] font-black transition-all border ${quickTradeTime === t ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-white/5 border-white/5 text-gray-500'}`}
                        >
                          {t}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {pendingTrade ? (
                    <div className="p-4 bg-white/5 rounded-2xl border border-yellow-500/30 animate-pulse">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-yellow-500 uppercase">Trade Active</span>
                        <span className="text-sm font-black text-white font-mono">{pendingTrade.timeLeft}s</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400">{pendingTrade.direction} @ {pendingTrade.entryPrice.toFixed(2)}</span>
                        <span className="text-xs font-black text-white italic">৳{pendingTrade.amount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 pt-4">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickTrade('UP')}
                        disabled={isTrading}
                        className="w-full py-5 rounded-2xl bg-gradient-to-br from-green-600 to-green-400 font-black uppercase tracking-[0.2em] text-sm text-white shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 group"
                      >
                        <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Call (Up)
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickTrade('DOWN')}
                        disabled={isTrading}
                        className="w-full py-5 rounded-2xl bg-gradient-to-br from-red-600 to-red-400 font-black uppercase tracking-[0.2em] text-sm text-white shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 group"
                      >
                        <ArrowDownRight className="group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" />
                        Put (Down)
                      </motion.button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Potential Payout</span>
                      <span className="font-mono text-lg font-black text-green-500">
                        ৳{tradeAmount ? (parseFloat(tradeAmount) * 1.9).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Section */}
          <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 shadow-2xl flex-1">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieChart size={14} className="text-yellow-500" /> Asset Portfolio
            </h2>
            <div className="space-y-3">
              {Object.entries(portfolio).map(([coin, amountVal]) => {
                const amount = amountVal as number;
                if (amount <= 0) return null;
                const coinData = STOCKS.find(s => s.id === coin);
                const value = coinData ? amount * (coin === selectedStock.id ? currentPrice : coinData.basePrice) : 0;
                
                return (
                  <div key={coin} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">{coin[0]}</div>
                      <div>
                        <p className="text-xs font-black text-white italic">{coin}</p>
                        <p className="text-[10px] font-mono font-bold text-gray-500">{amount.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white font-mono">৳{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      <p className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">In Profit</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
