import { Mail } from 'lucide-react';
import Brand from '../common/Brand';
import '../../styles/footer.css';

const currentYear = new Date().getFullYear();

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>
            CapacitySwap helps manufacturing businesses connect, share idle production capacity,
            and unlock growth through smarter machine utilization.
          </p>
          <div className="social-row" aria-label="Contact links">
            <a className="social-pill" href="mailto:hello@capacityswap.io" aria-label="Email">
              <Mail size={16} />
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#features">Features</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Platform</h4>
          <ul className="footer-links">
            <li><a href="/register?role=seeker">Machine listings</a></li>
            <li><a href="/register?role=provider">Capacity sharing</a></li>
            <li><a href="/register?role=seeker">RFQ flow</a></li>
            <li><a href="/login">Quotations</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Contact</h4>
          <ul className="footer-meta">
            <li><Mail size={16} /> hello@capacityswap.io</li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        © {currentYear} CapacitySwap. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
