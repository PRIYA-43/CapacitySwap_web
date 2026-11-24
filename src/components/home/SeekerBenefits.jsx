import { ArrowRight, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/sections.css';

function SeekerBenefits() {
  return (
    <section className="section">
      <div className="container seeker-layout">
        <div className="seeker-visual">
          <img
            src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=85"
            alt="Precision CNC machining equipment in a modern manufacturing facility"
          />
        </div>

        <div className="seeker-copy">
          <span className="kicker">For seekers</span>
          <h2>Find the Manufacturing Capacity You Need</h2>
          <p>
            Whether you need short-term machining support or a long-term production partner,
            CapacitySwap helps you access the right machines and manufacturing specialists for the job.
          </p>

          <ul className="benefit-list">
            <li><span className="check-icon"><CheckCheck size={14} /></span> Discover suitable machines and production capabilities.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Search by machine type, capability, and location.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Submit manufacturing requirements and project details.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Compare pricing, delivery estimates, and quotation terms.</li>
            <li><span className="check-icon"><CheckCheck size={14} /></span> Accept or reject provider quotations for your RFQs.</li>
          </ul>

          <Link to="/register?role=seeker" className="btn btn-primary">
            Explore Capacity <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default SeekerBenefits;
