-- Database Migration Script for Duplicate Product Fix
-- Run this in your Supabase SQL editor to update existing database

-- Step 1: Add unique constraint to products table (if it doesn't exist)
-- This may fail if there are existing duplicates - see cleanup section below
DO $$
BEGIN
    -- Try to add the unique constraint
    BEGIN
        ALTER TABLE public.products ADD CONSTRAINT products_user_name_unique UNIQUE (user_id, name);
        RAISE NOTICE 'Added unique constraint on products(user_id, name)';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE 'Unique constraint already exists on products(user_id, name)';
    WHEN unique_violation THEN
        RAISE NOTICE 'Cannot add unique constraint - duplicate products exist. Please clean up duplicates first.';
    END;
END $$;

-- Step 2: Create user initialization tracking table
CREATE TABLE IF NOT EXISTS public.user_initialization (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    products_initialized BOOLEAN DEFAULT false,
    migration_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3: Enable RLS on user_initialization table
ALTER TABLE public.user_initialization ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for user_initialization
DROP POLICY IF EXISTS "Users can view own initialization status" ON public.user_initialization;
CREATE POLICY "Users can view own initialization status" ON public.user_initialization FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own initialization status" ON public.user_initialization;
CREATE POLICY "Users can insert own initialization status" ON public.user_initialization FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own initialization status" ON public.user_initialization;
CREATE POLICY "Users can update own initialization status" ON public.user_initialization FOR UPDATE USING (auth.uid() = user_id);

-- Step 5: Create trigger for user_initialization updated_at
DROP TRIGGER IF EXISTS update_user_initialization_updated_at ON public.user_initialization;
CREATE TRIGGER update_user_initialization_updated_at BEFORE UPDATE ON public.user_initialization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Initialize tracking for existing users with products
INSERT INTO public.user_initialization (user_id, products_initialized, migration_completed)
SELECT DISTINCT p.user_id, true, true
FROM public.products p
LEFT JOIN public.user_initialization ui ON p.user_id = ui.user_id
WHERE ui.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
    products_initialized = true,
    migration_completed = true,
    updated_at = timezone('utc'::text, now());

-- =====================================================
-- DUPLICATE CLEANUP (RUN ONLY IF CONSTRAINT CREATION FAILED)
-- =====================================================

-- Uncomment and run this section ONLY if Step 1 failed due to existing duplicates

/*
-- Find and display duplicate products
SELECT user_id, name, COUNT(*) as duplicate_count
FROM public.products
GROUP BY user_id, name
HAVING COUNT(*) > 1
ORDER BY user_id, name;

-- Remove duplicates (keeps the oldest product for each user/name combination)
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, name ORDER BY created_at ASC) as rn
    FROM public.products
)
DELETE FROM public.products
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- After cleanup, retry adding the constraint:
ALTER TABLE public.products ADD CONSTRAINT products_user_name_unique UNIQUE (user_id, name);
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if constraint was added successfully
SELECT conname 
FROM pg_constraint 
WHERE conname = 'products_user_name_unique';

-- Check user initialization table
SELECT COUNT(*) as total_users_tracked 
FROM public.user_initialization;

-- Check for any remaining duplicates
SELECT user_id, name, COUNT(*) as count
FROM public.products
GROUP BY user_id, name
HAVING COUNT(*) > 1;

-- Display summary
SELECT 
    'Migration completed successfully' as status,
    (SELECT COUNT(*) FROM public.user_initialization) as tracked_users,
    (SELECT COUNT(DISTINCT user_id) FROM public.products) as users_with_products;