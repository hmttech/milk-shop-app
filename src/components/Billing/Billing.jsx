import React, { useState, useMemo } from 'react';
import { currency, parseNum, calculateUnitPrice, getUnitDisplayName, parseSmartQuantity, formatQuantityDisplay } from '../../utils/helpers.js';
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
  const [smartQuantities, setSmartQuantities] = useState({}); // Store raw text input
  const [quantityErrors, setQuantityErrors] = useState({}); // Store validation errors

  // Custom add to cart function for unit-based products
  const addToCartWithUnits = (product, parsedQuantity) => {
    if (product.unitType && parsedQuantity.isValid) {
      const finalPrice = calculateUnitPrice(product.unitPrice, parsedQuantity.quantity, parsedQuantity.unit, product.unitType);
      const cartItem = {
        id: product.id,
        name: `${product.name} (${formatQuantityDisplay(parsedQuantity.quantity, parsedQuantity.unit)})`,
        price: finalPrice,
        originalPrice: product.unitPrice,
        unitType: product.unitType,
        purchaseQuantity: parsedQuantity.quantity,
        purchaseUnit: parsedQuantity.unit,
        qty: 1 // quantity in cart is always 1 for unit-based items
      };
      
      setState((prev) => {
        const exists = prev.cart.find((c) => c.id === product.id && c.purchaseUnit === parsedQuantity.unit);
        let cart;
        if (exists) {
          // Update existing item
          cart = prev.cart.map((c) => 
            (c.id === product.id && c.purchaseUnit === parsedQuantity.unit) ? 
            { 
              ...c, 
              name: `${product.name} (${formatQuantityDisplay(parseNum(c.purchaseQuantity) + parsedQuantity.quantity, parsedQuantity.unit)})`,
              purchaseQuantity: parseNum(c.purchaseQuantity) + parsedQuantity.quantity,
              price: calculateUnitPrice(product.unitPrice, parseNum(c.purchaseQuantity) + parsedQuantity.quantity, parsedQuantity.unit, product.unitType)
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
          const smartInput = smartQuantities[p.id] || '';
          const parsedQuantity = p.unitType ? parseSmartQuantity(smartInput || '1kg', p.unitType) : null;
          const calculatedPrice = p.unitType && parsedQuantity?.isValid ? 
            calculateUnitPrice(p.unitPrice, parsedQuantity.quantity, parsedQuantity.unit, p.unitType) : 
            p.price;
          const hasError = quantityErrors[p.id];

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
                    `${currency(p.unitPrice)} ${getUnitDisplayName(p.unitType)}` : 
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
                      type="text"
                      placeholder={p.unitType === 'Kg' ? 'e.g., 250gm or 0.25kg' : 'e.g., 500ml or 0.5L'}
                      value={smartInput}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setSmartQuantities(prev => ({
                          ...prev,
                          [p.id]: newValue
                        }));
                        
                        // Validate input
                        const parsed = parseSmartQuantity(newValue, p.unitType);
                        setQuantityErrors(prev => ({
                          ...prev,
                          [p.id]: newValue && !parsed.isValid
                        }));
                      }}
                      style={{ 
                        flex: 1, 
                        marginRight: 8,
                        borderColor: hasError ? '#f44336' : '#ddd'
                      }}
                    />
                  </div>
                  <div className="muted" style={{ fontSize: '12px' }}>
                    {hasError ? (
                      <span style={{ color: '#f44336' }}>Invalid format. Try: 250gm, 0.5kg, 500ml, 1L</span>
                    ) : (
                      <>Total: {currency(calculatedPrice)}</>
                    )}
                  </div>
                </div>
              )}

              <div className="row right" style={{ marginTop: 8 }}>
                <button 
                  className="primary" 
                  onClick={() => {
                    if (p.unitType) {
                      const parsed = parseSmartQuantity(smartInput || '1kg', p.unitType);
                      if (parsed.isValid) {
                        addToCartWithUnits(p, parsed);
                        // Clear the input after adding to cart
                        setSmartQuantities(prev => ({
                          ...prev,
                          [p.id]: ''
                        }));
                        setQuantityErrors(prev => ({
                          ...prev,
                          [p.id]: false
                        }));
                      }
                    } else {
                      addToCart(setState, p, 1);
                    }
                  }}
                  disabled={p.unitType && hasError}
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
