import { uid } from './helpers.js';

const STORAGE_KEY = 'govinda_dughdalay_v1';

const initialProducts = [
  {
    id: uid(),
    name: 'Milk (500ml)',
    category: 'Milk',
    description: 'Fresh cow milk',
    price: 30,
    qty: 100,
    lowAt: 10,
  },
  {
    id: uid(),
    name: 'Milk (1L)',
    category: 'Milk',
    description: 'Fresh cow milk',
    price: 60,
    qty: 80,
    lowAt: 10,
  },
  {
    id: uid(),
    name: 'Ghee (500g)',
    category: 'Ghee',
    description: 'Pure desi ghee',
    price: 450,
    qty: 20,
    lowAt: 5,
  },
  {
    id: uid(),
    name: 'Paneer (200g)',
    category: 'Paneer',
    description: 'Fresh paneer',
    price: 90,
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
  },
];

const defaultState = {
  shop: { name: 'Govinda Dughdalay', phone: '+91 90000 00000', addr: 'Near Temple Road, Mumbai' },
  products: initialProducts,
  customers: [],
  bills: [],
  cart: [],
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
