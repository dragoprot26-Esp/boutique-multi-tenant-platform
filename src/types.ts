/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Variant {
  name: string; // e.g. "Size" or "Color"
  values: string[]; // e.g. ["7 US", "8 US", "9 US"] or ["Black", "Nude"]
}

export interface ProductDetailField {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  images: string[]; // up to 3 images
  categories: string[]; // e.g. ["Zapatos", "Lo Nuevo"]
  tags: string[]; // e.g. ["Handmade", "Leather"]
  variants: Variant[];
  details: ProductDetailField[]; // custom fields added with "+"
  inStock: boolean;
  isPromo: boolean;
  isNew: boolean;
}

export interface Collaborator {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  avatarUrl: string;
  onlineStatus: 'active' | 'inactive'; // green/red traffic light
  salesCount: number;
  assignmentsCount: number;
  isActiveSession: boolean; // tenant can toggle or terminate
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  selectedVariant: { [key: string]: string }; // e.g. { "Talle": "38", "Color": "Negro" }
  price: number;
}

export interface Order {
  id: string;
  tenantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'preparation' | 'prepared' | 'delivered'; // En preparación, Preparado, Entregado
  pickupCode: string; // local pickup code
  createdAt: string;
  updatedAt: string;
  collaboratorId?: string;
  deliveredBy?: string;
}

export interface Tenant {
  id: string;
  license: string;
  username: string;
  passwordHash: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  logoUrl: string;
  heroImage: string; // Store banner/image
  categories: string[]; // Categories customizable by the tenant
  createdAt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  defaultLanguage?: 'es' | 'en';
  address?: string;
  googleMapsUrl?: string;
  phonePrefix?: string;
  currencySymbol?: string;
}
