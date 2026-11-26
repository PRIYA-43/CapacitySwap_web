
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Gauge,
  Plus,
  Wrench,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import MachineCard from '../../components/common/MachineCard';

import { subscribeToMyMachines } from '../../services/machineService';
import { subscribeToProviderRFQs } from '../../services/rfqService';
import { subscribeToProviderQuotations } from '../../services/quotationService';

import { auth } from '../../firebase/firebase';
import { getUserProfile } from '../../services/userService';

function ProviderDashboard() {
  const [machines, setMachines] = useState([]);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [machinesError, setMachinesError] = useState('');
  const [rfqs, setRfqs] = useState([]);
  const [rfqsLoading, setRfqsLoading] = useState(true);
  const [rfqsError, setRfqsError] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [quotationsError, setQuotationsError] = useState('');

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Load the logged-in provider's actual Firebase profile.
  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setProfile(null);
        setProfileError('Please log in to view your provider dashboard.');
        setProfileLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);

        if (!active) return;

        setProfile(userProfile);
        setProfileError('');
      } catch (error) {
        console.error('Provider profile loading error:', error);

        if (active) {
          setProfileError(
            error.message || 'Unable to load your registered company details.'
          );
        }
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProviderQuotations(
      setQuotations,
      (error) => {
        console.error('Provider quotation subscription error:', error);
        setQuotationsError(error.message || 'Unable to load quotation activity.');
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      return subscribeToProviderRFQs(
        (records) => {
          setRfqs(records);
          setRfqsError('');
          setRfqsLoading(false);
        },
        (error) => {
          console.error('Provider RFQ subscription error:', error);
          setRfqsError(error.message || 'Unable to load RFQs.');
          setRfqsLoading(false);
        }
      );
    } catch (error) {
      console.error('Provider RFQ subscription error:', error);
      setRfqsError(error.message || 'Unable to load RFQs.');
      setRfqsLoading(false);
      return undefined;
    }
  }, []);

  useEffect(() => {
    try {
      return subscribeToMyMachines(
        (records) => {
          setMachines(records);
          setMachinesError('');
          setMachinesLoading(false);
        },
        (error) => {
          console.error('Provider machine subscription error:', error);
          setMachinesError(error.message || 'Unable to load your machines.');
          setMachinesLoading(false);
        }
      );
    } catch (error) {
      console.error('Provider machine subscription error:', error);
      setMachinesError(error.message || 'Unable to load your machines.');
      setMachinesLoading(false);
      return undefined;
    }
  }, []);

  const pendingCount = rfqs.filter((rfq) =>
    ['open', 'pending'].includes(rfq.status)
  ).length;

  const availableCount = machines.filter(
    (machine) =>
      machine.availability === 'Available' ||
      machine.availability === 'Limited'
  ).length;

  const metrics = [
    {
      label: 'Total Machines',
      value: machines.length,
      caption: 'Across your listings',
      icon: Wrench,
      trend: 'All listings',
    },
    {
      label: 'Available Machines',
      value: availableCount,
      caption: 'Open for new requests',
      icon: Gauge,
      trend: 'Availability',
    },
    {
      label: 'Open RFQs',
      value: pendingCount,
      caption: 'Awaiting your review',
      icon: CalendarDays,
      trend: 'Needs attention',
    },
    {
      label: 'Accepted Quotations',
      value: quotations.filter((quotation) => quotation.status === 'accepted').length,
      caption: 'Accepted quotations',
      icon: BriefcaseBusiness,
      trend: 'From quotations',
    },
  ];

  const displayName =
    profile?.fullName?.trim().split(' ')[0] || 'there';

  const companyName =
    profile?.companyName || 'Company name not available';

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow-label">PROVIDER OVERVIEW</span>

          <h1>Welcome back, {displayName}.</h1>

          <p>
            Here’s what’s happening with your production capacity today.
          </p>
        </div>

        <Link
          to="/provider/machines/add"
          className="btn btn-primary"
        >
          <Plus size={17} />
          Add New Machine
        </Link>
      </div>

      {profileError && (
        <div className="field-error" role="alert">{profileError}</div>
      )}

      {/* Registered company details from Firestore */}
      <section className="provider-panel dashboard-section" id="workspace-settings">
        <div className="panel-heading">
          <div>
            <h2>My Company</h2>
            <p>Your registered provider account information.</p>
          </div>

          <Link
            to="/provider/profile"
            className="subtle-link"
          >
            Company profile <ArrowUpRight size={15} />
          </Link>
        </div>

        {profileLoading ? (
          <p>Loading your company information...</p>
        ) : profile ? (
          <div className="provider-company-details">
            <div>
              <span>Company name</span>
              <strong>{companyName}</strong>
            </div>
            <div>
              <span>Business type</span>
              <strong>{profile.businessType || 'Not provided'}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{profile.email || 'Not provided'}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{profile.phone || 'Not provided'}</strong>
            </div>

            <div className="company-address-field">
              <span>Address</span>
              <strong>{profile.companyAddress || 'Not provided'}</strong>
            </div>
          </div>
        ) : (
          <p>Your company information could not be loaded.</p>
        )}
      </section>

      <section
        className="metric-grid"
        aria-label="Dashboard overview"
      >
        {metrics.map(
          ({ label, value, caption, icon: Icon, trend }, index) => (
            <article
              className={`metric-card metric-card-${index + 1}`}
              key={label}
            >
              <div className="metric-top">
                <span className="metric-icon">
                  <Icon size={19} />
                </span>

                <span className="metric-trend">
                  <ArrowUpRight size={14} /> {trend}
                </span>
              </div>

              <strong className="metric-value">
                {value.toString().padStart(2, '0')}
              </strong>

              <span className="metric-label">{label}</span>
              <span className="metric-caption">{caption}</span>
            </article>
          )
        )}
      </section>

      <section
        className="provider-panel dashboard-section"
        id="booking-requests"
      >
        <div className="panel-heading">
          <div>
            <h2>Recent RFQs</h2>
            <p>Review incoming manufacturing requests for your machines.</p>
          </div>

          <Link
            to="/provider/bookings"
            className="subtle-link"
          >
            View all requests <ArrowUpRight size={15} />
          </Link>
        </div>
        {rfqsLoading ? (
          <p>Loading RFQs...</p>
        ) : rfqsError ? (
          <p role="alert">{rfqsError}</p>
        ) : rfqs.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>RFQ</th><th>Machine</th><th>Seeker</th><th>Required date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rfqs.slice(0, 3).map((rfq) => (
                  <tr key={rfq.id}>
                    <td className="table-id">{rfq.title}</td>
                    <td>{rfq.machineName || '—'}</td>
                    <td>{rfq.seekerCompanyName || rfq.seekerName || 'Not specified'}</td>
                    <td>{rfq.completionDate || '—'}</td>
                    <td><span className="booking-status status-pending">{rfq.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No RFQs have been submitted for your machines yet.</p>
        )}
      </section>

      <section
        className="provider-panel dashboard-section"
        id="machine-overview"
      >
        <div className="panel-heading">
          <div>
            <h2>My Machines</h2>
            <p>
              Overview of machines listed in your provider workspace.
            </p>
          </div>

          <Link
            to="/provider/machines"
            className="subtle-link"
          >
            Manage machines <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="machine-grid dashboard-machine-grid">
          {machinesLoading ? (
            <p>Loading your machine listings...</p>
          ) : machinesError ? (
            <p role="alert">{machinesError}</p>
          ) : machines.length ? (
            machines.slice(0, 2).map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                compact
              />
            ))
          ) : (
            <p>No machines have been added yet.</p>
          )}
        </div>
      </section>

      <section className="dashboard-lower-grid">
        <article
          className="provider-panel dashboard-section"
          id="quotation-activity"
        >
          <div className="panel-heading">
            <div>
              <h2>Recent quotations</h2>
                  <p>Provider offers saved for your incoming RFQs.</p>
            </div>

            <BriefcaseBusiness size={19} />
          </div>

          {quotations.length ? (
            <div className="activity-list">
              {quotations.slice(0, 3).map((quotation) => (
                <ActivityItem
                  key={quotation.id}
                  icon={FileText}
                  title={quotation.rfqTitle || quotation.rfqId}
                  detail={`${quotation.seekerCompanyName || 'Seeker'} · ${quotation.status}`}
                  time={quotation.createdAt?.toDate?.().toLocaleString('en-IN') || 'Recently'}
                />
              ))}
            </div>
          ) : <p>No quotations submitted yet.</p>}
        </article>

        <article
          className="provider-panel dashboard-section"
          id="recent-activity"
        >
          <div className="panel-heading">
            <div>
              <h2>Recent Activity</h2>
              <p>Recent updates in your workspace.</p>
            </div>

            <Activity size={19} />
          </div>

          <div className="activity-list">
            {quotations.slice(0, 3).map((quotation) => (
              <ActivityItem
                key={quotation.id}
                icon={FileText}
                title={`Quotation ${quotation.status}`}
                detail={`${quotation.rfqTitle || quotation.rfqId} · ${quotation.seekerCompanyName || 'Seeker'}`}
                time={quotation.createdAt?.toDate?.().toLocaleString('en-IN') || 'Recently'}
              />
            ))}
            {!quotations.length && <p>No recent activity.</p>}
          </div>
          {quotationsError && <p className="field-error" role="alert">{quotationsError}</p>}
        </article>
      </section>

    </div>
  );
}

function ActivityItem({ icon: Icon, title, detail, time }) {
  return (
    <div className="activity-item">
      <span className="activity-icon">
        <Icon size={16} />
      </span>

      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>

      <small>{time}</small>
    </div>
  );
}

export default ProviderDashboard;
