-- Smart Quantity Input System Migration
-- Run this SQL in your Supabase SQL editor to add smart quantity support

-- =====================================================
-- STEP 1: Add Smart Quantity Columns to Products Table
-- =====================================================

-- Add unitType column (Kg, Litre, etc.)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.products ADD COLUMN unitType TEXT;
        RAISE NOTICE 'Added unitType column to products table';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'unitType column already exists in products table';
    END;
END $$;

-- Add unitPrice column (price per unit)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.products ADD COLUMN unitPrice NUMERIC(10,2);
        RAISE NOTICE 'Added unitPrice column to products table';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'unitPrice column already exists in products table';
    END;
END $$;

-- =====================================================
-- STEP 2: Create User Initialization Table (if needed) and Update Tracking
-- =====================================================

-- Create user_initialization table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_initialization (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    products_initialized BOOLEAN DEFAULT false,
    migration_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_initialization table if not already enabled
DO $$
BEGIN
    ALTER TABLE public.user_initialization ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on user_initialization table';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled on user_initialization table or other issue: %', SQLERRM;
END $$;

-- Create RLS policies for user_initialization (if they don't exist)
DO $$
BEGIN
    -- Create policy for SELECT
    BEGIN
        EXECUTE 'CREATE POLICY "Users can view own initialization status" ON public.user_initialization FOR SELECT USING (auth.uid() = user_id)';
        RAISE NOTICE 'Created SELECT policy for user_initialization';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'SELECT policy already exists for user_initialization';
    END;
    
    -- Create policy for INSERT
    BEGIN
        EXECUTE 'CREATE POLICY "Users can insert own initialization status" ON public.user_initialization FOR INSERT WITH CHECK (auth.uid() = user_id)';
        RAISE NOTICE 'Created INSERT policy for user_initialization';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'INSERT policy already exists for user_initialization';
    END;
    
    -- Create policy for UPDATE
    BEGIN
        EXECUTE 'CREATE POLICY "Users can update own initialization status" ON public.user_initialization FOR UPDATE USING (auth.uid() = user_id)';
        RAISE NOTICE 'Created UPDATE policy for user_initialization';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'UPDATE policy already exists for user_initialization';
    END;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_initialization updated_at (if it doesn't exist)
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE TRIGGER update_user_initialization_updated_at BEFORE UPDATE ON public.user_initialization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        RAISE NOTICE 'Created updated_at trigger for user_initialization';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'updated_at trigger already exists for user_initialization';
    END;
END $$;

-- Add smart quantity upgrade tracking column
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.user_initialization ADD COLUMN smart_quantity_upgrade_completed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added smart_quantity_upgrade_completed column to user_initialization table';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'smart_quantity_upgrade_completed column already exists in user_initialization table';
    END;
END $$;

-- =====================================================
-- STEP 3: Initialize Default Smart Quantity Products
-- =====================================================

-- Update existing products to smart quantity format (optional - this will be done automatically by the app)
-- This section provides example queries if you want to manually update specific products

/*
-- Example: Convert "Milk (500ml)" to smart quantity "Fresh Milk" 
UPDATE public.products 
SET 
    name = 'Fresh Milk',
    category = 'Milk',
    description = 'Fresh cow milk',
    unitType = 'Litre',
    unitPrice = 60.00,  -- ₹60 per Litre (if 500ml was ₹30)
    price = NULL        -- Remove fixed price to enable smart quantity
WHERE name = 'Milk (500ml)';

-- Example: Convert "Ghee (500g)" to smart quantity "Pure Desi Ghee"
UPDATE public.products 
SET 
    name = 'Pure Desi Ghee',
    category = 'Ghee', 
    description = 'Pure desi ghee',
    unitType = 'Kg',
    unitPrice = 900.00, -- ₹900 per Kg (if 500g was ₹450)
    price = NULL
WHERE name = 'Ghee (500g)';

-- Example: Convert "Paneer (200g)" to smart quantity "Fresh Paneer"
UPDATE public.products 
SET 
    name = 'Fresh Paneer',
    category = 'Paneer',
    description = 'Fresh paneer',
    unitType = 'Kg',
    unitPrice = 450.00, -- ₹450 per Kg (if 200g was ₹90)
    price = NULL
WHERE name = 'Paneer (200g)';
*/

-- =====================================================
-- STEP 4: Create Indexes for Performance
-- =====================================================

-- Create index on unitType for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_unit_type ON public.products(user_id, unitType) WHERE unitType IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public' 
  AND column_name IN ('unittype', 'unitprice')
ORDER BY column_name;

-- Check user_initialization table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_initialization' 
  AND table_schema = 'public' 
ORDER BY column_name;

-- Display current products with smart quantity support
SELECT 
    name,
    category,
    price as fixed_price,
    unittype,
    unitprice,
    CASE 
        WHEN unittype IS NOT NULL AND unitprice IS NOT NULL THEN 'Smart Quantity Enabled'
        WHEN price IS NOT NULL THEN 'Fixed Price'
        ELSE 'No Pricing Set'
    END as pricing_type
FROM public.products
ORDER BY user_id, name;

-- Summary
SELECT 
    'Smart Quantity Migration completed successfully' as status,
    (SELECT COUNT(*) FROM public.products WHERE unittype IS NOT NULL) as smart_quantity_products,
    (SELECT COUNT(*) FROM public.products WHERE price IS NOT NULL AND unittype IS NULL) as fixed_price_products,
    (SELECT COUNT(*) FROM public.products) as total_products;