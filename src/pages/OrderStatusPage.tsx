import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { StoreOrder, WebsiteSettings } from '../types';
import { createWhatsAppGeneralLink } from '../utils/whatsapp';

interface OrderStatusPageProps {
  token: string;
  settings: WebsiteSettings;
  onContinueShopping: () => void;
  onPaymentVerified: (statusToken: string) => void;
  onRetry: (items: Array<{ productId: string; variantId?: string; quantity: number }>, purchasedCartEntries: Array<{ productId: string; variantId?: string; quantity: number }> | null) => void;
}

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function OrderStatusPage({ token, settings, onContinueShopping, onPaymentVerified, onRetry }: OrderStatusPageProps) {
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const response = await fetch(`/api/public/orders/status/${encodeURIComponent(token)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not retrieve this order.');
      setOrder(data.order as StoreOrder);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not retrieve this order.');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!order || order.paymentStatus !== 'PENDING') return;
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [order?.paymentStatus, refresh]);

  useEffect(() => {
    if (order?.paymentStatus === 'PAID') onPaymentVerified(token);
  }, [order?.paymentStatus, onPaymentVerified, token]);

  const statusText = order?.paymentStatus === 'PAID'
    ? 'Payment received'
    : order?.paymentStatus === 'PENDING'
      ? 'Payment confirmation pending'
      : order?.paymentStatus === 'FAILED'
        ? 'Payment failed'
        : order?.paymentStatus === 'CANCELLED'
          ? 'Payment cancelled'
          : order?.paymentStatus === 'REFUNDED'
            ? 'Refunded'
            : order?.paymentStatus === 'PARTIALLY_REFUNDED'
              ? 'Partially refunded'
              : 'Order status';

  return (
    <div className="min-h-[65vh] bg-[#FFF8EE] text-[#352D2F]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {order ? (
          <section className="rounded-2xl border border-[#B58A42]/40 bg-[#FFF8EE] p-5 sm:p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#B58A42]">Order {order.reference}</p>
            <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#682D42]">{statusText}</h1>
            {order.paymentStatus === 'PENDING' && (
              <p className="mt-2 text-sm text-[#352D2F]/75">We are waiting for Cashfree to verify your payment. This page will refresh automatically. Please do not make another payment.</p>
            )}
            {order.paymentStatus === 'PAID' && (
              <p className="mt-2 text-sm text-[#352D2F]/75">Your payment has been verified by the payment provider. Thank you for shopping with Krishna Tracer.</p>
            )}
            {order.paymentStatus === 'FAILED' && (
              <p className="mt-2 text-sm text-[#352D2F]/75">The provider did not confirm this payment. Contact us if your account was debited.</p>
            )}

            <div className="mt-6 border-t border-[#B58A42]/25 pt-5">
              <h2 className="font-serif text-lg font-bold text-[#682D42]">Purchased item</h2>
              <div className="mt-3 space-y-3">
                {(order.items || [{
                  productId: order.productId,
                  variantId: order.variantId,
                  name: order.item.name,
                  variantLabel: order.item.variantLabel,
                  quantity: order.item.quantity,
                  unit: order.item.unit,
                  unitPrice: order.item.unitPrice,
                  regularUnitPrice: order.item.regularUnitPrice,
                  discountAmount: order.item.discountAmount,
                  discountPercent: order.item.discountPercent,
                  image: order.item.image,
                }]).map((item, index) => (
                  <div key={`${item.productId}:${item.variantId || ''}:${index}`} className="flex gap-3">
                    <img src={item.image} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-[#B58A42]/30 object-cover" />
                    <div className="min-w-0">
                      <p className="font-serif font-bold text-[#682D42]">{item.name}</p>
                      {item.variantLabel && <p className="text-sm text-[#352D2F]/75">{item.variantLabel}</p>}
                      <p className="text-sm text-[#352D2F]/75">Quantity: {item.quantity} {item.unit}</p>
                      <p className="mt-1 text-sm font-medium text-[#682D42]">{money(item.unitPrice)} / {item.unit}</p>
                      {item.discountAmount ? <p className="text-xs text-[#352D2F]/70">Discount saved: {money(item.discountAmount)} per {item.unit}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-[#B58A42]/25 pt-5">
              <div>
                <h2 className="font-serif font-bold text-[#682D42]">Delivery address</h2>
                <address className="mt-2 whitespace-pre-line text-sm not-italic leading-relaxed">
                  {order.address.fullName}{'\n'}{order.address.mobile}{order.address.email ? `\n${order.address.email}` : ''}{'\n'}{order.address.address}{order.address.landmark ? `\n${order.address.landmark}` : ''}{'\n'}{order.address.city}, {order.address.state} {order.address.pinCode}
                </address>
              </div>
              <div>
                <h2 className="font-serif font-bold text-[#682D42]">Order total</h2>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-2"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
                  <div className="flex justify-between gap-2"><dt>Delivery</dt><dd>{money(order.deliveryCharge)}</dd></div>
                  {order.taxAmount > 0 && <div className="flex justify-between gap-2"><dt>Tax</dt><dd>{money(order.taxAmount)}</dd></div>}
                  <div className="flex justify-between gap-2 border-t border-[#B58A42]/25 pt-2 font-bold text-[#682D42]"><dt>{order.paymentStatus === 'PAID' ? 'Amount paid' : 'Payable total'}</dt><dd>{money(order.total)}</dd></div>
                </dl>
                <p className="mt-3 text-xs">Fulfilment: <strong>{order.fulfilmentStatus}</strong></p>
                {order.trackingNumber && <p className="mt-1 text-xs">Tracking: {order.courier || ''} {order.trackingNumber}</p>}
              </div>
            </div>
            {order.inventoryException && (
              <p role="alert" className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Please contact the store to confirm fulfilment of this order.</p>
            )}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
              <a
                href={createWhatsAppGeneralLink(settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#B58A42]/60 px-4 py-2 text-sm font-medium text-[#682D42] hover:bg-[#F6DCE3]/40"
              >
                Contact Krishna Tracer
              </a>
              <button onClick={onContinueShopping} className="min-h-11 flex-1 rounded-lg bg-[#682D42] px-4 py-2 text-sm font-semibold text-[#FFF8EE] hover:bg-[#4F1E30]">
                Continue Shopping
              </button>
            </div>
            {(order.paymentStatus === 'FAILED' || order.paymentStatus === 'CANCELLED') && (
              <button
                type="button"
                onClick={() => onRetry((order.items || [{
                  productId: order.productId,
                  variantId: order.variantId,
                  quantity: order.item.quantity,
                }]).map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
                (() => {
                  try {
                    const snapshot = sessionStorage.getItem(`kt-clear-cart-on-payment-${token}`);
                    return snapshot ? JSON.parse(snapshot) : null;
                  } catch {
                    return null;
                  }
                })())}
                className="mt-3 min-h-11 w-full rounded-lg border border-[#B58A42]/60 bg-[#FFF8EE] px-4 text-sm font-semibold text-[#682D42] hover:bg-[#F6DCE3]/40"
              >
                Retry checkout
              </button>
            )}
          </section>
        ) : !error ? (
          <div className="py-16 text-center text-[#682D42]">Loading order status…</div>
        ) : null}
        <button onClick={() => void refresh()} disabled={refreshing} className="mx-auto mt-5 flex min-h-10 items-center gap-2 text-xs text-[#682D42] disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh payment status
        </button>
      </div>
    </div>
  );
}
