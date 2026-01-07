/*
  # Add Foreign Key Indexes

  ## Summary
  Adds indexes on foreign key columns that were missing covering indexes, improving query performance
  for ownership-based queries.

  ## Changes

  ### 1. Add Index on organizations.created_by
  - Improves performance when querying organizations by creator
  - Supports ownership-based RLS policies

  ### 2. Add Index on organization_services.created_by
  - Improves performance when querying services by creator
  - Supports ownership-based RLS policies

  ### 3. Add Index on gap_reports.created_by_user
  - Improves performance when querying gap reports by creator
  - Supports ownership-based RLS policies

  ## Performance Impact
  - Faster queries filtering by creator/owner
  - Better performance for RLS policy evaluation
  - Improved JOIN performance with auth.users table
*/

-- Add index on organizations.created_by for ownership queries
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- Add index on organization_services.created_by for ownership queries
CREATE INDEX IF NOT EXISTS idx_org_services_created_by ON organization_services(created_by);

-- Add index on gap_reports.created_by_user for ownership queries
CREATE INDEX IF NOT EXISTS idx_gap_reports_created_by_user ON gap_reports(created_by_user);
