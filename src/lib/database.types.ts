export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          type: 'church' | 'ministry' | 'nonprofit' | 'civic_group'
          borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island'
          neighborhood: string | null
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          website: string | null
          description: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'church' | 'ministry' | 'nonprofit' | 'civic_group'
          borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island'
          neighborhood?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'church' | 'ministry' | 'nonprofit' | 'civic_group'
          borough?: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island'
          neighborhood?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      service_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      organization_services: {
        Row: {
          id: string
          organization_id: string
          service_category_id: string
          capacity: 'low' | 'medium' | 'high' | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          service_category_id: string
          capacity?: 'low' | 'medium' | 'high' | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          service_category_id?: string
          capacity?: 'low' | 'medium' | 'high' | null
          notes?: string | null
          created_at?: string
        }
      }
      gap_reports: {
        Row: {
          id: string
          service_category_id: string
          borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island'
          neighborhood: string | null
          severity: 'critical' | 'high' | 'medium' | 'low'
          description: string
          reported_by: string | null
          status: 'open' | 'in_progress' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_category_id: string
          borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island'
          neighborhood?: string | null
          severity: 'critical' | 'high' | 'medium' | 'low'
          description: string
          reported_by?: string | null
          status?: 'open' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_category_id?: string
          borough?: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island'
          neighborhood?: string | null
          severity?: 'critical' | 'high' | 'medium' | 'low'
          description?: string
          reported_by?: string | null
          status?: 'open' | 'in_progress' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
