import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Activity, Building2, BriefcaseBusiness, Clock3, FileText, Users } from 'lucide-react';
import AdminChart from '../../components/admin/AdminChart';
import AdminStatCard from '../../components/admin/AdminStatCard';

function AdminAnalytics() {
  const { data, loading, error } = useOutletContext();
  const categories = useMemo(() => Object.entries(data.machines.reduce((result, machine) => {
    result[machine.category] = (result[machine.category] || 0) + 1;
    return result;
  }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count), [data.machines]);
  const roles = [
    { label: 'Providers', value: data.users.filter((user) => user.role === 'Provider').length, fill: '#130F40' },
    { label: 'Seekers', value: data.users.filter((user) => user.role === 'Seeker').length, fill: '#C724B1' },
  ];
  const stats = [
    { icon: Building2, label: 'Registered Companies', value: data.companies.length, caption: 'Provider and seeker organizations' },
    { icon: Users, label: 'Provider Accounts', value: roles[0].value, caption: 'Registered provider accounts' },
    { icon: Users, label: 'Seeker Accounts', value: roles[1].value, caption: 'Registered seeker accounts' },
    { icon: Clock3, label: 'Available Capacity Hours', value: data.machines.reduce((total, machine) => total + (Number(machine.hours) || 0), 0), caption: 'Across current machine listings' },
    { icon: FileText, label: 'Total RFQs', value: data.rfqs.length, caption: 'Submitted manufacturing requests' },
    { icon: BriefcaseBusiness, label: 'Total Quotations', value: data.quotations.length, caption: 'Submitted provider offers' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="eyebrow-label">PLATFORM INSIGHTS</span><h1>Analytics</h1><p>Explore high-level marketplace indicators and activity trends.</p></div><span className="admin-readonly-label"><Activity size={15} /> Platform analytics</span></div>
      {loading && <p>Loading platform records...</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
      <section className="admin-stat-grid admin-analytics-stats">{stats.map((stat, index) => <AdminStatCard key={stat.label} {...stat} index={(index % 4) + 1} />)}</section>
      <section className="admin-chart-grid admin-analytics-grid">
        <AdminChart type="pie" title="Provider and seeker distribution" subtitle="Registered user accounts" data={roles} dataKey="value" formatTooltip={(value) => [`${value} accounts`, 'Users']} height={295} />
        <AdminChart type="bar" title="Machine category distribution" subtitle="Current listings by category" data={categories} dataKey="count" height={295} />
        <AdminChart type="area" title="Quotation status" subtitle="Submitted offers by current status" data={Object.entries(data.quotations.reduce((result, quotation) => { result[quotation.status || 'Unknown'] = (result[quotation.status || 'Unknown'] || 0) + 1; return result; }, {})).map(([label, value]) => ({ label, value }))} dataKey="value" height={300} />
        <section className="admin-chart-card admin-category-summary"><div className="admin-chart-heading"><div><h2>Most listed categories</h2><p>Marketplace inventory</p></div></div>
          <ol>{categories.slice(0, 5).map((item, index) => <li key={item.label}><span className="admin-category-rank">{String(index + 1).padStart(2, '0')}</span><span className="admin-category-name">{item.label}<small>{item.count} listing{item.count === 1 ? '' : 's'}</small></span><span className="admin-category-bar"><i style={{ width: `${Math.max(14, (item.count / Math.max(categories[0]?.count || 1, 1)) * 100)}%` }} /></span></li>)}</ol>
        </section>
      </section>
    </div>
  );
}

export default AdminAnalytics;
