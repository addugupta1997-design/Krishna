import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { CartEntry, Product, WebsiteSettings } from '../types';
import { formatPrice, getProductPriceDisplay } from '../utils/pricing';

interface CartPageProps {
  cart: CartEntry[];
  products: Product[];
  settings: WebsiteSettings;
  onChangeQuantity: (entry: CartEntry, quantity: number) => void;
  onRemove: (entry: CartEntry) => void;
  onNavigate: (path: string) => void;
}

export function CartPage({ cart, products, settings, onChangeQuantity, onRemove, onNavigate }: CartPageProps) {
  const lines = cart.flatMap((entry) => {
    const product = products.find((candidate) => candidate.id === entry.productId);
    if (!product) return [];
    const variant = product.variants?.find((candidate) => candidate.id === entry.variantId);
    const price = getProductPriceDisplay(product, variant);
    const stock = variant?.stockQuantity ?? product.stockQuantity ?? 0;
    return [{ entry, product, variant, price, stock }];
  });
  const pricesComplete = lines.length > 0 && lines.every((line) => line.price);
  const subtotal = lines.reduce((total, line) => total + (line.price?.sellingPrice || 0) * line.entry.quantity, 0);
  const shippingConfigured =
    Number.isFinite(settings.shippingCharge) &&
    (settings.shippingCharge ?? -1) >= 0;
  const deliveryCharge = pricesComplete && shippingConfigured
    ? settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingCharge || 0
    : null;
  const canCheckout = lines.length > 0 && lines.every(({ entry, product, variant, price, stock }) =>
    product.onlinePurchaseEnabled &&
    product.onlinePurchaseConfigured &&
    price &&
    stock >= entry.quantity &&
    (!product.variants?.length || variant)
  );

  return (
    <section className="min-h-[60vh] bg-[#FFF8EE] py-8 sm:py-12">
      <div className="container-public">
        <h1 className="font-serif text-3xl font-bold text-[#682D42] sm:text-4xl">Your Cart</h1>
        {lines.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#B58A42]/50 bg-[#F6DCE3]/20 px-5 py-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-[#B58A42]" aria-hidden="true" />
            <h2 className="mt-3 font-serif text-2xl font-bold text-[#682D42]">Your cart is waiting for something lovely</h2>
            <p className="mt-2 text-sm text-[#352D2F]/75">Explore the store and add items to your cart.</p>
            <button type="button" onClick={() => onNavigate('/store')} className="mt-5 min-h-11 rounded-lg bg-[#682D42] px-5 font-semibold text-[#FFF8EE] hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-3">
              {lines.map(({ entry, product, variant, price, stock }) => {
                const available = Boolean(product.onlinePurchaseEnabled && product.onlinePurchaseConfigured && price && stock > 0);
                return (
                  <article key={`${entry.productId}:${entry.variantId || ''}`} className="flex min-w-0 gap-3 rounded-xl border border-[#B58A42]/35 bg-[#FFF8EE] p-3 sm:gap-4 sm:p-4">
                    <img src={variant?.image || product.image} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-[#B58A42]/25 object-cover sm:h-24 sm:w-24" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-base font-bold text-[#682D42] sm:text-lg">{product.name}</h2>
                      {variant && <p className="text-xs text-[#352D2F]/75">{variant.label}</p>}
                      <p className="mt-1 text-xs text-[#352D2F]/75">
                        {price ? (
                          <>
                            {price.salePrice !== undefined && <span className="mr-1 text-[#352D2F]/55 line-through">{formatPrice(price.regularPrice)}</span>}
                            <span className="font-semibold text-[#682D42]">{formatPrice(price.sellingPrice)}</span>
                            <span> / {product.sellingUnit || 'unit'}</span>
                            {price.discountPercent > 0 && <span className="ml-1 rounded-full bg-[#F6DCE3] px-1.5 py-0.5 text-[10px] text-[#682D42]">{price.discountPercent}% OFF</span>}
                          </>
                        ) : 'Price unavailable'}
                      </p>
                      {!available && <p className="mt-1 text-xs font-medium text-rose-800">Currently unavailable</p>}
                      {stock < entry.quantity && stock > 0 && <p role="alert" className="mt-1 text-xs text-rose-800">Only {stock} available. Update quantity to continue.</p>}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-lg border border-[#B58A42]/50 bg-white">
                          <button type="button" aria-label={`Decrease ${product.name} quantity`} disabled={entry.quantity <= (product.minimumQuantity || 1)} onClick={() => onChangeQuantity(entry, Math.max(product.minimumQuantity || 1, entry.quantity - (product.quantityStep || 1)))} className="grid min-h-9 min-w-9 place-items-center text-[#682D42] disabled:opacity-40"><Minus className="h-4 w-4" /></button>
                          <span className="min-w-10 text-center text-sm" aria-live="polite">{entry.quantity}</span>
                          <button type="button" aria-label={`Increase ${product.name} quantity`} disabled={!available || entry.quantity + (product.quantityStep || 1) > stock} onClick={() => onChangeQuantity(entry, entry.quantity + (product.quantityStep || 1))} className="grid min-h-9 min-w-9 place-items-center text-[#682D42] disabled:opacity-40"><Plus className="h-4 w-4" /></button>
                        </div>
                        <p className="text-sm font-bold text-[#682D42]">{price ? formatPrice(price.sellingPrice * entry.quantity) : '—'}</p>
                        <button type="button" onClick={() => onRemove(entry)} className="inline-flex min-h-9 items-center gap-1 rounded px-2 text-xs text-rose-800 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-[#B58A42]"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="rounded-xl border border-[#B58A42]/40 bg-[#F6DCE3]/30 p-4 sm:p-5 lg:sticky lg:top-28">
              <h2 className="font-serif text-xl font-bold text-[#682D42]">Order Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt>Subtotal</dt><dd className="font-semibold">{pricesComplete ? formatPrice(subtotal) : '—'}</dd></div>
                <div className="flex justify-between gap-3"><dt>Delivery</dt><dd>{deliveryCharge === null ? 'Calculated at checkout' : deliveryCharge === 0 ? 'No delivery charge' : formatPrice(deliveryCharge)}</dd></div>
              </dl>
              {settings.shippingPolicy && <p className="mt-3 text-xs leading-relaxed text-[#352D2F]/70">{settings.shippingPolicy}</p>}
              {!shippingConfigured && <p className="mt-3 text-xs text-[#352D2F]/70">Delivery availability and charges will be confirmed by the store.</p>}
              <button type="button" disabled={!canCheckout} onClick={() => onNavigate('/checkout')} className="mt-5 min-h-12 w-full rounded-lg bg-[#682D42] px-4 font-semibold text-[#FFF8EE] hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-50">
                Proceed to Checkout
              </button>
              {!canCheckout && <p role="status" className="mt-2 text-center text-xs text-[#352D2F]/75">Remove unavailable items or adjust quantities to continue.</p>}
              <button type="button" onClick={() => onNavigate('/store')} className="mt-3 min-h-10 w-full rounded-lg border border-[#B58A42]/60 bg-[#FFF8EE] px-4 text-sm font-medium text-[#682D42] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42]">
                Continue Shopping
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
