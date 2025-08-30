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
  return unitType === 'Kg' ? '(Per KG)' : unitType === 'Litre' ? '(Per Litre)' : '';
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

// Smart input parsing for quantities like "250gm", "0.5L", "500ml"
export const parseSmartQuantity = (input, unitType) => {
  if (!input || typeof input !== 'string') {
    return { quantity: 1, unit: unitType === 'Kg' ? 'kg' : 'l', isValid: false };
  }

  const cleanInput = input.trim().toLowerCase();
  
  // Pattern to match number followed by optional unit
  const patterns = {
    'Kg': [
      { regex: /^(\d*\.?\d+)\s*(kg|kilogram|kilograms?)$/i, unit: 'kg' },
      { regex: /^(\d*\.?\d+)\s*(g|gm|gram|grams?)$/i, unit: 'g' },
      { regex: /^(\d*\.?\d+)$/i, unit: 'kg' } // default to kg if no unit specified
    ],
    'Litre': [
      { regex: /^(\d*\.?\d+)\s*(l|ltr|litre|litres?|liter|liters?)$/i, unit: 'l' },
      { regex: /^(\d*\.?\d+)\s*(ml|millilitre|millilitres?|milliliter|milliliters?)$/i, unit: 'ml' },
      { regex: /^(\d*\.?\d+)$/i, unit: 'l' } // default to litre if no unit specified
    ]
  };

  const unitPatterns = patterns[unitType] || [];
  
  for (const pattern of unitPatterns) {
    const match = cleanInput.match(pattern.regex);
    if (match) {
      const quantity = parseFloat(match[1]);
      if (!isNaN(quantity) && quantity > 0) {
        return { quantity, unit: pattern.unit, isValid: true };
      }
    }
  }

  // If no pattern matches, try to extract just the number
  const numberMatch = cleanInput.match(/^(\d*\.?\d+)/);
  if (numberMatch) {
    const quantity = parseFloat(numberMatch[1]);
    if (!isNaN(quantity) && quantity > 0) {
      const defaultUnit = unitType === 'Kg' ? 'kg' : 'l';
      return { quantity, unit: defaultUnit, isValid: true };
    }
  }

  return { quantity: 1, unit: unitType === 'Kg' ? 'kg' : 'l', isValid: false };
};

// Format quantity for display
export const formatQuantityDisplay = (quantity, unit) => {
  return `${quantity}${unit}`;
};
