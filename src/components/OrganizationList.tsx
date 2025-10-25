import type { OrganizationWithServices } from './OrganizationManager';
import './OrganizationList.css';

interface Props {
  organizations: OrganizationWithServices[];
  onEdit: (org: OrganizationWithServices) => void;
  onRefresh: () => void;
}

function OrganizationList({ organizations, onEdit }: Props) {
  return (
    <div className="org-list">
      {organizations.length === 0 ? (
        <div className="empty-state">
          <p>No organizations found.</p>
          <p className="empty-hint">Try adjusting your filters or add a new organization.</p>
        </div>
      ) : (
        <div className="org-grid">
          {organizations.map((org) => (
            <div key={org.id} className="org-card">
              <div className="org-card-header">
                <div>
                  <h3>{org.name}</h3>
                  <div className="org-meta">
                    <span className="org-type">
                      {org.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="org-borough">{org.borough}</span>
                    {!org.active && <span className="org-inactive">Inactive</span>}
                  </div>
                </div>
                <button className="btn-edit" onClick={() => onEdit(org)}>
                  Edit
                </button>
              </div>

              {org.neighborhood && (
                <div className="org-detail">
                  <strong>Neighborhood:</strong> {org.neighborhood}
                </div>
              )}

              {org.address && (
                <div className="org-detail">
                  <strong>Address:</strong> {org.address}
                </div>
              )}

              {org.description && (
                <div className="org-detail">
                  <strong>About:</strong> {org.description}
                </div>
              )}

              {org.services && org.services.length > 0 && (
                <div className="org-services">
                  <strong>Services:</strong>
                  <div className="service-tags">
                    {org.services.map((service) => (
                      <span key={service.id} className="service-tag">
                        {service.service_name}
                        {service.capacity && ` (${service.capacity})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(org.contact_email || org.contact_phone || org.website) && (
                <div className="org-contact">
                  {org.contact_email && (
                    <a href={`mailto:${org.contact_email}`} className="contact-link">
                      {org.contact_email}
                    </a>
                  )}
                  {org.contact_phone && (
                    <a href={`tel:${org.contact_phone}`} className="contact-link">
                      {org.contact_phone}
                    </a>
                  )}
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-link"
                    >
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrganizationList;
