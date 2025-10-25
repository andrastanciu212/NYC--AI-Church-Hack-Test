import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import './Dashboard.css';

interface Stats {
  totalOrgs: number;
  byBorough: Record<string, number>;
  byType: Record<string, number>;
  totalServices: number;
  openGaps: number;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrgs: 0,
    byBorough: {},
    byType: {},
    totalServices: 0,
    openGaps: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [orgsResult, servicesResult, gapsResult] = await Promise.all([
        supabase.from('organizations').select('borough, type, active'),
        supabase.from('organization_services').select('id'),
        supabase.from('gap_reports').select('status').eq('status', 'open'),
      ]);

      if (orgsResult.data && orgsResult.data.length > 0) {
        const activeOrgs = (orgsResult.data as any[]).filter((org: any) => org.active === true);
        const byBorough: Record<string, number> = {};
        const byType: Record<string, number> = {};

        activeOrgs.forEach((org: any) => {
          if (org.borough) {
            byBorough[org.borough] = (byBorough[org.borough] || 0) + 1;
          }
          if (org.type) {
            byType[org.type] = (byType[org.type] || 0) + 1;
          }
        });

        setStats({
          totalOrgs: activeOrgs.length,
          byBorough,
          byType,
          totalServices: servicesResult.data?.length || 0,
          openGaps: gapsResult.data?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalOrgs}</div>
          <div className="stat-label">Total Organizations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalServices}</div>
          <div className="stat-label">Services Tracked</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-value">{stats.openGaps}</div>
          <div className="stat-label">Open Gap Reports</div>
        </div>
      </section>

      <div className="breakdown-grid">
        <section className="breakdown-card">
          <h2>Organizations by Borough</h2>
          <div className="breakdown-list">
            {Object.entries(stats.byBorough).map(([borough, count]) => (
              <div key={borough} className="breakdown-item">
                <span className="breakdown-label">{borough}</span>
                <div className="breakdown-bar-container">
                  <div
                    className="breakdown-bar"
                    style={{
                      width: `${(count / stats.totalOrgs) * 100}%`,
                    }}
                  />
                </div>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="breakdown-card">
          <h2>Organizations by Type</h2>
          <div className="breakdown-list">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="breakdown-item">
                <span className="breakdown-label">
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <div className="breakdown-bar-container">
                  <div
                    className="breakdown-bar"
                    style={{
                      width: `${(count / stats.totalOrgs) * 100}%`,
                    }}
                  />
                </div>
                <span className="breakdown-value">{count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
