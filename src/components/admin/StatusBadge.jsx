function StatusBadge({ status }) {
  const tone = toneFor(status);
  return <span className={`admin-status-badge admin-status-${tone}`}>{status}</span>;
}

function toneFor(status = '') {
  const value = status.toLowerCase();
  if (['active', 'approved', 'verified', 'confirmed', 'completed', 'resolved', 'accepted'].some((part) => value.includes(part))) return 'success';
  if (['pending', 'open', 'review', 'progress', 'received'].some((part) => value.includes(part))) return 'warning';
  if (['suspend', 'reject', 'cancel', 'closed', 'flagged', 'high'].some((part) => value.includes(part))) return 'danger';
  return 'neutral';
}

export default StatusBadge;
