
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bell, Search, Trash2 } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import StatusBadge from '../../components/admin/StatusBadge';
import { PageHeading } from './UserManagement';

function AdminNotifications() {
  const { data, loading, error } = useOutletContext();

  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('All notifications');
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [pendingDelete, setPendingDelete] = useState(null);

  const allNotifications = Array.isArray(data?.notifications)
    ? data.notifications
    : [];
  const notifications = allNotifications.filter(
    (notification) => !dismissedIds.has(notification.id)
  );

  const unreadCount = notifications.filter(
    (notification) => notification.read === false
  ).length;

  const readCount = notifications.filter(
    (notification) => notification.read === true
  ).length;

  const visibleNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesSearch =
        !term ||
        [
          notification.id,
          notification.title,
          notification.message,
          notification.type,
          notification.recipientUid,
          notification.bookingId,
          notification.trackingId,
          notification.rfqId,
        ].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      const matchesReadStatus =
        readFilter === 'All notifications' ||
        (readFilter === 'Unread' && notification.read === false) ||
        (readFilter === 'Read' && notification.read === true);

      return matchesSearch && matchesReadStatus;
    });
  }, [notifications, search, readFilter]);

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => row.title || 'Notification',
    },
    {
      key: 'message',
      label: 'Message',
      render: (row) => row.message || '—',
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => row.type || '—',
    },
    {
      key: 'recipientUid',
      label: 'Recipient UID',
      render: (row) => row.recipientUid || '—',
    },
    {
      key: 'bookingId',
      label: 'Booking ID',
      render: (row) => row.bookingId || '—',
    },
    {
      key: 'rfqId',
      label: 'RFQ ID',
      render: (row) => row.rfqId || '—',
    },
    {
      key: 'read',
      label: 'Read Status',
      render: (row) => (
        <StatusBadge status={row.read ? 'Read' : 'Unread'} />
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <button
          type="button"
          className="notification-delete-button"
          aria-label={`Delete notification: ${row.title || 'Notification'}`}
          title="Delete notification from this list"
          onClick={() => setPendingDelete(row)}
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setDismissedIds((current) => new Set(current).add(pendingDelete.id));
    setPendingDelete(null);
  };

  return (
    <div className="admin-page">
      <PageHeading
        eyebrow="ADMIN ACTIVITY"
        title="Notifications"
        subtitle="Review platform events and updates generated for marketplace users."
      />

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {loading && <p>Loading notification records...</p>}

      <section className="admin-stat-grid" aria-label="Notification statistics">
        <div className="admin-panel">
          <span>Total notifications</span>
          <h2>{notifications.length}</h2>
        </div>

        <div className="admin-panel">
          <span>Unread notifications</span>
          <h2>{unreadCount}</h2>
        </div>

        <div className="admin-panel">
          <span>Read notifications</span>
          <h2>{readCount}</h2>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <Search size={16} />
            <span className="sr-only">Search notifications</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, message, recipient, booking, or RFQ"
            />
          </label>

          <label className="admin-filter">
            <span>Read status</span>
            <select
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value)}
            >
              <option>All notifications</option>
              <option>Unread</option>
              <option>Read</option>
            </select>
          </label>
        </div>

        {notifications.length === 0 && !loading ? (
          <div className="admin-empty-state">
            <Bell size={24} />
            <h2>No notification records found.</h2>
            <p>
              Notifications from seekers and providers will appear here
              when available.
            </p>
          </div>
        ) : (
          <AdminDataTable
            columns={columns}
            rows={visibleNotifications}
            pageSize={10}
          />
        )}
      </section>
      {pendingDelete && (
        <ConfirmationModal
          title="Remove this notification?"
          message="It will be removed from this list in the current view only. This change is not saved to your account."
          confirmLabel="Remove notification"
          tone="danger"
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
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

  return date.toLocaleString('en-IN');
}

export default AdminNotifications;
