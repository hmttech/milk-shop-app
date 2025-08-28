import { uid, todayISO, parseNum } from './helpers.js'
import { genInvoiceNumber } from './generators.js'
import { genPDF } from './pdf.js'
import { downloadFile } from './storage.js'
import { dbService } from './database.js'

// Product management functions (async versions)
export async function addOrUpdateProduct(userId, setState, setEditingProduct, setNotif, p) {
  try {
    let product
    if (p.id && p.id !== null) {
      // Update existing product
      product = await dbService.updateProduct(userId, p.id, {
        name: p.name,
        category: p.category,
        description: p.description,
        price: parseNum(p.price),
        qty: parseNum(p.qty),
        low_at: parseNum(p.lowAt || p.low_at || 5)
      })
    } else {
      // Create new product
      product = await dbService.createProduct(userId, {
        name: p.name,
        category: p.category,
        description: p.description,
        price: parseNum(p.price),
        qty: parseNum(p.qty),
        low_at: parseNum(p.lowAt || p.low_at || 5)
      })
    }

    // Update local state
    setState((prev) => {
      const transformedProduct = { ...product, lowAt: product.low_at }
      const exists = prev.products.some((x) => x.id === transformedProduct.id)
      const products = exists
        ? prev.products.map((x) => (x.id === transformedProduct.id ? transformedProduct : x))
        : [transformedProduct, ...prev.products]
      return { ...prev, products }
    })

    setEditingProduct(null)
    setNotif(p.id ? 'Product updated.' : 'Product added.')
    setTimeout(() => setNotif(''), 2000)
  } catch (error) {
    console.error('Error saving product:', error)
    setNotif('Error saving product: ' + error.message)
    setTimeout(() => setNotif(''), 3000)
  }
}

export async function removeProduct(userId, setState, setNotif, id) {
  try {
    await dbService.deleteProduct(userId, id)
    setState((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }))
    setNotif('Product deleted.')
    setTimeout(() => setNotif(''), 2000)
  } catch (error) {
    console.error('Error deleting product:', error)
    setNotif('Error deleting product: ' + error.message)
    setTimeout(() => setNotif(''), 3000)
  }
}

// Customer management functions (async versions)
export async function addOrUpdateCustomer(userId, setState, setNotif, form, editingId, state) {
  const name = form.name.trim()
  const phone = form.phone.trim()
  if (!name) return

  try {
    // Check for duplicate phone
    if (phone && state.customers.some((c) => c.phone === phone && c.id !== editingId)) {
      setNotif('Customer with this phone already exists.')
      setTimeout(() => setNotif(''), 2000)
      return
    }

    let customer
    if (editingId) {
      // Update existing customer
      customer = await dbService.updateCustomer(userId, editingId, {
        name,
        phone,
        religion: form.religion,
        general: form.general
      })
      
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((c) => (c.id === editingId ? customer : c)),
      }))
      setNotif('Customer updated.')
    } else {
      // Create new customer
      customer = await dbService.createCustomer(userId, {
        name,
        phone,
        religion: form.religion,
        general: form.general
      })

      setState((prev) => ({ ...prev, customers: [customer, ...prev.customers] }))
      setNotif('Customer added.')
    }
    
    setTimeout(() => setNotif(''), 2000)
    return { name: '', phone: '', religion: '', general: true }
  } catch (error) {
    console.error('Error saving customer:', error)
    setNotif('Error saving customer: ' + error.message)
    setTimeout(() => setNotif(''), 3000)
  }
}

export async function deleteCustomer(userId, setState, setNotif, id, editingId, setEditingId, setForm) {
  try {
    await dbService.deleteCustomer(userId, id)
    setState((prev) => ({ ...prev, customers: prev.customers.filter((c) => c.id !== id) }))
    
    if (editingId === id) {
      setEditingId(null)
      setForm({ name: '', phone: '', religion: '', general: true })
    }
    
    setNotif('Customer deleted.')
    setTimeout(() => setNotif(''), 2000)
  } catch (error) {
    console.error('Error deleting customer:', error)
    setNotif('Error deleting customer: ' + error.message)
    setTimeout(() => setNotif(''), 3000)
  }
}

// Cart management functions (these remain local/synchronous)
export function addToCart(setState, prod, qty = 1) {
  setState((prev) => {
    const existing = prev.cart.find((c) => c.id === prod.id)
    if (existing) {
      return {
        ...prev,
        cart: prev.cart.map((c) =>
          c.id === prod.id ? { ...c, qty: c.qty + qty } : c
        ),
      }
    }
    return { ...prev, cart: [{ ...prod, qty }, ...prev.cart] }
  })
}

export function updateCartQty(setState, id, qty) {
  setState((prev) => ({
    ...prev,
    cart: prev.cart.map((c) => (c.id === id ? { ...c, qty: parseNum(qty) } : c)),
  }))
}

export function removeFromCart(setState, id) {
  setState((prev) => ({ ...prev, cart: prev.cart.filter((c) => c.id !== id) }))
}

export async function ensureCustomer(userId, setState, state, name, phone, religion, general) {
  const existing = state.customers.find((c) => c.phone === phone && phone)
  if (existing) return existing

  try {
    const customer = await dbService.createCustomer(userId, {
      name,
      phone,
      religion,
      general
    })
    
    setState((prev) => ({ ...prev, customers: [customer, ...prev.customers] }))
    return customer
  } catch (error) {
    console.error('Error creating customer:', error)
    // Return a temporary customer object for the bill
    return { id: uid(), name, phone, religion, general, createdAt: todayISO() }
  }
}

export async function checkout({
  userId,
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
}) {
  if (!state.cart.length) {
    setNotif('Cart is empty.')
    setTimeout(() => setNotif(''), 2000)
    return
  }

  try {
    const subtotal = state.cart.reduce((s, c) => s + c.price * c.qty, 0)
    const discountAmount = parseNum(discount)
    const total = subtotal - discountAmount

    // Find or create customer
    let customer = null
    if (customerName.trim()) {
      customer = await ensureCustomer(userId, setState, state, customerName.trim(), customerPhone.trim(), religion, general)
    }

    // Create bill data
    const billData = {
      invoice_no: genInvoiceNumber(state.bills.length + 1),
      customer_id: customer?.id,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_religion: religion,
      customer_general: general,
      status,
      subtotal,
      discount: discountAmount,
      total,
      due_date: status === 'Pending' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
    }

    // Create bill items
    const billItems = state.cart.map(item => ({
      product_id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      total: item.price * item.qty
    }))

    // Save to database
    const bill = await dbService.createBill(userId, billData, billItems)

    // Transform bill to match UI expectations
    const transformedBill = {
      ...bill,
      invoiceNo: bill.invoice_no,
      createdAt: bill.created_at,
      updatedAt: bill.updated_at,
      dueDate: bill.due_date,
      customerName: bill.customer_name,
      customerPhone: bill.customer_phone,
      customerReligion: bill.customer_religion,
      customerGeneral: bill.customer_general,
      customerId: bill.customer_id,
      customer: bill.customer_name ? {
        id: bill.customer_id,
        name: bill.customer_name,
        phone: bill.customer_phone,
        religion: bill.customer_religion,
        general: bill.customer_general
      } : null
    }

    // Update local state
    setState((prev) => ({
      ...prev,
      bills: [transformedBill, ...prev.bills],
      cart: []
    }))

    // Update product quantities in database and local state
    for (const cartItem of state.cart) {
      const product = state.products.find(p => p.id === cartItem.id)
      if (product) {
        const newQty = Math.max(0, product.qty - cartItem.qty)
        await dbService.updateProduct(userId, product.id, { 
          name: product.name,
          category: product.category,
          description: product.description,
          price: product.price,
          qty: newQty,
          low_at: product.lowAt || product.low_at || 5
        })
        
        setState((prev) => ({
          ...prev,
          products: prev.products.map(p => 
            p.id === product.id ? { ...p, qty: newQty } : p
          )
        }))
      }
    }

    // Generate and download PDF
    const blob = genPDF(bill, state.shop);
    const filename = `${bill.invoiceNo}.pdf`;
    downloadFile(filename, blob, 'application/pdf');

    setNotif('Invoice created and PDF downloaded!')
    setTimeout(() => setNotif(''), 3000)
    setTab('Bills')
  } catch (error) {
    console.error('Error during checkout:', error)
    setNotif('Error creating invoice: ' + error.message)
    setTimeout(() => setNotif(''), 5000)
  }
}

// Utility function for toasts (unchanged)
export function showToast(text, onClick) {
  const el = document.createElement('div')
  el.textContent = text
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    background: '#1b6',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    zIndex: 9999,
    boxShadow: '0 4px 16px rgba(0,0,0,.2)',
  })
  el.onclick = () => {
    onClick && onClick()
    document.body.removeChild(el)
  }
  document.body.appendChild(el)
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el)
  }, 8000)
}