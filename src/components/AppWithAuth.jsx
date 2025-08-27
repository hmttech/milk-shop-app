import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { dbService } from '../utils/database.js'
import { migrateLocalStorageToSupabase } from '../utils/migration.js'
import { downloadFile } from '../utils/storage.js'
import Billing from './Billing/Billing.jsx'
import Products from './Products/Products.jsx'
import Customers from './Customers/Customers.jsx'
import Bills from './Bills/Bills.jsx'
import Dashboard from './Dashboard/Dashboard.jsx'
import WhatsAppMarketing from './WhatsAppMarketing/WhatsAppMarketing.jsx'

function AppWithAuth() {
  const { user, signOut } = useAuth()
  const [state, setState] = useState({
    shop: { name: 'Govinda Dughdalay', phone: '+91 90000 00000', addr: 'Near Temple Road, Mumbai' },
    products: [],
    customers: [],
    bills: [],
    cart: [],
  })
  const [tab, setTab] = useState('Billing')
  const [editingProduct, setEditingProduct] = useState(null)
  const [filter, setFilter] = useState({ billsRange: 'all', status: 'all', search: '' })
  const [notif, setNotif] = useState('')
  const [loading, setLoading] = useState(true)
  const [migrationCompleted, setMigrationCompleted] = useState(false)

  // Load initial data from Supabase
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        setLoading(true)
        
        // Check if this is a new user and migrate localStorage if needed
        if (!migrationCompleted) {
          const migrationResult = await migrateLocalStorageToSupabase(user.id)
          setMigrationCompleted(true)
          if (migrationResult.success) {
            setNotif(migrationResult.message)
            setTimeout(() => setNotif(''), 3000)
          }
        }

        // Load all data
        const [shop, products, customers, bills] = await Promise.all([
          dbService.getShop(user.id),
          dbService.getProducts(user.id),
          dbService.getCustomers(user.id),
          dbService.getBills(user.id)
        ])

        // Transform products data to match UI expectations
        const transformedProducts = products.map(product => ({
          ...product,
          lowAt: product.low_at // Map database field to UI field
        }))

        setState({
          shop,
          products: transformedProducts,
          customers,
          bills,
          cart: []
        })
      } catch (error) {
        console.error('Error loading data:', error)
        setNotif('Error loading data: ' + error.message)
        setTimeout(() => setNotif(''), 5000)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, migrationCompleted])

  // Export/Import functionality
  useEffect(() => {
    const exportBtn = document.getElementById('exportBtn')
    const importFile = document.getElementById('importFile')

    if (exportBtn) {
      exportBtn.onclick = () => {
        downloadFile(`govinda-backup-${Date.now()}.json`, JSON.stringify(state, null, 2))
      }
    }

    if (importFile) {
      importFile.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        try {
          const txt = await file.text()
          JSON.parse(txt) // Just validate the JSON
          // Note: Importing would require implementing database updates
          setNotif('Import functionality coming soon with database sync')
          setTimeout(() => setNotif(''), 3000)
        } catch {
          setNotif('Invalid backup file.')
          setTimeout(() => setNotif(''), 2000)
        }
      }
    }
  }, [state])

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Loading...</div>
        <div style={{ marginTop: '1rem', color: '#666' }}>
          Setting up your milk shop data...
        </div>
      </div>
    )
  }

  const tabs = [
    ['Billing', Billing],
    ['Products', Products],
    ['Customers', Customers],
    ['Bills', Bills],
    ['Dashboard', Dashboard],
    ['WhatsApp Marketing', WhatsAppMarketing],
  ]

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
    user, // Add user to props for database operations
  }

  return (
    <>
      <header>
        <h1>
          Govinda Dughdalay <small>— Milk Shop Manager</small>
        </h1>
        <div className="row">
          <span className="pill ok">Multi-User Cloud</span>
          <span style={{ marginLeft: '1rem', color: '#666' }}>
            {user.email}
          </span>
          <button id="exportBtn" className="tab">
            Export Backup
          </button>
          <label htmlFor="importFile" className="tab">
            Import Backup
          </label>
          <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} />
          <button onClick={handleSignOut} className="tab warn">
            Sign Out
          </button>
        </div>
      </header>

      <nav>
        {tabs.map(([label]) => (
          <button
            key={label}
            className={`tab${tab === label ? ' active' : ''}`}
            onClick={() => setTab(label)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main>
        {notif && <div className="notif">{notif}</div>}
        {tabs.find(([label]) => label === tab)?.[1](appProps)}
      </main>
    </>
  )
}

export default AppWithAuth