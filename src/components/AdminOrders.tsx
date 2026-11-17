import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import type { FulfilmentStatus, PaymentStatus, StoreOrder } from '../types';

const fulfilmentStatuses: FulfilmentStatus[] = ['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const paymentStatuses: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'];

function money(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [fulfilmentFilter, setFulfilmentFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: FulfilmentStatus; courier: string; trackingNumber: string; note: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load orders.');
      const list = data.orders as StoreOrder[];
      setOrders(list);
      setDrafts(Object.fromEntries(list.map((order) => [order.reference, {
        status: order.fulfilmentStatus,
        courier: order.courier || '',
        trackingNumber: order.trackingNumber || '',
        note: '',
      }])));
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const query = search.trim().toLowerCase();
    const matchesText = !query ||
      order.reference.toLowerCase().includes(query) ||
      order.address.fullName.toLowerCase().includes(query) ||
      order.address.mobile.includes(query);
    return matchesText &&
      (paymentFilter === 'All' || order.paymentStatus === paymentFilter) &&
      (fulfilmentFilter === 'All' || order.fulfilmentStatus === fulfilmentFilter);
  }), [orders, search, paymentFilter, fulfilmentFilter]);

  const updateDraft = (reference: string, updates: Partial<(typeof drafts)[string]>) => {
    setDrafts((previous) => ({
      ...previous,
      [reference]: { ...previous[reference], ...updates },
    }));
  };

  const saveFulfilment = async (reference: string) => {
    const draft = drafts[reference];
    if (!draft) return;
    setSaving(reference);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(reference)}/fulfilment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update fulfilment.');
      setNotice(`Order ${reference} updated.`);
      await loadOrders();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update fulfilment.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-5">
      <header>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#682D42]">Orders</h1>
        <p className="mt-1 text-xs sm:text-sm text-[#352D2F]/70">Payment status is verified by Cashfree and cannot be changed here.</p>
      </header>

      {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58A42]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, customer or phone…" className="min-h-10 w-full rounded-lg border border-[#B58A42]/40 bg-white pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#682D42]" />
        </label>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="min-h-10 rounded-lg border border-[#B58A42]/40 bg-white px-3 text-xs text-[#352D2F]">
          <option value="All">All payment statuses</option>
          {paymentStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
        </select>
        <select value={fulfilmentFilter} onChange={(e) => setFulfilmentFilter(e.target.value)} className="min-h-10 rounded-lg border border-[#B58A42]/40 bg-white px-3 text-xs text-[#352D2F]">
          <option value="All">All fulfilment statuses</option>
          {fulfilmentStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </div>

      {loading ? <p className="py-12 text-center text-sm text-[#682D42]">Loading orders…</p> : filteredOrders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#B58A42]/45 p-10 text-center text-sm text-[#352D2F]/70">No orders match these filters.</p>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const draft = drafts[order.reference];
            const isSelected = selected === order.reference;
            return (
              <article key={order.reference} className="overflow-hidden rounded-xl border border-[#B58A42]/35 bg-[#FFF8EE]">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 text-sm">
                  <div><p className="text-[10px] uppercase tracking-wide text-[#352D2F]/60">Order</p><p className="font-semibold text-[#682D42]">{order.reference}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-[#352D2F]/60">Date</p><p>{new Date(order.createdAt).toLocaleString()}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-[#352D2F]/60">Customer</p><p className="truncate">{order.address.fullName}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-[#352D2F]/60">Total</p><p className="font-semibold">{money(order.total)}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-[#352D2F]/60">Payment</p><p className="font-semibold">{order.paymentStatus.replaceAll('_', ' ')}</p></div>
                  <div className="flex items-center justify-between gap-2">
                    <div><p className="text-[10px] uppercase tracking-wide text-[#352D2F]/60">Fulfilment</p><p>{order.fulfilmentStatus}</p></div>
                    <button type="button" onClick={() => setSelected(isSelected ? null : order.reference)} className="min-h-9 rounded-lg border border-[#B58A42]/50 px-3 text-xs font-semibold text-[#682D42] hover:bg-[#F6DCE3]/40">
                      {isSelected ? 'Hide' : 'View Details'}
                    </button>
                  </div>
                </div>
                {isSelected && (
                  <div className="border-t border-[#B58A42]/25 bg-[#F6DCE3]/20 p-4 sm:p-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <section>
                        <h2 className="font-serif font-bold text-[#682D42]">Purchased item</h2>
                        <div className="mt-2 space-y-3">
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
                              <img src={item.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                              <div className="text-sm">
                                <p className="font-semibold">{item.name}</p>
                                {item.variantLabel && <p>{item.variantLabel}</p>}
                                <p>{item.quantity} {item.unit} × {money(item.unitPrice)}</p>
                                {item.discountAmount ? <p className="text-xs text-[#352D2F]/70">Regular {money(item.regularUnitPrice || item.unitPrice)}; saved {money(item.discountAmount)} / {item.unit}</p> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                        <dl className="mt-3 space-y-1 text-xs">
                          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
                          <div className="flex justify-between"><dt>Delivery</dt><dd>{money(order.deliveryCharge)}</dd></div>
                          {order.taxAmount > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{money(order.taxAmount)}</dd></div>}
                          <div className="flex justify-between border-t border-[#B58A42]/30 pt-1 font-bold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
                        </dl>
                      </section>
                      <section>
                        <h2 className="font-serif font-bold text-[#682D42]">Customer &amp; delivery</h2>
                        <address className="mt-2 whitespace-pre-line text-sm not-italic leading-relaxed">
                          {order.address.fullName}{'\n'}{order.address.mobile}{order.address.email ? `\n${order.address.email}` : ''}{'\n'}{order.address.address}{order.address.landmark ? `\n${order.address.landmark}` : ''}{'\n'}{order.address.city}, {order.address.state} {order.address.pinCode}
                        </address>
                        <p className="mt-3 text-xs">Payment reference: {order.paymentReference || 'Not confirmed'}</p>
                        {order.refundAmount !== undefined && <p className="mt-1 text-xs">Refunded: {money(order.refundAmount)} ({order.paymentStatus.replaceAll('_', ' ')})</p>}
                        {order.inventoryException && <p role="alert" className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">{order.inventoryException}</p>}
                      </section>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-[#B58A42]/25 pt-4">
                      <label className="text-xs font-semibold text-[#682D42]">Fulfilment status
                        <select value={draft?.status || order.fulfilmentStatus} onChange={(e) => updateDraft(order.reference, { status: e.target.value as FulfilmentStatus })} className="mt-1 min-h-10 w-full rounded-lg border border-[#B58A42]/45 bg-white px-2 text-sm">
                          {fulfilmentStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-[#682D42]">Courier
                        <input value={draft?.courier || ''} onChange={(e) => updateDraft(order.reference, { courier: e.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-[#B58A42]/45 bg-white px-2 text-sm" />
                      </label>
                      <label className="text-xs font-semibold text-[#682D42]">Tracking number
                        <input value={draft?.trackingNumber || ''} onChange={(e) => updateDraft(order.reference, { trackingNumber: e.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-[#B58A42]/45 bg-white px-2 text-sm" />
                      </label>
                      <label className="text-xs font-semibold text-[#682D42]">Update note
                        <input value={draft?.note || ''} onChange={(e) => updateDraft(order.reference, { note: e.target.value })} className="mt-1 min-h-10 w-full rounded-lg border border-[#B58A42]/45 bg-white px-2 text-sm" />
                      </label>
                    </div>
                    <button type="button" onClick={() => void saveFulfilment(order.reference)} disabled={saving === order.reference} className="min-h-10 rounded-lg bg-[#682D42] px-4 py-2 text-xs font-semibold text-[#FFF8EE] disabled:opacity-50">
                      {saving === order.reference ? 'Saving…' : 'Save fulfilment update'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
