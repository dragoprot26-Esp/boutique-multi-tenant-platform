/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tenant, Product, Order, OrderItem } from '../types';
import { ShoppingBag, Star, X, Info, ChevronRight, CheckCircle, Share2, Award, QrCode, ArrowRight, Sparkles, Globe, MapPin, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../translations';

interface NYStorefrontProps {
  tenant: Tenant;
  products: Product[];
  onCreateOrder: (order: Order) => void;
  language: 'es' | 'en';
  onChangeLanguage: (lang: 'es' | 'en') => void;
  onChangeRole?: (role: 'customer' | 'admin' | 'collaborator') => void;
  isAdminLoggedIn?: boolean;
  lastAdminRole?: 'admin' | 'collaborator';
}

export default function NYStorefront({ tenant, products, onCreateOrder, language, onChangeLanguage, onChangeRole, isAdminLoggedIn, lastAdminRole }: NYStorefrontProps) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  const formatPrice = (amount: number) => {
    const symbol = tenant.currencySymbol || 'USD';
    if (symbol === '$' || symbol === '€' || symbol === '£') {
      return `${symbol}${amount}`;
    }
    return `${amount} ${symbol}`;
  };

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});
  
  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedVariant: { [key: string]: string } }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout/Order State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(tenant.phonePrefix || '+54 9 ');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState<Order | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  React.useEffect(() => {
    setCustomerPhone(tenant.phonePrefix || '+54 9 ');
  }, [tenant.phonePrefix]);

  // Filter products by active category
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'Todos') return p.tenantId === tenant.id;
    if (selectedCategory === 'Promo') return p.tenantId === tenant.id && p.isPromo;
    if (selectedCategory === 'Lo Nuevo') return p.tenantId === tenant.id && p.isNew;
    return p.tenantId === tenant.id && p.categories.includes(selectedCategory);
  });

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIdx(0);
    // Auto select first options for variants
    const initialVariants: { [key: string]: string } = {};
    product.variants.forEach(v => {
      if (v.values.length > 0) {
        initialVariants[v.name] = v.values[0];
      }
    });
    setSelectedVariants(initialVariants);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    // Check if item with exact variants already in cart
    const existingIndex = cart.findIndex(item => 
      item.product.id === selectedProduct.id && 
      JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariants)
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product: selectedProduct, quantity: 1, selectedVariant: { ...selectedVariants } }]);
    }
    
    setIsCartOpen(true);
    setSelectedProduct(null); // Close modal
  };

  const removeFromCart = (index: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !customerName || !customerPhone) return;

    // Generate pick up code
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const char = alphabet[Math.floor(Math.random() * alphabet.length)];
    const pickupCode = `RET-NY-${randomSuffix}${char}`;

    const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const orderItems: OrderItem[] = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
      price: item.product.price
    }));

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      tenantId: tenant.id,
      customerName,
      customerPhone,
      customerEmail,
      items: orderItems,
      totalAmount,
      status: 'preparation',
      pickupCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreateOrder(newOrder);
    setShowCheckoutSuccess(newOrder);
    setCart([]); // Clear cart
    setIsCartOpen(false);
    // Reset fields
    setCustomerName('');
    setCustomerPhone(tenant.phonePrefix || '+54 9 ');
    setCustomerEmail('');
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Link público REAL de la tienda (para clientes) y su QR escaneable
  const publicStoreUrl = `${window.location.origin}/?codigo=${encodeURIComponent(tenant.license || tenant.id)}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(publicStoreUrl)}`;

  return (
    <div id="ny-public-storefront" className="bg-stone-50 text-neutral-900 min-h-screen font-sans antialiased selection:bg-neutral-900 selection:text-white">
      {/* Administrative Preview Mode Indicator */}
      {isAdminLoggedIn && (
        <div className="bg-amber-500 text-neutral-950 px-6 py-2.5 flex items-center justify-between text-xs font-mono font-bold tracking-wider border-b border-amber-600 shadow-lg sticky top-0 z-50 animate-pulse-subtle">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-neutral-950 rounded-full animate-ping"></span>
            <span>{language === 'en' ? 'PREVIEW MODE ACTIVE' : 'MODO VISTA PREVIA ACTIVO'}</span>
          </div>
          <button
            id="back-to-panel-btn"
            onClick={() => {
              if (onChangeRole && lastAdminRole) {
                onChangeRole(lastAdminRole);
              }
            }}
            className="bg-neutral-950 hover:bg-neutral-900 text-amber-500 hover:text-white px-3.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back to Panel' : 'Volver al Panel'}</span>
          </button>
        </div>
      )}

      {/* Editorial Announcement Banner */}
      <div className="bg-neutral-950 text-stone-100 text-[10px] sm:text-xs tracking-[0.25em] py-2 px-4 text-center font-mono uppercase border-b border-neutral-900 flex justify-center items-center gap-2">
        <span>{t.announcement}</span>
        <span className="hidden md:inline">•</span>
        <span>{t.pickupInstant}</span>
      </div>

      {/* Luxury NYC Header */}
      <header className="border-b border-stone-200 py-8 px-6 bg-white sticky top-0 z-40 shadow-sm/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.3em] font-mono text-neutral-400 uppercase">NYC PREMIUM OUTLET</span>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-neutral-950 font-semibold mt-1">
              {tenant.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Share QR */}
            <button
              id="share-qr-btn"
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 text-xs border border-stone-300 hover:border-neutral-900 rounded-full px-4 py-2 font-mono tracking-wider transition bg-white text-neutral-800"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.shareQr}</span>
            </button>

            {/* Admin Shield Lock button */}
            <button
              id="admin-access-btn"
              onClick={() => {
                if (onChangeRole) onChangeRole('admin');
              }}
              className="flex items-center justify-center p-2 rounded-full border border-stone-300 hover:border-neutral-900 hover:text-amber-500 bg-white text-neutral-500 transition"
              title={language === 'en' ? 'Administrative Access' : 'Acceso Administrativo'}
            >
              <Shield className="w-3.5 h-3.5" />
            </button>

            {/* Language toggle */}
            <button
              id="lang-toggle-btn"
              onClick={() => onChangeLanguage(language === 'es' ? 'en' : 'es')}
              className="text-[10px] font-mono tracking-wider font-bold border border-stone-300 hover:border-neutral-900 rounded-full w-8 h-8 flex items-center justify-center transition bg-white text-neutral-600 uppercase"
              title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
            >
              {language === 'es' ? 'EN' : 'ES'}
            </button>

            {/* Map Pin / Location Button */}
            <button
              id="view-map-btn"
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-2 text-xs border border-stone-300 hover:border-neutral-900 rounded-full px-4 py-2 font-mono tracking-wider transition bg-white text-neutral-800"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">{language === 'en' ? 'LOCATION' : 'UBICACIÓN'}</span>
            </button>

            {/* Shopping Cart button */}
            <button
              id="open-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full border border-stone-200 hover:border-neutral-900 bg-white transition"
            >
              <ShoppingBag className="w-4 h-4 text-neutral-950" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-neutral-950 text-white text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded-full border border-white">
                  {cart.reduce((count, item) => count + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* NYC Loft Hero Section */}
      <section id="store-hero" className="relative h-[420px] bg-neutral-950 overflow-hidden">
        <img
          src={tenant.heroImage}
          alt="Boutique New York Interior"
          className="w-full h-full object-cover object-center opacity-85 saturate-[0.85] transition-transform duration-1000 hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-neutral-950/30 flex flex-col justify-end p-8 sm:p-12">
          <div className="max-w-4xl">
            <span className="text-amber-400 text-xs font-mono tracking-[0.4em] uppercase mb-2 block">FIRST-CLASS CORDWAINER</span>
            <h2 className="text-3xl sm:text-5xl font-serif text-stone-100 font-light tracking-tight max-w-2xl leading-tight">
              {tenant.description}
            </h2>
            <div className="mt-6 flex flex-wrap gap-6 text-xs text-stone-300 font-mono tracking-wider">
              <div>📍 {t.showroom}</div>
              <div>📞 {tenant.phone}</div>
              <div>✉️ {tenant.email}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Elegantes Categorías (Customizable by Tenant) */}
      <section id="category-scroller" className="bg-white border-b border-stone-200 py-5 sticky top-[89px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto scrollbar-none flex items-center gap-1.5 md:gap-3">
          {tenant.categories.map((cat) => {
            const displayLabel = cat === 'Todos' ? t.allProducts : cat === 'Promo' ? t.promo : cat === 'Lo Nuevo' ? t.newArrivals : cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase transition-all ${
                  selectedCategory === cat
                    ? 'bg-neutral-950 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-neutral-600'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </section>

      {/* Catalog Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col mb-10">
          <h3 className="text-xs font-mono tracking-[0.3em] text-neutral-400 uppercase">THE COLLECTION</h3>
          <h2 className="text-2xl font-serif text-neutral-950 font-semibold tracking-tight mt-1">
            {language === 'en' ? 'Avant-Garde Designs' : 'Diseños de Vanguardia'} • {selectedCategory === 'Todos' ? t.allProducts : selectedCategory === 'Promo' ? t.promo : selectedCategory === 'Lo Nuevo' ? t.newArrivals : selectedCategory}
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-stone-300 rounded-lg bg-white">
            <p className="text-sm font-mono text-neutral-400 uppercase">
              {language === 'en' ? 'No products in this category' : 'No hay productos en esta categoría'}
            </p>
            <button
              onClick={() => setSelectedCategory('Todos')}
              className="mt-4 text-xs font-mono underline hover:text-neutral-950 tracking-wider"
            >
              {language === 'en' ? 'VIEW ALL COLLECTION' : 'VER TODA LA COLECCIÓN'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="group flex flex-col bg-white border border-stone-100 p-4 rounded-xl shadow-sm hover:shadow-md transition duration-300"
              >
                {/* Images View */}
                <div className="relative aspect-square overflow-hidden bg-stone-100 rounded-lg mb-4">
                  <img
                    src={product.images[0] || 'https://picsum.photos/seed/shoes/800/800'}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  {/* Badge */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-neutral-950 text-white text-[9px] font-mono tracking-widest px-2.5 py-1 uppercase rounded-sm">
                        {language === 'en' ? 'NEW' : 'NUEVO'}
                      </span>
                    )}
                    {product.isPromo && (
                      <span className="bg-amber-500 text-neutral-950 text-[9px] font-mono tracking-widest px-2.5 py-1 uppercase font-bold rounded-sm">
                        {language === 'en' ? 'SALE' : 'PROMO'}
                      </span>
                    )}
                    {!product.inStock && (
                      <span className="bg-red-600 text-white text-[9px] font-mono tracking-widest px-2.5 py-1 uppercase rounded-sm">
                        {t.outOfStock}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h4 className="text-base font-serif text-neutral-950 font-medium tracking-tight">
                    {product.name}
                  </h4>
                  <span className="font-mono text-sm text-neutral-800 font-semibold">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 line-clamp-2 mb-4 leading-relaxed font-sans">
                  {product.description}
                </p>

                {/* Specs snippet */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {product.tags.slice(0, 3).map(t => (
                    <span key={t} className="bg-stone-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded font-mono">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Button */}
                <button
                  id={`view-product-btn-${product.id}`}
                  onClick={() => handleOpenProduct(product)}
                  className="w-full mt-auto bg-neutral-950 hover:bg-neutral-800 text-white text-xs tracking-widest uppercase py-3 rounded-lg font-mono transition flex items-center justify-center gap-2"
                >
                  <span>{t.viewDesign}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer info brand */}
      <footer className="border-t border-stone-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="font-serif font-semibold text-lg text-neutral-950 tracking-tight">{tenant.name}</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              {language === 'en'
                ? 'Premium tenant of the Red Boutique NY. All rights reserved © 2026.'
                : 'Inquilino premium de la Red Boutique NY. Todos los derechos reservados © 2026.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-mono">NEW YORK STATE CERTIFICATE OF AUTHENTICITY</span>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-neutral-950/70 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative text-neutral-950 flex flex-col md:flex-row"
            >
              <button
                id="close-product-modal-btn"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white border border-stone-200 p-1.5 rounded-full shadow-sm transition"
              >
                <X className="w-4 h-4 text-neutral-800" />
              </button>

              {/* Product Images (Left / Top) */}
              <div className="md:w-1/2 p-6 bg-stone-50 flex flex-col gap-4">
                <div className="aspect-square w-full rounded-lg overflow-hidden bg-white border border-stone-200 relative">
                  <img
                    src={selectedProduct.images[activeImageIdx] || 'https://picsum.photos/seed/shoes/800/800'}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover object-center transition"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {/* Thumbnails */}
                {selectedProduct.images.length > 1 && (
                  <div className="flex gap-2">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-20 aspect-square rounded-md overflow-hidden bg-white border transition ${
                          idx === activeImageIdx ? 'border-neutral-950 ring-1 ring-neutral-950' : 'border-stone-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info & Cart Config (Right / Bottom) */}
              <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex gap-2 mb-2">
                    {selectedProduct.categories.map(c => {
                      const catLabel = c === 'Todos' ? t.allProducts : c === 'Promo' ? t.promo : c === 'Lo Nuevo' ? t.newArrivals : c;
                      return (
                        <span key={c} className="text-[10px] tracking-widest uppercase font-mono text-neutral-400">
                          {catLabel}
                        </span>
                      );
                    })}
                  </div>

                  <h3 className="text-2xl font-serif text-neutral-950 font-bold tracking-tight mb-3">
                    {selectedProduct.name}
                  </h3>

                  <div className="text-xl font-mono text-neutral-900 font-semibold mb-4">
                    {formatPrice(selectedProduct.price)}
                  </div>

                  <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                    {selectedProduct.description}
                  </p>

                  {/* Customizable Variants (Sizes / Colors) */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className="space-y-4 mb-6 border-t border-b border-stone-100 py-4">
                      {selectedProduct.variants.map((v) => (
                        <div key={v.name} className="flex flex-col gap-2">
                          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                            {v.name}: <span className="text-neutral-950 font-bold">{selectedVariants[v.name]}</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {v.values.map((val) => (
                              <button
                                key={val}
                                onClick={() => setSelectedVariants({ ...selectedVariants, [v.name]: val })}
                                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                                  selectedVariants[v.name] === val
                                    ? 'bg-neutral-950 border-neutral-950 text-white'
                                    : 'border-stone-200 hover:border-neutral-400 bg-white text-neutral-800'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom Details Added with "+" */}
                  {selectedProduct.details && selectedProduct.details.length > 0 && (
                    <div className="mb-6">
                      <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 block mb-2">
                        {language === 'en' ? 'ARTISAN DETAILS' : 'DETALLES ARTESANALES'}
                      </span>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-stone-50 p-3 rounded-lg border border-stone-100">
                        {selectedProduct.details.map((det) => (
                          <div key={det.label} className="col-span-2 sm:col-span-1 flex flex-col">
                            <dt className="text-[10px] text-neutral-400 font-mono uppercase">{det.label}</dt>
                            <dd className="text-neutral-800 font-medium">{det.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <button
                    id="add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={!selectedProduct.inStock}
                    className={`w-full text-xs font-mono tracking-widest uppercase py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                      selectedProduct.inStock
                        ? 'bg-neutral-950 hover:bg-neutral-800 text-white'
                        : 'bg-stone-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{selectedProduct.inStock ? t.addToBag : t.outOfStock}</span>
                  </button>
                  <p className="text-[10px] text-center text-neutral-400 font-mono uppercase">
                    {language === 'en' ? '🔒 PICKUP IN STORE WITH UNIQUE SECURITY CODE' : '🔒 SE RETIRA EN EL LOCAL CON CÓDIGO ÚNICO'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-neutral-950/60 flex justify-end backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white max-w-md w-full h-full shadow-2xl flex flex-col text-neutral-950"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-neutral-950" />
                  <h3 className="text-lg font-serif font-bold tracking-tight">{t.yourShoppingBag}</h3>
                </div>
                <button
                  id="close-cart-btn"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 transition"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <ShoppingBag className="w-12 h-12 text-stone-200 mb-3" />
                    <p className="text-sm font-mono text-neutral-400 uppercase">{t.bagIsEmpty}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {language === 'en'
                        ? `Explore ${tenant.name}'s exclusive New York collection.`
                        : `Explora la colección neoyorquina de ${tenant.name}`}
                    </p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="flex gap-4 border-b border-stone-50 pb-4 last:border-0">
                      <div className="w-16 h-16 rounded overflow-hidden bg-stone-100 flex-shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-serif font-medium">{item.product.name}</h4>
                          <button
                            id={`remove-item-${index}`}
                            onClick={() => removeFromCart(index)}
                            className="text-[10px] font-mono text-red-500 hover:underline ml-2"
                          >
                            {language === 'en' ? 'Remove' : 'Eliminar'}
                          </button>
                        </div>
                        <div className="text-xs text-neutral-400 font-mono mt-1 flex flex-wrap gap-1">
                          {Object.entries(item.selectedVariant).map(([k, v]) => (
                            <span key={k}>{k}: {v} •</span>
                          ))}
                          <span>{language === 'en' ? 'Qty' : 'Cant'}: {item.quantity}</span>
                        </div>
                        <div className="text-sm font-mono font-semibold mt-1">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Form */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-stone-100 bg-stone-50">
                  <div className="flex justify-between text-base font-serif font-bold mb-4">
                    <span>{language === 'en' ? 'Order Total:' : 'Total del Encargo:'}</span>
                    <span className="font-mono">{formatPrice(totalCartAmount)}</span>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      {language === 'en' ? 'STORE PICKUP DETAILS' : 'DATOS PARA EL RETIRO EN LOCAL'}
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder={t.fullName}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-950 text-neutral-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        required
                        placeholder={t.contactPhone}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-950 text-neutral-800"
                      />
                      <input
                        type="email"
                        placeholder={language === 'en' ? 'Email (optional)' : 'Correo (opcional)'}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-950 text-neutral-800"
                      />
                    </div>

                    <button
                      type="submit"
                      id="submit-order-btn"
                      className="w-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs tracking-widest uppercase py-3 rounded-lg font-mono transition mt-3 flex items-center justify-center gap-2"
                    >
                      <span>{t.confirmQuickOrder}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal with pickup code */}
      {showCheckoutSuccess && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-stone-100 rounded-xl p-8 max-w-md w-full shadow-2xl relative text-neutral-950 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-stone-100 p-3 rounded-full text-neutral-950 border border-neutral-900/10">
                <CheckCircle className="w-8 h-8 text-neutral-900" />
              </div>
            </div>

            <span className="text-[10px] tracking-[0.2em] font-mono text-neutral-400 uppercase">NYC BOUTIQUE EXCLUSIVE</span>
            
            <h3 className="text-xl font-serif font-bold text-neutral-950 mt-1 mb-2">
              {t.orderConfirmed}
            </h3>
            
            <p className="text-xs text-neutral-500 mb-6 font-sans leading-relaxed">
              {language === 'en' ? (
                <>
                  Hello, <span className="font-semibold text-neutral-900">{showCheckoutSuccess.customerName}</span>. 
                  Your footwear is being prepared at our {tenant.name} showroom. Present the following code upon pickup:
                </>
              ) : (
                <>
                  Hola, <span className="font-semibold text-neutral-900">{showCheckoutSuccess.customerName}</span>. 
                  Tu pedido está en preparación en nuestro local de {tenant.name}. Presenta el siguiente código al retirar:
                </>
              )}
            </p>

            {/* Code Board */}
            <div className="bg-stone-50 border border-dashed border-stone-300 p-4 rounded-lg mb-6 font-mono">
              <span className="text-xs text-stone-400 block uppercase tracking-wider">
                {language === 'en' ? 'PICKUP CODE' : 'CÓDIGO DE RETIRO'}
              </span>
              <span className="text-2xl font-bold tracking-widest text-neutral-950 block mt-1">
                {showCheckoutSuccess.pickupCode}
              </span>
            </div>

            <div className="text-[11px] text-stone-400 text-left bg-stone-50/50 p-3 rounded border border-stone-100 mb-6">
              <p className="font-semibold text-neutral-700 font-mono mb-1">
                {language === 'en' ? '📋 INSTRUCTIONS:' : '📋 INSTRUCCIONES:'}
              </p>
              {language === 'en' ? (
                <>
                  <p>1. Keep a screenshot of this code or write it down.</p>
                  <p>2. We will notify you when it is ready for collection.</p>
                  <p>3. Pay directly at the checkout desk in store.</p>
                </>
              ) : (
                <>
                  <p>1. Guardá captura de esta pantalla o anota el código.</p>
                  <p>2. Te notificaremos al móvil cuando esté listo para retirar.</p>
                  <p>3. Abonás directamente en recepción del local.</p>
                </>
              )}
            </div>

            <button
              id="close-success-modal"
              onClick={() => setShowCheckoutSuccess(null)}
              className="w-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs tracking-widest uppercase py-3 rounded-lg font-mono transition"
            >
              {language === 'en' ? 'UNDERSTOOD' : 'ENTENDIDO'}
            </button>
          </div>
        </div>
      )}

      {/* QR Share Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl relative text-neutral-950 text-center border border-stone-100">
            <button
              id="close-qr-modal"
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>

            <span className="text-[9px] tracking-[0.25em] font-mono text-neutral-400 uppercase block mb-1">NYC BOUTIQUE QR CARD</span>
            <h3 className="text-lg font-serif font-bold text-neutral-950 mb-4">
              {t.shareStore}
            </h3>

            {/* Stylized QR Card */}
            <div className="bg-stone-50 border border-stone-100 p-5 rounded-xl flex flex-col items-center gap-4 mb-6 shadow-sm">
              <div className="w-44 h-44 bg-white border border-stone-200 p-3 rounded-lg flex items-center justify-center shadow-inner relative group">
                {/* QR REAL escaneable → link público de la tienda */}
                <img
                  src={qrImgUrl}
                  alt="QR de la tienda"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center">
                <span className="text-xs font-serif font-semibold text-neutral-900 block">{tenant.name}</span>
                <span className="text-[10px] font-mono text-neutral-400 tracking-wider">
                  {language === 'en' ? 'SHARE SHOP WITH CLIENTS' : 'COMPARTIR QR CON CLIENTES'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 mb-6 leading-normal">
              {language === 'en'
                ? 'Scan this QR to open your boutique directly on any phone — your customers see your live catalog and can place orders.'
                : 'Escaneá este QR para abrir tu tienda en cualquier celular. Tus clientes ven el catálogo real y pueden hacer pedidos.'}
            </p>

            <button
              id="copy-link-btn"
              onClick={() => {
                navigator.clipboard.writeText(publicStoreUrl);
                const alertMsg = language === 'en' ? 'Boutique link copied to clipboard!' : '¡Enlace de boutique copiado al portapapeles!';
                alert(alertMsg);
              }}
              className="w-full flex items-center justify-center gap-2 border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs tracking-widest uppercase py-2.5 rounded-lg font-mono transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'COPY DIRECT LINK' : 'COPIAR ENLACE DIRECTO'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Boutique Location Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl relative text-neutral-950 border border-stone-100">
            <button
              id="close-map-modal"
              onClick={() => setShowMapModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100 transition animate-pulse"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>

            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-2">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-[9px] tracking-[0.25em] font-mono text-neutral-400 uppercase block">BOUTIQUE ADDRESS</span>
              <h3 className="text-xl font-serif font-bold text-neutral-950">
                {language === 'en' ? 'Where to Find Us' : 'Dónde Encontrarnos'}
              </h3>
            </div>

            <div className="bg-stone-50 border border-stone-100 p-5 rounded-xl flex flex-col gap-3 mb-6 shadow-sm text-left">
              <div>
                <span className="text-[9px] font-mono text-neutral-400 tracking-wider uppercase block mb-1">
                  {language === 'en' ? 'PHYSICAL LOCATION' : 'DIRECCIÓN FÍSICA'}
                </span>
                <p className="text-sm font-serif font-semibold text-neutral-950 leading-relaxed">
                  {tenant.address || (language === 'en' ? 'Address not configured' : 'Dirección no configurada')}
                </p>
              </div>
              {tenant.address && (
                <div>
                  <span className="text-[9px] font-mono text-neutral-400 tracking-wider uppercase block mb-1">
                    {language === 'en' ? 'ABOUT THIS LOCATION' : 'SOBRE ESTA UBICACIÓN'}
                  </span>
                  <p className="text-xs text-neutral-600 leading-normal">
                    {language === 'en'
                      ? `Located in the premium district. Visited by shoe lovers looking for genuine craftmanship and custom fittings.`
                      : `Ubicado en el distrito de diseño premium de la boutique. Un espacio exclusivo para amantes del calzado fino hecho a mano.`}
                  </p>
                </div>
              )}
            </div>

            {tenant.address ? (
              <a
                href={tenant.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                id="google-maps-direct-link"
                className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white text-xs tracking-widest uppercase py-3 rounded-lg font-mono transition"
              >
                <span>{language === 'en' ? 'OPEN GOOGLE MAPS' : 'ABRIR EN GOOGLE MAPS'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </a>
            ) : (
              <button
                disabled
                className="w-full bg-stone-100 text-stone-400 text-xs tracking-widest uppercase py-3 rounded-lg font-mono cursor-not-allowed"
              >
                {language === 'en' ? 'LOCATION NOT AVAILABLE' : 'UBICACIÓN NO DISPONIBLE'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
