import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Download, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { subscribeToProviderQuotations } from '../../services/quotationService';
import { downloadQuotationPdf } from '../../utils/pdfDownloads';

const filters = ['All quotations', 'Submitted', 'Accepted', 'Rejected'];

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

function statusClass(status) {
  if (status === 'accepted') return 'status-approved';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
}

function ProviderQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [filter, setFilter] = useState('All quotations');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribe;

    try {
      unsubscribe = subscribeToProviderQuotations(
        (items) => {
          if (!active) return;
          setQuotations(items);
          setLoading(false);
          setError('');
        },
        (subscriptionError) => {
          console.error('Provider quotation subscription error:', subscriptionError);
          if (!active) return;
          setError(subscriptionError.message || 'Unable to load quotations.');
          setLoading(false);
        }
      );
    } catch (subscriptionError) {
      console.error('Provider quotation subscription error:', subscriptionError);
      setError(subscriptionError.message || 'Unable to load quotations.');
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    setSelected((current) =>
      current ? quotations.find((item) => item.id === current.id) || current : null
    );
  }, [quotations]);

  const visible = useMemo(
    () => quotations.filter((quotation) =>
      filter === 'All quotations' || quotation.status === filter.toLowerCase()
    ),
    [quotations, filter]
  );

  return (
    <div className="provider-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">PROVIDER WORKSPACE</span>
          <h1>Quotations</h1>
          <p>Manage quotations submitted for incoming manufacturing requests.</p>
        </div>
        <Link to="/provider/dashboard" className="btn btn-secondary">
          <ArrowUpRight size={16} /> Dashboard
        </Link>
      </div>

      <section className="provider-panel">
        <div className="panel-heading">
          <div>
            <h2>Your quotations</h2>
            <p>{quotations.length} quotations submitted</p>
          </div>
          <div className="filter-tabs" role="tablist" aria-label="Quotation filters">
            {filters.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={filter === tab}
                className={filter === tab ? 'active' : ''}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p>Loading quotations...</p>
        ) : error ? (
          <div className="field-error" role="alert">{error}</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RFQ ID</th>
                  <th>Requirement</th>
                  <th>Machine</th>
                  <th>Seeker company</th>
                  <th>Provider company</th>
                  <th>Offered price</th>
                  <th>Estimated delivery</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((quotation) => (
                  <tr key={quotation.id}>
                    <td className="table-id">{quotation.rfqId || '—'}</td>
                    <td>{quotation.rfqTitle || '—'}</td>
                    <td>{quotation.machineName || '—'}</td>
                    <td>{quotation.seekerCompanyName || 'Not specified'}</td>
                    <td>{quotation.providerCompanyName || 'Not provided'}</td>
                    <td>
                      {quotation.offeredPrice == null
                        ? '—'
                        : `₹${Number(quotation.offeredPrice).toLocaleString('en-IN')} / ${quotation.priceUnitDetails || quotation.priceUnit}`}
                    </td>
                    <td>{quotation.estimatedDelivery || '—'}</td>
                    <td>{formatDate(quotation.createdAt)}</td>
                    <td>
                      <span className={`booking-status ${statusClass(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-action view-action"
                        onClick={() => setSelected(quotation)}
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        className="table-action view-action"
                        onClick={() => downloadQuotationPdf(quotation)}
                        aria-label={`Download quotation ${quotation.quotationId || quotation.id}`}
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td className="table-empty" colSpan="10">
                      {quotations.length
                        ? 'No quotations match this filter.'
                        : 'You have not submitted any quotations yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-quotation-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close quotation details"
            >
              <X size={18} />
            </button>
            <span className="eyebrow-label">QUOTATION · {selected.id}</span>
            <h2 id="provider-quotation-detail-title">{selected.rfqTitle || selected.rfqId}</h2>
            <dl className="booking-detail-list">
              <Detail label="Quotation ID" value={selected.quotationId || selected.id} />
              <Detail label="RFQ ID" value={selected.rfqId} />
              <Detail label="Seeker name" value={selected.seekerName} />
              <Detail label="Machine" value={selected.machineName} />
              <Detail label="Machine ID" value={selected.machineId} />
              <Detail label="Seeker company" value={selected.seekerCompanyName} />
              <Detail label="Provider name" value={selected.providerName} />
              <Detail label="Provider company" value={selected.providerCompanyName} />
              <Detail label="Offered price" value={selected.offeredPrice == null
                ? '—'
                : `₹${Number(selected.offeredPrice).toLocaleString('en-IN')} / ${selected.priceUnitDetails || selected.priceUnit}`} />
              <Detail label="Estimated delivery" value={selected.estimatedDelivery} />
              <Detail label="Estimated delivery days" value={selected.deliveryDays ? `${selected.deliveryDays} days` : ''} />
              <Detail label="Delivery date" value={formatDate(selected.deliveryDate)} />
              <Detail label="Material / manufacturing" value={selected.materialDetails} />
              <Detail label="Additional terms" value={selected.terms} />
              <Detail label="Validity" value={formatDate(selected.validityDate)} />
              <Detail label="Provider remarks" value={selected.providerRemarks} />
              <Detail label="Submitted" value={formatDate(selected.createdAt)} />
              <Detail label="Status" value={selected.status} />
            </dl>
            <button type="button" className="btn btn-ghost" onClick={() => downloadQuotationPdf(selected)}>
              <Download size={15} /> Download quotation
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  );
}

export default ProviderQuotations;
