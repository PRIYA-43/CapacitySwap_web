import { Download, Eye, Pencil, XCircle } from 'lucide-react';

function RFQTable({ rfqs, variant = 'list', onView = () => {}, onEdit = null, onCancel = null, onDownload = null, emptyMessage = 'No RFQs match your filters.' }) {
  const dashboard = variant === 'dashboard';

  return (
    <div className="table-scroll">
      <table className="data-table seeker-data-table">
        <thead>
          <tr>
            <th>RFQ ID</th>
            {dashboard ? (
              <>
                <th>Category / Requirement</th><th>Submitted</th><th>Quotations</th><th>Status</th><th>Action</th>
              </>
            ) : (
              <>
                <th>Requirement</th><th>Category</th><th>Quantity</th><th>Submitted</th><th>Delivery date</th><th>Quotations</th><th>Status</th><th>Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rfqs.length ? rfqs.map((rfq) => (
            <tr key={rfq.id}>
              <td className="table-id">{rfq.id}</td>
              {dashboard ? (
                <>
                  <td><span className="rfq-title-cell">{rfq.category}</span><small className="rfq-subtitle">{rfq.title}</small></td>
                  <td>{rfq.submitted}</td><td>{rfq.quotes}</td>
                  <td><span className={`booking-status ${statusClass(rfq.status)}`}>{statusLabel(rfq)}</span></td>
                  <td><button type="button" className="table-action view-action" onClick={() => onView(rfq)}><Eye size={14} />View</button></td>
                </>
              ) : (
                <>
                  <td>{rfq.title}</td><td>{rfq.category}</td><td>{rfq.quantity}</td><td>{rfq.submitted}</td><td>{rfq.deadline || '—'}</td><td>{rfq.quotes}</td>
                  <td><span className={`booking-status ${statusClass(rfq.status)}`}>{statusLabel(rfq)}</span></td>
                  <td><div className="table-actions">
                    <button type="button" className="table-action view-action" onClick={() => onView(rfq)} aria-label={`View ${rfq.id}`}><Eye size={14} /></button>
                    {onDownload && <button type="button" className="table-action view-action" onClick={() => onDownload(rfq)} aria-label={`Download ${rfq.id}`}><Download size={14} /></button>}
                    {onEdit && ['Draft', 'Open'].includes(rfq.status) && <button type="button" className="table-action view-action" onClick={() => onEdit(rfq)} aria-label={`Edit ${rfq.id}`}><Pencil size={14} /></button>}
                    {onCancel && ['Draft', 'Open'].includes(rfq.status) && <button type="button" className="table-action reject-action" onClick={() => onCancel(rfq)} aria-label={`Cancel ${rfq.id}`}><XCircle size={14} /></button>}
                  </div></td>
                </>
              )}
            </tr>
          )) : <tr><td className="table-empty" colSpan={dashboard ? 6 : 9}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase();
  if (['open', 'pending'].includes(normalized)) return 'status-pending';
  if (['quotations received', 'confirmed', 'completed', 'accepted'].includes(normalized)) return 'status-approved';
  if (['rejected', 'cancelled'].includes(normalized)) return 'status-rejected';
  return 'status-limited';
}

function statusLabel(rfq) {
  if (rfq.acceptedQuotationId) return 'Quotation accepted';
  if (rfq.providerDecision === 'accepted') return 'Provider accepted';
  if (rfq.providerDecision === 'rejected' || rfq.status === 'rejected') return 'Rejected';
  if (rfq.status === 'pending' || rfq.status === 'open') return 'Pending provider decision';
  return rfq.status || 'Unknown';
}

export default RFQTable;
