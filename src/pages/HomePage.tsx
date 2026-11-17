import { useStorefrontMotion } from '../hooks/useStorefrontMotion';
import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Play,
  MapPin,
  Clock,
  Navigation,
  MessageCircle,
} from 'lucide-react';
import {
  BotanicalSprig,
  FloralDivider,
  PhotoEnquiryGraphic,
} from '../components/Ornaments';
import { AnimatedHeading } from '../components/AnimatedHeading';
import { ShoppingGuide } from '../components/ShoppingGuide';
import { SpotlightStrip } from '../components/SpotlightStrip';
import { VideoModal } from '../components/VideoModal';
import {
  createWhatsAppGeneralLink,
  createWhatsAppPhotoEnquiryLink,
} from '../utils/whatsapp';
import type { Category, Product, WebsiteSettings, ProductVideoItem } from '../types';

interface HomePageProps {
  categories: Category[];
  products: Product[];
  settings: WebsiteSettings;
  onNavigate: (path: string) => void;
  onSelectProduct: (product: Product) => void;
}

export function HomePage({
  categories,
  products,
  settings,
  onNavigate,
  onSelectProduct,
}: HomePageProps) {
  const motionRoot = useRef<HTMLDivElement>(null);
  useStorefrontMotion(motionRoot, settings);
  const whatsappGeneralUrl = createWhatsAppGeneralLink(settings.whatsappNumber);
  const whatsappPhotoEnquiryUrl = createWhatsAppPhotoEnquiryLink(settings.whatsappNumber);

  // Active video modal state
  const [activeVideo, setActiveVideo] = useState<ProductVideoItem | null>(null);
  const triggerButtonRef = useRef<HTMLElement | null>(null);

  // Filter products for spotlight: visible and isHighlighted
  const highlightedProducts = products.filter((p) => p.isVisible && p.isHighlighted);

  // Filter visible categories sorted by displayOrder
  const visibleCategories = [...categories]
    .filter((c) => c.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Filter active product videos
  const activeVideos = (settings.productVideos || [])
    .filter((v) => v.isVisible && v.videoUrl)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Google Maps URL
  const mapQuery = encodeURIComponent(`${settings.address.replace(/\n/g, ' ')}, Delhi`);
  const mapsUrl = settings.visitDirectionsUrl || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div ref={motionRoot} className="w-full flex flex-col overflow-x-hidden">
      {/* =========================================================================
          SECTION 2: STATIC HERO (Full-Width Continuous Editorial Hero)
         ========================================================================= */}
      
      {/* --- DESKTOP HERO (md and above) --- */}
      <section data-motion-hero className="hidden md:flex relative w-full bg-[#FFF8EE] min-h-[580px] lg:min-h-[620px] xl:min-h-[650px] overflow-hidden items-center border-b border-[#B58A42]/15">
        {/* Full-bleed Right Photography (occupies ~58-60% width, spans top to bottom and right edge) */}
        <div className="absolute right-0 top-0 bottom-0 w-[58%] lg:w-[60%] xl:w-[62%] h-full z-0 overflow-hidden">
          <img
            src={settings.heroImage}
            alt="Krishna Tracer Wedding Details & Shringaar"
            className="w-full h-full object-cover object-[24%_center] xl:object-[20%_center]"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/hero_photography.jpg';
            }}
          />
          {/* Subtle horizontal cream-to-transparent fade across the left edge of the photo */}
          <div className="absolute inset-y-0 left-0 w-36 lg:w-48 xl:w-64 bg-gradient-to-r from-[#FFF8EE] via-[#FFF8EE]/80 via-35% to-transparent pointer-events-none" />
        </div>

        {/* Upper-left botanical flourish matching approved reference */}
        <div className="absolute top-4 lg:top-6 left-4 lg:left-6 z-10 pointer-events-none">
          <BotanicalSprig className="w-20 h-28 lg:w-24 lg:h-36 text-[#B58A42]/70 rotate-[-10deg]" />
        </div>

        {/* Lower-left botanical flourish matching approved reference */}
        <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 z-10 pointer-events-none">
          <BotanicalSprig className="w-20 h-28 lg:w-24 lg:h-36 text-[#B58A42]/70 scale-y-[-1] rotate-[10deg]" />
        </div>

        {/* Left Content Area (occupies ~40-42% width, vertically centered, 4-6% from viewport edge) */}
        <div className="relative z-10 w-full flex items-center pl-[5%] lg:pl-[6%] xl:pl-[7%] pr-4 py-12 lg:py-16">
          <div className="max-w-[450px] lg:max-w-[500px]">
            {/* Small uppercase wine eyebrow */}
            <span className="text-[11px] lg:text-xs font-semibold uppercase tracking-[0.24em] text-[#682D42] mb-3 lg:mb-4 block">
              FOR EVERY BEAUTIFUL TRADITION
            </span>

            {/* Serif Heading with exact desktop line breaks */}
            <h1 className="font-serif text-5xl lg:text-[68px] xl:text-[74px] font-normal text-[#682D42] leading-[1.08] tracking-tight mb-3">
              {settings.heroHeadline}
            </h1>

            {/* Thin gold decorative divider */}
            <div className="my-3.5">
              <FloralDivider className="justify-start ml-0.5" />
            </div>

            {/* Supporting description in serif, constrained to short lines */}
            <p className="font-serif text-lg lg:text-[21px] text-[#682D42]/90 leading-snug max-w-[420px] mb-8">
              Wedding essentials, divine shringaar<br />
              and festive décor — all in one place.
            </p>

            {/* Vertically stacked primary and secondary actions */}
            <div data-motion-actions className="flex flex-col items-start gap-2.5">
              <button
                onClick={() => onNavigate('/store')}
                className="w-full max-w-[280px] lg:max-w-[310px] h-[52px] lg:h-[54px] rounded-lg bg-[#682D42] text-[#FFF8EE] font-serif text-lg font-semibold hover:bg-[#4F1E30] transition-colors shadow-sm flex items-center justify-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42]"
              >
                <span>Explore Store</span>
                <ArrowRight className="w-4 h-4 text-[#DFBE7A] group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={whatsappGeneralUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-[280px] lg:max-w-[310px] text-center text-sm font-medium text-[#682D42] underline underline-offset-4 hover:text-[#B58A42] transition-colors py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42]"
              >
                Enquire on WhatsApp
              </a>
            </div>

            {/* Heritage strip — fills the lower-left hero space */}
            <div className="mt-10 lg:mt-14 pt-5 border-t border-[#B58A42]/30 flex items-center gap-6 lg:gap-8">
              <div>
                <div className="font-serif text-2xl lg:text-3xl font-semibold text-[#682D42] leading-none">1955</div>
                <div className="text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-[#8C6627] mt-1.5">Serving since</div>
              </div>
              <div className="w-px h-9 bg-[#B58A42]/40" aria-hidden="true" />
              <div>
                <div className="font-serif text-2xl lg:text-3xl font-semibold text-[#682D42] leading-none">{new Date().getFullYear() - 1955}+</div>
                <div className="text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-[#8C6627] mt-1.5">Years of craft</div>
              </div>
              <div className="w-px h-9 bg-[#B58A42]/40" aria-hidden="true" />
              <div>
                <div className="font-serif text-lg lg:text-xl font-semibold text-[#682D42] leading-none">Tilak Nagar</div>
                <div className="text-[10px] lg:text-[11px] uppercase tracking-[0.18em] text-[#8C6627] mt-1.5">New Delhi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MOBILE HERO (below md) --- */}
      <section data-motion-hero className="flex md:hidden flex-col items-center text-center bg-[#FFF8EE] pt-7 pb-8 px-4 overflow-hidden border-b border-[#B58A42]/15">
        {/* Eyebrow */}
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#682D42] mb-2.5 block">
          FOR EVERY BEAUTIFUL TRADITION
        </span>

        {/* Heading: approx 36-42px adjusted for narrow screens */}
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#682D42] leading-[1.15] tracking-tight mb-2.5 px-2">
          {settings.heroHeadline}
        </h1>

        {/* Floral center divider */}
        <div className="my-1.5 flex justify-center">
          <FloralDivider className="justify-center" />
        </div>

        {/* Supporting description */}
        <p className="font-serif text-base text-[#682D42]/90 leading-snug px-3 max-w-sm mb-5">
          Wedding essentials, divine shringaar and festive décor — all in one place.
        </p>

        {/* Large clean product photography spanning mobile hero width */}
        <div className="w-full max-w-md aspect-[16/10] overflow-hidden bg-[#F6DCE3]/30 mb-6 relative">
          <img
            src={settings.heroImage}
            alt="Krishna Tracer Wedding Essentials and Shringaar"
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/hero_photography.jpg';
            }}
          />
        </div>

        {/* Primary CTA and Secondary Link below the photograph */}
        <div className="flex flex-col items-center gap-2.5 w-full max-w-[300px]">
          <button
            onClick={() => onNavigate('/store')}
            className="w-full h-[50px] rounded-lg bg-[#682D42] text-[#FFF8EE] font-serif text-base font-semibold hover:bg-[#4F1E30] transition-colors shadow-sm flex items-center justify-center gap-2 group"
          >
            <span>Explore Store</span>
            <ArrowRight className="w-4 h-4 text-[#DFBE7A] group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href={whatsappGeneralUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#682D42] underline underline-offset-4 hover:text-[#B58A42] transition-colors py-1"
          >
            Enquire on WhatsApp
          </a>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: IN THE SPOTLIGHT (Continuous Left-to-Right Marquee)
         ========================================================================= */}
      <SpotlightStrip
        products={highlightedProducts}
        onSelectProduct={onSelectProduct}
      />

      {/* =========================================================================
          SECTION 4: A COLLECTION FOR EVERY OCCASION (5 Tiles)
         ========================================================================= */}
      <section className="w-full py-10 sm:py-14 bg-[#FFF8EE] border-b border-[#B58A42]/15">
        <div className="container-public">
          <div className="text-center mb-8 sm:mb-10">
            <FloralDivider />
            <AnimatedHeading as="h2" className="mt-1">
              A collection for every occasion
            </AnimatedHeading>
          </div>

          {/* Desktop 5-Tile Row Grid */}
          <div data-motion-categories className="hidden lg:grid lg:grid-cols-5 gap-4 xl:gap-5">
            {visibleCategories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate(`/store?category=${encodeURIComponent(cat.name)}`)}
                className="group flex flex-col rounded-xl overflow-hidden border border-[#B58A42]/40 bg-[#FFF8EE] shadow-xs hover:shadow-md hover:border-[#682D42] transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42]"
              >
                <div className="w-full aspect-[4/3] overflow-hidden bg-[#F6DCE3]/40 relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/cat_wedding.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="py-3 px-2 bg-[#FFF8EE] border-t border-[#B58A42]/30 flex-1 flex items-center justify-center">
                  <span className="font-serif text-sm xl:text-base font-bold text-[#682D42] group-hover:text-[#B58A42] transition-colors leading-tight">
                    {cat.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Tablet & Mobile Grid (2 columns on mobile with 5th tile spanning full width) */}
          <div data-motion-categories className="grid grid-cols-2 md:grid-cols-3 lg:hidden gap-3.5 sm:gap-5">
            {visibleCategories.slice(0, 5).map((cat, idx) => {
              const isFifthOdd = idx === 4;
              return (
                <button
                  key={cat.id}
                  onClick={() => onNavigate(`/store?category=${encodeURIComponent(cat.name)}`)}
                  className={`group flex flex-col rounded-xl overflow-hidden border border-[#B58A42]/40 bg-[#FFF8EE] shadow-xs hover:shadow-md hover:border-[#682D42] transition-all text-center ${
                    isFifthOdd ? 'col-span-2 md:col-span-1 md:col-start-2 max-w-sm mx-auto w-full' : ''
                  }`}
                >
                  <div className="w-full aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-[#F6DCE3]/40 relative">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/cat_wedding.jpg';
                      }}
                    />
                  </div>
                  <div className="py-2.5 px-2 bg-[#FFF8EE] border-t border-[#B58A42]/30">
                    <span className="font-serif text-sm sm:text-base font-bold text-[#682D42] leading-tight block">
                      {cat.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: A CLOSER LOOK — PRODUCT VIDEOS
         ========================================================================= */}
      {settings.showVideosSection !== false && activeVideos.length > 0 && (
        <section className="w-full py-10 sm:py-14 bg-[#F6DCE3] border-b border-[#B58A42]/20">
          <div className="container-public">
            {/* Header */}
            <div className="text-center mb-7 sm:mb-9">
              <div className="flex items-center justify-center gap-3 mb-1">
                <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/60" />
                <span className="text-[#B58A42] text-xs">❖</span>
                <AnimatedHeading as="h2">
                  {settings.videosHeading || 'A closer look'}
                </AnimatedHeading>
                <span className="text-[#B58A42] text-xs">❖</span>
                <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/60" />
              </div>
              <p className="font-serif italic text-sm sm:text-base text-[#682D42]/90 mt-1">
                {settings.videosSubtitle || 'The details make all the difference.'}
              </p>
            </div>

            {/* Desktop 4 Portrait Video Cards */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {activeVideos.map((video) => (
                <div
                  key={video.id}
                  className="group flex flex-col rounded-xl overflow-hidden border border-[#B58A42]/40 bg-[#FFF8EE] shadow-xs hover:shadow-md transition-all relative"
                >
                  {/* Portrait Video Thumbnail with Play Button */}
                  <div className="relative aspect-[3/4] bg-[#FFF8EE] overflow-hidden">
                    <img
                      src={video.posterImage}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors" />

                    {/* Centered Play Button */}
                    <button
                      onClick={(e) => {
                        triggerButtonRef.current = e.currentTarget;
                        setActiveVideo(video);
                      }}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer focus:outline-none"
                      aria-label={`Play video: ${video.title}`}
                    >
                      <div className="w-13 h-13 rounded-full bg-[#682D42]/90 border border-[#DFBE7A] text-[#FFF8EE] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </button>
                  </div>

                  {/* Card Title Bar */}
                  <div className="py-3 px-3 bg-[#FFF8EE] text-center border-t border-[#B58A42]/30">
                    <span className="font-serif text-sm font-bold text-[#682D42]">
                      {video.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Horizontally Scrollable Row */}
            <div className="flex sm:hidden overflow-x-auto gap-4 snap-x pb-3 scrollbar-none -mx-4 px-4">
              {activeVideos.map((video) => (
                <div
                  key={video.id}
                  className="w-48 shrink-0 snap-start flex flex-col rounded-xl overflow-hidden border border-[#B58A42]/40 bg-[#FFF8EE] shadow-xs"
                >
                  <div className="relative aspect-[3/4] bg-[#FFF8EE] overflow-hidden">
                    <img
                      src={video.posterImage}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={(e) => {
                        triggerButtonRef.current = e.currentTarget;
                        setActiveVideo(video);
                      }}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      aria-label={`Play video: ${video.title}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#682D42]/90 border border-[#DFBE7A] text-[#FFF8EE] flex items-center justify-center shadow-md">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </button>
                  </div>
                  <div className="py-2.5 px-2 bg-[#FFF8EE] text-center border-t border-[#B58A42]/30">
                    <span className="font-serif text-xs font-bold text-[#682D42]">
                      {video.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 6: SHORT BRAND STORY (Since 1955, in Tilak Nagar)
         ========================================================================= */}
      {settings.showStorySection !== false && (
        <section data-motion-story className="w-full py-12 sm:py-16 bg-[#FFF8EE] border-b border-[#B58A42]/20">
          <div className="container-public">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Shop Detail Photo */}
              <div className="md:col-span-6">
                <div className="rounded-2xl overflow-hidden border border-[#B58A42]/40 shadow-sm aspect-[16/10] bg-[#F6DCE3]/30 relative">
                  {settings.storyVideo ? (
                    <video
                      src={settings.storyVideo}
                      poster={settings.storyImage || '/assets/images/story_shop_detail.jpg'}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={settings.storyImage || '/assets/images/story_shop_detail.jpg'}
                      alt="Krishna Tracer Heritage Collection & Laces"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/prod_laces.jpg';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Right Story Text */}
              <div className="md:col-span-6 relative flex flex-col items-start">
                <div className="hidden lg:block absolute -top-4 -left-6 pointer-events-none">
                  <BotanicalSprig className="w-14 h-20 text-[#B58A42]/60 rotate-[-12deg]" />
                </div>

                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#682D42] mb-2 block">
                  OUR STORY
                </span>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#682D42] leading-[1.18] tracking-tight mb-3">
                  {settings.storyHeading || 'Since 1955, in Tilak Nagar.'}
                </h2>

                <p className="font-serif text-base sm:text-lg text-[#352D2F]/85 leading-relaxed max-w-md mb-6">
                  {settings.storyDescription ||
                    'Wedding traditions, festive moments and the little details that make them special.'}
                </p>

                <button
                  onClick={() => onNavigate('/our-story')}
                  className="font-serif text-base font-bold text-[#682D42] hover:text-[#B58A42] underline decoration-[#B58A42]/60 underline-offset-4 transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42]"
                >
                  <span>Discover our story</span>
                  <ArrowRight className="w-4 h-4 text-[#B58A42]" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 7: WHATSAPP PHOTO ENQUIRY (Looking for something specific?)
         ========================================================================= */}
      {settings.showPhotoEnquirySection !== false && (
        <section className="w-full py-8 sm:py-10 bg-[#F6DCE3] border-b border-[#B58A42]/20">
          <div className="container-public">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left Text */}
              <div className="text-center md:text-left max-w-xl">
                <AnimatedHeading as="h2" className="mb-1.5">
                  {settings.photoEnquiryHeading || 'Looking for something specific?'}
                </AnimatedHeading>
                <p className="text-xs sm:text-sm text-[#352D2F]/85 leading-relaxed">
                  {settings.photoEnquiryText ||
                    'Send us a photo of the design or product on WhatsApp. Ask us about availability.'}
                </p>
              </div>

              {/* Right Action Container: Illustration immediately to the left of the button */}
              <div className="flex items-center justify-center md:justify-end gap-4 sm:gap-5 shrink-0 w-full md:w-auto">
                <div className="shrink-0 flex items-center justify-center">
                  <PhotoEnquiryGraphic className="w-20 h-14" />
                </div>
                <a
                  href={whatsappPhotoEnquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-[#682D42] text-[#FFF8EE] font-serif text-base font-semibold hover:bg-[#4F1E30] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42] shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>{settings.photoEnquiryButtonText || 'Send a Photo on WhatsApp'}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 8: VISIT KRISHNA TRACER
         ========================================================================= */}
      {settings.showVisitSection !== false && (
        <section className="w-full py-10 sm:py-14 bg-[#FFF8EE]">
          <div className="container-public">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3">
                <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/60" />
                <span className="text-[#B58A42] text-xs">❖</span>
                <AnimatedHeading as="h2">
                  {settings.visitHeading || 'Visit Krishna Tracer'}
                </AnimatedHeading>
                <span className="text-[#B58A42] text-xs">❖</span>
                <span className="h-[1px] w-12 sm:w-16 bg-[#B58A42]/60" />
              </div>
            </div>

            {/* Content Split: Real Shop Photo (if uploaded) or tidy text layout */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12">
              {/* If a real shop photo has been uploaded, render it */}
              {settings.visitShopPhoto ? (
                <div className="w-full md:w-1/2 max-w-md aspect-[16/10] rounded-xl overflow-hidden border border-[#B58A42]/40 shadow-xs bg-[#F6DCE3]/30">
                  <img
                    src={settings.visitShopPhoto}
                    alt="Krishna Tracer Store Front"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              {/* Store Details Card (centered when no shop photo uploaded) */}
              <div
                className={`w-full ${
                  settings.visitShopPhoto ? 'md:w-1/2' : 'max-w-xl mx-auto'
                } bg-[#FFF8EE] rounded-2xl border border-[#B58A42]/40 p-6 sm:p-7 shadow-2xs space-y-4`}
              >
                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-[#F6DCE3] text-[#682D42] shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-[#682D42]" />
                  </div>
                  <div>
                    <AnimatedHeading as="h3">
                      Tilak Nagar, New Delhi
                    </AnimatedHeading>
                    <p className="text-xs sm:text-sm text-[#352D2F]/80 leading-relaxed mt-0.5 whitespace-pre-line">
                      {settings.address}
                    </p>
                  </div>
                </div>

                {/* Timings */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#B58A42]/15">
                  <div className="p-2 rounded-full bg-[#F6DCE3] text-[#682D42] shrink-0">
                    <Clock className="w-5 h-5 text-[#682D42]" />
                  </div>
                  <div className="text-xs sm:text-sm text-[#352D2F]/85">
                    <strong>{settings.timings}</strong> <span className="text-[#B58A42] mx-1">·</span> Closed {settings.closedDay}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#B58A42]/70 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#F6DCE3]/50 transition-colors shadow-2xs"
                  >
                    <Navigation className="w-4 h-4 text-[#B58A42]" />
                    <span>Get Directions</span>
                  </a>

                  <a
                    href={whatsappGeneralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30] transition-colors shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <ShoppingGuide settings={settings} onNavigate={onNavigate} />

      {/* Product Video Modal */}
      <VideoModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
        triggerElementRef={triggerButtonRef.current}
      />
    </div>
  );
}
