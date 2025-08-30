-- Simple Smart Quantity Migration
-- Run this SQL in your Supabase SQL editor if you get "relation does not exist" errors
-- This is a minimal version that creates only the essential tables and columns

-- =====================================================
-- STEP 1: Create user_initialization table if missing
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
ALTER TABLE public.user_initialization ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Add smart quantity columns to products table
-- =====================================================

-- Add unitType column (Kg, Litre, etc.) if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unittype'
    ) THEN
        ALTER TABLE public.products ADD COLUMN unitType TEXT;
        RAISE NOTICE 'Added unitType column to products table';
    ELSE
        RAISE NOTICE 'unitType column already exists in products table';
    END IF;
END $$;

-- Add unitPrice column (price per unit) if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unitprice'
    ) THEN
        ALTER TABLE public.products ADD COLUMN unitPrice NUMERIC(10,2);
        RAISE NOTICE 'Added unitPrice column to products table';
    ELSE
        RAISE NOTICE 'unitPrice column already exists in products table';
    END IF;
END $$;

-- Add smart_quantity_upgrade_completed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_initialization' 
        AND table_schema = 'public' 
        AND column_name = 'smart_quantity_upgrade_completed'
    ) THEN
        ALTER TABLE public.user_initialization ADD COLUMN smart_quantity_upgrade_completed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added smart_quantity_upgrade_completed column to user_initialization table';
    ELSE
        RAISE NOTICE 'smart_quantity_upgrade_completed column already exists';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION - Check if everything was created
-- =====================================================

-- Verify the tables and columns exist
SELECT 
    'Migration completed successfully!' as status,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_initialization' 
        AND table_schema = 'public'
    ) THEN '✓ user_initialization table exists' 
    ELSE '✗ user_initialization table missing' END as table_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unittype'
    ) THEN '✓ unitType column exists' 
    ELSE '✗ unitType column missing' END as unittype_check,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND table_schema = 'public' 
        AND column_name = 'unitprice'
    ) THEN '✓ unitPrice column exists' 
    ELSE '✗ unitPrice column missing' END as unitprice_check;