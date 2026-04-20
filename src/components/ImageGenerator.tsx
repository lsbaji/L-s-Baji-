import React, { useState } from 'react';
import { Image as ImageIcon, Download, Loader2, X, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Image generation logic moved to server-side

type ImageSize = '1K' | '2K' | '4K';

export default function ImageGenerator({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setImageUrl(null);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size })
      });

      if (!response.ok) throw new Error('Image API failed');
      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error("Image Gen Error:", err);
      setError("Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex flex-col p-6 overflow-y-auto"
    >
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 py-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Elite AI Image</h2>
              <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="glass-panel p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Describe your image (Trading, Games, etc.)</label>
            <textarea 
              placeholder="e.g. A futuristic crypto trading dashboard with glowing charts, or a luxury casino game with neon lights..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors h-32 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-2 rounded-lg text-xs font-black transition-all border ${
                    size === s 
                      ? 'bg-yellow-500 border-yellow-400 text-black' 
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPrompt("A futuristic crypto trading dashboard with glowing charts and neon lights")} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:bg-white/10 transition-colors">Trading Dashboard</button>
              <button onClick={() => setPrompt("A luxury casino slot machine game with gold accents and vibrant colors")} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:bg-white/10 transition-colors">Casino Game</button>
              <button onClick={() => setPrompt("A professional esports tournament stage with massive screens and crowd")} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 hover:bg-white/10 transition-colors">Esports Stage</button>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-yellow-500 text-black py-4 rounded-xl font-black uppercase text-sm shadow-xl shadow-yellow-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Wand2 size={20} />
                Generate Image
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase text-center tracking-widest">
              {error}
            </div>
          )}
        </div>

        <AnimatePresence>
          {imageUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img src={imageUrl} alt="Generated" className="w-full h-auto" />
              </div>
              <a 
                href={imageUrl} 
                download="elite-ai-image.png"
                className="w-full bg-white/10 text-white py-4 rounded-xl font-black uppercase text-sm border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Download size={20} />
                Download Image
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
