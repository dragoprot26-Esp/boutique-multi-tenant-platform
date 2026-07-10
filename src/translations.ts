/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationSet {
  announcement: string;
  pickupInstant: string;
  shareQr: string;
  viewAs: string;
  customerView: string;
  adminView: string;
  collaboratorView: string;
  showroom: string;
  phone: string;
  email: string;
  searchPlaceholder: string;
  allProducts: string;
  promo: string;
  newArrivals: string;
  outOfStock: string;
  viewDesign: string;
  addToBag: string;
  selectOption: string;
  details: string;
  completeDetailsToPickUp: string;
  fullName: string;
  contactPhone: string;
  emailAddress: string;
  confirmQuickOrder: string;
  orderConfirmed: string;
  presentCodeMsg: string;
  close: string;
  shareStore: string;
  scanQrMsg: string;
  yourShoppingBag: string;
  bagIsEmpty: string;
  totalToPay: string;
  proceedToOrder: string;
  categories: string;
  baseCategoriesMsg: string;
  addCategory: string;
  addCategoryPlaceholder: string;
  catalogoCalzado: string;
  addCalzado: string;
  price: string;
  variants: string;
  status: string;
  actions: string;
  edit: string;
  delete: string;
  seoSettings: string;
  languageSelectLabel: string;
  languageSelectHelp: string;
}

export const TRANSLATIONS: { es: TranslationSet; en: TranslationSet } = {
  es: {
    announcement: "ATMÓSFERA BOUTIQUE MANHATTAN",
    pickupInstant: "CÓDIGO DE RETIRO AL INSTANTE",
    shareQr: "COMPARTIR QR",
    viewAs: "Ver como:",
    customerView: "Página Pública (Cliente)",
    adminView: "Admin",
    collaboratorView: "Colaborador",
    showroom: "Manhattan Showroom",
    phone: "Teléfono",
    email: "Email",
    searchPlaceholder: "Buscar diseños exclusivos...",
    allProducts: "Todos",
    promo: "Promo",
    newArrivals: "Lo Nuevo",
    outOfStock: "SIN STOCK",
    viewDesign: "VER DISEÑO",
    addToBag: "Añadir a la Bolsa",
    selectOption: "Seleccionar opción",
    details: "Detalles del Calzado",
    completeDetailsToPickUp: "Completa tus datos para retirar hoy mismo en Manhattan",
    fullName: "Nombre y Apellido",
    contactPhone: "Teléfono de contacto",
    emailAddress: "Correo electrónico",
    confirmQuickOrder: "CONFIRMAR ENCARGO RÁPIDO",
    orderConfirmed: "¡Encargo Confirmado con Éxito!",
    presentCodeMsg: "Presenta este código de seguridad en la boutique de la Quinta Avenida para retirar y abonar tu calzado:",
    close: "Cerrar",
    shareStore: "Compartir Boutique",
    scanQrMsg: "Escanee el código QR para compartir esta boutique neoyorquina directamente en su celular:",
    yourShoppingBag: "Tu Bolsa de Compras",
    bagIsEmpty: "La bolsa de compras está vacía.",
    totalToPay: "Total a pagar",
    proceedToOrder: "Proceder al Encargo",
    categories: "Categorías de la Boutique",
    baseCategoriesMsg: "Añade o remueve las pestañas de navegación que se renderizan en el catálogo del cliente.",
    addCategory: "AGREGAR",
    addCategoryPlaceholder: "Ej: Botas de Cuero, Sandalias...",
    catalogoCalzado: "Catálogo de Calzado",
    addCalzado: "AGREGAR CALZADO",
    price: "Precio",
    variants: "Variantes",
    status: "Estado",
    actions: "Acciones",
    edit: "Editar",
    delete: "Eliminar",
    seoSettings: "Configuración de Multi-idioma & SEO",
    languageSelectLabel: "Idioma por Defecto del Storefront",
    languageSelectHelp: "Establece el idioma principal para los clientes que visiten tu boutique.",
  },
  en: {
    announcement: "MANHATTAN BOUTIQUE ATMOSPHERE",
    pickupInstant: "INSTANT PICKUP CODE",
    shareQr: "SHARE QR",
    viewAs: "View as:",
    customerView: "Public Page (Customer)",
    adminView: "Admin",
    collaboratorView: "Collaborator",
    showroom: "Manhattan Showroom",
    phone: "Phone",
    email: "Email",
    searchPlaceholder: "Search exclusive designs...",
    allProducts: "All",
    promo: "Sale",
    newArrivals: "New Arrivals",
    outOfStock: "OUT OF STOCK",
    viewDesign: "VIEW DESIGN",
    addToBag: "Add to Bag",
    selectOption: "Select option",
    details: "Footwear Details",
    completeDetailsToPickUp: "Complete your details to pick up today in Manhattan",
    fullName: "Full Name",
    contactPhone: "Contact Phone",
    emailAddress: "Email Address",
    confirmQuickOrder: "CONFIRMAR ENCARGO RÁPIDO",
    orderConfirmed: "Order Confirmed Successfully!",
    presentCodeMsg: "Present this security code at the Fifth Avenue boutique to collect and pay for your footwear:",
    close: "Close",
    shareStore: "Share Boutique",
    scanQrMsg: "Scan the QR code to share this New York boutique directly to your mobile phone:",
    yourShoppingBag: "Your Shopping Bag",
    bagIsEmpty: "The shopping bag is empty.",
    totalToPay: "Total to pay",
    proceedToOrder: "Proceed to Order",
    categories: "Boutique Categories",
    baseCategoriesMsg: "Add or remove navigation tabs rendered on the customer's catalog.",
    addCategory: "ADD",
    addCategoryPlaceholder: "e.g. Leather Boots, Sandals...",
    catalogoCalzado: "Footwear Catalog",
    addCalzado: "ADD FOOTWEAR",
    price: "Price",
    variants: "Variants",
    status: "Status",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    seoSettings: "Multi-language & SEO Configuration",
    languageSelectLabel: "Default Storefront Language",
    languageSelectHelp: "Set the main language for customers visiting your boutique.",
  }
};
