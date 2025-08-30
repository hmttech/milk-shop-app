import React, { useState, useEffect } from 'react';
import { currency, parseNum, getUnitDisplayName } from '../../utils/helpers.js';
import { addOrUpdateProduct, removeProduct } from '../../utils/businessAsync.js';
import { addToCart } from '../../utils/business.js';

function Products({ state, setState, editingProduct, setEditingProduct, setNotif, user }) {
  const [q, setQ] = useState('');
  const [form, setForm] = useState(
    editingProduct || {
      id: null,
      name: '',
      category: 'Milk',
      description: '',
      price: 0,
      unitType: '',
      unitPrice: 0,
      qty: 0,
      lowAt: 5,
    }
  );

  useEffect(
    () =>
      setForm(
        editingProduct || {
          id: null,
          name: '',
          category: 'Milk',
          description: '',
          price: 0,
          unitType: '',
          unitPrice: 0,
          qty: 0,
          lowAt: 5,
        }
      ),
    [editingProduct]
  );

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await addOrUpdateProduct(user.id, setState, setEditingProduct, setNotif, {
      id: form.id,
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: parseNum(form.price),
      unitType: form.unitType || undefined,
      unitPrice: form.unitType ? parseNum(form.unitPrice) : undefined,
      qty: parseNum(form.qty),
      lowAt: parseNum(form.lowAt) || 5,
    });
  }

  const filtered = state.products.filter((p) => {
    const s = (q || '').toLowerCase();
    return [p.name, p.category, p.description].join(' ').toLowerCase().includes(s);
  });

  return (
    <div>
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
        <button
          className="primary"
          onClick={() =>
            setEditingProduct({
              id: null,
              name: '',
              category: 'Milk',
              description: '',
              price: 0,
              unitType: '',
              unitPrice: 0,
              qty: 0,
              lowAt: 5,
            })
          }
        >
          Add Product
        </button>
      </div>

      {editingProduct && (
        <form className="card" onSubmit={submit}>
          <div className="grid">
            <div>
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {['Milk', 'Ghee', 'Paneer', 'Sweets', 'Other'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Unit Type</label>
              <select
                value={form.unitType}
                onChange={(e) => setForm({ ...form, unitType: e.target.value, unitPrice: e.target.value ? form.unitPrice : 0 })}
              >
                <option value="">Fixed Price (per piece)</option>
                <option value="Kg">Weight Based (per Kg)</option>
                <option value="Litre">Volume Based (per Litre)</option>
              </select>
            </div>
            <div>
              <label>{form.unitType ? `Unit Price ${getUnitDisplayName(form.unitType)}` : 'Price'}</label>
              <input
                type="number"
                step="0.01"
                value={form.unitType ? form.unitPrice : form.price}
                onChange={(e) => {
                  if (form.unitType) {
                    setForm({ ...form, unitPrice: e.target.value });
                  } else {
                    setForm({ ...form, price: e.target.value });
                  }
                }}
                required
              />
            </div>
            <div>
              <label>Quantity</label>
              <input
                type="number"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </div>
            <div>
              <label>Low Stock Alert At</label>
              <input
                type="number"
                value={form.lowAt}
                onChange={(e) => setForm({ ...form, lowAt: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="row right" style={{ marginTop: 8 }}>
            <button type="button" onClick={() => setEditingProduct(null)}>
              Cancel
            </button>
            <button className="primary" type="submit">
              {form.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="grid">
        {filtered.map((p) => (
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
            <div className="row right" style={{ marginTop: 8 }}>
              <button onClick={() => setEditingProduct(p)}>Edit</button>
              <button className="warn" onClick={() => removeProduct(user.id, setState, setNotif, p.id)}>
                Delete
              </button>
              <button className="primary" onClick={() => addToCart(setState, p, 1)}>
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;
