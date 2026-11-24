import { CheckCircle2 } from 'lucide-react';
import '../../styles/sections.css';

function AboutSection() {
  return (
    <section className="section" id="about">
      <div className="container about-grid">
        <div className="about-copy">
          <span className="kicker">About CapacitySwap</span>
          <h2>Making Manufacturing Capacity More Accessible</h2>
          <p>
            Many manufacturing businesses have machines that are not fully utilized, while other
            businesses struggle to find suitable production resources. CapacitySwap creates a
            platform where companies can share available machine capacity and connect with
            businesses that need manufacturing services.
          </p>
          <ul className="about-list">
            <li>
              <span className="check-icon"><CheckCircle2 size={14} /></span>
              <span>Reduce idle time across production facilities and better utilize expensive equipment.</span>
            </li>
            <li>
              <span className="check-icon"><CheckCircle2 size={14} /></span>
              <span>Connect manufacturers with available capability, machine availability, and operational capacity.</span>
            </li>
            <li>
              <span className="check-icon"><CheckCircle2 size={14} /></span>
              <span>Improve flexibility for production planning, quoting, and capacity-based collaboration.</span>
            </li>
          </ul>
        </div>

        <div className="about-visual">
          <img
            src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1100&q=80"
            alt="Industrial manufacturing facility and precision machining equipment"
          />
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
