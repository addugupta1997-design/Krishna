import React from 'react';
import { MapPin, Clock, Phone, Instagram } from 'lucide-react';
import { BrandLogo, FooterCornerMandala } from './Ornaments';
import type { WebsiteSettings } from '../types';

interface FooterProps {
  settings: WebsiteSettings;
  onNavigateCategory?: (categoryName: string) => void;
  onNavigatePage?: (path: string) => void;
}

export function Footer({ settings, onNavigateCategory, onNavigatePage }: FooterProps) {
  // Format address for Google Maps directions
  const mapQuery = encodeURIComponent(`${settings.address.replace(/\n/g, ' ')}, Delhi`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  // Collection tags matching the compact footer reference
  const collectionTags = [
    { label: 'WEDDING ESSENTIALS', query: 'Wedding Essentials' },
    { label: 'SHRINGAAR', query: 'Bhagwan Ji Shringaar' },
    { label: 'FESTIVE DÉCOR', query: 'Festive Décor' },
    { label: 'LACES & BORDERS', query: 'Laces & Latkans' },
    { label: 'DEVOTIONAL WEAR', query: 'Bhagwan Ji Shringaar' },
  ];

  return (
    <footer className="relative w-full bg-[#682D42] text-[#FFF8EE] overflow-hidden border-t border-[#B58A42]/30 selection:bg-[#B58A42] selection:text-[#682D42]">
      {/* Corner mandala flourishes */}
      <FooterCornerMandala className="absolute top-0 right-0 w-24 h-24 text-[#B58A42] pointer-events-none" />
      <FooterCornerMandala className="absolute bottom-0 left-0 w-24 h-24 text-[#B58A42] pointer-events-none -scale-x-100 -scale-y-100" />

      <div className="container-public py-6 sm:py-7 relative z-10">
        {/* ROW 1: Address | Timings | Call/WhatsApp */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 pb-6 border-b border-[#B58A42]/25 items-center w-full">
          {/* Address - starts at left edge */}
          <div className="flex items-start gap-3.5 justify-self-start">
            <div className="p-2 rounded-full bg-[#B58A42]/15 text-[#DFBE7A] shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-[13px] leading-relaxed text-[#FFF8EE]/90 hover:text-[#DFBE7A] transition-colors block text-left"
                title="View on Google Maps"
              >
                {settings.address.split('\n').map((line, idx) => (
                  <span key={idx} className="block">
                    {line}
                  </span>
                ))}
              </a>
            </div>
          </div>

          {/* Timings - centred on midpoint */}
          <div className="flex items-start gap-3.5 justify-self-start md:justify-self-center md:border-l md:border-r md:border-[#B58A42]/20 md:px-8 w-full md:w-auto h-full items-center">
            <div className="p-2 rounded-full bg-[#B58A42]/15 text-[#DFBE7A] shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-serif text-sm font-semibold tracking-wide text-[#DFBE7A]">
                Timings
              </span>
              <p className="text-xs sm:text-[13px] text-[#FFF8EE]/90 mt-0.5">
                {settings.timings} <span className="text-[#B58A42] mx-1">|</span> Closed {settings.closedDay}
              </p>
            </div>
          </div>

          {/* Call / WhatsApp - ends at right edge */}
          <div className="flex items-start gap-3.5 justify-self-start md:justify-self-end text-left">
            <div className="p-2 rounded-full bg-[#B58A42]/15 text-[#DFBE7A] shrink-0 mt-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block font-serif text-sm font-semibold tracking-wide text-[#DFBE7A]">
                Call / WhatsApp
              </span>
              <div className="text-xs sm:text-[13px] text-[#FFF8EE]/90 mt-0.5 space-y-0.5">
                <a
                  href={`tel:${settings.primaryCallNumber.replace(/\s+/g, '')}`}
                  className="block py-1.5 hover:text-[#DFBE7A] transition-colors"
                >
                  {settings.primaryCallNumber}
                </a>
                {settings.secondaryCallNumber && (
                  <a
                    href={`tel:${settings.secondaryCallNumber.replace(/\s+/g, '')}`}
                    className="block py-1.5 hover:text-[#DFBE7A] transition-colors"
                  >
                    {settings.secondaryCallNumber}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Brand & Since 1955 | Inline Store Categories | Instagram & Privacy Policy */}
        <div className="pt-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-3 gap-y-4 text-left md:flex md:flex-row md:justify-between md:gap-4 w-full">
          {/* Logo & Brand Wordmark */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:shrink-0">
            <BrandLogo size={32} src={settings.logoImage} className="border-[#B58A42]/50 bg-[#FFF8EE]" />
            <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-2.5">
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#FFF8EE]">
                Krishna Tracer
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest text-[#DFBE7A] uppercase font-sans font-medium">
                — SINCE 1955 —
              </span>
            </div>
          </div>

          {/* Compact Inline Collection Labels */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] tracking-wider text-[#FFF8EE]/80 font-medium px-4 border-x border-[#B58A42]/20">
            {collectionTags.map((tag, idx) => (
              <React.Fragment key={tag.label}>
                <button
                  onClick={() => onNavigateCategory && onNavigateCategory(tag.query)}
                  className="hover:text-[#DFBE7A] transition-colors uppercase whitespace-nowrap focus:outline-none"
                >
                  {tag.label}
                </button>
                {idx < collectionTags.length - 1 && (
                  <span className="text-[#B58A42] mx-1">•</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Right Group: Instagram Link + Privacy Policy Link */}
          <div className="flex w-full min-w-0 items-center justify-end gap-3 sm:gap-4 md:w-auto md:shrink-0">
            {settings.instagramUrl &&
            settings.instagramUrl.trim().startsWith('https://') &&
            settings.instagramUrl.includes('instagram.com') ? (
              <a
                href={settings.instagramUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center gap-2 py-1.5 text-xs sm:text-[13px] text-[#FFF8EE]/90 hover:text-[#DFBE7A] transition-colors"
                title="Follow Krishna Tracers on Instagram"
              >
                <Instagram className="w-4 h-4 text-[#DFBE7A] shrink-0" />
                <span className="min-w-0 break-words font-medium tracking-wide">Krishna Tracers</span>
              </a>
            ) : (
              <span className="inline-flex min-w-0 items-center gap-2 text-xs sm:text-[13px] text-[#FFF8EE]/60 cursor-default">
                <Instagram className="w-4 h-4 text-[#DFBE7A]/60 shrink-0" />
                <span className="min-w-0 break-words font-medium tracking-wide">Krishna Tracers</span>
              </span>
            )}

            <span className="text-[#B58A42]/60 hidden sm:inline">•</span>

            <a
              href="/privacy-policy"
              onClick={(event) => {
                if (onNavigatePage) {
                  event.preventDefault();
                  onNavigatePage('/privacy-policy');
                }
              }}
              className="inline-flex items-center py-1.5 text-xs sm:text-[13px] text-[#FFF8EE]/90 hover:text-[#DFBE7A] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DFBE7A]"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
