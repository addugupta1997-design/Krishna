import React from 'react';
import { MapPin, Phone, MessageCircle, Clock, Navigation, Gift, Sparkles, HelpCircle } from 'lucide-react';
import { FloralCorner, FloralDivider } from '../components/Ornaments';
import { createWhatsAppGeneralLink, createWhatsAppCustomLink } from '../utils/whatsapp';
import type { WebsiteSettings } from '../types';

interface VisitUsPageProps {
  settings: WebsiteSettings;
  onNavigate: (path: string) => void;
}

export function VisitUsPage({ settings, onNavigate }: VisitUsPageProps) {
  const whatsappUrl = createWhatsAppGeneralLink(settings.whatsappNumber);
  const photoEnquiryUrl = createWhatsAppCustomLink(
    settings.whatsappNumber,
    "Namaste Krishna Tracer! I have a specific product in mind and would like to share a picture to check availability."
  );

  const mapQuery = encodeURIComponent(`${settings.address.replace(/\n/g, ' ')}, Delhi`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="w-full bg-[#FFF8EE] flex flex-col">
      {/* Top Hero Section */}
      <section className="relative w-full py-10 sm:py-16 border-b border-[#B58A42]/20">
        <div className="container-public">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-end">
            {/* Left Store Card */}
            <div className="lg:col-span-6 relative lg:pl-8">
              <div className="hidden sm:block absolute -top-4 -left-4">
                <FloralCorner className="w-14 h-14 text-[#B58A42]/60" />
              </div>

              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#B58A42] mb-3 block">
                FOR EVERY BEAUTIFUL TRADITION
              </span>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#682D42] leading-[1.15] tracking-tight mb-2">
                Come find your favourites.
              </h1>

              <div className="my-2">
                <FloralDivider className="justify-start ml-2" />
              </div>

              <p className="text-base text-[#352D2F]/80 mb-6 font-medium">
                Visit Krishna Tracer in Tilak Nagar, Delhi.
              </p>

              {/* Store Info Box matching reference */}
              <div className="bg-[#FFF8EE] rounded-2xl border border-[#B58A42]/50 p-6 sm:p-7 shadow-sm space-y-4 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-[#F6DCE3] text-[#682D42] shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-[#682D42]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#682D42]">
                      Krishna Tracer
                    </h2>
                    <p className="text-xs sm:text-sm text-[#352D2F]/80 leading-relaxed mt-0.5 whitespace-pre-line">
                      {settings.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-[#B58A42]/20">
                  <div className="p-2 rounded-full bg-[#F6DCE3] text-[#682D42] shrink-0">
                    <Clock className="w-5 h-5 text-[#682D42]" />
                  </div>
                  <div className="text-xs sm:text-sm text-[#352D2F]/85">
                    <strong>Timings:</strong> {settings.timings} <span className="text-[#B58A42] mx-1">|</span> Closed on {settings.closedDay}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-[#B58A42]/20">
                  <div className="p-2 rounded-full bg-[#F6DCE3] text-[#682D42] shrink-0">
                    <Phone className="w-5 h-5 text-[#682D42]" />
                  </div>
                  <div className="text-xs sm:text-sm text-[#352D2F]/85 space-x-2">
                    <a href={`tel:${settings.primaryCallNumber.replace(/\s+/g, '')}`} className="hover:text-[#B58A42] font-semibold underline decoration-[#B58A42]/40">
                      {settings.primaryCallNumber}
                    </a>
                    {settings.secondaryCallNumber && (
                      <>
                        <span>•</span>
                        <a href={`tel:${settings.secondaryCallNumber.replace(/\s+/g, '')}`} className="hover:text-[#B58A42] font-semibold underline decoration-[#B58A42]/40">
                          {settings.secondaryCallNumber}
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Dual Action Buttons */}
                <div className="pt-3 space-y-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#682D42] text-[#FFF8EE] text-sm font-semibold hover:bg-[#4F1E30] transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${settings.primaryCallNumber.replace(/\s+/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#B58A42]/70 text-[#682D42] text-xs font-semibold hover:bg-[#F6DCE3]/50 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#B58A42]" />
                      <span>Call the Store</span>
                    </a>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#B58A42]/70 text-[#682D42] text-xs font-semibold hover:bg-[#F6DCE3]/50 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#B58A42]" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>

                <p className="text-[11px] text-[#352D2F]/60 text-center italic pt-1">
                  Message us for exact directions and current store timings.
                </p>
              </div>
            </div>

            {/* Right Photo */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-[#B58A42]/40 shadow-xl aspect-[4/3] bg-[#F6DCE3]/30">
                <img
                  src={settings.visitUsImage || '/assets/images/hero_photography.jpg'}
                  alt="Krishna Tracer Store Visit"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLAN YOUR VISIT BAR */}
      <section className="w-full bg-[#F6DCE3] py-7 sm:py-8 border-b border-[#B58A42]/20">
        <div className="container-public">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Section label */}
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#682D42] text-center md:text-left">
              Plan your visit
            </div>

            {/* Quick action 1 */}
            <button
              onClick={() => onNavigate('/store')}
              className="flex items-center justify-between md:justify-center gap-3 p-3 rounded-xl bg-[#FFF8EE] border border-[#B58A42]/30 text-left hover:border-[#682D42] transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-[#B58A42] shrink-0" />
                <span className="font-serif text-sm font-semibold text-[#682D42]">
                  Explore the collections
                </span>
              </div>
              <span className="text-[#B58A42] group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Quick action 2 */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between md:justify-center gap-3 p-3 rounded-xl bg-[#FFF8EE] border border-[#B58A42]/30 text-left hover:border-[#682D42] transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-serif text-sm font-semibold text-[#682D42]">
                  Ask about availability
                </span>
              </div>
              <span className="text-[#B58A42] group-hover:translate-x-1 transition-transform">→</span>
            </a>

            {/* Quick action 3 */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between md:justify-center gap-3 p-3 rounded-xl bg-[#FFF8EE] border border-[#B58A42]/30 text-left hover:border-[#682D42] transition-colors shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#682D42] shrink-0" />
                <span className="font-serif text-sm font-semibold text-[#682D42]">
                  Visit us in Tilak Nagar
                </span>
              </div>
              <span className="text-[#B58A42] group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* HAVE A PRODUCT IN MIND? BOTTOM SECTION */}
      <section className="relative w-full py-12 sm:py-16 bg-[#FFF8EE] text-center overflow-hidden">
        <div className="hidden sm:block absolute bottom-0 left-0">
          <FloralCorner className="w-16 h-16 text-[#B58A42]/50 -scale-y-100" />
        </div>
        <div className="hidden sm:block absolute bottom-0 right-0">
          <FloralCorner className="w-16 h-16 text-[#B58A42]/50 -scale-x-100 -scale-y-100" />
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
          {/* Horizontally centred decorative divider with equal lines and central ornament */}
          <div className="flex items-center justify-center gap-3 mx-auto mb-4 sm:mb-5" aria-hidden="true">
            <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/60" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#B58A42] shrink-0">
              <path
                d="M12 3 C13.2 7 17 9 19 12 C17 15 13.2 17 12 21 C10.8 17 7 15 5 12 C7 9 10.8 7 12 3 Z"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <circle cx="12" cy="12" r="1.8" fill="currentColor" />
            </svg>
            <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/60" />
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#682D42] tracking-tight mb-2">
            Have a product in mind?
          </h2>
          <p className="text-sm sm:text-base text-[#352D2F]/80 mb-6 max-w-lg mx-auto">
            Send us a picture on WhatsApp. Let's help you find it.
          </p>

          <a
            href={photoEnquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#682D42] text-[#FFF8EE] font-serif text-base font-semibold hover:bg-[#4F1E30] transition-colors shadow-md"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Enquire on WhatsApp</span>
          </a>
        </div>
      </section>
    </div>
  );
}
