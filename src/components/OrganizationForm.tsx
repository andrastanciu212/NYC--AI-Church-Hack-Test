import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { OrganizationWithServices } from './OrganizationManager';
import './OrganizationForm.css';

type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];

interface Props {
  organization: OrganizationWithServices | null;
  serviceCategories: ServiceCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  type: 'church' | 'ministry' | 'nonprofit' | 'civic_group';
  borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';
  neighborhood: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  description: string;
  active: boolean;
}

interface ServiceSelection {
  category_id: string;
  capacity: 'low' | 'medium' | 'high' | '';
  notes: string;
}

function OrganizationForm({ organization, serviceCategories, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'church',
    borough: 'Manhattan',
    neighborhood: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    description: '',
    active: true,
  });

  const [selectedServices, setSelectedServices] = useState<ServiceSelection[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        type: organization.type,
        borough: organization.borough,
        neighborhood: organization.neighborhood || '',
        address: organization.address || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website: organization.website || '',
        description: organization.description || '',
        active: organization.active,
      });

      if (organization.services) {
        setSelectedServices(
          organization.services.map(s => ({
            category_id: s.service_category_id,
            capacity: (s.capacity as 'low' | 'medium' | 'high') || '',
            notes: s.notes || '',
          }))
        );
      }
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let orgId: string;

      if (organization) {
        const updateData = {
          name: formData.name,
          type: formData.type,
          borough: formData.borough,
          neighborhood: formData.neighborhood || null,
          address: formData.address || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          website: formData.website || null,
          description: formData.description || null,
          active: formData.active,
          updated_at: new Date().toISOString(),
        };

        const table: any = supabase.from('organizations');
        const updater: any = table.update(updateData as any);
        const query: any = updater.eq('id', organization.id);
        const { error: updateError } = await query;

        if (updateError) throw updateError;
        orgId = organization.id;

        const deleteTable: any = supabase.from('organization_services');
        const deleter: any = deleteTable.delete();
        const deleteQuery: any = deleter.eq('organization_id', orgId);
        await deleteQuery;
      } else {
        const insertData = {
          name: formData.name,
          type: formData.type,
          borough: formData.borough,
          neighborhood: formData.neighborhood || null,
          address: formData.address || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          website: formData.website || null,
          description: formData.description || null,
          active: formData.active,
        };

        const { data, error: insertError } = await supabase
          .from('organizations')
          .insert([insertData] as any)
          .select()
          .single();

        if (insertError) throw insertError;
        if (!data) throw new Error('Failed to create organization');
        orgId = (data as any).id;
      }

      if (selectedServices.length > 0) {
        const servicesToInsert = selectedServices.map(s => ({
          organization_id: orgId,
          service_category_id: s.category_id,
          capacity: s.capacity || null,
          notes: s.notes || null,
        }));

        const { error: servicesError } = await supabase
          .from('organization_services')
          .insert(servicesToInsert as any);

        if (servicesError) throw servicesError;
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  const handleServiceToggle = (categoryId: string) => {
    const exists = selectedServices.find(s => s.category_id === categoryId);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.category_id !== categoryId));
    } else {
      setSelectedServices([...selectedServices, { category_id: categoryId, capacity: '', notes: '' }]);
    }
  };

  const handleServiceUpdate = (categoryId: string, field: 'capacity' | 'notes', value: string) => {
    setSelectedServices(
      selectedServices.map(s =>
        s.category_id === categoryId ? { ...s, [field]: value } : s
      )
    );
  };

  return (
    <form onSubmit={handleSubmit} className="org-form">
      <div className="form-header">
        <h2>{organization ? 'Edit Organization' : 'Add New Organization'}</h2>
        <button type="button" onClick={onClose} className="btn-close">
          ✕
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-field">
            <label>Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
            >
              <option value="church">Church</option>
              <option value="ministry">Ministry</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="civic_group">Civic Group</option>
            </select>
          </div>

          <div className="form-field">
            <label>Borough *</label>
            <select
              value={formData.borough}
              onChange={(e) => setFormData({ ...formData, borough: e.target.value as any })}
              required
            >
              <option value="Manhattan">Manhattan</option>
              <option value="Brooklyn">Brooklyn</option>
              <option value="Queens">Queens</option>
              <option value="Bronx">Bronx</option>
              <option value="Staten Island">Staten Island</option>
            </select>
          </div>

          <div className="form-field">
            <label>Neighborhood</label>
            <input
              type="text"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            />
          </div>

          <div className="form-field full-width">
            <label>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-field full-width">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Contact Information</h3>
        <div className="form-grid">
          <div className="form-field">
            <label>Email</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>

          <div className="form-field full-width">
            <label>Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Services Provided</h3>
        <div className="services-grid">
          {serviceCategories.map((category) => {
            const isSelected = selectedServices.some(s => s.category_id === category.id);
            const service = selectedServices.find(s => s.category_id === category.id);

            return (
              <div key={category.id} className="service-item">
                <label className="service-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleServiceToggle(category.id)}
                  />
                  <span>{category.name}</span>
                </label>
                {isSelected && (
                  <div className="service-details">
                    <select
                      value={service?.capacity || ''}
                      onChange={(e) => handleServiceUpdate(category.id, 'capacity', e.target.value)}
                    >
                      <option value="">Capacity...</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Notes..."
                      value={service?.notes || ''}
                      onChange={(e) => handleServiceUpdate(category.id, 'notes', e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="form-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          />
          <span>Organization is currently active</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : organization ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

export default OrganizationForm;
