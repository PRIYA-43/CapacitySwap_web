import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye, Search } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { AdminModal, PageHeading } from './UserManagement';

function RFQManagement() {
  const { data, loading, error } = useOutletContext();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState(null);
  const visible = useMemo(() => data.rfqs.filter((rfq) => {
    const term = search.trim().toLowerCase();
    return (!term || [rfq.id, rfq.title, rfq.buyer, rfq.category].some((value) => String(value || '').toLowerCase().includes(term)))
      && (status === 'All statuses' || rfq.status === status);
  }), [data.rfqs, search, status]);

  const columns = [
    { key: 'id', label: 'RFQ ID' },
    { key: 'buyer', label: 'Buyer Company' },
    { key: 'title', label: 'Requirement Title' },
    { key: 'category', label: 'Machine Category' },
    { key: 'submitted', label: 'Submission Date' },
    { key: 'quotes', label: 'Quotations', sortValue: (rfq) => rfq.quotes },
    { key: 'status', label: 'RFQ Status', render: (rfq) => <StatusBadge status={rfq.status} /> },
    { key: 'actions', label: 'Actions', sortable: false, render: (rfq) => <button type="button" className="admin-icon-action" onClick={() => setSelected(rfq)} aria-label={`View ${rfq.id}`} title="View details"><Eye size={15} /></button> },
  ];

  return (
    <div className="admin-page">
      <PageHeading eyebrow="DEMAND MONITORING" title="RFQ management" subtitle="Monitor requests and identify activity that may need review." />
      {error && <p className="field-error" role="alert">{error}</p>}
      {loading && <p>Loading RFQs...</p>}
      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search RFQ, buyer, or requirement" /></label>
          <label className="admin-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{[...new Set(data.rfqs.map((rfq) => rfq.status))].map((item) => <option key={item}>{item}</option>)}</select></label>
          <span className="admin-toolbar-summary">{visible.length} requests</span>
        </div>
        <AdminDataTable columns={columns} rows={visible} />
      </section>

      {selected && <AdminModal title={`${selected.id} · ${selected.title}`} onClose={() => setSelected(null)}>
        <dl className="admin-detail-list"><dt>Seeker</dt><dd>{selected.seekerName || 'Not provided'}</dd><dt>Seeker company</dt><dd>{selected.buyer || 'Not provided'}</dd><dt>Provider</dt><dd>{selected.providerName || 'Not provided'}</dd><dt>Provider company</dt><dd>{selected.providerCompanyName || 'Not provided'}</dd><dt>Machine</dt><dd>{selected.machineName || 'Not provided'} · {selected.machineId || 'Not provided'}</dd><dt>Category</dt><dd>{selected.category || 'Not provided'}</dd><dt>Quantity</dt><dd>{selected.quantity} {selected.quantityUnit || ''}</dd><dt>Submitted</dt><dd>{selected.submitted || 'Not provided'}</dd><dt>Delivery deadline</dt><dd>{selected.deadline || 'Not provided'}</dd><dt>Quotation count</dt><dd>{selected.quotes}</dd><dt>RFQ status</dt><dd><StatusBadge status={selected.status} /></dd><dt>Requirement summary</dt><dd>{selected.requirement || 'Not provided'}</dd></dl>
        <p className="admin-privacy-note">Commercial quotation contents are not editable from the admin workspace.</p>
      </AdminModal>}
    </div>
  );
}

export default RFQManagement;
