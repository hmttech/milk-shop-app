import { supabase, isSupabaseConfigured } from './supabase.js'
import { uid, todayISO } from './helpers.js'

class DatabaseService {
  // Helper method to check if Supabase is available
  _checkSupabase() {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase is not properly configured. Please check your environment variables.')
    }
  }

  // Shop operations
  async getShop(userId) {
    this._checkSupabase()
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
    this._checkSupabase()
    // First check if shop exists
    const existingShop = await this.getShop(userId)
    
    // If the existing shop is just the default data (no database record), create a new one
    const isDefaultShop = !existingShop.id && 
                         existingShop.name === 'Govinda Dughdalay' && 
                         existingShop.phone === '+91 90000 00000'
    
    if (isDefaultShop) {
      // Insert new shop record
      const { data, error } = await supabase
        .from('shops')
        .insert({ 
          user_id: userId, 
          ...shopData,
          created_at: todayISO(),
          updated_at: todayISO()
        })
        .select()

      if (error) {
        // If it's a unique constraint violation, try to fetch the existing record
        if (error.code === '23505') {
          const { data: existingData, error: fetchError } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          if (fetchError) throw fetchError
          return existingData
        }
        throw error
      }
      return data[0]
    } else {
      // Update existing shop record
      const { data, error } = await supabase
        .from('shops')
        .update({ 
          ...shopData,
          updated_at: todayISO()
        })
        .eq('user_id', userId)
        .select()

      if (error) throw error
      return data[0]
    }
  }

  // Product operations
  async getProducts(userId) {
    this._checkSupabase()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // User initialization tracking methods
  async getUserInitialization(userId) {
    this._checkSupabase()
    try {
      const { data, error } = await supabase
        .from('user_initialization')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        // If table doesn't exist, return default values
        if (error.message && error.message.includes('table') && error.message.includes('schema cache')) {
          console.warn('user_initialization table not found, using default values')
          return { 
            user_id: userId, 
            products_initialized: false, 
            migration_completed: false 
          }
        }
        throw error
      }

      return data || { 
        user_id: userId, 
        products_initialized: false, 
        migration_completed: false 
      }
    } catch (error) {
      // If any error accessing the table, return default values and log warning
      console.warn('Error accessing user_initialization table:', error.message)
      return { 
        user_id: userId, 
        products_initialized: false, 
        migration_completed: false 
      }
    }
  }

  async setUserInitialization(userId, updates) {
    this._checkSupabase()
    try {
      const { data, error } = await supabase
        .from('user_initialization')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: todayISO()
        })
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      // If table doesn't exist, just log and continue
      if (error.message && error.message.includes('table') && error.message.includes('schema cache')) {
        console.warn('user_initialization table not found, skipping initialization tracking')
        return { user_id: userId, ...updates }
      }
      
      // For other errors, log warning but don't throw to avoid breaking migration
      console.warn('Error updating user_initialization table:', error.message)
      return { user_id: userId, ...updates }
    }
  }

  async createProduct(userId, product) {
    this._checkSupabase()
    
    // Filter out camelCase fields that don't belong in database
    const { lowAt, ...dbProduct } = product
    
    const productData = {
      id: uid(),
      user_id: userId,
      ...dbProduct,
      created_at: todayISO(),
      updated_at: todayISO()
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()

    if (error) {
      // If it's a unique constraint violation on (user_id, name), don't retry
      if (error.code === '23505' && error.message.includes('user_id, name')) {
        // Product with this name already exists for this user
        throw new Error(`Product "${product.name}" already exists`)
      }
      // If it's a primary key violation, try with a new ID once
      if (error.code === '23505' && error.message.includes('pkey')) {
        productData.id = uid()
        const { data: retryData, error: retryError } = await supabase
          .from('products')
          .insert(productData)
          .select()
        
        if (retryError) {
          if (retryError.code === '23505' && retryError.message.includes('user_id, name')) {
            throw new Error(`Product "${product.name}" already exists`)
          }
          throw retryError
        }
        return retryData[0]
      }
      throw error
    }
    return data[0]
  }

  async updateProduct(userId, productId, product) {
    this._checkSupabase()
    
    // Filter out camelCase fields that don't belong in database
    const { lowAt, ...dbProduct } = product
    
    const { data, error } = await supabase
      .from('products')
      .update({ 
        ...dbProduct, 
        updated_at: todayISO() 
      })
      .eq('id', productId)
      .eq('user_id', userId)
      .select()

    if (error) throw error
    return data[0]
  }

  async deleteProduct(userId, productId) {
    this._checkSupabase()
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Customer operations
  async getCustomers(userId) {
    this._checkSupabase()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createCustomer(userId, customer) {
    this._checkSupabase()
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
    this._checkSupabase()
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
    this._checkSupabase()
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Bill operations
  async getBills(userId) {
    this._checkSupabase()
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
    this._checkSupabase()
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
    this._checkSupabase()
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
    this._checkSupabase()
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
    this._checkSupabase()
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
    this._checkSupabase()
    
    // Check initialization status from database first
    const initStatus = await this.getUserInitialization(userId)
    if (initStatus.products_initialized) {
      // Products already initialized, just return existing products
      return await this.getProducts(userId)
    }

    // Double-check if products exist (race condition protection)
    const existingProducts = await this.getProducts(userId)
    if (existingProducts.length > 0) {
      // Mark as initialized and return existing products
      await this.setUserInitialization(userId, { products_initialized: true })
      return existingProducts
    }

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

    try {
      // Use batch insert with ON CONFLICT handling
      const productsData = defaultProducts.map(product => ({
        id: uid(),
        user_id: userId,
        ...product,
        created_at: todayISO(),
        updated_at: todayISO()
      }))

      // Use upsert to handle conflicts gracefully
      const { data, error } = await supabase
        .from('products')
        .upsert(productsData, { 
          onConflict: 'user_id,name',
          ignoreDuplicates: true 
        })
        .select()

      // Mark as initialized regardless of whether products were inserted or already existed
      await this.setUserInitialization(userId, { products_initialized: true })

      if (error) {
        // If upsert failed for other reasons, fall back to individual inserts
        console.warn('Batch upsert failed, falling back to individual inserts:', error)
        
        const createdProducts = []
        for (const product of defaultProducts) {
          try {
            const existingProduct = await this.findProductByName(userId, product.name)
            if (existingProduct) {
              createdProducts.push(existingProduct)
            } else {
              const newProduct = await this.createProduct(userId, product)
              createdProducts.push(newProduct)
            }
          } catch (productError) {
            // If product creation fails due to constraint, try to find existing
            if (productError.message.includes('already exists')) {
              const existingProduct = await this.findProductByName(userId, product.name)
              if (existingProduct) {
                createdProducts.push(existingProduct)
              }
            } else {
              console.error(`Failed to create product ${product.name}:`, productError)
            }
          }
        }
        return createdProducts
      }

      return data || []
    } catch (error) {
      console.error('Error initializing default products:', error)
      
      // Even if initialization failed, mark as attempted to prevent infinite retries
      await this.setUserInitialization(userId, { products_initialized: true })
      
      // Return existing products if any
      return await this.getProducts(userId)
    }
  }

  // Helper method to find product by name
  async findProductByName(userId, name) {
    this._checkSupabase()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  }
}

export const dbService = new DatabaseService()