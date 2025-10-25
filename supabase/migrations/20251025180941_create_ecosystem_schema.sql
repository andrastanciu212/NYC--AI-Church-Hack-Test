/*
  # NYC Ecosystem Gap Finder Database Schema

  ## Overview
  This migration creates the core database structure for tracking churches, ministries, 
  nonprofits, and civic groups across NYC's 5 boroughs, along with the services they 
  provide and gaps in coverage.

  ## New Tables

  ### 1. `organizations`
  Stores information about churches, ministries, nonprofits, and civic groups
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Organization name
  - `type` (text) - Type: church, ministry, nonprofit, civic_group
  - `borough` (text) - One of: Manhattan, Brooklyn, Queens, Bronx, Staten Island
  - `neighborhood` (text) - Specific neighborhood/area
  - `address` (text) - Full address
  - `contact_email` (text, optional) - Contact email
  - `contact_phone` (text, optional) - Contact phone
  - `website` (text, optional) - Website URL
  - `description` (text, optional) - Description of organization
  - `active` (boolean) - Whether organization is currently active
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `service_categories`
  Defines service categories that organizations can provide
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Category name (e.g., "Food Assistance", "Youth Programs")
  - `description` (text, optional) - Category description
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `organization_services`
  Links organizations to the services they provide
  - `id` (uuid, primary key) - Unique identifier
  - `organization_id` (uuid, foreign key) - References organizations
  - `service_category_id` (uuid, foreign key) - References service_categories
  - `capacity` (text, optional) - Service capacity level (low, medium, high)
  - `notes` (text, optional) - Additional notes about the service
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `gap_reports`
  Tracks identified gaps in services by borough/neighborhood
  - `id` (uuid, primary key) - Unique identifier
  - `service_category_id` (uuid, foreign key) - Service category with gap
  - `borough` (text) - Borough with the gap
  - `neighborhood` (text, optional) - Specific neighborhood
  - `severity` (text) - Gap severity: critical, high, medium, low
  - `description` (text) - Description of the gap
  - `reported_by` (text, optional) - Who reported this gap
  - `status` (text) - Status: open, in_progress, resolved
  - `created_at` (timestamptz) - Report creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access to allow community viewing
  - Authenticated users can insert and update records
  - Future: Can be extended with role-based permissions for data stewards

  ## Indexes
  - Organizations indexed by borough and type for fast filtering
  - Service lookups optimized with composite indexes
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('church', 'ministry', 'nonprofit', 'civic_group')),
  borough text NOT NULL CHECK (borough IN ('Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island')),
  neighborhood text,
  address text,
  contact_email text,
  contact_phone text,
  website text,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create organization_services junction table
CREATE TABLE IF NOT EXISTS organization_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_category_id uuid NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  capacity text CHECK (capacity IN ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, service_category_id)
);

-- Create gap_reports table
CREATE TABLE IF NOT EXISTS gap_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category_id uuid NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  borough text NOT NULL CHECK (borough IN ('Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island')),
  neighborhood text,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description text NOT NULL,
  reported_by text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_borough ON organizations(borough);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(active);
CREATE INDEX IF NOT EXISTS idx_org_services_org_id ON organization_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_services_category_id ON organization_services(service_category_id);
CREATE INDEX IF NOT EXISTS idx_gap_reports_borough ON gap_reports(borough);
CREATE INDEX IF NOT EXISTS idx_gap_reports_status ON gap_reports(status);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Organizations are viewable by everyone"
  ON organizations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for service_categories
CREATE POLICY "Service categories are viewable by everyone"
  ON service_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert service categories"
  ON service_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for organization_services
CREATE POLICY "Organization services are viewable by everyone"
  ON organization_services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert organization services"
  ON organization_services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update organization services"
  ON organization_services FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete organization services"
  ON organization_services FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for gap_reports
CREATE POLICY "Gap reports are viewable by everyone"
  ON gap_reports FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert gap reports"
  ON gap_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update gap reports"
  ON gap_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial service categories
INSERT INTO service_categories (name, description) VALUES
  ('Food Assistance', 'Food banks, soup kitchens, meal programs'),
  ('Housing Support', 'Shelter, housing assistance, homelessness services'),
  ('Youth Programs', 'After-school programs, mentoring, youth development'),
  ('Senior Services', 'Elder care, senior centers, aging support'),
  ('Mental Health', 'Counseling, support groups, mental health services'),
  ('Addiction Recovery', 'Substance abuse programs, recovery support'),
  ('Job Training', 'Employment services, vocational training, career development'),
  ('Education & Tutoring', 'Academic support, literacy programs, educational resources'),
  ('Healthcare', 'Medical services, health clinics, wellness programs'),
  ('Legal Aid', 'Legal assistance, immigration services, advocacy'),
  ('Community Development', 'Neighborhood improvement, civic engagement'),
  ('Arts & Culture', 'Cultural programs, arts education, community events'),
  ('Family Support', 'Parenting programs, family counseling, childcare'),
  ('Veterans Services', 'Support for military veterans and families'),
  ('Disaster Relief', 'Emergency assistance, crisis response')
ON CONFLICT (name) DO NOTHING;
