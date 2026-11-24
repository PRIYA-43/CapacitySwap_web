import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, SlidersHorizontal, Wrench, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import MachineCard from '../../components/common/MachineCard';
import {
  getMyMachines,
  deleteMachine,
  getMachineAvailabilityStatus,
  subscribeToMyMachines,
  updateMachineAvailability,
} from '../../services/machineService';

function MyMachines() {
  const [machines, setMachines] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [availability, setAvailability] = useState('All availability');
  const [selectedMachine, setSelectedMachine] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState(null);

  // Load machines from Firestore.
  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getMyMachines();
      setMachines(result);
    } catch (err) {
      console.error('Error loading machines:', err);
      setError(err.message || 'Unable to load machines.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe;
    try {
      unsubscribe = subscribeToMyMachines((items) => {
        if (!active) return;
        setMachines(items);
        setLoading(false);
        setError('');
      }, (subscriptionError) => {
        console.error('Machine subscription error:', subscriptionError);
        if (!active) return;
        setError(subscriptionError.message || 'Unable to load machines.');
        setLoading(false);
      });
    } catch (subscriptionError) {
      console.error('Machine subscription error:', subscriptionError);
      setError(subscriptionError.message || 'Unable to load machines.');
      setLoading(false);
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [loadMachines]);

  useEffect(() => {
    setSelectedMachine((current) =>
      current ? machines.find((machine) => machine.id === current.id) || current : null
    );
  }, [machines]);

  // Build category filter options dynamically.
  const categories = useMemo(
    () => [
      'All categories',
      ...new Set(
        machines.map((machine) => machine.category).filter(Boolean)
      ),
    ],
    [machines]
  );

  // Search and filter real Firestore records.
  const filteredMachines = useMemo(() => {
    return machines.filter((machine) => {
      const term = search.trim().toLowerCase();

      const searchableFields = [
        machine.name,
        machine.category,
        machine.manufacturer,
        machine.model,
        machine.location,
        ...(Array.isArray(machine.materials) ? machine.materials : []),
      ];

      const matchesText =
        !term ||
        searchableFields.some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      const matchesCategory =
        category === 'All categories' || machine.category === category;

      const matchesAvailability =
        availability === 'All availability' ||
        getMachineAvailabilityStatus(machine) === availability.toLowerCase();

      return matchesText && matchesCategory && matchesAvailability;
    });
  }, [machines, search, category, availability]);

  const handleAvailabilityChange = async (machine) => {
    const nextStatus = getMachineAvailabilityStatus(machine) === 'available'
      ? 'unavailable'
      : 'available';
    try {
      setUpdatingAvailabilityId(machine.id);
      setError('');
      await updateMachineAvailability(machine.id, nextStatus);
      setMachines((current) => current.map((item) =>
        item.id === machine.id ? { ...item, availabilityStatus: nextStatus } : item
      ));
    } catch (updateError) {
      console.error('Machine availability update failed:', updateError);
      setError(updateError.message || 'Unable to update machine availability.');
    } finally {
      setUpdatingAvailabilityId(null);
    }
  };

  // Delete machine from Firestore.
  const handleDelete = async (machine) => {
    const accepted = window.confirm(
      `Are you sure you want to delete "${machine.name}"? This cannot be undone.`
    );

    if (!accepted) return;

    try {
      setDeletingId(machine.id);
      setError('');

      await deleteMachine(machine.id);

      setMachines((current) =>
        current.filter((item) => item.id !== machine.id)
      );

      if (selectedMachine?.id === machine.id) {
        setSelectedMachine(null);
      }
    } catch (err) {
      console.error('Error deleting machine:', err);
      setError(err.message || 'Unable to delete machine.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="machines-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">PROVIDER WORKSPACE</span>
          <h1>My Machines</h1>
          <p>Manage your listed machines and their current availability.</p>
        </div>

        <Link to="/provider/machines/add" className="btn btn-primary">
          <Plus size={17} />
          Add New Machine
        </Link>
      </div>

      {/* Search and filters */}
      <section className="provider-panel machine-toolbar">
        <div className="machine-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search machines, model, or location"
            aria-label="Search machines"
          />
        </div>

        <label className="filter-control">
          <SlidersHorizontal size={15} />
          <span className="sr-only">Filter by category</span>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-control">
          <span className="sr-only">Filter by availability</span>

          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            aria-label="Filter by availability"
          >
            <option>All availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </label>
      </section>

      {/* Listing count */}
      <div className="listing-summary">
        <span>
          <Wrench size={15} />
          Showing <strong>{filteredMachines.length}</strong> of{' '}
          {machines.length} machines
        </span>

        <span>Your listings</span>
      </div>

      {/* Error state */}
      {error && (
        <div className="field-error machine-submit-error">
          {error}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={loadMachines}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="empty-state">
          <Wrench size={26} />
          <h2>Loading your machines...</h2>
          <p>Please wait while we retrieve your listings.</p>
        </div>
      ) : filteredMachines.length > 0 ? (
        <div className="machine-grid">
          {filteredMachines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onDelete={handleDelete}
              onView={setSelectedMachine}
              onToggleAvailability={handleAvailabilityChange}
              availabilityUpdating={updatingAvailabilityId === machine.id}
              deleting={deletingId === machine.id}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Wrench size={26} />

          <h2>
            {machines.length === 0
              ? 'No machines listed yet'
              : 'No machines found'}
          </h2>

          <p>
            {machines.length === 0
              ? 'Add your first machine to make it available on CapacitySwap.'
              : 'Try adjusting your search or filters.'}
          </p>

          {machines.length === 0 && (
            <Link to="/provider/machines/add" className="btn btn-primary">
              <Plus size={16} />
              Add a machine
            </Link>
          )}
        </div>
      )}

      {/* Machine detail modal */}
      {selectedMachine && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedMachine(null)}
        >
          <section
            className="booking-modal machine-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="machine-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button modal-close"
              onClick={() => setSelectedMachine(null)}
              aria-label="Close machine details"
            >
              <X size={18} />
            </button>

            <img
              src={
                selectedMachine.image ||
                'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80'
              }
              alt={selectedMachine.name}
            />

            <span className="eyebrow-label">
              {selectedMachine.category}
            </span>

            <h2 id="machine-detail-title">
              {selectedMachine.name}
            </h2>

            <p>
              {selectedMachine.description ||
                `${selectedMachine.manufacturer || 'Equipment'} ${
                  selectedMachine.model || ''
                }`}
            </p>

            <dl className="booking-detail-list">
              <div>
                <dt>Manufacturer</dt>
                <dd>{selectedMachine.manufacturer || '—'}</dd>
              </div>

              <div>
                <dt>Model</dt>
                <dd>{selectedMachine.model || '—'}</dd>
              </div>

              <div>
                <dt>Location</dt>
                <dd>{selectedMachine.location || '—'}</dd>
              </div>

              <div>
                <dt>Available hours</dt>
                <dd>{selectedMachine.hours ?? 0} hrs</dd>
              </div>

              <div>
                <dt>Hourly rate</dt>
                <dd>
                  ₹
                  {Number(selectedMachine.rate || 0).toLocaleString(
                    'en-IN'
                  )}
                  /hr
                </dd>
              </div>

              <div>
                <dt>Availability</dt>
                <dd>{getMachineAvailabilityStatus(selectedMachine)}</dd>
              </div>

              <div>
                <dt>Materials</dt>
                <dd>
                  {Array.isArray(selectedMachine.materials)
                    ? selectedMachine.materials.join(', ')
                    : selectedMachine.materials || '—'}
                </dd>
              </div>

              <div>
                <dt>Schedule</dt>
                <dd>
                  {Array.isArray(selectedMachine.schedule)
                    ? selectedMachine.schedule.join(', ')
                    : '—'}
                </dd>
              </div>
            </dl>

            <Link
              to={`/provider/machines/add?id=${encodeURIComponent(
                selectedMachine.id
              )}`}
              className="btn btn-primary detail-edit-button"
            >
              Edit machine
            </Link>
            <button
              type="button"
              className="btn btn-ghost detail-edit-button"
              onClick={() => handleAvailabilityChange(selectedMachine)}
              disabled={updatingAvailabilityId === selectedMachine.id}
            >
              {updatingAvailabilityId === selectedMachine.id
                ? 'Updating availability...'
                : `Mark ${getMachineAvailabilityStatus(selectedMachine) === 'available' ? 'unavailable' : 'available'}`}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default MyMachines;