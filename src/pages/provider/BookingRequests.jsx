
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ClipboardList, Download, X, Send, Check, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { decideRFQ, subscribeToProviderRFQs } from '../../services/rfqService';
import { createQuotation, subscribeToProviderQuotations } from '../../services/quotationService';
import { auth } from '../../firebase/firebase';
import { getUserProfile } from '../../services/userService';
import { downloadRFQPdf } from '../../utils/pdfDownloads';

function formatDate(value) {
  if (!value) return '—';

  const date = value.toDate
    ? value.toDate()
    : new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const initialQuotation = {
  price: '',
  priceUnit: 'per-piece',
  priceUnitDetails: '',
  deliveryDays: '',
  deliveryDate: '',
  materialDetails: '',
  validityDate: '',
  providerRemarks: '',
  capacity: '',
  terms: '',
};

function BookingRequests() {
  const [rfqs, setRfqs] = useState([]);
  const [submittedQuotations, setSubmittedQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All requests');
  const [selected, setSelected] = useState(null);

  const [quotation, setQuotation] = useState(initialQuotation);
  const [submitting, setSubmitting] = useState(false);
  const [quotationError, setQuotationError] = useState('');
  const [quotationSuccess, setQuotationSuccess] = useState(false);
  const [providerProfile, setProviderProfile] = useState(null);
  const [decisionMode, setDecisionMode] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [decisionNotice, setDecisionNotice] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribeRFQs;
    let unsubscribeQuotations;

    try {
      unsubscribeRFQs = subscribeToProviderRFQs((records) => {
        if (!active) return;
        setRfqs(records);
        setLoading(false);
        setError('');
      }, (loadError) => {
        console.error('Provider RFQ subscription error:', loadError);
        if (!active) return;
        setError(loadError.message || 'Unable to load RFQs.');
        setLoading(false);
      });
      unsubscribeQuotations = subscribeToProviderQuotations(
        (records) => active && setSubmittedQuotations(records),
        (loadError) => {
          console.error('Provider quotation subscription error:', loadError);
          if (active) setError(loadError.message || 'Unable to load quotations.');
        }
      );
    } catch (loadError) {
      console.error('Provider RFQ subscription error:', loadError);
      setError(loadError.message || 'Unable to load RFQs.');
      setLoading(false);
    }

    if (auth.currentUser) {
      getUserProfile(auth.currentUser.uid)
        .then((profile) => active && setProviderProfile(profile))
        .catch((profileError) => {
          console.error('Provider profile loading error:', profileError);
          if (active) setError(profileError.message || 'Unable to load your company profile.');
        });
    }

    return () => {
      active = false;
      unsubscribeRFQs?.();
      unsubscribeQuotations?.();
    };
  }, []);

  useEffect(() => {
    setSelected((current) => {
      if (!current) return null;
      const currentRFQ = rfqs.find((rfq) => rfq.id === current.id);
      if (!currentRFQ) return current;
      return {
        ...currentRFQ,
        hasQuotation: submittedQuotations.some((item) => item.rfqId === currentRFQ.id),
      };
    });
  }, [rfqs, submittedQuotations]);

  const filtered = useMemo(
    () =>
      rfqs.map((rfq) => ({
        ...rfq,
        hasQuotation: submittedQuotations.some((item) => item.rfqId === rfq.id),
      })).filter((rfq) => {
        const awaitingProvider = ['open', 'pending'].includes(rfq.status);
        const awaitingQuotation = rfq.status === 'accepted' &&
          rfq.providerDecision === 'accepted' && !rfq.hasQuotation;
        if (filter === 'Pending') return awaitingProvider || awaitingQuotation;
        if (filter === 'History') return !awaitingProvider && !awaitingQuotation;
        return true;
      }),
    [rfqs, submittedQuotations, filter]
  );

  const updateQuotation = (event) => {
    const { name, value } = event.target;

    setQuotation((current) => ({
      ...current,
      [name]: value,
    }));

    setQuotationError('');
  };

  const openRFQ = (rfq) => {
    setSelected(rfq);
    setQuotation(initialQuotation);
    setQuotationError('');
    setQuotationSuccess(false);
    setDecisionMode('');
    setDecisionReason('');
    setDecisionError('');
    setDecisionNotice('');
  };

  const saveRFQDecision = async () => {
    if (!selected || !decisionMode || deciding) return;
    try {
      setDeciding(true);
      setDecisionError('');
      await decideRFQ(selected.id, decisionMode, decisionReason);
      setDecisionNotice(
        decisionMode === 'accepted'
          ? 'RFQ accepted. You can now submit a quotation.'
          : 'RFQ rejected.'
      );
      setDecisionMode('');
      setDecisionReason('');
    } catch (saveError) {
      console.error('RFQ decision failed:', saveError);
      setDecisionError(saveError.message || 'Unable to save the RFQ decision.');
    } finally {
      setDeciding(false);
    }
  };

  const submitQuotation = async (event) => {
    event.preventDefault();

    if (!selected || submitting || quotationSuccess) return;

    const price = Number(quotation.price);
    if (!Number.isFinite(price) || price <= 0) {
      setQuotationError('Enter a valid quotation price.');
      return;
    }

    if (quotation.priceUnit === 'other' && !quotation.priceUnitDetails.trim()) {
      setQuotationError('Specify the other price unit.');
      return;
    }

    try {
      setSubmitting(true);
      setQuotationError('');

      const quotationId = await createQuotation({
        rfqId: selected.id,
        offeredPrice: price,
        priceUnit: quotation.priceUnit,
        priceUnitDetails: quotation.priceUnitDetails,
        estimatedDelivery: `${quotation.deliveryDays} days`,
        deliveryDays: Number(quotation.deliveryDays),
        deliveryDate: quotation.deliveryDate,
        materialDetails: quotation.materialDetails,
        validityDate: quotation.validityDate,
        providerRemarks: quotation.providerRemarks,
        capacity: quotation.capacity,
        terms: quotation.terms,
      });

      console.log('Quotation successfully submitted:', quotationId);

      setQuotationSuccess(true);
      setSelected((current) => ({ ...current, hasQuotation: true }));

    } catch (submitError) {
      console.error('Quotation submission failed:', submitError);

      setQuotationError(
        submitError.message || 'Unable to submit quotation.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bookings-page">

      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">PROVIDER WORKSPACE</span>
          <h1>RFQ Inbox</h1>
          <p>Review manufacturing requests submitted for your machines.</p>
        </div>

        <Link to="/provider/dashboard" className="btn btn-secondary">
          <ArrowUpRight size={16} /> Dashboard
        </Link>
      </div>

      <section className="provider-panel booking-stat-row">
        <div>
          <span className="booking-stat-icon">
            <ClipboardList size={18} />
          </span>
          <span>
            <strong>{rfqs.length}</strong>
            <small>Total RFQs</small>
          </span>
        </div>

        <div>
          <span className="booking-stat-icon">
            <ClipboardList size={18} />
          </span>
          <span>
            <strong>
              {rfqs.filter((rfq) =>
                ['open', 'pending'].includes(rfq.status) ||
                (rfq.status === 'accepted' && rfq.providerDecision === 'accepted' &&
                  !submittedQuotations.some((item) => item.rfqId === rfq.id))
              ).length}
            </strong>
            <small>Open RFQs</small>
          </span>
        </div>
      </section>

      <section className="provider-panel booking-table-panel">

        <div className="panel-heading booking-heading">
          <div>
            <h2>Requests &amp; history</h2>
            <p>View details and submit quotations for incoming RFQs.</p>
          </div>

          <div className="filter-tabs" role="tablist" aria-label="RFQ filters">
            {['All requests', 'Pending', 'History'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={filter === tab ? 'active' : ''}
                onClick={() => setFilter(tab)}
                role="tab"
                aria-selected={filter === tab}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p>Loading RFQs...</p>
        ) : error ? (
          <div className="field-error" role="alert">{error}</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RFQ ID</th>
                  <th>RFQ title</th>
                  <th>Machine</th>
                  <th>Seeker company</th>
                  <th>Required date</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((rfq) => (
                  <tr key={rfq.id}>
                    <td className="table-id">{rfq.id}</td>
                    <td>{rfq.title}</td>
                    <td>{rfq.machineName || '—'}</td>
                    <td>
                      {rfq.seekerCompanyName ||
                        rfq.seekerName ||
                        'Not specified'}
                    </td>
                    <td>{formatDate(rfq.completionDate)}</td>
                    <td>
                      {rfq.quantity} {rfq.quantityUnit || ''}
                    </td>
                    <td>
                      <span className={`booking-status ${rfq.status === 'accepted' ? 'status-approved' : rfq.status === 'rejected' ? 'status-rejected' : 'status-pending'}`}>
                        {rfq.providerDecision || rfq.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-action view-action"
                        onClick={() => openRFQ(rfq)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="table-action view-action"
                        onClick={() => downloadRFQPdf(rfq)}
                        aria-label={`Download RFQ ${rfq.id}`}
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td className="table-empty" colSpan="8">
                      {rfqs.length ? 'No RFQs match this filter.' : 'No RFQs received yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <section
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rfq-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close RFQ details"
            >
              <X size={18} />
            </button>

            <span className="eyebrow-label">
              RFQ · {selected.id}
            </span>

            <h2 id="rfq-detail-title">{selected.title}</h2>

            <dl className="booking-detail-list">
              <div>
                <dt>Requested machine</dt>
                <dd>{selected.machineName || '—'}</dd>
              </div>

              <div>
                <dt>Machine category</dt>
                <dd>{selected.machineCategory || '—'}</dd>
              </div>

              <div>
                <dt>Seeker</dt>
                <dd>{selected.seekerName || 'Not specified'}</dd>
              </div>

              <div>
                <dt>Seeker company</dt>
                <dd>{selected.seekerCompanyName || 'Not specified'}</dd>
              </div>

              <div>
                <dt>Provider</dt>
                <dd>{providerProfile?.fullName || 'Not provided'}</dd>
              </div>

              <div>
                <dt>Provider company</dt>
                <dd>{providerProfile?.companyName || 'Not provided'}</dd>
              </div>

              <div>
                <dt>Machine ID</dt>
                <dd>{selected.machineId || 'Not provided'}</dd>
              </div>

              <div>
                <dt>Job description</dt>
                <dd>{selected.description || 'Not provided'}</dd>
              </div>

              <div>
                <dt>Material</dt>
                <dd>{selected.materialType || 'Not specified'}</dd>
              </div>

              <div>
                <dt>Quantity</dt>
                <dd>{selected.quantity} {selected.quantityUnit || ''}</dd>
              </div>

              <div>
                <dt>Required date</dt>
                <dd>{formatDate(selected.completionDate)}</dd>
              </div>

              <div>
                <dt>Location</dt>
                <dd>{selected.location || 'Not specified'}</dd>
              </div>

              <div>
                <dt>Budget</dt>
                <dd>
                  {selected.budget == null
                    ? 'Not provided'
                    : `₹${Number(selected.budget).toLocaleString('en-IN')}`}
                </dd>
              </div>

              <div>
                <dt>Created</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd>{selected.status}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => downloadRFQPdf({
                ...selected,
                providerName: providerProfile?.fullName || selected.providerName,
                providerCompanyName: providerProfile?.companyName || selected.providerCompanyName,
              })}
            >
              <Download size={15} /> Download RFQ
            </button>

            <hr />

            <h3>Provider decision</h3>
            <p>
              {selected.providerDecision === 'accepted'
                ? 'You accepted this request. The seeker can now review your quotation.'
                : selected.providerDecision === 'rejected'
                  ? 'You rejected this request.'
                  : 'Accept the request before submitting a quotation, or reject it if you cannot take the job.'}
            </p>
            {selected.providerRemarks && (
              <p><strong>Your remarks:</strong> {selected.providerRemarks}</p>
            )}
            {['open', 'pending'].includes(selected.status) && (
              decisionMode ? (
                <div className="provider-panel">
                  <label className="field-group seeker-field">
                    <span>{decisionMode === 'rejected' ? 'Rejection reason' : 'Remarks (optional)'}</span>
                    <textarea
                      value={decisionReason}
                      onChange={(event) => setDecisionReason(event.target.value)}
                      rows="3"
                      maxLength="1000"
                    />
                  </label>
                  {decisionError && <p className="field-error" role="alert">{decisionError}</p>}
                  <div className="seeker-form-footer">
                    <button type="button" className="btn btn-ghost" onClick={() => setDecisionMode('')} disabled={deciding}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={saveRFQDecision} disabled={deciding}>
                      {deciding ? 'Saving...' : 'Confirm decision'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="seeker-form-footer">
                  <button type="button" className="btn btn-primary" onClick={() => { setDecisionMode('accepted'); setDecisionError(''); }}>
                    <Check size={15} /> Accept RFQ
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => { setDecisionMode('rejected'); setDecisionError(''); }}>
                    <XCircle size={15} /> Reject RFQ
                  </button>
                </div>
              )
            )}
            {decisionNotice && <p className="seeker-success-message" role="status">{decisionNotice}</p>}
            {decisionError && !decisionMode && <p className="field-error" role="alert">{decisionError}</p>}

            <hr />

            <h3>Submit your quotation</h3>

            {quotationSuccess || selected.hasQuotation ? (
              <div className="seeker-success-message" role="status">
                <strong>
                  {quotationSuccess ? 'Quotation submitted successfully!' : 'Quotation already submitted'}
                </strong>
                <p>
                  {quotationSuccess
                    ? 'Your quotation was submitted and sent to the seeker.'
                    : 'A quotation for this RFQ is already saved. Duplicate submissions are not allowed.'}
                </p>
              </div>
            ) : selected.status !== 'accepted' || selected.providerDecision !== 'accepted' ? (
              <p>
                {selected.status === 'rejected'
                  ? 'This RFQ was rejected and cannot receive a quotation.'
                  : 'Accept this RFQ before submitting a quotation.'}
              </p>
            ) : (
              <form onSubmit={submitQuotation} className="seeker-rfq-form">

                <div className="seeker-form-grid">

                  <label className="field-group seeker-field">
                    <span>RFQ ID</span>
                    <input type="text" value={selected.id} readOnly />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Requirement title</span>
                    <input type="text" value={selected.title || ''} readOnly />
                  </label>

                  <label className="field-group seeker-field seeker-field-wide">
                    <span>Machine</span>
                    <input type="text" value={selected.machineName || ''} readOnly />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Machine ID</span>
                    <input type="text" value={selected.machineId || ''} readOnly />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Seeker name</span>
                    <input type="text" value={selected.seekerName || ''} readOnly />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Seeker company</span>
                    <input type="text" value={selected.seekerCompanyName || ''} readOnly />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Provider name</span>
                    <input type="text" value={providerProfile?.fullName || ''} readOnly />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Provider company</span>
                    <input type="text" value={providerProfile?.companyName || ''} readOnly />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Quotation Price (₹)</span>
                    <input
                      type="number"
                      name="price"
                      min="1"
                      step="0.01"
                      value={quotation.price}
                      onChange={updateQuotation}
                      placeholder="e.g. 85000"
                      required
                    />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Price Type</span>
                    <select
                      name="priceUnit"
                      value={quotation.priceUnit}
                      onChange={updateQuotation}
                    >
                      <option value="total">Total project price</option>
                      <option value="per-piece">Price per piece</option>
                      <option value="per-batch">Price per batch</option>
                      <option value="per-hour">Price per hour</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  {quotation.priceUnit === 'other' && (
                    <label className="field-group seeker-field">
                      <span>Other price unit</span>
                      <input
                        type="text"
                        name="priceUnitDetails"
                        value={quotation.priceUnitDetails}
                        onChange={updateQuotation}
                        required
                      />
                    </label>
                  )}

                  <label className="field-group seeker-field">
                    <span>Estimated delivery (days)</span>
                    <input
                      type="number"
                      name="deliveryDays"
                      min="1"
                      step="1"
                      value={quotation.deliveryDays}
                      onChange={updateQuotation}
                      placeholder="e.g. 15"
                      required
                    />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Delivery date</span>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={quotation.deliveryDate}
                      onChange={updateQuotation}
                      required
                    />
                  </label>

                  <label className="field-group seeker-field seeker-field-wide">
                    <span>Material and manufacturing details</span>
                    <textarea
                      name="materialDetails"
                      value={quotation.materialDetails}
                      onChange={updateQuotation}
                      rows="3"
                      placeholder="Explain your proposed manufacturing approach..."
                      required
                    />
                  </label>

                  <label className="field-group seeker-field seeker-field-wide">
                    <span>Additional terms and conditions</span>
                    <textarea
                      name="terms"
                      value={quotation.terms}
                      onChange={updateQuotation}
                      rows="3"
                      placeholder="Mention payment terms, material conditions, and other details..."
                    />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Quotation validity date</span>
                    <input
                      type="date"
                      name="validityDate"
                      value={quotation.validityDate}
                      onChange={updateQuotation}
                      required
                    />
                  </label>

                  <label className="field-group seeker-field seeker-field-wide">
                    <span>Provider remarks</span>
                    <textarea
                      name="providerRemarks"
                      value={quotation.providerRemarks}
                      onChange={updateQuotation}
                      rows="3"
                    />
                  </label>

                  <label className="field-group seeker-field">
                    <span>Available capacity (optional)</span>
                    <input
                      type="text"
                      name="capacity"
                      value={quotation.capacity}
                      onChange={updateQuotation}
                      placeholder="e.g. 500 pieces per week"
                    />
                  </label>

                </div>

                {quotationError && (
                  <div className="field-error" role="alert">
                    {quotationError}
                  </div>
                )}

                <div className="seeker-form-footer">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setSelected(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Send Quotation'}
                    <Send size={16} />
                  </button>
                </div>

              </form>
            )}

            {quotationSuccess && (
              <div className="seeker-form-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            )}

          </section>
        </div>
      )}

    </div>
  );
}

export default BookingRequests;
