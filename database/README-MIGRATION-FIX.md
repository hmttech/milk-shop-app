# Fix Smart Billing System Database Issue

If you're getting the error "Could not find the 'unitPrice' column of 'products' in the schema cache" when saving products, you need to run this database migration to add the missing columns.

## Quick Fix

1. **Go to your Supabase dashboard**
2. **Open the SQL Editor** 
3. **Run this migration file**: `/database/fix-column-names-migration.sql`

This will add the required `unit_type` and `unit_price` columns to your products table using the correct snake_case naming convention that matches your existing database schema.

## What this fixes

- **Problem**: The database was missing the `unit_type` and `unit_price` columns needed for smart billing
- **Solution**: Adds these columns with proper snake_case naming (consistent with `low_at`, `created_at`, etc.)
- **Compatibility**: The code automatically transforms between camelCase JavaScript (`unitType`, `unitPrice`) and snake_case database columns (`unit_type`, `unit_price`)

## After running the migration

1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Try editing a product and setting the Unit Type to "Weight Based (per Kg)" or "Volume Based (per Litre)" 
3. Save the product - it should now work without errors
4. Navigate to the Billing page to see the smart quantity inputs

The smart billing system will then work as expected with dynamic quantity inputs like "250gm", "0.5kg", "500ml", etc.