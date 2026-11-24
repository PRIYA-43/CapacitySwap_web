import '../../styles/sections.css';
import { Link } from 'react-router-dom';

function CTASection() {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-box">
          <h2>Your Next Manufacturing Opportunity Starts Here.</h2>
          <p>
            Whether you have available machine capacity or need production resources, CapacitySwap
            helps you connect with the right manufacturing partners.
          </p>
          <div className="cta-actions">
            <Link to="/register?role=provider" className="btn btn-primary">Join as a Provider</Link>
            <Link to="/register?role=seeker" className="btn btn-secondary">Find Manufacturing Capacity</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
