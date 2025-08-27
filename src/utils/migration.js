import { dbService } from './database.js'
import { loadState as loadLocalState } from './storage.js'

export async function migrateLocalStorageToSupabase(userId) {
  try {
    // Check if migration was already completed for this user using database tracking
    const initStatus = await dbService.getUserInitialization(userId)
    
    if (initStatus.migration_completed) {
      // Migration already completed, don't re-initialize products
      // If user has 0 products, it's because they deleted them - respect their choice
      return { success: true, message: 'Data already migrated' }
    }

    // Get local storage data
    const localData = loadLocalState()
    
    // Check if we have any data to migrate
    if (!localData.products?.length && !localData.customers?.length && !localData.bills?.length) {
      // No local data to migrate, initialize with default products only if not already initialized
      if (!initStatus.products_initialized) {
        await dbService.initializeDefaultProducts(userId)
      }
      
      // Mark migration as completed
      await dbService.setUserInitialization(userId, { 
        migration_completed: true,
        products_initialized: true 
      })
      
      // Clear localStorage migration tracking (legacy cleanup)
      const migrationKey = `migration_completed_${userId}`
      localStorage.removeItem(migrationKey)
      
      return { success: true, message: 'Initialized with default products' }
    }

    // Migrate shop info
    if (localData.shop) {
      await dbService.updateShop(userId, localData.shop)
    }

    // Migrate products
    if (localData.products?.length) {
      for (const product of localData.products) {
        try {
          await dbService.createProduct(userId, {
            name: product.name,
            category: product.category,
            description: product.description,
            price: product.price,
            qty: product.qty,
            low_at: product.lowAt || 5
          })
        } catch (error) {
          // If product already exists, skip it
          if (error.message.includes('already exists')) {
            console.log(`Product "${product.name}" already exists, skipping`)
          } else {
            throw error
          }
        }
      }
    }

    // Migrate customers
    if (localData.customers?.length) {
      for (const customer of localData.customers) {
        await dbService.createCustomer(userId, {
          name: customer.name,
          phone: customer.phone,
          religion: customer.religion,
          general: customer.general
        })
      }
    }

    // Migrate bills
    if (localData.bills?.length) {
      for (const bill of localData.bills) {
        await dbService.createBill(userId, {
          invoice_no: bill.invoiceNo,
          customer_id: bill.customer?.id,
          customer_name: bill.customer?.name,
          customer_phone: bill.customer?.phone,
          customer_religion: bill.customer?.religion,
          customer_general: bill.customer?.general,
          status: bill.status,
          subtotal: bill.subtotal,
          discount: bill.discount,
          total: bill.total,
          due_date: bill.dueDate
        }, bill.items || [])
      }
    }

    // Mark migration as completed in database
    await dbService.setUserInitialization(userId, { 
      migration_completed: true,
      products_initialized: true 
    })
    
    // Clear localStorage migration tracking (legacy cleanup)
    const migrationKey = `migration_completed_${userId}`
    localStorage.removeItem(migrationKey)
    
    return { success: true, message: 'Migration completed successfully' }
  } catch (error) {
    console.error('Migration error:', error)
    // Don't mark migration as completed if it failed
    return { success: false, error: error.message }
  }
}