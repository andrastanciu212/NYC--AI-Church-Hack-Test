import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
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

declare global {
  interface Window {
    google: any;
  }
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
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && organizations.length > 0 && window.google && mapRef.current && !googleMapRef.current) {
      initializeMap();
    }
  }, [loading, organizations]);

  useEffect(() => {
    if (googleMapRef.current) {
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
    if (!window.google || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7128, lng: -73.9060 },
      zoom: 10,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    googleMapRef.current = map;
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!googleMapRef.current || !window.google) return;

    markersRef.current.forEach(marker => marker.setMap(null));
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

      const marker = new window.google.maps.Marker({
        position: coords,
        map: googleMapRef.current,
        title: `${borough}: ${count} organizations`,
        label: {
          text: count.toString(),
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: count === 0 ? 15 : count < 3 ? 20 : count < 5 ? 25 : 30,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });

      const infoContent = `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #2c3e50;">${borough}</h3>
          <p style="margin: 0; font-size: 14px; color: #64748b;">${count} organization${count !== 1 ? 's' : ''}</p>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('click', () => {
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        infoWindow.open(googleMapRef.current, marker);
        setFilterBorough(filterBorough === borough ? 'all' : borough);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });

    filteredOrgs.forEach(org => {
      if (!org.address) return;

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: org.address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const orgMarker = new window.google.maps.Marker({
            position: results[0].geometry.location,
            map: googleMapRef.current,
            title: org.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2c3e50',
              fillOpacity: 0.8,
              strokeColor: 'white',
              strokeWeight: 2,
            },
          });

          orgMarker.addListener('click', () => {
            setSelectedOrg(org);
          });

          markersRef.current.push(orgMarker);
        }
      });
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
        <div ref={mapRef} className="google-map"></div>

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
                if (googleMapRef.current) {
                  googleMapRef.current.panTo(boroughCoordinates[borough]);
                  googleMapRef.current.setZoom(12);
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
