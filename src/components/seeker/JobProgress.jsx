import { Check, Circle } from 'lucide-react';

const steps = [
  'Booking Confirmed',
  'Production Started',
  'Production In Progress',
  'Quality Check',
  'Completed',
];

function JobProgress({ job }) {
  return (
    <div className="seeker-job-progress">
      <div className="seeker-job-progress-heading">
        <strong>{job.progress}% complete</strong>
        <span>{job.status}</span>
      </div>
      <div className="seeker-progress-track"><span style={{ width: `${job.progress}%` }} /></div>
      <ol className="seeker-progress-steps">
        {steps.map((step, index) => {
          const done = index < job.stage || job.progress === 100;
          const current = index === job.stage && job.progress < 100;
          const Icon = done ? Check : Circle;
          return (
            <li key={step} className={`${done ? 'step-done' : ''} ${current ? 'step-current' : ''}`}>
              <span className="seeker-step-icon"><Icon size={13} /></span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default JobProgress;
