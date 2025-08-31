import React, { useState, useEffect } from 'react';
import { loadState, saveState, downloadFile } from '../utils/storage.js';
import Billing from './Billing/Billing.jsx';
import Products from './Products/Products.jsx';
import Customers from './Customers/Customers.jsx';
import Bills from './Bills/Bills.jsx';
import Dashboard from './Dashboard/Dashboard.jsx';
import WhatsAppMarketing from './WhatsAppMarketing/WhatsAppMarketing.jsx';

function App() {
  const [state, setState] = useState(loadState());
  const [tab, setTab] = useState('Billing'); // default screen
  const [editingProduct, setEditingProduct] = useState(null);
  const [filter, setFilter] = useState({ billsRange: 'all', status: 'all', search: '' });
  const [notif, setNotif] = useState('');

  useEffect(() => saveState(state), [state]);

  // export / import
  useEffect(() => {
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');

    if (exportBtn) {
      exportBtn.onclick = () => {
        downloadFile(`govinda-backup-${Date.now()}.json`, JSON.stringify(state, null, 2));
      };
    }

    if (importFile) {
      importFile.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const txt = await file.text();
        try {
          const json = JSON.parse(txt);
          setState(json);
          setNotif('Backup imported successfully.');
          setTimeout(() => setNotif(''), 2000);
        } catch {
          setNotif('Invalid backup file.');
          setTimeout(() => setNotif(''), 2000);
        }
      };
    }
  }, [state]);

  const tabs = [
    ['Billing', Billing],
    ['Products', Products],
    ['Customers', Customers],
    ['Bills', Bills],
    ['Dashboard', Dashboard],
    ['WhatsApp Marketing', WhatsAppMarketing],
  ];

  // Props to pass to child components
  const appProps = {
    state,
    setState,
    editingProduct,
    setEditingProduct,
    filter,
    setFilter,
    setNotif,
    setTab,
  };

  return (
    <>
      <header>
        <div className="logo-container">
          <img 
            src="/icons/govinda-dughdalay.png" 
            alt="Govinda Dughdalay Logo"
          />
          <h1>
            Govinda Dughdalay <small>— Milk Shop Manager</small>
          </h1>
        </div>
        <div className="row">
          <span className="pill ok">Single Shop</span>
          <button id="exportBtn" className="tab">
            Export Backup
          </button>
          <label className="tab" htmlFor="importFile" style={{ cursor: 'pointer' }}>
            Import Backup
          </label>
          <input
            id="importFile"
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
          />
        </div>
      </header>

      <div className="container">
        {notif && (
          <div className="card" style={{ borderLeft: '4px solid #1b6' }}>
            {notif}
          </div>
        )}
        <div className="tabs">
          {tabs.map(([name]) => (
            <div
              key={name}
              className={`tab${tab === name ? ' active' : ''}`}
              onClick={() => setTab(name)}
            >
              {name}
            </div>
          ))}
        </div>
        {tabs.map(([name, Comp]) => (tab === name ? <Comp key={name} {...appProps} /> : null))}
      </div>

      <div className="footer">
        © <span>{new Date().getFullYear()}</span> Govinda Dughdalay | Powered by HMT Technologies
      </div>
    </>
  );
}

export default App;
