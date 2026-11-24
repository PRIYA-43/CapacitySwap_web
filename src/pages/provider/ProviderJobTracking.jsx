import { useEffect, useState } from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { getTrackingMilestoneOptions, subscribeToProviderTracking, updateTrackingMilestone } from '../../services/trackingService';

export default function ProviderJobTracking() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const [notes, setNotes] = useState({});

  useEffect(() => subscribeToProviderTracking(
    (items) => { setJobs(items); setLoading(false); setError(''); },
    (loadError) => { setError(loadError.message); setLoading(false); }
  ), []);

  const update = async (job, key) => {
    try { setUpdating(`${job.id}_${key}`); await updateTrackingMilestone(job.id, key, notes[job.id] || ''); }
    catch (updateError) { setError(updateError.message); }
    finally { setUpdating(''); }
  };

  return <div className="provider-page"><div className="dashboard-heading"><div><span className="eyebrow-label">JOB PROGRESS</span><h1>Job Tracking</h1><p>Update only the milestones assigned to your confirmed work.</p></div></div>
    {error && <div className="field-error" role="alert">{error}</div>}
    {loading ? <p>Loading jobs...</p> : jobs.length ? <div className="seeker-quotation-grid">{jobs.map((job) => <section className="provider-panel" key={job.id}>
      <h2>{job.rfqId}</h2><p>Booking: {job.bookingId}</p><p>Current status: <strong>{job.currentStatus || 'booking_confirmed'}</strong></p>
      <div className="job-progress-list">{getTrackingMilestoneOptions().map(([key, label]) => {
        const milestone = job.milestones?.[key];
        return <div className="job-progress-row" key={key}><span className={milestone?.status === 'completed' ? 'status-approved' : 'status-pending'}>{label}</span>{milestone?.status === 'completed' ? <small>{milestone.timestamp?.toDate ? milestone.timestamp.toDate().toLocaleString() : 'Completed'}</small> : <button type="button" className="btn btn-ghost" disabled={updating === `${job.id}_${key}` || job.completed} onClick={() => update(job, key)}>{updating === `${job.id}_${key}` ? 'Updating...' : 'Mark complete'}</button>}</div>;
      })}</div>
      <label className="field-group"><span>Milestone note</span><input value={notes[job.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [job.id]: event.target.value }))} /></label>
    </section>)}</div> : <section className="provider-panel seeker-empty-state"><BriefcaseBusiness size={25} /><h2>No active jobs.</h2><p>Confirmed jobs will appear here.</p></section>}
  </div>;
}
