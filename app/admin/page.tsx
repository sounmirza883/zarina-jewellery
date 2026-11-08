'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  Phone,
  MessageCircle,
  Search,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  LogOut,
  Lock,
  CheckCircle,
  Truck,
  XCircle,
  RotateCcw,
  Sliders,
  DollarSign,
  Printer,
  X,
  Sparkles,
  ChevronDown,
  Eye,
  Store,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPKR } from '@/lib/shop-logic';
import { Product, ProductCategory, Order, OrderStatus } from '@/types/product';
import {
  isAdminAuthenticated,
  setAdminAuthenticated,
  getStoredOrders,
  saveOrders,
  updateOrderStatus,
  deleteOrder,
  getStoredProducts,
  upsertProduct,
  deleteStoredProduct,
  resetProductsToDefault,
  getStoreSettings,
  saveStoreSettings,
  AdminSettings,
} from '@/lib/admin-store';
import ProductImage from '@/components/ProductImage';
import AdminOrderChart from '@/components/AdminOrderChart';

// Curated high-res jewellery image presets for quick product addition
const PRESET_JEWELLERY_IMAGES = [
  {
    name: 'Kundan Choker & Jhumka Set',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Emerald Green Kundan Choker',
    url: 'https://images.unsplash.com/photo-1611591475836-8435d648b789?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bridal Polki & Pearl Haar',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Antique Gold Chandbali Earrings',
    url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Solitaire Zircon Cocktail Ring',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Handcrafted Kundan Bangle Kara',
    url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
  },
];

export default function AdminPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'settings'>('overview');

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => getStoredOrders());
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<ProductCategory>('earrings');
  const [prodFormPrice, setProdFormPrice] = useState('2450');
  const [prodFormComparePrice, setProdFormComparePrice] = useState('2950');
  const [prodFormImage, setProdFormImage] = useState(PRESET_JEWELLERY_IMAGES[0].url);
  const [prodFormDescription, setProdFormDescription] = useState('');
  const [prodFormColors, setProdFormColors] = useState('Gold-Tone, Antique Gold');
  const [prodFormSizes, setProdFormSizes] = useState('Standard');
  const [prodFormIsNew, setProdFormIsNew] = useState(true);
  const [prodFormIsBestSeller, setProdFormIsBestSeller] = useState(false);
  const [prodFormInStock, setProdFormInStock] = useState(true);

  // Settings State
  const [settings, setSettings] = useState<AdminSettings>(() => getStoreSettings());
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Subscribe to external storage updates
  useEffect(() => {
    const handleOrdersUpdate = () => setOrders(getStoredOrders());
    const handleProductsUpdate = () => setProducts(getStoredProducts());
    const handleSettingsUpdate = () => setSettings(getStoreSettings());

    window.addEventListener('zarina_orders_updated', handleOrdersUpdate);
    window.addEventListener('zarina_products_updated', handleProductsUpdate);
    window.addEventListener('zarina_settings_updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('zarina_orders_updated', handleOrdersUpdate);
      window.removeEventListener('zarina_products_updated', handleProductsUpdate);
      window.removeEventListener('zarina_settings_updated', handleSettingsUpdate);
    };
  }, []);

  // Handle PIN Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or zarina
    if (pinInput === '1234' || pinInput.toLowerCase() === 'zarina') {
      setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setPinInput('');
  };

  // --- ORDERS LOGIC ---
  const handleStatusChange = (orderNumber: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderNumber, newStatus);
    setOrders(getStoredOrders());
    if (selectedOrderForModal && selectedOrderForModal.orderNumber === orderNumber) {
      setSelectedOrderForModal({ ...selectedOrderForModal, status: newStatus });
    }
  };

  const handleDeleteOrder = (orderNumber: string) => {
    if (confirm(`Are you sure you want to delete order ${orderNumber}?`)) {
      deleteOrder(orderNumber);
      setOrders(getStoredOrders());
      if (selectedOrderForModal?.orderNumber === orderNumber) {
        setSelectedOrderForModal(null);
      }
    }
  };

  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (orderStatusFilter !== 'all') {
      list = list.filter((o) => o.status === orderStatusFilter);
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          o.customer.city.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, orderStatusFilter, orderSearch]);

  // --- STATS OVERVIEW ---
  const stats = useMemo(() => {
    const totalSales = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending Phone Confirmation').length;
    const confirmedOrders = orders.filter((o) => o.status === 'Confirmed' || o.status === 'Dispatched').length;
    const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      totalSales,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      avgOrderValue,
      totalProducts: products.length,
    };
  }, [orders, products]);

  // --- PRODUCTS LOGIC ---
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormCategory('earrings');
    setProdFormPrice('2450');
    setProdFormComparePrice('2950');
    setProdFormImage(PRESET_JEWELLERY_IMAGES[0].url);
    setProdFormDescription('Exquisite artisanal artificial jewellery piece featuring high-grade crystals and lustrous micro gold-tone plating.');
    setProdFormColors('Gold-Tone, Antique Gold');
    setProdFormSizes('Standard');
    setProdFormIsNew(true);
    setProdFormIsBestSeller(false);
    setProdFormInStock(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdFormName(product.name);
    setProdFormCategory(product.category);
    setProdFormPrice(product.price.toString());
    setProdFormComparePrice(product.compareAtPrice ? product.compareAtPrice.toString() : '');
    setProdFormImage(product.images[0] || PRESET_JEWELLERY_IMAGES[0].url);
    setProdFormDescription(product.description);
    setProdFormColors(product.colors.join(', '));
    setProdFormSizes(product.sizes ? product.sizes.join(', ') : 'Standard');
    setProdFormIsNew(product.isNew);
    setProdFormIsBestSeller(product.isBestSeller);
    setProdFormInStock(product.inStock);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim()) return;

    const priceNum = parseInt(prodFormPrice, 10) || 1950;
    const compareNum = prodFormComparePrice ? parseInt(prodFormComparePrice, 10) : undefined;
    const colorsArr = prodFormColors.split(',').map((c) => c.trim()).filter(Boolean);
    const sizesArr = prodFormSizes.split(',').map((s) => s.trim()).filter(Boolean);

    const slug =
      editingProduct?.slug ||
      prodFormName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const productData: Product = {
      id: editingProduct?.id || `zarina-custom-${Date.now()}`,
      slug,
      name: prodFormName.trim(),
      category: prodFormCategory,
      price: priceNum,
      compareAtPrice: compareNum,
      images: [prodFormImage.trim()],
      colors: colorsArr.length > 0 ? colorsArr : ['Gold-Tone'],
      sizes: sizesArr.length > 0 ? sizesArr : undefined,
      description: prodFormDescription.trim() || 'Handcrafted artificial jewellery designed for Pakistani elegance.',
      details: [
        'Premium micro gold-tone anti-tarnish plating',
        'Hypoallergenic & nickel-safe alloy base',
        'Cash on Delivery available nationwide across Pakistan',
        'Signature Zarina keepsake presentation box included',
      ],
      tags: [prodFormCategory, 'pakistan', 'jewellery', 'bridal', 'cod'],
      isNew: prodFormIsNew,
      isBestSeller: prodFormIsBestSeller,
      inStock: prodFormInStock,
    };

    upsertProduct(productData);
    setProducts(getStoredProducts());
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the catalogue?`)) {
      deleteStoredProduct(id);
      setProducts(getStoredProducts());
    }
  };

  const handleResetCatalog = () => {
    if (confirm('Reset catalogue back to initial 16 Zarina Jewels products? Custom items will be reset.')) {
      resetProductsToDefault();
      setProducts(getStoredProducts());
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (productCategoryFilter !== 'all') {
      list = list.filter((p) => p.category === productCategoryFilter);
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, productCategoryFilter, productSearch]);

  // --- SETTINGS LOGIC ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings(settings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  // Helper for WhatsApp confirmation message
  const getWhatsAppConfirmationUrl = (order: Order) => {
    const phone = order.customer.whatsapp || order.customer.phone;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ');
    const message = `Assalam o Alaikum ${order.customer.fullName}! This is Zarina Jewels regarding your Order #${order.orderNumber}.\n\nItems: ${itemsSummary}\nTotal Payable on Delivery: Rs. ${order.total.toLocaleString()}\nDelivery Address: ${order.customer.address}, ${order.customer.city}.\n\nPlease reply YES to confirm your cash on delivery order for immediate dispatch. Thank you!`;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
  };

  // Status Badge Helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending Phone Confirmation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending Call</span>
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            <span>Confirmed</span>
          </span>
        );
      case 'Dispatched':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" />
            <span>Dispatched</span>
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Delivered & Paid</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  // --- PIN AUTHENTICATION SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0D12] text-[#FAF7F2] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#16181F] border border-[#B8893B]/40 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B8893B]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#B8893B]/20 border border-[#B8893B]/40 flex items-center justify-center mx-auto mb-4 text-[#D9B66A]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-white">
              Zarina Jewels Admin
            </h1>
            <p className="text-xs text-[#8A8A8A] mt-1.5 tracking-wide">
              Management Portal • Cash on Delivery & Inventory
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D9B66A] font-semibold mb-2">
                Enter Security Passcode
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter PIN (Default: 1234)"
                autoFocus
                className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-lg text-white text-center text-lg tracking-widest placeholder-[#575757] focus:outline-hidden ${
                  pinError ? 'border-rose-500' : 'border-[#B8893B]/40 focus:border-[#D9B66A]'
                }`}
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-2 text-center">
                  Incorrect PIN. Try <strong>1234</strong> or click quick unlock below.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#B8893B] hover:bg-[#D9B66A] text-[#0B0D12] text-xs uppercase tracking-widest font-bold rounded-lg transition-colors cursor-pointer"
            >
              Sign In to Admin
            </button>

            <button
              type="button"
              onClick={() => {
                setPinInput('1234');
                setAdminAuthenticated(true);
                setIsAuthenticated(true);
              }}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-[#CCCCCC] text-xs font-medium rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D9B66A]" />
              <span>One-Click Demo Unlock (PIN: 1234)</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#8A8A8A] hover:text-[#D9B66A] transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Back to Customer Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1F1F1F]">
      {/* Top Admin Header Bar */}
      <header className="admin-header-bar no-print bg-[#0B0D12] text-[#FAF7F2] border-b border-[#B8893B]/30 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Admin Badge */}
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2">
                <span className="font-serif text-2xl text-white tracking-wider">
                  Zarina Jewels
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#B8893B] text-[#0B0D12] px-2 py-0.5 rounded">
                  Admin
                </span>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 sm:gap-5">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-[#D9B66A] hover:text-white px-3 py-1.5 rounded border border-[#B8893B]/40 hover:border-white transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Storefront</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-xs text-[#CCCCCC] hover:text-rose-400 p-2 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="admin-tabs-bar no-print flex space-x-1 sm:space-x-4 border-t border-white/10 pt-2 pb-1 overflow-x-auto text-xs font-semibold tracking-wider uppercase">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-[#B8893B] text-[#D9B66A] bg-white/5'
                  : 'border-transparent text-[#CCCCCC] hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-[#B8893B] text-[#D9B66A] bg-white/5'
                  : 'border-transparent text-[#CCCCCC] hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders ({orders.length})</span>
              {stats.pendingOrders > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-3 py-2 rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-[#B8893B] text-[#D9B66A] bg-white/5'
                  : 'border-transparent text-[#CCCCCC] hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catalogue & Inventory ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-[#B8893B] text-[#D9B66A] bg-white/5'
                  : 'border-transparent text-[#CCCCCC] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Store Settings & COD</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-main-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#B8893B]/20 shadow-xs">
                <div className="flex items-center justify-between text-[#575757] text-xs font-medium uppercase tracking-wider mb-2">
                  <span>Gross Sales (COD)</span>
                  <DollarSign className="w-4 h-4 text-[#B8893B]" />
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B0D12]">
                  {formatPKR(stats.totalSales)}
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  From {stats.totalOrders} total Pakistani orders
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#B8893B]/20 shadow-xs">
                <div className="flex items-center justify-between text-[#575757] text-xs font-medium uppercase tracking-wider mb-2">
                  <span>Pending Confirmations</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-amber-800">
                  {stats.pendingOrders}
                </div>
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  Requires phone or WhatsApp verification
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#B8893B]/20 shadow-xs">
                <div className="flex items-center justify-between text-[#575757] text-xs font-medium uppercase tracking-wider mb-2">
                  <span>In Transit / Dispatched</span>
                  <Truck className="w-4 h-4 text-purple-600" />
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B0D12]">
                  {stats.confirmedOrders}
                </div>
                <p className="text-[11px] text-[#575757] font-medium mt-1">
                  En route via TCS, Trax or Leopards
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#B8893B]/20 shadow-xs">
                <div className="flex items-center justify-between text-[#575757] text-xs font-medium uppercase tracking-wider mb-2">
                  <span>Average Order Value</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#0B0D12]">
                  {formatPKR(stats.avgOrderValue)}
                </div>
                <p className="text-[11px] text-[#575757] font-medium mt-1">
                  {stats.totalProducts} active products in catalogue
                </p>
              </div>
            </div>

            {/* Urgent Action Banner if pending phone confirmations */}
            {stats.pendingOrders > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      {stats.pendingOrders} Cash on Delivery {stats.pendingOrders === 1 ? 'Order' : 'Orders'} Awaiting Phone Confirmation
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Couriers in Pakistan require phone confirmation before parcels are dispatched. Call or click WhatsApp to confirm now.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('orders');
                    setOrderStatusFilter('Pending Phone Confirmation');
                  }}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold uppercase tracking-wider rounded-lg shrink-0 cursor-pointer"
                >
                  View Pending Orders
                </button>
              </div>
            )}

            {/* Daily Order Volume Bar Chart (Last 7 Days via Recharts) */}
            <AdminOrderChart orders={orders} />

            {/* Recent Orders Section */}
            <div className="bg-white rounded-xl border border-[#B8893B]/20 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E8DDD0] flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg font-medium text-[#1F1F1F]">
                    Recent Orders
                  </h2>
                  <p className="text-xs text-[#575757] mt-0.5">
                    Latest orders placed via Cash on Delivery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-[#B8893B] hover:text-[#0B0D12] uppercase tracking-wider"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#575757] uppercase tracking-wider text-[11px] border-b border-[#E8DDD0]">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">City / Phone</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF7F2]">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.orderNumber} className="hover:bg-[#FAF7F2]/60">
                        <td className="py-3 px-4 font-mono font-semibold text-[#0B0D12]">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1F1F1F]">
                          {order.customer.fullName}
                          <span className="block text-[10px] text-[#8A8A8A]">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#575757]">
                          <div>{order.customer.city}</div>
                          <a
                            href={`tel:${order.customer.phone}`}
                            className="font-mono text-[11px] text-[#B8893B] hover:underline"
                          >
                            {order.customer.phone}
                          </a>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#1F1F1F]">
                          {formatPKR(order.total)}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <a
                            href={getWhatsAppConfirmationUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium"
                            title="Send WhatsApp Confirmation"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForModal(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#E8DDD0] text-[#1F1F1F] rounded text-[11px] font-medium border border-[#E8DDD0] cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={openNewProductModal}
                className="bg-white p-5 rounded-xl border border-[#B8893B]/20 hover:border-[#B8893B] shadow-xs cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#FAF7F2] group-hover:bg-[#B8893B] text-[#B8893B] group-hover:text-white flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-medium text-[#1F1F1F] group-hover:text-[#B8893B] transition-colors">
                    Add New Jewellery Piece
                  </h3>
                  <p className="text-xs text-[#575757]">
                    Upload image, set PKR price, and choose category
                  </p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('settings')}
                className="bg-white p-5 rounded-xl border border-[#B8893B]/20 hover:border-[#B8893B] shadow-xs cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#FAF7F2] group-hover:bg-[#B8893B] text-[#B8893B] group-hover:text-white flex items-center justify-center transition-colors">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-medium text-[#1F1F1F] group-hover:text-[#B8893B] transition-colors">
                    Announcement & COD Rates
                  </h3>
                  <p className="text-xs text-[#575757]">
                    Edit top announcement bar and free delivery limits
                  </p>
                </div>
              </div>

              <div
                onClick={handleResetCatalog}
                className="bg-white p-5 rounded-xl border border-[#B8893B]/20 hover:border-[#B8893B] shadow-xs cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-lg bg-[#FAF7F2] group-hover:bg-[#0B0D12] text-[#575757] group-hover:text-white flex items-center justify-center transition-colors">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-medium text-[#1F1F1F] group-hover:text-[#0B0D12] transition-colors">
                    Restore Default Catalog
                  </h3>
                  <p className="text-xs text-[#575757]">
                    Reset to 16 initial authentic Zarina Jewels items
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: ORDERS MANAGEMENT ===================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-[#B8893B]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by Order ID, customer, phone (03XX), city..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-lg text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden focus:border-[#B8893B]"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Pending Call', value: 'Pending Phone Confirmation' },
                  { label: 'Confirmed', value: 'Confirmed' },
                  { label: 'Dispatched', value: 'Dispatched' },
                  { label: 'Delivered', value: 'Delivered' },
                  { label: 'Cancelled', value: 'Cancelled' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setOrderStatusFilter(s.value)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      orderStatusFilter === s.value
                        ? 'bg-[#0B0D12] text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-[#575757] hover:bg-[#E8DDD0]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-[#B8893B]/20 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#575757] uppercase tracking-wider text-[11px] border-b border-[#E8DDD0]">
                    <tr>
                      <th className="py-3.5 px-4">Order ID & Date</th>
                      <th className="py-3.5 px-4">Customer Details</th>
                      <th className="py-3.5 px-4">Delivery Address</th>
                      <th className="py-3.5 px-4">Items Summary</th>
                      <th className="py-3.5 px-4">Total (COD)</th>
                      <th className="py-3.5 px-4">Status & Action</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF7F2]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-[#8A8A8A]">
                          No orders found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.orderNumber} className="hover:bg-[#FAF7F2]/50">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-[#0B0D12] block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-[#8A8A8A]">
                              {new Date(order.createdAt).toLocaleDateString('en-PK', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#1F1F1F]">
                              {order.customer.fullName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-[#B8893B]" />
                              <a
                                href={`tel:${order.customer.phone}`}
                                className="font-mono text-[11px] text-[#1F1F1F] hover:underline"
                              >
                                {order.customer.phone}
                              </a>
                            </div>
                            {order.customer.email && (
                              <div className="text-[10px] text-[#8A8A8A] truncate max-w-[140px]">
                                {order.customer.email}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-[#575757] max-w-xs">
                            <div className="font-medium text-[#1F1F1F]">
                              {order.customer.city}, {order.customer.province}
                            </div>
                            <div className="text-[11px] text-[#7A7A7A] line-clamp-2">
                              {order.customer.address}
                            </div>
                            {order.customer.notes && (
                              <div className="text-[10px] italic text-[#B8893B] mt-0.5">
                                Note: {order.customer.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#1F1F1F]">
                              {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                            </div>
                            <div className="text-[11px] text-[#7A7A7A] max-w-[180px] truncate">
                              {order.items.map((i) => i.product.name).join(', ')}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-[#0B0D12]">
                            {formatPKR(order.total)}
                            <span className="block text-[10px] font-normal text-emerald-800">
                              Cash on Delivery
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(order.orderNumber, e.target.value as OrderStatus)
                              }
                              className="text-xs font-semibold rounded-md border border-[#E8DDD0] bg-white px-2.5 py-1.5 focus:outline-hidden focus:border-[#B8893B]"
                            >
                              <option value="Pending Phone Confirmation">Pending Call</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <a
                              href={getWhatsAppConfirmationUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium"
                              title="Send WhatsApp Confirmation"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span className="hidden lg:inline">WhatsApp</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => setSelectedOrderForModal(order)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#FAF7F2] hover:bg-[#E8DDD0] text-[#1F1F1F] rounded text-[11px] font-medium border border-[#E8DDD0] cursor-pointer"
                              title="View Invoice & Receipt"
                            >
                              <Printer className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.orderNumber)}
                              className="inline-flex items-center gap-1 p-1 text-[#8A8A8A] hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: PRODUCTS & INVENTORY ===================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Header with Search and Add Product Button */}
            <div className="bg-white p-4 rounded-xl border border-[#B8893B]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by jewellery piece name or tag..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-lg text-[#1F1F1F] placeholder-[#8A8A8A] focus:outline-hidden focus:border-[#B8893B]"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-lg px-3 py-2 text-[#1F1F1F] focus:outline-hidden"
                >
                  <option value="all">All Categories</option>
                  <option value="earrings">Earrings</option>
                  <option value="necklaces">Necklaces</option>
                  <option value="rings">Rings</option>
                  <option value="bracelets">Bracelets</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="px-3 py-2 text-xs text-[#575757] hover:text-[#0B0D12] bg-[#FAF7F2] hover:bg-[#E8DDD0] rounded-lg border border-[#E8DDD0] transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>

                <button
                  type="button"
                  onClick={openNewProductModal}
                  className="px-4 py-2 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-[#B8893B]/20 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#575757] uppercase tracking-wider text-[11px] border-b border-[#E8DDD0]">
                    <tr>
                      <th className="py-3.5 px-4">Item</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price (PKR)</th>
                      <th className="py-3.5 px-4">Compare At</th>
                      <th className="py-3.5 px-4">Status & Badges</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF7F2]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-14 rounded overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8DDD0]">
                              <ProductImage
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                sizes="48px"
                              />
                            </div>
                            <div>
                              <div className="font-serif text-sm font-medium text-[#1F1F1F]">
                                {p.name}
                              </div>
                              <span className="text-[10px] text-[#8A8A8A] font-mono">
                                /{p.slug}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 uppercase text-[11px] font-semibold text-[#B8893B]">
                          {p.category}
                        </td>

                        <td className="py-3 px-4 font-bold text-[#1F1F1F]">
                          {formatPKR(p.price)}
                        </td>

                        <td className="py-3 px-4 text-[#8A8A8A] line-through">
                          {p.compareAtPrice ? formatPKR(p.compareAtPrice) : '—'}
                        </td>

                        <td className="py-3 px-4 space-x-1.5">
                          {p.isNew && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#B8893B]/20 text-[#B8893B]">
                              New
                            </span>
                          )}
                          {p.isBestSeller && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B0D12] text-white">
                              Best Seller
                            </span>
                          )}
                          {p.inStock ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                              Out of Stock
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-2">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 p-1.5 text-[#575757] hover:text-[#0B0D12]"
                            title="Preview on Store"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="inline-flex items-center gap-1 p-1.5 text-[#575757] hover:text-[#B8893B] cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="inline-flex items-center gap-1 p-1.5 text-[#8A8A8A] hover:text-rose-600 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: STORE SETTINGS & COD ===================== */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#B8893B]/20 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD0] mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-[#1F1F1F]">
                    Storefront & Delivery Settings
                  </h2>
                  <p className="text-xs text-[#575757] mt-1">
                    Manage top banner text, WhatsApp order hotline, and shipping limits
                  </p>
                </div>
                {settingsSavedToast && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Settings Saved!</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Announcement Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1F1F1F]">
                      Top Announcement Bar
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-[#575757]">
                      <input
                        type="checkbox"
                        checked={settings.announcementEnabled}
                        onChange={(e) =>
                          setSettings({ ...settings, announcementEnabled: e.target.checked })
                        }
                        className="rounded text-[#B8893B] focus:ring-[#B8893B]"
                      />
                      <span>Enable Top Banner</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) =>
                      setSettings({ ...settings, announcementText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                  />
                </div>

                {/* Shipping Rates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                      Flat Shipping Rate (PKR)
                    </label>
                    <input
                      type="number"
                      value={settings.flatShippingRate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          flatShippingRate: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                    <span className="text-[10px] text-[#8A8A8A] block mt-1">
                      Default standard COD delivery across Pakistan: Rs. 250
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                      Free Shipping Threshold (PKR)
                    </label>
                    <input
                      type="number"
                      value={settings.freeShippingThreshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          freeShippingThreshold: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                    <span className="text-[10px] text-[#8A8A8A] block mt-1">
                      Orders above this amount receive free delivery (e.g. Rs. 3,500)
                    </span>
                  </div>
                </div>

                {/* Contact and WhatsApp Hotline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                      WhatsApp Hotline Number
                    </label>
                    <input
                      type="text"
                      value={settings.whatsappNumber}
                      onChange={(e) =>
                        setSettings({ ...settings, whatsappNumber: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                    <span className="text-[10px] text-[#8A8A8A] block mt-1">
                      Format: +923001234567
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) =>
                        setSettings({ ...settings, contactPhone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1.5">
                    Studio & Showroom Address
                  </label>
                  <input
                    type="text"
                    value={settings.studioAddress}
                    onChange={(e) =>
                      setSettings({ ...settings, studioAddress: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                  />
                </div>

                <div className="pt-4 border-t border-[#E8DDD0] flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0B0D12] hover:bg-[#B8893B] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ===================== ORDER DETAIL & PACKING SLIP MODAL ===================== */}
      <AnimatePresence>
        {selectedOrderForModal && (
          <div className="admin-print-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="admin-print-card bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#B8893B]/30 p-6 sm:p-8"
            >
              {/* Print-Only Formal Company Header */}
              <div className="hidden admin-print-only pb-4 mb-4 border-b-2 border-black">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="font-serif text-2xl font-bold uppercase tracking-wider text-black">
                      Zarina Jewels
                    </h1>
                    <p className="text-xs text-gray-800 font-medium">Artisanal Artificial Jewellery • Pakistan</p>
                    <p className="text-[11px] text-gray-700">Studio & Showroom: Gulberg III, M.M. Alam Road, Lahore</p>
                    <p className="text-[11px] text-gray-700">Hotline: +92 300 1234567 • support@zarinajewels.pk</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 bg-black text-white text-[11px] font-bold uppercase tracking-widest">
                      COD Dispatch Slip
                    </span>
                    <h2 className="font-mono text-xl font-bold mt-1 text-black">
                      #{selectedOrderForModal.orderNumber}
                    </h2>
                    <p className="text-[11px] text-gray-800">
                      Date: {new Date(selectedOrderForModal.createdAt).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* On-Screen Modal Header */}
              <div className="no-print flex items-center justify-between pb-4 border-b border-[#E8DDD0]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#B8893B]">
                    Zarina Jewels Packing Slip
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-[#0B0D12]">
                    Order #{selectedOrderForModal.orderNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForModal(null)}
                  className="no-print modal-close-btn p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#575757]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer & Shipping Summary */}
              <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#FAF7F2] text-xs">
                <div>
                  <h4 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] mb-1">
                    Customer Information
                  </h4>
                  <p className="font-medium text-sm text-[#0B0D12]">
                    {selectedOrderForModal.customer.fullName}
                  </p>
                  <p className="text-[#575757] font-mono mt-0.5">
                    Phone: {selectedOrderForModal.customer.phone}
                  </p>
                  {selectedOrderForModal.customer.whatsapp && (
                    <p className="text-emerald-700 font-mono">
                      WhatsApp: {selectedOrderForModal.customer.whatsapp}
                    </p>
                  )}
                  {selectedOrderForModal.customer.email && (
                    <p className="text-[#575757]">
                      Email: {selectedOrderForModal.customer.email}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] mb-1">
                    Delivery Address
                  </h4>
                  <p className="text-[#1F1F1F] leading-relaxed">
                    {selectedOrderForModal.customer.address}
                  </p>
                  <p className="font-medium text-[#0B0D12] mt-0.5">
                    {selectedOrderForModal.customer.city}, {selectedOrderForModal.customer.province}
                  </p>
                  {selectedOrderForModal.customer.notes && (
                    <div className="mt-2 p-2 bg-[#FAF7F2] rounded text-[#B8893B] italic">
                      Note: {selectedOrderForModal.customer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Print-Only Formatted Items Table */}
              <table className="hidden admin-print-only admin-print-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Jewellery Piece</th>
                    <th>Variant (Color / Size)</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderForModal.items.map((item, idx) => (
                    <tr key={item.cartItemId}>
                      <td>{idx + 1}</td>
                      <td className="font-medium">{item.product.name}</td>
                      <td>
                        {item.selectedColor}
                        {item.selectedSize ? ` (${item.selectedSize})` : ''}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatPKR(item.product.price)}</td>
                      <td className="font-semibold">
                        {formatPKR(item.product.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* On-Screen Items List Preview */}
              <div className="no-print py-4">
                <h4 className="font-semibold text-[#1F1F1F] uppercase tracking-wider text-[11px] mb-3">
                  Ordered Items
                </h4>
                <div className="space-y-3">
                  {selectedOrderForModal.items.map((item) => (
                    <div
                      key={item.cartItemId}
                      className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-white shrink-0">
                          <ProductImage
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <p className="font-serif text-sm font-medium text-[#1F1F1F]">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-[#575757]">
                            Qty: {item.quantity} • {item.selectedColor}
                            {item.selectedSize ? ` (${item.selectedSize})` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#1F1F1F]">
                        {formatPKR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Totals */}
              <div className="pt-3 border-t border-[#E8DDD0] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#575757]">
                  <span>Subtotal</span>
                  <span>{formatPKR(selectedOrderForModal.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#575757]">
                  <span>Delivery Charges (Pakistan)</span>
                  <span>
                    {selectedOrderForModal.shipping === 0
                      ? 'FREE'
                      : formatPKR(selectedOrderForModal.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#0B0D12] pt-2 border-t border-[#FAF7F2]">
                  <span>Total Payable on Delivery (COD)</span>
                  <span className="text-[#B8893B] text-lg">
                    {formatPKR(selectedOrderForModal.total)}
                  </span>
                </div>
              </div>

              {/* Print-Only Rider Cash Collection Box */}
              <div className="hidden admin-print-only admin-print-highlight">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-black block">
                      Cash to Collect from Customer (COD)
                    </span>
                    <span className="text-[11px] text-gray-700">
                      Rider note: Please collect exact payment prior to parcel handover.
                    </span>
                  </div>
                  <div className="text-xl font-bold text-black font-mono">
                    {formatPKR(selectedOrderForModal.total)}
                  </div>
                </div>
              </div>

              {/* Print-Only Signature & Receipt Footer */}
              <div className="hidden admin-print-only mt-8 pt-4 border-t border-gray-400 text-xs">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="border-b border-black pb-8"></div>
                    <span className="block mt-1 font-semibold text-[10px] uppercase">
                      Packed & Checked By
                    </span>
                  </div>
                  <div>
                    <div className="border-b border-black pb-8"></div>
                    <span className="block mt-1 font-semibold text-[10px] uppercase">
                      Courier Rider Signature
                    </span>
                  </div>
                  <div>
                    <div className="border-b border-black pb-8"></div>
                    <span className="block mt-1 font-semibold text-[10px] uppercase">
                      Customer Signature
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-600 text-center mt-4">
                  Zarina Jewels • 7-Day Exchange & Return Policy on unworn pieces with tags intact. WhatsApp: +92 300 1234567.
                </p>
              </div>

              {/* On-Screen Modal Actions */}
              <div className="no-print modal-actions-bar mt-6 pt-4 border-t border-[#E8DDD0] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#575757]">Status:</span>
                  <select
                    value={selectedOrderForModal.status}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedOrderForModal.orderNumber,
                        e.target.value as OrderStatus
                      )
                    }
                    className="text-xs font-semibold rounded border border-[#E8DDD0] bg-[#FAF7F2] px-2 py-1"
                  >
                    <option value="Pending Phone Confirmation">Pending Call</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getWhatsAppConfirmationUrl(selectedOrderForModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Customer</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-[#0B0D12] hover:bg-[#B8893B] text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================== ADD / EDIT PRODUCT MODAL ===================== */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#B8893B]/30 p-6 sm:p-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD0]">
                <h3 className="font-serif text-2xl font-normal text-[#0B0D12]">
                  {editingProduct ? 'Edit Jewellery Piece' : 'Add New Jewellery Piece'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#FAF7F2] text-[#575757]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="py-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                    Piece Name *
                  </label>
                  <input
                    type="text"
                    value={prodFormName}
                    onChange={(e) => setProdFormName(e.target.value)}
                    placeholder="e.g. Royal Emerald Kundan Choker Set"
                    required
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                      Category *
                    </label>
                    <select
                      value={prodFormCategory}
                      onChange={(e) => setProdFormCategory(e.target.value as ProductCategory)}
                      className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    >
                      <option value="earrings">Earrings</option>
                      <option value="necklaces">Necklaces</option>
                      <option value="rings">Rings</option>
                      <option value="bracelets">Bracelets</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                      Price (PKR) *
                    </label>
                    <input
                      type="number"
                      value={prodFormPrice}
                      onChange={(e) => setProdFormPrice(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                      Compare Price (PKR)
                    </label>
                    <input
                      type="number"
                      value={prodFormComparePrice}
                      onChange={(e) => setProdFormComparePrice(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                  </div>
                </div>

                {/* Image Selection / Presets */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={prodFormImage}
                    onChange={(e) => setProdFormImage(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                  />
                  <span className="text-[10px] text-[#8A8A8A] mt-1 block">
                    Or select from curated jewellery image presets:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                    {PRESET_JEWELLERY_IMAGES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setProdFormImage(preset.url)}
                        className={`relative aspect-square rounded overflow-hidden border-2 cursor-pointer transition-all ${
                          prodFormImage === preset.url
                            ? 'border-[#B8893B] ring-2 ring-[#B8893B]/30'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        <ProductImage
                          src={preset.url}
                          alt={preset.name}
                          fill
                          sizes="60px"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={prodFormDescription}
                    onChange={(e) => setProdFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                  />
                </div>

                {/* Colors & Sizes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                      Color Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={prodFormColors}
                      onChange={(e) => setProdFormColors(e.target.value)}
                      placeholder="Gold-Tone, Silver Finish, Rose Gold"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[#1F1F1F] mb-1">
                      Size Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={prodFormSizes}
                      onChange={(e) => setProdFormSizes(e.target.value)}
                      placeholder="Standard, 2.4, 2.6, Adjustable"
                      className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-md text-[#1F1F1F] focus:outline-hidden focus:border-[#B8893B]"
                    />
                  </div>
                </div>

                {/* Flags */}
                <div className="flex flex-wrap items-center gap-5 pt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFormIsNew}
                      onChange={(e) => setProdFormIsNew(e.target.checked)}
                      className="rounded text-[#B8893B] focus:ring-[#B8893B]"
                    />
                    <span className="font-medium text-[#1F1F1F]">Mark as New Arrival</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFormIsBestSeller}
                      onChange={(e) => setProdFormIsBestSeller(e.target.checked)}
                      className="rounded text-[#B8893B] focus:ring-[#B8893B]"
                    />
                    <span className="font-medium text-[#1F1F1F]">Mark as Best Seller</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodFormInStock}
                      onChange={(e) => setProdFormInStock(e.target.checked)}
                      className="rounded text-[#B8893B] focus:ring-[#B8893B]"
                    />
                    <span className="font-medium text-[#1F1F1F]">In Stock</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#E8DDD0] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 border border-[#E8DDD0] text-[#575757] rounded-md hover:bg-[#FAF7F2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0B0D12] hover:bg-[#B8893B] text-white font-semibold uppercase tracking-wider rounded-md transition-colors"
                  >
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
