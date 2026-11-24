import { useEffect, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { subscribeToProviderBookings } from '../../services/bookingService';

function formatDate(value) {
  if (!value) return '—';
  const date = value.toDate ? value.toDate() : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN');
}

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => subscribeToProviderBookings(
    (items) => { setBookings(items); setLoading(false); setError(''); },
    (loadError) => { setError(loadError.message); setLoading(false); }
  ), []);

  return (
    <div className="provider-page">
      <div className="dashboard-heading">
        <div><span className="eyebrow-label">CONFIRMED WORK</span><h1>Bookings</h1><p>Confirmed bookings created from accepted quotations.</p></div>
      </div>
      {error && <div className="field-error" role="alert">{error}</div>}
      {loading ? <p>Loading bookings...</p> : bookings.length ? (
        <section className="booking-card-grid" aria-label="Confirmed bookings">
          {bookings.map((booking) => (
            <article className="booking-card" key={booking.id}>
              <div className="booking-card-heading">
                <div>
                  <span className="booking-id">{booking.bookingId || booking.id}</span>
                  <h2>{booking.rfqTitle || booking.rfqId || 'Booking'}</h2>
                </div>
                <span className="booking-status status-approved">{booking.status || 'confirmed'}</span>
              </div>
              <dl className="booking-card-details">
                <div><dt>RFQ</dt><dd>{booking.rfqId || '—'}</dd></div>
                <div><dt>Quotation</dt><dd>{booking.quotationId || '—'}</dd></div>
                <div><dt>Machine</dt><dd>{booking.machineName || '—'}</dd></div>
                <div><dt>Seeker</dt><dd>{booking.seekerCompanyName || booking.seekerCompanyId || 'Seeker'}</dd></div>
                <div><dt>Price</dt><dd>₹{Number(booking.offeredPrice || 0).toLocaleString('en-IN')} / {booking.priceUnit || 'total'}</dd></div>
                <div><dt>Delivery</dt><dd>{formatDate(booking.deliveryDate)} ({booking.deliveryDays || '—'} days)</dd></div>
              </dl>
              <button className="btn btn-ghost booking-card-action" type="button" onClick={() => setSelected(booking)}>View booking</button>
            </article>
          ))}
        </section>
      ) : <section className="provider-panel seeker-empty-state"><CalendarDays size={25} /><h2>No confirmed bookings yet.</h2><p>Bookings appear after a seeker accepts your quotation.</p></section>}
      {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="booking-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="icon-button modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button>
        <span className="eyebrow-label">BOOKING · {selected.bookingId}</span><h2>{selected.rfqTitle || selected.rfqId}</h2>
        <dl className="booking-detail-list"><div><dt>RFQ</dt><dd>{selected.rfqId}</dd></div><div><dt>Quotation</dt><dd>{selected.quotationId}</dd></div><div><dt>Machine</dt><dd>{selected.machineName}</dd></div><div><dt>Price</dt><dd>₹{Number(selected.offeredPrice || 0).toLocaleString('en-IN')} / {selected.priceUnit}</dd></div><div><dt>Delivery date</dt><dd>{formatDate(selected.deliveryDate)}</dd></div><div><dt>Terms</dt><dd>{selected.terms || '—'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl>
      </section></div>}
    </div>
  );
}
