import React, { useState, useEffect, useRef } from 'react'
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
  const [error, setError] = useState(null)
  
  // Use ref to track if data is being loaded to prevent double loading
  const isLoadingRef = useRef(false)

  // Load initial data from Supabase
  useEffect(() => {
    if (!user?.id || isLoadingRef.current) return

    // Prevent duplicate calls by tracking the current user ID
    let isCancelled = false
    const currentUserId = user.id
    isLoadingRef.current = true

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Run migration - it handles its own completion tracking using database
        const migrationResult = await migrateLocalStorageToSupabase(currentUserId)
        
        // Check if the effect was cancelled (user changed or component unmounted)
        if (isCancelled) return
        
        if (migrationResult.success) {
          setNotif(migrationResult.message)
          setTimeout(() => setNotif(''), 3000)
        } else {
          console.error('Migration failed:', migrationResult.error)
          setNotif('Migration failed: ' + migrationResult.error)
          setTimeout(() => setNotif(''), 5000)
        }

        // Load all data
        const [shop, products, customers, bills] = await Promise.all([
          dbService.getShop(currentUserId),
          dbService.getProducts(currentUserId),
          dbService.getCustomers(currentUserId),
          dbService.getBills(currentUserId)
        ])

        // Check again if the effect was cancelled
        if (isCancelled) return

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
        if (isCancelled) return
        
        console.error('Error loading data:', error)
        setError(error.message)
        setNotif('Error loading data: ' + error.message)
        setTimeout(() => setNotif(''), 5000)
      } finally {
        if (!isCancelled) {
          setLoading(false)
          isLoadingRef.current = false
        }
      }
    }

    loadData()

    // Cleanup function to cancel the effect if user changes or component unmounts
    return () => {
      isCancelled = true
      isLoadingRef.current = false
    }
  }, [user?.id]) // Only depend on user.id, not the entire user object

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

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '1rem', fontSize: '1.2rem', color: '#d32f2f' }}>
          ⚠️ Error Loading Application
        </div>
        <div style={{ marginBottom: '1rem', color: '#666', maxWidth: '500px' }}>
          {error}
        </div>
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#1976d2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Retry
          </button>
          <button 
            onClick={handleSignOut}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#757575', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#999' }}>
          If this problem persists, please contact support.
        </div>
      </div>
    )
  }

  const tabs = [
    'Billing',
    'Products',
    'Customers',
    'Bills',
    'Dashboard',
    'WhatsApp Marketing',
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

  // Render the current tab component
  const renderCurrentTab = () => {
    switch (tab) {
      case 'Billing':
        return <Billing {...appProps} />
      case 'Products':
        return <Products {...appProps} />
      case 'Customers':
        return <Customers {...appProps} />
      case 'Bills':
        return <Bills {...appProps} />
      case 'Dashboard':
        return <Dashboard {...appProps} />
      case 'WhatsApp Marketing':
        return <WhatsAppMarketing {...appProps} />
      default:
        return <Billing {...appProps} />
    }
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
        {tabs.map((label) => (
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
        {renderCurrentTab()}
      </main>
    </>
  )
}

export default AppWithAuth