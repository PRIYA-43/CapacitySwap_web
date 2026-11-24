import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_COLORS = [
  'var(--admin-chart-color-1)',
  'var(--admin-chart-color-2)',
  'var(--admin-chart-color-3)',
  'var(--admin-chart-color-4)',
  'var(--admin-chart-color-5)',
  'var(--admin-chart-color-6)',
  'var(--admin-chart-color-7)',
  'var(--admin-chart-color-8)',
];

function AdminChart({ type = 'line', data, dataKey, xKey = 'label', title, subtitle, formatTooltip, height = 265 }) {
  return (
    <section className="admin-chart-card">
      <div className="admin-chart-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      <div className="admin-chart-plot" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey={xKey} innerRadius="56%" outerRadius="82%" paddingAngle={3} stroke="none">
                {data.map((entry, index) => <Cell key={entry[xKey] || index} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={formatTooltip} />
              <Legend verticalAlign="bottom" height={28} iconType="circle" />
            </PieChart>
          ) : type === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-chart-grid)" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: 'var(--admin-chart-axis)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--admin-chart-axis)', fontSize: 11 }} />
              <Tooltip formatter={formatTooltip} cursor={{ fill: 'rgba(107,42,134,0.08)' }} />
              <Bar dataKey={dataKey} name={dataKey} fill="var(--admin-chart-bar)" radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
              <defs><linearGradient id="adminBookingsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--admin-chart-area)" stopOpacity={0.24} /><stop offset="95%" stopColor="var(--admin-chart-area)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-chart-grid)" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: 'var(--admin-chart-axis)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--admin-chart-axis)', fontSize: 11 }} />
              <Tooltip formatter={formatTooltip} />
              <Area type="monotone" dataKey={dataKey} stroke="var(--admin-chart-area)" strokeWidth={2.5} fill="url(#adminBookingsFill)" />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--admin-chart-grid)" />
              <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: 'var(--admin-chart-axis)', fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--admin-chart-axis)', fontSize: 11 }} />
              <Tooltip formatter={formatTooltip} />
              <Line type="monotone" dataKey={dataKey} stroke="var(--admin-chart-line)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--admin-chart-bar)', strokeWidth: 0 }} activeDot={{ r: 5, fill: 'var(--admin-chart-area)', stroke: 'var(--admin-chart-axis)' }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default AdminChart;
