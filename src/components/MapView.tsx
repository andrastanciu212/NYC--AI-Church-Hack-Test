import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import './MapView.css';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface BoroughData {
  borough: string;
  count: number;
  types: Record<string, number>;
  coords: { x: number; y: number };
}

function MapView() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [boroughData, setBoroughData] = useState<BoroughData[]>([]);
  const [selectedBorough, setSelectedBorough] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const boroughCoordinates: Record<string, { x: number; y: number }> = {
    'Manhattan': { x: 50, y: 45 },
    'Brooklyn': { x: 65, y: 60 },
    'Queens': { x: 75, y: 40 },
    'Bronx': { x: 55, y: 20 },
    'Staten Island': { x: 25, y: 75 },
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      if (data) {
        setOrganizations(data as any);

        const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
        const boroughStats = boroughs.map(borough => {
          const orgsInBorough = (data as any[]).filter((org: any) => org.borough === borough);
          const types: Record<string, number> = {};

          orgsInBorough.forEach((org: any) => {
            types[org.type] = (types[org.type] || 0) + 1;
          });

          return {
            borough,
            count: orgsInBorough.length,
            types,
            coords: boroughCoordinates[borough],
          };
        });

        setBoroughData(boroughStats);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = selectedBorough
    ? organizations.filter(org => {
        if (org.borough !== selectedBorough) return false;
        if (filterType !== 'all' && org.type !== filterType) return false;
        return true;
      })
    : [];

  const getMarkerSize = (count: number) => {
    if (count === 0) return 20;
    if (count < 3) return 30;
    if (count < 5) return 40;
    return 50;
  };

  if (loading) {
    return <div className="loading">Loading map...</div>;
  }

  return (
    <div className="map-view">
      <div className="map-header">
        <h2>NYC Organization Map</h2>
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-marker high"></div>
            <span>5+ Organizations</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker medium"></div>
            <span>3-4 Organizations</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker low"></div>
            <span>1-2 Organizations</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker none"></div>
            <span>No Coverage</span>
          </div>
        </div>
      </div>

      <div className="map-container">
        <div className="map-canvas">
          <svg viewBox="0 0 100 100" className="borough-map">
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
              </filter>
            </defs>

            {boroughData.map((borough) => {
              const size = getMarkerSize(borough.count);
              const isSelected = selectedBorough === borough.borough;

              return (
                <g key={borough.borough}>
                  <circle
                    cx={borough.coords.x}
                    cy={borough.coords.y}
                    r={size / 2}
                    className={`borough-marker ${
                      borough.count === 0 ? 'none' :
                      borough.count < 3 ? 'low' :
                      borough.count < 5 ? 'medium' : 'high'
                    } ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedBorough(isSelected ? null : borough.borough)}
                    filter="url(#shadow)"
                  />
                  <text
                    x={borough.coords.x}
                    y={borough.coords.y}
                    className="borough-count"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {borough.count}
                  </text>
                  <text
                    x={borough.coords.x}
                    y={borough.coords.y + size / 2 + 8}
                    className="borough-label"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {borough.borough}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {selectedBorough && (
          <div className="borough-detail">
            <div className="borough-detail-header">
              <h3>{selectedBorough}</h3>
              <button
                className="close-detail"
                onClick={() => setSelectedBorough(null)}
              >
                ✕
              </button>
            </div>

            <div className="borough-stats">
              <div className="stat-item">
                <span className="stat-label">Total Organizations:</span>
                <span className="stat-value">{filteredOrgs.length}</span>
              </div>
              {Object.entries(boroughData.find(b => b.borough === selectedBorough)?.types || {}).map(([type, count]) => (
                <div key={type} className="stat-item">
                  <span className="stat-label">
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <span className="stat-value">{count}</span>
                </div>
              ))}
            </div>

            <div className="filter-section">
              <label>Filter by type:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="church">Church</option>
                <option value="ministry">Ministry</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="civic_group">Civic Group</option>
              </select>
            </div>

            <div className="org-list-scroll">
              {filteredOrgs.map(org => (
                <div key={org.id} className="org-item">
                  <h4>{org.name}</h4>
                  <div className="org-type-badge">
                    {org.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  {org.neighborhood && (
                    <div className="org-neighborhood">{org.neighborhood}</div>
                  )}
                  {org.description && (
                    <p className="org-description">{org.description}</p>
                  )}
                  {org.contact_phone && (
                    <div className="org-contact">
                      <a href={`tel:${org.contact_phone}`}>{org.contact_phone}</a>
                    </div>
                  )}
                  {org.website && (
                    <div className="org-contact">
                      <a href={org.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="map-summary">
        <h3>Borough Summary</h3>
        <div className="summary-grid">
          {boroughData.map(borough => (
            <div
              key={borough.borough}
              className={`summary-card ${selectedBorough === borough.borough ? 'active' : ''}`}
              onClick={() => setSelectedBorough(selectedBorough === borough.borough ? null : borough.borough)}
            >
              <div className="summary-borough">{borough.borough}</div>
              <div className="summary-count">{borough.count}</div>
              <div className="summary-label">organizations</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapView;
