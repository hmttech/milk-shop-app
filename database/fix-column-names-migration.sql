-- Fix Column Names Migration
-- This migration ensures the smart quantity columns use snake_case to match the existing schema

-- =====================================================
-- STEP 1: Add smart quantity columns with proper snake_case naming
-- =====================================================

-- Add unit_type column (snake_case) if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unit_type'
    ) THEN
        ALTER TABLE public.products ADD COLUMN unit_type TEXT;
        RAISE NOTICE 'Added unit_type column to products table';
    ELSE
        RAISE NOTICE 'unit_type column already exists in products table';
    END IF;
END $$;

-- Add unit_price column (snake_case) if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE public.products ADD COLUMN unit_price NUMERIC(10,2);
        RAISE NOTICE 'Added unit_price column to products table';
    ELSE
        RAISE NOTICE 'unit_price column already exists in products table';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Migrate data from camelCase columns if they exist
-- =====================================================

-- Check if camelCase columns exist and migrate data
DO $$
BEGIN
    -- Migrate unitType to unit_type if camelCase column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unittype'
    ) THEN
        EXECUTE 'UPDATE public.products SET unit_type = unittype WHERE unittype IS NOT NULL';
        RAISE NOTICE 'Migrated data from unittype to unit_type';
    END IF;
    
    -- Migrate unitPrice to unit_price if camelCase column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unitprice'
    ) THEN
        EXECUTE 'UPDATE public.products SET unit_price = unitprice WHERE unitprice IS NOT NULL';
        RAISE NOTICE 'Migrated data from unitprice to unit_price';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Create user_initialization table if missing
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_initialization (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    products_initialized BOOLEAN DEFAULT false,
    migration_completed BOOLEAN DEFAULT false,
    smart_quantity_upgrade_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS if table was just created
DO $$
BEGIN
    ALTER TABLE public.user_initialization ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled on user_initialization table';
END $$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE POLICY "Users can view own initialization status" ON public.user_initialization FOR SELECT USING (auth.uid() = user_id)';
        RAISE NOTICE 'Created SELECT policy for user_initialization';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'SELECT policy already exists for user_initialization';
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can insert own initialization status" ON public.user_initialization FOR INSERT WITH CHECK (auth.uid() = user_id)';
        RAISE NOTICE 'Created INSERT policy for user_initialization';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'INSERT policy already exists for user_initialization';
    END;
    
    BEGIN
        EXECUTE 'CREATE POLICY "Users can update own initialization status" ON public.user_initialization FOR UPDATE USING (auth.uid() = user_id)';
        RAISE NOTICE 'Created UPDATE policy for user_initialization';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'UPDATE policy already exists for user_initialization';
    END;
END $$;

-- =====================================================
-- VERIFICATION - Check if everything was created correctly
-- =====================================================

SELECT 
    'Column migration completed successfully!' as status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unit_type'
    ) THEN '✓ unit_type column exists' 
    ELSE '✗ unit_type column missing' END as unit_type_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unit_price'
    ) THEN '✓ unit_price column exists' 
    ELSE '✗ unit_price column missing' END as unit_price_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_initialization' 
        AND table_schema = 'public'
    ) THEN '✓ user_initialization table exists' 
    ELSE '✗ user_initialization table missing' END as table_check;