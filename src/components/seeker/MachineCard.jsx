import { ArrowUpRight, Clock3, MapPin, Send, Star } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import { getMachineAvailabilityStatus } from '../../services/machineService';

function MachineCard({ machine, compact = false }) {
  const { profile } = useOutletContext();
  const fallbackImage =
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80';
  const availability = getMachineAvailabilityStatus(machine);
  const available = availability === 'available';
  const rate = Number(machine.rate || 0);

  return (
    <article className={`machine-card seeker-machine-card ${compact ? 'seeker-machine-compact' : ''}`}>
      <div className="machine-card-image">
        <img src={machine.image || fallbackImage} alt={machine.name} loading="lazy" />
        <span className={`machine-status status-${availability}`}>{availability}</span>
      </div>
      <div className="machine-card-body">
        <div className="machine-card-heading">
          <div>
            <span className="machine-category">{machine.category}</span>
            <h3>{machine.name}</h3>
          </div>
          <span className="machine-rate">₹{rate.toLocaleString('en-IN')}<small>/hr</small></span>
        </div>
        <div className="machine-meta">
          <span><strong className="machine-provider-rating"><Star size={13} fill="currentColor" /> {machine.providerRating || 'Not rated'}</strong>{machine.providerCompanyName || machine.providerName || 'Provider details unavailable'}</span>
          <span><MapPin size={14} />{machine.location}</span>
          <span><Clock3 size={14} />{machine.hours} hours available</span>
        </div>
        <div className="machine-actions">
          <Link className="btn btn-ghost seeker-card-button" to={`/seeker/machines/${machine.id}`}>
            View Details <ArrowUpRight size={15} />
          </Link>
          {available && profile?.capabilities?.includes('seeker') && machine.ownerUid !== profile.uid && (
            <Link className="btn btn-primary seeker-card-button" to={`/seeker/rfqs/create?machineId=${encodeURIComponent(machine.id)}`}>
              Send Enquiry <Send size={14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default MachineCard;
