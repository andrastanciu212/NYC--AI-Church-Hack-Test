export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          type: string;
          borough: string;
          neighborhood: string | null;
          address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          website: string | null;
          description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          borough: string;
          neighborhood?: string | null;
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          website?: string | null;
          description?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          borough?: string;
          neighborhood?: string | null;
          address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          website?: string | null;
          description?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      organization_services: {
        Row: {
          id: string;
          organization_id: string;
          service_category_id: string;
          capacity: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          service_category_id: string;
          capacity?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          service_category_id?: string;
          capacity?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      gap_reports: {
        Row: {
          id: string;
          service_category_id: string;
          borough: string;
          neighborhood: string | null;
          severity: string;
          description: string;
          reported_by: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_category_id: string;
          borough: string;
          neighborhood?: string | null;
          severity: string;
          description: string;
          reported_by?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_category_id?: string;
          borough?: string;
          neighborhood?: string | null;
          severity?: string;
          description?: string;
          reported_by?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          organization: string | null;
          organization_type: string | null;
          organization_email: string | null;
          organization_phone: string | null;
          role: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          organization?: string | null;
          organization_type?: string | null;
          organization_email?: string | null;
          organization_phone?: string | null;
          role?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          organization?: string | null;
          organization_type?: string | null;
          organization_email?: string | null;
          organization_phone?: string | null;
          role?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
