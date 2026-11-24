import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye, FileWarning, Search } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { updateReportStatus } from '../../services/reportService';
import { AdminModal, PageHeading } from './UserManagement';

function formatDate(value) {
  if (!value) return '—';
  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN');
}

function ReportsManagement() {
  const { data, loading, error } = useOutletContext();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [category, setCategory] = useState('All categories');
  const [role, setRole] = useState('All roles');
  const [selected, setSelected] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [nextStatus, setNextStatus] = useState('Pending');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const visible = useMemo(() => data.reports.filter((report) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || [
      report.reportId,
      report.subject,
      report.description,
      report.reporterName,
      report.reporterUid,
      report.targetId,
      report.bookingId,
      report.rfqId,
    ].some((value) => String(value || '').toLowerCase().includes(term));
    const matchesStatus = status === 'All statuses' || String(report.status || 'Pending').toLowerCase() === status.toLowerCase();
    const matchesCategory = category === 'All categories' || (report.category || report.reportType) === category;
    const matchesRole = role === 'All roles' || report.reporterRole === role;
    return matchesText && matchesStatus && matchesCategory && matchesRole;
  }), [data.reports, search, status, category, role]);

  const categories = useMemo(() => [
    'All categories',
    ...new Set(data.reports.map((report) => report.category || report.reportType).filter(Boolean)),
  ], [data.reports]);

  const openReport = (report) => {
    setSelected(report);
    setAdminNotes(report.adminNotes || '');
    setNextStatus(report.status || 'Pending');
    setActionError('');
  };

  const saveReport = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      setActionError('');
      await updateReportStatus(selected.id, nextStatus, adminNotes);
      setSelected((current) => current ? { ...current, status: nextStatus, adminNotes } : current);
    } catch (updateError) {
      setActionError(updateError.message || 'Unable to update report.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'reportId', label: 'Report ID', render: (report) => report.reportId || report.id },
    { key: 'subject', label: 'Subject' },
    { key: 'category', label: 'Category', render: (report) => report.category || report.reportType || '—' },
    { key: 'reporterRole', label: 'Reporter role' },
    { key: 'status', label: 'Status', render: (report) => <StatusBadge status={report.status || 'Pending'} /> },
    { key: 'created', label: 'Created', render: (report) => formatDate(report.createdAt) },
    { key: 'actions', label: 'Details', sortable: false, render: (report) => (
      <button type="button" className="admin-icon-action" onClick={() => openReport(report)} aria-label={`View report ${report.reportId || report.id}`}><Eye size={15} /></button>
    ) },
  ];

  return (
    <div className="admin-page">
      <PageHeading
        eyebrow="TRUST & SAFETY"
        title="Reports & complaints"
        subtitle="Review marketplace reports, document findings, and track resolution."
      />
      {error && <p className="field-error" role="alert">{error}</p>}
      {actionError && <p className="field-error" role="alert">{actionError}</p>}
      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports, reporter, or target ID" /></label>
          <label className="admin-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Pending</option><option>Under Review</option><option>Resolved</option><option>Rejected</option></select></label>
          <label className="admin-filter"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="admin-filter"><span>Reporter</span><select value={role} onChange={(event) => setRole(event.target.value)}><option>All roles</option><option>Seeker</option><option>Provider</option></select></label>
        </div>
        {loading ? <p>Loading reports...</p> : visible.length ? (
          <AdminDataTable columns={columns} rows={visible} />
        ) : (
          <div className="admin-empty-state"><FileWarning size={24} /><h2>No reports found.</h2><p>Submitted reports will appear here.</p></div>
        )}
      </section>
      {selected && (
        <AdminModal title={selected.subject || 'Report details'} onClose={() => setSelected(null)}>
          <dl className="admin-detail-list">
            <dt>Report ID</dt><dd>{selected.reportId || selected.id}</dd>
            <dt>Reporter</dt><dd>{selected.reporterName || 'Not provided'} ({selected.reporterRole || 'User'})</dd>
            <dt>Reporter UID</dt><dd>{selected.reporterUid || '—'}</dd>
            <dt>Category</dt><dd>{selected.category || selected.reportType || '—'}</dd>
            <dt>Target type</dt><dd>{selected.targetType || 'General'}</dd>
            <dt>Target ID</dt><dd>{selected.targetId || '—'}</dd>
            <dt>Booking ID</dt><dd>{selected.bookingId || '—'}</dd>
            <dt>RFQ ID</dt><dd>{selected.rfqId || '—'}</dd>
            <dt>Created</dt><dd>{formatDate(selected.createdAt)}</dd>
            <dt>Updated</dt><dd>{formatDate(selected.updatedAt)}</dd>
            <dt>Description</dt><dd>{selected.description || '—'}</dd>
          </dl>
          <label className="admin-filter" style={{ marginTop: 18 }}><span>Report status</span><select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}><option>Pending</option><option>Under Review</option><option>Resolved</option><option>Rejected</option></select></label>
          <label className="admin-filter" style={{ marginTop: 12 }}><span>Admin notes</span><textarea value={adminNotes} maxLength={3000} rows={5} onChange={(event) => setAdminNotes(event.target.value)} /></label>
          <button type="button" className="admin-button admin-button-primary" style={{ marginTop: 14 }} disabled={saving} onClick={saveReport}>{saving ? 'Saving...' : 'Save report'}</button>
        </AdminModal>
      )}
    </div>
  );
}

export default ReportsManagement;
