import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CreditCard } from 'lucide-react';
import type { CartEntry, DeliveryAddress, Product, WebsiteSettings } from '../types';
import { formatPrice, getProductPriceDisplay, type PriceDisplay } from '../utils/pricing';

interface CheckoutPageProps {
  products: Product[];
  cart: CartEntry[];
  directItems?: CartEntry[];
  settings: WebsiteSettings;
  onNavigate: (path: string) => void;
  onOrderCreated?: (statusToken: string, cartPurchase: boolean) => void;
}

interface CheckoutAttempt {
  idempotencyKey: string;
  statusToken: string;
}

interface CashfreeOrderResult {
  statusToken: string;
  paymentSessionId: string;
  mode: 'sandbox' | 'production';
}

declare global {
  interface Window {
    Cashfree?: (options: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: '_self' }) => Promise<unknown>;
    };
  }
}

const emptyAddress: DeliveryAddress = {
  fullName: '',
  mobile: '',
  email: '',
  address: '',
  landmark: '',
  pinCode: '',
  city: '',
  state: '',
};

function getAttempt(key: string): CheckoutAttempt {
  const cached = sessionStorage.getItem(key);
  if (cached) {
    try {
      const value = JSON.parse(cached) as CheckoutAttempt;
      if (value.idempotencyKey && value.statusToken) return value;
    } catch {
      sessionStorage.removeItem(key);
    }
  }
  const attempt = { idempotencyKey: crypto.randomUUID(), statusToken: crypto.randomUUID() };
  sessionStorage.setItem(key, JSON.stringify(attempt));
  return attempt;
}

function readAddress(): DeliveryAddress {
  try {
    const saved = sessionStorage.getItem('kt-checkout-address');
    return saved ? { ...emptyAddress, ...JSON.parse(saved) } : emptyAddress;
  } catch {
    return emptyAddress;
  }
}

function roundedMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function CheckoutPage({ products, cart, directItems, settings, onNavigate, onOrderCreated }: CheckoutPageProps) {
  const cartPurchase = !directItems;
  const entries = directItems || cart;
  const attemptKey = `kt-checkout-${cartPurchase ? 'cart' : entries.map((item) => `${item.productId}-${item.variantId || ''}-${item.quantity}`).join('|')}`;
  const [address, setAddress] = useState<DeliveryAddress>(readAddress);
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryAddress, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'production'>('sandbox');
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(null);
  const [updatedTotal, setUpdatedTotal] = useState<number | null>(null);
  const [priceReviewed, setPriceReviewed] = useState(false);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, PriceDisplay>>({});
  const [currentCharges, setCurrentCharges] = useState<{ subtotal: number; deliveryCharge: number; taxAmount: number; total: number } | null>(null);

  const lineKey = (entry: CartEntry) => `${entry.productId}:${entry.variantId || ''}`;

  const lines = useMemo(() => entries.flatMap((entry) => {
    const product = products.find((candidate) => candidate.id === entry.productId);
    if (!product) return [];
    const variant = product.variants?.find((candidate) => candidate.id === entry.variantId);
    const price = priceOverrides[lineKey(entry)] || getProductPriceDisplay(product, variant);
    const stock = variant?.stockQuantity ?? product.stockQuantity ?? 0;
    return [{ entry, product, variant, price, stock }];
  }), [entries, products, priceOverrides]);

  const pricesComplete = lines.length > 0 && lines.every((line) => line.price);
  const calculatedSubtotal = roundedMoney(lines.reduce((sum, line) => sum + (line.price?.sellingPrice || 0) * line.entry.quantity, 0));
  const calculatedTax = roundedMoney(lines.reduce((sum, line) =>
    sum + (line.price?.sellingPrice || 0) * line.entry.quantity * (line.product.taxRatePercent || 0) / 100, 0));
  const subtotal = currentCharges?.subtotal ?? calculatedSubtotal;
  const tax = currentCharges?.taxAmount ?? calculatedTax;
  const shippingConfigured = Boolean(
    Number.isFinite(settings.shippingCharge) &&
    (settings.shippingCharge ?? -1) >= 0
  );
  const calculatedDeliveryCharge = pricesComplete && shippingConfigured
    ? settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingCharge || 0
    : null;
  const deliveryCharge = currentCharges?.deliveryCharge ?? calculatedDeliveryCharge;
  const total = currentCharges?.total ?? (deliveryCharge === null ? subtotal + tax : subtotal + deliveryCharge + tax);
  const pinCodeServed = !settings.serviceablePinCodes?.length || settings.serviceablePinCodes.includes(address.pinCode);
  const linesAvailable = lines.length > 0 && lines.every(({ entry, product, variant, price, stock }) =>
    product.onlinePurchaseEnabled &&
    product.onlinePurchaseConfigured &&
    price &&
    stock >= entry.quantity &&
    (!product.variants?.length || variant)
  );
  const canPay = paymentReady && shippingConfigured && pinCodeServed && linesAvailable && pricesComplete && !loading && (priceReviewed || updatedTotal === null);

  useEffect(() => {
    setAttempt(getAttempt(attemptKey));
  }, [attemptKey]);

  useEffect(() => {
    fetch('/api/public/commerce')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load payment availability.');
        return response.json();
      })
      .then((data: { paymentReady: boolean; mode: 'sandbox' | 'production' }) => {
        setPaymentReady(data.paymentReady);
        setPaymentMode(data.mode);
      })
      .catch(() => setFormError('Could not verify online payment availability. Refresh and try again.'));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('kt-checkout-address', JSON.stringify(address));
    } catch {
      setFormError('Your browser could not save checkout details for this session.');
    }
  }, [address]);

  const updateField = (field: keyof DeliveryAddress, value: string) => {
    setAddress((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFormError('');
    setUpdatedTotal(null);
    setPriceReviewed(false);
    setCurrentCharges(null);
    const nextAttempt = { idempotencyKey: crypto.randomUUID(), statusToken: crypto.randomUUID() };
    setAttempt(nextAttempt);
    sessionStorage.setItem(attemptKey, JSON.stringify(nextAttempt));
  };

  const validate = () => {
    const next: Partial<Record<keyof DeliveryAddress, string>> = {};
    if (address.fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!/^\+?[\d\s()-]{10,18}$/.test(address.mobile.trim())) next.mobile = 'Enter a valid mobile number.';
    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) next.email = 'Enter a valid email address.';
    if (address.address.trim().length < 5) next.address = 'Enter your delivery address.';
    if (!/^\d{6}$/.test(address.pinCode.trim())) next.pinCode = 'Enter a valid 6-digit PIN code.';
    if (address.city.trim().length < 2) next.city = 'Enter your city.';
    if (address.state.trim().length < 2) next.state = 'Enter your state.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openCashfree = async (paymentSessionId: string, mode: 'sandbox' | 'production') => {
    if (!window.Cashfree) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load Cashfree checkout. Please retry.'));
        document.head.appendChild(script);
      });
    }
    const cashfree = window.Cashfree?.({ mode });
    if (!cashfree) throw new Error('Cashfree checkout is unavailable. Please retry.');
    await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
  };

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;
    if (!linesAvailable) {
      setFormError('One or more items are unavailable or have insufficient stock. Update your cart before paying.');
      return;
    }
    if (!shippingConfigured) {
      setFormError('Delivery settings are not configured. Please contact the store.');
      return;
    }
    if (!pinCodeServed) {
      setFormError('We cannot deliver to this PIN code. Please contact the store for assistance.');
      return;
    }
    if (!paymentReady) {
      setFormError('Online payment is not available yet. Please contact the store.');
      return;
    }

    setLoading(true);
    try {
      const activeAttempt = attempt || getAttempt(attemptKey);
      setAttempt(activeAttempt);
      const response = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map(({ entry, price }) => ({
            productId: entry.productId,
            variantId: entry.variantId,
            quantity: entry.quantity,
            expectedUnitPrice: price?.sellingPrice,
          })),
          address,
          idempotencyKey: activeAttempt.idempotencyKey,
          statusToken: activeAttempt.statusToken,
          expectedTotal: total,
        }),
      });
      const result = await response.json();
      if (response.status === 409 && result.code === 'PRICE_UPDATED' && Number.isFinite(result.current?.total)) {
        setUpdatedTotal(result.current.total);
        if (Array.isArray(result.current.items)) {
          setPriceOverrides(Object.fromEntries(result.current.items.map((item: {
            productId: string;
            variantId?: string;
            unitPrice: number;
            regularUnitPrice?: number;
            salePrice?: number;
          }) => {
            const regularPrice = item.regularUnitPrice ?? item.unitPrice;
            return [`${item.productId}:${item.variantId || ''}`, {
              regularPrice,
              salePrice: item.salePrice,
              sellingPrice: item.unitPrice,
              discountPercent: regularPrice > item.unitPrice ? Math.floor((regularPrice - item.unitPrice) / regularPrice * 100) : 0,
            }];
          })));
        }
        setCurrentCharges({
          subtotal: result.current.subtotal,
          deliveryCharge: result.current.deliveryCharge,
          taxAmount: result.current.taxAmount,
          total: result.current.total,
        });
        setPriceReviewed(false);
        setFormError('A price, stock level, or delivery amount changed. Review the updated total and confirm before continuing.');
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Could not create your order.');
      const orderResult = result as CashfreeOrderResult;
      onOrderCreated?.(orderResult.statusToken, cartPurchase);
      await openCashfree(orderResult.paymentSessionId, orderResult.mode);
      setFormError('Checkout was closed before payment completed. Your details are saved; you can safely retry.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Payment could not be started. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (field: keyof DeliveryAddress) =>
    `mt-1 w-full min-h-11 rounded-lg border px-3 py-2 text-sm text-[#352D2F] focus:outline-none focus:ring-2 focus:ring-[#682D42] ${errors[field] ? 'border-rose-500' : 'border-[#B58A42]/45'}`;

  if (!lines.length) {
    return (
      <section className="min-h-[55vh] px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#682D42]">{directItems ? 'Product unavailable' : 'Your cart is empty'}</h1>
        <button type="button" onClick={() => onNavigate(directItems ? '/store' : '/cart')} className="mt-4 min-h-11 rounded-lg bg-[#682D42] px-5 font-semibold text-[#FFF8EE] hover:bg-[#4F1E30]">{directItems ? 'Explore Store' : 'Review Cart'}</button>
      </section>
    );
  }

  return (
    <div className="min-h-[65vh] bg-[#FFF8EE] text-[#352D2F]">
      <div className="container-public py-5 sm:py-8">
        <button type="button" onClick={() => onNavigate(directItems ? `/store/product/${encodeURIComponent(lines[0].product.id)}/${encodeURIComponent(lines[0].product.slug)}` : '/cart')} className="inline-flex min-h-10 items-center gap-2 text-sm text-[#682D42] hover:text-[#B58A42] focus-visible:outline-2 focus-visible:outline-[#B58A42]">
          <ArrowLeft className="h-4 w-4" /> {directItems ? 'Back to product' : 'Back to Cart'}
        </button>
        <h1 className="mt-3 font-serif text-2xl font-bold text-[#682D42] sm:text-3xl">Checkout</h1>

        <form onSubmit={submitOrder} noValidate className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:gap-8">
          <div className="space-y-4">
            <section className="rounded-xl border border-[#B58A42]/35 bg-[#FFF8EE] p-4 sm:p-6">
              <h2 className="font-serif text-xl font-bold text-[#682D42]">Contact details</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#682D42]">Full name *
                  <input autoComplete="name" value={address.fullName} onChange={(e) => updateField('fullName', e.target.value)} className={fieldClass('fullName')} />
                  {errors.fullName && <span className="mt-1 block font-normal text-rose-700">{errors.fullName}</span>}
                </label>
                <label className="text-xs font-semibold text-[#682D42]">Mobile number *
                  <input type="tel" autoComplete="tel" value={address.mobile} onChange={(e) => updateField('mobile', e.target.value)} className={fieldClass('mobile')} />
                  {errors.mobile && <span className="mt-1 block font-normal text-rose-700">{errors.mobile}</span>}
                </label>
                <label className="text-xs font-semibold text-[#682D42] sm:col-span-2">Email (optional)
                  <input type="email" autoComplete="email" value={address.email} onChange={(e) => updateField('email', e.target.value)} className={fieldClass('email')} />
                  {errors.email && <span className="mt-1 block font-normal text-rose-700">{errors.email}</span>}
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-[#B58A42]/35 bg-[#FFF8EE] p-4 sm:p-6">
              <h2 className="font-serif text-xl font-bold text-[#682D42]">Delivery address</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#682D42] sm:col-span-2">Address *
                  <textarea rows={3} autoComplete="street-address" value={address.address} onChange={(e) => updateField('address', e.target.value)} className={fieldClass('address')} />
                  {errors.address && <span className="mt-1 block font-normal text-rose-700">{errors.address}</span>}
                </label>
                <label className="text-xs font-semibold text-[#682D42]">Landmark (optional)
                  <input value={address.landmark} onChange={(e) => updateField('landmark', e.target.value)} className={fieldClass('landmark')} />
                </label>
                <label className="text-xs font-semibold text-[#682D42]">PIN code *
                  <input inputMode="numeric" autoComplete="postal-code" maxLength={6} value={address.pinCode} onChange={(e) => updateField('pinCode', e.target.value.replace(/\D/g, ''))} className={fieldClass('pinCode')} />
                  {errors.pinCode && <span className="mt-1 block font-normal text-rose-700">{errors.pinCode}</span>}
                  {!errors.pinCode && address.pinCode.length === 6 && settings.serviceablePinCodes?.length && !pinCodeServed && <span className="mt-1 block font-normal text-rose-700">We do not currently deliver to this PIN code.</span>}
                  {!errors.pinCode && address.pinCode.length === 6 && pinCodeServed && <span className="mt-1 block font-normal text-emerald-800">Delivery available.</span>}
                </label>
                <label className="text-xs font-semibold text-[#682D42]">City *
                  <input autoComplete="address-level2" value={address.city} onChange={(e) => updateField('city', e.target.value)} className={fieldClass('city')} />
                  {errors.city && <span className="mt-1 block font-normal text-rose-700">{errors.city}</span>}
                </label>
                <label className="text-xs font-semibold text-[#682D42]">State *
                  <input autoComplete="address-level1" value={address.state} onChange={(e) => updateField('state', e.target.value)} className={fieldClass('state')} />
                  {errors.state && <span className="mt-1 block font-normal text-rose-700">{errors.state}</span>}
                </label>
              </div>
            </section>
          </div>

          <aside className="rounded-xl border border-[#B58A42]/40 bg-[#F6DCE3]/35 p-4 sm:p-5 lg:sticky lg:top-28">
            <h2 className="font-serif text-xl font-bold text-[#682D42]">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {lines.map(({ entry, product, variant, price }) => (
                <div key={`${entry.productId}:${entry.variantId || ''}`} className="flex gap-3 border-b border-[#B58A42]/20 pb-3">
                  <img src={variant?.image || product.image} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-[#682D42]">{product.name}</p>
                    {variant && <p className="text-[#352D2F]/70">{variant.label}</p>}
                    <p>{entry.quantity} × {price ? (
                      <>
                        {price.salePrice !== undefined && <span className="mr-1 text-[#352D2F]/55 line-through">{formatPrice(price.regularPrice)}</span>}
                        <span className="font-semibold text-[#682D42]">{formatPrice(price.sellingPrice)}</span>
                        <span> / {product.sellingUnit || 'unit'}</span>
                        {price.discountPercent > 0 && <span className="ml-1 rounded-full bg-[#F6DCE3] px-1.5 py-0.5 text-[10px] text-[#682D42]">{price.discountPercent}% OFF</span>}
                      </>
                    ) : 'Unavailable'}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#682D42]">{price ? formatPrice(price.sellingPrice * entry.quantity) : '—'}</span>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt>Subtotal</dt><dd>{pricesComplete ? formatPrice(subtotal) : '—'}</dd></div>
              {deliveryCharge !== null
                ? <div className="flex justify-between gap-2"><dt>Delivery</dt><dd>{deliveryCharge === 0 ? 'No delivery charge' : formatPrice(deliveryCharge)}</dd></div>
                : <div className="flex justify-between gap-2"><dt>Delivery</dt><dd className="text-right text-xs">{pricesComplete ? 'Confirm with store' : 'Calculated when prices are available'}</dd></div>}
              {tax > 0 && <div className="flex justify-between gap-2"><dt>Tax</dt><dd>{formatPrice(tax)}</dd></div>}
              <div className="flex justify-between gap-2 border-t border-[#B58A42]/30 pt-3 font-serif text-lg font-bold text-[#682D42]"><dt>Total</dt><dd>{pricesComplete ? formatPrice(total) : '—'}</dd></div>
            </dl>
            {updatedTotal !== null && (
              <label className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <input type="checkbox" checked={priceReviewed} onChange={(event) => setPriceReviewed(event.target.checked)} className="mt-0.5 accent-[#682D42]" />
                I have reviewed the updated total of {formatPrice(updatedTotal)}.
              </label>
            )}
            {settings.shippingPolicy && <p className="mt-3 text-xs leading-relaxed text-[#352D2F]/70">{settings.shippingPolicy}</p>}
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-[#FFF8EE]/80 p-3">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#682D42]" />
              <div>
                <p className="text-sm font-semibold text-[#682D42]">Payment by Cashfree</p>
                <p className="text-xs text-[#352D2F]/75">Payment will be handled through the provider’s hosted checkout.</p>
                {paymentReady && paymentMode === 'sandbox' && <p className="mt-1 text-xs font-semibold text-amber-800">Test mode — no real charges.</p>}
                {!paymentReady && <p className="mt-1 text-xs text-rose-800">Online payments are not configured. Please contact the store.</p>}
              </div>
            </div>
            {formError && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</p>}
            <button type="submit" disabled={!canPay} className="mt-4 min-h-12 w-full rounded-lg bg-[#682D42] px-4 font-semibold text-[#FFF8EE] hover:bg-[#4F1E30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B58A42] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Starting secure payment…' : `Pay ${pricesComplete ? formatPrice(total) : '—'}`}
            </button>
            {linesAvailable && !pinCodeServed && <p className="mt-2 text-center text-xs text-[#352D2F]/70">Enter a serviceable PIN code to continue.</p>}
            <button type="button" onClick={() => onNavigate(directItems ? '/store' : '/cart')} className="mt-2 min-h-10 w-full text-sm text-[#682D42] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#B58A42]">
              {directItems ? 'Continue Shopping' : 'Return to Cart'}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}
