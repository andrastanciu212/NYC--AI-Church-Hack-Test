import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './ImportData.css';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedOrganization {
  name: string;
  type: 'church' | 'ministry' | 'nonprofit' | 'civic_group';
  borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';
  neighborhood?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  description?: string;
  services?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

function ImportData({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedOrganization[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const parseCSV = (text: string): ParsedOrganization[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const organizations: ParsedOrganization[] = [];
    const validationErrors: ValidationError[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const org: any = {};

      headers.forEach((header, index) => {
        const value = values[index]?.replace(/^["']|["']$/g, '');
        if (value) {
          org[header] = value;
        }
      });

      if (!org.name) {
        validationErrors.push({ row: i + 1, field: 'name', message: 'Name is required' });
        continue;
      }

      if (!org.type || !['church', 'ministry', 'nonprofit', 'civic_group'].includes(org.type)) {
        validationErrors.push({ row: i + 1, field: 'type', message: 'Invalid type. Must be: church, ministry, nonprofit, or civic_group' });
        continue;
      }

      if (!org.borough || !['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].includes(org.borough)) {
        validationErrors.push({ row: i + 1, field: 'borough', message: 'Invalid borough' });
        continue;
      }

      organizations.push(org as ParsedOrganization);
    }

    setErrors(validationErrors);
    return organizations;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setErrors([]);
    }
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    try {
      const text = await file.text();
      const data = parseCSV(text);
      setParsedData(data);
    } catch (err) {
      console.error('Error parsing file:', err);
      setErrors([{ row: 0, field: 'file', message: 'Failed to parse CSV file' }]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    let imported = 0;

    try {
      const { data: serviceCategories } = await supabase
        .from('service_categories')
        .select('*');

      const serviceCategoryMap = new Map<string, string>(
        (serviceCategories as any[])?.map((cat: any) => [cat.name.toLowerCase(), cat.id]) || []
      );

      for (const org of parsedData) {
        try {
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert([{
              name: org.name,
              type: org.type,
              borough: org.borough,
              neighborhood: org.neighborhood || null,
              address: org.address || null,
              contact_email: org.contact_email || null,
              contact_phone: org.contact_phone || null,
              website: org.website || null,
              description: org.description || null,
              active: true,
            }] as any)
            .select()
            .single();

          if (orgError) throw orgError;
          if (!newOrg) throw new Error('Failed to create organization');

          if (org.services && (newOrg as any).id) {
            const serviceNames = org.services.split(';').map(s => s.trim().toLowerCase());
            const servicesToInsert = serviceNames
              .map(name => serviceCategoryMap.get(name))
              .filter(id => id !== undefined)
              .map(categoryId => ({
                organization_id: (newOrg as any).id,
                service_category_id: categoryId,
                capacity: null,
                notes: null,
              }));

            if (servicesToInsert.length > 0) {
              await supabase
                .from('organization_services')
                .insert(servicesToInsert as any);
            }
          }

          imported++;
        } catch (err) {
          console.error('Error importing organization:', err);
        }
      }

      setSuccessCount(imported);
      if (imported > 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Error during import:', err);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'name,type,borough,neighborhood,address,contact_email,contact_phone,website,description,services\n' +
      'Example Church,church,Manhattan,Upper West Side,123 Main St,contact@example.org,212-555-0100,https://example.org,Community church,Food Assistance;Youth Programs\n' +
      'Community Center,nonprofit,Brooklyn,Park Slope,456 Oak Ave,info@center.org,718-555-0200,https://center.org,Youth and family services,Education & Tutoring;Family Support';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organization_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="import-overlay">
      <div className="import-modal">
        <div className="import-header">
          <h2>Import Organizations</h2>
          <button type="button" onClick={onClose} className="btn-close">
            ✕
          </button>
        </div>

        <div className="import-content">
          <div className="import-section">
            <h3>Instructions</h3>
            <ol className="instructions-list">
              <li>Download the CSV template to see the required format</li>
              <li>Fill in your organization data following the template structure</li>
              <li>Valid types: church, ministry, nonprofit, civic_group</li>
              <li>Valid boroughs: Manhattan, Brooklyn, Queens, Bronx, Staten Island</li>
              <li>Services should be semicolon-separated (e.g., "Food Assistance;Youth Programs")</li>
            </ol>
            <button onClick={downloadTemplate} className="btn-secondary">
              Download CSV Template
            </button>
          </div>

          <div className="import-section">
            <h3>Upload File</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
            />
            {file && (
              <div className="file-info">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
            <button
              onClick={handleParse}
              disabled={!file || parsing}
              className="btn-primary"
            >
              {parsing ? 'Parsing...' : 'Parse CSV'}
            </button>
          </div>

          {errors.length > 0 && (
            <div className="import-section">
              <h3>Validation Errors</h3>
              <div className="error-list">
                {errors.map((err, idx) => (
                  <div key={idx} className="error-item">
                    Row {err.row}, {err.field}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="import-section">
              <h3>Preview ({parsedData.length} organizations)</h3>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Borough</th>
                      <th>Neighborhood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((org, idx) => (
                      <tr key={idx}>
                        <td>{org.name}</td>
                        <td>{org.type}</td>
                        <td>{org.borough}</td>
                        <td>{org.neighborhood || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <div className="preview-more">
                    And {parsedData.length - 5} more...
                  </div>
                )}
              </div>
            </div>
          )}

          {successCount > 0 && (
            <div className="success-message">
              Successfully imported {successCount} organizations!
            </div>
          )}
        </div>

        <div className="import-actions">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button
            onClick={handleImport}
            disabled={parsedData.length === 0 || importing}
            className="btn-primary"
          >
            {importing ? 'Importing...' : `Import ${parsedData.length} Organizations`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportData;
