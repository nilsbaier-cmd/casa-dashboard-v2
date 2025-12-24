import React, { useState } from 'react';
import { HelpCircle, BookOpen, Calculator, AlertTriangle, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';

const HelpDocs = ({ translations = {} }) => {
  const [expandedSection, setExpandedSection] = useState('methodology');

  const t = {
    pageTitle: translations.helpTitle || 'Help & Documentation',
    pageSubtitle: translations.helpSubtitle || 'Learn how the INAD analysis works',
  };

  const sections = [
    {
      id: 'methodology',
      icon: BookOpen,
      title: 'Analysis Methodology',
      content: (
        <div>
          <p style={{ marginBottom: '16px' }}>
            The CASA INAD Analysis uses a three-step process to identify and prioritize routes with elevated inadmissible passenger rates.
          </p>

          <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>Step 1: Airline Filtering</h4>
          <p style={{ marginBottom: '16px' }}>
            Airlines are filtered based on total INAD cases. Only airlines meeting the minimum threshold (default: 6 cases) proceed to Step 2. This ensures statistical significance.
          </p>

          <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>Step 2: Route Filtering</h4>
          <p style={{ marginBottom: '16px' }}>
            Individual routes (Airline + Last Stop combinations) are filtered. Routes must have at least the minimum INAD count to be analyzed further.
          </p>

          <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>Step 3: Density Calculation & Classification</h4>
          <p style={{ marginBottom: '16px' }}>
            For each route, INAD density is calculated as: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>(INAD / PAX) × 1000</code> (per mille).
            Routes are then classified into priority categories based on threshold comparisons.
          </p>
        </div>
      )
    },
    {
      id: 'priority',
      icon: AlertTriangle,
      title: 'Priority Classifications',
      content: (
        <div>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--color-danger-light)', borderRadius: '8px', borderLeft: '4px solid var(--color-danger)' }}>
              <h4 style={{ color: 'var(--color-danger)', marginBottom: '8px' }}>HIGH PRIORITY</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Routes meeting ALL of the following criteria:
              </p>
              <ul style={{ fontSize: '0.875rem', margin: '8px 0 0 20px' }}>
                <li>Density ≥ calculated threshold</li>
                <li>Density ≥ minimum absolute threshold (0.10‰)</li>
                <li>Density ≥ threshold × multiplier (1.5×)</li>
                <li>INAD count ≥ 10 cases</li>
              </ul>
            </div>

            <div style={{ padding: '16px', background: 'var(--color-warning-light)', borderRadius: '8px', borderLeft: '4px solid var(--color-warning)' }}>
              <h4 style={{ color: 'var(--color-warning)', marginBottom: '8px' }}>WATCH LIST</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Routes that exceed the threshold but don't meet all HIGH PRIORITY criteria. Requires monitoring.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--color-muted-light)', borderRadius: '8px', borderLeft: '4px solid var(--color-muted)' }}>
              <h4 style={{ color: 'var(--color-muted)', marginBottom: '8px' }}>UNRELIABLE</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Routes with insufficient passenger data (PAX below minimum threshold). Results are statistically unreliable.
              </p>
            </div>

            <div style={{ padding: '16px', background: 'var(--color-success-light)', borderRadius: '8px', borderLeft: '4px solid var(--color-success)' }}>
              <h4 style={{ color: 'var(--color-success)', marginBottom: '8px' }}>CLEAR</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Routes with density below threshold. No action required.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'parameters',
      icon: Calculator,
      title: 'Configuration Parameters',
      content: (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Parameter</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Default</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontWeight: 500 }}>Minimum INAD</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>6</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>Minimum INAD cases for analysis inclusion</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontWeight: 500 }}>Minimum PAX</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>5,000</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>Minimum passengers for reliable density</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontWeight: 500 }}>Minimum Density</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>0.10‰</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>Absolute minimum density threshold</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontWeight: 500 }}>HP Multiplier</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>1.5×</td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>Threshold multiplier for HIGH PRIORITY</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', fontWeight: 500 }}>Threshold Method</td>
                <td style={{ padding: '12px' }}>Median</td>
                <td style={{ padding: '12px', fontSize: '0.875rem' }}>Statistical method for threshold calculation</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      id: 'systemic',
      icon: TrendingUp,
      title: 'Systemic Case Detection',
      content: (
        <div>
          <p style={{ marginBottom: '16px' }}>
            Systemic cases are routes that appear on the priority list across multiple consecutive semesters.
            This indicates persistent issues that require systematic intervention.
          </p>

          <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>Detection Criteria</h4>
          <ul style={{ marginBottom: '16px', marginLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Route flagged as HIGH_PRIORITY or WATCH_LIST for 2+ consecutive semesters</li>
            <li style={{ marginBottom: '8px' }}>Trend analysis compares first and last appearance densities</li>
            <li>Routes marked as WORSENING, IMPROVING, or STABLE</li>
          </ul>

          <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>Trend Classification</h4>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>WORSENING</span>
              <span style={{ fontSize: '0.875rem' }}>Density increased by more than 10%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>IMPROVING</span>
              <span style={{ fontSize: '0.875rem' }}>Density decreased by more than 10%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>STABLE</span>
              <span style={{ fontSize: '0.875rem' }}>Density change within ±10%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'datasources',
      icon: HelpCircle,
      title: 'Data Sources',
      content: (
        <div>
          <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>INAD-Tabelle</h4>
          <p style={{ marginBottom: '16px' }}>
            Contains individual INAD (inadmissible passenger) cases with:
          </p>
          <ul style={{ marginBottom: '20px', marginLeft: '20px' }}>
            <li style={{ marginBottom: '4px' }}>Airline code (Fluggesellschaft)</li>
            <li style={{ marginBottom: '4px' }}>Last stop / Origin airport (Abflugort)</li>
            <li style={{ marginBottom: '4px' }}>Year and month of incident</li>
            <li>Refusal code (for exclusion filtering)</li>
          </ul>

          <h4 style={{ marginBottom: '12px', color: 'var(--color-primary)' }}>BAZL-Daten</h4>
          <p style={{ marginBottom: '16px' }}>
            Contains passenger volume data with:
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li style={{ marginBottom: '4px' }}>Airline code</li>
            <li style={{ marginBottom: '4px' }}>Airport code</li>
            <li style={{ marginBottom: '4px' }}>Passenger count (PAX)</li>
            <li>Time period (year, month)</li>
          </ul>

          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '8px' }}>Excluded Refusal Codes</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              The following codes are excluded from analysis as they don't represent systemic issues:
            </p>
            <code style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem' }}>
              B1n, B2n, C4n, C5n, C8, D1n, D2n, E, F1n, G, H, I
            </code>
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t.pageTitle}</h1>
        <p className="page-subtitle">{t.pageSubtitle}</p>
      </div>

      {/* Documentation Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sections.map((section) => (
          <div key={section.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => toggleSection(section.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: expandedSection === section.id ? 'var(--bg-tertiary)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <section.icon size={20} style={{ color: 'var(--color-primary)' }} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: '1rem' }}>{section.title}</span>
              {expandedSection === section.id ? (
                <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>

            {expandedSection === section.id && (
              <div style={{ padding: '0 20px 20px 52px' }}>
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Reference Card */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Quick Reference</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Density Formula</div>
            <code style={{ fontWeight: 600 }}>(INAD / PAX) × 1000</code>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Analysis Period</div>
            <span style={{ fontWeight: 600 }}>6 months (semester)</span>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Systemic Threshold</div>
            <span style={{ fontWeight: 600 }}>2+ consecutive semesters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDocs;
