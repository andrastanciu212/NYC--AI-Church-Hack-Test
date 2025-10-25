import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import OrganizationForm from './OrganizationForm';
import OrganizationList from './OrganizationList';
import './OrganizationManager.css';

type Organization = Database['public']['Tables']['organizations']['Row'];
type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];

export interface OrganizationWithServices extends Organization {
  services?: Array<{
    id: string;
    service_category_id: string;
    capacity: string | null;
    notes: string | null;
    service_name: string;
  }>;
}

function OrganizationManager() {
  const [organizations, setOrganizations] = useState<OrganizationWithServices[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationWithServices | null>(null);
  const [filterBorough, setFilterBorough] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgsResult, categoriesResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('*')
          .order('name'),
        supabase
          .from('service_categories')
          .select('*')
          .order('name'),
      ]);

      if (orgsResult.data) {
        const orgsWithServices = await Promise.all(
          (orgsResult.data as any[]).map(async (org: any) => {
            const servicesResult = await supabase
              .from('organization_services')
              .select('id, service_category_id, capacity, notes')
              .eq('organization_id', org.id);

            const services = servicesResult.data?.map((service: any) => {
              const category = (categoriesResult.data as any[])?.find(
                (c: any) => c.id === service.service_category_id
              );
              return {
                id: service.id,
                service_category_id: service.service_category_id,
                capacity: service.capacity,
                notes: service.notes,
                service_name: category?.name || 'Unknown',
              };
            });

            return { ...org, services } as OrganizationWithServices;
          })
        );

        setOrganizations(orgsWithServices);
      }

      if (categoriesResult.data) {
        setServiceCategories(categoriesResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingOrg(null);
    setShowForm(true);
  };

  const handleEdit = (org: OrganizationWithServices) => {
    setEditingOrg(org);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingOrg(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadData();
  };

  const filteredOrgs = organizations.filter(org => {
    if (filterBorough !== 'all' && org.borough !== filterBorough) return false;
    if (filterType !== 'all' && org.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return <div className="loading">Loading organizations...</div>;
  }

  return (
    <div className="org-manager">
      <div className="org-header">
        <h2>Organizations Directory</h2>
        <button className="btn-primary" onClick={handleAddNew}>
          Add Organization
        </button>
      </div>

      <div className="org-filters">
        <div className="filter-group">
          <label>Borough</label>
          <select value={filterBorough} onChange={(e) => setFilterBorough(e.target.value)}>
            <option value="all">All Boroughs</option>
            <option value="Manhattan">Manhattan</option>
            <option value="Brooklyn">Brooklyn</option>
            <option value="Queens">Queens</option>
            <option value="Bronx">Bronx</option>
            <option value="Staten Island">Staten Island</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Type</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="church">Church</option>
            <option value="ministry">Ministry</option>
            <option value="nonprofit">Nonprofit</option>
            <option value="civic_group">Civic Group</option>
          </select>
        </div>
        <div className="filter-stats">
          Showing {filteredOrgs.length} of {organizations.length} organizations
        </div>
      </div>

      <OrganizationList
        organizations={filteredOrgs}
        onEdit={handleEdit}
        onRefresh={loadData}
      />

      {showForm && (
        <div className="modal-overlay" onClick={handleFormClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <OrganizationForm
              organization={editingOrg}
              serviceCategories={serviceCategories}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationManager;
