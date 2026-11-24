import { MapPin, Pencil, Power, Timer, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function MachineCard({
  machine,
  onDelete,
  onView,
  onToggleAvailability,
  availabilityUpdating = false,
  deleting = false,
  compact = false,
}) {
  const fallbackImage =
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80';
  const availability = machine.availabilityStatus === 'unavailable'
    ? 'unavailable'
    : 'available';

  return (
    <article className={`machine-card ${compact ? 'machine-card-compact' : ''}`}>
      <div className="machine-card-image">
        <img src={machine.image || fallbackImage} alt={machine.name} />
        <span className={`machine-status status-${availability}`}>
          {availability}
        </span>
      </div>
      <div className="machine-card-body">
        <div className="machine-card-heading">
          <div>
            <span className="machine-category">{machine.category}</span>
            <h3>{machine.name}</h3>
          </div>
          <span className="machine-rate">₹{Number(machine.rate).toLocaleString('en-IN')}<small>/hr</small></span>
        </div>
        <div className="machine-meta">
          <span><MapPin size={14} /> {machine.location}</span>
          <span><Timer size={14} /> {machine.hours} available hours</span>
        </div>
        <div className="machine-actions">
          <Link to={`/provider/machines/add?id=${encodeURIComponent(machine.id)}`} className="btn btn-ghost machine-button">
            <Pencil size={15} /> Edit
          </Link>
          {onView
            ? <button type="button" className="btn btn-secondary machine-button" onClick={() => onView(machine)}>View machine</button>
            : <Link to="/provider/machines" className="btn btn-secondary machine-button">View machine</Link>}
          {onToggleAvailability && (
            <button
              type="button"
              className="btn btn-ghost machine-button"
              onClick={() => onToggleAvailability(machine)}
              disabled={availabilityUpdating}
            >
              <Power size={15} />
              {availabilityUpdating
                ? 'Updating...'
                : `Mark ${availability === 'available' ? 'unavailable' : 'available'}`}
            </button>
          )}
          {onDelete && (
            <button type="button" className="icon-button danger-icon" onClick={() => onDelete(machine)} aria-label={`Delete ${machine.name}`} disabled={deleting}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default MachineCard;
