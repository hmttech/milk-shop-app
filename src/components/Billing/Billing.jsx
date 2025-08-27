import React, { useState, useMemo } from 'react';
import { currency, parseNum } from '../../utils/helpers.js';
import { addToCart, updateCartQty, removeFromCart, checkout } from '../../utils/business.js';

function Billing({ state, setState, setNotif, setTab }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [status, setStatus] = useState('Paid');
  const [discount, setDiscount] = useState(0);
  const [religion, setReligion] = useState('');
  const [general, setGeneral] = useState(true);
  const [q, setQ] = useState('');

  // Filter products by search
  const filteredProducts = useMemo(() => {
    const s = (q || '').toLowerCase();
    return state.products.filter((p) =>
      [p.name, p.category, p.description].join(' ').toLowerCase().includes(s)
    );
  }, [q, state.products]);

  function handleCheckout(e) {
    e.preventDefault();
    checkout({
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
        {filteredProducts.map((p) => (
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
              <span>{currency(p.price)}</span>
              <span className="spacer"></span>
              <span>Qty: {p.qty}</span>
            </div>
            <div className="row right" style={{ marginTop: 8 }}>
              <button className="primary" onClick={() => addToCart(setState, p, 1)}>
                Add to Cart
              </button>
            </div>
          </div>
        ))}
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
            {state.cart.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={state.products.find((p) => p.id === item.id)?.qty ?? 99}
                    value={item.qty}
                    style={{ width: 50 }}
                    onChange={(e) => updateCartQty(setState, item.id, parseNum(e.target.value))}
                  />
                </td>
                <td>{currency(item.price)}</td>
                <td>{currency(item.price * item.qty)}</td>
                <td>
                  <button className="warn" onClick={() => removeFromCart(setState, item.id)}>
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
