import { ArrowRight, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/sections.css';

function ProviderBenefits() {
  return (
    <section className="section">
      <div className="container provider-layout">
        <div className="provider-copy">
          <span className="kicker">For providers</span>
          <h2>Turn Idle Machine Hours Into Opportunities</h2>
          <p>
            List underused industrial equipment and open your factory capacity to the right
            manufacturing opportunities. CapacitySwap helps providers monetize available uptime
            while keeping production plans flexible.
          </p>

          <ul className="benefit-list">
            <li><span className="check-icon"><CheckCheck size={14} /></span> Publish available machines and production capabilities.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Update machine availability and working schedules.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Receive manufacturing requests from businesses.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Submit quotations with pricing and delivery details.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Review seeker decisions on your quotations.</li>
          </ul>

          <Link to="/register?role=provider" className="btn btn-primary">
            Become a Provider <ArrowRight size={16} />
          </Link>
        </div>

        <div className="provider-visual">
          <img
            src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80"
            alt="Precision engineering and production equipment in a manufacturing facility"
          />
        </div>
      </div>
    </section>
  );
}

export default ProviderBenefits;
