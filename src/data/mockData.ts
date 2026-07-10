/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, Product, Collaborator, Order } from '../types';

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'soho-sole',
    license: 'NY-SOHO-9921',
    username: 'admin',
    passwordHash: 'admin123',
    name: 'SoHo Sole Atelier',
    phone: '+1 (212) 555-0190',
    email: 'contact@sohosole.com',
    description: 'Calzado artesanal de alta gama diseñado en el corazón de SoHo, Nueva York. Materiales premium, siluetas atrevidas y acabados hechos a mano.',
    logoUrl: 'SOHO SOLE',
    heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    categories: ['Todos', 'Promo', 'Lo Nuevo', 'Zapatos', 'Zapatillas', 'Botas'],
    createdAt: '2026-01-10T12:00:00Z',
    seoTitle: 'SoHo Sole Atelier | Calzado de Lujo en Nueva York',
    seoDescription: 'Descubre calzado premium hecho a mano con cuero de la más alta calidad y un diseño minimalista neoyorquino contemporáneo.',
    seoKeywords: 'zapatos de lujo, calzado artesanal, soho nueva york, botas premium, sneakers de diseño',
    address: '420 Broadway, New York, NY 10013',
    googleMapsUrl: 'https://maps.google.com/?q=420+Broadway,+New+York,+NY+10013',
    phonePrefix: '+54 9 ',
    currencySymbol: 'USD'
  },
  {
    id: 'madison-avenue',
    license: 'NY-MADISON-8833',
    username: 'madison',
    passwordHash: 'madison123',
    name: 'Madison & Co. Cordwainers',
    phone: '+1 (212) 555-0340',
    email: 'info@madisoncordwainers.com',
    description: 'Estética clásica de la Quinta Avenida. Elegancia refinada, siluetas atemporales y confección tradicional para el profesional moderno.',
    logoUrl: 'MADISON & CO.',
    heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
    categories: ['Todos', 'Promo', 'Lo Nuevo', 'Mocasines', 'Oxford', 'Tacos Elegantes'],
    createdAt: '2026-02-15T12:00:00Z',
    seoTitle: 'Madison & Co. | Zapatería Fina de la Quinta Avenida',
    seoDescription: 'Zapatos de vestir clásicos, tacos elegantes y mocasines con el refinamiento de la sastrería tradicional neoyorquina.',
    seoKeywords: 'mocasines de lujo, oxford cuero, tacos aguja, quinta avenida calzado',
    address: '660 Madison Ave, New York, NY 10021',
    googleMapsUrl: 'https://maps.google.com/?q=660+Madison+Ave,+New+York,+NY+10021',
    phonePrefix: '+54 9 ',
    currencySymbol: 'USD'
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  // Soho Sole Products
  {
    id: 'prod-soho-1',
    tenantId: 'soho-sole',
    name: 'The Broadway Stiletto',
    description: 'Un taco aguja esculpido en gamuza de seda ultra suave. Su suela de cuero pulido y plantilla acolchada ergonómica redefinen el lujo cómodo de la vida nocturna de Manhattan.',
    price: 650,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80'
    ],
    categories: ['Zapatos', 'Lo Nuevo'],
    tags: ['Seda', 'Noche', 'Edición Limitada'],
    variants: [
      { name: 'Talle', values: ['36', '37', '38', '39', '40'] },
      { name: 'Color', values: ['Azul Cobalto', 'Negro Obsidiana', 'Rojo Carmesí'] }
    ],
    details: [
      { label: 'Origen', value: 'Hecho a mano en Brooklyn, NY' },
      { label: 'Material', value: '100% Gamuza de Cabrito' },
      { label: 'Altura del Taco', value: '10.5 cm' },
      { label: 'Suela', value: 'Cuero curtido vegetal' }
    ],
    inStock: true,
    isPromo: false,
    isNew: true
  },
  {
    id: 'prod-soho-2',
    tenantId: 'soho-sole',
    name: 'Chelsea Lug Chelsea Boot',
    description: 'Nuestra interpretación moderna de la clásica bota Chelsea. Con una suela track de goma vulcanizada italiana y paneles elásticos reforzados, lista para las calles lluviosas de NY.',
    price: 490,
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
    ],
    categories: ['Botas', 'Promo'],
    tags: ['Cuero', 'Impermeable', 'Urbano'],
    variants: [
      { name: 'Talle', values: ['37', '38', '39', '40', '41', '42'] },
      { name: 'Color', values: ['Negro Mate', 'Marrón Cognac'] }
    ],
    details: [
      { label: 'Construcción', value: 'Cosido Goodyear' },
      { label: 'Forro', value: 'Piel de becerro ultra transpirable' },
      { label: 'Suela', value: 'Goma Vibrato antideslizante' }
    ],
    inStock: true,
    isPromo: true,
    isNew: false
  },
  {
    id: 'prod-soho-3',
    tenantId: 'soho-sole',
    name: 'The SoHo Court Sneaker',
    description: 'La zapatilla minimalista definitiva. Confeccionada en cuero de plena flor con costuras de precisión tono sobre tono y cordones de algodón encerado.',
    price: 320,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'
    ],
    categories: ['Zapatillas', 'Lo Nuevo'],
    tags: ['Minimalista', 'Premium', 'Streetwear'],
    variants: [
      { name: 'Talle', values: ['38', '39', '40', '41', '42', '43', '44'] },
      { name: 'Color', values: ['Blanco Tiza', 'Gris Ceniza', 'Verde Bosque'] }
    ],
    details: [
      { label: 'Cuero', value: 'Nappa italiana certificada LWG' },
      { label: 'Plantilla', value: 'Espuma de memoria de carbón activo' },
      { label: 'Suela', value: 'Margom cupsole cosida de alta durabilidad' }
    ],
    inStock: true,
    isPromo: false,
    isNew: true
  },

  // Madison Avenue Products
  {
    id: 'prod-mad-1',
    tenantId: 'madison-avenue',
    name: 'The Executive Wholecut Oxford',
    description: 'Un zapato de una sola pieza de cuero de becerro francés. Pulido a mano para crear una pátina profunda y tridimensional. El zapato de negocios definitivo para Wall Street.',
    price: 780,
    images: [
      'https://images.unsplash.com/photo-1486308512493-ae6a1e941f1a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=800&q=80'
    ],
    categories: ['Oxford', 'Lo Nuevo'],
    tags: ['Sartorial', 'Francés', 'Tradicional'],
    variants: [
      { name: 'Ancho', values: ['D (Estándar)', 'E (Ancho)'] },
      { name: 'Talle', values: ['40', '41', '42', '43', '44', '45'] }
    ],
    details: [
      { label: 'Horma', value: 'Madison Clásica Almendrada' },
      { label: 'Cuero', value: 'Becerro Boxcalf de Curtiembres Dupuy' },
      { label: 'Suela', value: 'Cuero curtido en roble con cambrillón de acero' }
    ],
    inStock: true,
    isPromo: false,
    isNew: true
  }
];

export const DEFAULT_COLLABORATORS: Collaborator[] = [
  {
    id: 'colab-1',
    tenantId: 'soho-sole',
    name: 'Julian Mercer',
    phone: '+1 (347) 555-8902',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    onlineStatus: 'active',
    salesCount: 14,
    assignmentsCount: 3,
    isActiveSession: true
  },
  {
    id: 'colab-2',
    tenantId: 'soho-sole',
    name: 'Aria Sterling',
    phone: '+1 (917) 555-4311',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    onlineStatus: 'inactive',
    salesCount: 22,
    assignmentsCount: 5,
    isActiveSession: true
  },
  // Madison Avenue Collaborators
  {
    id: 'colab-3',
    tenantId: 'madison-avenue',
    name: 'Charles Sterling III',
    phone: '+1 (212) 555-2299',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    onlineStatus: 'active',
    salesCount: 35,
    assignmentsCount: 8,
    isActiveSession: true
  }
];

export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'order-101',
    tenantId: 'soho-sole',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (646) 555-1212',
    customerEmail: 'marcus.vance@nyu.edu',
    items: [
      {
        productId: 'prod-soho-1',
        name: 'The Broadway Stiletto',
        quantity: 1,
        selectedVariant: { 'Talle': '38', 'Color': 'Azul Cobalto' },
        price: 650
      }
    ],
    totalAmount: 650,
    status: 'preparation',
    pickupCode: 'RET-NY-9812A',
    createdAt: '2026-07-09T01:15:00Z',
    updatedAt: '2026-07-09T01:15:00Z',
    collaboratorId: 'colab-1'
  },
  {
    id: 'order-102',
    tenantId: 'soho-sole',
    customerName: 'Clara Hayes',
    customerPhone: '+1 (201) 555-9833',
    customerEmail: 'clara.hayes@designfirm.co',
    items: [
      {
        productId: 'prod-soho-3',
        name: 'The SoHo Court Sneaker',
        quantity: 1,
        selectedVariant: { 'Talle': '39', 'Color': 'Blanco Tiza' },
        price: 320
      }
    ],
    totalAmount: 320,
    status: 'prepared',
    pickupCode: 'RET-NY-2394B',
    createdAt: '2026-07-08T18:30:00Z',
    updatedAt: '2026-07-08T19:00:00Z',
    collaboratorId: 'colab-1'
  },
  {
    id: 'order-103',
    tenantId: 'soho-sole',
    customerName: 'Ethan Albright',
    customerPhone: '+1 (718) 555-6677',
    customerEmail: 'ealbright@wallstreet.com',
    items: [
      {
        productId: 'prod-soho-2',
        name: 'Chelsea Lug Chelsea Boot',
        quantity: 2,
        selectedVariant: { 'Talle': '42', 'Color': 'Negro Mate' },
        price: 490
      }
    ],
    totalAmount: 980,
    status: 'delivered',
    pickupCode: 'RET-NY-7741C',
    createdAt: '2026-07-07T14:10:00Z',
    updatedAt: '2026-07-07T16:45:00Z',
    collaboratorId: 'colab-2'
  }
];
