import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Building2, BriefcaseBusiness, CheckCircle2, ClipboardList, Users, Wrench } from 'lucide-react';
import AdminChart from '../../components/admin/AdminChart';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminStatCard from '../../components/admin/AdminStatCard';
import StatusBadge from '../../components/admin/StatusBadge';

function AdminDashboard() {
  const { data, loading, error } = useOutletContext();
  const userTrend = monthlyCounts(data.users, 'users');
  const rfqActivity = monthlyCounts(data.rfqs, 'rfqs');
  const machineCategories = useMemo(() => {
    const categories = data.machines.reduce((result, machine) => {
      result[machine.category] = (result[machine.category] || 0) + 1;
      return result;
    }, {});
    return Object.entries(categories).map(([label, count]) => ({ label, count }));
  }, [data.machines]);
  const rfqStatuses = useMemo(() => {
    const statuses = data.rfqs.reduce((result, rfq) => {
      result[rfq.status] = (result[rfq.status] || 0) + 1;
      return result;
    }, {});
    return Object.entries(statuses).map(([label, value]) => ({ label, value }));
  }, [data.rfqs]);

  const verified = data.companies.filter((company) => company.status === 'Verified').length;
  const stats = [
    { icon: Users, label: 'Registered Users', value: data.users.length, caption: `${data.users.filter((user) => user.status === 'Active').length} active` },
    { icon: Building2, label: 'Companies', value: data.companies.length, caption: 'Provider and seeker accounts' },
    { icon: CheckCircle2, label: 'Verified Companies', value: verified, caption: `${data.companies.length - verified} need attention` },
    { icon: Wrench, label: 'Machine Listings', value: data.machines.length, caption: `${data.machines.filter((machine) => machine.status === 'Pending Review').length} awaiting review` },
    { icon: ClipboardList, label: 'RFQs', value: data.rfqs.length, caption: 'Submitted manufacturing requests' },
    { icon: BriefcaseBusiness, label: 'Quotations', value: data.quotations.length, caption: 'Provider offers submitted' },
  ];

  const activityColumns = [
    { key: 'activity', label: 'Activity' },
    { key: 'actor', label: 'User or Company' },
    { key: 'type', label: 'Activity Type' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="admin-page">
      <div className="dashboard-heading">
        <div><span className="eyebrow-label">PLATFORM OVERVIEW</span><h1>Welcome, Admin.</h1><p>Monitor marketplace operations and review items that need attention.</p></div>
        <span className="admin-readonly-label"><Activity size={15} /> Admin workspace</span>
      </div>
      {loading && <p>Loading platform records...</p>}
      {error && <p className="field-error" role="alert">{error}</p>}

      <section className="admin-stat-grid" aria-label="Platform statistics">
        {stats.map((stat, index) => <AdminStatCard key={stat.label} {...stat} index={(index % 4) + 1} />)}
      </section>

      <section className="admin-chart-grid">
        <AdminChart type="line" title="User registration trends" subtitle="Registered users by month" data={userTrend} dataKey="users" />
        <AdminChart type="bar" title="Machine listings by category" subtitle="Current marketplace listings" data={machineCategories} dataKey="count" />
        <AdminChart type="pie" title="RFQ status distribution" subtitle="Submitted RFQs by current status" data={rfqStatuses} dataKey="value" formatTooltip={(value) => [`${value} RFQs`, 'Count']} height={280} />
        <AdminChart type="area" title="Monthly RFQ activity" subtitle="New requests by month" data={rfqActivity} dataKey="rfqs" height={280} />
      </section>

      <section className="admin-panel admin-activity-panel">
        <div className="admin-panel-heading"><div><h2>Recent platform activity</h2><p>Latest marketplace activity.</p></div></div>
        <AdminDataTable columns={activityColumns} rows={data.activity} pageSize={6} />
      </section>
    </div>
  );
}

function monthlyCounts(records, key) {
  const current = new Date();
  const months = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - 6 + index, 1);
    return {
      date,
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      [key]: 0,
    };
  });

  for (const record of records) {
    const timestamp = record.createdAt?.toDate?.() || new Date(record.createdAt);
    if (Number.isNaN(timestamp.getTime())) continue;
    const month = months.find((item) =>
      item.date.getFullYear() === timestamp.getFullYear() &&
      item.date.getMonth() === timestamp.getMonth()
    );
    if (month) month[key] += 1;
  }

  return months.map(({ label, [key]: count }) => ({ label, [key]: count }));
}

export default AdminDashboard;
