export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  isVisible: boolean;
  displayOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price?: number | null;
  salePrice?: number | null;
  isVisible: boolean;
  isHighlighted: boolean;
  image: string;
  onlinePurchaseEnabled?: boolean;
  onlinePurchaseConfigured?: boolean;
  sellingUnit?: string;
  minimumQuantity?: number;
  quantityStep?: number;
  stockQuantity?: number;
  variants?: ProductVariant[];
  additionalImages?: string[];
  taxRatePercent?: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  image?: string;
}

export interface CartEntry {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface ProductVideoItem {
  id: string;
  title: string;
  posterImage: string;
  videoUrl: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface WebsiteSettings {
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

  // Extended homepage sections settings
  showVideosSection?: boolean;
  videosHeading?: string;
  videosSubtitle?: string;
  productVideos?: ProductVideoItem[];

  showStorySection?: boolean;
  storyHeading?: string;
  storyDescription?: string;
  storyImage?: string;
  storyVideo?: string;

  // Editable site imagery (replace via Store Settings → Site images)
  logoImage?: string;
  faviconImage?: string;
  ogImage?: string;
  hangingLanternImage?: string;
  collectionsHeroImage?: string;
  storyPageHeroImage?: string;
  storyPageHeroVideo?: string;
  storyCelebrationsImage?: string;
  storyDevotionImage?: string;
  storyCreativityImage?: string;
  visitUsImage?: string;

  showPhotoEnquirySection?: boolean;
  photoEnquiryHeading?: string;
  photoEnquiryText?: string;
  photoEnquiryButtonText?: string;

  showVisitSection?: boolean;
  visitHeading?: string;
  visitShopPhoto?: string;
  visitDirectionsUrl?: string;
}

export interface PublicBootstrapData {
  categories: Category[];
  products: Product[];
  settings: WebsiteSettings;
}

export interface AdminData {
  categories: Category[];
  products: Product[];
  settings: WebsiteSettings;
  user?: {
    username: string;
    role: string;
  };
}

export interface DeliveryAddress {
  fullName: string;
  mobile: string;
  email?: string;
  address: string;
  landmark?: string;
  pinCode: string;
  city: string;
  state: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type FulfilmentStatus =
  | 'New'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface StoreOrder {
  reference: string;
  createdAt: string;
  updatedAt: string;
  statusTokenHash: string;
  idempotencyKey: string;
  productId: string;
  variantId?: string;
  item: {
    name: string;
    variantLabel?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    regularUnitPrice?: number;
    discountAmount?: number;
    discountPercent?: number;
    image: string;
  };
  items?: Array<{
    productId: string;
    variantId?: string;
    name: string;
    variantLabel?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    regularUnitPrice?: number;
    discountAmount?: number;
    discountPercent?: number;
    image: string;
  }>;
  address: DeliveryAddress;
  subtotal: number;
  deliveryCharge: number;
  taxAmount: number;
  total: number;
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
  providerOrderId?: string;
  paymentSessionId?: string;
  paymentReference?: string;
  inventoryReserved: boolean;
  inventoryException?: string;
  orderExpiryTime: string;
  courier?: string;
  trackingNumber?: string;
  refundAmount?: number;
  statusHistory: Array<{ status: FulfilmentStatus; at: string; note?: string }>;
}
