import React, { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Product } from '../types';

interface SpotlightStripProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export function SpotlightStrip({ products, onSelectProduct }: SpotlightStripProps) {
  const [isPaused, setIsPaused] = useState(false);

  if (!products || products.length === 0) return null;

  // Repeat products list for seamless continuous infinite marquee
  const items = products.length < 6 ? [...products, ...products, ...products] : products;

  return (
    <section
      className="w-full bg-[#F6DCE3] pt-5 pb-6 sm:pt-6 sm:pb-7 border-b border-[#B58A42]/25 relative"
      aria-label="Highlighted Products"
    >
      <div className="w-full px-4 sm:px-6 lg:px-10 mb-3.5 sm:mb-4">
        {/* Desktop View (sm and up): Single Row */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#682D42] tracking-tight">
              In the Spotlight
            </h2>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#B58A42]/40 bg-[#FFF8EE]/90 text-[#682D42] text-[11px] font-medium hover:bg-[#FFF8EE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42] shrink-0"
              aria-label={isPaused ? 'Resume scrolling spotlight' : 'Pause scrolling spotlight'}
              title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
            >
              {isPaused ? <Play className="w-3 h-3 text-[#B58A42]" /> : <Pause className="w-3 h-3 text-[#B58A42]" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
          </div>

          <div className="text-sm sm:text-base font-serif italic text-[#682D42] flex items-center gap-1.5 shrink-0">
            <span>A few favourites, passing by</span>
            <span className="text-[#B58A42] font-sans font-bold">→</span>
          </div>
        </div>

        {/* Mobile View (below sm): Two Rows */}
        <div className="sm:hidden flex flex-col gap-1.5">
          {/* Row 1: Flexible Heading + Fixed Right-Aligned Pause Button */}
          <div className="flex items-center justify-between gap-2.5 w-full">
            <h2 className="font-serif text-[22px] font-bold text-[#682D42] tracking-tight flex-1 min-w-0 leading-tight">
              In the Spotlight
            </h2>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#B58A42]/40 bg-[#FFF8EE] text-[#682D42] hover:bg-white transition-colors shrink-0 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42]"
              aria-label={isPaused ? 'Resume scrolling spotlight' : 'Pause scrolling spotlight'}
              title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[#B58A42]" /> : <Pause className="w-3.5 h-3.5 text-[#B58A42]" />}
            </button>
          </div>

          {/* Row 2: Subtitle in separate full-width row with arrow aligned */}
          <div className="flex items-center gap-1.5 text-xs font-serif italic text-[#682D42] leading-tight w-full">
            <span className="flex-1 min-w-0">A few favourites, passing by</span>
            <span className="text-[#B58A42] font-sans font-bold text-xs shrink-0">→</span>
          </div>
        </div>
      </div>

      {/* Marquee Carousel Container (Seamless Left-to-Right Loop) */}
      <div
        className="w-full overflow-hidden relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-3.5 sm:gap-5 w-max animate-marquee-ltr ${isPaused ? 'paused' : ''}`}
        >
          {/* Track 1: Interactive items with keyboard focus */}
          <div className="flex gap-3.5 sm:gap-5 shrink-0 pl-4">
            {items.map((prod, idx) => (
              <button
                key={`primary-${prod.id}-${idx}`}
                onClick={() => onSelectProduct(prod)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                className="w-40 sm:w-48 lg:w-52 bg-[#FFF8EE] rounded-xl border border-[#B58A42]/40 overflow-hidden flex flex-col text-center shadow-xs hover:shadow-md hover:border-[#682D42] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#682D42] group/card shrink-0"
                aria-label={`View ${prod.name}`}
              >
                {/* Pure Clean Product Image without embedded text */}
                <div className="w-full aspect-[4/3] bg-[#F6DCE3]/40 overflow-hidden relative">
                  <img
                    src={prod.image}
                    alt=""
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/prod_thali.jpg';
                    }}
                  />
                </div>
                {/* HTML Text Label below the image */}
                <div className="py-2.5 px-2 bg-[#FFF8EE] border-t border-[#B58A42]/25">
                  <span className="font-serif text-xs sm:text-sm font-bold text-[#682D42] line-clamp-1 group-hover/card:text-[#B58A42] transition-colors block">
                    {prod.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Track 2: Duplicate for seamless visual loop (tabIndex={-1} to avoid duplicate keyboard focus) */}
          <div className="flex gap-3.5 sm:gap-5 shrink-0" aria-hidden="true">
            {items.map((prod, idx) => (
              <div
                key={`duplicate-${prod.id}-${idx}`}
                onClick={() => onSelectProduct(prod)}
                className="w-40 sm:w-48 lg:w-52 bg-[#FFF8EE] rounded-xl border border-[#B58A42]/40 overflow-hidden flex flex-col text-center shadow-xs hover:shadow-md transition-all cursor-pointer group/card shrink-0"
              >
                <div className="w-full aspect-[4/3] bg-[#F6DCE3]/40 overflow-hidden relative">
                  <img
                    src={prod.image}
                    alt=""
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/prod_thali.jpg';
                    }}
                  />
                </div>
                <div className="py-2.5 px-2 bg-[#FFF8EE] border-t border-[#B58A42]/25">
                  <span className="font-serif text-xs sm:text-sm font-bold text-[#682D42] line-clamp-1 block">
                    {prod.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
