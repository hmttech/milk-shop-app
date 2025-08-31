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
        // If table doesn't exist, check if products exist to determine initialization status
        if (error.message && error.message.includes('table') && error.message.includes('schema cache')) {
          console.warn('user_initialization table not found, checking products to determine initialization status')
          
          // Check if user already has products
          const existingProducts = await this.getProducts(userId)
          const hasProducts = existingProducts.length > 0
          
          return { 
            user_id: userId, 
            products_initialized: hasProducts, // If products exist, consider them initialized
            migration_completed: hasProducts  // If products exist, consider migration complete
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
      // If any error accessing the table, check existing products to determine status
      console.warn('Error accessing user_initialization table:', error.message, '- checking existing products')
      
      try {
        const existingProducts = await this.getProducts(userId)
        const hasProducts = existingProducts.length > 0
        
        return { 
          user_id: userId, 
          products_initialized: hasProducts, // If products exist, consider them initialized
          migration_completed: hasProducts  // If products exist, consider migration complete
        }
      } catch (productsError) {
        console.error('Error checking existing products:', productsError.message)
        // Fallback to false to prevent infinite loops, but this should be rare
        return { 
          user_id: userId, 
          products_initialized: false, 
          migration_completed: false 
        }
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
    // eslint-disable-next-line no-unused-vars
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
    // eslint-disable-next-line no-unused-vars
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
        name: 'Fresh Milk',
        category: 'Milk',
        description: 'Fresh cow milk',
        unitType: 'Litre',
        unitPrice: 60.00, // Per Litre
        qty: 80,
        low_at: 10,
      },
      {
        name: 'Pure Desi Ghee',
        category: 'Ghee',
        description: 'Pure desi ghee',
        unitType: 'Kg',
        unitPrice: 900.00, // Per KG
        qty: 20,
        low_at: 5,
      },
      {
        name: 'Fresh Paneer',
        category: 'Paneer',
        description: 'Fresh paneer',
        unitType: 'Kg',
        unitPrice: 450.00, // Per KG
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
      {
        name: 'Milk Packet (500ml)',
        category: 'Milk',
        description: 'Packaged cow milk',
        price: 30,
        qty: 100,
        low_at: 10,
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

  // Migrate existing products to smart quantity format
  async upgradeProductsToSmartQuantity(userId, forceUpgrade = false) {
    this._checkSupabase()
    
    // Check if this upgrade was already performed (unless forcing)
    const initStatus = await this.getUserInitialization(userId)
    if (initStatus.smart_quantity_upgrade_completed && !forceUpgrade) {
      // Even if marked complete, verify products actually have unitType fields
      const products = await this.getProducts(userId)
      const smartProducts = ['Fresh Milk', 'Pure Desi Ghee', 'Fresh Paneer']
      const needsUpgrade = products.some(p => 
        smartProducts.some(sp => p.name.includes(sp.replace('Fresh ', '').replace('Pure ', '').replace('Desi ', ''))) && 
        !p.unitType
      )
      
      if (!needsUpgrade) {
        return { success: true, message: 'Smart quantity upgrade already completed' }
      }
      
      // If products need upgrade despite being marked complete, continue with upgrade
    }

    const products = await this.getProducts(userId)
    
    // Define smart product configurations for both old names and current names
    const smartProductConfigs = [
      {
        name: 'Fresh Milk',
        category: 'Milk',
        description: 'Fresh cow milk',
        unitType: 'Litre',
        unitPrice: 60.00,
        oldNames: ['Milk (500ml)', 'Milk (1L)', 'Fresh Milk']
      },
      {
        name: 'Pure Desi Ghee',
        category: 'Ghee',
        description: 'Pure desi ghee',
        unitType: 'Kg',
        unitPrice: 900.00,
        oldNames: ['Ghee (500g)', 'Pure Desi Ghee']
      },
      {
        name: 'Fresh Paneer',
        category: 'Paneer',
        description: 'Fresh paneer',
        unitType: 'Kg',
        unitPrice: 450.00,
        oldNames: ['Paneer (200g)', 'Fresh Paneer']
      }
    ]

    let upgradeCount = 0
    
    for (const config of smartProductConfigs) {
      // Find any product that matches this configuration (by any of the possible names)
      const existingProduct = products.find(p => 
        config.oldNames.some(oldName => 
          p.name === oldName || 
          p.name.toLowerCase().includes(config.name.toLowerCase().replace('fresh ', '').replace('pure ', '').replace('desi ', ''))
        )
      )
      
      if (existingProduct) {
        // Check if product already has unitType - if so, just ensure unitPrice is correct
        if (existingProduct.unitType) {
          // Product already has unitType, just verify/update unitPrice if needed
          if (!existingProduct.unitPrice || existingProduct.unitPrice !== config.unitPrice) {
            try {
              await this.updateProduct(userId, existingProduct.id, {
                unitPrice: config.unitPrice
              })
              upgradeCount++
            } catch (error) {
              console.error(`Failed to update unitPrice for ${existingProduct.name}:`, error)
            }
          }
        } else {
          // Product doesn't have unitType, upgrade it fully
          try {
            await this.updateProduct(userId, existingProduct.id, {
              name: config.name,
              category: config.category,
              description: config.description,
              unitType: config.unitType,
              unitPrice: config.unitPrice,
              price: null, // Remove fixed price for unit-based products
              qty: existingProduct.qty || 50, // Keep existing quantity or default
              low_at: existingProduct.low_at || 5 // Keep existing low stock threshold
            })
            upgradeCount++
          } catch (error) {
            console.error(`Failed to upgrade product ${existingProduct.name}:`, error)
          }
        }
      } else {
        // Product doesn't exist, create it
        try {
          await this.createProduct(userId, {
            name: config.name,
            category: config.category,
            description: config.description,
            unitType: config.unitType,
            unitPrice: config.unitPrice,
            qty: 50,
            low_at: 5
          })
          upgradeCount++
        } catch (error) {
          // Ignore if product already exists
          if (!error.message.includes('already exists')) {
            console.error(`Failed to create smart product ${config.name}:`, error)
          }
        }
      }
    }

    // Mark the upgrade as completed
    await this.setUserInitialization(userId, { 
      smart_quantity_upgrade_completed: true 
    })

    return { 
      success: true, 
      message: upgradeCount > 0 ? `Upgraded ${upgradeCount} products to smart quantity format` : 'Smart products already configured'
    }
  }
}

export const dbService = new DatabaseService()