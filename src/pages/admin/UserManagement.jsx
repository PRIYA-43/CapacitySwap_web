import { useMemo, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import AdminDataTable from '../../components/admin/AdminDataTable';
import StatusBadge from '../../components/admin/StatusBadge';

function UserManagement() {
  const { data, loading, error: dataError } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [role, setRole] = useState('All account types');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState(null);
  const search = params.get('search') || '';

  const visible = useMemo(() => data.users.filter((user) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [user.id, user.name, user.email, user.company].some((value) => value.toLowerCase().includes(term));
    return matchesSearch && (role === 'All account types' || user.role === role) && (status === 'All statuses' || user.status === status);
  }), [data.users, search, role, status]);

  const columns = [
    { key: 'id', label: 'User ID' },
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Account Type' },
    { key: 'registered', label: 'Registered' },
    { key: 'status', label: 'Status', render: (user) => <StatusBadge status={user.status} /> },
    { key: 'actions', label: 'Actions', sortable: false, render: (user) => <div className="admin-row-actions">
      <button type="button" className="admin-icon-action" onClick={() => setSelected(user)} aria-label={`View ${user.name}`} title="View details"><Eye size={15} /></button>
    </div> },
  ];

  return (
    <div className="admin-page">
      <PageHeading eyebrow="ACCOUNT DIRECTORY" title="User management" subtitle="Review account details, roles, and account status." />
      {dataError && <p className="field-error" role="alert">{dataError}</p>}
      {loading && <p>Loading user records...</p>}
      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setParams(event.target.value ? { search: event.target.value } : {})} placeholder="Search name, email, company, or ID" /></label>
          <label className="admin-filter"><span>Account type</span><select value={role} onChange={(event) => setRole(event.target.value)}><option>All account types</option><option>Provider</option><option>Seeker</option></select></label>
          <label className="admin-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>Under Review</option><option>Suspended</option></select></label>
        </div>
        <AdminDataTable columns={columns} rows={visible} />
      </section>

      {selected && <AdminModal title={selected.name} onClose={() => setSelected(null)}>
        <dl className="admin-detail-list"><dt>User ID</dt><dd>{selected.id}</dd><dt>Email</dt><dd>{selected.email}</dd><dt>Phone</dt><dd>{selected.phone}</dd><dt>Company</dt><dd>{selected.company}</dd><dt>Account type</dt><dd>{selected.role}</dd><dt>Registration</dt><dd>{selected.registered}</dd><dt>Status</dt><dd><StatusBadge status={selected.status} /></dd></dl>
        <h3 className="admin-modal-subheading">Recent user activity</h3><ul className="admin-activity-list">{selected.activity.map((item) => <li key={item}>{item}</li>)}</ul>
      </AdminModal>}

    </div>
  );
}

export function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="admin-page-heading"><div><span className="eyebrow-label">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

export function AdminModal({ title, children, onClose }) {
  return <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-modal admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-detail-title">
      <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close dialog">×</button>
      <span className="eyebrow-label">RECORD DETAILS</span><h2 id="admin-detail-title">{title}</h2>
      {children}
      <button type="button" className="admin-button admin-button-primary admin-modal-done" onClick={onClose}>Close</button>
    </section>
  </div>;
}

export default UserManagement;
