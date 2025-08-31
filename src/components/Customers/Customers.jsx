import React, { useState, useMemo } from 'react';
import { currency } from '../../utils/helpers.js';
import { addOrUpdateCustomer, deleteCustomer } from '../../utils/businessAsync.js';

function Customers({ state, setState, setNotif, user }) {
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', religion: '', general: true });
  const [editingId, setEditingId] = useState(null);

  const filtered = state.customers.filter((c) =>
    (c.name + ' ' + (c.phone || '')).toLowerCase().includes(q.toLowerCase())
  );

  const pendingByCustomer = useMemo(() => {
    const map = {};
    state.bills.forEach((b) => {
      if (b.status === 'Pending') {
        const key = b.customer?.id || 'unknown';
        map[key] = (map[key] || 0) + b.total;
      }
    });
    return map;
  }, [state.bills]);

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await addOrUpdateCustomer(user.id, setState, setNotif, form, editingId, state);
    if (result) {
      setForm(result);
      setEditingId(null);
    }
  }

  function editCustomer(c) {
    setForm({ name: c.name, phone: c.phone, religion: c.religion, general: c.general });
    setEditingId(c.id);
  }

  async function handleDeleteCustomer(id) {
    await deleteCustomer(user.id, setState, setNotif, id, editingId, setEditingId, setForm);
  }

  function cancelEdit() {
    setForm({ name: '', phone: '', religion: '', general: true });
    setEditingId(null);
  }

  return (
    <div>
      <h2>Customers</h2>
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
          placeholder="Search customers..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
        <div className="row">
          <input
            placeholder="Customer Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ marginRight: 8 }}
          />
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <select
            value={form.religion}
            onChange={(e) => setForm({ ...form, religion: e.target.value })}
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
              checked={form.general}
              onChange={(e) => setForm({ ...form, general: e.target.checked })}
            />{' '}
            General
          </label>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
          <button className="primary" type="submit">
            {editingId ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="muted">No customers found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Religion</th>
              <th>General</th>
              <th>Pending</th>
              <th>Last Purchase</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const pending = pendingByCustomer[c.id] || 0;
              const last = state.bills.find((b) => b.customer?.id === c.id);
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone || <span className="muted">-</span>}</td>
                  <td>{c.religion || <span className="muted">-</span>}</td>
                  <td>
                    {c.general ? (
                      <span className="pill ok">Yes</span>
                    ) : (
                      <span className="pill bad">No</span>
                    )}
                  </td>
                  <td>
                    {pending ? (
                      <span className="pill bad">{currency(pending)}</span>
                    ) : (
                      <span className="pill ok">None</span>
                    )}
                  </td>
                  <td>
                    {last ? (
                      new Date(last.createdAt).toLocaleString()
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => editCustomer(c)}>Edit</button>
                    <button
                      className="warn"
                      style={{ marginLeft: 6 }}
                      onClick={() => handleDeleteCustomer(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

export default Customers;
