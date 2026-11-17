import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { Category, Product } from '../types';
import { formatPrice, getProductPriceDisplay } from '../utils/pricing';

interface ProductDetailPageProps {
  product: Product;
  category?: Category;
  onBack: () => void;
  onContinueCheckout: (variantId: string | undefined, quantity: number) => void;
  onAddToCart: (product: Product, variantId: string | undefined, quantity: number) => boolean;
}

function readQuantity(product: Product): number {
  const requested = Number(new URLSearchParams(window.location.search).get('quantity'));
  const minimum = product.minimumQuantity || 1;
  const step = product.quantityStep || 1;
  if (!Number.isFinite(requested) || requested < minimum) return minimum;
  const steps = Math.round((requested - minimum) / step);
  return Number((minimum + steps * step).toFixed(3));
}

export function ProductDetailPage({
  product,
  category,
  onBack,
  onContinueCheckout,
  onAddToCart,
}: ProductDetailPageProps) {
  const variants = product.variants || [];
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('variant');
    return variants.some((variant) => variant.id === requested) ? requested! : variants[0]?.id || '';
  });
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const [quantity, setQuantity] = useState(() => readQuantity(product));
  const [activeImage, setActiveImage] = useState(0);
  const price = getProductPriceDisplay(product, selectedVariant);
  const unitPrice = price?.sellingPrice ?? 0;
  const stock = selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  const step = product.quantityStep || 1;
  const minimum = product.minimumQuantity || 1;
  const images = useMemo(
    () => [selectedVariant?.image || product.image, ...(product.additionalImages || [])].filter(Boolean),
    [product.image, product.additionalImages, selectedVariant?.image]
  );
  const selectedImage = images[Math.min(activeImage, images.length - 1)] || product.image;
  const itemTotal = Math.round((unitPrice * quantity + Number.EPSILON) * 100) / 100;
  const onlineConfigured = product.onlinePurchaseEnabled === true && product.onlinePurchaseConfigured === true;
  const onlineAvailable = onlineConfigured && stock >= minimum;

  const adjustQuantity = (delta: number) => {
    const next = Number((quantity + delta * step).toFixed(3));
    if (next >= minimum && next <= stock) setQuantity(next);
  };

  return (
    <div className="min-h-[65vh] bg-[#FFF8EE] text-[#352D2F]">
      <div className="container-public py-5 sm:py-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-10 text-sm text-[#682D42] hover:text-[#B58A42] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B58A42]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </button>

        <nav className="mt-3 mb-5 text-xs text-[#352D2F]/70" aria-label="Breadcrumb">
          <button onClick={onBack} className="hover:underline">Home / Store</button>
          <span className="mx-2 text-[#B58A42]">/</span>
          <span className="font-semibold text-[#682D42]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8 items-start">
          <section aria-label={`${product.name} images`}>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-[#B58A42]/35 bg-[#F6DCE3]/30">
              <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous product image"
                    onClick={() => setActiveImage((activeImage + images.length - 1) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-[#FFF8EE]/90 p-2 text-[#682D42] shadow"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next product image"
                    onClick={() => setActiveImage((activeImage + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#FFF8EE]/90 p-2 text-[#682D42] shadow"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={activeImage === index}
                    className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border-2 ${activeImage === index ? 'border-[#682D42]' : 'border-[#B58A42]/40'}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#B58A42]/35 bg-[#FFF8EE] p-4 sm:p-6">
            {category && <p className="text-xs uppercase tracking-widest font-semibold text-[#8C6627]">{category.name}</p>}
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#682D42]">{product.name}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#352D2F]/80">{product.description}</p>

            <>
              {price && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {price.salePrice !== undefined && price.discountPercent > 0 && (
                    <>
                      <span className="text-sm text-[#352D2F]/60 line-through">{formatPrice(price.regularPrice)}</span>
                      <span className="rounded-full bg-[#F6DCE3] px-2 py-0.5 text-xs font-semibold text-[#682D42]">{price.discountPercent}% OFF</span>
                    </>
                  )}
                  <p className="font-serif text-2xl font-bold text-[#682D42]">
                    {formatPrice(unitPrice)}
                    {product.sellingUnit && <span className="ml-1 text-sm font-normal">/ {product.sellingUnit}</span>}
                  </p>
                </div>
              )}
              {variants.length > 0 && (
                  <fieldset className="mt-5">
                    <legend className="mb-2 text-sm font-semibold text-[#682D42]">Available options</legend>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => {
                        const inStock = variant.stockQuantity >= minimum;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setActiveImage(0);
                              setQuantity(minimum);
                            }}
                            disabled={!inStock}
                            aria-pressed={variant.id === selectedVariantId}
                            className={`min-h-10 rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variant.id === selectedVariantId ? 'border-[#682D42] bg-[#F6DCE3] text-[#682D42]' : 'border-[#B58A42]/50 bg-white text-[#352D2F]'}`}
                          >
                            {variant.label}{!inStock ? ' (Out of stock)' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-[#682D42]">Quantity</span>
                  <div className="inline-flex items-center rounded-lg border border-[#B58A42]/60 bg-white">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(-1)}
                      disabled={quantity <= minimum}
                      aria-label="Decrease quantity"
                      className="min-h-11 min-w-11 grid place-items-center text-[#682D42] disabled:opacity-40"
                    ><Minus className="w-4 h-4" /></button>
                    <span className="min-w-12 text-center text-sm" aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(1)}
                      disabled={quantity + step > stock}
                      aria-label="Increase quantity"
                      className="min-h-11 min-w-11 grid place-items-center text-[#682D42] disabled:opacity-40"
                    ><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="mt-1 text-right text-xs text-[#352D2F]/65">
                  {stock >= minimum ? `${stock} ${product.sellingUnit || 'available'}` : 'Out of stock'}
                  {minimum > 1 && ` · minimum ${minimum}`}
                  {step !== 1 && ` · steps of ${step}`}
                </p>

                <div className="mt-5 border-t border-[#B58A42]/25 pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-serif font-bold text-[#682D42]">Item total</p>
                    <p className="text-xs text-[#352D2F]/65">Delivery calculated at checkout</p>
                  </div>
                  <span className="font-serif text-xl font-bold text-[#682D42]">{price ? formatPrice(itemTotal) : 'Price unavailable'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onContinueCheckout(selectedVariantId || undefined, quantity)}
                  disabled={!onlineAvailable || quantity > stock || !price}
                  className="mt-5 w-full min-h-12 rounded-lg bg-[#682D42] px-4 py-3 font-serif font-semibold text-[#FFF8EE] hover:bg-[#4F1E30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {onlineAvailable ? 'Shop Now' : 'Currently unavailable'}
                </button>
                <button
                  type="button"
                  onClick={() => onAddToCart(product, selectedVariantId || undefined, quantity)}
                  disabled={!onlineAvailable || quantity > stock || !price}
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#B58A42]/70 bg-[#FFF8EE] px-4 py-3 font-semibold text-[#682D42] hover:bg-[#F6DCE3]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </button>
                <p className="mt-2 text-center text-xs text-[#352D2F]/65" aria-live="polite">
                  {stock >= minimum ? `${stock} ${product.sellingUnit || 'units'} available` : 'Currently unavailable'}
                </p>
                {price?.discountPercent ? <p className="mt-1 text-center text-xs text-emerald-800">{formatPrice(price.regularPrice - unitPrice)} saved per {product.sellingUnit || 'unit'}</p> : null}
                {product.onlinePurchaseEnabled && product.onlinePurchaseConfigured && quantity > 0 && (
                  <div className="sr-only" aria-live="polite">
                    Item total {formatPrice(itemTotal)}
                  </div>
                )}
                {!onlineConfigured && (
                  <p className="mt-3 text-center text-xs text-[#352D2F]/70">Currently unavailable for online purchase.</p>
                )}
                </>

          </section>
        </div>
      </div>
    </div>
  );
}

