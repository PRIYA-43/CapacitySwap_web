function SeekerStatCard({ icon: Icon, label, value, caption, index = 1 }) {
  return (
    <article className={`metric-card metric-card-${index}`}>
      <div className="metric-top">
        <span className="metric-icon"><Icon size={18} /></span>
      </div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-label">{label}</span>
      <span className="metric-caption">{caption}</span>
    </article>
  );
}

export default SeekerStatCard;
