import React, { useEffect, useState, useCallback } from 'react';
import { currency } from '../../utils/helpers.js';

function Dashboard({ state }) {
  const [activeView, setActiveView] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('days'); // 'days3', 'days', 'days14', 'month', 'days90', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'ytd', 'custom'
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [chartType, setChartType] = useState('bar'); // 'bar', 'line', 'area', 'pie'
  // Low stock products (this remains all-time)
  const lowStockProducts = state.products.filter((p) => p.qty <= (p.lowAt ?? 5));

  // Helper function to get date range for periods
  const getDateRange = useCallback((period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'days3':
        return { days: 3, title: 'Last 3 Days' };
      case 'days':
        return { days: 7, title: 'Last 7 Days' };
      case 'days14':
        return { days: 14, title: 'Last 14 Days' };
      case 'month':
        return { days: 30, title: 'Last 30 Days' };
      case 'days90':
        return { days: 90, title: 'Last 90 Days' };
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const daysDiff = Math.ceil((today - startOfWeek) / (1000 * 60 * 60 * 24));
        return { days: daysDiff + 1, title: 'This Week', startDate: startOfWeek };
      }
      case 'lastWeek': {
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        return { days: 7, title: 'Last Week', startDate: startOfLastWeek };
      }
      case 'thisMonth': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysDiff = Math.ceil((today - startOfMonth) / (1000 * 60 * 60 * 24));
        return { days: daysDiff + 1, title: 'This Month', startDate: startOfMonth };
      }
      case 'lastMonth': {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        const daysDiff = Math.ceil((endOfLastMonth - startOfLastMonth) / (1000 * 60 * 60 * 24));
        return { days: daysDiff + 1, title: 'Last Month', startDate: startOfLastMonth, endDate: endOfLastMonth };
      }
      case 'ytd': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const daysDiff = Math.ceil((today - startOfYear) / (1000 * 60 * 60 * 24));
        return { days: daysDiff + 1, title: 'Year to Date', startDate: startOfYear };
      }
      default:
        return { days: 7, title: 'Last 7 Days' };
    }
  }, []);

  // Helper function to get period-specific data
  const getPeriodData = useCallback(() => {
    let startDate, endDate, periodTitle;

    if (chartPeriod === 'custom') {
      startDate = new Date(customDateRange.start);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      periodTitle = `(${customDateRange.start} to ${customDateRange.end})`;
    } else {
      const range = getDateRange(chartPeriod);
      periodTitle = `(${range.title})`;
      
      if (range.startDate) {
        startDate = new Date(range.startDate);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - (range.days - 1));
      }
      
      if (range.endDate) {
        endDate = new Date(range.endDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Filter bills within the period
    const periodBills = state.bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startDate && billDate <= endDate;
    });

    // Calculate period sales
    const periodSales = periodBills.reduce((sum, b) => sum + b.total, 0);

    // Get customers who made purchases in the period
    const periodCustomerIds = new Set(periodBills.map(b => b.customer?.id).filter(Boolean));
    const periodCustomersCount = periodCustomerIds.size;

    // Get pending bills created in the period
    const periodPendingBills = periodBills.filter((b) => b.status === 'Pending');

    return {
      sales: periodSales,
      customersCount: periodCustomersCount,
      pendingBillsCount: periodPendingBills.length,
      periodTitle
    };
  }, [chartPeriod, customDateRange, state.bills, getDateRange]);

  const periodData = getPeriodData();

  // Helper function to generate chart data based on period
  const generateChartData = useCallback(() => {
    let labels = [];
    let salesData = [];
    let title = '';

    if (chartPeriod === 'custom') {
      title = `Sales (${customDateRange.start} to ${customDateRange.end})`;
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dayStr = d.toLocaleDateString();
        labels.push(dayStr);
        const daySales = state.bills
          .filter((b) => new Date(b.createdAt).toLocaleDateString() === dayStr)
          .reduce((sum, b) => sum + b.total, 0);
        salesData.push(daySales);
      }
    } else {
      const range = getDateRange(chartPeriod);
      title = `Sales (${range.title})`;
      
      const startDate = range.startDate || new Date();
      
      if (!range.startDate) {
        startDate.setDate(startDate.getDate() - (range.days - 1));
      }
      
      for (let i = 0; i < range.days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        
        // Stop if we've reached beyond the end date for specific periods
        if (range.endDate && d > range.endDate) break;
        
        const dayStr = d.toLocaleDateString();
        labels.push(dayStr);
        const daySales = state.bills
          .filter((b) => new Date(b.createdAt).toLocaleDateString() === dayStr)
          .reduce((sum, b) => sum + b.total, 0);
        salesData.push(daySales);
      }
    }

    return { labels, salesData, title };
  }, [chartPeriod, customDateRange, state.bills, getDateRange]);

  // Helper function for time-wise analysis (hourly breakdown for today)
  const generateHourlyData = useCallback(() => {
    const labels = [];
    const salesData = [];
    const today = new Date().toLocaleDateString();
    
    for (let hour = 0; hour < 24; hour++) {
      labels.push(`${hour}:00`);
      const hourlySales = state.bills
        .filter((b) => {
          const billDate = new Date(b.createdAt);
          return billDate.toLocaleDateString() === today && billDate.getHours() === hour;
        })
        .reduce((sum, b) => sum + b.total, 0);
      salesData.push(hourlySales);
    }
    
    return { labels, salesData, title: 'Today&apos;s Sales by Hour' };
  }, [state.bills]);

  // Helper function for quick date presets
  const setQuickDateRange = useCallback((preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (preset) {
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setCustomDateRange({ start: yesterdayStr, end: yesterdayStr });
        break;
      }
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setCustomDateRange({ 
          start: startOfWeek.toISOString().split('T')[0], 
          end: todayStr 
        });
        break;
      }
      case 'lastWeek': {
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        setCustomDateRange({ 
          start: startOfLastWeek.toISOString().split('T')[0], 
          end: endOfLastWeek.toISOString().split('T')[0] 
        });
        break;
      }
      case 'thisMonth': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setCustomDateRange({ 
          start: startOfMonth.toISOString().split('T')[0], 
          end: todayStr 
        });
        break;
      }
      case 'lastMonth': {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setCustomDateRange({ 
          start: startOfLastMonth.toISOString().split('T')[0], 
          end: endOfLastMonth.toISOString().split('T')[0] 
        });
        break;
      }
      default:
        break;
    }
  }, []);

  // Helper function to refresh charts
  const refreshCharts = useCallback(() => {
    // Force re-render of charts by updating a timestamp
    const salesChart = document.getElementById('salesChart');
    const hourlyChart = document.getElementById('hourlyChart');
    
    if (salesChart && window.Chart && window.Chart.getChart) {
      const existingChart = window.Chart.getChart(salesChart);
      if (existingChart) {
        existingChart.destroy();
      }
    }
    
    if (hourlyChart && window.Chart && window.Chart.getChart) {
      const existingChart = window.Chart.getChart(hourlyChart);
      if (existingChart) {
        existingChart.destroy();
      }
    }
    
    // Trigger useEffect by toggling activeView briefly if we're on dashboard
    if (!activeView) {
      setActiveView('refresh');
      setTimeout(() => setActiveView(null), 1);
    }
  }, [activeView]);

  useEffect(() => {
    // Chart for sales based on selected period - only if Chart.js is available
    const ctx = document.getElementById('salesChart');
    if (!ctx || !window.Chart) return;

    // Clear any existing chart
    if (window.Chart.getChart && window.Chart.getChart(ctx)) {
      window.Chart.getChart(ctx).destroy();
    }

    const chartData = generateChartData();
    
    new window.Chart(ctx, {
      type: chartType === 'area' ? 'line' : chartType,
      data: {
        labels: chartData.labels,
        datasets: [{ 
          label: 'Sales (₹)', 
          data: chartData.salesData, 
          backgroundColor: chartType === 'line' ? 'transparent' : 
                          chartType === 'area' ? 'rgba(17, 187, 102, 0.2)' :
                          chartType === 'pie' ? [
                            '#1bb666', '#e74c3c', '#3498db', '#f39c12', '#9b59b6',
                            '#2ecc71', '#e67e22', '#34495e', '#1abc9c', '#f1c40f'
                          ] : '#1bb666',
          borderColor: chartType === 'pie' ? '#fff' : '#1bb666',
          borderWidth: chartType === 'line' || chartType === 'area' ? 2 : chartType === 'pie' ? 2 : 0,
          fill: chartType === 'area' ? true : chartType === 'line' ? false : true,
          tension: chartType === 'line' || chartType === 'area' ? 0.1 : 0
        }],
      },
      options: { 
        plugins: { 
          legend: { 
            display: chartType === 'pie',
            position: 'bottom'
          } 
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: chartType === 'pie' ? {} : {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        }
      },
    });
  }, [state.bills, chartPeriod, customDateRange, chartType, generateChartData, activeView]);

  useEffect(() => {
    // Hourly chart for today's sales
    const ctx = document.getElementById('hourlyChart');
    if (!ctx || !window.Chart) return;

    // Clear any existing chart
    if (window.Chart.getChart && window.Chart.getChart(ctx)) {
      window.Chart.getChart(ctx).destroy();
    }

    const hourlyData = generateHourlyData();
    
    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: hourlyData.labels,
        datasets: [{ 
          label: 'Sales (₹)', 
          data: hourlyData.salesData, 
          backgroundColor: 'transparent',
          borderColor: '#e74c3c',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        }],
      },
      options: { 
        plugins: { legend: { display: false } },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          }
        }
      },
    });
  }, [state.bills, generateHourlyData, activeView]);

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
  const renderSalesDetail = () => {
    // Get period-specific bills for display
    let startDate, endDate;

    if (chartPeriod === 'custom') {
      startDate = new Date(customDateRange.start);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(chartPeriod);
      
      if (range.startDate) {
        startDate = new Date(range.startDate);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - (range.days - 1));
      }
      
      if (range.endDate) {
        endDate = new Date(range.endDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const periodBills = state.bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startDate && billDate <= endDate;
    });

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setActiveView(null)} style={{ marginRight: 12 }}>
            ← Back to Dashboard
          </button>
          <h2 style={{ margin: 0 }}>Sales Transactions {periodData.periodTitle}</h2>
        </div>
        {periodBills.length === 0 ? (
          <div className="muted">No sales transactions for this period.</div>
        ) : (
          <div className="table-wrapper">
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
              {periodBills.map((b) => (
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
          </div>
        )}
      </div>
    );
  };

  // Detailed view for Total Customers
  const renderCustomersDetail = () => {
    // Get period-specific customers for display
    let startDate, endDate;

    if (chartPeriod === 'custom') {
      startDate = new Date(customDateRange.start);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(chartPeriod);
      
      if (range.startDate) {
        startDate = new Date(range.startDate);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - (range.days - 1));
      }
      
      if (range.endDate) {
        endDate = new Date(range.endDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Get customers who made purchases in the period
    const periodBills = state.bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= startDate && billDate <= endDate;
    });
    
    const periodCustomerIds = new Set(periodBills.map(b => b.customer?.id).filter(Boolean));
    const periodCustomers = state.customers.filter(c => periodCustomerIds.has(c.id));

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setActiveView(null)} style={{ marginRight: 12 }}>
            ← Back to Dashboard
          </button>
          <h2 style={{ margin: 0 }}>Customers {periodData.periodTitle}</h2>
        </div>
        {periodCustomers.length === 0 ? (
          <div className="muted">No customers made purchases in this period.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Religion</th>
                <th>General</th>
                <th>Last Purchase in Period</th>
              </tr>
            </thead>
            <tbody>
              {periodCustomers.map((c) => {
                const lastBillInPeriod = periodBills
                  .filter((b) => b.customer?.id === c.id)
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
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
                      {lastBillInPeriod ? (
                        new Date(lastBillInPeriod.createdAt).toLocaleString()
                      ) : (
                        <span className="muted">No purchase in period</span>
                      )}
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
  };

  // Detailed view for Pending Bills with WhatsApp functionality
  const renderPendingBillsDetail = () => {
    // Get period-specific pending bills for display
    let startDate, endDate;

    if (chartPeriod === 'custom') {
      startDate = new Date(customDateRange.start);
      endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = getDateRange(chartPeriod);
      
      if (range.startDate) {
        startDate = new Date(range.startDate);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - (range.days - 1));
      }
      
      if (range.endDate) {
        endDate = new Date(range.endDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const periodPendingBills = state.bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return bill.status === 'Pending' && billDate >= startDate && billDate <= endDate;
    });

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setActiveView(null)} style={{ marginRight: 12 }}>
            ← Back to Dashboard
          </button>
          <h2 style={{ margin: 0 }}>Pending Bills {periodData.periodTitle}</h2>
        </div>
        {periodPendingBills.length === 0 ? (
          <div className="muted">No pending bills for this period.</div>
        ) : (
          <div className="table-wrapper">
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
              {periodPendingBills.map((b) => (
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
          </div>
        )}
      </div>
    );
  };

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
        <div className="table-wrapper">
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
        </div>
      )}
    </div>
  );

  // If a detailed view is active, render it instead of the dashboard
  if (activeView && activeView !== 'refresh') {
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
          <strong>Sales {periodData.periodTitle}</strong>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{currency(periodData.sales)}</div>
        </div>
        <div 
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView('customers')}
        >
          <strong>Customers {periodData.periodTitle}</strong>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{periodData.customersCount}</div>
        </div>
        <div 
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView('pendingBills')}
        >
          <strong>Pending Bills {periodData.periodTitle}</strong>
          <div style={{ fontSize: 22, margin: '8px 0' }}>{periodData.pendingBillsCount}</div>
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
      
      {/* Chart Controls */}
      <div style={{ marginTop: 32, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, marginRight: 16 }}>Sales Analytics</h3>
          
          <button 
            onClick={refreshCharts}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '4px', 
              border: '1px solid #1bb666', 
              backgroundColor: '#1bb666', 
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.85em'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>Period:</label>
            <select 
              value={chartPeriod} 
              onChange={(e) => setChartPeriod(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="days3">Last 3 Days</option>
              <option value="days">Last 7 Days</option>
              <option value="days14">Last 14 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="days90">Last 90 Days</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="ytd">Year to Date</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>Chart Type:</label>
            <select 
              value={chartType} 
              onChange={(e) => setChartType(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>

          {chartPeriod === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>From:</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <label style={{ fontSize: '0.9em', fontWeight: 'bold' }}>To:</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85em', color: '#666', marginRight: '4px' }}>Quick:</span>
                {[
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'thisWeek', label: 'This Week' },
                  { key: 'lastWeek', label: 'Last Week' },
                  { key: 'thisMonth', label: 'This Month' },
                  { key: 'lastMonth', label: 'Last Month' }
                ].map(preset => (
                  <button
                    key={preset.key}
                    onClick={() => setQuickDateRange(preset.key)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.75em',
                      borderRadius: '3px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer',
                      color: '#495057'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Sales Chart */}
      {window.Chart ? (
        <div style={{ marginBottom: 32 }}>
          <h4 style={{ margin: '16px 0 8px 0' }}>{generateChartData().title}</h4>
          <div style={{ position: 'relative', height: '400px', width: '100%' }}>
            <canvas id="salesChart" style={{ maxWidth: '100%', width: '100%', height: '100%' }}></canvas>
          </div>
        </div>
      ) : (
        <div className="muted" style={{ marginBottom: 32 }}>
          Chart.js not available. Please enable external scripts for charts.
        </div>
      )}

      {/* Hourly Breakdown Chart */}
      {window.Chart && (
        <div>
          <h4 style={{ margin: '16px 0 8px 0' }}>Today&apos;s Sales by Hour</h4>
          <div style={{ position: 'relative', height: '300px', width: '100%' }}>
            <canvas id="hourlyChart" style={{ maxWidth: '100%', width: '100%', height: '100%' }}></canvas>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
