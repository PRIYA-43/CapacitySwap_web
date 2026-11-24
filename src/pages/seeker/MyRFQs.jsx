import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, Plus, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import RFQTable from '../../components/seeker/RFQTable';
import { subscribeToSeekerRFQs } from '../../services/rfqService';
import { subscribeToSeekerQuotations } from '../../services/quotationService';
import { downloadRFQPdf } from '../../utils/pdfDownloads';

function MyRFQs() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [quotationCounts, setQuotationCounts] = useState(new Map());
  const [quotationError, setQuotationError] = useState('');
  const location = useLocation();

  useEffect(() => {
    let active = true;
    let unsubscribeQuotations;
    let unsubscribeRFQs;
    try {
      unsubscribeQuotations = subscribeToSeekerQuotations(
        (quotations) => {
          if (!active) return;
          const counts = new Map();
          for (const quotation of quotations) {
            counts.set(quotation.rfqId, (counts.get(quotation.rfqId) || 0) + 1);
          }
          setQuotationCounts(counts);
          setQuotationError('');
        },
        (error) => {
          console.error('RFQ quotation count subscription error:', error);
          if (active) setQuotationError(error.message || 'Unable to load quotation counts.');
        }
      );
      unsubscribeRFQs = subscribeToSeekerRFQs(
        (records) => {
          if (!active) return;
          setRfqs(records);
          setLoading(false);
          setError('');
        },
        (error) => {
          console.error('Seeker RFQ subscription error:', error);
          if (!active) return;
          setError(error.message || 'Unable to load your RFQs.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Seeker RFQ subscription error:', error);
      setError(error.message || 'Unable to load your RFQs.');
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribeRFQs?.();
      unsubscribeQuotations?.();
    };
  }, []);

  const normalizedRFQs = useMemo(() => rfqs.map((rfq) => ({
    ...rfq,
    category: rfq.machineCategory || rfq.category || 'Machine',
    submitted: rfq.createdAt?.toDate?.().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) || rfq.submitted || '—',
    deadline: rfq.completionDate || rfq.requiredCompletionDate || rfq.requiredBy || rfq.deadline || '—',
    quotes: quotationCounts.get(rfq.id) || 0,
  })), [rfqs, quotationCounts]);

  const filtered = useMemo(() => normalizedRFQs.filter((rfq) => {
    const term = search.trim().toLowerCase();
    const matchesText = !term || [
      rfq.id,
      rfq.title,
      rfq.category,
      rfq.machineName,
    ].some((value) => String(value || '').toLowerCase().includes(term));
    const matchesStatus = status === 'All statuses' ||
      (status === 'pending' ? ['open', 'pending'].includes(rfq.status) : rfq.status === status);
    return matchesText && matchesStatus;
  }), [normalizedRFQs, search, status]);

  return (
    <div className="seeker-page">
      <div className="dashboard-heading">
        <div><span className="eyebrow-label">PROCUREMENT WORKSPACE</span><h1>My RFQs</h1><p>Track manufacturing requirements and compare provider responses.</p></div>
        <Link className="btn btn-primary" to="/seeker/rfqs/create"><Plus size={17} /> Create new RFQ</Link>
      </div>
      {location.state?.notice && <p className="seeker-success-message" role="status">{location.state.notice}</p>}
      {quotationError && <p className="field-error" role="alert">{quotationError}</p>}
      <section className="provider-panel">
        <div className="seeker-filter-toolbar">
          <label className="seeker-inline-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search RFQ ID, title, or category" /></label>
          <label className="seeker-status-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option value="pending">Pending provider decision</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label>
          <span className="seeker-results-count"><ClipboardList size={15} />{filtered.length} requirements</span>
        </div>
        {loading ? (
          <div className="provider-panel seeker-empty-state"><h2>Loading your RFQs...</h2></div>
        ) : error ? (
          <div className="provider-panel seeker-empty-state" role="alert"><h2>Unable to load RFQs</h2><p>{error}</p></div>
        ) : (
          <RFQTable
            rfqs={filtered}
            onView={setSelectedRfq}
            onDownload={downloadRFQPdf}
            emptyMessage={rfqs.length ? 'No RFQs match your filters.' : 'No RFQs submitted yet.'}
          />
        )}
      </section>

      {selectedRfq && <Dialog title={`Requirement ${selectedRfq.id}`} onClose={() => setSelectedRfq(null)}>
        <dl className="seeker-detail-list">
          <dt>Title</dt><dd>{selectedRfq.title}</dd><dt>Machine</dt><dd>{selectedRfq.machineName || '—'}</dd><dt>Category</dt><dd>{selectedRfq.category}</dd>
          <dt>Seeker name</dt><dd>{selectedRfq.seekerName || 'Not provided'}</dd>
          <dt>Seeker company</dt><dd>{selectedRfq.seekerCompanyName || 'Not provided'}</dd>
          <dt>Provider name</dt><dd>{selectedRfq.providerName || 'Not provided'}</dd>
          <dt>Provider company</dt><dd>{selectedRfq.providerCompanyName || 'Not provided'}</dd>
          <dt>Machine ID</dt><dd>{selectedRfq.machineId || 'Not provided'}</dd>
          <dt>Quantity</dt><dd>{selectedRfq.quantity} {selectedRfq.quantityUnit || ''}</dd><dt>Submitted</dt><dd>{selectedRfq.submitted}</dd>
          <dt>Delivery deadline</dt><dd>{selectedRfq.deadline || 'Not specified'}</dd>
          <dt>Material</dt><dd>{selectedRfq.materialType || 'Not specified'}</dd>
          <dt>Location</dt><dd>{selectedRfq.location || 'Not specified'}</dd>
          <dt>Budget</dt><dd>{selectedRfq.budget == null ? 'Not provided' : `₹${Number(selectedRfq.budget).toLocaleString('en-IN')}`}</dd>
          <dt>Provider decision</dt><dd>{selectedRfq.providerDecision || 'Pending'}</dd>
          <dt>Provider remarks</dt><dd>{selectedRfq.providerRemarks || '—'}</dd>
          {selectedRfq.providerDecision === 'rejected' && (
            <><dt>Rejection reason</dt><dd>{selectedRfq.rejectionReason || 'No reason provided.'}</dd></>
          )}
          <dt>Description</dt><dd>{selectedRfq.description || 'No additional notes.'}</dd>
        </dl>
        <button type="button" className="btn btn-ghost" onClick={() => downloadRFQPdf(selectedRfq)}>
          <Download size={15} /> Download RFQ
        </button>
      </Dialog>}
    </div>
  );
}

function Dialog({ title, children, onClose }) {
  return (
    <div className="seeker-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="seeker-modal" role="dialog" aria-modal="true" aria-labelledby="rfq-dialog-title">
        <button type="button" className="seeker-modal-close" onClick={onClose} aria-label="Close dialog">×</button>
        <span className="eyebrow-label">RFQ INFORMATION</span><h2 id="rfq-dialog-title">{title}</h2>
        {children}
        {!title.includes('Cancel') && <button type="button" className="btn btn-primary seeker-modal-action" onClick={onClose}>Close</button>}
      </section>
    </div>
  );
}

export default MyRFQs;
