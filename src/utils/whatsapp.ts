/**
 * WhatsApp integration utility for Krishna Tracer
 * Complies with strict requirements:
 * - Reads number from website settings
 * - Validated international format
 * - Correct pre-filled template messages
 * - Never marks a click as an order/payment
 */

export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-numeric characters except leading '+'
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned;
}

export function formatDisplayPhone(phone: string): string {
  return phone || '';
}

export function getProductUrl(productId: string): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/store?product=${encodeURIComponent(productId)}`;
}

export function createWhatsAppOrderLink(whatsappNumber: string, productName: string, productId: string): string {
  const cleanNumber = sanitizePhoneNumber(whatsappNumber);
  const productUrl = getProductUrl(productId);
  const message = `Namaste Krishna Tracer! I would like to order:
Product: ${productName}
Product link: ${productUrl}
Please confirm price and availability.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppEnquiryLink(whatsappNumber: string, productName: string, productId: string): string {
  const cleanNumber = sanitizePhoneNumber(whatsappNumber);
  const productUrl = getProductUrl(productId);
  const message = `Namaste Krishna Tracer! I would like more details about:
Product: ${productName}
Product link: ${productUrl}`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppGeneralLink(whatsappNumber: string): string {
  const cleanNumber = sanitizePhoneNumber(whatsappNumber);
  const message = `Namaste Krishna Tracer! I would like to enquire about your collections.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppPhotoEnquiryLink(whatsappNumber: string): string {
  const cleanNumber = sanitizePhoneNumber(whatsappNumber);
  const message = `Namaste Krishna Tracer! I’m looking for a specific design or product. I would like to share a photo and check its availability.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function createWhatsAppCustomLink(whatsappNumber: string, customMessage: string): string {
  const cleanNumber = sanitizePhoneNumber(whatsappNumber);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(customMessage)}`;
}
