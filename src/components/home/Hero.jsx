import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/hero.css';

function Hero() {
  return (
    <section className="hero-wrap" id="home">
      <div className="container hero">
        <div className="hero-copy">
          <span className="kicker section-kicker">Manufacturing capacity network</span>
          <h1>Unlock Manufacturing Potential. Share Capacity. Grow Together.</h1>
          <p>
            Connect with manufacturing companies, discover unused machine capacity, and turn idle
            production hours into business opportunities with CapacitySwap.
          </p>
          <div className="hero-actions">
            <Link to="/register?role=seeker" className="btn btn-primary">
              Explore Capacity <ArrowRight size={16} />
            </Link>
            <Link to="/register?role=provider" className="btn btn-secondary">
              Become a Provider
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-label="Manufacturing facilities and machine network illustration">
          <div className="hero-panel">
            <img
              src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80"
              alt="High-precision CNC machinery in a modern factory"
            />
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
