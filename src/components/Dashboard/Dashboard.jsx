import React, { useEffect, useState } from 'react';
import { currency } from '../../utils/helpers.js';

function Dashboard({ state }) {
  const [activeView, setActiveView] = useState(null);
  // Total sales
  const totalSales = state.bills.reduce((sum, b) => sum + b.total, 0);
  // Total customers
  const totalCustomers = state.customers.length;
  // Pending bills
  const pendingBills = state.bills.filter((b) => b.status === 'Pending');
  // Low stock products
  const lowStockProducts = state.products.filter((p) => p.qty <= (p.lowAt ?? 5));

  useEffect(() => {
    // Simple chart for sales (last 7 days) - only if Chart.js is available
    const ctx = document.getElementById('salesChart');
    if (!ctx || !window.Chart) return;

    // Clear any existing chart
    if (window.Chart.getChart && window.Chart.getChart(ctx)) {
      window.Chart.getChart(ctx).destroy();
    }

    const days = [];
    const sales = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString();
      days.push(dayStr);
      const daySales = state.bills
        .filter((b) => new Date(b.createdAt).toLocaleDateString() === dayStr)
        .reduce((sum, b) => sum + b.total, 0);
      sales.push(daySales);
    }
    new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{ label: 'Sales (₹)', data: sales, backgroundColor: '#1b6' }],
      },
      options: { plugins: { legend: { display: false } } },
    });
  }, [state.bills]);

  // Render detailed views
  const renderDetailView = () => {
    switch (activeView) {
      case 'sales':
        return renderSalesDetail();
      case 'customers':
        return renderCustomersDetail();
      case 'pendingBills':
        return renderPendingBillsDetail();
      case 'lowStock':
        return renderLowStockDetail();
      default:
        return null;
    }
  };

  // Detailed view for Total Sales
  const renderSalesDetail = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setActiveView(null)} style={{ marginRight: 12 }}>
          ← Back to Dashboard
        </button>
        <h2 style={{ margin: 0 }}>All Sales Transactions</h2>
      </div>
      {state.bills.length === 0 ? (
        <div className="muted">No sales transactions yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {state.bills.map((b) => (
              <tr key={b.id}>
                <td>{b.invoiceNo}</td>
                <td>{b.customer?.name || '-'}</td>
                <td>{currency(b.total)}</td>
                <td>
                  <span className={`pill ${b.status === 'Paid' ? 'ok' : 'bad'}`}>
                    {b.status}
                  </span>
                </td>
                <td>{new Date(b.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Detailed view for Total Customers
  const renderCustomersDetail = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setActiveView(null)} style={{ marginRight: 12 }}>
          ← Back to Dashboard
        </button>
        <h2 style={{ margin: 0 }}>All Customers</h2>
      </div>
      {state.customers.length === 0 ? (
        <div className="muted">No customers yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Religion</th>
              <th>General</th>
              <th>Last Purchase</th>
            </tr>
          </thead>
          <tbody>
            {state.customers.map((c) => {
              const lastBill = state.bills.find((b) => b.customer?.id === c.id);
              return (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone || <span className="muted">-</span>}</td>
                  <td>{c.religion || <span className="muted">-</span>}</td>
                  <td>
                    <span className={`pill ${c.general ? 'ok' : 'bad'}`}>
                      {c.general ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    {lastBill ? (
                      new Date(lastBill.createdAt).toLocaleString()
                    ) : (
                      <span className="muted">Never</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  // Detailed view for Pending Bills with WhatsApp functionality
  const renderPendingBillsDetail = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setActiveView(null)} style={{ marginRight: 12 }}>
          ← Back to Dashboard
        </button>
        <h2 style={{ margin: 0 }}>Pending Bills</h2>
      </div>
      {pendingBills.length === 0 ? (
        <div className="muted">No pending bills.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingBills.map((b) => (
              <tr key={b.id}>
                <td>{b.invoiceNo}</td>
                <td>{b.customer?.name || '-'}</td>
                <td>{b.customer?.phone || <span className="muted">-</span>}</td>
                <td>{currency(b.total)}</td>
                <td>{new Date(b.createdAt).toLocaleString()}</td>
                <td>
                  {b.customer?.phone ? (
                    <button
                      className="primary"
                      onClick={() => {
                        const invoiceLink = `${window.location.origin}/invoice/${b.invoiceNo}`;
                        const msg = [
                          `Payment Reminder - Invoice ${b.invoiceNo}`,
                          `Dear ${b.customer?.name || 'Customer'},`,
                          '',
                          `Your payment for Invoice ${b.invoiceNo} is pending.`,
                          `Amount Due: ${currency(b.total)}`,
                          `Date: ${new Date(b.createdAt).toLocaleDateString()}`,
                          '',
                          'Items:',
                          ...b.items.map(
                            (i) => `- ${i.name} x ${i.qty} = ${currency(i.qty * i.price)}`
                          ),
                          '',
                          `Please make the payment at your earliest convenience.`,
                          `View Invoice: ${invoiceLink}`,
                          '',
                          'Thank you for your business!',
                          'Govinda Dughdalay'
                        ].join('\n');
                        const waLink = `https://wa.me/${(b.customer?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                        window.open(waLink, '_blank');
                      }}
                    >
                      Send WhatsApp Reminder
                    </button>
                  ) : (
                    <span className="muted">No Phone</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Detailed view for Low Stock Products
  const renderLowStockDetail = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setActiveView(null)} style={{ marginRight: 12 }}>
          ← Back to Dashboard
        </button>
        <h2 style={{ margin: 0 }}>Low Stock Products</h2>
      </div>
      {lowStockProducts.length === 0 ? (
        <div className="muted">No low stock products.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Low Stock Threshold</th>
              <th>Unit Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lowStockProducts.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  {p.desc && <div className="muted" style={{ fontSize: '0.9em' }}>{p.desc}</div>}
                </td>
                <td>{p.category}</td>
                <td>
                  <span className="pill bad">{p.qty}</span>
                </td>
                <td>{p.lowAt ?? 5}</td>
                <td>
                  {p.unitType ? (
                    <span>{currency(p.unitPrice)} (Per {p.unitType.toUpperCase()})</span>
                  ) : (
                    currency(p.price)
                  )}
                </td>
                <td>
                  <span className="pill bad">Low Stock</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // If a detailed view is active, render it instead of the dashboard
  if (activeView) {
    return renderDetailView();
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="grid">
        <div 
          className="card" 
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView('sales')}
        >
          <strong>Total Sales</strong>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{currency(totalSales)}</div>
        </div>
        <div 
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView('customers')}
        >
          <strong>Total Customers</strong>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{totalCustomers}</div>
        </div>
        <div 
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView('pendingBills')}
        >
          <strong>Pending Bills</strong>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{pendingBills.length}</div>
        </div>
        <div 
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView('lowStock')}
        >
          <strong>Low Stock Products</strong>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{lowStockProducts.length}</div>
        </div>
      </div>
      <h3 style={{ marginTop: 32 }}>Sales (Last 7 Days)</h3>
      {window.Chart ? (
        <canvas id="salesChart" height={80} style={{ maxWidth: 600 }}></canvas>
      ) : (
        <div className="muted">
          Chart.js not available. Please enable external scripts for charts.
        </div>
      )}
    </div>
  );
}

export default Dashboard;
