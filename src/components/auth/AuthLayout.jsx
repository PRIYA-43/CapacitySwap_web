import { ArrowLeft, Gauge, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../common/Brand';

function AuthLayout({ children, imageAlt = 'Precision manufacturing equipment in a modern factory' }) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link to="/" className="auth-back"><ArrowLeft size={16} /> Back to home</Link>
        <div className="auth-story-content">
          <div className="auth-brand">
            <span className="brand-mark"><BrandMark /></span>
            <span>CapacitySwap</span>
          </div>
          <span className="kicker auth-kicker">Manufacturing, connected</span>
          <h1>Connect. Share. Manufacture.</h1>
          <p>Make better use of manufacturing capacity with a network built for businesses like yours.</p>
          <div className="auth-story-points">
            <span><Gauge size={17} /> More visibility for available capacity</span>
            <span><ShieldCheck size={17} /> Built around business-to-business collaboration</span>
          </div>
        </div>
        <img
          className="auth-story-image"
          src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=85"
          alt={imageAlt}
        />
        <div className="auth-story-caption">
          <span className="auth-caption-dot" />
          A smarter way to connect production capability
        </div>
      </section>
      <section className="auth-content">
        <div className="auth-content-inner">{children}</div>
      </section>
    </main>
  );
}

export default AuthLayout;
