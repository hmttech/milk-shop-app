import React, { useEffect } from 'react';
import { currency } from '../../utils/helpers.js';

function Dashboard({ state }) {
  // Total sales
  const totalSales = state.bills.reduce((sum, b) => sum + b.total, 0);
  // Total customers
  const totalCustomers = state.customers.length;
  // Pending bills
  const pendingBills = state.bills.filter(b => b.status === "Pending");
  // Low stock products
  const lowStockProducts = state.products.filter(p => p.qty <= (p.lowAt ?? 5));

  useEffect(() => {
    // Simple chart for sales (last 7 days) - only if Chart.js is available
    const ctx = document.getElementById("salesChart");
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
      const daySales = state.bills.filter(b => new Date(b.createdAt).toLocaleDateString() === dayStr)
        .reduce((sum, b) => sum + b.total, 0);
      sales.push(daySales);
    }
    new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: days,
        datasets: [{ label: "Sales (₹)", data: sales, backgroundColor: "#1b6" }]
      },
      options: { plugins: { legend: { display: false } } }
    });
  }, [state.bills]);

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="grid">
        <div className="card">
          <strong>Total Sales</strong>
          <div style={{ fontSize: 22, margin: "8px 0" }}>{currency(totalSales)}</div>
        </div>
        <div className="card">
          <strong>Total Customers</strong>
          <div style={{ fontSize: 22, margin: "8px 0" }}>{totalCustomers}</div>
        </div>
        <div className="card">
          <strong>Pending Bills</strong>
          <div style={{ fontSize: 22, margin: "8px 0" }}>{pendingBills.length}</div>
        </div>
        <div className="card">
          <strong>Low Stock Products</strong>
          <div style={{ fontSize: 22, margin: "8px 0" }}>{lowStockProducts.length}</div>
        </div>
      </div>
      <h3 style={{ marginTop: 32 }}>Sales (Last 7 Days)</h3>
      {window.Chart ? (
        <canvas id="salesChart" height={80} style={{ maxWidth: 600 }}></canvas>
      ) : (
        <div className="muted">Chart.js not available. Please enable external scripts for charts.</div>
      )}
    </div>
  );
}

export default Dashboard;