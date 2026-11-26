
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { AdminModal, PageHeading } from './UserManagement';

const verificationStatuses = [
  'All statuses',
  'Pending Verification',
  'Verified',
  'Rejected',
  'Information Requested',
];

function CompanyVerification() {
  const { data, loading, error: dataError } = useOutletContext();

  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState(null);

  const visible = useMemo(() => {
    return data.companies.filter(
      (company) =>
        status === 'All statuses' || company.status === status
    );
  }, [data.companies, status]);

  const columns = [
    {
      key: 'name',
      label: 'Company Name',
    },
    {
      key: 'email',
      label: 'Company Email',
    },
    {
      key: 'phone',
      label: 'Contact Number',
    },
    {
      key: 'businessType',
      label: 'Business Type',
    },
    {
      key: 'registered',
      label: 'Registered Date',
    },
    {
      key: 'status',
      label: 'Status',
      render: (company) => (
        <StatusBadge status={displayStatus(company.status)} />
      ),
    },
    {
      key: 'actions',
      label: 'Details',
      sortable: false,
      render: (company) => (
        <div className="admin-row-actions">
          <button
            type="button"
            className="admin-icon-action"
            onClick={() => setSelected(company)}
            aria-label={`View ${company.name}`}
            title="View company details"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <PageHeading
        eyebrow="REGISTERED BUSINESSES"
        title="Company verification"
        subtitle="View registered companies and their submitted business information."
      />

      {dataError && (
        <p className="field-error" role="alert">
          {dataError}
        </p>
      )}

      {loading && <p>Loading company records...</p>}

      <div
        className="admin-status-tabs"
        role="tablist"
        aria-label="Company status filter"
      >
        {verificationStatuses.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={status === item}
            className={status === item ? 'active' : ''}
            onClick={() => setStatus(item)}
          >
            {item}
            <span>
              {item === 'All statuses'
                ? data.companies.length
                : data.companies.filter(
                    (company) => company.status === item
                  ).length}
            </span>
          </button>
        ))}
      </div>

      <section className="admin-panel">
        <AdminDataTable
          columns={columns}
          rows={visible}
        />
      </section>

      {selected && (
        <AdminModal
          title={selected.name || 'Company details'}
          onClose={() => setSelected(null)}
        >
          <dl className="admin-detail-list company-detail-list">
            <dt>Company ID</dt><dd>{selected.id || '—'}</dd>
            <dt>Business email</dt><dd>{selected.email || '—'}</dd>
            <dt>Contact number</dt><dd>{selected.phone || '—'}</dd>
            <dt>GSTIN</dt><dd>{selected.gstin || 'Not provided'}</dd>
            <dt>Business type</dt><dd>{selected.businessType || 'Not provided'}</dd>
            <dt>Registered date</dt><dd>{selected.registered || '—'}</dd>
            <dt>Location</dt><dd>{selected.city || 'Not provided'}</dd>
            <dt>Account role</dt><dd>{selected.role || '—'}</dd>
            <dt>Verification status</dt><dd>{displayStatus(selected.status) || '—'}</dd>
            <dt>Description</dt><dd>{selected.description || 'Not provided'}</dd>
          </dl>
        </AdminModal>
      )}
    </div>
  );
}

function displayStatus(status) {
  return String(status || '').toLowerCase() === 'active'
    ? 'Active'
    : status;
}

export default CompanyVerification;
