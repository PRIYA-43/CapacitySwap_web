
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Eye, PauseCircle } from 'lucide-react';
import AdminDataTable from '../../components/admin/AdminDataTable';
import ConfirmationModal from '../../components/admin/ConfirmationModal';
import StatusBadge from '../../components/admin/StatusBadge';
import { updateMachineReviewStatus } from '../../services/adminService';
import { AdminModal, PageHeading } from './UserManagement';

function MachineManagement() {
  const { data, loading, error: dataError } = useOutletContext();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [provider, setProvider] = useState('All providers');
  const [status, setStatus] = useState('All listing statuses');
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null);
  const [actionError, setActionError] = useState('');

  const providers = [
    ...new Set(data.machines.map((machine) => machine.provider).filter(Boolean)),
  ];

  const categories = [
    ...new Set(data.machines.map((machine) => machine.category).filter(Boolean)),
  ];

  const visible = useMemo(
    () =>
      data.machines.filter((machine) => {
        const term = search.trim().toLowerCase();

        const matchesText =
          !term ||
          [
            machine.id,
            machine.name,
            machine.provider,
            machine.location,
          ].some((value) =>
            String(value || '').toLowerCase().includes(term)
          );

        return (
          matchesText &&
          (category === 'All categories' || machine.category === category) &&
          (provider === 'All providers' || machine.provider === provider) &&
          (status === 'All listing statuses' || machine.status === status)
        );
      }),
    [data.machines, search, category, provider, status]
  );

  const applyAction = async () => {
    if (!pending) return;

    try {
      setActionError('');

      await updateMachineReviewStatus(pending.id, pending.nextStatus);

      setPending(null);
    } catch (error) {
      console.error('Machine status update failed:', error);
      setActionError(
        error.message || 'Unable to update machine status.'
      );
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Machine ID',
      render: (machine) => machine.id.toUpperCase(),
    },
    {
      key: 'name',
      label: 'Machine Name',
    },
    {
      key: 'category',
      label: 'Category',
    },
    {
      key: 'provider',
      label: 'Provider Company',
    },
    {
      key: 'location',
      label: 'Location',
    },
    {
      key: 'rate',
      label: 'Hourly Rate',
      render: (machine) =>
        `₹${Number(machine.rate || 0).toLocaleString('en-IN')}/hr`,
      sortValue: (machine) => machine.rate,
    },
    {
      key: 'availability',
      label: 'Availability',
      render: (machine) => (
        <StatusBadge status={machine.availability} />
      ),
    },
    {
      key: 'status',
      label: 'Listing Status',
      render: (machine) => (
        <StatusBadge status={machine.status} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (machine) => (
        <div className="admin-row-actions">
          <button
            type="button"
            className="admin-icon-action"
            onClick={() => setSelected(machine)}
            aria-label={`View ${machine.name}`}
            title="View details"
          >
            <Eye size={15} />
          </button>

          {machine.status !== 'Suspended' && (
            <button
              type="button"
              className="admin-icon-action"
              onClick={() =>
                setPending({
                  id: machine.id,
                  name: machine.name,
                  nextStatus: 'Suspended',
                })
              }
              aria-label={`Suspend ${machine.name}`}
              title="Suspend listing"
            >
              <PauseCircle size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <PageHeading
        eyebrow="MARKETPLACE INVENTORY"
        title="Machine management"
        subtitle="Review marketplace listings and monitor machine availability."
      />

      {dataError && (
        <p className="field-error" role="alert">
          {dataError}
        </p>
      )}

      {actionError && (
        <p className="field-error" role="alert">
          {actionError}
        </p>
      )}

      {loading && <p>Loading machine listings...</p>}

      <section className="admin-panel">
        <div className="admin-toolbar">
          <label className="admin-search">
            <span className="sr-only">Search machines</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search machine, provider, location, or ID"
            />
          </label>

          <label className="admin-filter">
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>All categories</option>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="admin-filter">
            <span>Provider</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              <option>All providers</option>
              {providers.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="admin-filter">
            <span>Listing status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All listing statuses</option>
              <option>Pending Review</option>
              <option>Approved</option>
              <option>Rejected</option>
              <option>Suspended</option>
            </select>
          </label>
        </div>

        <AdminDataTable
          columns={columns}
          rows={visible}
          pageSize={7}
        />
      </section>

      {selected && (
        <AdminModal
          title={selected.name}
          onClose={() => setSelected(null)}
        >
          {selected.image && (
            <img
              className="admin-machine-preview"
              src={selected.image}
              alt={selected.name}
            />
          )}

          <dl className="admin-detail-list">
            <dt>Machine ID</dt>
            <dd>{selected.id}</dd>

            <dt>Category</dt>
            <dd>{selected.category || 'Not provided'}</dd>

            <dt>Provider</dt>
            <dd>{selected.provider || 'Not provided'}</dd>

            <dt>Manufacturer / model</dt>
            <dd>
              {selected.manufacturer || 'Not provided'} ·{' '}
              {selected.model || 'Not provided'}
            </dd>

            <dt>Location</dt>
            <dd>{selected.location || 'Not provided'}</dd>

            <dt>Availability</dt>
            <dd>
              {selected.hours ?? 0} hours ·{' '}
              {selected.availability || 'Not provided'}
            </dd>

            <dt>Hourly rate</dt>
            <dd>
              ₹{Number(selected.rate || 0).toLocaleString('en-IN')}
            </dd>

            <dt>Listing status</dt>
            <dd>
              <StatusBadge status={selected.status} />
            </dd>

            <dt>Materials</dt>
            <dd>
              {selected.materials?.join(', ') || 'Not specified'}
            </dd>

            <dt>Description</dt>
            <dd>{selected.description || 'No description'}</dd>
          </dl>
        </AdminModal>
      )}

      {pending && (
        <ConfirmationModal
          title="Suspend this listing?"
          message={`${pending.name} will be marked Suspended and will no longer be treated as an active listing.`}
          confirmLabel="Suspend listing"
          tone="danger"
          onConfirm={applyAction}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}

export default MachineManagement;
