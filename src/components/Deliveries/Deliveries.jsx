import React, { useState, useMemo } from 'react';
import { currency, uid, todayISO } from '../../utils/helpers.js';

function Deliveries({ state, setState, setNotif, user: _user }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [q, setQ] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(todayISO().split('T')[0]);

  // Filter products for search
  const filteredProducts = useMemo(() => {
    if (!q) return state.products;
    const query = q.toLowerCase();
    return state.products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }, [state.products, q]);

  // Add product to delivery
  const addToDelivery = (product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      setSelectedProducts(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setSelectedProducts(prev => [...prev, {
        id: product.id,
        name: product.name,
        unitPrice: product.unitPrice || product.price,
        unitType: product.unitType,
        quantity: 1,
        price: product.unitPrice || product.price
      }]);
    }
  };

  // Update quantity for a product in delivery
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      setSelectedProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, quantity, price: p.unitPrice * quantity }
          : p
      ));
    }
  };

  // Calculate total
  const total = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  // Handle delivery submission
  const handleDelivery = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setNotif('Please enter customer name');
      setTimeout(() => setNotif(''), 3000);
      return;
    }

    if (selectedProducts.length === 0) {
      setNotif('Please add at least one product to the delivery');
      setTimeout(() => setNotif(''), 3000);
      return;
    }

    const delivery = {
      id: uid(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      products: selectedProducts,
      total,
      date: deliveryDate,
      createdAt: new Date().toISOString()
    };

    // Add to state
    setState(prev => ({
      ...prev,
      deliveries: [...(prev.deliveries || []), delivery]
    }));

    // Clear form
    setCustomerName('');
    setCustomerPhone('');
    setSelectedProducts([]);
    setQ('');

    setNotif(`Delivery recorded successfully! Total: ${currency(total)}`);
    setTimeout(() => setNotif(''), 3000);
  };

  return (
    <div>
      <h2>Milk Delivery Tracking</h2>
      
      {/* Delivery Form */}
      <form className="card" onSubmit={handleDelivery} style={{ marginBottom: 16 }}>
        <h3>Record New Delivery</h3>
        <div className="row" style={{ marginBottom: 12 }}>
          <input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{ marginRight: 8, flex: 1 }}
          />
          <input
            placeholder="Phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            style={{ marginRight: 8, flex: 1 }}
          />
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            style={{ marginRight: 8 }}
          />
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4>Selected Products:</h4>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{currency(p.unitPrice)}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={p.quantity}
                          onChange={(e) => updateQuantity(p.id, parseFloat(e.target.value))}
                          style={{ width: 80 }}
                        />
                        {p.unitType && ` ${p.unitType}`}
                      </td>
                      <td>{currency(p.price)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => updateQuantity(p.id, 0)}
                          className="warn"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row right" style={{ marginTop: 8 }}>
              <strong>Total: {currency(total)}</strong>
            </div>
          </div>
        )}

        <button type="submit" className="primary">
          Record Delivery
        </button>
      </form>

      {/* Product Selection */}
      <div className="card">
        <h3>Add Products</h3>
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
                <div style={{ flex: 1 }}>
                  <strong>{p.name}</strong>
                  <div className="muted">{p.category}</div>
                  <div style={{ fontSize: 14 }}>{p.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                    {currency(p.unitPrice || p.price)}
                    {p.unitType && ` / ${p.unitType}`}
                  </div>
                  <div className="muted">Stock: {p.qty}</div>
                </div>
              </div>
              <div className="row right" style={{ marginTop: 8 }}>
                <button
                  className="primary"
                  onClick={() => addToDelivery(p)}
                  disabled={p.qty <= 0}
                >
                  Add to Delivery
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deliveries */}
      {state.deliveries && state.deliveries.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Recent Deliveries</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Products</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {state.deliveries
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 10)
                  .map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{new Date(delivery.date).toLocaleDateString()}</td>
                      <td>{delivery.customerName}</td>
                      <td>{delivery.customerPhone || '-'}</td>
                      <td>
                        {delivery.products.map(p => `${p.name} (${p.quantity})`).join(', ')}
                      </td>
                      <td>{currency(delivery.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Deliveries;