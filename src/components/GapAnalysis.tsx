import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import GapReportForm from './GapReportForm';
import './GapAnalysis.css';

type GapReport = Database['public']['Tables']['gap_reports']['Row'];
type ServiceCategory = Database['public']['Tables']['service_categories']['Row'];

interface GapWithCategory extends GapReport {
  service_name: string;
}

interface ServiceCoverage {
  category_id: string;
  category_name: string;
  coverage: {
    borough: string;
    count: number;
  }[];
}

function GapAnalysis() {
  const [gaps, setGaps] = useState<GapWithCategory[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [coverage, setCoverage] = useState<ServiceCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterBorough, setFilterBorough] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gapsResult, categoriesResult, orgServicesResult, orgsResult] = await Promise.all([
        supabase
          .from('gap_reports')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('service_categories')
          .select('*')
          .order('name'),
        supabase.from('organization_services').select('organization_id, service_category_id'),
        supabase.from('organizations').select('id, borough, active').eq('active', true),
      ]);

      if (categoriesResult.data) {
        setServiceCategories(categoriesResult.data);

        const coverageData: ServiceCoverage[] = (categoriesResult.data as any[]).map((category: any) => {
          const boroughCounts = boroughs.map(borough => {
            const orgsInBorough = (orgsResult.data as any[])?.filter((org: any) => org.borough === borough) || [];
            const serviceCount = (orgServicesResult.data as any[])?.filter(
              (service: any) =>
                service.service_category_id === category.id &&
                orgsInBorough.some((org: any) => org.id === service.organization_id)
            ).length || 0;

            return {
              borough,
              count: serviceCount,
            };
          });

          return {
            category_id: category.id,
            category_name: category.name,
            coverage: boroughCounts,
          };
        });

        setCoverage(coverageData);
      }

      if (gapsResult.data && categoriesResult.data) {
        const gapsWithCategories = (gapsResult.data as any[]).map((gap: any) => {
          const category = (categoriesResult.data as any[]).find((c: any) => c.id === gap.service_category_id);
          return {
            id: gap.id,
            service_category_id: gap.service_category_id,
            borough: gap.borough,
            neighborhood: gap.neighborhood,
            severity: gap.severity,
            description: gap.description,
            reported_by: gap.reported_by,
            status: gap.status,
            created_at: gap.created_at,
            updated_at: gap.updated_at,
            service_name: category?.name || 'Unknown',
          };
        });
        setGaps(gapsWithCategories);
      }
    } catch (error) {
      console.error('Error loading gap analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadData();
  };

  const handleStatusUpdate = async (gapId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
      const table: any = supabase.from('gap_reports');
      const updater: any = table.update(updateData);
      const query: any = updater.eq('id', gapId);
      const { error } = await query;

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating gap status:', error);
    }
  };

  const filteredGaps = gaps.filter(gap => {
    if (filterBorough !== 'all' && gap.borough !== filterBorough) return false;
    if (filterStatus !== 'all' && gap.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && gap.severity !== filterSeverity) return false;
    return true;
  });

  if (loading) {
    return <div className="loading">Loading gap analysis...</div>;
  }

  return (
    <div className="gap-analysis">
      <div className="gap-header">
        <h2>Service Gap Analysis</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Report a Gap
        </button>
      </div>

      <section className="coverage-section">
        <h3>Service Coverage Heatmap</h3>
        <div className="coverage-table">
          <div className="coverage-header">
            <div className="coverage-cell header-cell">Service</div>
            {boroughs.map(borough => (
              <div key={borough} className="coverage-cell header-cell">
                {borough}
              </div>
            ))}
          </div>
          {coverage.map(service => (
            <div key={service.category_id} className="coverage-row">
              <div className="coverage-cell service-name">{service.category_name}</div>
              {service.coverage.map(({ borough, count }) => (
                <div
                  key={borough}
                  className={`coverage-cell coverage-value ${
                    count === 0 ? 'no-coverage' : count < 3 ? 'low-coverage' : count < 6 ? 'medium-coverage' : 'high-coverage'
                  }`}
                  title={`${count} organizations providing ${service.category_name} in ${borough}`}
                >
                  {count}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="gaps-section">
        <div className="gaps-header">
          <h3>Reported Gaps</h3>
          <div className="gap-filters">
            <select value={filterBorough} onChange={(e) => setFilterBorough(e.target.value)}>
              <option value="all">All Boroughs</option>
              {boroughs.map(borough => (
                <option key={borough} value={borough}>{borough}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {filteredGaps.length === 0 ? (
          <div className="empty-state">
            <p>No gap reports found.</p>
            <p className="empty-hint">Report a gap to help identify service needs.</p>
          </div>
        ) : (
          <div className="gaps-list">
            {filteredGaps.map(gap => (
              <div key={gap.id} className={`gap-card severity-${gap.severity}`}>
                <div className="gap-card-header">
                  <div>
                    <h4>{gap.service_name}</h4>
                    <div className="gap-meta">
                      <span className={`severity-badge ${gap.severity}`}>
                        {gap.severity.toUpperCase()}
                      </span>
                      <span className="borough-badge">{gap.borough}</span>
                      {gap.neighborhood && <span className="neighborhood-text">{gap.neighborhood}</span>}
                    </div>
                  </div>
                  <select
                    value={gap.status}
                    onChange={(e) => handleStatusUpdate(gap.id, e.target.value as any)}
                    className={`status-select status-${gap.status}`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <p className="gap-description">{gap.description}</p>
                {gap.reported_by && (
                  <div className="gap-footer">
                    Reported by: {gap.reported_by}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <GapReportForm
              serviceCategories={serviceCategories}
              onClose={() => setShowForm(false)}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default GapAnalysis;
