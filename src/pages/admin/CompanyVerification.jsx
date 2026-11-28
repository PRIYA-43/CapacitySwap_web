
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import { AdminModal, PageHeading } from './UserManagement';

const companyStatuses = ['All Companies', 'Active', 'Inactive'];

function CompanyVerification() {
  const { data, loading, error: dataError } = useOutletContext();

  const [status, setStatus] = useState('All Companies');
  const [selected, setSelected] = useState(null);

  const companies = useMemo(
    () =>
      data.companies.map((company) => {
        const owner = data.users.find((user) => user.uid === company.ownerUid);
        const accountStatus =
          String(owner?.status || '').toLowerCase() === 'active'
            ? 'Active'
            : 'Inactive';

        return { ...company, accountStatus };
      }),
    [data.companies, data.users]
  );
  const visible = useMemo(
    () =>
      companies.filter(
        (company) =>
          status === 'All Companies' || company.accountStatus === status
      ),
    [companies, status]
  );

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
        <CompanyStatusBadge status={company.accountStatus} />
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
        title="Company Management"
        subtitle="View registered companies and their account status."
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
        {companyStatuses.map((item) => (
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
              {item === 'All Companies'
                ? companies.length
                : companies.filter((company) => company.accountStatus === item)
                    .length}
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
            <dt>Account status</dt><dd><CompanyStatusBadge status={selected.accountStatus} /></dd>
            <dt>Description</dt><dd>{selected.description || 'Not provided'}</dd>
          </dl>
        </AdminModal>
      )}
    </div>
  );
}

function CompanyStatusBadge({ status }) {
  const tone = status === 'Active' ? 'success' : 'neutral';

  return (
    <span className={`admin-status-badge admin-status-${tone}`}>
      {status}
    </span>
  );
}

export default CompanyVerification;
