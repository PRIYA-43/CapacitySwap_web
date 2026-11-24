import { Compass, Factory, Workflow } from 'lucide-react';
import '../../styles/sections.css';

const trustCards = [
  {
    icon: Compass,
    title: 'Discover Capacity',
    text: 'Explore machine listings and production capacity published by manufacturing businesses.',
  },
  {
    icon: Factory,
    title: 'Connect with Manufacturers',
    text: 'Review provider and company details while comparing available machine capabilities.',
  },
  {
    icon: Workflow,
    title: 'Optimize Machine Utilization',
    text: 'Turn idle time into revenue by sharing underused equipment and balancing workloads more efficiently.',
  },
];

function TrustSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="kicker">Why CapacitySwap</span>
          <h2>Make Every Machine Count</h2>
        </div>

        <div className="value-grid">
          {trustCards.map(({ icon: Icon, title, text }) => (
            <article key={title} className="value-card site-card">
              <div className="icon-wrap">
                <Icon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
