import { useEffect, useState } from 'react';
import { Activity, FileText } from 'lucide-react';
import { subscribeToProviderQuotations } from '../../services/quotationService';

function formatTime(value) {
  if (!value) return 'Recently';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString('en-IN');
}

export default function ProviderRecentActivity() {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      return subscribeToProviderQuotations(
        setActivities,
        (loadError) => setError(loadError.message || 'Unable to load recent activity.')
      );
    } catch (loadError) {
      setError(loadError.message || 'Unable to load recent activity.');
      return undefined;
    }
  }, []);

  return (
    <div className="provider-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">WORKSPACE HISTORY</span>
          <h1>Recent activity</h1>
          <p>Latest quotation updates across your provider workspace.</p>
        </div>
      </div>

      {error && <div className="field-error" role="alert">{error}</div>}

      {activities.length ? (
        <section className="provider-panel recent-activity-panel">
          <div className="activity-list">
            {activities.map((item) => (
              <article className="activity-item" key={item.id}>
                <span className="activity-icon"><FileText size={16} /></span>
                <div>
                  <strong>Quotation {item.status || 'submitted'}</strong>
                  <span>{item.rfqTitle || item.rfqId} · {item.seekerCompanyName || 'Seeker'}</span>
                </div>
                <small>{formatTime(item.createdAt)}</small>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="provider-panel seeker-empty-state">
          <Activity size={25} />
          <h2>No recent activity.</h2>
          <p>Quotation updates will appear here.</p>
        </section>
      )}
    </div>
  );
}
