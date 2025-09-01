import { uid } from './helpers.js';

const STORAGE_KEY = 'govinda_dughdalay_v1';

const initialProducts = [
  {
    id: uid(),
    name: 'Fresh Milk',
    category: 'Milk',
    description: 'Fresh cow milk',
    price: 60, // legacy price for backward compatibility
    unitType: 'Litre',
    unitPrice: 60, // ₹60 per litre
    qty: 80,
    lowAt: 10,
  },
  {
    id: uid(),
    name: 'Pure Desi Ghee',
    category: 'Ghee',
    description: 'Pure desi ghee',
    price: 900, // legacy price for backward compatibility
    unitType: 'Kg',
    unitPrice: 900, // ₹900 per kg
    qty: 20,
    lowAt: 5,
  },
  {
    id: uid(),
    name: 'Fresh Paneer',
    category: 'Paneer',
    description: 'Fresh paneer',
    price: 450, // legacy price for backward compatibility
    unitType: 'Kg',
    unitPrice: 450, // ₹450 per kg
    qty: 30,
    lowAt: 6,
  },
  {
    id: uid(),
    name: 'Rasgulla (tin)',
    category: 'Sweets',
    description: 'Rasgulla tin',
    price: 180,
    qty: 15,
    lowAt: 4,
    // No unit type - remains as fixed price product
  },
  {
    id: uid(),
    name: 'Milk Packet (500ml)',
    category: 'Milk',
    description: 'Packaged cow milk',
    price: 30,
    qty: 100,
    lowAt: 10,
    // No unit type - remains as fixed price product
  },
];

const defaultState = {
  shop: { name: 'Govinda Dughdalay', phone: '+91 90000 00000', addr: 'Near Temple Road, Mumbai' },
  products: initialProducts,
  customers: [],
  bills: [],
  cart: [],
  deliveries: [],
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const s = JSON.parse(raw);
    // Defensive: ensure keys exist
    return {
      shop: s.shop ?? defaultState.shop,
      products: Array.isArray(s.products) ? s.products : [],
      customers: Array.isArray(s.customers) ? s.customers : [],
      bills: Array.isArray(s.bills) ? s.bills : [],
      cart: Array.isArray(s.cart) ? s.cart : [],
      deliveries: Array.isArray(s.deliveries) ? s.deliveries : [],
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
