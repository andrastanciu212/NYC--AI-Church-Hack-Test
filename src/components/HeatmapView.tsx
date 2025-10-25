import { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './HeatmapView.css';

interface HeatmapViewProps {
  stats: {
    byBorough: Record<string, number>;
    totalOrgs: number;
  };
}

const boroughCoordinates: Record<string, { lat: number; lng: number }> = {
  'Manhattan': { lat: 40.7831, lng: -73.9712 },
  'Brooklyn': { lat: 40.6782, lng: -73.9442 },
  'Queens': { lat: 40.7282, lng: -73.7949 },
  'Bronx': { lat: 40.8448, lng: -73.8648 },
  'Staten Island': { lat: 40.5795, lng: -74.1502 },
};

function HeatmapView({ stats }: HeatmapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([40.7128, -73.9060], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    leafletMapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });

    Object.entries(boroughCoordinates).forEach(([borough, coords]) => {
      const count = stats.byBorough[borough] || 0;

      const color = count === 0 ? '#ef4444' :
                    count < 3 ? '#f59e0b' :
                    count < 5 ? '#3b82f6' : '#10b981';

      const size = count === 0 ? 30 : count < 3 ? 40 : count < 5 ? 50 : 60;

      const icon = L.divIcon({
        className: 'heatmap-marker',
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
    });
  }, [stats]);

  return (
    <div className="heatmap-view">
      <div ref={mapRef} className="heatmap-map"></div>
      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#10b981' }}></div>
          <span>5+ orgs</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#3b82f6' }}></div>
          <span>3-4 orgs</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#f59e0b' }}></div>
          <span>1-2 orgs</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ef4444' }}></div>
          <span>No coverage</span>
        </div>
      </div>
    </div>
  );
}

export default HeatmapView;
