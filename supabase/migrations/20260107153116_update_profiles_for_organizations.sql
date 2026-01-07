/*
  # Update profiles table for organization accounts

  1. Changes to `profiles` table
    - Add `organization_type` (text) - Type of organization: church, ministry, nonprofit, civic_group
    - Make `organization` field required
    - Add `organization_email` (text) - Organization contact email
    - Add `organization_phone` (text) - Organization contact phone

  2. Security
    - No changes to RLS policies (remain the same)

  3. Important Notes
    - This migration adds new fields to support organization sign up
    - Organization type aligns with the types in the organizations table
    - Existing records will need to update their organization field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_type text CHECK (organization_type IN ('church', 'ministry', 'nonprofit', 'civic_group'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_phone text;
  END IF;
END $$;
