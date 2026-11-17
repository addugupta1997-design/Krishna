/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollToTop } from './components/ScrollToTop';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';
import { HangingDecorations } from './components/HangingDecorations';
import { HomePage } from './pages/HomePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { OurStoryPage } from './pages/OurStoryPage';
import { VisitUsPage } from './pages/VisitUsPage';
import { AdminPage } from './pages/AdminPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CartPage } from './pages/CartPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DEFAULT_PRIVACY_POLICY } from './utils/privacyPolicy';
import type { CartEntry, Category, Product, WebsiteSettings } from './types';
import { getProductPriceDisplay } from './utils/pricing';

// Fallback initial settings matching the design references
const defaultSettings: WebsiteSettings = {
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
  logoImage: '/assets/images/logo_emblem.png',
  collectionsHeroImage: '/assets/images/collections_hero_clean.jpg',
  storyPageHeroImage: '/assets/images/hero_photography.jpg',
  storyCelebrationsImage: '/assets/images/story_celebrations.jpg',
  storyDevotionImage: '/assets/images/story_devotion.jpg',
  storyCreativityImage: '/assets/images/story_creativity.jpg',
  visitUsImage: '/assets/images/hero_photography.jpg',
};

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '/';
      if (path === '/collections') {
        window.history.replaceState({}, '', `/store${window.location.search}${window.location.hash}`);
        return '/store';
      }
      return path;
    }
    return '/';
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartEntry[]>(() => {
    try {
      const saved = window.localStorage.getItem('kt-cart');
      const parsed = saved ? JSON.parse(saved) as CartEntry[] : [];
      return Array.isArray(parsed)
        ? parsed.filter((item) => item && typeof item.productId === 'string' && Number.isFinite(item.quantity) && item.quantity > 0)
        : [];
    } catch {
      return [];
    }
  });
  const [cartNotice, setCartNotice] = useState('');
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      window.localStorage.setItem('kt-cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Could not persist cart:', error);
    }
  }, [cart]);

  const addToCart = useCallback((product: Product, variantId: string | undefined, quantity: number): boolean => {
    const variant = product.variants?.find((item) => item.id === variantId);
    const price = getProductPriceDisplay(product, variant);
    const stock = variant?.stockQuantity ?? product.stockQuantity ?? 0;
    const minimum = product.minimumQuantity || 1;
    const step = product.quantityStep || 1;
    const existing = cart.find((item) => item.productId === product.id && item.variantId === variantId);
    const newQuantity = (existing?.quantity || 0) + quantity;
    if (
      !product.onlinePurchaseEnabled ||
      !product.onlinePurchaseConfigured ||
      !price ||
      (product.variants?.length && !variant) ||
      !Number.isFinite(quantity) ||
      quantity < minimum ||
      Math.abs((quantity - minimum) / step - Math.round((quantity - minimum) / step)) > 1e-8 ||
      newQuantity > stock
    ) {
      setCartNotice(`Not enough available stock for ${product.name}.`);
      window.setTimeout(() => setCartNotice(''), 2500);
      return false;
    }

    setCart((previous) => {
      const index = previous.findIndex((item) => item.productId === product.id && item.variantId === variantId);
      if (index < 0) return [...previous, { productId: product.id, variantId, quantity }];
      return previous.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: newQuantity } : item);
    });
    setCartNotice(`${product.name} added to cart.`);
    window.setTimeout(() => setCartNotice(''), 2500);
    return true;
  }, [cart]);

  const changeCartQuantity = (entry: CartEntry, quantity: number) => {
    setCart((previous) => previous.map((item) =>
      item.productId === entry.productId && item.variantId === entry.variantId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeCartItem = (entry: CartEntry) => {
    setCart((previous) => previous.filter((item) =>
      item.productId !== entry.productId || item.variantId !== entry.variantId
    ));
  };

  const handlePaymentVerified = useCallback((statusToken: string) => {
    const key = `kt-clear-cart-on-payment-${statusToken}`;
    const purchasedEntries = sessionStorage.getItem(key);
    if (!purchasedEntries) return;
    try {
      const purchased = JSON.parse(purchasedEntries) as CartEntry[];
      setCart((current) => current.flatMap((entry) => {
        const purchase = purchased.find((item) => item.productId === entry.productId && item.variantId === entry.variantId);
        const remaining = entry.quantity - (purchase?.quantity || 0);
        return remaining > 0 ? [{ ...entry, quantity: remaining }] : [];
      }));
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Could not update cart after verified payment:', error);
    }
  }, []);

  const retryOrder = (items: CartEntry[], purchasedCartEntries: CartEntry[] | null) => {
    sessionStorage.setItem('kt-retry-order-items', JSON.stringify(items));
    if (purchasedCartEntries) {
      sessionStorage.setItem('kt-retry-cart-snapshot', JSON.stringify(purchasedCartEntries));
    } else {
      sessionStorage.removeItem('kt-retry-cart-snapshot');
    }
    const retryKey = `kt-checkout-${items.map((item) => `${item.productId}-${item.variantId || ''}-${item.quantity}`).join('|')}`;
    sessionStorage.removeItem(retryKey);
    navigate('/checkout?retry=1');
  };

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Active product modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  // Sync route with browser history
  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      const target = new URL(path, window.location.origin);
      if (target.pathname === '/collections') target.pathname = '/store';
      window.history.pushState({}, '', `${target.pathname}${target.search}${target.hash}`);
      setCurrentPath(target.pathname);

      // Check query params
      const params = target.searchParams;
      const catParam = params.get('category');
      const prodParam = params.get('product');

      if (catParam) {
        setSelectedCategoryName(catParam);
      }
      if (prodParam) {
        const found = products.find((p) => p.id === prodParam);
        if (found) setSelectedProduct(found);
      }
    }
  }, [products]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      let path = window.location.pathname || '/';
      if (path === '/collections') {
        path = '/store';
        window.history.replaceState({}, '', `/store${window.location.search}${window.location.hash}`);
      }
      setCurrentPath(path);

      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category');
      const prodParam = params.get('product');

      if (catParam) {
        setSelectedCategoryName(catParam);
      } else {
        setSelectedCategoryName(null);
      }

      if (prodParam) {
        const found = products.find((p) => p.id === prodParam);
        if (found) setSelectedProduct(found);
      } else {
        setSelectedProduct(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Load public data on mount
  const loadPublicData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/public/data');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setProducts(data.products || []);
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });

        // Check query param for product modal
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const prodId = params.get('product');
          const catName = params.get('category');
          if (catName) setSelectedCategoryName(catName);
          if (prodId && data.products) {
            const found = data.products.find((p: Product) => p.id === prodId);
            if (found) setSelectedProduct(found);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching public data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          // If on admin route, fetch all admin data
          loadAdminData();
        }
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/data');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setProducts(data.products || []);
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
    checkAuth();
  }, [loadPublicData, checkAuth]);

  // Handle direct product link URL updates
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('product', product.id);
      window.history.replaceState({}, '', currentUrl.toString());
    }
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('product');
      window.history.replaceState({}, '', currentUrl.toString());
    }
  };

  // Auth actions
  const handleLogin = async (user: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        if (data.token) setAuthToken(data.token);
        await loadAdminData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setAuthToken(null);
    await loadPublicData();
    navigate('/');
  };

  // Admin Mutations
  const handleSaveProduct = async (productData: Partial<Product>): Promise<boolean> => {
    try {
      const isEdit = Boolean(productData.id);
      const url = isEdit ? `/api/admin/products/${productData.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (res.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleSaveCategory = async (catData: Partial<Category>): Promise<boolean> => {
    try {
      const isEdit = Boolean(catData.id);
      const url = isEdit ? `/api/admin/categories/${catData.id}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(catData),
      });

      if (res.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteCategory = async (
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete category' };
      }

      await loadAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleReorderCategories = async (orderedIds: string[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) {
        await loadAdminData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleSaveSettings = async (settingsData: Partial<WebsiteSettings>): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(settingsData),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings({ ...defaultSettings, ...updated });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Determine current page view
  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');
  const isProductRoute = /^\/store\/product\/[^/]+\/[^/]+$/.test(currentPath);
  const isOrderStatusRoute = /^\/order-status\/[^/]+$/.test(currentPath);
  const isKnownPublicRoute =
    currentPath === '/' ||
    currentPath === '/collections' ||
    currentPath === '/store' ||
    isProductRoute ||
    currentPath === '/checkout' ||
    currentPath === '/cart' ||
    isOrderStatusRoute ||
    currentPath === '/our-story' ||
    currentPath === '/visit-us' ||
    currentPath === '/privacy-policy';
  const hangingDecorationPage = currentPath === '/'
    ? 'home'
    : currentPath === '/store'
      ? 'store'
      : currentPath === '/our-story'
        ? 'story'
        : currentPath === '/visit-us'
          ? 'visit'
          : null;

  // Admin initial tab
  let adminInitialTab: 'products' | 'categories' | 'orders' | 'settings' = 'products';
  if (currentPath.includes('/categories')) adminInitialTab = 'categories';
  if (currentPath.includes('/orders')) adminInitialTab = 'orders';
  if (currentPath.includes('/settings')) adminInitialTab = 'settings';

  return (
    <div className={`${isAdminRoute ? '' : 'storefront'} min-h-screen flex flex-col bg-[#FFF8EE] text-[#352D2F]`}>
      {/* If Admin route, render Admin page directly */}
      {isAdminRoute ? (
        <AdminPage
          categories={categories}
          products={products}
          settings={settings}
          isAuthenticated={isAuthenticated}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onNavigateWebsite={() => navigate('/')}
          onSaveProduct={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorderCategories={handleReorderCategories}
          onSaveSettings={handleSaveSettings}
          initialTab={adminInitialTab}
        />
      ) : (
        /* Public Customer-Facing Layout */
        <>
          <Navbar
            currentPath={currentPath}
            onNavigate={navigate}
            settings={settings}
            cartQuantity={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />

          <main className="relative flex-1">
            {cartNotice && <div role="status" className="cart-notice fixed right-4 top-24 z-[60] rounded-lg border border-[#B58A42]/60 bg-[#FFF8EE] px-4 py-3 text-sm font-medium text-[#682D42] shadow-lg">{cartNotice}</div>}
            {hangingDecorationPage && <HangingDecorations page={hangingDecorationPage} />}
            {currentPath === '/' && (
              <HomePage
                categories={categories}
                products={products}
                settings={settings}
                onNavigate={navigate}
                onSelectProduct={handleOpenProduct}
              />
            )}

            {currentPath === '/store' && (
              <CollectionsPage
                categories={categories}
                products={products}
                settings={settings}
                isLoading={isLoading}
                selectedCategoryName={selectedCategoryName}
                onSelectCategoryName={setSelectedCategoryName}
                onShopNow={(product) => navigate(`/store/product/${encodeURIComponent(product.id)}/${encodeURIComponent(product.slug)}`)}
                onAddToCart={addToCart}
                onNavigateHome={() => navigate('/')}
              />
            )}

            {isProductRoute && (() => {
              const productId = decodeURIComponent(currentPath.split('/')[3] || '');
              const product = products.find((candidate) => candidate.id === productId);
              return product ? (
                <ProductDetailPage
                  product={product}
                  category={categories.find((category) => category.id === product.categoryId)}
                  onBack={() => navigate('/store')}
                  onAddToCart={addToCart}
                  onContinueCheckout={(variantId, quantity) => {
                    const params = new URLSearchParams({
                      productId: product.id,
                      quantity: String(quantity),
                      direct: '1',
                    });
                    if (variantId) params.set('variantId', variantId);
                    navigate(`/checkout?${params.toString()}`);
                  }}
                />
              ) : (
                <NotFoundPage onNavigate={navigate} />
              );
            })()}

            {currentPath === '/checkout' && (
              <CheckoutPage
                products={products}
                cart={cart}
                directItems={(() => {
                  const params = new URLSearchParams(window.location.search);
                  if (params.get('retry') === '1') {
                    try {
                      const saved = JSON.parse(sessionStorage.getItem('kt-retry-order-items') || '[]') as CartEntry[];
                      if (Array.isArray(saved)) return saved;
                    } catch (error) {
                      console.error('Could not read retry order details:', error);
                    }
                  }
                  const productId = params.get('productId');
                  const quantity = Number(params.get('quantity'));
                  return productId && Number.isFinite(quantity) && quantity > 0
                    ? [{ productId, variantId: params.get('variantId') || undefined, quantity }]
                    : undefined;
                })()}
                settings={settings}
                onNavigate={navigate}
                onOrderCreated={(statusToken, cartPurchase) => {
                  const retrySnapshot = sessionStorage.getItem('kt-retry-cart-snapshot');
                  if (cartPurchase) {
                    sessionStorage.setItem(`kt-clear-cart-on-payment-${statusToken}`, JSON.stringify(cart));
                  } else if (retrySnapshot) {
                    sessionStorage.setItem(`kt-clear-cart-on-payment-${statusToken}`, retrySnapshot);
                  }
                  sessionStorage.removeItem('kt-retry-cart-snapshot');
                }}
              />
            )}

            {currentPath === '/cart' && (
              <CartPage
                cart={cart}
                products={products}
                settings={settings}
                onChangeQuantity={changeCartQuantity}
                onRemove={removeCartItem}
                onNavigate={navigate}
              />
            )}

            {isOrderStatusRoute && (
              <OrderStatusPage
                token={decodeURIComponent(currentPath.split('/')[2] || '')}
                settings={settings}
                onContinueShopping={() => navigate('/store')}
                onPaymentVerified={handlePaymentVerified}
                onRetry={retryOrder}
              />
            )}

            {currentPath === '/our-story' && (
              <OurStoryPage
                settings={settings}
                onNavigate={navigate}
              />
            )}

            {currentPath === '/visit-us' && (
              <VisitUsPage
                settings={settings}
                onNavigate={navigate}
              />
            )}

            {currentPath === '/privacy-policy' && (
              <PrivacyPolicyPage settings={settings} />
            )}

            {!isKnownPublicRoute && <NotFoundPage onNavigate={navigate} />}
          </main>

          <Footer
            settings={settings}
            onNavigatePage={navigate}
            onNavigateCategory={(catName) => {
              setSelectedCategoryName(catName);
              navigate(`/store?category=${encodeURIComponent(catName)}`);
            }}
          />

          {['/', '/store', '/our-story', '/visit-us'].includes(currentPath) && <ScrollToTop route={currentPath} />}

          {/* Product Detail Modal */}
          <ProductModal
            product={selectedProduct}
            category={
              selectedProduct
                ? categories.find((c) => c.id === selectedProduct.categoryId)
                : undefined
            }
            settings={settings}
            onClose={handleCloseProduct}
          />
        </>
      )}
    </div>
  );
}
