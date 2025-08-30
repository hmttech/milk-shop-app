import React, { useState, useMemo } from 'react';
import { currency, parseNum, getAvailableUnits, calculateUnitPrice } from '../../utils/helpers.js';
import { addToCart, updateCartQty, removeFromCart } from '../../utils/business.js';
import { checkout as checkoutAsync } from '../../utils/businessAsync.js';
import { checkout as checkoutLocal } from '../../utils/business.js';

function Billing({ state, setState, setNotif, setTab, user }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [status, setStatus] = useState('Paid');
  const [discount, setDiscount] = useState(0);
  const [religion, setReligion] = useState('');
  const [general, setGeneral] = useState(true);
  const [q, setQ] = useState('');
  const [unitQuantities, setUnitQuantities] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});

  // Custom add to cart function for unit-based products
  const addToCartWithUnits = (product, quantity, unit) => {
    if (product.unitType) {
      const finalPrice = calculateUnitPrice(product.unitPrice, quantity, unit, product.unitType);
      const cartItem = {
        id: product.id,
        name: `${product.name} (${quantity}${unit})`,
        price: finalPrice,
        originalPrice: product.unitPrice,
        unitType: product.unitType,
        purchaseQuantity: quantity,
        purchaseUnit: unit,
        qty: 1 // quantity in cart is always 1 for unit-based items
      };
      
      setState((prev) => {
        const exists = prev.cart.find((c) => c.id === product.id && c.purchaseUnit === unit);
        let cart;
        if (exists) {
          // Update existing item
          cart = prev.cart.map((c) => 
            (c.id === product.id && c.purchaseUnit === unit) ? 
            { 
              ...c, 
              name: `${product.name} (${parseNum(c.purchaseQuantity) + quantity}${unit})`,
              purchaseQuantity: parseNum(c.purchaseQuantity) + quantity,
              price: calculateUnitPrice(product.unitPrice, parseNum(c.purchaseQuantity) + quantity, unit, product.unitType)
            } : c
          );
        } else {
          cart = [cartItem, ...prev.cart];
        }
        return { ...prev, cart };
      });
    } else {
      // Use regular add to cart for fixed price products
      addToCart(setState, product, 1);
    }
  };

  // Filter products by search
  const filteredProducts = useMemo(() => {
    const s = (q || '').toLowerCase();
    return state.products.filter((p) =>
      [p.name, p.category, p.description].join(' ').toLowerCase().includes(s)
    );
  }, [q, state.products]);

  async function handleCheckout(e) {
    e.preventDefault();
    
    // Use local checkout if no user (local mode), otherwise use async checkout
    if (user?.id) {
      await checkoutAsync({
        userId: user.id,
        setState,
        state,
        setNotif,
        setTab,
        customerName,
        customerPhone,
        status,
        discount,
        religion,
        general,
      });
    } else {
      // Local mode checkout
      checkoutLocal({
        setState,
        state,
        setNotif,
        setTab,
        customerName,
        customerPhone,
        status,
        discount,
        religion,
        general,
      });
    }
  }

  const cartSubtotal = state.cart.reduce((s, c) => s + c.price * c.qty, 0);

  return (
    <div>
      <h2>Billing</h2>
      <h3>Products</h3>
      <div
        className="row sticky"
        style={{
          gap: 8,
          padding: '8px 0',
          marginBottom: 8,
          borderBottom: '1px solid #eee',
          background: '#f7f7fb',
        }}
      >
        <input
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>
      <div className="grid">
        {filteredProducts.map((p) => {
          const availableUnits = p.unitType ? getAvailableUnits(p.unitType) : [];
          const selectedUnit = selectedUnits[p.id] || (availableUnits[0]?.value || 'piece');
          const currentQuantity = unitQuantities[p.id] || 1;
          const calculatedPrice = p.unitType ? 
            calculateUnitPrice(p.unitPrice, currentQuantity, selectedUnit, p.unitType) : 
            p.price;

          return (
            <div key={p.id} className="card">
              <div className="row">
                <strong>{p.name}</strong>
                <span className="spacer"></span>
                {p.qty <= (p.lowAt ?? 5) ? (
                  <span className="pill bad">Low</span>
                ) : (
                  <span className="pill ok">OK</span>
                )}
              </div>
              <div className="muted">{p.category}</div>
              <div>{p.description || <span className="muted">No description</span>}</div>
              <div className="row" style={{ marginTop: 6 }}>
                <span>
                  {p.unitType ? 
                    `${currency(p.unitPrice)} per ${p.unitType}` : 
                    currency(p.price)
                  }
                </span>
                <span className="spacer"></span>
                <span>Qty: {p.qty}</span>
              </div>
              
              {p.unitType && (
                <div style={{ marginTop: 8 }}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={currentQuantity}
                      onChange={(e) => setUnitQuantities(prev => ({
                        ...prev,
                        [p.id]: parseNum(e.target.value) || 1
                      }))}
                      style={{ width: 80, marginRight: 8 }}
                    />
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnits(prev => ({
                        ...prev,
                        [p.id]: e.target.value
                      }))}
                      style={{ marginRight: 8 }}
                    >
                      {availableUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    Total: {currency(calculatedPrice)}
                  </div>
                </div>
              )}

              <div className="row right" style={{ marginTop: 8 }}>
                <button 
                  className="primary" 
                  onClick={() => {
                    if (p.unitType) {
                      addToCartWithUnits(p, currentQuantity, selectedUnit);
                    } else {
                      addToCart(setState, p, 1);
                    }
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h3>Cart</h3>
      {state.cart.length === 0 ? (
        <div className="muted">Cart is empty.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {state.cart.map((item, index) => (
              <tr key={`${item.id}-${index}`}>
                <td>{item.name}</td>
                <td>
                  {item.unitType ? (
                    <span>1</span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={state.products.find((p) => p.id === item.id)?.qty ?? 99}
                      value={item.qty}
                      style={{ width: 50 }}
                      onChange={(e) => updateCartQty(setState, item.id, parseNum(e.target.value))}
                    />
                  )}
                </td>
                <td>
                  {item.unitType ? 
                    currency(item.price) : 
                    currency(item.price)
                  }
                </td>
                <td>{currency(item.price * item.qty)}</td>
                <td>
                  <button 
                    className="warn" 
                    onClick={() => removeFromCart(setState, item.id, item.purchaseUnit)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="row right" style={{ marginTop: 8 }}>
        <strong>Subtotal: {currency(cartSubtotal)}</strong>
      </div>

      <h3 style={{ marginTop: 32 }}>Checkout</h3>
      <form className="card" style={{ marginTop: 12 }} onSubmit={handleCheckout}>
        <div className="row">
          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{ marginRight: 8 }}
          />
          <input
            placeholder="Customer Phone (WhatsApp)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ marginRight: 8 }}
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
            style={{ marginRight: 8 }}
          >
            <option value="">Select Religion</option>
            {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Other'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <label style={{ marginRight: 8 }}>
            <input
              type="checkbox"
              checked={general}
              onChange={(e) => setGeneral(e.target.checked)}
            />{' '}
            General
          </label>
          <input
            type="number"
            placeholder="Discount"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            style={{ marginRight: 8, width: 100 }}
          />
          <button className="primary" type="submit">
            Create Invoice & PDF
          </button>
        </div>
      </form>
    </div>
  );
}

export default Billing;
