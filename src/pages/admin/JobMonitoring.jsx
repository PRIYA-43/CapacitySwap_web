
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Search } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { PageHeading } from './UserManagement';

function JobMonitoring() {
  const { data, loading, error } = useOutletContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  const statuses = useMemo(() => {
    return [
      'All statuses',
      ...new Set(
        jobs
          .map((job) => job.currentStatus || job.status)
          .filter(Boolean)
      ),
    ];
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !term ||
        [
          job.id,
          job.bookingId,
          job.trackingId,
          job.rfqId,
          job.quotationId,
          job.machineName,
          job.providerName,
          job.providerCompanyName,
        ].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      const jobStatus = job.currentStatus || job.status || '';

      const matchesStatus =
        statusFilter === 'All statuses' ||
          jobStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const columns = [
    {
      key: 'bookingId',
      label: 'Booking ID',
      render: (row) => row.bookingId || '—',
    },
    {
      key: 'machineName',
      label: 'Machine',
      render: (row) => row.machineName || '—',
    },
    {
      key: 'providerCompanyName',
      label: 'Provider',
      render: (row) =>
        row.providerCompanyName || row.providerName || '—',
    },
    {
      key: 'currentStatus',
      label: 'Current Stage',
      render: (row) => (
        <StatusBadge status={row.currentStatus || row.status || 'Unknown'} />
      ),
    },
    {
      key: 'milestones',
      label: 'Progress',
      render: (row) => getMilestoneProgress(row.milestones),
    },
    {
      key: 'completed',
      label: 'Completed',
      render: (row) => (row.completed ? 'Yes' : 'No'),
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (row) => formatDate(row.updatedAt),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
  ];

  const activeJobs = jobs.filter(
    (job) => !job.completed
  ).length;

  const completedJobs = jobs.filter(
    (job) => job.completed
  ).length;

  return (
    <div className="admin-page">
      <PageHeading
        eyebrow="PRODUCTION OVERSIGHT"
        title="Job monitoring"
        subtitle="Track manufacturing jobs and their latest reported stages."
      />

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Loading job tracking records...</p>}

      <section className="admin-stat-grid" aria-label="Job statistics">
        <div className="admin-panel">
          <span>Total jobs</span>
          <h2>{jobs.length}</h2>
        </div>

        <div className="admin-panel">
          <span>Active jobs</span>
          <h2>{activeJobs}</h2>
        </div>

        <div className="admin-panel">
          <span>Completed jobs</span>
          <h2>{completedJobs}</h2>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <span className="sr-only">Search jobs</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search booking, tracking, machine, or provider"
            />
          </label>

          <label className="admin-filter">
            <span>Stage</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {jobs.length === 0 && !loading ? (
          <div className="admin-empty-state">
            <Activity size={24} />
            <h2>No job tracking records found.</h2>
            <p>
              Jobs will appear here once booking progress is tracked.
            </p>
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            rows={visibleJobs}
            pageSize={8}
          />
        )}
      </section>
    </div>
  );
}

function getMilestoneProgress(milestones) {
  if (!milestones) return '0 / 0';

  const values = Array.isArray(milestones)
    ? milestones
    : Object.values(milestones);

  if (!values.length) return '0 / 0';

  const completed = values.filter(
    (milestone) =>
      milestone &&
      String(milestone.status || '').toLowerCase() === 'completed'
  ).length;

  return `${completed} / ${values.length}`;
}

function formatDate(value) {
  if (!value) return '—';

  const date = value?.toDate
    ? value.toDate()
    : typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : null;

  if (!date || Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN');
}

export default JobMonitoring;
