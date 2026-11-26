
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

import MachineCard from '../../components/seeker/MachineCard';
import RFQTable from '../../components/seeker/RFQTable';
import SeekerStatCard from '../../components/seeker/SeekerStatCard';

import { auth } from '../../firebase/firebase';
import { getUserProfile } from '../../services/userService';
import { subscribeToMarketplaceMachines } from '../../services/machineService';
import { getMachineRatingSummaries } from '../../services/machineReviewService';
import { subscribeToSeekerRFQs } from '../../services/rfqService';
import { subscribeToSeekerQuotations } from '../../services/quotationService';

function SeekerDashboard() {
  const [selectedRfq, setSelectedRfq] = useState(null);

  const [machines, setMachines] = useState([]);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [machinesError, setMachinesError] = useState('');

  const [ratingSummaries, setRatingSummaries] = useState({});

  const [rfqs, setRfqs] = useState([]);
  const [rfqsLoading, setRfqsLoading] = useState(true);
  const [rfqsError, setRfqsError] = useState('');

  const [quotations, setQuotations] = useState([]);
  const [quotationsError, setQuotationsError] = useState('');

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Load registered user details from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          throw new Error('No authenticated user found.');
        }

        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading seeker profile:', error);
        setProfileError('Unable to load your profile details.');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Subscribe to seeker RFQs
  useEffect(() => {
    try {
      return subscribeToSeekerRFQs(
        (records) => {
          setRfqs(records);
          setRfqsError('');
          setRfqsLoading(false);
        },
        (error) => {
          console.error('Seeker RFQ subscription error:', error);
          setRfqsError(error.message || 'Unable to load your RFQs.');
          setRfqsLoading(false);
        }
      );
    } catch (error) {
      console.error('Seeker RFQ subscription error:', error);
      setRfqsError(error.message || 'Unable to load your RFQs.');
      setRfqsLoading(false);
      return undefined;
    }
  }, []);

  // Subscribe to marketplace machines
  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeToMarketplaceMachines(
      (items) => {
        if (!active) return;

        setMachines(items);
        setMachinesError('');
        setMachinesLoading(false);
      },
      (error) => {
        if (!active) return;

        console.error('Seeker machine loading error:', error);
        setMachinesError(
          error.message || 'Unable to load recommended machines.'
        );
        setMachinesLoading(false);
      }
    );

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Load machine review summaries
  useEffect(() => {
    let active = true;

    const loadRatings = async () => {
      try {
        const summaries = await getMachineRatingSummaries();

        if (active) {
          setRatingSummaries(summaries || {});
        }
      } catch (error) {
        console.error('Machine ratings loading error:', error);

        if (active) {
          setRatingSummaries({});
        }
      }
    };

    loadRatings();

    return () => {
      active = false;
    };
  }, []);

  // Subscribe to seeker quotations
  useEffect(() => {
    return subscribeToSeekerQuotations(
      setQuotations,
      (error) => {
        console.error('Seeker quotation subscription error:', error);
        setQuotationsError(
          error.message || 'Unable to load quotation statistics.'
        );
      }
    );
  }, []);

  // Merge rating summaries into marketplace machine objects
  const ratedMachines = machines.map((machine) => {
    const summary = ratingSummaries[machine.id];

    return {
      ...machine,
      averageRating: summary?.averageRating || 0,
      totalReviews: summary?.totalReviews || 0,
      providerRating:
        summary?.totalReviews > 0
          ? summary.averageRating
          : machine.providerRating || null,
    };
  });

  const stats = [
    {
      icon: ClipboardList,
      label: 'Total RFQs',
      value: rfqs.length,
      caption: `${rfqs.filter((rfq) =>
        ['open', 'pending'].includes(rfq.status)
      ).length} currently pending`
    },
    {
      icon: CheckCircle2,
      label: 'Quotations received',
      value: quotations.length,
      caption: 'Responses to your RFQs'
    },
    {
      icon: BriefcaseBusiness,
      label: 'Pending Quotations',
      value: quotations.filter(
        (quote) => quote.status === 'submitted'
      ).length,
      caption: 'Review and compare offers'
    },
    {
      icon: Search,
      label: 'Available Machines',
      value: machines.filter((machine) =>
        ['Available', 'Limited'].includes(machine.availability)
      ).length,
      caption: 'Current marketplace listings'
    }
  ];

  const firstName = profile?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="seeker-page">

      {/* Dashboard heading */}
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">SEEKER WORKSPACE</span>

          <h1>
            Good morning, {
              profileLoading ? '...' : firstName
            }.
          </h1>

          <p>
            Find the right production capacity and keep every job moving.
          </p>
        </div>

        <Link className="btn btn-primary" to="/seeker/machines">
          <Search size={17} />
          Browse machines
        </Link>
      </div>

      {/* Profile loading and error messages */}
      {profileError && (
        <div className="field-error" role="alert">
          {profileError}
        </div>
      )}

      {quotationsError && (
        <p className="field-error" role="alert">
          {quotationsError}
        </p>
      )}

      {rfqsError && (
        <p className="field-error" role="alert">
          {rfqsError}
        </p>
      )}

      {/* Dashboard statistics */}
      <section
        className="metric-grid seeker-metric-grid"
        aria-label="Seeker overview"
      >
        {stats.map((stat, index) => (
          <SeekerStatCard
            key={stat.label}
            {...stat}
            index={(index % 4) + 1}
          />
        ))}
      </section>

      {/* Recommended machines */}
      <section className="provider-panel dashboard-section">
        <div className="panel-heading">
          <div>
            <h2>Recommended machines</h2>
            <p>
              Capacity that may fit your recent manufacturing needs.
            </p>
          </div>

          <Link className="subtle-link" to="/seeker/machines">
            View all machines <ArrowRight size={14} />
          </Link>
        </div>

        <div className="machine-grid dashboard-machine-grid seeker-recommended-grid">
          {machinesLoading ? (
            <p>Loading live machine listings...</p>
          ) : machinesError ? (
            <p role="alert">{machinesError}</p>
          ) : ratedMachines.length ? (
            ratedMachines.slice(0, 3).map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                compact
              />
            ))
          ) : (
            <p>No machine listings are available yet.</p>
          )}
        </div>
      </section>

      {/* Recent RFQ activity */}
      <section className="provider-panel dashboard-section">
        <div className="panel-heading">
          <div>
            <h2>Recent RFQ activity</h2>
            <p>
              Review responses and the status of your requirements.
            </p>
          </div>

          <Link className="subtle-link" to="/seeker/rfqs">
            All RFQs <ArrowRight size={14} />
          </Link>
        </div>

        {rfqsLoading ? (
          <p>Loading your RFQs...</p>
        ) : (
          <RFQTable
            rfqs={rfqs.slice(0, 4).map((rfq) => ({
              ...rfq,
              category: rfq.machineCategory || 'Machine',
              submitted:
                rfq.createdAt?.toDate?.().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }) || '—',
              quotes: quotations.filter(
                (quotation) => quotation.rfqId === rfq.id
              ).length,
            }))}
            variant="dashboard"
            onView={setSelectedRfq}
          />
        )}
      </section>

      {/* Workspace settings */}
      <section
        className="provider-panel seeker-settings-panel"
        id="settings"
      >
        <div className="panel-heading">
          <div>
            <h2>Workspace settings</h2>
            <p>
              Manage your business details and account preferences.
            </p>
          </div>

          <Link
            className="btn btn-ghost seeker-card-button"
            to="/seeker/profile"
          >
            Company profile
          </Link>
        </div>

        {profileLoading ? (
          <p>Loading your company details...</p>
        ) : profileError ? (
          <p>{profileError}</p>
        ) : (
          <div className="dashboard-company-details">
            <div>
              <span>Company name</span>
              <strong>
                {profile?.companyName || 'Not available'}
              </strong>
            </div>

            <div>
              <span>Business type</span>
              <strong>
                {profile?.businessType || 'Not provided'}
              </strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {profile?.email || 'Not provided'}
              </strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>
                {profile?.phone || 'Not provided'}
              </strong>
            </div>

            <div className="company-address-field">
              <span>Address</span>
              <strong>
                {profile?.companyAddress || 'Not provided'}
              </strong>
            </div>
          </div>
        )}
      </section>

      {/* RFQ details dialog */}
      {selectedRfq && (
        <InfoDialog
          title={`RFQ ${selectedRfq.id}`}
          onClose={() => setSelectedRfq(null)}
        >
          <dl className="seeker-detail-list">
            <dt>Requirement</dt>
            <dd>{selectedRfq.title}</dd>

            <dt>Category</dt>
            <dd>{selectedRfq.category}</dd>

            <dt>Description</dt>
            <dd>
              {selectedRfq.description || 'Not provided'}
            </dd>

            <dt>Submitted</dt>
            <dd>{selectedRfq.submitted}</dd>

            <dt>Quotations</dt>
            <dd>{selectedRfq.quotes}</dd>

            <dt>Status</dt>
            <dd>{selectedRfq.status}</dd>
          </dl>
        </InfoDialog>
      )}

    </div>
  );
}

function InfoDialog({ title, children, onClose }) {
  return (
    <div
      className="seeker-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="seeker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seeker-dialog-title"
      >
        <button
          type="button"
          className="seeker-modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>

        <span className="eyebrow-label">RFQ DETAILS</span>

        <h2 id="seeker-dialog-title">{title}</h2>

        {children}

        <button
          type="button"
          className="btn btn-primary seeker-modal-action"
          onClick={onClose}
        >
          Close
        </button>
      </section>
    </div>
  );
}

export default SeekerDashboard;
