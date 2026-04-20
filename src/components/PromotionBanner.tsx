import React from 'react';

const PromotionBanner = () => {
  const promo = "Welcome to L's Baji! Download our official mobile app for the best experience - https://l-s-baji.vercel.app/ | Enjoy fast withdrawals, secure betting, and 24/7 support. Join the elite community today!";

  return (
    <div className="w-full elite-glass border-y border-yellow-500/20 py-2.5 overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.1)]">
      <div className="whitespace-nowrap animate-marquee text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">
        <span className="mx-4 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">{promo}</span>
      </div>
    </div>
  );
};

export default PromotionBanner;
