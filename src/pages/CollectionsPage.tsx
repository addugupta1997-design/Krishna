import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { FloralCorner } from '../components/Ornaments';
import { ProductCard } from '../components/ProductCard';
import type { Category, Product, WebsiteSettings } from '../types';

interface CollectionsPageProps {
  categories: Category[];
  products: Product[];
  settings: WebsiteSettings;
  isLoading?: boolean;
  selectedCategoryName?: string | null;
  onSelectCategoryName?: (name: string | null) => void;
  onShopNow: (product: Product) => void;
  onAddToCart: (product: Product, variantId: string | undefined, quantity: number) => boolean;
  onNavigateHome: () => void;
}

export function CollectionsPage({
  categories,
  products,
  settings,
  isLoading = false,
  selectedCategoryName,
  onSelectCategoryName,
  onShopNow,
  onAddToCart,
  onNavigateHome,
}: CollectionsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategoryName || 'All');

  // Sync activeCategory when prop changes
  useEffect(() => {
    setActiveCategory(selectedCategoryName || 'All');
  }, [selectedCategoryName]);

  // Pills come from the live category list (in display order) so newly added
  // categories appear automatically. Known categories keep their approved short labels.
  const shortLabels: Record<string, string> = {
    'Wedding Essentials': 'Wedding',
    'Bhagwan Ji Shringaar': 'Shringaar',
    'Laces & Latkans': 'Laces & Latkans',
    'Festive Décor': 'Festive',
    'Festive Decor': 'Festive',
    'Art & Craft': 'Art & Craft',
  };
  const filterPills = [
    { label: 'All', query: 'All' },
    ...categories
      .filter((category) => category.isVisible !== false)
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category) => ({
        label: shortLabels[category.name] || category.name,
        query: category.name,
      })),
  ];

  // Combined filtering: category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const catName = cat ? cat.name.toLowerCase() : '';

      let matchesCategory = true;
      if (activeCategory !== 'All') {
        const actLower = activeCategory.toLowerCase();
        matchesCategory =
          catName.includes(actLower) ||
          (actLower === 'wedding' && catName.includes('wedding')) ||
          (actLower === 'shringaar' && catName.includes('shringaar')) ||
          (actLower === 'laces' && (catName.includes('lace') || catName.includes('latkan'))) ||
          (actLower === 'festive' && (catName.includes('festive') || catName.includes('décor') || catName.includes('decor'))) ||
          (actLower.includes('art') && (catName.includes('art') || catName.includes('craft')));
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchesSearch =
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          catName.includes(q);
      }

      return matchesCategory && matchesSearch;
    });
  }, [products, categories, activeCategory, searchQuery]);

  const handleCategoryClick = (catQuery: string) => {
    setActiveCategory(catQuery);
    if (onSelectCategoryName) {
      onSelectCategoryName(catQuery === 'All' ? null : catQuery);
    }
  };

  return (
    <div className="w-full bg-[#FFF8EE] min-h-screen pb-16">
      {/* 1. CONTINUOUS EDITORIAL BANNER */}
      <section className="relative w-full bg-[#FFF8EE] border-b border-[#B58A42]/25 overflow-hidden">
        {/* Desktop / Tablet continuous layout */}
        <div className="hidden sm:flex relative w-full h-[280px] md:h-[300px] lg:h-[330px] items-center">
          {/* Right Product Photography filling top, bottom and right edges */}
          <div className="absolute inset-y-0 right-0 w-[55%] lg:w-[58%] h-full pointer-events-none overflow-hidden">
            <img
              src={settings.collectionsHeroImage || '/assets/images/collections_hero_clean.jpg'}
              alt="Store — Wedding essentials, divine shringaar & thoughtful details"
              className="w-full h-full object-cover object-left"
              loading="eager"
            />
            {/* Soft cream-to-transparent transition on the left edge */}
            <div className="absolute inset-y-0 left-0 w-28 sm:w-36 lg:w-48 bg-gradient-to-r from-[#FFF8EE] via-[#FFF8EE]/85 to-transparent pointer-events-none" />
          </div>

          {/* Left Cream Text Content */}
          <div className="relative z-10 w-full container-public">
            <div className="max-w-md lg:max-w-lg relative">
              {/* Botanical sprig top-left */}
              <div className="absolute -top-6 -left-8 pointer-events-none opacity-35">
                <FloralCorner className="w-14 h-14 text-[#B58A42]" />
              </div>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-[#352D2F]/70 mb-3" aria-label="Breadcrumb">
                <button
                  onClick={onNavigateHome}
                  className="hover:text-[#682D42] transition-colors hover:underline focus:outline-none"
                >
                  Home
                </button>
                <span className="text-[#B58A42]">/</span>
                <span className="text-[#682D42] font-semibold">Store</span>
              </nav>

              {/* Heading */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#682D42] tracking-tight leading-[1.12]">
                Find something beautiful.
              </h1>

              {/* Gold floral divider */}
              <div className="my-2.5 flex items-center gap-2.5 text-[#B58A42]" aria-hidden="true">
                <span className="h-[1px] w-8 sm:w-12 bg-[#B58A42]/60" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-[#B58A42] shrink-0">
                  <path
                    d="M12 3 C13.2 7 17 9 19 12 C17 15 13.2 17 12 21 C10.8 17 7 15 5 12 C7 9 10.8 7 12 3 Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="currentColor"
                    fillOpacity="0.2"
                  />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
                <span className="h-[1px] w-8 sm:w-12 bg-[#B58A42]/60" />
              </div>

              {/* Supporting text */}
              <p className="text-sm sm:text-base text-[#352D2F]/85 font-normal leading-relaxed">
                Wedding essentials, divine shringaar &amp; thoughtful details.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Layout strictly following mobile reference board */}
        <div className="sm:hidden w-full pt-16 pb-0 flex flex-col">
          {/* Breadcrumb */}
          <div className="px-4 mb-1.5">
            <nav className="flex items-center gap-1.5 text-xs text-[#352D2F]/70" aria-label="Breadcrumb">
              <button
                onClick={onNavigateHome}
                className="hover:text-[#682D42] transition-colors"
              >
                Home
              </button>
              <span className="text-[#B58A42]">/</span>
              <span className="text-[#682D42] font-semibold">Store</span>
            </nav>
          </div>

          {/* Centered Heading & copy */}
          <div className="px-4 text-center">
            <h1 className="font-serif text-2xl font-bold text-[#682D42] tracking-tight">
              Find something beautiful.
            </h1>
            <div className="my-1.5 flex items-center justify-center gap-2 text-[#B58A42]" aria-hidden="true">
              <span className="h-[1px] w-8 bg-[#B58A42]/60" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-[#B58A42] shrink-0">
                <path
                  d="M12 3 C13.2 7 17 9 19 12 C17 15 13.2 17 12 21 C10.8 17 7 15 5 12 C7 9 10.8 7 12 3 Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span className="h-[1px] w-8 bg-[#B58A42]/60" />
            </div>
            <p className="text-xs text-[#352D2F]/80 mb-3 px-2">
              Wedding essentials, divine shringaar &amp; thoughtful details.
            </p>
          </div>

          {/* Clean product photograph spanning width */}
          <div className="w-full aspect-[21/9] overflow-hidden border-t border-[#B58A42]/20">
            <img
              src={settings.collectionsHeroImage || '/assets/images/collections_hero_clean.jpg'}
              alt="Store Preview"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* 2. SOFT BABY-PINK SEARCH AND CATEGORY FILTER BAND */}
      <section className="w-full bg-[#F6DCE3] py-3.5 sm:py-4 border-b border-[#B58A42]/25">
        <div className="container-public">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-64 md:w-72 lg:w-80 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#682D42]/70">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="search"
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-8 py-2 rounded-full border border-[#B58A42]/40 bg-white text-xs sm:text-sm text-[#352D2F] placeholder:text-[#352D2F]/50 focus:outline-none focus:ring-1.5 focus:ring-[#682D42] shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#352D2F]/60 hover:text-[#682D42]"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills in exact reference order */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {filterPills.map((pill) => {
                const isSelected = activeCategory === pill.query;
                return (
                  <button
                    key={pill.label}
                    aria-pressed={isSelected}
                    onClick={() => handleCategoryClick(pill.query)}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap focus:outline-none shrink-0 ${
                      isSelected
                        ? 'bg-[#682D42] text-[#FFF8EE] font-semibold shadow-xs'
                        : 'bg-[#FFF8EE] text-[#352D2F] border border-[#B58A42]/40 hover:bg-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT GRID */}
      <section className="container-public pt-6 sm:pt-8">
        {/* Item count status */}
        <div className="flex items-center justify-between text-xs text-[#352D2F]/70 mb-4 pb-2 border-b border-[#B58A42]/15">
          <span role="status" aria-live="polite" aria-atomic="true">
            {isLoading ? (
              <>Loading products&hellip;</>
            ) : (
              <>
                Showing <strong className="text-[#682D42] font-semibold">{filteredProducts.length}</strong> items
                {activeCategory !== 'All' && <span> in <strong>{activeCategory}</strong></span>}
                {searchQuery && <span> matching &ldquo;<strong>{searchQuery}</strong>&rdquo;</span>}
              </>
            )}
          </span>

          {(activeCategory !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
                if (onSelectCategoryName) onSelectCategoryName(null);
              }}
              className="text-[#B58A42] hover:text-[#682D42] hover:underline font-medium"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* 2 columns on mobile, 3 columns on desktop */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-[#B58A42]/25 bg-[#FFF8EE]">
                <div className="w-full aspect-[4/3] bg-[#F6DCE3]/50 animate-pulse" />
                <div className="py-3 px-2 border-t border-[#B58A42]/25">
                  <div className="h-3.5 w-3/4 mx-auto rounded bg-[#F6DCE3]/80 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div key={`${activeCategory}:${searchQuery.trim()}`} className="collection-results grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {filteredProducts.map((prod) => {
              const cat = categories.find((c) => c.id === prod.categoryId);
              return (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  category={cat}
                  onShopNow={onShopNow}
                  onAddToCart={onAddToCart}
                />
              );
            })}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="py-16 text-center bg-[#F6DCE3]/20 rounded-2xl border border-dashed border-[#B58A42]/40 p-8 max-w-lg mx-auto my-8">
            <h3 className="font-serif text-xl font-bold text-[#682D42] mb-2">
              No matching products found
            </h3>
            <p className="text-xs sm:text-sm text-[#352D2F]/70 mb-5">
              We couldn't find items matching your criteria. Looking for something specific? Message us on WhatsApp and we will find it in our store.
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
                if (onSelectCategoryName) onSelectCategoryName(null);
              }}
              className="px-5 py-2 rounded-full bg-[#682D42] text-[#FFF8EE] text-xs font-semibold hover:bg-[#4F1E30] transition-colors"
            >
              View All Store Products
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
