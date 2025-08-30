// Utility functions for formatting and calculations
export const currency = (n) => '₹ ' + (n ?? 0).toFixed(2);

export const uid = () => Math.random().toString(36).slice(2, 10);

export const todayISO = () => new Date().toISOString();

export const parseNum = (v) => (Number.isFinite(+v) ? +v : 0);

// Unit conversion utilities
export const convertToBaseUnit = (quantity, unit, unitType) => {
  if (unitType === 'Kg') {
    if (unit === 'g' || unit === 'grams') return quantity / 1000;
    if (unit === 'kg' || unit === 'kilograms') return quantity;
  }
  if (unitType === 'Litre') {
    if (unit === 'ml' || unit === 'milliliters') return quantity / 1000;
    if (unit === 'l' || unit === 'liters' || unit === 'litres') return quantity;
  }
  return quantity; // default case
};

export const getUnitDisplayName = (unitType) => {
  return unitType === 'Kg' ? 'per Kg' : unitType === 'Litre' ? 'per Litre' : '';
};

export const getAvailableUnits = (unitType) => {
  if (unitType === 'Kg') {
    return [
      { value: 'g', label: 'Grams (g)' },
      { value: 'kg', label: 'Kilograms (kg)' }
    ];
  }
  if (unitType === 'Litre') {
    return [
      { value: 'ml', label: 'Milliliters (ml)' },
      { value: 'l', label: 'Litres (l)' }
    ];
  }
  return [{ value: 'piece', label: 'Pieces' }];
};

export const calculateUnitPrice = (unitPrice, quantity, unit, unitType) => {
  const baseQuantity = convertToBaseUnit(quantity, unit, unitType);
  return unitPrice * baseQuantity;
};
