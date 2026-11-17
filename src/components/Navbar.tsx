import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Menu, X, MessageCircle, ExternalLink, ShoppingCart, UserRound } from 'lucide-react';
import { BrandLogo } from './Ornaments';
import { AuthDialog } from './AuthDialog';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { createWhatsAppGeneralLink } from '../utils/whatsapp';
import type { WebsiteSettings } from '../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  settings: WebsiteSettings;
  cartQuantity: number;
}

export function Navbar({ currentPath, onNavigate, settings, cartQuantity }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, oauthError } = useCustomerAuth();

  const reduceMotion = useReducedMotion();
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMobileMenuOpen(false); }, [currentPath]);
  // Surface a failed Google redirect instead of failing silently.
  useEffect(() => {
    if (oauthError) setAuthOpen(true);
  }, [oauthError]);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Store', path: '/store' },
    { name: 'Our Story', path: '/our-story' },
    { name: 'Visit Us', path: '/visit-us' },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
  };

  const whatsappUrl = createWhatsAppGeneralLink(settings.whatsappNumber);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[#682D42] text-[#FFF8EE] text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 border-b border-[#B58A42]/30">
        <span className="hidden sm:inline text-[#DFBE7A] text-xs">❖</span>
        <span>Wedding essentials, festive favourites & beautiful little details</span>
        <span className="hidden sm:inline text-[#DFBE7A] text-xs">❖</span>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-[#B58A42]/35 bg-[#FFF8EE] shadow-sm">
      {/* Main Navbar */}
      <nav className="container-public h-18 sm:h-20 flex items-center justify-between border-b border-[#B58A42]/20 bg-[#FFF8EE]">
        {/* Brand Left Lockup */}
        <div className="flex items-center gap-3">
          <button
            id="navbar-home"
            onClick={() => handleLinkClick('/')}
            className="flex items-center gap-3 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42] rounded-md"
          >
            <BrandLogo size={46} src={settings.logoImage} className="sm:w-[48px] sm:h-[48px] w-[36px] h-[36px] transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#682D42] leading-none">
                Krishna Tracer
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#8C6627] font-semibold uppercase mt-0.5">
                TILAK NAGAR · DELHI
              </span>
            </div>
          </button>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-5 lg:gap-10">
          {navLinks.map((link) => {
            const isActive = link.path === '/store'
              ? currentPath === '/store' || currentPath.startsWith('/store/') || currentPath === '/cart' || currentPath === '/checkout' || currentPath.startsWith('/order-status/')
              : currentPath === link.path;
            return (
              <button
                key={link.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleLinkClick(link.path)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42] rounded-xs ${
                  isActive
                    ? 'text-[#682D42] font-semibold'
                    : 'text-[#352D2F]/80 hover:text-[#682D42]'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.span layoutId="active-navigation" transition={{ duration: reduceMotion ? 0 : 0.25 }} className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#682D42] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            aria-label={user ? `Account, signed in as ${user.email}` : 'Sign in'}
            title={user ? user.email ?? 'Account' : 'Sign in'}
            className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-[#682D42] hover:bg-[#F6DCE3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
          >
            <UserRound className="h-5 w-5" />
            {user && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-[#FFF8EE]" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('/cart')}
            aria-label={`Cart${cartQuantity ? `, ${cartQuantity} items` : ''}`}
            className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-[#682D42] hover:bg-[#F6DCE3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartQuantity > 0 && <span key={cartQuantity} className="cart-badge absolute -right-1 -top-1 min-w-5 rounded-full bg-[#682D42] px-1 text-center text-[10px] leading-5 text-[#FFF8EE]">{cartQuantity > 99 ? '99+' : cartQuantity}</span>}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#B58A42]/80 bg-[#FFF8EE] text-[#682D42] text-xs font-semibold tracking-wide hover:bg-[#682D42] hover:text-[#FFF8EE] transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42]"
            aria-label="WhatsApp Us"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
            <span>WhatsApp Us</span>
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => handleLinkClick('/cart')}
            aria-label={`Cart${cartQuantity ? `, ${cartQuantity} items` : ''}`}
            className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-[#682D42] hover:bg-[#F6DCE3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartQuantity > 0 && <span key={cartQuantity} className="cart-badge absolute -right-1 -top-1 min-w-5 rounded-full bg-[#682D42] px-1 text-center text-[10px] leading-5 text-[#FFF8EE]">{cartQuantity > 99 ? '99+' : cartQuantity}</span>}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2 rounded-full border border-[#B58A42]/50 text-[#682D42] bg-[#FFF8EE] text-xs"
            aria-label="WhatsApp Us"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </a>
          <button
            ref={menuToggleRef}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#682D42] hover:bg-[#F6DCE3]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B58A42]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer / Dropdown */}
      <AnimatePresence initial={false}>
      {mobileMenuOpen && (
        <motion.div id="mobile-navigation" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="md:hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-b border-[#B58A42]/30 bg-[#FFF8EE] px-5 py-5 space-y-4 shadow-lg">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive = link.path === '/store'
                ? currentPath === '/store' || currentPath.startsWith('/store/') || currentPath === '/cart' || currentPath === '/checkout' || currentPath.startsWith('/order-status/')
                : currentPath === link.path;
              return (
                <button
                  key={link.path}
                aria-current={isActive ? 'page' : undefined}
                  onClick={() => handleLinkClick(link.path)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-serif text-left transition-colors ${
                    isActive
                      ? 'bg-[#F6DCE3] text-[#682D42] font-bold'
                      : 'text-[#352D2F] hover:bg-[#F6DCE3]/40'
                  }`}
                >
                  <span>{link.name}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#682D42]" />}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#B58A42]/20 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setAuthOpen(true); }}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-[#B58A42]/50 text-base font-serif text-[#682D42] hover:bg-[#F6DCE3]/40"
            >
              <span className="inline-flex items-center gap-2.5">
                <UserRound className="w-4 h-4" />
                {user ? 'My account' : 'Sign in'}
              </span>
              <span className="text-xs font-sans text-[#352D2F]/60 truncate max-w-[55%]">
                {user?.email ?? ''}
              </span>
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-full bg-[#682D42] text-[#FFF8EE] text-sm font-medium tracking-wide shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300" />
              <span>Chat on WhatsApp</span>
            </a>

            <div className="flex items-center justify-between text-xs text-[#352D2F]/70 pt-2 px-1">
              <span>Tilak Nagar, New Delhi</span>
              <button
                onClick={() => handleLinkClick('/admin/products')}
                className="text-[#B58A42] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Store Admin</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      </header>

      <AuthDialog open={authOpen} user={user} onClose={() => setAuthOpen(false)} initialError={oauthError} />
    </>
  );
}
