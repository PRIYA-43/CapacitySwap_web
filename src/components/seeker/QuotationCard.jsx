import { CheckCircle2, Clock3, Download, Eye, MapPin, ShieldCheck } from 'lucide-react';
import { downloadQuotationPdf } from '../../utils/pdfDownloads';

function formatDate(value) {
  if (!value) return '—';
  const date = value.toDate ? value.toDate() : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function QuotationCard({
  quotation,
  onView,
  onAccept,
  onReject,
  decisionPending = false,
}) {
  const accepted = quotation.status === 'accepted';
  const rejected = quotation.status === 'rejected';
  const notSelected = quotation.status === 'not_selected';
  const submitted = quotation.status === 'submitted';
  const price = Number(quotation.offeredPrice);
  const statusLabel = notSelected ? 'Not selected' : quotation.status;

  return (
    <article className="seeker-quote-card">
      <div className="seeker-quote-top">
        <span className="machine-category">
          {quotation.machineCategory || 'Manufacturing'}
        </span>
        <span className={`booking-status ${accepted ? 'status-approved' : rejected || notSelected ? 'status-rejected' : 'status-pending'}`}>
          {statusLabel}
        </span>
      </div>
      <p className="rfq-subtitle">{quotation.rfqTitle || quotation.rfqId}</p>
      <h3>{quotation.providerCompanyName || quotation.providerName || 'Provider'}</h3>
      <p className="seeker-quote-machine">
        {quotation.providerName || 'Provider name not provided'} · {quotation.machineName || 'Machine not specified'}
      </p>
      <div className="seeker-quote-price">
        {Number.isFinite(price) ? `₹${price.toLocaleString('en-IN')}` : '—'}
        <small> / {quotation.priceUnitDetails || quotation.priceUnit}</small>
      </div>
      <div className="seeker-quote-meta">
        <span><Clock3 size={15} />{quotation.estimatedDelivery || 'Delivery time not specified'}</span>
        <span><Clock3 size={15} />Delivery by {formatDate(quotation.deliveryDate)}</span>
        <span><Clock3 size={15} />Submitted {formatDate(quotation.createdAt)}</span>
        <span><ShieldCheck size={15} />RFQ {quotation.rfqId}</span>
        <span><MapPin size={15} />Valid until {quotation.validityDate || '—'}</span>
      </div>
      <p className="seeker-quote-terms">
        {quotation.materialDetails || 'Material and manufacturing details not provided.'}
      </p>
      <p className="seeker-quote-terms">{quotation.terms || 'No additional terms provided.'}</p>
      {quotation.rejectionReason && (
        <p className="seeker-quote-terms"><strong>Rejection reason:</strong> {quotation.rejectionReason}</p>
      )}
      {quotation.seekerDecisionAt && (
        <p className="rfq-subtitle">
          Decision recorded {formatDate(quotation.seekerDecisionAt)}
        </p>
      )}
      <div className="table-actions">
        <button type="button" className="table-action view-action" onClick={() => onView(quotation)}>
          <Eye size={14} /> Details
        </button>
        <button type="button" className="table-action view-action" onClick={() => downloadQuotationPdf(quotation)}>
          <Download size={14} /> Download
        </button>
        {accepted ? (
          <span className="seeker-accepted-label"><CheckCircle2 size={16} /> Accepted</span>
        ) : rejected ? (
          <span className="booking-status status-rejected">Rejected</span>
        ) : notSelected ? (
          <span className="booking-status status-rejected">Not selected</span>
        ) : !submitted ? (
          <span className="booking-status status-pending">{statusLabel}</span>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary seeker-quote-select"
              onClick={() => onAccept(quotation)}
              disabled={decisionPending}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn btn-ghost seeker-quote-select"
              onClick={() => onReject(quotation)}
              disabled={decisionPending}
            >
              Reject
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default QuotationCard;
