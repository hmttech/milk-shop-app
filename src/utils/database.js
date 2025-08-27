import { supabase } from './supabase.js'
import { uid, todayISO } from './helpers.js'

class DatabaseService {
  // Shop operations
  async getShop(userId) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return data || { name: 'Govinda Dughdalay', phone: '+91 90000 00000', addr: 'Near Temple Road, Mumbai' }
  }

  async updateShop(userId, shopData) {
    const { data, error } = await supabase
      .from('shops')
      .upsert({ 
        user_id: userId, 
        ...shopData,
        updated_at: todayISO()
      })
      .select()

    if (error) throw error
    return data[0]
  }

  // Product operations
  async getProducts(userId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createProduct(userId, product) {
    const productData = {
      id: uid(),
      user_id: userId,
      ...product,
      created_at: todayISO(),
      updated_at: todayISO()
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()

    if (error) throw error
    return data[0]
  }

  async updateProduct(userId, productId, product) {
    const { data, error } = await supabase
      .from('products')
      .update({ 
        ...product, 
        updated_at: todayISO() 
      })
      .eq('id', productId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  async deleteProduct(userId, productId) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Customer operations
  async getCustomers(userId) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createCustomer(userId, customer) {
    const customerData = {
      id: uid(),
      user_id: userId,
      ...customer,
      created_at: todayISO(),
      updated_at: todayISO()
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()

    if (error) throw error
    return data[0]
  }

  async updateCustomer(userId, customerId, customer) {
    const { data, error } = await supabase
      .from('customers')
      .update({ 
        ...customer, 
        updated_at: todayISO() 
      })
      .eq('id', customerId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  async deleteCustomer(userId, customerId) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Bill operations
  async getBills(userId) {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        bill_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(bill => ({
      ...bill,
      items: bill.bill_items || []
    }))
  }

  async createBill(userId, bill, items) {
    // Start a transaction
    const billData = {
      id: uid(),
      user_id: userId,
      ...bill,
      created_at: todayISO(),
      updated_at: todayISO()
    }

    const { data: createdBill, error: billError } = await supabase
      .from('bills')
      .insert(billData)
      .select()

    if (billError) throw billError

    // Create bill items
    const billItemsData = items.map(item => ({
      id: uid(),
      bill_id: createdBill[0].id,
      user_id: userId,
      ...item,
      created_at: todayISO()
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItemsData)
      .select()

    if (itemsError) throw itemsError

    return {
      ...createdBill[0],
      items: createdItems
    }
  }

  async updateBill(userId, billId, bill) {
    const { data, error } = await supabase
      .from('bills')
      .update({ 
        ...bill, 
        updated_at: todayISO() 
      })
      .eq('id', billId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  async deleteBill(userId, billId) {
    // Delete bill items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('bill_items')
      .delete()
      .eq('bill_id', billId)
      .eq('user_id', userId)

    if (itemsError) throw itemsError

    // Delete bill
    const { error: billError } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId)
      .eq('user_id', userId)

    if (billError) throw billError
  }

  // Helper method to check if user exists in customers by phone
  async findCustomerByPhone(userId, phone) {
    if (!phone) return null
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .eq('phone', phone)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }

  // Initialize default products for new users
  async initializeDefaultProducts(userId) {
    const defaultProducts = [
      {
        name: 'Milk (500ml)',
        category: 'Milk',
        description: 'Fresh cow milk',
        price: 30,
        qty: 100,
        low_at: 10,
      },
      {
        name: 'Milk (1L)',
        category: 'Milk',
        description: 'Fresh cow milk',
        price: 60,
        qty: 80,
        low_at: 10,
      },
      {
        name: 'Ghee (500g)',
        category: 'Ghee',
        description: 'Pure desi ghee',
        price: 450,
        qty: 20,
        low_at: 5,
      },
      {
        name: 'Paneer (200g)',
        category: 'Paneer',
        description: 'Fresh paneer',
        price: 90,
        qty: 30,
        low_at: 6,
      },
      {
        name: 'Rasgulla (tin)',
        category: 'Sweets',
        description: 'Rasgulla tin',
        price: 180,
        qty: 15,
        low_at: 4,
      },
    ]

    const productsData = defaultProducts.map(product => ({
      id: uid(),
      user_id: userId,
      ...product,
      created_at: todayISO(),
      updated_at: todayISO()
    }))

    const { data, error } = await supabase
      .from('products')
      .insert(productsData)
      .select()

    if (error) throw error
    return data
  }
}

export const dbService = new DatabaseService()