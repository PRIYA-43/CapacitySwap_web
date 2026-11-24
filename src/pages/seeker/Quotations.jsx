import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, BriefcaseBusiness, Download } from 'lucide-react';

import QuotationCard from '../../components/seeker/QuotationCard';
import {
  acceptQuotation,
  rejectQuotation,
  subscribeToSeekerQuotations,
} from '../../services/quotationService';
import { downloadQuotationPdf } from '../../utils/pdfDownloads';

const filters = ['All quotations', 'Submitted', 'Accepted', 'Rejected', 'Not selected'];

function filterStatus(tab) {
  return tab === 'Not selected' ? 'not_selected' : tab.toLowerCase();
}

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

function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [filter, setFilter] = useState('All quotations');
  const [selectedRfqId, setSelectedRfqId] = useState('');
  const [details, setDetails] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe;

    try {
      unsubscribe = subscribeToSeekerQuotations(
        (items) => {
          if (!active) return;
          setQuotations(items);
          setLoading(false);
          setError('');
        },
        (subscriptionError) => {
          console.error('Seeker quotation subscription error:', subscriptionError);
          if (!active) return;
          setError(subscriptionError.message || 'Unable to load quotations.');
          setLoading(false);
        }
      );
    } catch (subscriptionError) {
      console.error('Seeker quotation subscription error:', subscriptionError);
      setError(subscriptionError.message || 'Unable to load quotations.');
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const visible = useMemo(
    () => quotations.filter((quotation) =>
      filter === 'All quotations' || quotation.status === filterStatus(filter)
    ),
    [quotations, filter]
  );

  const quoteGroups = useMemo(() => {
    const groups = new Map();
    for (const quotation of quotations) {
      const current = groups.get(quotation.rfqId) || [];
      current.push(quotation);
      groups.set(quotation.rfqId, current);
    }
    return [...groups.entries()].filter(([, items]) => items.length > 1);
  }, [quotations]);

  useEffect(() => {
    if (!quoteGroups.some(([rfqId]) => rfqId === selectedRfqId)) {
      setSelectedRfqId(quoteGroups[0]?.[0] || '');
    }
  }, [quoteGroups, selectedRfqId]);

  useEffect(() => {
    setDetails((current) =>
      current ? quotations.find((item) => item.id === current.id) || current : null
    );
    setConfirmation((current) => {
      if (!current) return null;
      const quotation = quotations.find((item) => item.id === current.quotation.id);
      return quotation ? { ...current, quotation } : current;
    });
  }, [quotations]);

  const comparable = quoteGroups.find(([rfqId]) => rfqId === selectedRfqId)?.[1] || [];

  const makeDecision = async () => {
    if (!confirmation || processing) return;
    try {
      setProcessing(true);
      setError('');
      if (confirmation.action === 'accept') {
        await acceptQuotation(confirmation.quotation.id);
        setNotice(`Quotation for ${confirmation.quotation.rfqId} accepted.`);
      } else {
        await rejectQuotation(confirmation.quotation.id, confirmation.reason || '');
        setNotice(`Quotation for ${confirmation.quotation.rfqId} rejected.`);
      }
      setConfirmation(null);
    } catch (decisionError) {
      console.error('Quotation decision failed:', decisionError);
      setError(decisionError.message || 'Unable to update this quotation.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="seeker-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">PROVIDER OFFERS</span>
          <h1>Quotations</h1>
          <p>Review provider responses, compare terms, and select the best fit.</p>
        </div>
      </div>

      {notice && <p className="seeker-success-message" role="status">{notice}</p>}
      {error && <div className="field-error" role="alert">{error}</div>}

      <div className="seeker-tabs" role="tablist" aria-label="Filter quotations">
        {filters.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={filter === tab}
            className={filter === tab ? 'active' : ''}
            key={tab}
            onClick={() => setFilter(tab)}
          >
            {tab}
            <span>
              {tab === 'All quotations'
                ? quotations.length
                : quotations.filter((quote) => quote.status === filterStatus(tab)).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="provider-panel seeker-empty-state">
          <h2>Loading your quotations...</h2>
        </div>
      ) : (
        <div className="seeker-quotation-grid">
          {visible.map((quotation) => (
            <QuotationCard
              key={quotation.id}
              quotation={quotation}
              onView={setDetails}
              onAccept={(item) => {
                setError('');
                setConfirmation({ quotation: item, action: 'accept' });
              }}
              onReject={(item) => {
                setError('');
                setConfirmation({ quotation: item, action: 'reject', reason: '' });
              }}
              decisionPending={processing}
            />
          ))}
        </div>
      )}

      {!loading && !error && !visible.length && (
        <div className="provider-panel seeker-empty-state">
          <BriefcaseBusiness size={25} />
          <h2>{quotations.length ? 'No quotations in this view'           : 'No quotations received yet.'}</h2>
          <p>
            {quotations.length
              ? 'Try selecting a different quotation status.'
              : 'Quotations submitted for your RFQs will appear here.'}
          </p>
        </div>
      )}

      {comparable.length > 1 && (
        <section className="provider-panel seeker-compare-panel">
          <div className="panel-heading">
            <div>
              <h2>Compare quotations</h2>
              <p>Compare provider offers received for the same RFQ.</p>
            </div>
            <BadgeCheck size={20} />
          </div>
          <label className="seeker-status-filter">
            <span>RFQ</span>
            <select
              value={selectedRfqId}
              onChange={(event) => setSelectedRfqId(event.target.value)}
            >
              {quoteGroups.map(([rfqId]) => (
                <option key={rfqId} value={rfqId}>{rfqId}</option>
              ))}
            </select>
          </label>
          <div className="table-scroll">
            <table className="data-table seeker-data-table seeker-compare-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Offered price</th>
                  <th>Machine</th>
                  <th>Delivery</th>
                  <th>Delivery date</th>
                  <th>Terms</th>
                </tr>
              </thead>
              <tbody>
                {comparable.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <strong>{quote.providerCompanyName || quote.providerName || 'Provider'}</strong>
                      <br />{quote.providerName || '—'}
                    </td>
                    <td>
                      {quote.offeredPrice == null
                        ? '—'
                        : `₹${Number(quote.offeredPrice).toLocaleString('en-IN')} / ${quote.priceUnitDetails || quote.priceUnit}`}
                    </td>
                    <td>{quote.machineName || '—'}</td>
                    <td>{quote.estimatedDelivery || '—'}</td>
                    <td>{formatDate(quote.deliveryDate)}</td>
                    <td>{quote.terms || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {details && (
        <div
          className="seeker-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetails(null);
          }}
        >
          <section className="seeker-modal" role="dialog" aria-modal="true" aria-labelledby="quotation-detail-title">
            <button type="button" className="seeker-modal-close" onClick={() => setDetails(null)} aria-label="Close dialog">×</button>
            <span className="eyebrow-label">QUOTATION · {details.id}</span>
            <h2 id="quotation-detail-title">{details.rfqTitle || details.rfqId}</h2>
            <dl className="seeker-detail-list">
              <Detail label="Quotation ID" value={details.quotationId || details.id} />
              <Detail label="RFQ ID" value={details.rfqId} />
              <Detail label="Seeker name" value={details.seekerName} />
              <Detail label="Seeker company" value={details.seekerCompanyName} />
              <Detail label="Provider company" value={details.providerCompanyName} />
              <Detail label="Provider name" value={details.providerName} />
              <Detail label="Machine" value={details.machineName} />
              <Detail label="Machine ID" value={details.machineId} />
              <Detail label="Offered price" value={details.offeredPrice == null
                ? '—'
                : `₹${Number(details.offeredPrice).toLocaleString('en-IN')} / ${details.priceUnitDetails || details.priceUnit}`} />
              <Detail label="Estimated delivery" value={details.estimatedDelivery} />
              <Detail label="Estimated delivery days" value={details.deliveryDays ? `${details.deliveryDays} days` : ''} />
              <Detail label="Delivery date" value={formatDate(details.deliveryDate)} />
              <Detail label="Material / manufacturing" value={details.materialDetails} />
              <Detail label="Additional terms" value={details.terms} />
              <Detail label="Quotation validity" value={formatDate(details.validityDate)} />
              <Detail label="Provider remarks" value={details.providerRemarks} />
              <Detail label="Submitted" value={formatDate(details.createdAt)} />
              <Detail label="Status" value={details.status} />
              <Detail label="Your decision" value={details.seekerDecision} />
              {details.rejectionReason && <Detail label="Rejection reason" value={details.rejectionReason} />}
            </dl>
            <button type="button" className="btn btn-ghost seeker-modal-action" onClick={() => downloadQuotationPdf(details)}>
              <Download size={15} /> Download quotation
            </button>
            <button type="button" className="btn btn-primary seeker-modal-action" onClick={() => setDetails(null)}>
              Close
            </button>
          </section>
        </div>
      )}

      {confirmation && (
        <div
          className="seeker-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !processing) setConfirmation(null);
          }}
        >
          <section className="seeker-modal" role="dialog" aria-modal="true" aria-labelledby="quotation-confirm-title">
            {confirmation.quotation.status !== 'submitted' && (
              <p className="field-error" role="alert">
                This quotation is no longer available for a decision.
              </p>
            )}
            <button
              type="button"
              className="seeker-modal-close"
              onClick={() => !processing && setConfirmation(null)}
              aria-label="Close dialog"
              disabled={processing}
            >
              ×
            </button>
            <span className="eyebrow-label">CONFIRM DECISION</span>
            <h2 id="quotation-confirm-title">
              {confirmation.action === 'accept' ? 'Accept this quotation?' : 'Reject this quotation?'}
            </h2>
            <p>
              {confirmation.action === 'accept'
                ? `Accept ${confirmation.quotation.providerCompanyName || confirmation.quotation.providerName || 'this provider'}’s offer for ${confirmation.quotation.rfqId}? Other submitted quotations will be marked not selected.`
                : `Reject this offer for ${confirmation.quotation.rfqId}?`}
            </p>
            {confirmation.action === 'reject' && (
              <label className="field-group seeker-field">
                <span>Reason (optional)</span>
                <textarea
                  value={confirmation.reason || ''}
                  onChange={(event) => setConfirmation((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))}
                  rows="3"
                  maxLength="1000"
                />
              </label>
            )}
            <div className="seeker-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmation(null)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={makeDecision}
                disabled={processing || confirmation.quotation.status !== 'submitted'}
              >
                {processing ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  );
}

export default Quotations;
