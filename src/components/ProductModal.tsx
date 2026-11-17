import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Share2, Check, ExternalLink } from 'lucide-react';
import type { Product, Category, WebsiteSettings } from '../types';
import { createWhatsAppOrderLink, createWhatsAppEnquiryLink } from '../utils/whatsapp';

interface ProductModalProps {
  product: Product | null;
  category?: Category;
  settings: WebsiteSettings;
  onClose: () => void;
}

export function ProductModal({ product, category, settings, onClose }: ProductModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const orderUrl = createWhatsAppOrderLink(settings.whatsappNumber, product.name, product.id);
  const enquiryUrl = createWhatsAppEnquiryLink(settings.whatsappNumber, product.name, product.id);

  const handleShare = async () => {
    const url = `${window.location.origin}/store?product=${encodeURIComponent(product.id)}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FFF8EE] rounded-2xl overflow-hidden shadow-2xl border border-[#B58A42]/40 text-[#352D2F] flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[#FFF8EE]/80 text-[#682D42] hover:bg-[#682D42] hover:text-[#FFF8EE] transition-colors focus:outline-none shadow-xs"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="w-full md:w-1/2 bg-[#F6DCE3]/30 min-h-[260px] md:min-h-[380px] relative overflow-hidden flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/prod_thali.jpg';
            }}
          />
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-3">
            {category && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B58A42] block">
                {category.name}
              </span>
            )}
            <h2
              id="product-modal-title"
              className="font-serif text-2xl sm:text-3xl font-bold text-[#682D42] leading-tight"
            >
              {product.name}
            </h2>

            {/* Price display */}
            <div className="py-1">
              {product.price && product.price > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold font-serif text-[#682D42]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#352D2F]/60">Approx. / Piece</span>
                </div>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full bg-[#F6DCE3]/60 text-xs font-medium text-[#682D42] border border-[#B58A42]/30">
                  Ask for price & availability
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-[#352D2F]/80 leading-relaxed pt-1">
              {product.description ||
                'Traditional handcrafted piece, crafted with rich materials and thoughtful finish for your celebrations and devotional shringaar.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 space-y-2.5">
            <a
              href={orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full bg-[#682D42] text-[#FFF8EE] font-medium text-sm hover:bg-[#4F1E30] transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Order on WhatsApp</span>
            </a>

            <div className="flex items-center gap-2">
              <a
                href={enquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-[#B58A42]/60 text-[#682D42] font-medium text-xs hover:bg-[#F6DCE3]/50 transition-colors"
              >
                <span>Enquire details</span>
              </a>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-full border border-[#B58A42]/60 text-[#682D42] hover:bg-[#F6DCE3]/50 transition-colors"
                title="Copy product link"
                aria-label="Share product link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Price & availability note */}
            <p className="text-[11px] text-[#352D2F]/60 text-center pt-2 italic">
              Price, availability and payment confirmed on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
