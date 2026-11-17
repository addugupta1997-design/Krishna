import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import crypto from 'crypto';
import type { DeliveryAddress, FulfilmentStatus, PaymentStatus, ProductVariant, StoreOrder } from './src/types';
import { DEFAULT_PRIVACY_POLICY } from './src/utils/privacyPolicy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: ['.env.local', '.env'] });

const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'krishna-tracer-secret-key-1955-heritage';
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for images & short clips
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|mp4|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype) || file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/');
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, PNG, WEBP, GIF, and MP4/WebM files are allowed'));
  },
});

interface DatabaseSchema {
  admin: {
    username: string;
    passwordHash: string;
  };
  settings: {
    heroHeadline: string;
    heroSupportingText: string;
    heroImage: string;
    whatsappNumber: string;
    primaryCallNumber: string;
    secondaryCallNumber: string;
    address: string;
    timings: string;
    closedDay: string;
    instagramHandle: string;
    instagramUrl: string;
    privacyPolicy?: string;
    serviceablePinCodes?: string[];
    shippingCharge?: number;
    freeShippingThreshold?: number | null;
    shippingPolicy?: string;
    returnsPolicy?: string;
    pickupEnabled?: boolean;
    showVideosSection?: boolean;
    videosHeading?: string;
    videosSubtitle?: string;
    productVideos?: Array<{
      id: string;
      title: string;
      posterImage: string;
      videoUrl: string;
      displayOrder: number;
      isVisible: boolean;
    }>;
    showStorySection?: boolean;
    storyHeading?: string;
    storyDescription?: string;
    storyImage?: string;
    showPhotoEnquirySection?: boolean;
    photoEnquiryHeading?: string;
    photoEnquiryText?: string;
    photoEnquiryButtonText?: string;
    showVisitSection?: boolean;
    visitHeading?: string;
    visitShopPhoto?: string;
    visitDirectionsUrl?: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image: string;
    isVisible: boolean;
    displayOrder: number;
  }>;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    description: string;
    price: number | null;
    salePrice?: number | null;
    isVisible: boolean;
    isHighlighted: boolean;
    image: string;
    onlinePurchaseEnabled?: boolean;
    sellingUnit?: string;
    minimumQuantity?: number;
    quantityStep?: number;
    stockQuantity?: number;
    variants?: ProductVariant[];
    additionalImages?: string[];
    taxRatePercent?: number;
  }>;
  orders?: StoreOrder[];
  processedWebhookEvents?: string[];
}

function getInitialDatabase(): DatabaseSchema {
  // Admin credentials from environment variables — never hardcoded in source
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required to create the initial database. Set it in .env or your hosting provider.');
  }
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(adminPassword, salt);

  return {
    admin: {
      username: adminUsername,
      passwordHash,
    },
    settings: {
      heroHeadline: 'Little details. Beautiful celebrations.',
      heroSupportingText: 'Wedding essentials, divine shringaar and festive décor — all in one place.',
      heroImage: '/assets/images/hero_photography.jpg',
      whatsappNumber: '+91 98912 99770',
      primaryCallNumber: '+91 98912 99770',
      secondaryCallNumber: '+91 99117 62720',
      address: '11/6A, Central Market,\nNear Verma Watch, Tilak Nagar,\nNew Delhi – 110018',
      timings: '10:45 AM – 8:30 PM',
      closedDay: 'Wednesday',
      instagramHandle: '@krishnatracer',
      instagramUrl: 'https://instagram.com/krishnatracer',
      privacyPolicy: DEFAULT_PRIVACY_POLICY,
    },
    categories: [
      {
        id: 'cat-1',
        name: 'Wedding Essentials',
        slug: 'wedding-essentials',
        image: '/assets/images/cat_wedding.jpg',
        isVisible: true,
        displayOrder: 1,
      },
      {
        id: 'cat-2',
        name: 'Bhagwan Ji Shringaar',
        slug: 'bhagwan-ji-shringaar',
        image: '/assets/images/cat_shringaar.jpg',
        isVisible: true,
        displayOrder: 2,
      },
      {
        id: 'cat-3',
        name: 'Laces & Latkans',
        slug: 'laces-and-latkans',
        image: '/assets/images/prod_laces.jpg',
        isVisible: true,
        displayOrder: 3,
      },
      {
        id: 'cat-4',
        name: 'Festive Décor',
        slug: 'festive-decor',
        image: '/assets/images/prod_bandhanwar.jpg',
        isVisible: true,
        displayOrder: 4,
      },
      {
        id: 'cat-5',
        name: 'Art & Craft',
        slug: 'art-and-craft',
        image: '/assets/images/cat_craft.jpg',
        isVisible: true,
        displayOrder: 5,
      },
    ],
    products: [
      {
        id: 'prod-1',
        name: 'Wedding Thali',
        slug: 'wedding-thali',
        categoryId: 'cat-1',
        description: 'Decorative handcrafted thali with intricate pearl work, velvet base, and brass katoris for wedding ceremonies.',
        price: null,
        isVisible: true,
        isHighlighted: true,
        image: '/assets/images/prod_thali.jpg',
      },
      {
        id: 'prod-2',
        name: 'Designer Lace',
        slug: 'designer-lace',
        categoryId: 'cat-3',
        description: 'Heavy embroidered bridal zari border lace with intricate sequins, stones, and floral jaal work.',
        price: null,
        isVisible: true,
        isHighlighted: true,
        image: '/assets/images/prod_laces.jpg',
      },
      {
        id: 'prod-3',
        name: 'Pink Latkan Set',
        slug: 'pink-latkan-set',
        categoryId: 'cat-3',
        description: 'Artisanal hand-tied silk thread tassels and latkans with golden pearl jhumkis for lehengas and dupattas.',
        price: null,
        isVisible: true,
        isHighlighted: true,
        image: '/assets/images/prod_latkans.jpg',
      },
      {
        id: 'prod-4',
        name: 'Shringaar Dress',
        slug: 'shringaar-dress',
        categoryId: 'cat-2',
        description: 'Ornate deity poshaak with hand-stitched zardozi embroidery, peacock feather motif, and matching mukut.',
        price: null,
        isVisible: true,
        isHighlighted: true,
        image: '/assets/images/prod_shringaar.jpg',
      },
      {
        id: 'prod-5',
        name: 'Floral Bandhanwar',
        slug: 'floral-bandhanwar',
        categoryId: 'cat-4',
        description: 'Festive entrance toran embellished with brass bells, handcrafted pom-poms, and marigold accents.',
        price: null,
        isVisible: true,
        isHighlighted: true,
        image: '/assets/images/prod_bandhanwar.jpg',
      },
      {
        id: 'prod-6',
        name: 'Festive Diya & Lantern',
        slug: 'festive-diya-lantern',
        categoryId: 'cat-4',
        description: 'Antique finish brass lantern and ornate diya holder for festive home celebrations and mandir décor.',
        price: null,
        isVisible: true,
        isHighlighted: true,
        image: '/assets/images/prod_decor.jpg',
      },
      {
        id: 'prod-7',
        name: 'Decorative Buttons',
        slug: 'decorative-buttons',
        categoryId: 'cat-5',
        description: 'Royal heritage kundan-finish handcrafted buttons for sherwanis, blazers, and custom festive outfits.',
        price: null,
        isVisible: true,
        isHighlighted: false,
        image: '/assets/images/prod_buttons.jpg',
      },
    ],
  };
}

// Database helper functions with atomic write
function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDatabase();
    saveDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const stored = JSON.parse(raw) as DatabaseSchema;
    let migrated = false;
    if (!Array.isArray(stored.orders)) {
      stored.orders = [];
      migrated = true;
    }
    if (!Array.isArray(stored.processedWebhookEvents)) {
      stored.processedWebhookEvents = [];
      migrated = true;
    }
    for (const product of stored.products) {
      if (product.onlinePurchaseEnabled === undefined) { product.onlinePurchaseEnabled = false; migrated = true; }
      if (!product.sellingUnit) { product.sellingUnit = 'piece'; migrated = true; }
      if (!product.minimumQuantity) { product.minimumQuantity = 1; migrated = true; }
      if (!product.quantityStep) { product.quantityStep = 1; migrated = true; }
      if (!product.additionalImages) { product.additionalImages = []; migrated = true; }
    }
    if (migrated) saveDb(stored);
    return stored;
  } catch (err) {
    console.error('Error reading database, restoring defaults:', err);
    const initial = getInitialDatabase();
    saveDb(initial);
    return initial;
  }
}

function saveDb(data: DatabaseSchema): void {
  const tempFile = `${DB_FILE}.tmp-${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// Initialize database
let db = loadDb();

const CASHFREE_API_VERSION = '2026-01-01';
const ORDER_HOLD_MS = 20 * 60 * 1000;

function getCashfreeConfig() {
  const configuredMode = process.env.CASHFREE_MODE;
  const validMode = !configuredMode || configuredMode === 'sandbox' || configuredMode === 'production';
  const mode = configuredMode === 'production' ? 'production' : 'sandbox';
  const publicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '');
  const credentialsPresent = Boolean(
    process.env.CASHFREE_CLIENT_ID?.trim() &&
    process.env.CASHFREE_CLIENT_SECRET?.trim() &&
    publicBaseUrl &&
    (publicBaseUrl.startsWith('https://') ||
      (mode === 'sandbox' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(publicBaseUrl)))
  );
  const secureAdminSecret = Boolean(
    process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length >= 32 &&
    process.env.JWT_SECRET !== 'krishna-tracer-secret-key-1955-heritage'
  );
  const liveModeApproved = mode !== 'production' ||
    (process.env.CASHFREE_LIVE_ENABLED === 'true' &&
      process.env.CASHFREE_LIVE_CHECKLIST_COMPLETED === 'true' &&
      secureAdminSecret);
  const credentialsConfigured = validMode && credentialsPresent && liveModeApproved;
  return {
    mode,
    publicBaseUrl,
    credentialsPresent,
    credentialsConfigured,
    apiBase: mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg',
  };
}

async function cashfreeRequest<T>(route: string, init: RequestInit = {}): Promise<T> {
  const config = getCashfreeConfig();
  if (!config.credentialsConfigured) {
    throw new Error('Cashfree server credentials or a secure public base URL are not configured.');
  }
  const response = await fetch(`${config.apiBase}${route}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_CLIENT_ID!,
      'x-client-secret': process.env.CASHFREE_CLIENT_SECRET!,
      'x-api-version': CASHFREE_API_VERSION,
      ...init.headers,
    },
  });
  if (!response.ok) {
    console.error(`Cashfree request failed with HTTP ${response.status}`);
    throw new Error(`Payment provider request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

interface CashfreeOrderResponse {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
  payment_session_id?: string;
}

function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function getProductVariant(product: DatabaseSchema['products'][number], variantId?: string) {
  if (!product.variants?.length) {
    return variantId ? null : {
      label: undefined,
      regularPrice: product.price ?? 0,
      salePrice: product.salePrice,
      stock: product.stockQuantity ?? 0,
      image: product.image,
    };
  }
  return product.variants.find((variant) => variant.id === variantId)
    ? {
        label: product.variants.find((variant) => variant.id === variantId)!.label,
        regularPrice: product.variants.find((variant) => variant.id === variantId)!.price,
        salePrice: product.variants.find((variant) => variant.id === variantId)!.salePrice,
        stock: product.variants.find((variant) => variant.id === variantId)!.stockQuantity,
        image: product.variants.find((variant) => variant.id === variantId)!.image || product.image,
      }
    : null;
}

function getSalePrice(regularPrice: number, salePrice?: number | null): number {
  return Number.isFinite(salePrice) && Number(salePrice) > 0 && Number(salePrice) < regularPrice
    ? Number(salePrice)
    : regularPrice;
}

function isOnlineProductConfigured(product: DatabaseSchema['products'][number]): boolean {
  const validNumber = (value: number | undefined) => Number.isFinite(value) && (value ?? 0) > 0;
  const stockIsValid = (value: number | undefined) => Number.isFinite(value) && (value ?? -1) >= 0;
  const validSale = (salePrice: number | null | undefined, regularPrice: number) =>
    salePrice == null || (Number.isFinite(salePrice) && salePrice > 0 && salePrice < regularPrice);
  return Boolean(
    product.onlinePurchaseEnabled &&
    product.sellingUnit?.trim() &&
    validNumber(product.minimumQuantity) &&
    validNumber(product.quantityStep) &&
    stockIsValid(product.stockQuantity) &&
    (product.taxRatePercent === undefined || (Number.isFinite(product.taxRatePercent) && product.taxRatePercent >= 0 && product.taxRatePercent <= 100)) &&
    (product.variants?.length
      ? product.variants.every((variant) => variant.id && variant.label.trim() && validNumber(variant.price) && validSale(variant.salePrice, variant.price) && stockIsValid(variant.stockQuantity))
      : validNumber(product.price ?? undefined) && validSale(product.salePrice, product.price ?? 0))
  );
}

function normalizeProductVariants(value: unknown, requirePrices: boolean): ProductVariant[] | null {
  if (!Array.isArray(value)) return null;
  const variants: ProductVariant[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') return null;
    const option = candidate as Record<string, unknown>;
    if (
      typeof option.id !== 'string' || !option.id.trim() ||
      typeof option.label !== 'string' || !option.label.trim() ||
      !Number.isFinite(Number(option.price)) || Number(option.price) < 0 ||
      (requirePrices && Number(option.price) <= 0) ||
      !Number.isFinite(Number(option.stockQuantity)) || Number(option.stockQuantity) < 0 ||
      (option.salePrice != null && (!Number.isFinite(Number(option.salePrice)) || Number(option.salePrice) <= 0 || Number(option.salePrice) >= Number(option.price))) ||
      (option.image !== undefined && typeof option.image !== 'string')
    ) return null;
    variants.push({
      id: option.id.trim(),
      label: option.label.trim(),
      price: Number(option.price),
      salePrice: option.salePrice == null || option.salePrice === '' ? undefined : Number(option.salePrice),
      stockQuantity: Number(option.stockQuantity),
      image: typeof option.image === 'string' ? option.image : undefined,
    });
  }
  return new Set(variants.map((variant) => variant.id)).size === variants.length ? variants : null;
}

function reservedQuantity(productId: string, variantId?: string, exceptReference?: string): number {
  return (db.orders || []).reduce((reserved, order) => {
    if (order.reference !== exceptReference && order.inventoryReserved && new Date(order.orderExpiryTime).getTime() > Date.now()) {
      const items = order.items || [{
        productId: order.productId,
        variantId: order.variantId,
        quantity: order.item.quantity,
      }];
      return reserved + items
        .filter((item) => item.productId === productId && item.variantId === variantId)
        .reduce((sum, item) => sum + item.quantity, 0);
    }
    return reserved;
  }, 0);
}

function hasActiveInventoryReservation(productId?: string): boolean {
  const now = Date.now();
  return (db.orders || []).some((order) =>
    order.inventoryReserved &&
    new Date(order.orderExpiryTime).getTime() > now &&
    (!productId || order.productId === productId || order.items?.some((item) => item.productId === productId))
  );
}

function releaseOrderReservation(order: StoreOrder, nextStatus: PaymentStatus): void {
  if (!order.inventoryReserved) return;
  order.inventoryReserved = false;
  order.paymentStatus = nextStatus;
  order.updatedAt = new Date().toISOString();
}

function finalisePaidOrder(order: StoreOrder, providerOrder: CashfreeOrderResponse): void {
  if (
    providerOrder.order_status !== 'PAID' ||
    providerOrder.order_currency !== 'INR' ||
    Math.abs(providerOrder.order_amount - order.total) > 0.01
  ) {
    throw new Error('Payment provider order does not match the stored order amount.');
  }
  if (order.paymentStatus === 'PAID') return;

  const items = order.items || [{
    productId: order.productId,
    variantId: order.variantId,
    quantity: order.item.quantity,
  }];
  for (const orderItem of items) {
    const product = db.products.find((item) => item.id === orderItem.productId);
    const variant = orderItem.variantId ? product?.variants?.find((item) => item.id === orderItem.variantId) : undefined;
    const stock = orderItem.variantId ? variant?.stockQuantity : product?.stockQuantity;
    const availableAfterOtherReservations = product
      ? (stock ?? 0) - reservedQuantity(orderItem.productId, orderItem.variantId, order.reference)
      : 0;
    if (order.inventoryReserved && product && (!orderItem.variantId || variant) && availableAfterOtherReservations >= orderItem.quantity) {
      if (variant) variant.stockQuantity -= orderItem.quantity;
      else product.stockQuantity = (product.stockQuantity ?? 0) - orderItem.quantity;
    } else {
      order.inventoryException = 'Payment verified without a valid stock reservation. Contact the customer before fulfilment.';
    }
  }
  order.inventoryReserved = false;
  order.paymentStatus = 'PAID';
  order.updatedAt = new Date().toISOString();
  saveDb(db);
}

async function refreshProviderOrder(order: StoreOrder): Promise<void> {
  if (!order.providerOrderId || !order.inventoryReserved) return;
  const reference = order.reference;
  const providerOrder = await cashfreeRequest<CashfreeOrderResponse>(
    `/orders/${encodeURIComponent(order.providerOrderId)}`
  );
  db = loadDb();
  const storedOrder = db.orders!.find((candidate) => candidate.reference === reference);
  if (!storedOrder || !storedOrder.inventoryReserved) return;
  if (providerOrder.order_status === 'PAID') {
    finalisePaidOrder(storedOrder, providerOrder);
  } else if (
    ['EXPIRED', 'TERMINATED', 'CANCELLED'].includes(providerOrder.order_status) &&
    Date.now() >= new Date(storedOrder.orderExpiryTime).getTime()
  ) {
    releaseOrderReservation(storedOrder, 'CANCELLED');
    saveDb(db);
  }
}

function isValidDeliveryAddress(address: DeliveryAddress): boolean {
  return Boolean(
    address &&
    typeof address.fullName === 'string' && address.fullName.trim().length >= 2 &&
    typeof address.mobile === 'string' && address.mobile.replace(/\D/g, '').length >= 10 && address.mobile.replace(/\D/g, '').length <= 13 &&
    (!address.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) &&
    typeof address.address === 'string' && address.address.trim().length >= 5 &&
    typeof address.pinCode === 'string' && /^\d{6}$/.test(address.pinCode) &&
    typeof address.city === 'string' && address.city.trim().length >= 2 &&
    typeof address.state === 'string' && address.state.trim().length >= 2
  );
}

function publicOrder(order: StoreOrder) {
  const {
    statusTokenHash: _statusTokenHash,
    idempotencyKey: _idempotencyKey,
    productId: _productId,
    variantId: _variantId,
    providerOrderId: _providerOrderId,
    paymentSessionId: _paymentSessionId,
    inventoryReserved: _inventoryReserved,
    orderExpiryTime: _orderExpiryTime,
    ...safeOrder
  } = order;
  return safeOrder;
}

function safeWebsiteSettings(): Record<string, unknown> {
  const settings: Record<string, unknown> = { ...db.settings };
  for (const key of Object.keys(settings)) {
    if (/(cashfree|secret|private|api.?key|payment.*key)/i.test(key)) delete settings[key];
  }
  return settings;
}

// Express app
const app = express();

app.post('/api/webhooks/cashfree', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const secret = process.env.CASHFREE_CLIENT_SECRET;
  const signature = req.header('x-webhook-signature');
  const timestamp = req.header('x-webhook-timestamp');
  if (!secret || !signature || !timestamp || !Buffer.isBuffer(req.body)) {
    res.status(400).json({ error: 'Invalid webhook request.' });
    return;
  }

  const rawBody = req.body as Buffer;
  const expected = crypto.createHmac('sha256', secret).update(timestamp + rawBody.toString('utf8')).digest('base64');
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    res.status(401).json({ error: 'Invalid webhook signature.' });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid webhook payload.' });
    return;
  }
  const eventHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  db = loadDb();
  if (db.processedWebhookEvents!.includes(eventHash)) {
    res.json({ received: true, duplicate: true });
    return;
  }

  const providerOrderId = event?.data?.order?.order_id;
  let order = db.orders!.find((candidate) => candidate.providerOrderId === providerOrderId);
  if (order && event?.data?.payment?.payment_status === 'SUCCESS') {
    try {
      const verified = await cashfreeRequest<CashfreeOrderResponse>(
        `/orders/${encodeURIComponent(order.providerOrderId!)}`
      );
      db = loadDb();
      order = db.orders!.find((candidate) => candidate.providerOrderId === providerOrderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      finalisePaidOrder(order, verified);
      order.paymentReference = String(event.data.payment.cf_payment_id || order.paymentReference || '');
    } catch (error) {
      console.error('Cashfree payment verification failed for an order.');
      res.status(503).json({ error: 'Payment verification is temporarily unavailable.' });
      return;
    }
  } else if (order && event?.data?.payment?.payment_status === 'FAILED') {
    order.paymentStatus = 'FAILED';
    order.updatedAt = new Date().toISOString();
  } else if (order && event?.data?.refund?.refund_status) {
    const refundStatus = String(event.data.refund.refund_status).toUpperCase();
    if (refundStatus === 'SUCCESS') {
      const amount = Number(event.data.refund.refund_amount || 0);
      order.refundAmount = roundMoney((order.refundAmount || 0) + amount);
      order.paymentStatus = order.refundAmount >= order.total ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      order.updatedAt = new Date().toISOString();
    }
  }
  db.processedWebhookEvents!.push(eventHash);
  if (db.processedWebhookEvents!.length > 5000) db.processedWebhookEvents!.splice(0, db.processedWebhookEvents!.length - 5000);
  saveDb(db);
  res.json({ received: true });
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Static uploads and assets
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Authentication middleware
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    if (decoded && decoded.username === db.admin.username) {
      (req as any).user = decoded;
      return next();
    }
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  } catch {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
}

// --- Auth Routes ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  // Refresh db
  db = loadDb();

  const isUserMatch = username.trim().toLowerCase() === db.admin.username.toLowerCase();
  const isPassMatch = isUserMatch && bcrypt.compareSync(password, db.admin.passwordHash);

  if (!isPassMatch) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign({ username: db.admin.username }, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    user: {
      username: db.admin.username,
      role: 'admin',
    },
  });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ authenticated: false });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    db = loadDb();
    if (decoded && decoded.username === db.admin.username) {
      res.json({
        authenticated: true,
        user: {
          username: db.admin.username,
          role: 'admin',
        },
      });
      return;
    }
    res.status(401).json({ authenticated: false });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

// --- Public Endpoints ---
app.get('/api/public/data', (_req: Request, res: Response) => {
  db = loadDb();

  // Filter only visible categories sorted by displayOrder
  const visibleCategories = db.categories
    .filter((c) => c.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const visibleCategoryIds = new Set(visibleCategories.map((c) => c.id));

  // Filter visible products belonging to visible categories
  const visibleProducts = db.products.filter(
    (p) => p.isVisible && visibleCategoryIds.has(p.categoryId)
  ).map((product) => {
    const configured = isOnlineProductConfigured(product);
    return {
      ...product,
      onlinePurchaseEnabled: product.onlinePurchaseEnabled === true,
      onlinePurchaseConfigured: configured,
      price: product.price,
      salePrice: product.salePrice,
      stockQuantity: configured ? product.stockQuantity : undefined,
      variants: product.variants,
    };
  });

  res.json({
    categories: visibleCategories,
    products: visibleProducts,
    settings: {
      ...safeWebsiteSettings(),
      serviceablePinCodes: db.settings.serviceablePinCodes || [],
      shippingCharge: db.settings.shippingCharge,
      freeShippingThreshold: db.settings.freeShippingThreshold ?? null,
    },
  });
});

app.get('/api/public/commerce', (_req: Request, res: Response) => {
  db = loadDb();
  const config = getCashfreeConfig();
  const shippingConfigured = Boolean(
    Number.isFinite(db.settings.shippingCharge) &&
    (db.settings.shippingCharge ?? -1) >= 0
  );
  res.json({
    paymentReady: config.credentialsConfigured && shippingConfigured,
    providerConfigured: config.credentialsConfigured,
    provider: 'Cashfree',
    mode: config.mode,
    shippingConfigured,
  });
});

app.post('/api/public/orders', async (req: Request, res: Response) => {
  const config = getCashfreeConfig();
  if (!config.credentialsConfigured) {
    res.status(503).json({ error: 'Online payment is not available yet. Please contact the store.' });
    return;
  }

  const {
    items: requestedItems,
    productId,
    variantId,
    quantity,
    address,
    idempotencyKey,
    statusToken,
    expectedUnitPrice,
    expectedTotal,
  } = req.body as {
    items?: Array<{
      productId?: string;
      variantId?: string;
      quantity?: number;
      expectedUnitPrice?: number;
    }>;
    productId?: string;
    variantId?: string;
    quantity?: number;
    address?: DeliveryAddress;
    idempotencyKey?: string;
    statusToken?: string;
    expectedUnitPrice?: number;
    expectedTotal?: number;
  };
  const items = requestedItems || (productId && typeof quantity === 'number'
    ? [{ productId, variantId, quantity, expectedUnitPrice }]
    : []);
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 30 ||
    items.some((item) =>
      !item ||
      typeof item !== 'object' ||
      typeof item.productId !== 'string' ||
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      (item.variantId !== undefined && typeof item.variantId !== 'string')
    ) ||
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.length < 32 ||
    typeof statusToken !== 'string' ||
    statusToken.length < 32 ||
    !isValidDeliveryAddress(address as DeliveryAddress)
  ) {
    res.status(400).json({ error: 'Enter valid delivery details and try again.' });
    return;
  }

  db = loadDb();
  const statusTokenHash = crypto.createHash('sha256').update(statusToken).digest('hex');
  const duplicate = db.orders!.find((order) => order.idempotencyKey === idempotencyKey);
  if (duplicate) {
    if (duplicate.statusTokenHash !== statusTokenHash) {
      res.status(409).json({ error: 'This checkout request is already in use. Refresh checkout and try again.' });
      return;
    }
    if (!duplicate.paymentSessionId) {
      try {
        const provider = await cashfreeRequest<CashfreeOrderResponse>('/orders', {
          method: 'POST',
          headers: { 'x-idempotency-key': duplicate.idempotencyKey },
          body: JSON.stringify({
            order_id: duplicate.providerOrderId,
            order_amount: duplicate.total,
            order_currency: 'INR',
            order_expiry_time: duplicate.orderExpiryTime,
            customer_details: {
              customer_id: duplicate.reference,
              customer_name: duplicate.address.fullName,
              customer_email: duplicate.address.email || undefined,
              customer_phone: duplicate.address.mobile.replace(/\D/g, '').slice(-10),
            },
            order_meta: {
              return_url: `${config.publicBaseUrl}/order-status/${statusToken}`,
              notify_url: `${config.publicBaseUrl}/api/webhooks/cashfree`,
            },
          }),
        });
        if (
          provider.order_id !== duplicate.providerOrderId ||
          provider.order_currency !== 'INR' ||
          Math.abs(provider.order_amount - duplicate.total) > 0.01
        ) throw new Error('Cashfree retry order does not match the saved order.');
        db = loadDb();
        const stored = db.orders!.find((order) => order.reference === duplicate.reference);
        if (!stored || !provider.payment_session_id) throw new Error('Cashfree did not return a payment session.');
        stored.paymentSessionId = provider.payment_session_id;
        saveDb(db);
        res.json({ order: publicOrder(stored), statusToken, paymentSessionId: provider.payment_session_id, mode: config.mode });
        return;
      } catch {
        console.error('Cashfree checkout retry failed.');
        res.status(502).json({ error: 'Payment provider is temporarily unavailable. Your checkout is saved; retry safely.' });
        return;
      }
    }
    res.json({
      order: publicOrder(duplicate),
      statusToken,
      paymentSessionId: duplicate.paymentSessionId,
      mode: config.mode,
    });
    return;
  }

  const shippingConfigured = Boolean(
    Number.isFinite(db.settings.shippingCharge) &&
    (db.settings.shippingCharge ?? -1) >= 0
  );
  if (!shippingConfigured) {
    res.status(503).json({ error: 'Delivery settings are not configured. Please contact the store.' });
    return;
  }
  if (db.settings.serviceablePinCodes?.length) {
    const serviceablePinCodes = db.settings.serviceablePinCodes.map((code) => code.trim());
    if (!serviceablePinCodes.includes(address!.pinCode)) {
      res.status(400).json({ error: 'We cannot deliver to this PIN code yet. Please contact the store for assistance.' });
      return;
    }
  }

  const visibleCategoryIds = new Set(db.categories.filter((category) => category.isVisible).map((category) => category.id));
  const mergedItems = new Map<string, { productId: string; variantId?: string; quantity: number; expectedUnitPrice?: number }>();
  for (const requested of items) {
    const key = `${requested.productId}:${requested.variantId || ''}`;
    const existing = mergedItems.get(key);
    if (existing) existing.quantity += requested.quantity!;
    else mergedItems.set(key, {
      productId: requested.productId!,
      variantId: requested.variantId,
      quantity: requested.quantity!,
      expectedUnitPrice: requested.expectedUnitPrice,
    });
  }

  const orderItems: NonNullable<StoreOrder['items']> = [];
  let subtotal = 0;
  let taxAmount = 0;
  for (const requested of mergedItems.values()) {
    const product = db.products.find((item) =>
      item.id === requested.productId &&
      item.isVisible &&
      visibleCategoryIds.has(item.categoryId)
    );
    if (!product || !isOnlineProductConfigured(product)) {
      res.status(400).json({ error: 'One or more products are not available for online purchase.' });
      return;
    }

    const selected = getProductVariant(product, requested.variantId);
    if (!selected) {
      res.status(400).json({ error: `Please select a valid option for ${product.name}.` });
      return;
    }
    const minimum = product.minimumQuantity || 1;
    const step = product.quantityStep || 1;
    const stepsFromMinimum = (requested.quantity - minimum) / step;
    if (requested.quantity < minimum || Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) > 1e-8) {
      res.status(400).json({ error: `Quantity for ${product.name} must be at least ${minimum} and follow increments of ${step} ${product.sellingUnit}.` });
      return;
    }
    const stockAvailable = selected.stock - reservedQuantity(product.id, requested.variantId);
    if (requested.quantity > stockAvailable) {
      res.status(409).json({ error: `Only ${Math.max(0, stockAvailable)} ${product.sellingUnit} of ${product.name} are available.` });
      return;
    }

    const unitPrice = getSalePrice(selected.regularPrice, selected.salePrice);
    const discountAmount = roundMoney(selected.regularPrice - unitPrice);
    const discountPercent = discountAmount > 0
      ? Math.floor(discountAmount / selected.regularPrice * 100)
      : 0;
    orderItems.push({
      productId: product.id,
      variantId: requested.variantId,
      name: product.name,
      variantLabel: selected.label,
      quantity: requested.quantity,
      unit: product.sellingUnit!,
      unitPrice,
      regularUnitPrice: selected.regularPrice,
      discountAmount,
      discountPercent,
      image: selected.image,
    });
    subtotal += unitPrice * requested.quantity;
    taxAmount += unitPrice * requested.quantity * (product.taxRatePercent || 0) / 100;
  }
  subtotal = roundMoney(subtotal);
  taxAmount = roundMoney(taxAmount);
  const freeAbove = db.settings.freeShippingThreshold;
  const deliveryCharge = freeAbove != null && subtotal >= freeAbove
    ? 0
    : roundMoney(db.settings.shippingCharge!);
  const total = roundMoney(subtotal + deliveryCharge + taxAmount);
  const expectedPricesChanged = [...mergedItems.values()].some((requested) => {
    if (!Number.isFinite(requested.expectedUnitPrice)) return false;
    const actual = orderItems.find((item) =>
      item.productId === requested.productId && item.variantId === requested.variantId
    );
    return !actual || Math.abs(requested.expectedUnitPrice! - actual.unitPrice) > 0.01;
  });
  if (expectedPricesChanged || (Number.isFinite(expectedTotal) && Math.abs(expectedTotal! - total) > 0.01)) {
    res.status(409).json({
      code: 'PRICE_UPDATED',
      error: 'A product price or order total changed. Review the updated total before continuing.',
      current: {
        items: orderItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          regularUnitPrice: item.regularUnitPrice,
          salePrice: item.discountAmount ? item.unitPrice : undefined,
        })),
        subtotal,
        deliveryCharge,
        taxAmount,
        total,
      },
    });
    return;
  }

  const now = new Date();
  const orderExpiryTime = new Date(now.getTime() + ORDER_HOLD_MS).toISOString();
  const reference = `KT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  const providerOrderId = `kt_${crypto.randomUUID().replace(/-/g, '')}`;
  const order: StoreOrder = {
    reference,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    statusTokenHash,
    idempotencyKey,
    productId: orderItems[0].productId,
    variantId: orderItems[0].variantId,
    item: {
      name: orderItems[0].name,
      variantLabel: orderItems[0].variantLabel,
      quantity: orderItems[0].quantity,
      unit: orderItems[0].unit,
      unitPrice: orderItems[0].unitPrice,
      regularUnitPrice: orderItems[0].regularUnitPrice,
      discountAmount: orderItems[0].discountAmount,
      discountPercent: orderItems[0].discountPercent,
      image: orderItems[0].image,
    },
    items: orderItems,
    address: {
      ...address!,
      fullName: address!.fullName.trim(),
      mobile: address!.mobile.trim(),
      email: address!.email?.trim(),
      address: address!.address.trim(),
      landmark: address!.landmark?.trim(),
      city: address!.city.trim(),
      state: address!.state.trim(),
    },
    subtotal,
    deliveryCharge,
    taxAmount,
    total,
    paymentStatus: 'PENDING',
    fulfilmentStatus: 'New',
    providerOrderId,
    inventoryReserved: true,
    orderExpiryTime,
    statusHistory: [{ status: 'New', at: now.toISOString() }],
  };
  db.orders!.push(order);
  saveDb(db);

  try {
    const provider = await cashfreeRequest<CashfreeOrderResponse>('/orders', {
      method: 'POST',
      headers: { 'x-idempotency-key': idempotencyKey },
      body: JSON.stringify({
        order_id: providerOrderId,
        order_amount: total,
        order_currency: 'INR',
        order_expiry_time: orderExpiryTime,
        customer_details: {
          customer_id: reference,
          customer_name: order.address.fullName,
          customer_email: order.address.email || undefined,
          customer_phone: order.address.mobile.replace(/\D/g, '').slice(-10),
        },
        order_meta: {
          return_url: `${config.publicBaseUrl}/order-status/${statusToken}`,
          notify_url: `${config.publicBaseUrl}/api/webhooks/cashfree`,
        },
      }),
    });
    if (
      provider.order_id !== providerOrderId ||
      provider.order_currency !== 'INR' ||
      Math.abs(provider.order_amount - total) > 0.01
    ) throw new Error('Cashfree order does not match the saved order.');
    db = loadDb();
    const stored = db.orders!.find((candidate) => candidate.reference === reference);
    if (!stored || !provider.payment_session_id) throw new Error('Cashfree did not return a payment session.');
    stored.paymentSessionId = provider.payment_session_id;
    saveDb(db);
    res.status(201).json({ order: publicOrder(stored), statusToken, paymentSessionId: provider.payment_session_id, mode: config.mode });
  } catch {
    console.error(`Cashfree checkout creation failed for ${reference}.`);
    res.status(502).json({ error: 'Payment provider is temporarily unavailable. Your checkout is saved; retry safely.' });
  }
});

app.get('/api/public/orders/status/:token', async (req: Request, res: Response) => {
  const token = req.params.token;
  if (!/^[\w-]{32,128}$/.test(token)) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  db = loadDb();
  let order = db.orders!.find((candidate) => candidate.statusTokenHash === tokenHash);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  try {
    await refreshProviderOrder(order);
  } catch {
    console.error(`Cashfree status refresh failed for ${order.reference}.`);
  }
  db = loadDb();
  order = db.orders!.find((candidate) => candidate.statusTokenHash === tokenHash);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  res.json({ order: publicOrder(order) });
});

// --- Admin Endpoints (Protected) ---
app.get('/api/admin/data', authMiddleware, (_req: Request, res: Response) => {
  db = loadDb();
  // Sort categories by displayOrder
  const sortedCategories = [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  res.json({
    categories: sortedCategories,
    products: db.products.map((product) => ({
      ...product,
      onlinePurchaseConfigured: isOnlineProductConfigured(product),
    })),
    settings: safeWebsiteSettings(),
    user: {
      username: db.admin.username,
      role: 'admin',
    },
  });
});

app.get('/api/admin/orders', authMiddleware, (_req: Request, res: Response) => {
    db = loadDb();
    res.json({ orders: [...db.orders!].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  });

app.put('/api/admin/orders/:reference/fulfilment', authMiddleware, (req: Request, res: Response) => {
    db = loadDb();
    const order = db.orders!.find((candidate) => candidate.reference === req.params.reference);
    const allowed: FulfilmentStatus[] = ['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const { status, courier, trackingNumber, note } = req.body as {
      status?: FulfilmentStatus;
      courier?: string;
      trackingNumber?: string;
      note?: string;
    };
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (!allowed.includes(status as FulfilmentStatus)) {
      res.status(400).json({ error: 'Invalid fulfilment status.' });
      return;
    }
    if (status === 'Cancelled' && order.paymentStatus === 'PAID') {
      res.status(400).json({ error: 'Paid orders cannot be cancelled here; issue any refund through Cashfree first.' });
      return;
    }
    if (order.paymentStatus !== 'PAID' && !['New', 'Cancelled'].includes(status!)) {
      res.status(400).json({ error: 'Only provider-verified paid orders can be processed or shipped.' });
      return;
    }
    order.fulfilmentStatus = status!;
    order.courier = typeof courier === 'string' ? courier.trim().slice(0, 100) : order.courier;
    order.trackingNumber = typeof trackingNumber === 'string' ? trackingNumber.trim().slice(0, 100) : order.trackingNumber;
    order.statusHistory.push({ status: status!, at: new Date().toISOString(), note: typeof note === 'string' ? note.trim().slice(0, 250) : undefined });
    order.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ order });
});

// Product Mutations
app.post('/api/admin/products', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const { name, categoryId, description, price, isVisible, isHighlighted, image } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Product name is required' });
    return;
  }
  if (!categoryId) {
    res.status(400).json({ error: 'Category is required' });
    return;
  }

  const onlinePurchaseEnabled = req.body.onlinePurchaseEnabled === true;
  const variants = normalizeProductVariants(req.body.variants ?? [], onlinePurchaseEnabled);
  if (!variants) {
    res.status(400).json({ error: 'Product options must have unique IDs, names, positive prices, and non-negative stock.' });
    return;
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    name: name.trim(),
    slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    categoryId,
    description: description ? description.trim() : '',
    price: price !== undefined && price !== '' && price !== null ? Number(price) : null,
    salePrice: req.body.salePrice !== undefined && req.body.salePrice !== '' && req.body.salePrice !== null
      ? Number(req.body.salePrice)
      : undefined,
    isVisible: isVisible !== false,
    isHighlighted: Boolean(isHighlighted),
    image: image || '/assets/images/prod_thali.jpg',
    onlinePurchaseEnabled,
    sellingUnit: typeof req.body.sellingUnit === 'string' ? req.body.sellingUnit.trim() : 'piece',
    minimumQuantity: Number(req.body.minimumQuantity ?? 1),
    quantityStep: Number(req.body.quantityStep ?? 1),
    stockQuantity: Number(req.body.stockQuantity ?? 0),
    variants,
    additionalImages: Array.isArray(req.body.additionalImages)
      ? req.body.additionalImages.filter((url: unknown): url is string => typeof url === 'string')
      : [],
    taxRatePercent: req.body.taxRatePercent === undefined ? undefined : Number(req.body.taxRatePercent),
  };
  if (newProduct.onlinePurchaseEnabled && !isOnlineProductConfigured(newProduct)) {
    res.status(400).json({ error: 'Online purchase requires a valid unit, quantity limits, stock, and product or option pricing.' });
    return;
  }
  if (newProduct.price === null || !Number.isFinite(newProduct.price) || newProduct.price <= 0) {
    res.status(400).json({ error: 'Regular price must be greater than zero.' });
    return;
  }
  if (newProduct.salePrice !== undefined && (
    !Number.isFinite(newProduct.salePrice) ||
    newProduct.salePrice <= 0 ||
    newProduct.price === null ||
    newProduct.salePrice >= newProduct.price
  )) {
    res.status(400).json({ error: 'Sale price must be greater than zero and lower than the regular price.' });
    return;
  }
  if (newProduct.taxRatePercent !== undefined && (!Number.isFinite(newProduct.taxRatePercent) || newProduct.taxRatePercent < 0 || newProduct.taxRatePercent > 100)) {
    res.status(400).json({ error: 'Tax rate must be between 0 and 100 percent.' });
    return;
  }

  db.products.push(newProduct);
  saveDb(db);

  res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const { name, categoryId, description, price, isVisible, isHighlighted, image } = req.body;

  if (name && !name.trim()) {
    res.status(400).json({ error: 'Product name cannot be empty' });
    return;
  }

  let variants = db.products[index].variants;
  if (req.body.variants !== undefined) {
    const onlinePurchaseEnabled = req.body.onlinePurchaseEnabled !== undefined
      ? Boolean(req.body.onlinePurchaseEnabled)
      : db.products[index].onlinePurchaseEnabled === true;
    const parsedVariants = normalizeProductVariants(req.body.variants, onlinePurchaseEnabled);
    if (!parsedVariants) {
      res.status(400).json({ error: 'Product options must have unique IDs, names, positive prices, and non-negative stock.' });
      return;
    }
    variants = parsedVariants;
  }

  const updated: DatabaseSchema['products'][number] = {
    ...db.products[index],
    name: name !== undefined ? name.trim() : db.products[index].name,
    slug: name !== undefined ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : db.products[index].slug,
    categoryId: categoryId !== undefined ? categoryId : db.products[index].categoryId,
    description: description !== undefined ? description.trim() : db.products[index].description,
    price: price !== undefined && price !== '' && price !== null ? Number(price) : (price === null || price === '' ? null : db.products[index].price),
    salePrice: req.body.salePrice === null || req.body.salePrice === ''
      ? undefined
      : req.body.salePrice !== undefined
        ? Number(req.body.salePrice)
        : db.products[index].salePrice,
    isVisible: isVisible !== undefined ? Boolean(isVisible) : db.products[index].isVisible,
    isHighlighted: isHighlighted !== undefined ? Boolean(isHighlighted) : db.products[index].isHighlighted,
    image: image !== undefined ? image : db.products[index].image,
    onlinePurchaseEnabled: req.body.onlinePurchaseEnabled !== undefined
      ? Boolean(req.body.onlinePurchaseEnabled)
      : db.products[index].onlinePurchaseEnabled,
    sellingUnit: req.body.sellingUnit !== undefined
      ? String(req.body.sellingUnit).trim()
      : db.products[index].sellingUnit,
    minimumQuantity: req.body.minimumQuantity !== undefined
      ? Number(req.body.minimumQuantity)
      : db.products[index].minimumQuantity,
    quantityStep: req.body.quantityStep !== undefined
      ? Number(req.body.quantityStep)
      : db.products[index].quantityStep,
    stockQuantity: req.body.stockQuantity !== undefined
      ? Number(req.body.stockQuantity)
      : db.products[index].stockQuantity,
    variants,
    additionalImages: req.body.additionalImages !== undefined
      ? (Array.isArray(req.body.additionalImages)
          ? req.body.additionalImages.filter((url: unknown): url is string => typeof url === 'string')
          : db.products[index].additionalImages)
      : db.products[index].additionalImages,
    taxRatePercent: req.body.taxRatePercent === null || req.body.taxRatePercent === ''
      ? undefined
      : req.body.taxRatePercent !== undefined
        ? Number(req.body.taxRatePercent)
        : db.products[index].taxRatePercent,
  };

  if (updated.onlinePurchaseEnabled && !isOnlineProductConfigured(updated)) {
    res.status(400).json({ error: 'Online purchase requires a valid unit, quantity limits, stock, and product or option pricing.' });
    return;
  }
  if (updated.price == null || !Number.isFinite(updated.price) || updated.price <= 0) {
    res.status(400).json({ error: 'Regular price must be greater than zero.' });
    return;
  }
  if (updated.salePrice != null && (
    !Number.isFinite(updated.salePrice) ||
    updated.salePrice <= 0 ||
    updated.price == null ||
    updated.salePrice >= updated.price
  )) {
    res.status(400).json({ error: 'Sale price must be greater than zero and lower than the regular price.' });
    return;
  }
  if (updated.taxRatePercent !== undefined && (!Number.isFinite(updated.taxRatePercent) || updated.taxRatePercent < 0 || updated.taxRatePercent > 100)) {
    res.status(400).json({ error: 'Tax rate must be between 0 and 100 percent.' });
    return;
  }
  if (updated.stockQuantity !== undefined && updated.stockQuantity < reservedQuantity(id)) {
    res.status(409).json({ error: 'Stock cannot be reduced below the quantity currently reserved for checkout.' });
    return;
  }
  const activeVariantReservations = (db.orders || []).filter(
    (order) => {
      const reservedItems = order.items || [{
        productId: order.productId,
        variantId: order.variantId,
      }];
      return reservedItems.some((item) => item.productId === id && item.variantId) &&
        order.inventoryReserved &&
        new Date(order.orderExpiryTime).getTime() > Date.now();
    }
  );
  if (activeVariantReservations.some((order) => {
    const reservedItems = order.items || [{ productId: order.productId, variantId: order.variantId }];
    return reservedItems.some((item) => item.productId === id && item.variantId && !updated.variants?.some((variant) => variant.id === item.variantId));
  })) {
    res.status(409).json({ error: 'A product option cannot be removed while a checkout is reserving its stock.' });
    return;
  }
  const currentProduct = db.products[index];
  const purchaseTermsChanged =
    updated.onlinePurchaseEnabled !== currentProduct.onlinePurchaseEnabled ||
    updated.price !== currentProduct.price ||
    updated.salePrice !== currentProduct.salePrice ||
    updated.taxRatePercent !== currentProduct.taxRatePercent ||
    updated.sellingUnit !== currentProduct.sellingUnit ||
    updated.minimumQuantity !== currentProduct.minimumQuantity ||
    updated.quantityStep !== currentProduct.quantityStep ||
    JSON.stringify((updated.variants || []).map(({ id: variantId, price: variantPrice, salePrice }) => [variantId, variantPrice, salePrice])) !==
    JSON.stringify((currentProduct.variants || []).map(({ id: variantId, price: variantPrice, salePrice }) => [variantId, variantPrice, salePrice]));
  if (purchaseTermsChanged && hasActiveInventoryReservation(id)) {
    res.status(409).json({ error: 'Purchase terms cannot change while a payment is active for this product. Retry after the checkout reservation expires.' });
    return;
  }
  for (const variant of updated.variants || []) {
    if (variant.stockQuantity < reservedQuantity(id, variant.id)) {
      res.status(409).json({ error: `Stock for ${variant.label} cannot be reduced below the quantity reserved for checkout.` });
      return;
    }
  }
  db.products[index] = updated;
  saveDb(db);

  res.json(updated);
});

app.delete('/api/admin/products/:id', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const { id } = req.params;
  if (!db.products.some((product) => product.id === id)) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  if ((db.orders || []).some((order) =>
    order.inventoryReserved &&
    (order.productId === id || order.items?.some((item) => item.productId === id))
  )) {
    res.status(409).json({ error: 'This product has stock reserved for an active checkout and cannot be deleted yet.' });
    return;
  }
  db.products = db.products.filter((p) => p.id !== id);

  saveDb(db);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// Category Mutations
app.post('/api/admin/categories', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const { name, image, isVisible, displayOrder } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const maxOrder = db.categories.reduce((max, c) => Math.max(max, c.displayOrder || 0), 0);

  const newCategory = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    image: image || '/assets/images/cat_wedding.jpg',
    isVisible: isVisible !== false,
    displayOrder: displayOrder !== undefined ? Number(displayOrder) : maxOrder + 1,
  };

  db.categories.push(newCategory);
  saveDb(db);

  res.status(201).json(newCategory);
});

app.put('/api/admin/categories/:id', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const { id } = req.params;
  const index = db.categories.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const { name, image, isVisible, displayOrder } = req.body;

  const updated = {
    ...db.categories[index],
    name: name !== undefined ? name.trim() : db.categories[index].name,
    slug: name !== undefined ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : db.categories[index].slug,
    image: image !== undefined ? image : db.categories[index].image,
    isVisible: isVisible !== undefined ? Boolean(isVisible) : db.categories[index].isVisible,
    displayOrder: displayOrder !== undefined ? Number(displayOrder) : db.categories[index].displayOrder,
  };

  db.categories[index] = updated;
  saveDb(db);

  res.json(updated);
});

app.delete('/api/admin/categories/:id', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const { id } = req.params;

  // Requirement: Prevent deletion of a category containing products until those products are reassigned.
  const assignedProducts = db.products.filter((p) => p.categoryId === id);
  if (assignedProducts.length > 0) {
    res.status(400).json({
      error: `Cannot delete category: ${assignedProducts.length} product(s) are currently assigned to it. Please reassign or delete these products first.`,
    });
    return;
  }

  const initialLength = db.categories.length;
  db.categories = db.categories.filter((c) => c.id !== id);

  if (db.categories.length === initialLength) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  saveDb(db);
  res.json({ success: true, message: 'Category deleted successfully' });
});

// Category Reorder
app.post('/api/admin/categories/reorder', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ error: 'orderedIds must be an array of category IDs' });
    return;
  }

  orderedIds.forEach((id: string, index: number) => {
    const cat = db.categories.find((c) => c.id === id);
    if (cat) {
      cat.displayOrder = index + 1;
    }
  });

  saveDb(db);
  res.json({
    success: true,
    categories: [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder),
  });
});

// Settings Mutation
app.put('/api/admin/settings', authMiddleware, (req: Request, res: Response) => {
  db = loadDb();
  const newSettings = req.body as Partial<DatabaseSchema['settings']> & Record<string, unknown>;
  if (Object.keys(newSettings).some((key) => /(cashfree|secret|private|api.?key|payment.*key)/i.test(key))) {
    res.status(400).json({ error: 'Payment credentials must be configured on the server, not in website settings.' });
    return;
  }
  if (
    newSettings.serviceablePinCodes !== undefined &&
    (!Array.isArray(newSettings.serviceablePinCodes) ||
      newSettings.serviceablePinCodes.some((code) => typeof code !== 'string' || !/^\d{6}$/.test(code.trim())))
  ) {
    res.status(400).json({ error: 'Delivery PIN codes must be valid six-digit codes.' });
    return;
  }
  if (
    newSettings.shippingCharge !== undefined &&
    (!Number.isFinite(newSettings.shippingCharge) || Number(newSettings.shippingCharge) < 0)
  ) {
    res.status(400).json({ error: 'Shipping charge must be zero or a positive amount.' });
    return;
  }
  if (
    newSettings.freeShippingThreshold != null &&
    (!Number.isFinite(newSettings.freeShippingThreshold) || Number(newSettings.freeShippingThreshold) < 0)
  ) {
    res.status(400).json({ error: 'Free-shipping threshold must be a non-negative amount.' });
    return;
  }
  const shippingSettingsChanged = ['serviceablePinCodes', 'shippingCharge', 'freeShippingThreshold', 'pickupEnabled']
    .some((key) => JSON.stringify(newSettings[key]) !== JSON.stringify(db.settings[key as keyof DatabaseSchema['settings']]));
  if (shippingSettingsChanged && hasActiveInventoryReservation()) {
    res.status(409).json({ error: 'Delivery rules cannot change while a payment is active. Retry after the checkout reservation expires.' });
    return;
  }

  db.settings = {
    ...db.settings,
    ...newSettings,
    heroHeadline: newSettings.heroHeadline?.trim() || db.settings.heroHeadline,
    heroSupportingText: newSettings.heroSupportingText?.trim() || db.settings.heroSupportingText,
    heroImage: newSettings.heroImage || db.settings.heroImage,
    whatsappNumber: newSettings.whatsappNumber?.trim() || db.settings.whatsappNumber,
    primaryCallNumber: newSettings.primaryCallNumber?.trim() || db.settings.primaryCallNumber,
    secondaryCallNumber: newSettings.secondaryCallNumber?.trim() || db.settings.secondaryCallNumber,
    address: newSettings.address?.trim() || db.settings.address,
    timings: newSettings.timings?.trim() || db.settings.timings,
    closedDay: newSettings.closedDay?.trim() || db.settings.closedDay,
    instagramHandle: newSettings.instagramHandle?.trim() || db.settings.instagramHandle,
    instagramUrl: typeof newSettings.instagramUrl === 'string'
      ? newSettings.instagramUrl.trim()
      : db.settings.instagramUrl,
  };

  saveDb(db);
  res.json(safeWebsiteSettings());
});

// Image Upload
app.post('/api/admin/upload', authMiddleware, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file uploaded' });
    return;
  }

  const publicUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    url: publicUrl,
    filename: req.file.filename,
    size: req.file.size,
  });
});

// Setup Vite development server or production static serving
function isKnownClientRoute(pathname: string): boolean {
  const productRoute = pathname.match(/^\/store\/product\/([^/]+)\/[^/]+$/);
  if (productRoute) {
    return db.products.some((product) =>
      product.id === productRoute[1] || encodeURIComponent(product.id) === productRoute[1]
    );
  }

  return pathname === '/' ||
    pathname === '/collections' ||
    pathname === '/store' ||
    pathname === '/checkout' ||
    /^\/order-status\/[^/]+$/.test(pathname) ||
    pathname === '/our-story' ||
    pathname === '/visit-us' ||
    pathname === '/privacy-policy' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/');
}

// Export the Express app for Vercel serverless deployment
export default app;

async function startServer() {
  // Skip listen when running as a Vercel serverless function
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (
        req.method !== 'GET' ||
        req.path.startsWith('/api/') ||
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/uploads/') ||
        req.path.startsWith('/@') ||
        req.path.startsWith('/src/') ||
        req.path.startsWith('/node_modules/') ||
        req.path.includes('.') ||
        isKnownClientRoute(req.path)
      ) {
        next();
        return;
      }
      fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (error, html) => {
        if (error) {
          next(error);
          return;
        }
        vite.transformIndexHtml(req.originalUrl, html).then(
          (transformedHtml) => res.status(404).type('html').send(transformedHtml),
          next
        );
      });
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.status(isKnownClientRoute(req.path) ? 200 : 404).sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Krishna Tracer full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
