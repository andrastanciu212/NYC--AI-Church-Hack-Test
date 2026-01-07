import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import './GapReportForm.css';

type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];

interface Props {
  serviceCategories: ServiceCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  service_category_id: string;
  borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';
  neighborhood: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reported_by: string;
}

function GapReportForm({ serviceCategories, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    service_category_id: '',
    borough: 'Manhattan',
    neighborhood: '',
    severity: 'medium',
    description: '',
    reported_by: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!user) throw new Error('You must be logged in to report a gap');

      const insertData = {
        service_category_id: formData.service_category_id,
        borough: formData.borough,
        neighborhood: formData.neighborhood || null,
        severity: formData.severity,
        description: formData.description,
        reported_by: formData.reported_by || null,
        created_by_user: user.id,
        status: 'open' as const,
      };

      const { error: insertError } = await supabase
        .from('gap_reports')
        .insert([insertData] as any);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err) {
      console.error('Error saving gap report:', err);
      setError(err instanceof Error ? err.message : 'Failed to save gap report');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="gap-form">
      <div className="form-header">
        <h2>Report a Service Gap</h2>
        <button type="button" onClick={onClose} className="btn-close">
          ✕
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-section">
        <div className="form-grid">
          <div className="form-field full-width">
            <label>Service Category *</label>
            <select
              value={formData.service_category_id}
              onChange={(e) => setFormData({ ...formData, service_category_id: e.target.value })}
              required
            >
              <option value="">Select a service...</option>
              {serviceCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
              placeholder="Optional"
            />
          </div>

          <div className="form-field full-width">
            <label>Severity *</label>
            <div className="severity-options">
              <label className="severity-option">
                <input
                  type="radio"
                  name="severity"
                  value="critical"
                  checked={formData.severity === 'critical'}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                />
                <span className="severity-label critical">Critical</span>
              </label>
              <label className="severity-option">
                <input
                  type="radio"
                  name="severity"
                  value="high"
                  checked={formData.severity === 'high'}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                />
                <span className="severity-label high">High</span>
              </label>
              <label className="severity-option">
                <input
                  type="radio"
                  name="severity"
                  value="medium"
                  checked={formData.severity === 'medium'}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                />
                <span className="severity-label medium">Medium</span>
              </label>
              <label className="severity-option">
                <input
                  type="radio"
                  name="severity"
                  value="low"
                  checked={formData.severity === 'low'}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                />
                <span className="severity-label low">Low</span>
              </label>
            </div>
          </div>

          <div className="form-field full-width">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Describe the service gap and its impact on the community..."
              required
            />
          </div>

          <div className="form-field full-width">
            <label>Your Name</label>
            <input
              type="text"
              value={formData.reported_by}
              onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </form>
  );
}

export default GapReportForm;
