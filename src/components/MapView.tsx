import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface OrganizationWithServices extends Organization {
  services?: Array<{
    id: string;
    service_category_id: string;
    capacity: string | null;
    notes: string | null;
    service_name: string;
  }>;
}

const boroughCoordinates: Record<string, { lat: number; lng: number }> = {
  'Manhattan': { lat: 40.7831, lng: -73.9712 },
  'Brooklyn': { lat: 40.6782, lng: -73.9442 },
  'Queens': { lat: 40.7282, lng: -73.7949 },
  'Bronx': { lat: 40.8448, lng: -73.8648 },
  'Staten Island': { lat: 40.5795, lng: -74.1502 },
};

function MapView() {
  const [organizations, setOrganizations] = useState<OrganizationWithServices[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithServices | null>(null);
  const [filterBorough, setFilterBorough] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && organizations.length > 0 && mapRef.current && !leafletMapRef.current) {
      initializeMap();
    }
  }, [loading, organizations]);

  useEffect(() => {
    if (leafletMapRef.current) {
      updateMarkers();
    }
  }, [filterBorough, filterType, organizations]);

  const loadData = async () => {
    try {
      const [orgsResult, categoriesResult] = await Promise.all([
        supabase
          .from('organizations')
          .select('*')
          .eq('active', true)
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
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([40.7128, -73.9060], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!leafletMapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const filteredOrgs = organizations.filter(org => {
      if (filterBorough !== 'all' && org.borough !== filterBorough) return false;
      if (filterType !== 'all' && org.type !== filterType) return false;
      return true;
    });

    const boroughCounts: Record<string, number> = {};
    filteredOrgs.forEach(org => {
      boroughCounts[org.borough] = (boroughCounts[org.borough] || 0) + 1;
    });

    Object.entries(boroughCoordinates).forEach(([borough, coords]) => {
      const count = boroughCounts[borough] || 0;

      const color = count === 0 ? '#ef4444' :
                    count < 3 ? '#f59e0b' :
                    count < 5 ? '#3b82f6' : '#10b981';

      const size = count === 0 ? 30 : count < 3 ? 40 : count < 5 ? 50 : 60;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(leafletMapRef.current!);

      marker.bindPopup(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #2c3e50;">${borough}</h3>
          <p style="margin: 0; font-size: 14px; color: #64748b;">${count} organization${count !== 1 ? 's' : ''}</p>
        </div>
      `);

      marker.on('click', () => {
        setFilterBorough(filterBorough === borough ? 'all' : borough);
      });

      markersRef.current.push(marker);
    });

    filteredOrgs.forEach(org => {
      if (!org.address) return;

      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(org.address + ', New York, NY')}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            const { lat, lon } = data[0];

            const icon = L.divIcon({
              className: 'org-marker',
              html: `
                <div style="
                  width: 16px;
                  height: 16px;
                  background-color: #2c3e50;
                  border: 2px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });

            const marker = L.marker([parseFloat(lat), parseFloat(lon)], { icon })
              .addTo(leafletMapRef.current!);

            marker.bindPopup(`
              <div style="padding: 8px; max-width: 200px;">
                <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #2c3e50;">${org.name}</h4>
                <p style="margin: 0; font-size: 12px; color: #64748b;">${org.type.replace('_', ' ')}</p>
              </div>
            `);

            marker.on('click', () => {
              setSelectedOrg(org);
            });

            markersRef.current.push(marker);
          }
        })
        .catch(err => console.error('Geocoding error:', err));
    });
  };

  const boroughs = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const boroughCounts = boroughs.map(borough => {
    const count = organizations.filter(org => org.borough === borough).length;
    return { borough, count };
  });

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

      <div className="map-filters">
        <div className="filter-group">
          <label>Borough</label>
          <select value={filterBorough} onChange={(e) => setFilterBorough(e.target.value)}>
            <option value="all">All Boroughs</option>
            {boroughs.map(borough => (
              <option key={borough} value={borough}>{borough}</option>
            ))}
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
      </div>

      <div className="map-container-with-sidebar">
        <div ref={mapRef} className="leaflet-map"></div>

        {selectedOrg && (
          <div className="org-detail-sidebar">
            <div className="sidebar-header">
              <h3>{selectedOrg.name}</h3>
              <button
                className="close-sidebar"
                onClick={() => setSelectedOrg(null)}
              >
                ✕
              </button>
            </div>

            <div className="sidebar-content">
              <div className="org-meta">
                <span className="org-type-badge">
                  {selectedOrg.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="org-borough-badge">{selectedOrg.borough}</span>
              </div>

              {selectedOrg.neighborhood && (
                <div className="detail-section">
                  <strong>Neighborhood:</strong> {selectedOrg.neighborhood}
                </div>
              )}

              {selectedOrg.address && (
                <div className="detail-section">
                  <strong>Address:</strong> {selectedOrg.address}
                </div>
              )}

              {selectedOrg.description && (
                <div className="detail-section">
                  <strong>About:</strong>
                  <p>{selectedOrg.description}</p>
                </div>
              )}

              {selectedOrg.services && selectedOrg.services.length > 0 && (
                <div className="detail-section">
                  <strong>Services:</strong>
                  <div className="service-tags">
                    {selectedOrg.services.map((service) => (
                      <span key={service.id} className="service-tag">
                        {service.service_name}
                        {service.capacity && ` (${service.capacity})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedOrg.contact_email || selectedOrg.contact_phone || selectedOrg.website) && (
                <div className="detail-section contact-section">
                  <strong>Contact:</strong>
                  {selectedOrg.contact_email && (
                    <a href={`mailto:${selectedOrg.contact_email}`} className="contact-link">
                      {selectedOrg.contact_email}
                    </a>
                  )}
                  {selectedOrg.contact_phone && (
                    <a href={`tel:${selectedOrg.contact_phone}`} className="contact-link">
                      {selectedOrg.contact_phone}
                    </a>
                  )}
                  {selectedOrg.website && (
                    <a
                      href={selectedOrg.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-link"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="map-summary">
        <h3>Borough Summary</h3>
        <div className="summary-grid">
          {boroughCounts.map(({ borough, count }) => (
            <div
              key={borough}
              className={`summary-card ${filterBorough === borough ? 'active' : ''}`}
              onClick={() => {
                setFilterBorough(filterBorough === borough ? 'all' : borough);
                if (leafletMapRef.current) {
                  leafletMapRef.current.setView([boroughCoordinates[borough].lat, boroughCoordinates[borough].lng], 12);
                }
              }}
            >
              <div className="summary-borough">{borough}</div>
              <div className="summary-count">{count}</div>
              <div className="summary-label">organizations</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapView;
