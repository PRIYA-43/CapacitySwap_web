import { useEffect, useRef, useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import { markNotificationRead, subscribeToNotifications } from '../../services/notificationService';

function formatNotificationTime(value) {
  if (!value) return 'Recently';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString('en-IN');
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const dismissedIds = useRef(new Set());
  useEffect(() => subscribeToNotifications(
    (items) => setNotifications(items.filter((item) => !dismissedIds.current.has(item.id))),
    (loadError) => setError(loadError.message)
  ), []);

  const deleteNotification = (item) => {
    if (!window.confirm('Remove this notification from the current list? This change is not saved to your account.')) return;
    dismissedIds.current.add(item.id);
    setNotifications((current) => current.filter((notification) => notification.id !== item.id));
  };

  return <div className="seeker-page"><div className="dashboard-heading"><div><span className="eyebrow-label">WORKSPACE UPDATES</span><h1>Notifications</h1><p>Updates about RFQs, quotations, bookings, and jobs.</p></div></div>
    {error && <div className="field-error" role="alert">{error}</div>}
    {notifications.length ? <section className="notification-list">{notifications.map((item) => <article className={`provider-notification-row ${item.read ? 'is-read' : 'is-unread'}`} key={item.id}><span className="notification-icon"><Bell size={18}/></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{formatNotificationTime(item.createdAt)}</small></div><div className="provider-notification-actions"><button type="button" className="btn btn-ghost" disabled={item.read} onClick={() => markNotificationRead(item.id).catch((markError) => setError(markError.message))}>{item.read ? 'Read' : 'Mark read'}</button><button type="button" className="notification-delete-button" aria-label={`Delete notification: ${item.title || 'Notification'}`} title="Delete notification from this list" onClick={() => deleteNotification(item)}><Trash2 size={16}/></button></div></article>)}</section> : <section className="provider-panel seeker-empty-state"><Bell size={25}/><h2>No notifications yet.</h2><p>New notifications will appear here.</p></section>}
  </div>;
}
export default Notifications;
