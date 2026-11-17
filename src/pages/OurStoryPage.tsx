import React from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { FloralCorner, FloralDivider } from '../components/Ornaments';
import { createWhatsAppGeneralLink } from '../utils/whatsapp';
import type { WebsiteSettings } from '../types';

interface OurStoryPageProps {
  settings: WebsiteSettings;
  onNavigate: (path: string) => void;
}

export function OurStoryPage({ settings, onNavigate }: OurStoryPageProps) {
  const whatsappUrl = createWhatsAppGeneralLink(settings.whatsappNumber);

  return (
    <div className="w-full bg-[#FFF8EE] flex flex-col">
      {/* Top Editorial Split Section */}
      <section className="relative w-full py-10 sm:py-16 border-b border-[#B58A42]/20">
        <div className="container-public">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left Photo */}
            <div className="lg:col-span-6 lg:pl-8">
              <div className="rounded-2xl overflow-hidden border border-[#B58A42]/40 shadow-xl aspect-[4/3] bg-[#F6DCE3]/30 relative">
                {settings.storyPageHeroVideo ? (
                  <video
                    src={settings.storyPageHeroVideo}
                    poster={settings.storyPageHeroImage || '/assets/images/hero_photography.jpg'}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={settings.storyPageHeroImage || '/assets/images/hero_photography.jpg'}
                    alt="Krishna Tracer Heritage Craftsmanship"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                )}
              </div>
            </div>

            {/* Right Story Text */}
            <div className="lg:col-span-6 relative flex flex-col items-center lg:items-start text-center lg:text-left py-4 lg:pl-8">
              <div className="hidden sm:block absolute -top-4 -left-4">
                <FloralCorner className="w-14 h-14 text-[#B58A42]/60" />
              </div>
              <div className="hidden sm:block absolute -bottom-4 right-0">
                <FloralCorner className="w-14 h-14 text-[#B58A42]/60 -scale-x-100 -scale-y-100" />
              </div>

              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#8C6627] mb-3 block">
                OUR STORY
              </span>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#682D42] leading-[1.15] tracking-tight mb-3">
                Rooted in tradition.<br />
                Made for your celebrations.
              </h1>

              <div className="my-2">
                <FloralDivider />
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#682D42] mt-2 mb-2">
                Krishna Tracer, Tilak Nagar
              </h2>

              <p className="text-base text-[#352D2F]/85 leading-relaxed max-w-lg mb-6">
                A place for wedding essentials, Bhagwan Ji shringaar, festive décor and the little details that bring your ideas to life.
              </p>

              {/* EST. 1955 Badge */}
              <div className="flex items-center gap-4 my-2">
                <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/50" />
                <span className="px-4 py-1.5 rounded-full border border-[#B58A42]/70 bg-[#FFF8EE] text-xs font-serif font-bold tracking-widest text-[#8C6627] shadow-2xs">
                  EST. 1955
                </span>
                <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE PILLARS (For your celebrations, devotion, creativity) */}
      <section className="w-full bg-[#F6DCE3]/50 py-12 sm:py-16 border-b border-[#B58A42]/20">
        <div className="container-public">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: Celebrations */}
            <div className="bg-[#FFF8EE] rounded-xl border border-[#B58A42]/30 p-5 sm:p-6 flex flex-col text-center shadow-xs">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#682D42] mb-4">
                For your celebrations
              </h3>
              <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#F6DCE3]/40 border border-[#B58A42]/20 mb-4">
                <img
                  src={settings.storyCelebrationsImage || '/assets/images/story_celebrations.jpg'}
                  alt="Wedding celebration essentials"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/prod_laces.jpg';
                  }}
                />
              </div>
              <p className="text-xs sm:text-sm text-[#352D2F]/75 leading-relaxed">
                Designer laces, embroidered borders, bridal thalis and festive accessories to make every wedding ritual memorable.
              </p>
            </div>

            {/* Card 2: Devotion */}
            <div className="bg-[#FFF8EE] rounded-xl border border-[#B58A42]/30 p-5 sm:p-6 flex flex-col text-center shadow-xs">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#682D42] mb-4">
                For your devotion
              </h3>
              <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#F6DCE3]/40 border border-[#B58A42]/20 mb-4">
                <img
                  src={settings.storyDevotionImage || '/assets/images/story_devotion.jpg'}
                  alt="Bhagwan Ji Shringaar poshaak and accessories"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/prod_shringaar.jpg';
                  }}
                />
              </div>
              <p className="text-xs sm:text-sm text-[#352D2F]/75 leading-relaxed">
                Sacred poshaaks, intricate mukuts, shringaar jewelry, and pooja adornments crafted with heartfelt reverence.
              </p>
            </div>

            {/* Card 3: Creativity */}
            <div className="bg-[#FFF8EE] rounded-xl border border-[#B58A42]/30 p-5 sm:p-6 flex flex-col text-center shadow-xs">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#682D42] mb-4">
                For your creativity
              </h3>
              <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#F6DCE3]/40 border border-[#B58A42]/20 mb-4">
                <img
                  src={settings.storyCreativityImage || '/assets/images/story_creativity.jpg'}
                  alt="Artisan latkans, tassels and craft supplies"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/prod_latkans.jpg';
                  }}
                />
              </div>
              <p className="text-xs sm:text-sm text-[#352D2F]/75 leading-relaxed">
                Handmade latkans, rich tassels, kundan buttons, and bespoke crafting supplies for tailors, designers, and artisans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA: Come explore our collections */}
      <section className="w-full py-12 sm:py-16 bg-[#FFF8EE] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FloralDivider />
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#682D42] tracking-tight mt-2 mb-6">
            Come explore our collections.
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/visit-us')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#682D42] text-[#FFF8EE] font-serif text-base font-semibold hover:bg-[#4F1E30] transition-colors shadow-sm"
            >
              <span>Visit Us</span>
              <ArrowRight className="w-4 h-4 text-[#DFBE7A]" />
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-[#B58A42]/70 text-[#682D42] font-medium text-sm hover:bg-[#F6DCE3]/50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}


