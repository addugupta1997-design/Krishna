import React, { useState, useRef, useCallback } from 'react';
import {
  Package,
  ClipboardList,
  Tag,
  Settings as SettingsIcon,
  ExternalLink,
  LogOut,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Menu,
  X,
  Check,
  AlertCircle,
  MessageCircle,
  Phone,
  Clock,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Video,
  Film,
  Camera,
  Image as ImageIcon,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '../components/Ornaments';
import { AdminOrders } from '../components/AdminOrders';
import type { Category, Product, ProductVariant, WebsiteSettings, ProductVideoItem } from '../types';
import { formatPrice, getPriceDisplay } from '../utils/pricing';

interface AdminPageProps {
  categories: Category[];
  products: Product[];
  settings: WebsiteSettings;
  isAuthenticated: boolean;
  onLogin: (username: string, password: string) => Promise<boolean>;
  onLogout: () => void;
  onNavigateWebsite: () => void;
  onSaveProduct: (productData: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onSaveCategory: (categoryData: Partial<Category>) => Promise<boolean>;
  onDeleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
  onReorderCategories: (orderedIds: string[]) => Promise<boolean>;
  onSaveSettings: (settingsData: Partial<WebsiteSettings>) => Promise<boolean>;
  initialTab?: 'products' | 'categories' | 'orders' | 'settings';
}

export function AdminPage({
  categories,
  products,
  settings,
  isAuthenticated,
  onLogin,
  onLogout,
  onNavigateWebsite,
  onSaveProduct,
  onDeleteProduct,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategories,
  onSaveSettings,
  initialTab = 'products',
}: AdminPageProps) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'settings'>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Products state
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productFeedback, setProductFeedback] = useState<string | null>(null);

  // Categories state
  const [categorySearch, setCategorySearch] = useState('');
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);

  // Settings state
  const [localSettings, setLocalSettings] = useState<WebsiteSettings>(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);
  const [paymentConfigStatus, setPaymentConfigStatus] = useState<{ paymentReady: boolean; provider: string; mode: string } | null>(null);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  React.useEffect(() => {
    fetch('/api/public/commerce')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Payment status unavailable')))
      .then((data) => setPaymentConfigStatus(data))
      .catch(() => setPaymentConfigStatus(null));
  }, []);

  // Upload helpers
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const productGalleryInputRef = useRef<HTMLInputElement>(null);
  const categoryImageInputRef = useRef<HTMLInputElement>(null);
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const storyImageInputRef = useRef<HTMLInputElement>(null);
  const storyVideoInputRef = useRef<HTMLInputElement>(null);
  const storyHeroVideoInputRef = useRef<HTMLInputElement>(null);
  const shopPhotoInputRef = useRef<HTMLInputElement>(null);
  const videoPosterInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const siteImageInputRef = useRef<HTMLInputElement>(null);
  const [siteImageKey, setSiteImageKey] = useState<string | null>(null);
  const [activeVideoEditIndex, setActiveVideoEditIndex] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mediaLibrary, setMediaLibrary] = useState<Array<{ name: string; url: string; createdAt?: string; size?: number }>>([]);
  const [mediaPickerKey, setMediaPickerKey] = useState<string | null>(null);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'settings' | 'product' | 'gallery' | null>(null);
  const [mediaError, setMediaError] = useState('');

  const loadMediaLibrary = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/media');
      if (response.ok) {
        const data = await response.json();
        setMediaLibrary(data.items || []);
      }
    } catch {
      // The library is optional; uploads still work without it.
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) loadMediaLibrary();
  }, [isAuthenticated, loadMediaLibrary]);

  const uploadWithProgress = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setUploadProgress(null);
      let data: { url?: string; error?: string } = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
      else reject(new Error(data.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => { setUploadProgress(null); reject(new Error('Network error during upload')); };
    xhr.send(formData);
  });

  // Generic Image Upload Handler
  const handleFileUpload = async (file: File, onSuccess: (url: string) => void) => {
    setMediaError('');
    try {
      setUploadingImage(true);
      const url = await uploadWithProgress(file);
      onSuccess(url);
      await loadMediaLibrary();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setMediaError(message);
      alert(`Upload error: ${message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProductGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImage(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadWithProgress(file));
      }
      setEditingProduct((previous) => previous
        ? { ...previous, additionalImages: [...(previous.additionalImages || []), ...uploaded] }
        : previous);
      await loadMediaLibrary();
    } catch (error) {
      alert(`Gallery upload error: ${error instanceof Error ? error.message : 'Upload failed'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    setEditingProduct((previous) => {
      if (!previous) return previous;
      const variants = [...(previous.variants || [])];
      variants[index] = { ...variants[index], ...updates };
      return { ...previous, variants };
    });
  };

  // Section expansion state in settings
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hero: true,
    videos: true,
    story: true,
    photoEnquiry: true,
    visit: true,
    contact: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUpdateVideoItem = (index: number, updates: Partial<ProductVideoItem>) => {
    const currentVideos = [...(localSettings.productVideos || [])];
    if (currentVideos[index]) {
      currentVideos[index] = { ...currentVideos[index], ...updates };
      setLocalSettings((prev) => ({ ...prev, productVideos: currentVideos }));
    }
  };

  const handleAddVideoItem = () => {
    const currentVideos = [...(localSettings.productVideos || [])];
    if (currentVideos.length >= 4) return;
    const newIdx = currentVideos.length + 1;
    currentVideos.push({
      id: `vid-${Date.now()}`,
      title: `Product highlight ${newIdx}`,
      posterImage: '/assets/images/prod_wedding_thali.jpg',
      videoUrl: '/assets/videos/lace_detailing.mp4',
      displayOrder: newIdx,
      isVisible: true,
    });
    setLocalSettings((prev) => ({ ...prev, productVideos: currentVideos }));
  };

  const handleDeleteVideoItem = (index: number) => {
    const currentVideos = (localSettings.productVideos || []).filter((_, i) => i !== index);
    setLocalSettings((prev) => ({ ...prev, productVideos: currentVideos }));
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const ok = await onLogin(username, password);
      if (!ok) {
        setLoginError('Invalid username or password. Please verify credentials.');
      }
    } catch {
      setLoginError('An error occurred during authentication.');
    } finally {
      setLoginLoading(false);
    }
  };

  // If unauthenticated, render the Store Admin Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8EE] flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-[#FFF8EE] rounded-2xl border border-[#B58A42]/40 shadow-xl p-8 text-[#352D2F]">
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size={56} className="mb-3" />
            <h1 className="font-serif text-2xl font-bold text-[#682D42]">
              Krishna Tracer
            </h1>
            <span className="text-[10px] tracking-widest text-[#B58A42] font-semibold uppercase mt-0.5">
              STORE ADMIN PANEL
            </span>
            <p className="text-xs text-[#352D2F]/70 mt-2">
              Sign in to manage your products, categories and store settings.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-[#682D42] mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#B58A42]/40 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#682D42]"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#682D42] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-[#B58A42]/40 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#682D42]"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#352D2F]/60 hover:text-[#682D42] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-lg bg-[#682D42] text-[#FFF8EE] text-sm font-semibold hover:bg-[#4F1E30] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-[#DFBE7A]" />
              <span>{loginLoading ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#B58A42]/20 flex flex-col items-center gap-2">
            <button
              onClick={onNavigateWebsite}
              className="text-xs text-[#B58A42] hover:text-[#682D42] hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Return to Public Website</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FILTERED PRODUCTS ---
  const filteredAdminProducts = products.filter((p) => {
    const matchesSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase().trim()) ||
      p.description.toLowerCase().includes(productSearch.toLowerCase().trim());

    const matchesCat =
      productCategoryFilter === 'All' || p.categoryId === productCategoryFilter;

    return matchesSearch && matchesCat;
  });

  // --- FILTERED CATEGORIES ---
  const filteredAdminCategories = categories
    .filter((c) =>
      !categorySearch.trim() ||
      c.name.toLowerCase().includes(categorySearch.toLowerCase().trim())
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Handle Category move up/down
  const handleCategoryMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filteredAdminCategories.length) return;

    const reordered = [...filteredAdminCategories];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    const orderedIds = reordered.map((c) => c.id);
    await onReorderCategories(orderedIds);
  };

  // Handle Category delete
  const handleDeleteCategoryClick = async (cat: Category) => {
    // Check if products exist in category
    const count = products.filter((p) => p.categoryId === cat.id).length;
    if (count > 0) {
      setCategoryError(
        `Cannot delete "${cat.name}": ${count} product(s) are currently assigned to it. Please reassign or delete these products first.`
      );
      setTimeout(() => setCategoryError(null), 6000);
      return;
    }

    if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      const res = await onDeleteCategory(cat.id);
      if (!res.success) {
        setCategoryError(res.error || 'Failed to delete category');
        setTimeout(() => setCategoryError(null), 6000);
      } else {
        setCategoryFeedback(`Category "${cat.name}" deleted.`);
        setTimeout(() => setCategoryFeedback(null), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EE] flex flex-col md:flex-row text-[#352D2F]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#FFF8EE] border-r border-[#B58A42]/30 p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-[#B58A42]/20">
            <BrandLogo size={42} />
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold text-[#682D42] leading-tight">
                Krishna Tracer
              </span>
              <span className="text-[9px] tracking-widest text-[#B58A42] font-semibold uppercase">
                TILAK NAGAR · DELHI
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Admin Navigation">
            <button
              onClick={() => {
                setActiveTab('products');
                setEditingProduct(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'products'
                  ? 'bg-[#F6DCE3] text-[#682D42] font-semibold shadow-2xs'
                  : 'text-[#352D2F]/80 hover:bg-[#F6DCE3]/40 hover:text-[#682D42]'
              }`}
            >
              <Package className="w-4 h-4 text-[#B58A42]" />
              <span>Products</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('categories');
                setEditingCategory(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-[#F6DCE3] text-[#682D42] font-semibold shadow-2xs'
                  : 'text-[#352D2F]/80 hover:bg-[#F6DCE3]/40 hover:text-[#682D42]'
              }`}
            >
              <Tag className="w-4 h-4 text-[#B58A42]" />
              <span>Categories</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                setEditingProduct(null);
                setEditingCategory(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#F6DCE3] text-[#682D42] font-semibold shadow-2xs'
                  : 'text-[#352D2F]/80 hover:bg-[#F6DCE3]/40 hover:text-[#682D42]'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-[#B58A42]" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#F6DCE3] text-[#682D42] font-semibold shadow-2xs'
                  : 'text-[#352D2F]/80 hover:bg-[#F6DCE3]/40 hover:text-[#682D42]'
              }`}
            >
              <SettingsIcon className="w-4 h-4 text-[#B58A42]" />
              <span>Website Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Actions */}
        <div className="pt-6 border-t border-[#B58A42]/20 space-y-2">
          <button
            onClick={onNavigateWebsite}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#682D42] hover:text-[#B58A42] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Website</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-700 hover:text-red-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FFF8EE] border-b border-[#B58A42]/30">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={32} />
          <span className="font-serif text-base font-bold text-[#682D42]">
            Krishna Tracer Admin
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-[#682D42] hover:bg-[#F6DCE3]/50"
          aria-label="Toggle admin menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFF8EE] border-b border-[#B58A42]/30 p-4 space-y-2 shadow-md">
          <button
            onClick={() => {
              setActiveTab('products');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              activeTab === 'products' ? 'bg-[#F6DCE3] font-bold text-[#682D42]' : 'text-[#352D2F]'
            }`}
          >
            <Package className="w-4 h-4 text-[#B58A42]" />
            <span>Products</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('categories');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              activeTab === 'categories' ? 'bg-[#F6DCE3] font-bold text-[#682D42]' : 'text-[#352D2F]'
            }`}
          >
            <Tag className="w-4 h-4 text-[#B58A42]" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('orders');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              activeTab === 'orders' ? 'bg-[#F6DCE3] font-bold text-[#682D42]' : 'text-[#352D2F]'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-[#B58A42]" />
            <span>Orders</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              activeTab === 'settings' ? 'bg-[#F6DCE3] font-bold text-[#682D42]' : 'text-[#352D2F]'
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-[#B58A42]" />
            <span>Website Settings</span>
          </button>

          <div className="pt-2 border-t border-[#B58A42]/20 flex items-center justify-between text-xs">
            <button onClick={onNavigateWebsite} className="text-[#682D42] font-semibold hover:underline">
              View Website
            </button>
            <button onClick={onLogout} className="text-red-700 font-semibold hover:underline">
              Log out
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-[#FFF8EE] border-b border-[#B58A42]/20">
          <span className="font-serif text-lg font-bold text-[#682D42]">
            Store Admin
          </span>
          <div className="flex items-center gap-2 text-xs text-[#352D2F]/80">
            <div className="w-6 h-6 rounded-full bg-[#B58A42]/20 flex items-center justify-center text-[#682D42] font-bold">
              A
            </div>
            <span>Admin</span>
          </div>
        </div>

        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#682D42]">
                  Products
                </h1>
                <p className="text-xs sm:text-sm text-[#352D2F]/70 mt-0.5">
                  Manage your catalogue and homepage highlights.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsNewProduct(true);
                  setEditingProduct({
                    name: '',
                    categoryId: categories[0]?.id || '',
                    description: '',
                    price: null,
                    isVisible: true,
                    isHighlighted: false,
                    image: '/assets/images/prod_thali.jpg',
                    onlinePurchaseEnabled: false,
                    sellingUnit: 'piece',
                    minimumQuantity: 1,
                    quantityStep: 1,
                    stockQuantity: 0,
                    variants: [],
                    additionalImages: [],
                  });
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30] transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {productFeedback && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{productFeedback}</span>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#B58A42]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs text-[#352D2F] placeholder:text-[#352D2F]/50 focus:outline-none focus:ring-1 focus:ring-[#682D42]"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs text-[#352D2F] focus:outline-none focus:ring-1 focus:ring-[#682D42]"
              >
                <option value="All">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Products Table */}
            <div className="hidden md:block bg-[#FFF8EE] rounded-xl border border-[#B58A42]/30 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8EE] border-b border-[#B58A42]/30 text-[#682D42] font-serif font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Visibility</th>
                    <th className="py-3 px-4">Highlight</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B58A42]/15">
                  {filteredAdminProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    return (
                      <tr key={p.id} className="hover:bg-[#F6DCE3]/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt=""
                              className="w-10 h-10 rounded-md object-cover border border-[#B58A42]/30"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/images/prod_thali.jpg';
                              }}
                            />
                            <span className="font-serif font-bold text-sm text-[#682D42]">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#352D2F]/80">
                          {cat ? cat.name : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.isVisible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {/* Highlight toggle switch */}
                          <button
                            type="button"
                            onClick={async () => {
                              await onSaveProduct({ id: p.id, isHighlighted: !p.isHighlighted });
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              p.isHighlighted ? 'bg-[#682D42]' : 'bg-slate-300'
                            }`}
                            role="switch"
                            aria-checked={p.isHighlighted}
                            title="Toggle spotlight highlight"
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                p.isHighlighted ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <button
                              onClick={() => {
                                setIsNewProduct(false);
                                setEditingProduct(p);
                              }}
                              className="inline-flex items-center gap-1 text-[#682D42] hover:text-[#B58A42] font-semibold"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <span className="text-[#B58A42]/40">|</span>
                            <button
                              onClick={async () => {
                                if (confirm(`Delete product "${p.name}"?`)) {
                                  await onDeleteProduct(p.id);
                                  setProductFeedback(`Product "${p.name}" deleted.`);
                                  setTimeout(() => setProductFeedback(null), 3000);
                                }
                              }}
                              className="text-red-700 hover:text-red-900"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Product Cards matching reference */}
            <div className="md:hidden space-y-3">
              {filteredAdminProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                return (
                  <div
                    key={p.id}
                    className="bg-[#FFF8EE] rounded-xl border border-[#B58A42]/30 p-3.5 shadow-2xs flex gap-3"
                  >
                    <img
                      src={p.image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover border border-[#B58A42]/30 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/prod_thali.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-serif font-bold text-sm text-[#682D42] truncate">
                          {p.name}
                        </h3>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                            p.isVisible
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#352D2F]/70 truncate mt-0.5">
                        {cat ? cat.name : '—'}
                      </p>

                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#B58A42]/15">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#352D2F]/80">Highlight</span>
                          <button
                            type="button"
                            onClick={async () => {
                              await onSaveProduct({ id: p.id, isHighlighted: !p.isHighlighted });
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              p.isHighlighted ? 'bg-[#682D42]' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                p.isHighlighted ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setIsNewProduct(false);
                              setEditingProduct(p);
                            }}
                            className="text-[#682D42] font-semibold text-xs inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete product "${p.name}"?`)) {
                                await onDeleteProduct(p.id);
                              }
                            }}
                            className="text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-[#352D2F]/70 italic flex items-center gap-1.5 pt-1">
              <span>ⓘ Highlighted products appear in the homepage scrolling strip.</span>
            </p>

            {/* EDIT / ADD PRODUCT FORM */}
            {editingProduct && (
              <div className="mt-8 p-5 sm:p-7 rounded-2xl bg-[#F6DCE3]/40 border border-[#B58A42]/40 shadow-sm animate-in fade-in">
                <h2 className="font-serif text-xl font-bold text-[#682D42] mb-4">
                  {isNewProduct ? 'Add new product' : 'Edit product'}
                </h2>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingProduct.name?.trim()) {
                      alert('Product name is required');
                      return;
                    }
                    if (editingProduct.price == null || !Number.isFinite(editingProduct.price) || editingProduct.price <= 0) {
                      alert('Regular price must be greater than zero.');
                      return;
                    }
                    if (editingProduct.salePrice != null && (
                      !Number.isFinite(editingProduct.salePrice) ||
                      editingProduct.salePrice <= 0 ||
                      editingProduct.price == null ||
                      editingProduct.salePrice >= editingProduct.price
                    )) {
                      alert('Sale price must be greater than zero and lower than the regular price.');
                      return;
                    }
                    if (editingProduct.onlinePurchaseEnabled) {
                      const hasVariants = Boolean(editingProduct.variants?.length);
                      const validVariants = (editingProduct.variants || []).every((variant) =>
                        variant.label.trim() &&
                        Number(variant.price) > 0 &&
                        Number(variant.stockQuantity) >= 0 &&
                        (variant.salePrice == null || (variant.salePrice > 0 && variant.salePrice < variant.price))
                      );
                      if (
                        !editingProduct.sellingUnit?.trim() ||
                        !(Number(editingProduct.minimumQuantity) > 0) ||
                        !(Number(editingProduct.quantityStep) > 0) ||
                        !(Number(editingProduct.stockQuantity) >= 0) ||
                        (hasVariants ? !validVariants : !(Number(editingProduct.price) > 0))
                      ) {
                        alert('To enable online purchase, enter a selling unit, positive minimum and quantity step, stock, and a valid price for the product or each option.');
                        return;
                      }
                    }
                    setProductSaving(true);
                    const success = await onSaveProduct(editingProduct);
                    setProductSaving(false);
                    if (success) {
                      setProductFeedback(
                        isNewProduct ? 'New product created!' : 'Product updated successfully!'
                      );
                      setTimeout(() => setProductFeedback(null), 3000);
                      setEditingProduct(null);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Photo preview & upload */}
                    <div className="md:col-span-4 flex flex-col items-center">
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-[#B58A42]/40 relative shadow-2xs">
                        <img
                          src={editingProduct.image || '/assets/images/prod_thali.jpg'}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <input
                        type="file"
                        ref={productImageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, (url) => {
                              setEditingProduct((prev) => (prev ? { ...prev, image: url } : null));
                            });
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => productImageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                        <span>{uploadingImage ? 'Uploading...' : 'Change photo'}</span>
                      </button>
                      <input
                        type="file"
                        ref={productGalleryInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          void handleProductGalleryUpload(e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => productGalleryInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors disabled:opacity-50"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#B58A42]" />
                        <span>Add gallery images</span>
                      </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaPickerKey('__gallery__');
                                  setMediaPickerTarget('gallery');
                                }}
                                className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-[#B58A42]" />
                                <span>Choose from library</span>
                              </button>
                              {(editingProduct.additionalImages || []).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(editingProduct.additionalImages || []).map((image, index) => (
                                    <div key={`${image}-${index}`} className="relative">
                                      <img src={image} alt={`Additional product image ${index + 1}`} className="h-14 w-14 rounded-md border border-[#B58A42]/35 object-cover" />
                                      <div className="absolute -bottom-1 -left-1 flex gap-0.5">
                                        <button type="button" onClick={() => setEditingProduct((previous) => {
                                          if (!previous) return previous;
                                          const list = [...(previous.additionalImages || [])];
                                          if (index === 0) return previous;
                                          [list[index - 1], list[index]] = [list[index], list[index - 1]];
                                          return { ...previous, additionalImages: list };
                                        })} aria-label={`Move image ${index + 1} left`} className="rounded bg-[#682D42] px-1 text-[10px] text-white">‹</button>
                                        <button type="button" onClick={() => setEditingProduct((previous) => {
                                          if (!previous) return previous;
                                          const list = [...(previous.additionalImages || [])];
                                          if (index >= list.length - 1) return previous;
                                          [list[index], list[index + 1]] = [list[index + 1], list[index]];
                                          return { ...previous, additionalImages: list };
                                        })} aria-label={`Move image ${index + 1} right`} className="rounded bg-[#682D42] px-1 text-[10px] text-white">›</button>
                                      </div>
                                      <button
                                type="button"
                                onClick={() => setEditingProduct((previous) => previous ? {
                                  ...previous,
                                  additionalImages: (previous.additionalImages || []).filter((_, itemIndex) => itemIndex !== index),
                                } : previous)}
                                aria-label={`Remove additional image ${index + 1}`}
                                className="absolute -right-1 -top-1 rounded-full bg-[#682D42] px-1 text-xs text-white"
                              >×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="md:col-span-8 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Product name *
                          </label>
                          <input
                            type="text"
                            value={editingProduct.name || ''}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, name: e.target.value })
                            }
                            required
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                            placeholder="e.g. Wedding Thali"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Category *
                          </label>
                          <select
                            value={editingProduct.categoryId || categories[0]?.id || ''}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#682D42] mb-1">
                          Description *
                        </label>
                        <textarea
                          rows={2}
                          value={editingProduct.description || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, description: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          placeholder="Decorative thali for wedding ceremonies."
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-semibold text-[#682D42]">
                          Regular Price (₹)
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={editingProduct.price ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditingProduct({
                                ...editingProduct,
                                price: value === '' ? null : Number(value),
                              });
                            }}
                            className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#682D42]"
                            placeholder="Enter the saved regular price"
                          />
                        </label>
                        <label className="block text-xs font-semibold text-[#682D42]">
                          Sale Price (₹) <span className="font-normal text-[#352D2F]/65">optional</span>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={editingProduct.salePrice ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditingProduct({
                                ...editingProduct,
                                salePrice: value === '' ? null : Number(value),
                              });
                            }}
                            className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#682D42]"
                            placeholder="Leave empty for no discount"
                          />
                        </label>
                        {(() => {
                          const preview = getPriceDisplay(editingProduct.price, editingProduct.salePrice);
                          return (
                            <p className="sm:col-span-2 rounded-lg border border-[#B58A42]/25 bg-[#FFF8EE] px-3 py-2 text-xs">
                              <span className="font-semibold text-[#682D42]">Preview: </span>
                              {preview ? (
                                <>
                                  {preview.salePrice !== undefined && <span className="mr-2 text-[#352D2F]/60 line-through">{formatPrice(preview.regularPrice)}</span>}
                                  <span className="font-bold text-[#682D42]">{formatPrice(preview.sellingPrice)}</span>
                                  {preview.discountPercent > 0 && <span className="ml-2 rounded-full bg-[#F6DCE3] px-2 py-0.5 font-semibold text-[#682D42]">{preview.discountPercent}% OFF</span>}
                                </>
                              ) : <span className="text-[#352D2F]/65">Enter a regular price to preview pricing.</span>}
                            </p>
                          );
                        })()}
                      </div>

                      <div>
                        <p className="text-[11px] text-[#352D2F]/65">Set the regular price and optional sale price for the selected selling unit.</p>
                      </div>

                      <section className="rounded-xl border border-[#B58A42]/35 bg-[#FFF8EE]/80 p-4 space-y-3">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.onlinePurchaseEnabled)}
                            onChange={(e) => setEditingProduct({ ...editingProduct, onlinePurchaseEnabled: e.target.checked })}
                            className="mt-0.5 h-4 w-4 accent-[#682D42]"
                          />
                          <span>
                            <span className="block text-xs font-semibold text-[#682D42]">Enable online purchase</span>
                            <span className="mt-0.5 block text-[11px] text-[#352D2F]/70">Off for existing products until pricing and stock are configured.</span>
                          </span>
                        </label>
                        {editingProduct.onlinePurchaseEnabled && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <label className="text-xs font-semibold text-[#682D42]">Selling unit
                                <input value={editingProduct.sellingUnit || ''} onChange={(e) => setEditingProduct({ ...editingProduct, sellingUnit: e.target.value })} placeholder="piece, pair, set, metre" className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs" required />
                              </label>
                              <label className="text-xs font-semibold text-[#682D42]">Minimum quantity
                                <input type="number" min="0.001" step="any" value={editingProduct.minimumQuantity ?? 1} onChange={(e) => setEditingProduct({ ...editingProduct, minimumQuantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs" required />
                              </label>
                              <label className="text-xs font-semibold text-[#682D42]">Quantity increment
                                <input type="number" min="0.001" step="any" value={editingProduct.quantityStep ?? 1} onChange={(e) => setEditingProduct({ ...editingProduct, quantityStep: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs" required />
                              </label>
                              <label className="text-xs font-semibold text-[#682D42]">Stock quantity
                                <input type="number" min="0" step="any" value={editingProduct.stockQuantity ?? 0} onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs" required />
                              </label>
                              <label className="text-xs font-semibold text-[#682D42]">Tax rate (%) <span className="font-normal text-[#352D2F]/65">optional</span>
                                <input type="number" min="0" max="100" step="any" value={editingProduct.taxRatePercent ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, taxRatePercent: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs" />
                              </label>
                            </div>
                            <div className="border-t border-[#B58A42]/25 pt-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <h3 className="text-xs font-semibold text-[#682D42]">Product options (optional)</h3>
                                  <p className="mt-0.5 text-[11px] text-[#352D2F]/65">For products with configured colour, finish or size options.</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingProduct({
                                    ...editingProduct,
                                    variants: [...(editingProduct.variants || []), { id: crypto.randomUUID(), label: '', price: 0, stockQuantity: 0 }],
                                  })}
                                  className="min-h-9 rounded-lg border border-[#B58A42]/50 px-3 text-xs font-semibold text-[#682D42]"
                                >Add option</button>
                              </div>
                              <div className="mt-3 space-y-2">
                                {(editingProduct.variants || []).map((variant, index) => {
                                  const variantPricePreview = getPriceDisplay(variant.price, variant.salePrice);
                                  return (
                                  <div key={variant.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2 rounded-lg border border-[#B58A42]/25 bg-white/70 p-2">
                                    <label className="text-[11px] font-semibold text-[#682D42]">Option label
                                      <input value={variant.label} onChange={(e) => updateVariant(index, { label: e.target.value })} placeholder="Pink & Gold / Standard" className="mt-1 w-full rounded border border-[#B58A42]/40 px-2 py-2 text-xs" />
                                    </label>
                                    <label className="text-[11px] font-semibold text-[#682D42]">Price (₹)
                                      <input type="number" min="0.01" step="any" value={variant.price} onChange={(e) => updateVariant(index, { price: Number(e.target.value) })} className="mt-1 w-full rounded border border-[#B58A42]/40 px-2 py-2 text-xs" />
                                    </label>
                                    <label className="text-[11px] font-semibold text-[#682D42]">Sale price (₹)
                                      <input type="number" min="0.01" step="any" value={variant.salePrice ?? ''} onChange={(e) => updateVariant(index, { salePrice: e.target.value === '' ? null : Number(e.target.value) })} className="mt-1 w-full rounded border border-[#B58A42]/40 px-2 py-2 text-xs" />
                                    </label>
                                    <label className="text-[11px] font-semibold text-[#682D42]">Stock
                                      <input type="number" min="0" step="any" value={variant.stockQuantity} onChange={(e) => updateVariant(index, { stockQuantity: Number(e.target.value) })} className="mt-1 w-full rounded border border-[#B58A42]/40 px-2 py-2 text-xs" />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setEditingProduct({ ...editingProduct, variants: (editingProduct.variants || []).filter((_, itemIndex) => itemIndex !== index) })}
                                      className="self-end min-h-9 px-2 text-xs text-rose-700"
                                      aria-label={`Remove option ${index + 1}`}
                                    >Remove</button>
                                    <label className="text-[11px] font-semibold text-[#682D42] sm:col-span-3">Option image URL (optional)
                                      <input value={variant.image || ''} onChange={(e) => updateVariant(index, { image: e.target.value })} placeholder="/uploads/..." className="mt-1 w-full rounded border border-[#B58A42]/40 px-2 py-2 text-xs" />
                                    </label>
                                    <p className="sm:col-span-2 lg:col-span-4 text-[11px] text-[#352D2F]/75">
                                      Preview: {variantPricePreview
                                        ? `${formatPrice(variantPricePreview.sellingPrice)}${variantPricePreview.discountPercent ? ` · ${variantPricePreview.discountPercent}% OFF` : ''}`
                                        : 'Enter a valid regular price.'}
                                    </p>
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </section>

                      <div className="flex flex-wrap items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs font-semibold text-[#682D42]">Visible</span>
                          <input
                            type="checkbox"
                            checked={editingProduct.isVisible !== false}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                isVisible: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-[#682D42] rounded"
                          />
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs font-semibold text-[#682D42]">
                            Highlight on homepage
                          </span>
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.isHighlighted)}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                isHighlighted: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-[#682D42] rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#B58A42]/20">
                    <span className="text-[11px] text-[#352D2F]/70 italic flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp enquiries remain available. Online checkout uses Cashfree when configured.</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#352D2F] hover:bg-[#FFF8EE]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={productSaving}
                        className="px-5 py-2 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30] shadow-xs"
                      >
                        {productSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#682D42]">
                  Categories
                </h1>
                <p className="text-xs sm:text-sm text-[#352D2F]/70 mt-0.5">
                  Organise your collections and their display order.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsNewCategory(true);
                  setEditingCategory({
                    name: '',
                    image: '/assets/images/cat_wedding.jpg',
                    isVisible: true,
                    displayOrder: categories.length + 1,
                  });
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30] transition-colors shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            {categoryError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{categoryError}</span>
              </div>
            )}

            {categoryFeedback && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{categoryFeedback}</span>
              </div>
            )}

            {/* Search Categories */}
            <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#B58A42]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs text-[#352D2F] placeholder:text-[#352D2F]/50 focus:outline-none focus:ring-1 focus:ring-[#682D42]"
              />
            </div>

            {/* Desktop Categories Table */}
            <div className="hidden md:block bg-[#FFF8EE] rounded-xl border border-[#B58A42]/30 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8EE] border-b border-[#B58A42]/30 text-[#682D42] font-serif font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-28">Order</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Visibility</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B58A42]/15">
                  {filteredAdminCategories.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-[#F6DCE3]/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#682D42]">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleCategoryMove(idx, 'up')}
                              disabled={idx === 0}
                              className="p-0.5 rounded hover:bg-[#B58A42]/20 disabled:opacity-20 text-[#682D42]"
                              title="Move up"
                              aria-label="Move category up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCategoryMove(idx, 'down')}
                              disabled={idx === filteredAdminCategories.length - 1}
                              className="p-0.5 rounded hover:bg-[#B58A42]/20 disabled:opacity-20 text-[#682D42]"
                              title="Move down"
                              aria-label="Move category down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.image}
                            alt=""
                            className="w-10 h-10 rounded-md object-cover border border-[#B58A42]/30"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/images/cat_wedding.jpg';
                            }}
                          />
                          <span className="font-serif font-bold text-sm text-[#682D42]">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.isVisible
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setIsNewCategory(false);
                              setEditingCategory(c);
                            }}
                            className="inline-flex items-center gap-1 text-[#682D42] hover:text-[#B58A42] font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <span className="text-[#B58A42]/40">|</span>
                          <button
                            onClick={() => handleDeleteCategoryClick(c)}
                            className="text-red-700 hover:text-red-900"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Categories Cards */}
            <div className="md:hidden space-y-3">
              {filteredAdminCategories.map((c, idx) => (
                <div
                  key={c.id}
                  className="bg-[#FFF8EE] rounded-xl border border-[#B58A42]/30 p-3.5 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#682D42] w-4">
                      {idx + 1}
                    </span>
                    <img
                      src={c.image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover border border-[#B58A42]/30 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/cat_wedding.jpg';
                      }}
                    />
                    <div>
                      <h3 className="font-serif font-bold text-sm text-[#682D42]">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                            c.isVisible
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.isVisible ? 'Visible' : 'Hidden'}
                        </span>
                        <button
                          onClick={() => {
                            setIsNewCategory(false);
                            setEditingCategory(c);
                          }}
                          className="text-[#682D42] font-semibold text-xs inline-flex items-center gap-0.5"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleCategoryMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-[#FFF8EE] border border-[#B58A42]/40 text-[#682D42] disabled:opacity-20"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCategoryMove(idx, 'down')}
                      disabled={idx === filteredAdminCategories.length - 1}
                      className="p-1 rounded bg-[#FFF8EE] border border-[#B58A42]/40 text-[#682D42] disabled:opacity-20"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* EDIT / ADD CATEGORY FORM */}
            {editingCategory && (
              <div className="mt-8 p-5 sm:p-7 rounded-2xl bg-[#F6DCE3]/40 border border-[#B58A42]/40 shadow-sm animate-in fade-in">
                <h2 className="font-serif text-xl font-bold text-[#682D42] mb-4">
                  {isNewCategory ? 'Add new category' : 'Edit category'}
                </h2>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editingCategory.name?.trim()) {
                      alert('Category name is required');
                      return;
                    }
                    setCategorySaving(true);
                    const success = await onSaveCategory(editingCategory);
                    setCategorySaving(false);
                    if (success) {
                      setCategoryFeedback(
                        isNewCategory ? 'Category added!' : 'Category updated!'
                      );
                      setTimeout(() => setCategoryFeedback(null), 3000);
                      setEditingCategory(null);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Category Image */}
                    <div className="md:col-span-4 flex flex-col items-center">
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-[#B58A42]/40 relative shadow-2xs">
                        <img
                          src={editingCategory.image || '/assets/images/cat_wedding.jpg'}
                          alt="Category"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <input
                        type="file"
                        ref={categoryImageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, (url) => {
                              setEditingCategory((prev) => (prev ? { ...prev, image: url } : null));
                            });
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => categoryImageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                        <span>{uploadingImage ? 'Uploading...' : 'Change image'}</span>
                      </button>
                    </div>

                    {/* Inputs */}
                    <div className="md:col-span-8 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#682D42] mb-1">
                          Category name *
                        </label>
                        <input
                          type="text"
                          value={editingCategory.name || ''}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, name: e.target.value })
                          }
                          required
                          className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          placeholder="e.g. Wedding Essentials"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#682D42] mb-1">
                          Display order *
                        </label>
                        <input
                          type="number"
                          value={editingCategory.displayOrder || 1}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              displayOrder: Number(e.target.value),
                            })
                          }
                          required
                          className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                        />
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs font-semibold text-[#682D42]">
                            Visible on website
                          </span>
                          <input
                            type="checkbox"
                            checked={editingCategory.isVisible !== false}
                            onChange={(e) =>
                              setEditingCategory({
                                ...editingCategory,
                                isVisible: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-[#682D42] rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#B58A42]/20">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-4 py-2 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#352D2F]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categorySaving}
                      className="px-5 py-2 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30] shadow-xs"
                    >
                      {categorySaving ? 'Saving...' : 'Save Category'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WEBSITE SETTINGS */}
        {activeTab === 'orders' && <AdminOrders />}

        {activeTab === 'settings' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
            {/* Header */}
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#682D42]">
                Website Settings
              </h1>
              <p className="text-xs sm:text-sm text-[#352D2F]/70 mt-0.5">
                Update your homepage and store contact details.
              </p>
            </div>

            {settingsFeedback && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{settingsFeedback}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  localSettings.instagramUrl &&
                  (!localSettings.instagramUrl.trim().startsWith('https://') ||
                    !localSettings.instagramUrl.includes('instagram.com'))
                ) {
                  alert('Please enter a valid HTTPS Instagram profile URL (e.g. https://www.instagram.com/krishnatracer)');
                  return;
                }
                setSettingsSaving(true);
                const ok = await onSaveSettings(localSettings);
                setSettingsSaving(false);
                if (ok) {
                  setSettingsFeedback('Website settings saved successfully!');
                  setTimeout(() => setSettingsFeedback(null), 3000);
                }
              }}
              className="space-y-6"
            >
              {/* Hidden file upload inputs */}
              <input
                type="file"
                ref={heroImageInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, (url) => {
                      setLocalSettings((prev) => ({ ...prev, heroImage: url }));
                    });
                  }
                }}
              />
              <input
                type="file"
                ref={storyImageInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, (url) => {
                      setLocalSettings((prev) => ({ ...prev, storyImage: url }));
                    });
                  }
                }}
              />
              <input
                type="file"
                ref={storyVideoInputRef}
                accept="video/mp4,video/webm,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, (url) => {
                      setLocalSettings((prev) => ({ ...prev, storyVideo: url }));
                    });
                  }
                }}
              />
              <input
                type="file"
                ref={storyHeroVideoInputRef}
                accept="video/mp4,video/webm,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, (url) => {
                      setLocalSettings((prev) => ({ ...prev, storyPageHeroVideo: url }));
                    });
                  }
                }}
              />
              <input
                type="file"
                ref={shopPhotoInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file, (url) => {
                      setLocalSettings((prev) => ({ ...prev, visitShopPhoto: url }));
                    });
                  }
                }}
              />
              <input
                type="file"
                ref={videoPosterInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && activeVideoEditIndex !== null) {
                    handleFileUpload(file, (url) => {
                      handleUpdateVideoItem(activeVideoEditIndex, { posterImage: url });
                    });
                  }
                }}
              />
              <input
                type="file"
                ref={videoFileInputRef}
                accept="video/mp4,video/webm,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && activeVideoEditIndex !== null) {
                    handleFileUpload(file, (url) => {
                      handleUpdateVideoItem(activeVideoEditIndex, { videoUrl: url });
                    });
                  }
                }}
              />

              <input
                type="file"
                ref={siteImageInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && siteImageKey) {
                    handleFileUpload(file, (url) => {
                      setLocalSettings((prev) => ({ ...prev, [siteImageKey]: url }));
                    });
                  }
                }}
              />

              <div className="space-y-6">
                {/* 1. HOMEPAGE HERO PANEL */}
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('hero')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">
                          Homepage Hero
                        </h2>
                        <p className="text-[11px] text-[#352D2F]/70">
                          Main continuous hero banner, headline, and supporting statement
                        </p>
                      </div>
                    </div>
                    {expandedSections.hero ? (
                      <ChevronUp className="w-5 h-5 text-[#682D42]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#682D42]" />
                    )}
                  </button>

                  {expandedSections.hero && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 space-y-4 bg-white/40">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#682D42]">
                            Hero photograph
                          </label>
                          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-[#B58A42]/40 relative shadow-inner">
                            <img
                              src={localSettings.heroImage}
                              alt="Hero Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => heroImageInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                            <span>{uploadingImage ? 'Uploading...' : 'Change hero image'}</span>
                          </button>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#682D42] mb-1">
                              Headline *
                            </label>
                            <input
                              type="text"
                              value={localSettings.heroHeadline}
                              onChange={(e) =>
                                setLocalSettings({ ...localSettings, heroHeadline: e.target.value })
                              }
                              required
                              className="w-full px-3.5 py-2.5 rounded-lg border border-[#B58A42]/40 bg-white text-xs sm:text-sm focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#682D42] mb-1">
                              Supporting text *
                            </label>
                            <textarea
                              rows={3}
                              value={localSettings.heroSupportingText}
                              onChange={(e) =>
                                setLocalSettings({
                                  ...localSettings,
                                  heroSupportingText: e.target.value,
                                })
                              }
                              required
                              className="w-full px-3.5 py-2.5 rounded-lg border border-[#B58A42]/40 bg-white text-xs sm:text-sm focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                            />
                          </div>
                          <p className="text-[11px] text-[#352D2F]/65 italic">
                            ⓘ The hero is rendered as a single continuous full-width composition with a delicate cream fade into the photo.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. PRODUCT VIDEOS PANEL */}
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('videos')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">
                            A Closer Look — Product Videos
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              localSettings.showVideosSection !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {localSettings.showVideosSection !== false ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#352D2F]/70">
                          Portrait video showcases with native modal player (up to 4 items)
                        </p>
                      </div>
                    </div>
                    {expandedSections.videos ? (
                      <ChevronUp className="w-5 h-5 text-[#682D42]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#682D42]" />
                    )}
                  </button>

                  {expandedSections.videos && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 space-y-5 bg-white/40">
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#B58A42]/20">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[#682D42] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localSettings.showVideosSection !== false}
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                showVideosSection: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 text-[#682D42] rounded accent-[#682D42]"
                          />
                          <span>Show Product Videos section on homepage</span>
                        </label>

                        {(localSettings.productVideos || []).length < 4 && (
                          <button
                            type="button"
                            onClick={handleAddVideoItem}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Video Item ({ (localSettings.productVideos || []).length }/4)</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Section Heading
                          </label>
                          <input
                            type="text"
                            value={localSettings.videosHeading || 'A closer look'}
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                videosHeading: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Section Subtitle
                          </label>
                          <input
                            type="text"
                            value={localSettings.videosSubtitle || 'The details make all the difference.'}
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                videosSubtitle: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                          />
                        </div>
                      </div>

                      {/* Video Cards List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 w-full min-w-0">
                        {(localSettings.productVideos || []).map((vid, idx) => (
                          <div
                            key={vid.id || idx}
                            className="p-4 rounded-xl border border-[#B58A42]/35 bg-[#FFF8EE] space-y-3.5 shadow-xs w-full max-w-full box-border min-w-0"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B58A42]/20 pb-2.5 min-w-0">
                              <span className="text-xs font-bold text-[#682D42] flex items-center gap-1.5 shrink-0">
                                <Film className="w-3.5 h-3.5 text-[#B58A42]" />
                                Video #{idx + 1}
                              </span>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <label className="flex items-center gap-1.5 text-[11px] text-[#352D2F]/80 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={vid.isVisible}
                                    onChange={(e) =>
                                      handleUpdateVideoItem(idx, { isVisible: e.target.checked })
                                    }
                                    className="accent-[#682D42] w-3.5 h-3.5"
                                  />
                                  <span>{vid.isVisible ? 'Visible' : 'Hidden'}</span>
                                </label>

                                {(localSettings.productVideos || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVideoItem(idx)}
                                    className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete video"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              </div>

                            {/* Stack poster above form fields on narrow mobile, side-by-side on sm+ */}
                            <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start w-full max-w-full min-w-0 box-border">
                              {/* Poster Area */}
                              <div className="flex items-center sm:items-start gap-3 w-full sm:w-auto shrink-0 min-w-0">
                                <div className="w-20 aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 border border-[#B58A42]/40 shrink-0 relative group">
                                  <img
                                    src={vid.posterImage}
                                    alt={vid.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveVideoEditIndex(idx);
                                      videoPosterInputRef.current?.click();
                                    }}
                                    className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-medium"
                                  >
                                    <Upload className="w-3.5 h-3.5 mb-0.5" />
                                    Poster
                                  </button>
                                </div>

                                {/* Poster control buttons on mobile */}
                                <div className="flex flex-col gap-1.5 sm:hidden min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveVideoEditIndex(idx);
                                      videoPosterInputRef.current?.click();
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#B58A42]/50 bg-white text-xs font-medium text-[#682D42] hover:bg-[#FFF8EE]"
                                  >
                                    <Upload className="w-3 h-3 text-[#B58A42]" />
                                    <span>Change poster</span>
                                  </button>
                                  <span className="text-[11px] text-[#352D2F]/65 font-medium">
                                    Order: #{vid.displayOrder}
                                  </span>
                                </div>
                              </div>

                              {/* Form Fields: full width, no overflow */}
                              <div className="flex-1 w-full max-w-full min-w-0 space-y-2.5 text-xs box-border">
                                <div className="w-full min-w-0">
                                  <label className="block text-[11px] font-semibold text-[#682D42] mb-1">
                                    Title *
                                  </label>
                                  <input
                                    type="text"
                                    value={vid.title}
                                    onChange={(e) =>
                                      handleUpdateVideoItem(idx, { title: e.target.value })
                                    }
                                    required
                                    className="w-full max-w-full box-border px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs text-[#352D2F] focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                                    placeholder="e.g. Lace detailing"
                                  />
                                </div>

                                <div className="w-full min-w-0 space-y-1.5">
                                  <label className="block text-[11px] font-semibold text-[#682D42] mb-0.5">
                                    Video file / URL
                                  </label>
                                  <input
                                    type="text"
                                    value={vid.videoUrl}
                                    onChange={(e) =>
                                      handleUpdateVideoItem(idx, { videoUrl: e.target.value })
                                    }
                                    className="w-full max-w-full box-border px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs text-[#352D2F] focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                                    placeholder="e.g. /assets/videos/lace_detailing.mp4"
                                  />
                                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 w-full min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveVideoEditIndex(idx);
                                        videoFileInputRef.current?.click();
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#F6DCE3]/40 transition-colors shadow-2xs shrink-0"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                                      <span>Upload MP4 / WebM</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveVideoEditIndex(idx);
                                        videoPosterInputRef.current?.click();
                                      }}
                                      className="hidden sm:inline-block text-[11px] text-[#B58A42] hover:underline"
                                    >
                                      Change poster image
                                    </button>

                                    <span className="hidden sm:inline-block text-[11px] text-[#352D2F]/65 font-medium ml-auto">
                                      Order: #{vid.displayOrder}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. SHORT BRAND STORY PANEL */}
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('story')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">
                            Since 1955, in Tilak Nagar — Short Story
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              localSettings.showStorySection !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {localSettings.showStorySection !== false ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#352D2F]/70">
                          Editorial heritage feature with shop detail photograph and link to Our Story
                        </p>
                      </div>
                    </div>
                    {expandedSections.story ? (
                      <ChevronUp className="w-5 h-5 text-[#682D42]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#682D42]" />
                    )}
                  </button>

                  {expandedSections.story && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 space-y-4 bg-white/40">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#682D42] cursor-pointer pb-2 border-b border-[#B58A42]/20">
                        <input
                          type="checkbox"
                          checked={localSettings.showStorySection !== false}
                          onChange={(e) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              showStorySection: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-[#682D42] rounded accent-[#682D42]"
                        />
                        <span>Show Short Story section on homepage</span>
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#682D42]">
                            Story image
                          </label>
                          <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-white border border-[#B58A42]/40 relative shadow-inner">
                            {localSettings.storyVideo ? (
                              <video src={localSettings.storyVideo} muted className="w-full h-full object-cover" />
                            ) : (
                              <img
                                src={localSettings.storyImage || '/assets/images/story_shop_detail.jpg'}
                                alt="Story Preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => storyImageInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE]"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                              <span>{uploadingImage ? 'Uploading...' : 'Change story image'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => storyVideoInputRef.current?.click()}
                              disabled={uploadingImage}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE]"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                              <span>{uploadingImage ? 'Uploading...' : localSettings.storyVideo ? 'Replace video' : 'Add video'}</span>
                            </button>
                            {localSettings.storyVideo && (
                              <button
                                type="button"
                                onClick={() => setLocalSettings((prev) => ({ ...prev, storyVideo: '' }))}
                                className="px-3.5 py-1.5 rounded-lg text-xs text-[#352D2F]/70 underline underline-offset-2 hover:text-[#682D42]"
                              >
                                Remove video
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#352D2F]/60">
                            ⓘ MP4 or WebM up to 25 MB. When a video is added it plays in this frame on the homepage, using the story image as its cover.
                          </p>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#682D42] mb-1">
                              Headline *
                            </label>
                            <input
                              type="text"
                              value={localSettings.storyHeading || 'Since 1955, in Tilak Nagar.'}
                              onChange={(e) =>
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  storyHeading: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#682D42] mb-1">
                              Description *
                            </label>
                            <textarea
                              rows={4}
                              value={
                                localSettings.storyDescription ||
                                'Wedding traditions, festive moments and the little details that make them special.\n\nFrom ceremonial thalis and divine shringaar to intricate laces and borders, we bring together generations of festive craft in Tilak Nagar.'
                              }
                              onChange={(e) =>
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  storyDescription: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. PHOTO ENQUIRY PANEL */}
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('photoEnquiry')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">
                        4
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">
                            Looking for Something Specific? — Photo Enquiry
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              localSettings.showPhotoEnquirySection !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {localSettings.showPhotoEnquirySection !== false ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#352D2F]/70">
                          Baby pink callout band allowing customers to send a sample photo on WhatsApp
                        </p>
                      </div>
                    </div>
                    {expandedSections.photoEnquiry ? (
                      <ChevronUp className="w-5 h-5 text-[#682D42]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#682D42]" />
                    )}
                  </button>

                  {expandedSections.photoEnquiry && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 space-y-4 bg-white/40">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#682D42] cursor-pointer pb-2 border-b border-[#B58A42]/20">
                        <input
                          type="checkbox"
                          checked={localSettings.showPhotoEnquirySection !== false}
                          onChange={(e) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              showPhotoEnquirySection: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-[#682D42] rounded accent-[#682D42]"
                        />
                        <span>Show WhatsApp Photo Enquiry banner on homepage</span>
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Heading *
                          </label>
                          <input
                            type="text"
                            value={localSettings.photoEnquiryHeading || 'Looking for something specific?'}
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                photoEnquiryHeading: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Button Label *
                          </label>
                          <input
                            type="text"
                            value={localSettings.photoEnquiryButtonText || 'Send a Photo on WhatsApp'}
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                photoEnquiryButtonText: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Supporting text *
                          </label>
                          <input
                            type="text"
                            value={
                              localSettings.photoEnquiryText ||
                              'Send us a photo of the design or product on WhatsApp. Ask us about availability.'
                            }
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                photoEnquiryText: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. VISIT KRISHNA TRACER PANEL */}
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('visit')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">
                        5
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">
                            Visit Krishna Tracer Section
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              localSettings.showVisitSection !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {localSettings.showVisitSection !== false ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#352D2F]/70">
                          Physical store showcase with directions, store hours, and optional shop photo
                        </p>
                      </div>
                    </div>
                    {expandedSections.visit ? (
                      <ChevronUp className="w-5 h-5 text-[#682D42]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#682D42]" />
                    )}
                  </button>

                  {expandedSections.visit && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 space-y-4 bg-white/40">
                      <label className="flex items-center gap-2 text-xs font-semibold text-[#682D42] cursor-pointer pb-2 border-b border-[#B58A42]/20">
                        <input
                          type="checkbox"
                          checked={localSettings.showVisitSection !== false}
                          onChange={(e) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              showVisitSection: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-[#682D42] rounded accent-[#682D42]"
                        />
                        <span>Show Visit section on homepage</span>
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Shop Photo Area */}
                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1.5">
                            Shop photograph (Optional)
                          </label>

                          {localSettings.visitShopPhoto ? (
                            <div className="space-y-2">
                              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-white border border-[#B58A42]/40 relative">
                                <img
                                  src={localSettings.visitShopPhoto}
                                  alt="Shop Front"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => shopPhotoInputRef.current?.click()}
                                  className="px-3 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE]"
                                >
                                  Change photo
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLocalSettings((prev) => ({ ...prev, visitShopPhoto: '' }))
                                  }
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Remove photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Visual dashed placeholder as shown in admin reference */
                            <div className="border-2 border-dashed border-[#B58A42]/50 rounded-xl p-6 bg-[#FFF8EE] flex flex-col items-center justify-center text-center space-y-2">
                              <div className="w-10 h-10 rounded-full bg-[#F6DCE3] text-[#682D42] flex items-center justify-center">
                                <Camera className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-semibold text-[#682D42]">
                                Your shop photo
                              </span>
                              <p className="text-[11px] text-[#352D2F]/65 max-w-xs">
                                Upload an actual photo of Krishna Tracer in Tilak Nagar, or leave blank to show a clean typography layout on the website.
                              </p>
                              <button
                                type="button"
                                onClick={() => shopPhotoInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30]"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Shop Photo</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Text Fields */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#682D42] mb-1">
                              Section Heading
                            </label>
                            <input
                              type="text"
                              value={localSettings.visitHeading || 'Visit Krishna Tracer'}
                              onChange={(e) =>
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  visitHeading: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#682D42] mb-1">
                              Google Maps Directions URL
                            </label>
                            <input
                              type="text"
                              value={
                                localSettings.visitDirectionsUrl ||
                                'https://maps.google.com/?q=Krishna+Tracer+Tilak+Nagar+New+Delhi'
                              }
                              onChange={(e) =>
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  visitDirectionsUrl: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42]"
                            />
                          </div>

                          <div className="p-3 rounded-lg bg-[#FFF8EE] border border-[#B58A42]/30 text-[11px] text-[#352D2F]/75 space-y-1">
                            <span className="font-semibold text-[#682D42] block">Live Website Behaviour:</span>
                            <p>
                              If no shop photo is uploaded, the public homepage renders a neat, centered text presentation with Tilak Nagar address, hours, directions link, and direct WhatsApp chat.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. STORE CONTACT & SOCIAL PANEL */}
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('contact')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">
                        6
                      </div>
                      <div>
                        <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">
                          Store Contact, Hours & Social
                        </h2>
                        <p className="text-[11px] text-[#352D2F]/70">
                          WhatsApp order numbers, phone numbers, physical address, timings, and Instagram
                        </p>
                      </div>
                    </div>
                    {expandedSections.contact ? (
                      <ChevronUp className="w-5 h-5 text-[#682D42]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#682D42]" />
                    )}
                  </button>

                  {expandedSections.contact && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 space-y-4 bg-white/40">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            WhatsApp order number *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              value={localSettings.whatsappNumber}
                              onChange={(e) =>
                                setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })
                              }
                              required
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                              placeholder="+91 98912 99770"
                            />
                          </div>
                          <span className="text-[10px] text-[#352D2F]/65 block mt-1 italic">
                            ⓘ All product enquiries and photo requests route to this WhatsApp number.
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Instagram URL *
                          </label>
                          <input
                            type="url"
                            value={localSettings.instagramUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLocalSettings({
                                ...localSettings,
                                instagramUrl: val,
                              });
                            }}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                            placeholder="https://www.instagram.com/krishnatracer"
                          />
                          {/* Live validation feedback */}
                          {localSettings.instagramUrl && localSettings.instagramUrl.trim().length > 0 ? (
                            localSettings.instagramUrl.trim().startsWith('https://') &&
                            localSettings.instagramUrl.includes('instagram.com') ? (
                              <span className="text-[10px] text-emerald-700 flex items-center gap-1 mt-1 font-medium">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                Valid HTTPS Instagram profile URL (destination for footer button “Krishna Tracer”)
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                Must be a valid HTTPS URL on instagram.com (e.g. https://www.instagram.com/krishnatracer)
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-[#352D2F]/65 block mt-1 italic">
                              ⓘ The footer displays the label “Krishna Tracer” linking to this destination.
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Primary call number *
                          </label>
                          <input
                            type="text"
                            value={localSettings.primaryCallNumber}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                primaryCallNumber: e.target.value,
                              })
                            }
                            required
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Secondary call number
                          </label>
                          <input
                            type="text"
                            value={localSettings.secondaryCallNumber}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                secondaryCallNumber: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Address *
                          </label>
                          <textarea
                            rows={3}
                            value={localSettings.address}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, address: e.target.value })
                            }
                            required
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="privacy-policy-content" className="block text-xs font-semibold text-[#682D42] mb-1">
                            Privacy Policy content
                          </label>
                          <textarea
                            id="privacy-policy-content"
                            rows={12}
                            value={localSettings.privacyPolicy || ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, privacyPolicy: e.target.value })}
                            className="w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs leading-relaxed focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                            aria-describedby="privacy-policy-content-help"
                          />
                          <p id="privacy-policy-content-help" className="mt-1 text-[10px] text-[#352D2F]/65">
                            Edit the public policy text here. Use “## ” at the start of a line for a section heading and a blank line between sections.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Timings *
                          </label>
                          <input
                            type="text"
                            value={localSettings.timings}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, timings: e.target.value })
                            }
                            required
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#682D42] mb-1">
                            Closed on *
                          </label>
                          <select
                            value={localSettings.closedDay}
                            onChange={(e) =>
                              setLocalSettings({ ...localSettings, closedDay: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#B58A42]/40 bg-white text-xs focus:ring-1 focus:ring-[#682D42] focus:outline-none"
                          >
                            <option value="Wednesday">Wednesday</option>
                            <option value="Sunday">Sunday</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="None">None (Open 7 Days)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('shipping')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">7</div>
                      <div>
                        <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">Delivery &amp; Payments</h2>
                        <p className="text-[11px] text-[#352D2F]/70">Delivery PIN codes, shipping charges, and Cashfree configuration status</p>
                      </div>
                    </div>
                    {expandedSections.shipping ? <ChevronUp className="w-5 h-5 text-[#682D42]" /> : <ChevronDown className="w-5 h-5 text-[#682D42]" />}
                  </button>
                  {expandedSections.shipping && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 space-y-4 bg-white/40">
                      <div className={`rounded-lg border p-3 text-xs ${paymentConfigStatus?.paymentReady ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
                        <p className="font-semibold">
                          {paymentConfigStatus
                            ? `${paymentConfigStatus.provider} · ${paymentConfigStatus.mode === 'production' ? 'Live mode' : 'Test mode'} · ${paymentConfigStatus.paymentReady ? 'Configured' : 'Not ready'}`
                            : 'Payment configuration status unavailable'}
                        </p>
                        <p className="mt-1">Gateway credentials and live-mode approval must be set as server environment variables. Secret keys are not stored in website settings or sent to browsers.</p>
                        {paymentConfigStatus?.mode === 'production' && <p className="mt-1 font-semibold">Production mode is separately gated by CASHFREE_LIVE_ENABLED and CASHFREE_LIVE_CHECKLIST_COMPLETED.</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-xs font-semibold text-[#682D42]">Delivery charge (₹)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={localSettings.shippingCharge ?? ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, shippingCharge: e.target.value === '' ? undefined : Number(e.target.value) })}
                            placeholder="Enter delivery charge (e.g. 50, or 0 for free)"
                            className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs"
                          />
                        </label>
                        <label className="text-xs font-semibold text-[#682D42]">Free delivery from (₹, optional)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={localSettings.freeShippingThreshold ?? ''}
                            onChange={(e) => setLocalSettings({ ...localSettings, freeShippingThreshold: e.target.value === '' ? null : Number(e.target.value) })}
                            className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs"
                          />
                        </label>
                        <label className="text-xs font-semibold text-[#682D42] md:col-span-2">Shipping policy
                          <textarea rows={2} value={localSettings.shippingPolicy || ''} onChange={(e) => setLocalSettings({ ...localSettings, shippingPolicy: e.target.value })} className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs" placeholder="Public delivery timing and shipping information" />
                        </label>
                        <label className="text-xs font-semibold text-[#682D42] md:col-span-2">Returns policy
                          <textarea rows={2} value={localSettings.returnsPolicy || ''} onChange={(e) => setLocalSettings({ ...localSettings, returnsPolicy: e.target.value })} className="mt-1 w-full rounded-lg border border-[#B58A42]/40 bg-white px-3 py-2 text-xs" placeholder="Public returns and exchange terms" />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. SITE IMAGES PANEL */}
                <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection('siteImages')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#F6DCE3]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center font-bold text-xs">8</div>
                      <div>
                        <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">Site Images</h2>
                        <p className="text-[11px] text-[#352D2F]/70">Logo and page photographs shown across the website</p>
                      </div>
                    </div>
                    {expandedSections.siteImages ? <ChevronUp className="w-5 h-5 text-[#682D42]" /> : <ChevronDown className="w-5 h-5 text-[#682D42]" />}
                  </button>
                  {expandedSections.siteImages && (
                    <div className="p-5 sm:p-6 border-t border-[#B58A42]/20 bg-white/40">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {([
                          { key: 'logoImage', label: 'Logo emblem (navbar & footer)', accept: 'image/*' },
                          { key: 'faviconImage', label: 'Favicon / app icon', accept: 'image/*' },
                          { key: 'ogImage', label: 'Social share image (og:image)', accept: 'image/*' },
                          { key: 'hangingLanternImage', label: 'Hanging decoration (SVG)', accept: 'image/*' },
                          { key: 'collectionsHeroImage', label: 'Store page banner', accept: 'image/*' },
                          { key: 'storyPageHeroImage', label: 'Our Story main photo', videoKey: 'storyPageHeroVideo', accept: 'image/*' },
                          { key: 'storyCelebrationsImage', label: 'Celebrations photo (home guide + Our Story)', accept: 'image/*' },
                          { key: 'storyDevotionImage', label: 'Devotion photo (Our Story)', accept: 'image/*' },
                          { key: 'storyCreativityImage', label: 'Creativity photo (Our Story)', accept: 'image/*' },
                          { key: 'visitUsImage', label: 'Visit Us photo', accept: 'image/*' },
                        ] as Array<{ key: keyof WebsiteSettings; label: string; videoKey?: keyof WebsiteSettings; accept?: string }>).map((entry) => {
                          const videoVal = entry.videoKey ? String(localSettings[entry.videoKey] || '') : '';
                          return (
                          <div key={entry.key} className="space-y-2">
                            <label className="block text-xs font-semibold text-[#682D42]">{entry.label}</label>
                            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white border border-[#B58A42]/40">
                              {videoVal ? (
                                <video src={videoVal} muted className="w-full h-full object-cover" />
                              ) : (
                                <img src={String(localSettings[entry.key] || '')} alt={entry.label} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSiteImageKey(entry.key);
                                  siteImageInputRef.current?.click();
                                }}
                                disabled={uploadingImage}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                                <span>{uploadingImage ? 'Uploading...' : 'Change image'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaPickerKey(entry.key);
                                  setMediaPickerTarget('settings');
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-[#B58A42]" />
                                <span>From library</span>
                              </button>
                              {String(localSettings[entry.key] || '') && (
                                <button
                                  type="button"
                                  onClick={() => setLocalSettings((prev) => ({ ...prev, [entry.key]: '' }))}
                                  className="px-2 py-1.5 text-xs text-[#352D2F]/70 underline underline-offset-2 hover:text-[#682D42]"
                                >
                                  Clear
                                </button>
                              )}
                              {entry.videoKey && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => storyHeroVideoInputRef.current?.click()}
                                    disabled={uploadingImage}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42] hover:bg-[#FFF8EE] transition-colors"
                                  >
                                    <Upload className="w-3.5 h-3.5 text-[#B58A42]" />
                                    <span>{uploadingImage ? 'Uploading...' : videoVal ? 'Replace video' : 'Add video'}</span>
                                  </button>
                                  {videoVal && (
                                    <button
                                      type="button"
                                      onClick={() => setLocalSettings((prev) => ({ ...prev, [entry.videoKey as string]: '' }))}
                                      className="px-2 py-1.5 text-xs text-[#352D2F]/70 underline underline-offset-2 hover:text-[#682D42]"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            {entry.videoKey && (
                              <p className="text-[11px] text-[#352D2F]/60">MP4/WebM up to 25 MB. When set, the video plays here with the image as its cover.</p>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Media Library */}
              <div className="rounded-2xl bg-[#F6DCE3]/30 border border-[#B58A42]/40 shadow-xs overflow-hidden">
                <div className="w-full px-5 py-4 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#682D42] text-[#FFF8EE] flex items-center justify-center"><ImageIcon className="w-4 h-4" /></div>
                    <div>
                      <h2 className="font-serif text-base sm:text-lg font-bold text-[#682D42]">Media Library</h2>
                      <p className="text-[11px] text-[#352D2F]/70">Uploaded images and videos. Select one to use it, or delete unused files.</p>
                    </div>
                  </div>
                  <button type="button" onClick={loadMediaLibrary} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#682D42]">
                    <Sparkles className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
                <div className="px-5 pb-5">
                  <p className="text-[11px] text-[#352D2F]/70 mb-3">
                    Supported: JPEG, PNG, WEBP, GIF, SVG, MP4, WebM · Max 25 MB per file · Stored permanently in Supabase Storage
                  </p>
                  {mediaError && <p role="alert" className="mb-3 rounded-lg bg-[#682D42]/10 px-3 py-2 text-xs text-[#682D42]">{mediaError}</p>}
                  {uploadProgress !== null && (
                    <div className="mb-3">
                      <div className="h-1.5 w-full rounded-full bg-[#F6DCE3] overflow-hidden">
                        <div className="h-full bg-[#682D42] transition-all" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-[#352D2F]/70">Uploading… {uploadProgress}%</p>
                    </div>
                  )}
                  {mediaLibrary.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#B58A42]/40 p-6 text-center text-xs text-[#352D2F]/70">
                      No uploads yet. Use “Change image” or “Upload” on any section to add media here.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {mediaLibrary.map((item) => {
                        const isVideo = /\.(mp4|webm)$/i.test(item.name);
                        return (
                          <div key={item.name} className="rounded-xl border border-[#B58A42]/40 bg-white p-2 space-y-2">
                            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#F6DCE3]/40 flex items-center justify-center">
                              {isVideo ? <Video className="w-8 h-8 text-[#682D42]" /> : <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />}
                            </div>
                            <p className="truncate text-[10px] text-[#352D2F]/80" title={item.name}>{item.name}</p>
                            <div className="flex gap-1.5">
                              <button type="button" onClick={() => {
                                if (mediaPickerTarget === 'gallery') {
                                  setEditingProduct((prev) => prev ? { ...prev, additionalImages: [...(prev.additionalImages || []), item.url] } : prev);
                                  setMediaPickerTarget(null);
                                } else if (mediaPickerKey) {
                                  setLocalSettings((prev) => ({ ...prev, [mediaPickerKey]: item.url }));
                                  setMediaPickerKey(null);
                                } else {
                                  navigator.clipboard?.writeText(item.url);
                                }
                              }} className="flex-1 px-2 py-1 rounded bg-[#682D42] text-white text-[10px] font-semibold">
                                {mediaPickerKey || mediaPickerTarget ? 'Use' : 'Copy URL'}
                              </button>
                              <button type="button" onClick={async () => {
                                if (!window.confirm('Delete this file? Files still in use cannot be deleted.')) return;
                                const res = await fetch(`/api/admin/media/${encodeURIComponent(item.name)}`, { method: 'DELETE' });
                                const data = await res.json().catch(() => ({}));
                                if (!res.ok) { setMediaError(data.error || 'Delete failed'); return; }
                                await loadMediaLibrary();
                              }} className="px-2 py-1 rounded border border-red-300 text-red-700 text-[10px] font-semibold">Delete</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(mediaPickerKey || mediaPickerTarget) && (
                    <p className="mt-3 text-xs text-[#682D42]">
                      Select a file above for {mediaPickerTarget === 'gallery' ? 'the product gallery' : <strong>{mediaPickerKey}</strong>}, or{' '}
                      <button type="button" onClick={() => { setMediaPickerKey(null); setMediaPickerTarget(null); }} className="underline">cancel</button>.
                    </p>
                  )}
                </div>
              </div>

              {/* Save Bar */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#B58A42]/20">
                <button
                  type="button"
                  onClick={() => setLocalSettings(settings)}
                  className="px-5 py-2.5 rounded-lg border border-[#B58A42]/50 bg-white text-xs font-semibold text-[#352D2F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-7 py-2.5 rounded-lg bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30] transition-colors shadow-sm disabled:opacity-50"
                >
                  {settingsSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
