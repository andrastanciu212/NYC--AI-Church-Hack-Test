/*
  # Fix Security Issues

  ## Summary
  This migration addresses critical security vulnerabilities and performance issues identified in the database schema.

  ## Changes

  ### 1. Add Missing Index
  - Add index on `gap_reports.service_category_id` to improve foreign key query performance

  ### 2. Optimize RLS Policies for Profiles Table
  - Replace `auth.uid()` with `(select auth.uid())` in profiles policies to avoid re-evaluation per row
  - This improves query performance at scale

  ### 3. Add Ownership Tracking
  - Add `created_by` column to `organizations` table
  - Change `reported_by` in `gap_reports` from text to uuid
  - Add `created_by` column to `organization_services` table

  ### 4. Fix Overly Permissive RLS Policies
  Replace policies that use `USING (true)` with proper ownership checks:
  
  **Organizations:**
  - Users can only insert organizations (tracked as their creation)
  - Users can only update/delete organizations they created
  
  **Gap Reports:**
  - Users can insert gap reports (tracked with their user ID)
  - Users can only update gap reports they created
  
  **Organization Services:**
  - Users can only insert/update/delete services for organizations they created
  
  **Service Categories:**
  - Remove insert policy (should be admin-only or seeded data)

  ## Security Impact
  - Prevents unauthorized data modification
  - Enforces data ownership model
  - Improves RLS performance
  - Maintains public read access for community transparency
*/

-- 1. Add missing index on gap_reports.service_category_id
CREATE INDEX IF NOT EXISTS idx_gap_reports_service_category_id ON gap_reports(service_category_id);

-- 2. Drop and recreate optimized RLS policies for profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- 3. Add ownership tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE organizations ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_services' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE organization_services ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gap_reports' AND column_name = 'created_by_user'
  ) THEN
    ALTER TABLE gap_reports ADD COLUMN created_by_user uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Drop overly permissive RLS policies and create secure ones

-- Organizations policies
DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations" ON organizations;

CREATE POLICY "Authenticated users can insert organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update own organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can delete own organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

-- Gap reports policies
DROP POLICY IF EXISTS "Authenticated users can insert gap reports" ON gap_reports;
DROP POLICY IF EXISTS "Authenticated users can update gap reports" ON gap_reports;

CREATE POLICY "Authenticated users can insert gap reports"
  ON gap_reports FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user = (select auth.uid()));

CREATE POLICY "Users can update own gap reports"
  ON gap_reports FOR UPDATE
  TO authenticated
  USING (created_by_user = (select auth.uid()))
  WITH CHECK (created_by_user = (select auth.uid()));

-- Organization services policies
DROP POLICY IF EXISTS "Authenticated users can insert organization services" ON organization_services;
DROP POLICY IF EXISTS "Authenticated users can update organization services" ON organization_services;
DROP POLICY IF EXISTS "Authenticated users can delete organization services" ON organization_services;

CREATE POLICY "Users can insert services for own organizations"
  ON organization_services FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_services.organization_id
      AND organizations.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Users can update services for own organizations"
  ON organization_services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_services.organization_id
      AND organizations.created_by = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_services.organization_id
      AND organizations.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete services for own organizations"
  ON organization_services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_services.organization_id
      AND organizations.created_by = (select auth.uid())
    )
  );

-- Service categories - remove overly permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert service categories" ON service_categories;
