import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Product, Category } from '../types';
import { formatPrice, getProductPriceDisplay } from '../utils/pricing';

interface ProductCardProps {
  product: Product;
  category?: Category;
  onShopNow: (product: Product) => void;
  onAddToCart: (product: Product, variantId: string | undefined, quantity: number) => boolean;
}

function ProductPrices({ product }: { product: Product }) {
  const prices = product.variants?.length
    ? product.variants.map((variant) => getProductPriceDisplay(product, variant)).filter((price) => price !== null)
    : [getProductPriceDisplay(product)];
  const lowest = prices.reduce<typeof prices[number] | null>(
    (result, price) => price && (!result || price.sellingPrice < result.sellingPrice) ? price : result,
    null,
  );
  const highest = prices.reduce<number>(
    (result, price) => price ? Math.max(result, price.sellingPrice) : result,
    0,
  );

  if (!lowest) return <p className="text-[11px] text-[#352D2F]/65">Price unavailable</p>;

  return (
    <div className="mt-1 flex min-h-7 flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
      {lowest.salePrice !== undefined && lowest.discountPercent > 0 && (
        <span className="text-[10px] text-[#352D2F]/60 line-through sm:text-xs">
          {formatPrice(lowest.regularPrice)}
        </span>
      )}
      <span className="font-serif text-sm font-bold text-[#682D42] sm:text-base">
        {highest > lowest.sellingPrice ? 'From ' : ''}
        {formatPrice(lowest.sellingPrice)}
        {highest > lowest.sellingPrice && ` – ${formatPrice(highest)}`}
      </span>
      {lowest.discountPercent > 0 && (
        <span className="rounded-full bg-[#F6DCE3] px-1.5 py-0.5 text-[9px] font-semibold text-[#682D42]">
          {lowest.discountPercent}% OFF
        </span>
      )}
      <span className="w-full text-[10px] text-[#352D2F]/70">
        / {product.sellingUnit || 'unit'}
      </span>
    </div>
  );
}

export function ProductCard({ product, category, onShopNow, onAddToCart }: ProductCardProps) {
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  const variants = product.variants || [];
  const minimumQuantity = product.minimumQuantity || 1;
  const availableVariant = variants.some((variant) => variant.stockQuantity >= minimumQuantity);
  const availability = product.onlinePurchaseEnabled === true &&
    product.onlinePurchaseConfigured === true &&
    (variants.length ? availableVariant : (product.stockQuantity ?? 0) >= minimumQuantity);
  const unavailableText = availability ? '' : 'Currently unavailable';
  const productUrl = `/store/product/${encodeURIComponent(product.id)}/${encodeURIComponent(product.slug)}`;

  useEffect(() => {
    if (!optionDialogOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    ) || []);
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOptionDialogOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [optionDialogOpen]);

  const addToCart = (variantId?: string) => {
    if (!onAddToCart(product, variantId, minimumQuantity)) return;
    setOptionDialogOpen(false);
    setConfirmation('Added to cart');
    window.setTimeout(() => setConfirmation(''), 2400);
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#B58A42]/30 bg-[#FFF8EE] shadow-xs transition-all duration-300 hover:shadow-md">
      <a
        href={productUrl}
        onClick={(event) => {
          event.preventDefault();
          onShopNow(product);
        }}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[#F6DCE3]/40 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#B58A42] sm:aspect-[4/3]"
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(event) => {
            (event.target as HTMLImageElement).src = '/assets/images/prod_thali.jpg';
          }}
        />
      </a>

      <div className="flex flex-1 flex-col p-2.5 text-center sm:p-4 lg:p-5">
        <div className="min-w-0">
          {category && <p className="mb-0.5 hidden truncate text-[9px] uppercase tracking-wide text-[#B58A42] sm:block">{category.name}</p>}
          <a
            href={productUrl}
            onClick={(event) => {
              event.preventDefault();
              onShopNow(product);
            }}
            className="line-clamp-2 min-h-10 w-full font-serif text-sm font-bold leading-snug text-[#682D42] hover:text-[#B58A42] focus-visible:outline-2 focus-visible:outline-[#B58A42] sm:min-h-7 sm:text-lg lg:text-xl"
          >
            {product.name}
          </a>
          <ProductPrices product={product} />
          {unavailableText && (
            <p className="mt-1 min-h-4 text-[10px] text-[#352D2F]/65 sm:text-xs" aria-live="polite">
              {unavailableText}
            </p>
          )}
          {confirmation && <p role="status" className="mt-1 min-h-4 text-[10px] font-semibold text-emerald-800">{confirmation}</p>}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => onShopNow(product)}
            disabled={!availability}
            className="min-h-11 min-w-0 rounded-lg bg-[#682D42] px-1.5 text-[11px] font-semibold text-[#FFF8EE] transition-colors hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            Shop Now
          </button>
          <button
            type="button"
            onClick={() => variants.length ? setOptionDialogOpen(true) : addToCart()}
            disabled={!availability}
            className="min-h-11 min-w-0 rounded-lg border border-[#B58A42]/70 bg-[#FFF8EE] px-1.5 text-[10px] font-semibold text-[#682D42] transition-colors hover:bg-[#F6DCE3]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {optionDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOptionDialogOpen(false);
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`cart-option-title-${product.id}`}
            className="w-full max-w-sm rounded-2xl border border-[#B58A42]/50 bg-[#FFF8EE] p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={`cart-option-title-${product.id}`} className="font-serif text-xl font-bold text-[#682D42]">
                Choose {product.name} option
              </h2>
              <button type="button" onClick={() => setOptionDialogOpen(false)} aria-label="Close option selector" className="rounded-full p-1 text-[#682D42] focus-visible:outline-2 focus-visible:outline-[#B58A42]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Available options</legend>
              {variants.map((variant) => {
                const inStock = variant.stockQuantity >= minimumQuantity;
                return (
                  <label key={variant.id} className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm ${inStock ? 'cursor-pointer border-[#B58A42]/40' : 'cursor-not-allowed border-gray-200 opacity-50'}`}>
                    <input
                      type="radio"
                      name={`variant-${product.id}`}
                      value={variant.id}
                      checked={selectedVariantId === variant.id}
                      onChange={() => setSelectedVariantId(variant.id)}
                      disabled={!inStock}
                      className="accent-[#682D42]"
                    />
                    <span className="flex-1">{variant.label}</span>
                    <span className="font-semibold text-[#682D42]">
                      {getProductPriceDisplay(product, variant)
                        ? formatPrice(getProductPriceDisplay(product, variant)!.sellingPrice)
                        : 'Price unavailable'}
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <button
              type="button"
              onClick={() => addToCart(selectedVariantId)}
              disabled={!selectedVariantId}
              className="mt-5 min-h-11 w-full rounded-lg bg-[#682D42] px-4 font-semibold text-[#FFF8EE] hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add selected option to Cart
            </button>
          </section>
        </div>
      )}
    </article>
  );
}
