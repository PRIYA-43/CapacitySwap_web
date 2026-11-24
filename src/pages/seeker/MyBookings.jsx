// src/pages/seeker/MyBookings.jsx
// If your actual path differs, keep your existing filename/location.

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { subscribeToSeekerBookings } from '../../services/bookingService';

function formatDate(value) {
  if (!value) return '—';

  let date;

  if (typeof value?.toDate === 'function') {
    date = value.toDate();
  } else if (typeof value === 'string') {
    date = new Date(`${value.slice(0, 10)}T00:00:00`);
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN');
}

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    let unsubscribe;

    try {
      unsubscribe = subscribeToSeekerBookings(
        (items) => {
          if (!active) return;

          setBookings(items);
          setLoading(false);
          setError('');
        },
        (loadError) => {
          if (!active) return;

          setError(loadError?.message || 'Unable to load bookings.');
          setLoading(false);
        }
      );
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load bookings.');
      setLoading(false);
    }

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <div className="seeker-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">CAPACITY REQUESTS</span>
          <h1>My bookings</h1>
          <p>Confirmed manufacturing capacity requests.</p>
        </div>
      </div>

      {error && (
        <div className="field-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="provider-panel seeker-empty-state">
          <p>Loading bookings...</p>
        </div>
      ) : bookings.length ? (
        <div className="booking-card-grid">
          {bookings.map((booking) => (
            <section className="booking-card" key={booking.id}>
              <div className="booking-card-heading">
                <div>
                  <span className="booking-id">{booking.bookingId || booking.id}</span>
                  <h2>{booking.rfqTitle || booking.rfqId || 'Booking'}</h2>
                </div>
                <span className="booking-status status-approved">{booking.status || 'confirmed'}</span>
              </div>

              <dl className="booking-card-details">
                <div>
                  <dt>RFQ</dt>
                  <dd>{booking.rfqId || '—'}</dd>
                </div>

                <div>
                  <dt>Quotation</dt>
                  <dd>{booking.quotationId || '—'}</dd>
                </div>

                <div>
                  <dt>Machine</dt>
                  <dd>{booking.machineName || '—'}</dd>
                </div>

                <div>
                  <dt>Price</dt>
                  <dd>
                    ₹
                    {Number(booking.offeredPrice ?? booking.price ?? 0)
                      .toLocaleString('en-IN')}
                    {' / '}
                    {booking.priceUnit || 'total'}
                    {booking.priceUnitDetails
                      ? ` (${booking.priceUnitDetails})`
                      : ''}
                  </dd>
                </div>

                <div>
                  <dt>Delivery</dt>
                  <dd>
                    {formatDate(booking.deliveryDate)}
                    {' ('}
                    {booking.deliveryDays || '—'} days
                    {')'}
                  </dd>
                </div>

                <div>
                  <dt>Status</dt>
                  <dd>{booking.status || 'confirmed'}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      ) : (
        <section className="provider-panel seeker-empty-state">
          <CalendarDays size={25} />
          <h2>No bookings yet.</h2>
          <p>Your bookings will appear after you accept a quotation.</p>
        </section>
      )}
    </div>
  );
}

export default MyBookings;