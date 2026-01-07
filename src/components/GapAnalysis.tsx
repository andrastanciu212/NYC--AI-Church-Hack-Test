import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import GapReportForm from './GapReportForm';
import 'leaflet/dist/leaflet.css';
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
    neighborhood: string;
    count: number;
  }[];
}

interface NeighborhoodCoords {
  lat: number;
  lng: number;
}

const neighborhoodsByBorough: Record<string, string[]> = {
  'Manhattan': ['Upper East Side', 'Upper West Side', 'Harlem', 'East Harlem', 'Washington Heights', 'Inwood', 'Midtown', 'Chelsea', 'Greenwich Village', 'Lower East Side', 'Chinatown', 'Financial District'],
  'Brooklyn': ['Williamsburg', 'Bushwick', 'Bedford-Stuyvesant', 'Crown Heights', 'Park Slope', 'Sunset Park', 'Bay Ridge', 'Coney Island', 'Flatbush', 'East New York', 'Brownsville'],
  'Queens': ['Astoria', 'Long Island City', 'Flushing', 'Jamaica', 'Forest Hills', 'Elmhurst', 'Jackson Heights', 'Corona', 'Ridgewood', 'Bayside', 'Far Rockaway'],
  'Bronx': ['South Bronx', 'Mott Haven', 'Hunts Point', 'Fordham', 'Belmont', 'Morris Heights', 'Riverdale', 'Pelham Bay', 'Throggs Neck', 'Co-op City'],
  'Staten Island': ['St. George', 'Stapleton', 'Port Richmond', 'New Brighton', 'Tottenville', 'Great Kills', 'Eltingville', 'Annadale', 'West Brighton']
};

const neighborhoodCoordinates: Record<string, NeighborhoodCoords> = {
  'Upper East Side': { lat: 40.7736, lng: -73.9566 },
  'Upper West Side': { lat: 40.7870, lng: -73.9754 },
  'Harlem': { lat: 40.8116, lng: -73.9465 },
  'East Harlem': { lat: 40.7957, lng: -73.9389 },
  'Washington Heights': { lat: 40.8501, lng: -73.9366 },
  'Inwood': { lat: 40.8677, lng: -73.9212 },
  'Midtown': { lat: 40.7549, lng: -73.9840 },
  'Chelsea': { lat: 40.7465, lng: -74.0014 },
  'Greenwich Village': { lat: 40.7336, lng: -74.0027 },
  'Lower East Side': { lat: 40.7153, lng: -73.9874 },
  'Chinatown': { lat: 40.7158, lng: -73.9970 },
  'Financial District': { lat: 40.7074, lng: -74.0113 },
  'Williamsburg': { lat: 40.7081, lng: -73.9571 },
  'Bushwick': { lat: 40.6942, lng: -73.9194 },
  'Bedford-Stuyvesant': { lat: 40.6872, lng: -73.9418 },
  'Crown Heights': { lat: 40.6689, lng: -73.9423 },
  'Park Slope': { lat: 40.6710, lng: -73.9778 },
  'Sunset Park': { lat: 40.6447, lng: -74.0128 },
  'Bay Ridge': { lat: 40.6259, lng: -74.0300 },
  'Coney Island': { lat: 40.5755, lng: -73.9707 },
  'Flatbush': { lat: 40.6527, lng: -73.9593 },
  'East New York': { lat: 40.6591, lng: -73.8823 },
  'Brownsville': { lat: 40.6620, lng: -73.9109 },
  'Astoria': { lat: 40.7722, lng: -73.9300 },
  'Long Island City': { lat: 40.7447, lng: -73.9485 },
  'Flushing': { lat: 40.7673, lng: -73.8330 },
  'Jamaica': { lat: 40.6916, lng: -73.8067 },
  'Forest Hills': { lat: 40.7185, lng: -73.8448 },
  'Elmhurst': { lat: 40.7361, lng: -73.8822 },
  'Jackson Heights': { lat: 40.7557, lng: -73.8831 },
  'Corona': { lat: 40.7472, lng: -73.8619 },
  'Ridgewood': { lat: 40.7006, lng: -73.9056 },
  'Bayside': { lat: 40.7685, lng: -73.7693 },
  'Far Rockaway': { lat: 40.6054, lng: -73.7551 },
  'South Bronx': { lat: 40.8165, lng: -73.9169 },
  'Mott Haven': { lat: 40.8088, lng: -73.9222 },
  'Hunts Point': { lat: 40.8134, lng: -73.8833 },
  'Fordham': { lat: 40.8622, lng: -73.8985 },
  'Belmont': { lat: 40.8556, lng: -73.8885 },
  'Morris Heights': { lat: 40.8531, lng: -73.9189 },
  'Riverdale': { lat: 40.8978, lng: -73.9095 },
  'Pelham Bay': { lat: 40.8527, lng: -73.8270 },
  'Throggs Neck': { lat: 40.8156, lng: -73.8236 },
  'Co-op City': { lat: 40.8742, lng: -73.8300 },
  'St. George': { lat: 40.6437, lng: -74.0776 },
  'Stapleton': { lat: 40.6267, lng: -74.0779 },
  'Port Richmond': { lat: 40.6339, lng: -74.1368 },
  'New Brighton': { lat: 40.6417, lng: -74.0939 },
  'Tottenville': { lat: 40.5054, lng: -74.2416 },
  'Great Kills': { lat: 40.5542, lng: -74.1502 },
  'Eltingville': { lat: 40.5449, lng: -74.1651 },
  'Annadale': { lat: 40.5395, lng: -74.1788 },
  'West Brighton': { lat: 40.6282, lng: -74.1098 }
};

function GapAnalysis() {
  const [gaps, setGaps] = useState<GapWithCategory[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [coverage, setCoverage] = useState<ServiceCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterBorough, setFilterBorough] = useState<string>('all');
  const [filterNeighborhood, setFilterNeighborhood] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'borough' | 'neighborhood'>('borough');
  const [showMap, setShowMap] = useState(true);

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
          const locationCounts = boroughs.flatMap(borough => {
            const neighborhoods = neighborhoodsByBorough[borough] || [];
            return neighborhoods.map(neighborhood => {
              const orgsInLocation = (orgsResult.data as any[])?.filter(
                (org: any) => org.borough === borough && org.neighborhood === neighborhood
              ) || [];
              const serviceCount = (orgServicesResult.data as any[])?.filter(
                (service: any) =>
                  service.service_category_id === category.id &&
                  orgsInLocation.some((org: any) => org.id === service.organization_id)
              ).length || 0;

              return {
                borough,
                neighborhood,
                count: serviceCount,
              };
            });
          });

          return {
            category_id: category.id,
            category_name: category.name,
            coverage: locationCounts,
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
            created_by_user: gap.created_by_user,
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
    if (filterNeighborhood !== 'all' && gap.neighborhood !== filterNeighborhood) return false;
    if (filterStatus !== 'all' && gap.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && gap.severity !== filterSeverity) return false;
    return true;
  });

  const availableNeighborhoods = filterBorough === 'all'
    ? []
    : neighborhoodsByBorough[filterBorough] || [];

  const filteredCoverage = viewMode === 'borough'
    ? coverage.map(service => ({
        ...service,
        coverage: boroughs.map(borough => {
          const boroughTotal = service.coverage
            .filter(c => c.borough === borough)
            .reduce((sum, c) => sum + c.count, 0);
          return {
            borough,
            neighborhood: '',
            count: boroughTotal,
          };
        }),
      }))
    : filterBorough === 'all'
    ? coverage
    : coverage.map(service => ({
        ...service,
        coverage: service.coverage.filter(c => c.borough === filterBorough),
      }));

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

      <section className="gaps-section">
        <div className="gaps-header">
          <div className="gaps-header-left">
            <h3>Reported Gaps</h3>
            <button
              className={`toggle-view-button ${showMap ? 'active' : ''}`}
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? 'Show List' : 'Show Map'}
            </button>
          </div>
          <div className="gap-filters">
            <select value={filterBorough} onChange={(e) => {
              setFilterBorough(e.target.value);
              setFilterNeighborhood('all');
            }}>
              <option value="all">All Boroughs</option>
              {boroughs.map(borough => (
                <option key={borough} value={borough}>{borough}</option>
              ))}
            </select>
            {filterBorough !== 'all' && availableNeighborhoods.length > 0 && (
              <select value={filterNeighborhood} onChange={(e) => setFilterNeighborhood(e.target.value)}>
                <option value="all">All Neighborhoods</option>
                {availableNeighborhoods.map(neighborhood => (
                  <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                ))}
              </select>
            )}
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
        ) : showMap ? (
          <div className="gaps-map-container">
            <MapContainer
              center={[40.7128, -73.9]}
              zoom={11}
              style={{ height: '600px', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredGaps.map(gap => {
                const coords = gap.neighborhood ? neighborhoodCoordinates[gap.neighborhood] : null;
                if (!coords) return null;

                const severityColors = {
                  critical: '#dc2626',
                  high: '#ea580c',
                  medium: '#ca8a04',
                  low: '#65a30d'
                };

                return (
                  <CircleMarker
                    key={gap.id}
                    center={[coords.lat, coords.lng]}
                    radius={gap.severity === 'critical' ? 12 : gap.severity === 'high' ? 10 : gap.severity === 'medium' ? 8 : 6}
                    fillColor={severityColors[gap.severity as keyof typeof severityColors]}
                    color="#fff"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.7}
                  >
                    <Popup>
                      <div className="map-popup">
                        <h4>{gap.service_name}</h4>
                        <div className="popup-meta">
                          <span className={`severity-badge ${gap.severity}`}>
                            {gap.severity.toUpperCase()}
                          </span>
                          <span className="status-badge status-${gap.status}">
                            {gap.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="popup-location">
                          <strong>{gap.neighborhood}</strong>, {gap.borough}
                        </div>
                        <p className="popup-description">{gap.description}</p>
                        {gap.reported_by && (
                          <div className="popup-reporter">Reported by: {gap.reported_by}</div>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
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

      <section className="coverage-section">
        <div className="coverage-header-section">
          <h3>Service Coverage Heatmap</h3>
          <div className="view-mode-toggle">
            <button
              className={viewMode === 'borough' ? 'active' : ''}
              onClick={() => {
                setViewMode('borough');
                setFilterBorough('all');
                setFilterNeighborhood('all');
              }}
            >
              By Borough
            </button>
            <button
              className={viewMode === 'neighborhood' ? 'active' : ''}
              onClick={() => setViewMode('neighborhood')}
            >
              By Neighborhood
            </button>
          </div>
        </div>

        {viewMode === 'neighborhood' && (
          <div className="neighborhood-selector">
            <select value={filterBorough} onChange={(e) => {
              setFilterBorough(e.target.value);
              setFilterNeighborhood('all');
            }}>
              <option value="all">Select a Borough</option>
              {boroughs.map(borough => (
                <option key={borough} value={borough}>{borough}</option>
              ))}
            </select>
          </div>
        )}

        <div className="coverage-table-wrapper">
          <div className="coverage-table">
            <div className="coverage-header">
              <div className="coverage-cell header-cell">Service</div>
              {viewMode === 'borough' ? (
                boroughs.map(borough => (
                  <div key={borough} className="coverage-cell header-cell">
                    {borough}
                  </div>
                ))
              ) : filterBorough === 'all' ? (
                <div className="coverage-cell header-cell">Select a borough to view neighborhoods</div>
              ) : (
                availableNeighborhoods.map(neighborhood => (
                  <div key={neighborhood} className="coverage-cell header-cell neighborhood-header">
                    {neighborhood}
                  </div>
                ))
              )}
            </div>
            {filteredCoverage.map(service => (
              <div key={service.category_id} className="coverage-row">
                <div className="coverage-cell service-name">{service.category_name}</div>
                {viewMode === 'borough' || filterBorough !== 'all' ? (
                  service.coverage.map(({ borough, neighborhood, count }) => (
                    <div
                      key={viewMode === 'borough' ? borough : `${borough}-${neighborhood}`}
                      className={`coverage-cell coverage-value ${
                        count === 0 ? 'no-coverage' : count < 2 ? 'low-coverage' : count < 4 ? 'medium-coverage' : 'high-coverage'
                      }`}
                      title={`${count} organizations providing ${service.category_name} in ${neighborhood || borough}`}
                    >
                      {count}
                    </div>
                  ))
                ) : (
                  <div className="coverage-cell">-</div>
                )}
              </div>
            ))}
          </div>
        </div>
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
