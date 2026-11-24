import { useEffect, useState } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { getTrackingMilestoneOptions, subscribeToSeekerTracking } from '../../services/trackingService';

function ActiveJobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => subscribeToSeekerTracking(setJobs, (loadError) => setError(loadError.message)), []);
  return <div className="seeker-page"><div className="dashboard-heading"><div><span className="eyebrow-label">PRODUCTION TRACKING</span><h1>Active jobs</h1><p>Monitor confirmed booking progress.</p></div></div>
    {error && <div className="field-error" role="alert">{error}</div>}
    {jobs.length ? <div className="seeker-quotation-grid">{jobs.map((job) => <section className="provider-panel" key={job.id}><h2>{job.rfqId}</h2><p>Booking: {job.bookingId}</p><p>Current status: <strong>{job.currentStatus || 'booking_confirmed'}</strong></p>
      <div className="job-progress-list">{getTrackingMilestoneOptions().map(([key, label]) => { const milestone = job.milestones?.[key]; return <div className="job-progress-row" key={key}><span className={milestone?.status === 'completed' ? 'status-approved' : 'status-pending'}>{label}</span>{milestone?.status === 'completed' && <small>{milestone.timestamp?.toDate ? milestone.timestamp.toDate().toLocaleString() : 'Completed'}{milestone.note ? ` — ${milestone.note}` : ''}</small>}</div>; })}</div>
    </section>)}</div> : <section className="provider-panel seeker-empty-state"><BriefcaseBusiness size={25}/><h2>No active jobs yet.</h2><p>Active jobs appear after booking confirmation.</p></section>}
  </div>;
}
export default ActiveJobs;
