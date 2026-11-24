function AdminStatCard({ icon: Icon, label, value, caption, index = 1 }) {
  return (
    <article className={`admin-stat-card admin-stat-card-${index}`}>
      <div className="admin-stat-top"><span className="admin-stat-icon"><Icon size={19} /></span><span className="admin-stat-caption">{caption}</span></div>
      <strong>{value}</strong>
      <span className="admin-stat-label">{label}</span>
    </article>
  );
}

export default AdminStatCard;
