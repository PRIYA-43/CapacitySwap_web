
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CalendarDays, Search } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { PageHeading } from './UserManagement';

function BookingManagement() {
  const { data, loading, error } = useOutletContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');

  const bookings = Array.isArray(data?.bookings) ? data.bookings : [];

  const statuses = useMemo(() => {
    return [
      'All statuses',
      ...new Set(
        bookings
          .map((booking) => booking.status || booking.currentStatus)
          .filter(Boolean)
      ),
    ];
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        !term ||
        [
          booking.id,
          booking.bookingId,
          booking.rfqTitle,
          booking.rfqId,
          booking.machineName,
          booking.seekerName,
          booking.seekerCompanyName,
          booking.providerName,
          booking.providerCompanyName,
        ].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      const bookingStatus = booking.status || booking.currentStatus || '';

      const matchesStatus =
        statusFilter === 'All statuses' ||
          bookingStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, statusFilter]);

  const columns = [
    {
      key: 'bookingId',
      label: 'Booking ID',
      render: (row) => row.bookingId || row.id || '—',
    },
    {
      key: 'rfqTitle',
      label: 'RFQ / Requirement',
      render: (row) => row.rfqTitle || row.rfqId || '—',
    },
    {
      key: 'machineName',
      label: 'Machine',
      render: (row) => row.machineName || '—',
    },
    {
      key: 'seekerCompanyName',
      label: 'Seeker',
      render: (row) =>
        row.seekerCompanyName || row.seekerName || '—',
    },
    {
      key: 'providerCompanyName',
      label: 'Provider',
      render: (row) =>
        row.providerCompanyName || row.providerName || '—',
    },
    {
      key: 'offeredPrice',
      label: 'Price',
      render: (row) =>
        formatPrice(row.offeredPrice ?? row.price),
      sortValue: (row) => Number(row.offeredPrice ?? row.price ?? 0),
    },
    {
      key: 'deliveryDate',
      label: 'Delivery',
      render: (row) =>
        formatDate(row.deliveryDate || row.estimatedDelivery),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge status={row.status || row.currentStatus || 'Unknown'} />
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
    <div className="admin-page">
      <PageHeading
        eyebrow="MARKETPLACE OPERATIONS"
        title="Booking management"
        subtitle="Monitor marketplace bookings and investigate operational history."
      />

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Loading booking records...</p>}

      <section className="admin-stat-grid" aria-label="Booking statistics">
        <div className="admin-panel">
          <span>Total bookings</span>
          <h2>{bookings.length}</h2>
        </div>

        <div className="admin-panel">
          <span>Active bookings</span>
          <h2>
            {
              bookings.filter((booking) =>
                !['completed', 'cancelled', 'canceled', 'rejected'].includes(
                  String(booking.status || booking.currentStatus || '')
                    .toLowerCase()
                )
              ).length
            }
          </h2>
        </div>

        <div className="admin-panel">
          <span>Completed bookings</span>
          <h2>
            {
              bookings.filter((booking) =>
                String(booking.status || booking.currentStatus || '')
                  .toLowerCase()
                  .includes('completed')
              ).length
            }
          </h2>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <span className="sr-only">Search bookings</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search booking, RFQ, machine, seeker, or provider"
            />
          </label>

          <label className="admin-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        {bookings.length === 0 && !loading ? (
          <div className="admin-empty-state">
            <CalendarDays size={24} />
            <h2>No bookings found in Firestore.</h2>
            <p>
              Booking records will appear here when available.
            </p>
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            rows={visibleBookings}
            pageSize={8}
          />
        )}
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '—';

  const date = value?.toDate
    ? value.toDate()
    : typeof value === 'string' || typeof value === 'number'
      ? new Date(value)
      : null;

  if (!date || Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN');
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '—';

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return `₹${amount.toLocaleString('en-IN')}`;
}

export default BookingManagement;
