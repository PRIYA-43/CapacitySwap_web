import { Eye } from 'lucide-react';

function BookingTable({ bookings, onStatusChange, onView }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Machine</th>
            <th>Buyer company</th>
            <th>Requested date</th>
            <th>Hours</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td className="table-id">{booking.id}</td>
              <td>{booking.machine}</td>
              <td>{booking.buyer}</td>
              <td><span className="table-date">{new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<small>{booking.time}</small></span></td>
              <td>{booking.hours} hrs</td>
              <td><span className={`booking-status status-${booking.status.toLowerCase()}`}>{booking.status}</span></td>
              <td>
                <div className="table-actions">
                  <button type="button" className="table-action view-action" onClick={() => onView(booking)} aria-label={`View ${booking.id}`}>
                    <Eye size={14} /> View
                  </button>
                  {booking.status === 'Pending' && (
                    <>
                      <button type="button" className="table-action approve-action" onClick={() => onStatusChange(booking.id, 'Approved')}>Approve</button>
                      <button type="button" className="table-action reject-action" onClick={() => onStatusChange(booking.id, 'Rejected')}>Reject</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr><td className="table-empty" colSpan="7">No booking requests match your filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BookingTable;
