
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  Send,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Link, useOutletContext, useParams } from 'react-router-dom';

import {
  isMachineAvailable,
  subscribeToMachine,
} from '../../services/machineService';
import MachineReviewsPanel from '../../components/machineReviews/MachineReviewsPanel';


function MachineDetails() {
  const { machineId } = useParams();
  const { profile } = useOutletContext();

  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImage, setActiveImage] = useState(0);

  // Load actual machine details from Firestore.
  useEffect(() => {
    let active = true;

    let unsubscribe;
    try {
      setLoading(true);
      setError('');
      unsubscribe = subscribeToMachine(machineId, (result) => {
        if (!active) return;
        setMachine(result);
        setActiveImage(0);
        setLoading(false);
      }, (subscriptionError) => {
        console.error('Machine subscription error:', subscriptionError);
        if (!active) return;
        setError(subscriptionError.message || 'Unable to load machine details.');
        setLoading(false);
      });
    } catch (subscriptionError) {
      console.error('Machine subscription error:', subscriptionError);
      setError(subscriptionError.message || 'Unable to load machine details.');
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [machineId]);

  if (loading) {
    return (
      <div className="provider-panel seeker-empty-state">
        <h2>Loading machine details...</h2>
        <p>Please wait while we retrieve the machine from Firestore.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="provider-panel seeker-empty-state">
        <h2>Unable to load machine</h2>
        <p>{error}</p>
        <Link className="btn btn-primary" to="/seeker/machines">
          Back to machines
        </Link>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="provider-panel seeker-empty-state">
        <h2>Machine not found</h2>
        <p>This machine may have been removed or is no longer available.</p>
        <Link className="btn btn-primary" to="/seeker/machines">
          Browse machines
        </Link>
      </div>
    );
  }

  const images = Array.isArray(machine.images) && machine.images.length
    ? machine.images
    : machine.image
      ? [machine.image]
      : [];

  const materials = Array.isArray(machine.materials)
    ? machine.materials
    : machine.materials
      ? [machine.materials]
      : [];

  const schedule = Array.isArray(machine.schedule)
    ? machine.schedule
    : [];
  const machineAvailable = isMachineAvailable(machine);

  return (
    <div className="seeker-page">

      <Link to="/seeker/machines" className="seeker-back-link">
        <ArrowLeft size={16} />
        Back to machines
      </Link>

      <div className="seeker-machine-detail-layout">

        <div className="seeker-machine-detail-main">

          {/* MACHINE IMAGES */}
          <section className="provider-panel seeker-machine-gallery">
            {images.length > 0 ? (
              <>
                <img
                  className="seeker-gallery-main"
                  src={images[activeImage] || images[0]}
                  alt={machine.name}
                />

                {images.length > 1 && (
                  <div className="seeker-gallery-thumbs">
                    {images.map((image, index) => (
                      <button
                        key={`${index}-${image.slice(0, 30)}`}
                        type="button"
                        className={index === activeImage ? 'active' : ''}
                        onClick={() => setActiveImage(index)}
                      >
                        <img
                          src={image}
                          alt={`${machine.name} view ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="seeker-empty-state">
                <Wrench size={32} />
                <p>No machine image uploaded.</p>
              </div>
            )}
          </section>

          {/* MACHINE INFORMATION */}
          <section className="provider-panel seeker-detail-panel">
            <span className="machine-category">
              {machine.category || 'Machine'}
            </span>

            <h1 className="seeker-detail-title">
              {machine.name}
            </h1>

            <p className="seeker-detail-description">
              {machine.description || 'No description provided.'}
            </p>

            <div className="seeker-detail-facts">
              <span>
                <Wrench size={16} />
                {machine.manufacturer || 'Manufacturer not specified'}
                {' · '}
                {machine.model || 'Model not specified'}
              </span>

              <span>
                <MapPin size={16} />
                {machine.location || 'Location not specified'}
              </span>

              <span>
                <Clock3 size={16} />
                {machine.hours ?? 0} hours available
              </span>
            </div>
          </section>

          {/* TECHNICAL SPECIFICATIONS */}
          <section className="provider-panel seeker-detail-panel">
            <div className="panel-heading">
              <div>
                <h2>Technical specifications</h2>
                <p>Machine information provided by the manufacturer or provider.</p>
              </div>
            </div>

            <dl className="seeker-spec-list">
              <dt>Machine category</dt>
              <dd>{machine.category || '—'}</dd>

              <dt>Manufacturer</dt>
              <dd>{machine.manufacturer || '—'}</dd>

              <dt>Model</dt>
              <dd>{machine.model || '—'}</dd>

              <dt>Machine description</dt>
              <dd>{machine.description || 'Not provided'}</dd>

              <dt>Supported materials</dt>
              <dd>
                {materials.length ? (
                  <div className="seeker-chip-list">
                    {materials.map((material) => (
                      <span className="seeker-chip" key={material}>
                        {material}
                      </span>
                    ))}
                  </div>
                ) : (
                  'Not provided'
                )}
              </dd>
            </dl>
          </section>

          {/* AVAILABILITY */}
          <section className="provider-panel seeker-detail-panel">
            <div className="panel-heading">
              <div>
                <h2>Availability schedule</h2>
                <p>Working days provided in the machine listing.</p>
              </div>
            </div>

            {schedule.length ? (
              <div className="seeker-schedule">
                {schedule.map((day) => (
                  <span key={day}>
                    <CalendarDays size={15} />
                    {day}
                  </span>
                ))}
              </div>
            ) : (
              <p>Availability schedule not provided.</p>
            )}
          </section>

          <MachineReviewsPanel
            machineId={machine.id}
            machineName={machine.name}
            providerUid={machine.ownerUid}
            providerCompanyId={machine.companyId}
          />

        </div>

        {/* BOOKING SIDEBAR */}
        <aside className="provider-panel seeker-booking-panel">

          <span className={`machine-status status-${machineAvailable ? 'available' : 'unavailable'}`}>
            {machineAvailable ? 'available' : 'unavailable'}
          </span>

          <div className="seeker-booking-price">
            ₹{Number(machine.rate || 0).toLocaleString('en-IN')}
            <small> per hour</small>
          </div>

          <div className="seeker-booking-summary">
            <span>
              <Clock3 size={15} />
              {machine.hours ?? 0} available hours
            </span>

            <span>
              <MapPin size={15} />
              {machine.location || 'Location not specified'}
            </span>

            <span>
              <UserRound size={15} />
              {machine.providerName || 'Provider name unavailable'}
            </span>

            <span>
              <Building2 size={15} />
              {machine.providerCompanyName || 'Provider company unavailable'}
            </span>
          </div>

          {!machineAvailable && (
            <p className="field-error" role="status">
              This machine is currently unavailable for new enquiries.
            </p>
          )}

          {machineAvailable && profile?.capabilities?.includes('seeker') && machine.ownerUid !== profile.uid && (
            <Link
              className="btn btn-primary seeker-full-button"
              to={`/seeker/rfqs/create?machineId=${encodeURIComponent(machine.id)}`}
            >
              Send Enquiry
              <Send size={15} />
            </Link>
          )}

        </aside>
      </div>


    </div>
  );
}

export default MachineDetails;