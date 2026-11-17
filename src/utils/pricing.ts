import type { Product, ProductVariant } from '../types';

export interface PriceDisplay {
  regularPrice: number;
  salePrice?: number;
  sellingPrice: number;
  discountPercent: number;
}

function validSalePrice(salePrice: number | null | undefined, regularPrice: number): salePrice is number {
  return Number.isFinite(salePrice) && Number(salePrice) > 0 && Number(salePrice) < regularPrice;
}

export function getPriceDisplay(regularPrice: number | null | undefined, salePrice?: number | null): PriceDisplay | null {
  if (!Number.isFinite(regularPrice) || Number(regularPrice) <= 0) return null;
  const regular = Number(regularPrice);
  if (!validSalePrice(salePrice, regular)) {
    return { regularPrice: regular, sellingPrice: regular, discountPercent: 0 };
  }
  return {
    regularPrice: regular,
    salePrice: Number(salePrice),
    sellingPrice: Number(salePrice),
    discountPercent: Math.floor((regular - Number(salePrice)) / regular * 100),
  };
}

export function getProductPriceDisplay(product: Product, variant?: ProductVariant): PriceDisplay | null {
  return variant
    ? getPriceDisplay(variant.price, variant.salePrice)
    : getPriceDisplay(product.price, product.salePrice);
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
