import { dbService } from './database.js'
import { loadState as loadLocalState } from './storage.js'

export async function migrateLocalStorageToSupabase(userId) {
  try {
    // Get local storage data
    const localData = loadLocalState()
    
    // Check if we have any data to migrate
    if (!localData.products?.length && !localData.customers?.length && !localData.bills?.length) {
      // No local data to migrate, initialize with default products
      await dbService.initializeDefaultProducts(userId)
      return { success: true, message: 'Initialized with default products' }
    }

    // Migrate shop info
    if (localData.shop) {
      await dbService.updateShop(userId, localData.shop)
    }

    // Migrate products
    if (localData.products?.length) {
      for (const product of localData.products) {
        await dbService.createProduct(userId, {
          name: product.name,
          category: product.category,
          description: product.description,
          price: product.price,
          qty: product.qty,
          low_at: product.lowAt || 5
        })
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

    return { success: true, message: 'Migration completed successfully' }
  } catch (error) {
    console.error('Migration error:', error)
    return { success: false, error: error.message }
  }
}