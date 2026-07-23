import { comprimirImagen } from '../img';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Tenant, Product, Order, Collaborator, Variant, ProductDetailField } from '../types';
import { 
  Shield, Key, User, LayoutDashboard, Plus, Trash2, Edit, Save, 
  Settings, Users, ShoppingCart, Percent, Tag, Sliders, Bell, 
  Search, Image, Eye, ArrowUpRight, BarChart3, TrendingUp, Check, 
  AlertCircle, Smartphone, Send, Power, Camera, CheckSquare, X, Upload,
  Calendar, Clock, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../translations';

interface TenantAdminProps {
  tenant: Tenant;
  products: Product[];
  orders: Order[];
  collaborators: Collaborator[];
  onUpdateTenant: (updatedTenant: Tenant) => void;
  onUpdateProducts: (updatedProducts: Product[]) => void;
  onUpdateCollaborators: (updatedCollaborators: Collaborator[]) => void;
  onUpdateOrders: (updatedOrders: Order[]) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  role: 'admin' | 'collaborator';
  language: 'es' | 'en';
  onChangeLanguage: (lang: 'es' | 'en') => void;
  onChangeRole?: (role: 'customer' | 'admin' | 'collaborator') => void;
  presence?: Record<string, { online: boolean; last_seen: string }>;
  onKickColab?: (usuario: string) => void;
  onListBackups?: () => Promise<any[]>;
  onRestoreBackup?: (id: number) => Promise<boolean>;
}

export default function TenantAdmin({
  tenant,
  products,
  orders,
  collaborators,
  onUpdateTenant,
  onUpdateProducts,
  onUpdateCollaborators,
  onUpdateOrders,
  isLoggedIn,
  onLogin,
  onLogout,
  role,
  language,
  onChangeLanguage,
  onChangeRole,
  presence,
  onKickColab,
  onListBackups,
  onRestoreBackup,
}: TenantAdminProps) {
  // Copias de seguridad (rollback)
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsOpen, setBackupsOpen] = useState(false);
  const [backupsBusy, setBackupsBusy] = useState(false);
  const cargarBackups = async () => {
    if (!onListBackups) return;
    setBackupsBusy(true);
    try { setBackups(await onListBackups()); setBackupsOpen(true); }
    finally { setBackupsBusy(false); }
  };
  const restaurarBackup = async (id: number) => {
    if (!onRestoreBackup) return;
    if (!window.confirm('¿Restaurar esta copia? Se reemplazan los datos actuales por los de esa fecha. (La versión actual queda guardada por las dudas.)')) return;
    setBackupsBusy(true);
    try {
      const ok = await onRestoreBackup(id);
      alert(ok ? '✅ Copia restaurada. Ya están cargados los datos de esa fecha.' : 'No se pudo restaurar. Probá de nuevo.');
      if (ok) setBackupsOpen(false);
    } finally { setBackupsBusy(false); }
  };
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;
  // ¿Está online un colaborador? (presencia real; latido reciente < 90s)
  const isColabOnline = (col: Collaborator): boolean => {
    const p = presence && col.username ? presence[col.username.toLowerCase()] : undefined;
    if (!p) return false;
    if (!p.online) return false;
    const last = p.last_seen ? new Date(p.last_seen).getTime() : 0;
    return (Date.now() - last) < 90000;
  };
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'collaborators' | 'settings'>('dashboard');
  
  // Login State
  const [licenseInput, setLicenseInput] = useState(tenant.license);
  const [userInput, setUserInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Biometric login simulation
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const [hasBiometricRegistration, setHasBiometricRegistration] = useState(false);
  const [saveBiometricsOptIn, setSaveBiometricsOptIn] = useState(false);

  // New product form
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(0);
  const [prodImages, setProdImages] = useState<string[]>(['', '', '']);
  const [prodCats, setProdCats] = useState<string[]>([]);
  const [prodTags, setProdTags] = useState<string[]>([]);
  const [prodVariants, setProdVariants] = useState<Variant[]>([
    { name: 'Talle', values: ['38', '39', '40'] },
    { name: 'Color', values: ['Negro', 'Blanco'] }
  ]);
  const [prodDetails, setProdDetails] = useState<ProductDetailField[]>([]);
  const [prodInStock, setProdInStock] = useState(true);
  const [prodIsPromo, setProdIsPromo] = useState(false);
  const [prodIsNew, setProdIsNew] = useState(false);

  // New details/variants temp input
  const [tempTag, setTempTag] = useState('');
  const [tempVariantName, setTempVariantName] = useState('');
  const [tempVariantValues, setTempVariantValues] = useState('');
  const [tempDetailLabel, setTempDetailLabel] = useState('');
  const [tempDetailValue, setTempDetailValue] = useState('');

  // Collaborator Form
  const [showColabModal, setShowColabModal] = useState(false);
  const [editingColab, setEditingColab] = useState<Collaborator | null>(null);
  const [colabName, setColabName] = useState('');
  const [colabPhone, setColabPhone] = useState('');
  const [colabUsername, setColabUsername] = useState('');
  const [colabPassword, setColabPassword] = useState('');
  const [colabAvatar, setColabAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');

  // Push notification state simulation
  const [pushNotification, setPushNotification] = useState<{ title: string; body: string } | null>(null);

  // Notifications Bell tracking
  const [unseenOrders, setUnseenOrders] = useState<string[]>([]);

  useEffect(() => {
    // Detect new orders for the unseen bell counter
    const preparationOrders = orders
      .filter(o => o.tenantId === tenant.id && o.status === 'preparation')
      .map(o => o.id);
    setUnseenOrders(preparationOrders);
  }, [orders, tenant.id]);

  // Handle standard login
  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (role === 'admin') {
      if (licenseInput === tenant.license && userInput === tenant.username && passInput === tenant.passwordHash) {
        onLogin();
        if (saveBiometricsOptIn) {
          localStorage.setItem(`biometrics_admin_${tenant.id}`, 'true');
          setHasBiometricRegistration(true);
        }
      } else {
        setLoginError(language === 'en' 
          ? 'Incorrect credentials. Please verify your license, username, or password.'
          : 'Credenciales incorrectas. Verifique licencia, usuario o contraseña.');
      }
    } else {
      // Collaborator login validation
      const tenantColabs = collaborators.filter(c => c.tenantId === tenant.id);
      
      // Let's check if the input matches any collaborator of this tenant
      // We check case-insensitive match for name and exact/clean match for phone number.
      // We also support a fallback generic "colab" with password "123" or "123456" in case none exist or for testing ease
      const matchedColab = tenantColabs.find(c => {
        const cleanInputName = userInput.trim().toLowerCase();
        const cleanColabName = c.name.trim().toLowerCase();
        
        const cleanInputPass = passInput.trim();
        const cleanColabPhone = c.phone.trim();
        
        const matchesName = cleanColabName === cleanInputName || cleanInputName === 'colab';
        const matchesPhone = cleanColabPhone === cleanInputPass || 
                             cleanInputPass === '123456' || 
                             cleanInputPass === '123' || 
                             cleanInputPass === 'colab123';
                             
        return matchesName && matchesPhone;
      });

      if (matchedColab || (userInput.toLowerCase() === 'colab' && (passInput === '123' || passInput === '123456'))) {
        const colabToUse = matchedColab || tenantColabs[0];
        if (colabToUse) {
          setActiveColabId(colabToUse.id);
        }
        onLogin();
        if (saveBiometricsOptIn) {
          localStorage.setItem(`biometrics_colab_${tenant.id}`, 'true');
          if (colabToUse) {
            localStorage.setItem(`biometrics_colab_id_${tenant.id}`, colabToUse.id);
          }
          setHasBiometricRegistration(true);
        }
      } else {
        setLoginError(language === 'en'
          ? 'Incorrect collaborator credentials. Use your name as username and your phone or "123" as password.'
          : 'Credenciales de colaborador incorrectas. Use su nombre como usuario y su teléfono o "123" como contraseña.');
      }
    }
  };

  // Trigger simulated biometrics
  const triggerBiometricScan = () => {
    const key = role === 'admin' ? `biometrics_admin_${tenant.id}` : `biometrics_colab_${tenant.id}`;
    const registered = localStorage.getItem(key) === 'true';

    setIsBiometricScanning(true);
    setTimeout(() => {
      setIsBiometricScanning(false);
      if (registered) {
        if (role === 'collaborator') {
          const storedColabId = localStorage.getItem(`biometrics_colab_id_${tenant.id}`);
          if (storedColabId) {
            setActiveColabId(storedColabId);
          }
        }
        onLogin();
        setLoginError('');
        triggerPushNotification(
          language === 'en' ? 'Biometrics Match' : 'Biometría Correcta',
          language === 'en' ? 'Logged in securely via saved face/fingerprint data.' : 'Ingresó de forma segura mediante reconocimiento facial/dactilar.'
        );
      } else {
        setLoginError(language === 'en'
          ? 'No registered biometric profile found. Please log in with your username/password and check the "Enable Biometrics" box first.'
          : 'No se encontraron datos biométricos registrados. Por favor, inicie sesión con su usuario/contraseña y active la casilla "Registrar datos biométricos" primero.');
      }
    }, 2000);
  };

  // Toast Push Notification Simulator
  const triggerPushNotification = (title: string, body: string) => {
    setPushNotification({ title, body });
    setTimeout(() => {
      setPushNotification(null);
    }, 5000);
  };

  // Orders status changer
  const updateOrderStatus = (orderId: string, status: 'preparation' | 'prepared' | 'delivered', deliveredBy?: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status, 
          updatedAt: new Date().toISOString(),
          ...(status === 'delivered' ? { deliveredBy: deliveredBy || 'Administrador' } : {})
        };
      }
      return o;
    });
    onUpdateOrders(updated);

    if (status === 'delivered' && deliveredBy && deliveredBy !== 'Administrador') {
      const updatedColabs = collaborators.map(c => {
        if (c.name === deliveredBy && c.tenantId === tenant.id) {
          return { ...c, assignmentsCount: c.assignmentsCount + 1 };
        }
        return c;
      });
      onUpdateCollaborators(updatedColabs);
    }

    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      let message = '';
      if (status === 'prepared') {
        message = `¡Tu pedido ${targetOrder.pickupCode} en ${tenant.name} está preparado para retiro!`;
      } else if (status === 'delivered') {
        message = `¡Pedido ${targetOrder.pickupCode} entregado con éxito! Gracias por tu compra.`;
      } else {
        message = `Tu pedido ${targetOrder.pickupCode} ya está siendo procesado por nuestros asesores.`;
      }
      triggerPushNotification(`Notificación Push Enviada: ${targetOrder.customerName}`, message);
    }
  };

  // Products CRUD
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice(0);
    setProdImages(['', '', '']);
    setProdCats([]);
    setProdTags([]);
    setProdVariants([
      { name: 'Talle', values: ['37', '38', '39', '40'] },
      { name: 'Color', values: ['Negro', 'Nude'] }
    ]);
    setProdDetails([
      { label: 'Origen', value: 'Hecho a mano en Brooklyn, NY' },
      { label: 'Material', value: 'Cuero Premium' }
    ]);
    setProdInStock(true);
    setProdIsPromo(false);
    setProdIsNew(true);
    setShowProductModal(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price);
    setProdImages(p.images.length >= 3 ? [...p.images] : [...p.images, '', '', ''].slice(0, 3));
    setProdCats(p.categories);
    setProdTags(p.tags);
    setProdVariants(p.variants || []);
    setProdDetails(p.details || []);
    setProdInStock(p.inStock);
    setProdIsPromo(p.isPromo);
    setProdIsNew(p.isNew);
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || prodPrice <= 0) return;

    // Filter empty image boxes
    const imagesToSave = prodImages.filter(img => img.trim() !== '');
    if (imagesToSave.length === 0) {
      imagesToSave.push('https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80');
    }

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      tenantId: tenant.id,
      name: prodName,
      description: prodDesc,
      price: Number(prodPrice),
      images: imagesToSave,
      categories: prodCats.length > 0 ? prodCats : [tenant.categories[3] || 'Zapatos'],
      tags: prodTags,
      variants: prodVariants,
      details: prodDetails,
      inStock: prodInStock,
      isPromo: prodIsPromo,
      isNew: prodIsNew
    };

    let updatedList: Product[];
    if (editingProduct) {
      updatedList = products.map(p => p.id === editingProduct.id ? productData : p);
    } else {
      updatedList = [...products, productData];
    }

    onUpdateProducts(updatedList);
    setShowProductModal(false);
    triggerPushNotification('Inventario Actualizado', `Se ha guardado el calzado "${prodName}" en el catálogo.`);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Está seguro de eliminar este calzado del inventario?')) {
      const updated = products.filter(p => p.id !== id);
      onUpdateProducts(updated);
      triggerPushNotification('Producto Eliminado', 'El artículo ha sido removido del stock.');
    }
  };

  // Dynamic Add Variants or Details
  const addTag = () => {
    if (tempTag.trim() && !prodTags.includes(tempTag.trim())) {
      setProdTags([...prodTags, tempTag.trim()]);
      setTempTag('');
    }
  };

  const removeTag = (t: string) => {
    setProdTags(prodTags.filter(item => item !== t));
  };

  const addVariant = () => {
    if (tempVariantName.trim() && tempVariantValues.trim()) {
      const valuesArray = tempVariantValues.split(',').map(v => v.trim()).filter(Boolean);
      setProdVariants([...prodVariants, { name: tempVariantName.trim(), values: valuesArray }]);
      setTempVariantName('');
      setTempVariantValues('');
    }
  };

  const removeVariant = (idx: number) => {
    setProdVariants(prodVariants.filter((_, i) => i !== idx));
  };

  const addDetailField = () => {
    if (tempDetailLabel.trim() && tempDetailValue.trim()) {
      setProdDetails([...prodDetails, { label: tempDetailLabel.trim(), value: tempDetailValue.trim() }]);
      setTempDetailLabel('');
      setTempDetailValue('');
    }
  };

  const removeDetailField = (idx: number) => {
    setProdDetails(prodDetails.filter((_, i) => i !== idx));
  };

  // Collaborators Management
  const openNewColabModal = () => {
    setEditingColab(null);
    setColabName('');
    setColabPhone('');
    setColabUsername('');
    setColabPassword('');
    setColabAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    setShowColabModal(true);
  };

  const openEditColabModal = (col: Collaborator) => {
    setEditingColab(col);
    setColabName(col.name);
    setColabPhone(col.phone);
    setColabUsername(col.username || '');
    setColabPassword(col.password || '');
    setColabAvatar(col.avatarUrl);
    setShowColabModal(true);
  };

  const handleSaveColab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colabName || !colabPhone) return;
    const uName = colabUsername.trim();
    const uPass = colabPassword.trim();
    if (!uName || uPass.length < 6) {
      alert('El vendedor necesita un usuario y una contraseña de al menos 6 caracteres para poder ingresar al panel.');
      return;
    }

    const colabData: Collaborator = {
      id: editingColab ? editingColab.id : `colab-${Date.now()}`,
      tenantId: tenant.id,
      name: colabName,
      phone: colabPhone,
      username: uName,
      password: uPass,
      avatarUrl: colabAvatar,
      onlineStatus: editingColab ? editingColab.onlineStatus : 'active',
      salesCount: editingColab ? editingColab.salesCount : 0,
      assignmentsCount: editingColab ? editingColab.assignmentsCount : 0,
      isActiveSession: true
    };

    let updated: Collaborator[];
    if (editingColab) {
      updated = collaborators.map(c => c.id === editingColab.id ? colabData : c);
    } else {
      updated = [...collaborators, colabData];
    }

    onUpdateCollaborators(updated);
    setShowColabModal(false);
    triggerPushNotification('Colaborador Guardado', `Se actualizó la ficha de ${colabName}`);
  };

  const handleDeleteColab = (id: string) => {
    if (confirm('¿Está seguro de remover a este colaborador?')) {
      // Borrado SUAVE: lo marcamos como eliminado en vez de sacarlo. Así el
      // borrado se respeta al fusionar las listas del celular y la PC (si lo
      // sacáramos, el otro dispositivo lo volvería a agregar).
      const updated = collaborators.map(c =>
        c.id === id ? ({ ...c, eliminado: true, username: '', password: '' } as any) : c
      );
      onUpdateCollaborators(updated);
    }
  };

  const forceLogoutColab = (id: string) => {
    const updated = collaborators.map(c => {
      if (c.id === id) {
        return { ...c, isActiveSession: false, onlineStatus: 'inactive' as const };
      }
      return c;
    });
    onUpdateCollaborators(updated);
    triggerPushNotification('Sesión Cerrada', 'Colaborador desconectado por seguridad.');
  };

  const toggleColabOnline = (id: string) => {
    const updated = collaborators.map(c => {
      if (c.id === id) {
        const nextStatus = c.onlineStatus === 'active' ? 'inactive' : 'active';
        return { ...c, onlineStatus: nextStatus as 'active' | 'inactive' };
      }
      return c;
    });
    onUpdateCollaborators(updated);
  };

  // SEO/Brand Settings Saver
  const [settsName, setSettsName] = useState(tenant.name);
  const [settsPhone, setSettsPhone] = useState(tenant.phone);
  const [settsEmail, setSettsEmail] = useState(tenant.email);
  const [settsDesc, setSettsDesc] = useState(tenant.description);
  const [settsSeoTitle, setSettsSeoTitle] = useState(tenant.seoTitle);
  const [settsSeoDesc, setSettsSeoDesc] = useState(tenant.seoDescription);
  const [settsSeoKeys, setSettsSeoKeys] = useState(tenant.seoKeywords);
  const [settsHero, setSettsHero] = useState(tenant.heroImage);
  const [settsDefaultLang, setSettsDefaultLang] = useState<'es' | 'en'>(tenant.defaultLanguage || 'es');
  const [settsAddress, setSettsAddress] = useState(tenant.address || '');
  const [settsGoogleMapsUrl, setSettsGoogleMapsUrl] = useState(tenant.googleMapsUrl || '');
  const [settsPhonePrefix, setSettsPhonePrefix] = useState(tenant.phonePrefix || '+54 9 ');
  const [settsCurrencySymbol, setSettsCurrencySymbol] = useState(tenant.currencySymbol || 'USD');
  const [newCatName, setNewCatName] = useState('');
  const [orderToDeliver, setOrderToDeliver] = useState<Order | null>(null);
  const [isClearHistoryEnabled, setIsClearHistoryEnabled] = useState(false);
  const [selectedDeliverer, setSelectedDeliverer] = useState('Administrador');
  const [activeColabId, setActiveColabId] = useState('');

  useEffect(() => {
    const activeColabs = collaborators.filter(c => c.tenantId === tenant.id);
    if (activeColabs.length > 0 && !activeColabId) {
      setActiveColabId(activeColabs[0].id);
    }
  }, [collaborators, tenant.id, activeColabId]);

  useEffect(() => {
    setSettsName(tenant.name);
    setSettsPhone(tenant.phone);
    setSettsEmail(tenant.email);
    setSettsDesc(tenant.description);
    setSettsSeoTitle(tenant.seoTitle);
    setSettsSeoDesc(tenant.seoDescription);
    setSettsSeoKeys(tenant.seoKeywords);
    setSettsHero(tenant.heroImage);
    setSettsDefaultLang(tenant.defaultLanguage || 'es');
    setSettsAddress(tenant.address || '');
    setSettsGoogleMapsUrl(tenant.googleMapsUrl || '');
    setSettsPhonePrefix(tenant.phonePrefix || '+54 9 ');
    setSettsCurrencySymbol(tenant.currencySymbol || 'USD');
    setLicenseInput(tenant.license);
    setUserInput('');
    setPassInput('');
  }, [tenant]);

  useEffect(() => {
    const key = role === 'admin' ? `biometrics_admin_${tenant.id}` : `biometrics_colab_${tenant.id}`;
    if (localStorage.getItem(key) === 'true') {
      setHasBiometricRegistration(true);
    } else {
      setHasBiometricRegistration(false);
    }
  }, [role, tenant.id]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTenant: Tenant = {
      ...tenant,
      name: settsName,
      phone: settsPhone,
      email: settsEmail,
      description: settsDesc,
      seoTitle: settsSeoTitle,
      seoDescription: settsSeoDesc,
      seoKeywords: settsSeoKeys,
      heroImage: settsHero,
      defaultLanguage: settsDefaultLang,
      address: settsAddress,
      googleMapsUrl: settsGoogleMapsUrl,
      phonePrefix: settsPhonePrefix,
      currencySymbol: settsCurrencySymbol,
    };
    onUpdateTenant(updatedTenant);
    if (onChangeLanguage) {
      onChangeLanguage(settsDefaultLang);
    }
    triggerPushNotification('Configuración Guardada', 'Se optimizaron las meta-etiquetas SEO, datos de contacto e idioma predeterminado.');
  };

  const formatAdminPrice = (amount: number) => {
    const symbol = tenant.currencySymbol || 'USD';
    if (symbol === '$' || symbol === '€' || symbol === '£') {
      return `${symbol}${amount}`;
    }
    return `${amount} ${symbol}`;
  };

  const addCustomCategory = () => {
    if (newCatName.trim() && !tenant.categories.includes(newCatName.trim())) {
      const updatedTenant = {
        ...tenant,
        categories: [...tenant.categories, newCatName.trim()]
      };
      onUpdateTenant(updatedTenant);
      setNewCatName('');
    }
  };

  const removeCustomCategory = (cat: string) => {
    if (['Todos', 'Promo', 'Lo Nuevo'].includes(cat)) {
      alert('Las categorías base no pueden eliminarse.');
      return;
    }
    const updatedTenant = {
      ...tenant,
      categories: tenant.categories.filter(c => c !== cat)
    };
    onUpdateTenant(updatedTenant);
  };

  // Compute stats
  const activeTenantProducts = products.filter(p => p.tenantId === tenant.id);
  const activeTenantOrders = orders.filter(o => o.tenantId === tenant.id);
  const activeTenantColabs = collaborators.filter(c => c.tenantId === tenant.id && !(c as any).eliminado);

  const currentCollaborator = activeTenantColabs.find(c => c.id === activeColabId) || activeTenantColabs[0];

  const deliveredOrders = activeTenantOrders.filter(o => {
    if (o.status !== 'delivered') return false;
    if (role === 'collaborator') {
      const activeColabName = currentCollaborator ? currentCollaborator.name : '';
      return o.deliveredBy === activeColabName;
    }
    return true;
  });

  const totalSalesRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = activeTenantOrders
    .filter(o => o.status !== 'delivered').length;

  // Daily, Weekly, Monthly, Yearly Sales Computations
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const dailySales = deliveredOrders
    .filter(o => new Date(o.updatedAt || o.createdAt) >= startOfToday)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const weeklySales = deliveredOrders
    .filter(o => new Date(o.updatedAt || o.createdAt) >= startOfWeek)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const monthlySales = deliveredOrders
    .filter(o => new Date(o.updatedAt || o.createdAt) >= startOfMonth)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const yearlySales = deliveredOrders
    .filter(o => new Date(o.updatedAt || o.createdAt) >= startOfYear)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Download logic helpers
  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const deliveredRows = deliveredOrders.map(o => {
      const itemsStr = o.items.map(item => item.name + ' (' + item.quantity + ')').join(', ');
      const concretadoStr = (o.deliveredBy || 'Administrador').toUpperCase();
      return '<tr>' +
        '<td style="padding: 12px; font-family: monospace; font-weight: bold; border-bottom: 1px solid #e5e7eb; color: #f59e0b;">' + o.pickupCode + '</td>' +
        '<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>' + o.customerName + '</strong><br/><small style="color: #6b7280; font-family: monospace;">' + o.customerPhone + '</small></td>' +
        '<td style="padding: 12px; font-family: monospace; border-bottom: 1px solid #e5e7eb;">' + itemsStr + '</td>' +
        '<td style="padding: 12px; font-family: monospace; font-weight: bold; border-bottom: 1px solid #e5e7eb;">' + formatAdminPrice(o.totalAmount) + '</td>' +
        '<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><span style="padding: 4px 8px; background-color: #111827; color: #f59e0b; border: 1px solid #374151; font-family: monospace; font-size: 11px; border-radius: 4px;">' + concretadoStr + '</span></td>' +
        '<td style="padding: 12px; font-family: monospace; font-size: 11px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">' + new Date(o.updatedAt || o.createdAt).toLocaleDateString() + '</td>' +
      '</tr>';
    }).join('');

    printWindow.document.write(
      '<html>' +
        '<head>' +
          '<title>Reporte de Entregas - ' + tenant.name + '</title>' +
          '<style>' +
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111827; }' +
            'h1 { font-size: 28px; margin-bottom: 5px; }' +
            '.meta { font-family: monospace; font-size: 11px; color: #4b5563; margin-bottom: 30px; border-bottom: 2px solid #111827; padding-bottom: 15px; }' +
            'table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }' +
            'th { background-color: #111827; color: #9ca3af; padding: 12px; text-align: left; font-family: monospace; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #374151; }' +
            '.total-box { margin-top: 40px; border-top: 1px solid #111827; padding-top: 15px; text-align: right; font-family: monospace; font-size: 16px; font-weight: bold; }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
            '<div>' +
              '<h1>' + tenant.name.toUpperCase() + '</h1>' +
              '<p style="font-size: 12px; color: #4b5563; margin: 2px 0;">REPORTE DE ENTREGAS DETALLADO</p>' +
            '</div>' +
            '<div style="text-align: right; font-family: monospace; font-size: 11px;">' +
              '<strong>FECHA:</strong> ' + new Date().toLocaleDateString() + '<br/>' +
              '<strong>LICENCIA:</strong> ' + tenant.license +
            '</div>' +
          '</div>' +
          '<div class="meta">' +
            'REGISTRO DE LAS VENTAS ENTREGADAS EN BOUTIQUE.' +
          '</div>' +
          '<table>' +
            '<thead>' +
              '<tr>' +
                '<th>CÓDIGO RETIRO</th>' +
                '<th>CLIENTE</th>' +
                '<th>DETALLE CALZADO</th>' +
                '<th>TOTAL COBRADO</th>' +
                '<th>CONCRETADO POR</th>' +
                '<th>FECHA DE ENTREGA</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              (deliveredRows.length > 0 ? deliveredRows : '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #6b7280;">No hay entregas registradas.</td></tr>') +
            '</tbody>' +
          '</table>' +
          '<div class="total-box">' +
            'TOTAL CONCRETADO: ' + formatAdminPrice(totalSalesRevenue) +
          '</div>' +
          '<script>' +
            'window.onload = function() { window.print(); };' +
          '</script>' +
        '</body>' +
      '</html>'
    );
    printWindow.document.close();
  };

  const handlePrintQR = () => {
    const publicLink = window.location.origin + '/?codigo=' + tenant.license;
    const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=10&data=' + encodeURIComponent(publicLink);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      '<html><head><title>QR - ' + tenant.name + '</title>' +
      '<style>' +
      '@page { size: A4; margin: 0; }' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; color:#111827; }' +
      '.page { width:210mm; min-height:297mm; box-sizing:border-box; padding:26mm 20mm; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; }' +
      '.name { font-size:40px; font-weight:800; letter-spacing:1px; margin:0 0 6px; }' +
      '.tag { font-size:14px; letter-spacing:4px; text-transform:uppercase; color:#b45309; margin:0 0 28px; }' +
      '.qr { width:340px; height:340px; border:2px solid #111827; border-radius:18px; padding:14px; }' +
      '.cta { font-size:26px; font-weight:800; margin:30px 0 10px; }' +
      '.sub { font-size:17px; color:#374151; max-width:150mm; line-height:1.55; margin:0 auto; }' +
      '.foot { margin-top:34px; font-size:12px; color:#9ca3af; font-family:monospace; }' +
      '</style></head><body>' +
      '<div class="page">' +
      '<div class="name">' + tenant.name.toUpperCase() + '</div>' +
      '<div class="tag">Tienda online</div>' +
      '<img class="qr" src="' + qr + '" referrerpolicy="no-referrer" alt="QR" onload="setTimeout(function(){window.print();},250)" />' +
      '<div class="cta">Escanea y mira nuestras ofertas antes que nadie</div>' +
      '<div class="sub">Apunta la camara de tu celular al codigo y entra a nuestra tienda online: mira todos los productos, precios y promos. Compra desde tu casa y retira en el local. Se el primero en enterarte de las novedades.</div>' +
      '<div class="foot">' + publicLink + '</div>' +
      '</div>' +
      '</body></html>'
    );
    w.document.close();
  };

  const handleDownloadExcel = () => {
    const headers = ['CÓDIGO RETIRO', 'CLIENTE', 'DETALLE CALZADO', 'TOTAL COBRADO', 'CONCRETADO POR', 'FECHA DE ENTREGA'];
    const rows = deliveredOrders.map(o => {
      const clienteStr = o.customerName + ' (' + o.customerPhone + ')';
      const itemsStr = o.items.map(item => item.name + ' (' + item.quantity + ')').join('; ');
      const totalStr = formatAdminPrice(o.totalAmount);
      const concretadoStr = (o.deliveredBy || 'Administrador').toUpperCase();
      const fechaStr = new Date(o.updatedAt || o.createdAt).toLocaleDateString();
      return [
        o.pickupCode,
        clienteStr,
        itemsStr,
        totalStr,
        concretadoStr,
        fechaStr
      ];
    });

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="utf-8"/><style>table { border-collapse: collapse; } td, th { border: 1px solid #ccc; padding: 5px; font-family: Arial, sans-serif; }</style></head>';
    html += '<body>';
    html += '<h2>Historial de Entregas Detallado - ' + tenant.name + '</h2>';
    html += '<table>';
    html += '<tr style="background-color: #f2f2f2; font-weight: bold;">';
    headers.forEach(h => { html += '<th>' + h + '</th>'; });
    html += '</tr>';
    rows.forEach(r => {
      html += '<tr>';
      r.forEach(val => { html += '<td>' + val + '</td>'; });
      html += '</tr>';
    });
    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Reporte_Excel_' + tenant.id + '.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsClearHistoryEnabled(true);
    triggerPushNotification('Reporte Excel Descargado', 'Se habilitó la opción de limpiar el detalle general.');
  };

  const handleDownloadPlanilla = () => {
    const headers = ['CÓDIGO RETIRO', 'CLIENTE', 'DETALLE CALZADO', 'TOTAL COBRADO', 'CONCRETADO POR', 'FECHA DE ENTREGA'];
    const rows = deliveredOrders.map(o => {
      const clienteStr = o.customerName + ' (' + o.customerPhone + ')';
      const itemsStr = o.items.map(item => item.name + ' (' + item.quantity + ')').join('; ');
      const totalStr = formatAdminPrice(o.totalAmount);
      const concretadoStr = (o.deliveredBy || 'Administrador').toUpperCase();
      const fechaStr = new Date(o.updatedAt || o.createdAt).toLocaleDateString();
      return [
        '"' + o.pickupCode.replace(/"/g, '""') + '"',
        '"' + clienteStr.replace(/"/g, '""') + '"',
        '"' + itemsStr.replace(/"/g, '""') + '"',
        '"' + totalStr.replace(/"/g, '""') + '"',
        '"' + concretadoStr.replace(/"/g, '""') + '"',
        '"' + fechaStr.replace(/"/g, '""') + '"'
      ];
    });

    const csvContent = 'sep=,\n' + [headers.map(h => '"' + h + '"').join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Planilla_Entregas_' + tenant.id + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsClearHistoryEnabled(true);
    triggerPushNotification('Planilla CSV Descargada', 'Se habilitó la opción de limpiar el detalle general.');
  };

  const handleClearHistory = () => {
    if (confirm('¿Está seguro de que desea limpiar todo el historial de entregas de la boutique? Esta acción no se puede deshacer.')) {
      const updated = orders.filter(o => !(o.tenantId === tenant.id && o.status === 'delivered'));
      onUpdateOrders(updated);
      setIsClearHistoryEnabled(false);
      triggerPushNotification('Historial Limpiado', 'Se ha vaciado el historial de entregas con éxito.');
    }
  };

  // Ventas reales de los últimos 7 días, sumadas por día (pedidos ENTREGADOS)
  const etiquetasDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; // índice = getDay()
  const ventasPorDia: Record<string, number> = { Lun: 0, Mar: 0, 'Mié': 0, Jue: 0, Vie: 0, 'Sáb': 0, Dom: 0 };
  deliveredOrders
    .filter(o => new Date(o.updatedAt || o.createdAt) >= startOfWeek)
    .forEach(o => {
      const d = new Date(o.updatedAt || o.createdAt).getDay();
      const label = etiquetasDia[d];
      if (label in ventasPorDia) ventasPorDia[label] += (o.totalAmount || 0);
    });
  const salesByDay = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => ({ day, sales: ventasPorDia[day] }));
  const maxSalesVal = Math.max(1, ...salesByDay.map(s => s.sales));

  if (!isLoggedIn) {
    return (
      <div id="admin-login-screen" className="bg-neutral-950 text-neutral-100 min-h-screen flex items-center justify-center p-4 selection:bg-amber-500 selection:text-neutral-950">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
          {/* NYC aesthetic accents */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-stone-500 to-amber-400"></div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-neutral-950 border border-neutral-800 p-3.5 rounded-full mb-3 text-amber-500 shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif font-bold tracking-tight text-neutral-100">
              {role === 'admin' ? 'Panel Administrativo' : 'Ingreso de Asesores'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-mono">
              Boutique: {tenant.name}
            </p>
          </div>

          <form onSubmit={handleStandardLogin} className="space-y-4">
            {role === 'admin' && (
              <div>
                <label htmlFor="admin-license" className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Licencia Inquilino
                </label>
                <div className="relative">
                  <input
                    id="admin-license"
                    type="text"
                    required
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    placeholder="NY-SOHO-XXXX"
                  />
                  <Key className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-3.5" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="admin-username" className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                {role === 'admin' ? 'Usuario' : 'Usuario Asesor (Nombre)'}
              </label>
              <div className="relative">
                <input
                  id="admin-username"
                  type="text"
                  required
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans text-stone-200"
                  placeholder={role === 'admin' ? 'Usuario administrador' : 'Ej: Julian Mercer o "colab"'}
                />
                <User className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                {role === 'admin' ? 'Contraseña' : 'Teléfono / Contraseña'}
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-stone-200"
                  placeholder={role === 'admin' ? '••••••••' : 'Ej: teléfono o "123"'}
                />
                <Shield className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Checkbox to remember biometrics */}
            <div className="flex items-start gap-2 pt-1">
              <input
                id="save-biometrics-checkbox"
                type="checkbox"
                checked={saveBiometricsOptIn}
                onChange={(e) => setSaveBiometricsOptIn(e.target.checked)}
                className="mt-0.5 rounded bg-neutral-950 border-neutral-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-amber-500"
              />
              <label htmlFor="save-biometrics-checkbox" className="text-[11px] text-neutral-400 cursor-pointer select-none leading-tight">
                {language === 'en'
                  ? 'Register biometric data to enter directly next time'
                  : 'Registrar datos biométricos para ingresar directo la próxima vez'}
              </label>
            </div>

            {role === 'collaborator' && (
              <div className="bg-neutral-950/50 border border-neutral-800/60 p-2.5 rounded text-[10px] text-neutral-500 font-mono">
                💡 {language === 'en' ? 'Tip: You can use "colab" as user and "123" as password.' : 'Tip: Puede usar "colab" como usuario y "123" como contraseña.'}
              </div>
            )}

            {loginError && (
              <div className="text-red-400 text-xs flex items-start gap-1.5 bg-red-950/40 border border-red-900/40 p-2.5 rounded">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs tracking-widest uppercase py-3 rounded font-mono font-bold transition mt-6"
            >
              {language === 'en' ? 'ENTER WORKSPACE' : 'INGRESAR AL PANEL'}
            </button>
          </form>

          {/* Biometrics Login option (FaceID / Fingerprint) */}
          <div className="border-t border-neutral-800/80 mt-6 pt-5 text-center">
            <span className="text-[11px] text-neutral-400 block mb-3 font-sans">
              {language === 'en' ? 'Fast access configured?' : '¿Acceso rápido configurado?'}
            </span>
            <button
              id="biometrics-login-btn"
              onClick={triggerBiometricScan}
              className={`inline-flex items-center gap-2 bg-neutral-950/80 hover:bg-neutral-950 text-amber-500 border border-neutral-800 hover:border-amber-500/40 px-4 py-2 rounded-full text-xs font-mono tracking-wider transition ${
                hasBiometricRegistration ? 'ring-1 ring-amber-500/30' : ''
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{language === 'en' ? 'ENTER WITH BIOMETRICS' : 'INGRESAR POR BIOMETRÍA'}</span>
            </button>
            {hasBiometricRegistration && (
              <span className="text-[9px] text-amber-500/80 block mt-1 font-mono uppercase tracking-wider">
                ● {language === 'en' ? 'Biometrics Active' : 'Biometría Activa'}
              </span>
            )}
          </div>

          {/* Quick Access links: Collaborator and Back to Store */}
          <div className="border-t border-neutral-800/60 mt-6 pt-5 flex flex-col gap-3 text-center">
            {role === 'admin' ? (
              <button
                id="collaborator-login-toggle-btn"
                type="button"
                onClick={() => {
                  if (onChangeRole) {
                    onChangeRole('collaborator');
                  }
                }}
                className="text-xs text-neutral-300 hover:text-amber-500 transition font-mono tracking-wider"
              >
                👉 INGRESAR COMO COLABORADOR (ASESOR)
              </button>
            ) : (
              <button
                id="admin-login-toggle-btn"
                type="button"
                onClick={() => {
                  if (onChangeRole) {
                    onChangeRole('admin');
                  }
                }}
                className="text-xs text-neutral-300 hover:text-amber-500 transition font-mono tracking-wider"
              >
                👉 INGRESAR COMO ADMINISTRADOR
              </button>
            )}
            <button
              id="return-to-store-btn"
              type="button"
              onClick={() => {
                if (onChangeRole) {
                  onChangeRole('customer');
                }
              }}
              className="text-xs text-neutral-400 hover:text-stone-200 transition font-sans underline underline-offset-4"
            >
              ← Volver a la Tienda Pública
            </button>
          </div>
        </div>

        {/* Biometrics scanning feedback modal */}
        {isBiometricScanning && (
          <div className="fixed inset-0 z-50 bg-neutral-950/90 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="text-center max-w-sm">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border border-neutral-800"></div>
                {/* Simulated scan line */}
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-pulse"></div>
                <div className="absolute top-0 bottom-0 left-0 right-0 m-auto w-16 h-16 text-amber-500 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 animate-bounce" />
                </div>
                <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500 animate-[bounce_2s_infinite]"></div>
              </div>
              <p className="text-sm font-mono uppercase tracking-[0.2em] text-amber-500">Escaneando Datos Biométricos</p>
              <p className="text-xs text-neutral-400 mt-2">Coloque su rostro o huella dactilar cerca del sensor...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="admin-workspace" className="bg-neutral-950 text-neutral-100 min-h-screen flex selection:bg-amber-500 selection:text-neutral-950 font-sans">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center gap-2.5">
            <div className="p-1.5 bg-neutral-950 border border-neutral-800 rounded text-amber-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-stone-100">{tenant.name}</h2>
              <span className="text-[10px] font-mono text-neutral-400 tracking-wider">
                {role === 'collaborator' ? (language === 'en' ? 'COLLABORATOR' : 'COLABORADOR') : (language === 'en' ? 'ADMINISTRATOR' : 'ADMINISTRADOR')}
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1.5">
            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs font-medium transition ${
                activeTab === 'dashboard' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400 hover:text-stone-100 hover:bg-neutral-800/40'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{language === 'en' ? 'Dashboard & Sales' : 'Dashboard & Ventas'}</span>
            </button>

            <button
              id="tab-products-btn"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs font-medium transition ${
                activeTab === 'products' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400 hover:text-stone-100 hover:bg-neutral-800/40'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === 'en' ? 'Footwear Inventory' : 'Inventario Calzado'}</span>
            </button>

            <button
              id="tab-orders-btn"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs font-medium transition relative ${
                activeTab === 'orders' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400 hover:text-stone-100 hover:bg-neutral-800/40'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === 'en' ? 'Orders & Pickups' : 'Pedidos / Encargos'}</span>
              {unseenOrders.length > 0 && (
                <span className="absolute right-4 bg-amber-500 text-neutral-950 font-mono font-bold text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                  {unseenOrders.length}
                </span>
              )}
            </button>

            {/* Collaborators: Restricted for Collaborator role */}
            <button
              id="tab-collaborators-btn"
              onClick={() => {
                if (role === 'collaborator') {
                  alert(language === 'en' ? 'Restricted access. This tab requires Administrator privileges.' : 'Acceso restringido. Esta pestaña requiere privilegios de Administrador.');
                  return;
                }
                setActiveTab('collaborators');
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs font-medium transition ${
                role === 'collaborator' ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                activeTab === 'collaborators' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400 hover:text-stone-100 hover:bg-neutral-800/40'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{language === 'en' ? 'Collaborators' : 'Colaboradores'}</span>
            </button>

            {/* Settings: Restricted for Collaborator role */}
            <button
              id="tab-settings-btn"
              onClick={() => {
                if (role === 'collaborator') {
                  alert(language === 'en' ? 'Restricted access. This tab requires Administrator privileges.' : 'Acceso restringido. Esta pestaña requiere privilegios de Administrador.');
                  return;
                }
                setActiveTab('settings');
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs font-medium transition ${
                role === 'collaborator' ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                activeTab === 'settings' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400 hover:text-stone-100 hover:bg-neutral-800/40'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuración SEO</span>
            </button>
          </nav>
        </div>

        {/* Footer info/Log out */}
        <div className="p-4 border-t border-neutral-800">
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 mb-3 text-[11px] text-neutral-400">
            <span className="text-stone-300 font-semibold block">{tenant.name}</span>
            <span className="font-mono text-[10px]">
              {role === 'collaborator' ? (currentCollaborator?.name || 'Vendedor') : 'Dueño / Administrador'}
            </span>
          </div>
          <button
            id="admin-logout-btn"
            onClick={onLogout}
            className="w-full bg-neutral-800 hover:bg-red-950 hover:text-red-300 border border-neutral-700 py-2 rounded text-xs font-mono tracking-wider transition text-neutral-300"
          >
            CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* Main admin canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header navigation for mobile & notification bell */}
        <header className="h-16 bg-neutral-900 border-b border-neutral-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-stone-100 text-xs font-serif font-bold"
            >
              {tenant.name}
            </button>
          </div>

          <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest hidden md:block">
            {activeTab} • CONECTADO DESDE NUEVA YORK, USA
          </div>

          {/* Right Header items: Notification Bell */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Vista Pública (Public View) Preview Button */}
            <button
              id="public-preview-btn"
              onClick={() => {
                if (onChangeRole) {
                  onChangeRole('customer');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-amber-500 transition shadow-sm"
              title={language === 'en' ? 'Public View Preview' : 'Vista Pública'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'en' ? 'Public View' : 'Vista Pública'}</span>
            </button>

            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setActiveTab('orders')}
                className="p-2 rounded-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-500 transition relative"
              >
                <Bell className="w-4 h-4" />
                {unseenOrders.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                )}
              </button>
            </div>

            {/* Mobile quick navigation tabs */}
            <div className="flex md:hidden gap-1 bg-neutral-950 border border-neutral-800 p-1 rounded-md">
              <button onClick={() => setActiveTab('dashboard')} className={`p-1.5 rounded text-xs ${activeTab === 'dashboard' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400'}`} title="Dashboard"><LayoutDashboard className="w-4 h-4" /></button>
              <button onClick={() => setActiveTab('products')} className={`p-1.5 rounded text-xs ${activeTab === 'products' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400'}`} title="Inventario"><ShoppingCart className="w-4 h-4" /></button>
              <button onClick={() => setActiveTab('orders')} className={`p-1.5 rounded text-xs ${activeTab === 'orders' ? 'bg-neutral-800 text-amber-500' : 'text-neutral-400'}`} title="Pedidos"><ShoppingCart className="w-4 h-4" /></button>
            </div>

            <button
              onClick={onLogout}
              className="text-xs text-neutral-400 hover:text-white md:hidden font-mono"
            >
              SALIR
            </button>
          </div>
        </header>

        {/* Dashboard/Tab views wrapper */}
        <main className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          
          {/* TAB 1: DASHBOARD & REAL-TIME ANALYTICS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top alert if role is collaborator */}
              {role === 'collaborator' && (
                <div className="bg-amber-950/40 border border-amber-900/40 text-amber-400 text-xs p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                    <span>
                      {language === 'en' 
                        ? 'Collaborator Mode: Viewing only your completed deliveries and metrics.' 
                        : 'Modo Colaborador: Visualizando únicamente tus estadísticas e historial de entregas.'}
                    </span>
                  </div>
                  {activeTenantColabs.length > 0 && (
                    <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 self-stretch sm:self-auto justify-between">
                      <span className="text-[10px] uppercase font-mono text-neutral-400">{language === 'en' ? 'Advisor:' : 'Asesor:'}</span>
                      <select
                        id="colab-identity-select"
                        value={activeColabId || (activeTenantColabs[0]?.id || '')}
                        onChange={(e) => setActiveColabId(e.target.value)}
                        className="bg-transparent text-amber-500 font-mono text-xs focus:outline-none cursor-pointer font-bold"
                      >
                        {activeTenantColabs.map(col => (
                          <option key={col.id} value={col.id} className="bg-neutral-900 text-stone-200">
                            {col.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* High-end Widgets Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm relative">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">VENTAS ENTREGADAS</span>
                  <div className="text-2xl font-semibold mt-2 text-stone-100 font-mono">
                    {formatAdminPrice(totalSalesRevenue)}
                  </div>
                  <span className="text-[10px] text-green-400 flex items-center gap-1 mt-2 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" /> +14.2% esta semana
                  </span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">ENCARGOS PENDIENTES</span>
                  <div className="text-2xl font-semibold mt-2 text-amber-500 font-mono">
                    {pendingOrdersCount} pedidos
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-2">Para retiro rápido en tienda</span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">CATÁLOGO CALZADO</span>
                  <div className="text-2xl font-semibold mt-2 text-stone-100 font-mono">
                    {activeTenantProducts.length} diseños
                  </div>
                  <span className="text-[10px] text-stone-300 block mt-2 font-mono">Confección New York</span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl shadow-sm">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">META OPTIMIZADA SEO</span>
                  <div className="text-xs font-medium text-green-400 mt-2 truncate flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" /> {tenant.seoTitle ? 'Google Activo' : 'Incompleto'}
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-2">Búsquedas Manhattan listas</span>
                </div>
              </div>

              {/* Graphics & Collaborator Line status Traffic light */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Custom Elegant Sales Chart */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-serif font-bold text-stone-100">Desempeño de Ventas</h3>
                      <p className="text-[10px] font-mono text-neutral-400 uppercase">Facturación semanal aproximada</p>
                    </div>
                    <BarChart3 className="w-4 h-4 text-neutral-400" />
                  </div>

                  {/* SVG Bar Chart with New York aesthetic */}
                  <div className="h-48 flex items-end gap-3 pt-6 border-b border-neutral-800 pb-2">
                    {salesByDay.map((s, idx) => {
                      const pct = s.sales > 0 ? Math.max(8, (s.sales / maxSalesVal) * 100) : 2;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                          {/* Hover tooltip */}
                          <div className="bg-neutral-950 text-amber-500 font-mono text-[9px] py-1 px-1.5 rounded border border-neutral-800 opacity-0 group-hover:opacity-100 transition mb-1 absolute transform -translate-y-12">
                            {formatAdminPrice(s.sales)}
                          </div>
                          {/* Column */}
                          <div 
                            style={{ height: `${pct}%` }}
                            className="w-full bg-gradient-to-t from-stone-800 to-amber-500/80 hover:to-amber-500 group-hover:brightness-110 rounded-t transition-all duration-500"
                          ></div>
                          <span className="text-[10px] font-mono text-neutral-500 mt-2">{s.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collaborators Traffic Light Panel */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-serif font-bold text-stone-100">Semáforo de Colaboradores</h3>
                        <p className="text-[10px] font-mono text-neutral-400 uppercase">Personal en Línea hoy</p>
                      </div>
                      <Smartphone className="w-4 h-4 text-neutral-400" />
                    </div>

                    <div className="space-y-4 my-2">
                      {activeTenantColabs.map((col) => (
                        <div key={col.id} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/40">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img src={col.avatarUrl} alt={col.name} className="w-8 h-8 rounded-full object-cover" />
                              {/* Traffic Light status dots */}
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-neutral-900 ${
                                isColabOnline(col) ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                              }`}></span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold block text-stone-200">{col.name}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">{col.phone}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isColabOnline(col) ? 'text-green-400 bg-green-950/30' : 'text-red-400 bg-red-950/30'
                            }`}>
                              {isColabOnline(col) ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                            {/* Desconectar al vendedor (real) */}
                            <button
                              id={`toggle-colab-status-${col.id}`}
                              onClick={() => { if (isColabOnline(col) && onKickColab && col.username) onKickColab(col.username); }}
                              disabled={!isColabOnline(col)}
                              className={`p-1 rounded ${isColabOnline(col) ? 'text-red-400 hover:bg-neutral-800 hover:text-red-300' : 'text-neutral-600 cursor-not-allowed'}`}
                              title={isColabOnline(col) ? 'Desconectar a este vendedor' : 'Sin sesión activa'}
                            >
                              <Power className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-800/80">
                    <span className="text-[10px] text-neutral-400 block font-mono leading-relaxed">
                      🟢 Verde: Acceso permitido. Recibe asignaciones de retiro rápido en tienda en tiempo real.
                    </span>
                  </div>
                </div>

              </div>

              {/* SECCIÓN NUEVA: MÉTRICAS DE VENTAS DETALLADAS (DIARIO, SEMANAL, MENSUAL, ANUAL) */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-amber-500">Métricas de Ventas Detalladas</h4>
                  <h3 className="text-base font-serif font-bold text-stone-100 mt-1">Ingresos Concretados por Periodo</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Diario */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 flex items-center gap-3">
                    <div className="bg-neutral-900 p-2.5 rounded-lg text-amber-500 border border-neutral-800">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase">Hoy</span>
                      <span className="text-sm font-semibold text-stone-100 font-mono">{formatAdminPrice(dailySales)}</span>
                    </div>
                  </div>

                  {/* Semanal */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 flex items-center gap-3">
                    <div className="bg-neutral-900 p-2.5 rounded-lg text-amber-500 border border-neutral-800">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase">Semanal</span>
                      <span className="text-sm font-semibold text-stone-100 font-mono">{formatAdminPrice(weeklySales)}</span>
                    </div>
                  </div>

                  {/* Mensual */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 flex items-center gap-3">
                    <div className="bg-neutral-900 p-2.5 rounded-lg text-amber-500 border border-neutral-800">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase">Mensual</span>
                      <span className="text-sm font-semibold text-stone-100 font-mono">{formatAdminPrice(monthlySales)}</span>
                    </div>
                  </div>

                  {/* Anual */}
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/60 flex items-center gap-3">
                    <div className="bg-neutral-900 p-2.5 rounded-lg text-amber-500 border border-neutral-800">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase">Anual</span>
                      <span className="text-sm font-semibold text-stone-100 font-mono">{formatAdminPrice(yearlySales)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN NUEVA: HISTORIAL DE ENTREGAS DETALLADO */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-amber-500">Historial Detallado de Concreciones</h4>
                    <h3 className="text-base font-serif font-bold text-stone-100 mt-1">Quién Concretó la Entrega</h3>
                    <p className="text-xs text-neutral-400 mt-1">Reporte completo de calzados retirados con firma digital del asesor asignado.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="export-pdf-btn"
                      onClick={handleDownloadPDF}
                      className="bg-neutral-800 hover:bg-neutral-700 text-stone-200 text-xs font-mono font-bold px-3 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>BAJAR PDF</span>
                    </button>
                    <button
                      id="export-excel-btn"
                      onClick={handleDownloadExcel}
                      className="bg-neutral-800 hover:bg-neutral-700 text-stone-200 text-xs font-mono font-bold px-3 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>EXCEL</span>
                    </button>
                    <button
                      id="export-csv-btn"
                      onClick={handleDownloadPlanilla}
                      className="bg-neutral-800 hover:bg-neutral-700 text-stone-200 text-xs font-mono font-bold px-3 py-2 rounded-lg border border-neutral-700 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PLANILLA CÁLCULO</span>
                    </button>

                    {isClearHistoryEnabled && (
                      <button
                        id="clear-history-btn"
                        onClick={handleClearHistory}
                        className="bg-red-950/80 hover:bg-red-900 text-red-200 text-xs font-mono font-bold px-4 py-2 rounded-lg border border-red-800 transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>LIMPIAR HISTORIAL</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto border border-neutral-800 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-950 text-neutral-400 text-[10px] font-mono uppercase tracking-wider border-b border-neutral-800">
                        <th className="p-3">Código Retiro</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Detalle Calzado</th>
                        <th className="p-3">Total Cobrado</th>
                        <th className="p-3">Concretado Por</th>
                        <th className="p-3">Fecha de Entrega</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 font-sans">
                      {deliveredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-neutral-500 uppercase tracking-wider font-mono">
                            No hay registros de entregas para esta boutique.
                          </td>
                        </tr>
                      ) : (
                        deliveredOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-neutral-950/40 text-xs text-stone-200 transition">
                            <td className="p-3 font-mono font-bold text-amber-500">{o.pickupCode}</td>
                            <td className="p-3">
                              <span className="font-semibold block">{o.customerName}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">{o.customerPhone}</span>
                            </td>
                            <td className="p-3 font-mono text-[11px] max-w-xs truncate">
                              {o.items.map((item) => `${item.name} (${item.quantity})`).join(', ')}
                            </td>
                            <td className="p-3 font-mono font-semibold">{formatAdminPrice(o.totalAmount)}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-950 text-amber-400 font-mono text-[10px] uppercase border border-neutral-800">
                                <User className="w-3 h-3" />
                                {o.deliveredBy || 'Administrador'}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] text-neutral-400 font-mono">
                              {new Date(o.updatedAt || o.createdAt).toLocaleDateString()}
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

          {/* TAB 2: PRODUCTS INVENTORY CRUD */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-100">Catálogo de Calzado</h3>
                  <p className="text-xs text-neutral-400">Añada variantes de talle, color y detalles artesanales a su stock con fotos de alta calidad.</p>
                </div>
                <button
                  id="add-new-product-btn"
                  onClick={openNewProductModal}
                  className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-mono font-bold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>AGREGAR CALZADO</span>
                </button>
              </div>

              {/* Custom categories editor (Moved here above catalog) */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-serif font-bold text-stone-100">
                    {language === 'en' ? 'Boutique Categories' : 'Categorías de la Boutique'}
                  </h4>
                  <p className="text-xs text-neutral-400">
                    {language === 'en'
                      ? 'Add or remove the navigation tabs rendered in the customer-facing catalog.'
                      : 'Añade o remueve las pestañas de navegación que se renderizan en el catálogo del cliente.'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'e.g., Boots, Heels' : 'Ej: Zapatos de Fiesta, Sandalias'}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 flex-1"
                  />
                  <button
                    id="add-category-btn"
                    onClick={addCustomCategory}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-4 py-2 rounded text-xs font-mono font-bold transition"
                  >
                    {language === 'en' ? 'ADD' : 'AGREGAR'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {tenant.categories.map((c) => {
                    const displayCat = c === 'Todos' ? t.allProducts : c === 'Promo' ? t.promo : c === 'Lo Nuevo' ? t.newArrivals : c;
                    return (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 bg-neutral-950 text-stone-300 text-xs px-3 py-1.5 rounded-full border border-neutral-800 font-mono"
                      >
                        <span>{displayCat}</span>
                        {!['Todos', 'Promo', 'Lo Nuevo'].includes(c) && (
                          <button
                            type="button"
                            id={`remove-category-${c}`}
                            onClick={() => removeCustomCategory(c)}
                            className="text-red-400 hover:text-red-300 ml-1 focus:outline-none font-bold"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Load Optimization Banner (Moved below Boutique Categories) */}
              <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                  <Smartphone className="w-5 h-5 text-amber-500 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-semibold text-stone-100">
                      {language === 'en' ? 'Mobile Load Optimization' : 'Optimización de Carga móvil'}
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      {language === 'en' 
                        ? 'Uploading photos from your phone? The system automatically resizes images to keep Google SEO score at 100%.' 
                        : '¿Subir imágenes desde celular? El panel redimensiona automáticamente para mantener el rendimiento SEO al 100%.'}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800 text-green-400 font-mono tracking-wider">
                  {language === 'en' ? 'ACTIVE AUTOMATICALLY' : 'ACTIVO AUTOMÁTICAMENTE'}
                </div>
              </div>

              {/* Catalog list table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-955 border-b border-neutral-800 text-neutral-400 uppercase font-mono tracking-wider">
                        <th className="p-4 font-semibold">Calzado</th>
                        <th className="p-4 font-semibold">Precio</th>
                        <th className="p-4 font-semibold">Categorías</th>
                        <th className="p-4 font-semibold">Variantes</th>
                        <th className="p-4 font-semibold">Estado</th>
                        <th className="p-4 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {activeTenantProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-neutral-800/30 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded object-cover border border-neutral-800 bg-neutral-950" />
                              <div>
                                <span className="font-semibold text-stone-100 block">{p.name}</span>
                                <span className="text-[10px] text-neutral-500 font-mono">ID: {p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-stone-200 font-mono">
                            {formatAdminPrice(p.price)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {p.categories.map((c) => (
                                <span key={c} className="bg-neutral-950 text-amber-500 text-[9px] px-2 py-0.5 rounded border border-neutral-800">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-[10px] font-mono text-neutral-400 space-y-0.5">
                              {p.variants.map((v) => (
                                <div key={v.name}>
                                  <span className="text-neutral-500">{v.name}:</span> {v.values.join(', ')}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center w-max px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                p.inStock ? 'text-green-400 bg-green-950/20' : 'text-red-400 bg-red-950/20'
                              }`}>
                                {p.inStock ? 'En Stock' : 'Agotado'}
                              </span>
                              <div className="flex gap-1.5">
                                {p.isPromo && <span className="text-[9px] font-mono text-yellow-500">PROMO</span>}
                                {p.isNew && <span className="text-[9px] font-mono text-blue-400">NUEVO</span>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                id={`edit-product-btn-${p.id}`}
                                onClick={() => openEditProductModal(p)}
                                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                id={`delete-product-btn-${p.id}`}
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded hover:bg-neutral-800 text-red-400 hover:text-red-300"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS / ENCARGOS RÁPIDOS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-serif font-bold text-stone-100">Pedidos y Código de Retiro</h3>
                <p className="text-xs text-neutral-400">Gestión ágil del estado de entrega en el local. Los clientes retiran presentando su código de seguridad.</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-955 border-b border-neutral-800 text-neutral-400 uppercase font-mono tracking-wider">
                        <th className="p-4 font-semibold">Código Retiro</th>
                        <th className="p-4 font-semibold">Cliente</th>
                        <th className="p-4 font-semibold">Detalle de Calzado</th>
                        <th className="p-4 font-semibold">Total</th>
                        <th className="p-4 font-semibold">Estado</th>
                        <th className="p-4 font-semibold text-right">Acciones de Despacho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {activeTenantOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-neutral-800/30 transition">
                          <td className="p-4 font-mono font-bold text-amber-500">
                            {o.pickupCode}
                          </td>
                          <td className="p-4">
                            <div>
                              <span className="font-semibold text-stone-100 block">{o.customerName}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">{o.customerPhone}</span>
                              <span className="text-[10px] text-neutral-500 block">{o.customerEmail}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="text-[11px] text-stone-300">
                                  <span className="font-semibold">{item.name}</span> x{item.quantity}
                                  <div className="text-[9px] text-neutral-500 font-mono">
                                    {Object.entries(item.selectedVariant).map(([k, v]) => `${k}:${v}`).join(' | ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-semibold text-stone-200">
                            {formatAdminPrice(o.totalAmount)}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              o.status === 'preparation' ? 'text-amber-400 bg-amber-950/20 border border-amber-900/30' :
                              o.status === 'prepared' ? 'text-green-400 bg-green-950/20 border border-green-900/30 animate-pulse' :
                              'text-neutral-400 bg-neutral-950'
                            }`}>
                              {o.status === 'preparation' ? 'En Preparación' :
                               o.status === 'prepared' ? 'Listo p/ Retirar' :
                               'Entregado'}
                            </span>
                            {o.status === 'delivered' && o.deliveredBy && (
                              <span className="block text-[10px] text-neutral-400 font-mono mt-1">Por: {o.deliveredBy}</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                id={`status-prep-btn-${o.id}`}
                                onClick={() => updateOrderStatus(o.id, 'preparation')}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono transition ${
                                  o.status === 'preparation' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                PREPARANDO
                              </button>
                              
                              <button
                                id={`status-ready-btn-${o.id}`}
                                onClick={() => updateOrderStatus(o.id, 'prepared')}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono transition ${
                                  o.status === 'prepared' ? 'bg-green-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                                }`}
                              >
                                LISTO RETIRO
                              </button>

                              <button
                                id={`status-delivered-btn-${o.id}`}
                                onClick={() => {
                                  if (o.status !== 'delivered') {
                                    setOrderToDeliver(o);
                                    setSelectedDeliverer('Administrador');
                                  }
                                }}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono transition ${
                                  o.status === 'delivered' ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-900'
                                }`}
                              >
                                ENTREGADO
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COLLABORATORS MANAGEMENT */}
          {activeTab === 'collaborators' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-100">Equipo y Colaboradores</h3>
                  <p className="text-xs text-neutral-400">Asigne asesores, edite avatares, verifique ventas personales y cierre sesiones por motivos de seguridad.</p>
                </div>
                <button
                  id="add-new-colab-btn"
                  onClick={openNewColabModal}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-xs font-mono font-bold px-4 py-2 rounded shadow-sm flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>AGREGAR ASESOR</span>
                </button>
              </div>

              {/* Roster Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTenantColabs.map((col) => (
                  <div key={col.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Top status bar */}
                      <div className="flex justify-between items-center mb-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                          isColabOnline(col) ? 'text-green-400 bg-green-950/20' : 'text-red-400 bg-red-950/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isColabOnline(col) ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                          {isColabOnline(col) ? 'ACTIVO ONLINE' : 'DESCONECTADO'}
                        </span>

                        <div className="flex gap-1">
                          <button
                            id={`edit-colab-btn-${col.id}`}
                            onClick={() => openEditColabModal(col)}
                            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-colab-btn-${col.id}`}
                            onClick={() => handleDeleteColab(col.id)}
                            className="p-1 rounded hover:bg-neutral-800 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bio info */}
                      <div className="flex items-center gap-4 mb-4">
                        <img src={col.avatarUrl} alt={col.name} className="w-14 h-14 rounded-full object-cover border border-neutral-800" />
                        <div>
                          <h4 className="text-sm font-semibold text-stone-100">{col.name}</h4>
                          <span className="text-[10px] text-neutral-400 block font-mono">{col.phone}</span>
                          <span className="text-[9px] bg-neutral-950 text-neutral-500 font-mono border border-neutral-800 px-2 py-0.5 rounded-sm block w-max mt-1">
                            ACCESO RESTRINGIDO
                          </span>
                        </div>
                      </div>

                      {/* Sales counts */}
                      <div className="grid grid-cols-2 gap-2 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/40 mb-4 text-center">
                        <div>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wide block">VENTAS ENCARGO</span>
                          <span className="text-sm font-bold text-stone-200 font-mono mt-0.5 block">{col.salesCount}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wide block">RETIRADOS</span>
                          <span className="text-sm font-bold text-stone-200 font-mono mt-0.5 block">{col.assignmentsCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions force logout */}
                    <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-mono uppercase">Seguridad:</span>
                      <button
                        id={`logout-colab-btn-${col.id}`}
                        onClick={() => {
                          if (onKickColab && col.username) { onKickColab(col.username); }
                          else { forceLogoutColab(col.id); }
                        }}
                        disabled={!isColabOnline(col)}
                        className={`text-[10px] font-mono px-3 py-1.5 rounded transition ${
                          isColabOnline(col)
                            ? 'bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/40'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        {isColabOnline(col) ? 'CERRAR SESIÓN' : 'SIN SESIÓN ACTIVA'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TENANT PROFILE AND CUSTOM CATEGORIES SEO */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* QR de la tienda: descargar / imprimir para colgar en el local */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-100">Tu QR para el local</h3>
                  <p className="text-xs text-neutral-400">Descargalo o imprimilo y colgalo en tu negocio. Tus clientes lo escanean y ven tus productos desde el celular.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(window.location.origin + '/?codigo=' + tenant.license)}`}
                    alt="QR de la tienda"
                    referrerPolicy="no-referrer"
                    className="w-40 h-40 rounded-lg bg-white p-2 shrink-0"
                  />
                  <div className="flex-1 w-full space-y-3">
                    <div className="text-[11px] font-mono text-amber-400 break-all bg-neutral-950 border border-neutral-800 rounded px-3 py-2">{window.location.origin + '/?codigo=' + tenant.license}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=20&data=${encodeURIComponent(window.location.origin + '/?codigo=' + tenant.license)}`}
                        download={`QR-${tenant.name}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-stone-100 text-xs font-semibold py-2.5 rounded-lg"
                      >Descargar QR</a>
                      <button
                        type="button"
                        onClick={handlePrintQR}
                        className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold py-2.5 rounded-lg"
                      >Imprimir PDF</button>
                    </div>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSaveSettings} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-100">Ficha Técnica e Imagen de Boutique</h3>
                  <p className="text-xs text-neutral-400">Modifique la marca visual, banners de fondo estilo Soho/Madison y los parámetros clave para el SEO en Google.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Nombre Comercial</label>
                    <input
                      type="text"
                      required
                      value={settsName}
                      onChange={(e) => setSettsName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Imagen Banner de Tienda (PC / Móvil)</label>
                    <div className="flex gap-3 items-center">
                      {settsHero && (
                        <div className="w-16 h-10 rounded border border-neutral-800 overflow-hidden bg-neutral-950 flex-shrink-0">
                          <img src={settsHero} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 flex gap-2">
                        <input
                          type="file"
                          id="settings-hero-file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = await comprimirImagen(file, 1400, 0.72);
                            if (r) setSettsHero(r);
                          }}
                        />
                        <label
                          htmlFor="settings-hero-file"
                          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-xs font-mono uppercase tracking-wider text-stone-200 rounded cursor-pointer transition select-none"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-500" />
                          <span>Subir Banner</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="O pegue URL del Banner..."
                          value={settsHero}
                          onChange={(e) => setSettsHero(e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Teléfono Público</label>
                    <input
                      type="text"
                      required
                      value={settsPhone}
                      onChange={(e) => setSettsPhone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Email Público</label>
                    <input
                      type="email"
                      required
                      value={settsEmail}
                      onChange={(e) => setSettsEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Breve Descripción Brand</label>
                    <textarea
                      rows={3}
                      value={settsDesc}
                      onChange={(e) => setSettsDesc(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      {language === 'en' ? 'Physical Address' : 'Dirección Física'}
                    </label>
                    <input
                      type="text"
                      value={settsAddress}
                      onChange={(e) => setSettsAddress(e.target.value)}
                      placeholder={language === 'en' ? 'e.g., 420 Broadway, New York' : 'Ej: 420 Broadway, New York'}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      {language === 'en' ? 'Google Maps Link' : 'Enlace de Google Maps (URL)'}
                    </label>
                    <input
                      type="url"
                      value={settsGoogleMapsUrl}
                      onChange={(e) => setSettsGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                    />
                  </div>
                </div>

                <div className="border-t border-neutral-800 pt-6">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-500 mb-3">Optimización SEO en Google</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">SEO Meta-Title (Título Pestaña)</label>
                      <input
                        type="text"
                        value={settsSeoTitle}
                        onChange={(e) => setSettsSeoTitle(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                        placeholder="Ej: Madison & Co. | Zapatería Fina de la Quinta Avenida"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">SEO Palabras Clave (Keywords)</label>
                      <input
                        type="text"
                        value={settsSeoKeys}
                        onChange={(e) => setSettsSeoKeys(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                        placeholder="zapatos, botas, new york, boutique, cuero"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">SEO Meta-Description</label>
                      <input
                        type="text"
                        value={settsSeoDesc}
                        onChange={(e) => setSettsSeoDesc(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                        placeholder="Zapatos de vestir clásicos, mocasines y calzado de diseño en Manhattan."
                      />
                    </div>
                    <div className="md:col-span-2 border-t border-neutral-800/40 pt-4 mt-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-amber-500 mb-1">
                        {language === 'en' ? 'Default Customer Phone Prefix' : 'Prefijo de Teléfono para Clientes'}
                      </label>
                      <input
                        type="text"
                        value={settsPhonePrefix}
                        onChange={(e) => setSettsPhonePrefix(e.target.value)}
                        className="w-full sm:w-1/2 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 font-mono"
                        placeholder="Ej: +54 9 "
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {language === 'en'
                          ? 'This prefix is pre-filled when new customers enter their phone number during checkout.'
                          : 'Este prefijo se precargará automáticamente cuando los clientes completen su número de teléfono al hacer un pedido.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Idioma de la Boutique */}
                <div className="border-t border-neutral-800 pt-6">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-500 mb-3">
                    {language === 'en' ? 'Default Language & Localization' : 'Idioma Predeterminado y Localización'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                        {language === 'en' ? 'Boutique Language' : 'Idioma de la Boutique'}
                      </label>
                      <select
                        value={settsDefaultLang}
                        onChange={(e) => setSettsDefaultLang(e.target.value as 'es' | 'en')}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200"
                      >
                        <option value="es">Español Castellano (Predeterminado)</option>
                        <option value="en">English (US)</option>
                      </select>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {language === 'en' 
                          ? 'This language will be loaded by default when customers scan your boutique QR code.' 
                          : 'Este idioma se cargará de manera predeterminada cuando los clientes escaneen el código QR de su boutique.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                        {language === 'en' ? 'Currency Symbol' : 'Símbolo de Moneda'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={settsCurrencySymbol}
                          onChange={(e) => setSettsCurrencySymbol(e.target.value)}
                          className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 font-mono"
                          placeholder="Ej: USD, $, ARS"
                        />
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setSettsCurrencySymbol(e.target.value);
                            }
                          }}
                          className="bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-neutral-400 cursor-pointer"
                          defaultValue=""
                        >
                          <option value="" disabled>{language === 'en' ? 'Presets' : 'Preajustes'}</option>
                          <option value="USD">USD</option>
                          <option value="$">$</option>
                          <option value="ARS">ARS</option>
                          <option value="EUR">EUR</option>
                          <option value="CLP">CLP</option>
                          <option value="COP">COP</option>
                          <option value="MXN">MXN</option>
                          <option value="UYU">UYU</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        {language === 'en' 
                          ? 'Define the currency format shown next to product prices on your store.' 
                          : 'Defina el formato de moneda que se mostrará junto al precio de los productos.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    id="save-settings-btn"
                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-mono font-bold px-5 py-2.5 rounded-lg shadow transition"
                  >
                    {language === 'en' ? 'SAVE BOUTIQUE PROFILE & SEO' : 'GUARDAR FICHA Y METADATOS SEO'}
                  </button>
                </div>
              </form>

              {role === 'admin' && onListBackups && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-serif font-bold text-stone-100">Copias de seguridad</h3>
                      <p className="text-xs text-neutral-400">Si borrás algo por error, restaurá una versión anterior de tu tienda. Se guardan solas cada vez que hay cambios.</p>
                    </div>
                    <button type="button" onClick={cargarBackups} disabled={backupsBusy}
                      className="shrink-0 bg-neutral-800 hover:bg-neutral-700 text-stone-100 text-xs font-mono px-4 py-2 rounded-lg border border-neutral-700 disabled:opacity-60">
                      {backupsBusy ? 'Cargando…' : (backupsOpen ? 'Actualizar' : 'Ver copias')}
                    </button>
                  </div>

                  {backupsOpen && (
                    backups.length === 0 ? (
                      <p className="text-xs text-neutral-500 font-mono">Todavía no hay copias guardadas. Se generan automáticamente cada vez que guardás cambios.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-auto pr-1">
                        {backups.map((b) => (
                          <div key={b.id} className="flex items-center justify-between gap-3 bg-neutral-950/60 border border-neutral-800/50 rounded-lg p-3">
                            <div className="text-xs text-stone-300">
                              <span className="font-mono block">{new Date(b.guardado).toLocaleString()}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">{b.productos} productos · {b.pedidos} pedidos · {b.colaboradores} vendedores</span>
                            </div>
                            <button type="button" onClick={() => restaurarBackup(b.id)} disabled={backupsBusy}
                              className="shrink-0 text-[10px] font-mono px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-60">
                              Restaurar
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Floating simulated Push Notification panel (Toasts) */}
      <AnimatePresence>
        {pushNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-neutral-900 border border-amber-500/30 rounded-xl p-4 shadow-2xl flex items-start gap-3 text-neutral-100"
          >
            <div className="bg-amber-950/40 border border-amber-500/20 p-2 rounded-lg text-amber-500">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-mono tracking-wider text-amber-400 block uppercase font-bold">📲 NOTIFICACIÓN PUSH ENVIADA</span>
              <h5 className="text-xs font-bold text-stone-100 mt-1">{pushNotification.title}</h5>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">{pushNotification.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW/EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-w-3xl w-full p-6 text-neutral-200 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-serif font-bold text-stone-100">
                  {editingProduct ? 'Editar Producto del Catálogo' : 'Añadir Nuevo Calzado de Lujo'}
                </h3>
                <button
                  id="close-product-modal"
                  onClick={() => setShowProductModal(false)}
                  className="p-1 rounded hover:bg-neutral-800"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Nombre del Calzado</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: The Broadway Stiletto"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Precio (USD)</label>
                    <input
                      type="number"
                      required
                      placeholder="650"
                      value={prodPrice || ''}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Descripción del Modelo</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Escriba los acabados de gamuza, forros o confort..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 resize-none"
                  ></textarea>
                </div>

                {/* 3 Images Carga */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-2 flex justify-between">
                    <span>Imágenes de Catálogo (Hasta 3 imágenes)</span>
                    <span className="text-amber-500">PC / Móvil compatible (Subir archivo o pegar URL)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {prodImages.map((img, idx) => {
                      const fileInputId = `prod-image-file-${idx}`;
                      return (
                        <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-3 flex flex-col justify-between">
                          {/* Thumbnail Preview / Placeholder */}
                          <div className="relative aspect-video w-full rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
                            {img ? (
                              <>
                                <img src={img} alt={`Vista previa ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...prodImages];
                                    copy[idx] = '';
                                    setProdImages(copy);
                                  }}
                                  className="absolute top-1 right-1 bg-red-950/80 hover:bg-red-900 text-red-200 p-1 rounded-full border border-red-800 text-[10px] transition"
                                  title="Quitar imagen"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center text-neutral-600 p-2">
                                <Image className="w-6 h-6 mx-auto mb-1 opacity-40" />
                                <span className="text-[9px] font-mono uppercase tracking-wider block">Sin Imagen {idx + 1}</span>
                              </div>
                            )}
                          </div>

                          {/* File Upload Selector */}
                          <div>
                            <input
                              type="file"
                              id={fileInputId}
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const r = await comprimirImagen(file, 1000, 0.72);
                                if (!r) { alert('No se pudo procesar la imagen.'); return; }
                                const copy = [...prodImages];
                                copy[idx] = r;
                                setProdImages(copy);
                              }}
                            />
                            <label
                              htmlFor={fileInputId}
                              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono uppercase tracking-wider text-stone-200 border border-neutral-800 rounded cursor-pointer transition select-none hover:border-amber-500/40"
                            >
                              <Upload className="w-3 h-3 text-amber-500" />
                              <span>Subir Imagen</span>
                            </label>
                          </div>

                          {/* URL Direct Input */}
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="O pegue URL..."
                              value={img}
                              onChange={(e) => {
                                const copy = [...prodImages];
                                copy[idx] = e.target.value;
                                copy[idx] = e.target.value;
                                setProdImages(copy);
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 pl-6 placeholder-neutral-600"
                            />
                            <Camera className="w-3 h-3 text-neutral-600 absolute left-2 top-2.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Categories Checkboxes */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Asignar Categorías</label>
                  <div className="flex flex-wrap gap-3 p-3 bg-neutral-950 rounded border border-neutral-800">
                    {tenant.categories.filter(c => c !== 'Todos').map((cat) => (
                      <label key={cat} className="flex items-center gap-2 text-xs text-neutral-300 hover:text-stone-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prodCats.includes(cat)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProdCats([...prodCats, cat]);
                            } else {
                              setProdCats(prodCats.filter(c => c !== cat));
                            }
                          }}
                          className="rounded text-amber-500 bg-neutral-900 border-neutral-800 focus:ring-0"
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags Management */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Etiquetas / Tags</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: Cuero, Hecho a mano"
                        value={tempTag}
                        onChange={(e) => setTempTag(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 flex-1"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="bg-neutral-800 hover:bg-neutral-700 text-xs text-stone-200 px-3 py-1 rounded"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {prodTags.map((t) => (
                        <span key={t} className="bg-neutral-900 text-neutral-400 text-[10px] px-2 py-0.5 rounded border border-neutral-800 flex items-center gap-1">
                          <span>{t}</span>
                          <button type="button" onClick={() => removeTag(t)} className="text-red-400 font-bold hover:text-red-300">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status Options */}
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded flex flex-col justify-around">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">Destacar Modelo</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prodInStock}
                          onChange={(e) => setProdInStock(e.target.checked)}
                          className="rounded text-amber-500 bg-neutral-900 border-neutral-800 focus:ring-0"
                        />
                        <span>En Stock Disponible</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prodIsPromo}
                          onChange={(e) => setProdIsPromo(e.target.checked)}
                          className="rounded text-amber-500 bg-neutral-900 border-neutral-800 focus:ring-0"
                        />
                        <span>Etiquetar como "PROMO" (Promociones)</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prodIsNew}
                          onChange={(e) => setProdIsNew(e.target.checked)}
                          className="rounded text-amber-500 bg-neutral-900 border-neutral-800 focus:ring-0"
                        />
                        <span>Etiquetar como "LO NUEVO" (New Arrival)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Customizable Variants List (Size / Color) */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Variantes (Tallas, Colores, etc.)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre: Ej. Talle"
                      value={tempVariantName}
                      onChange={(e) => setTempVariantName(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100"
                    />
                    <input
                      type="text"
                      placeholder="Valores: Ej. 37, 38, 39"
                      value={tempVariantValues}
                      onChange={(e) => setTempVariantValues(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 sm:col-span-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="mt-2 text-xs font-mono text-amber-500 underline hover:text-amber-400 block"
                  >
                    + AGREGAR VARIANTE
                  </button>

                  <div className="space-y-2 mt-3">
                    {prodVariants.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-neutral-900 border border-neutral-800">
                        <div>
                          <span className="font-semibold text-stone-300">{v.name}:</span> {v.values.join(', ')}
                        </div>
                        <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-300">Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Details Fields with '+' */}
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 flex justify-between">
                    <span>Campos Adicionales Detallados</span>
                    <span className="text-amber-500 font-bold">+</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Etiqueta: Ej. Altura del Taco"
                      value={tempDetailLabel}
                      onChange={(e) => setTempDetailLabel(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100"
                    />
                    <input
                      type="text"
                      placeholder="Valor: Ej. 10.5 cm"
                      value={tempDetailValue}
                      onChange={(e) => setTempDetailValue(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addDetailField}
                    className="mt-2 text-xs font-mono text-amber-500 underline hover:text-amber-400 block"
                  >
                    + AGREGAR CAMPO DE DETALLE ADICIONAL
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {prodDetails.map((det, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-neutral-900 border border-neutral-800">
                        <div className="truncate">
                          <span className="font-semibold text-neutral-400">{det.label}:</span> {det.value}
                        </div>
                        <button type="button" onClick={() => removeDetailField(idx)} className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0">Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs rounded transition text-neutral-300 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="save-product-submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs rounded-lg shadow-sm transition"
                  >
                    GUARDAR EN INVENTARIO
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW/EDIT COLLABORATOR MODAL */}
      <AnimatePresence>
        {showColabModal && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-200"
            >
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
                <h3 className="text-sm font-serif font-bold text-stone-100">
                  {editingColab ? 'Editar Ficha de Colaborador' : 'Añadir Nuevo Asesor de Tienda'}
                </h3>
                <button onClick={() => setShowColabModal(false)} className="p-1 rounded hover:bg-neutral-800">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSaveColab} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Aria Sterling"
                    value={colabName}
                    onChange={(e) => setColabName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Teléfono Móvil</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: +1 (212) 555-4311"
                    value={colabPhone}
                    onChange={(e) => setColabPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 bg-neutral-950/60 border border-amber-500/20 rounded-lg p-3">
                  <div className="col-span-2">
                    <p className="text-[10px] text-amber-400/90 font-mono uppercase tracking-wider">🔑 Acceso al panel del vendedor</p>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Usuario</label>
                    <input
                      type="text"
                      placeholder="ej: aria"
                      value={colabUsername}
                      onChange={(e) => setColabUsername(e.target.value)}
                      autoComplete="off"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Contraseña</label>
                    <input
                      type="text"
                      placeholder="mín. 6 caracteres"
                      value={colabPassword}
                      onChange={(e) => setColabPassword(e.target.value)}
                      autoComplete="off"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-100 font-mono"
                    />
                  </div>
                  <p className="col-span-2 text-[10px] text-neutral-500 leading-relaxed">
                    Con estos datos el vendedor entra al panel desde el botón 🛡️ de la tienda (opción vendedor). Cada uno ve su versión reducida del panel.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Avatar del Asesor (PC / Móvil / URL)</label>
                  <div className="flex gap-3 items-center">
                    {colabAvatar && (
                      <div className="w-12 h-12 rounded-full border border-neutral-800 overflow-hidden bg-neutral-950 flex-shrink-0">
                        <img src={colabAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="colab-avatar-file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const r = await comprimirImagen(file, 400, 0.8);
                            if (r) setColabAvatar(r);
                          }}
                        />
                        <label
                          htmlFor="colab-avatar-file"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-[11px] font-mono uppercase tracking-wider text-stone-200 rounded cursor-pointer transition select-none"
                        >
                          <Upload className="w-3 h-3 text-amber-500" />
                          <span>Subir Foto</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="O pegue URL de foto..."
                          value={colabAvatar}
                          onChange={(e) => setColabAvatar(e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-200 flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowColabModal(false)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    id="save-colab-submit-btn"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded"
                  >
                    GUARDAR ASESOR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SELECCIÓN DE ASESOR PARA ENTREGA MODAL */}
      <AnimatePresence>
        {orderToDeliver && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 flex items-center justify-center p-4 backdrop-blur-sm text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 text-neutral-200 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-serif font-bold text-stone-100">
                    Registrar Entrega de Calzado
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">PEDIDO: {orderToDeliver.pickupCode}</p>
                </div>
                <button onClick={() => setOrderToDeliver(null)} className="p-1 rounded hover:bg-neutral-800">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-stone-300">
                    Seleccione qué asesor o colaborador de la boutique concretó y entregó físicamente este pedido al cliente:
                  </p>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {/* Administrador / Propietario */}
                  <div 
                    onClick={() => setSelectedDeliverer('Administrador')}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                      selectedDeliverer === 'Administrador' 
                        ? 'bg-amber-500/10 border-amber-500 text-stone-100 font-medium' 
                        : 'bg-neutral-950/60 border-neutral-800/40 text-stone-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-amber-500 border border-neutral-700">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold block">Administrador / Propietario</span>
                        <span className="text-[10px] text-neutral-400 font-mono">Licenciatario Principal</span>
                      </div>
                    </div>
                    {selectedDeliverer === 'Administrador' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    )}
                  </div>

                  {/* Collaborators list */}
                  {activeTenantColabs.map((col) => (
                    <div 
                      key={col.id}
                      onClick={() => setSelectedDeliverer(col.name)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                        selectedDeliverer === col.name 
                          ? 'bg-amber-500/10 border-amber-500 text-stone-100 font-medium' 
                          : 'bg-neutral-950/60 border-neutral-800/40 text-stone-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={col.avatarUrl} alt={col.name} className="w-8 h-8 rounded-full object-cover border border-neutral-800" />
                        <div>
                          <span className="text-xs font-semibold block">{col.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">Asesor de Boutique</span>
                        </div>
                      </div>
                      {selectedDeliverer === col.name && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80 mt-4">
                  <button
                    type="button"
                    onClick={() => setOrderToDeliver(null)}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    id="confirm-delivery-btn"
                    onClick={() => {
                      updateOrderStatus(orderToDeliver.id, 'delivered', selectedDeliverer);
                      setOrderToDeliver(null);
                      setSelectedDeliverer('Administrador'); // reset
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    CONFIRMAR ENTREGA
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
