import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Brand from '../common/Brand';
import '../../styles/navbar.css';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
];

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Brand />

        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <Link className="mobile-auth-link" to="/login" onClick={() => setOpen(false)}>
            Login
          </Link>
          <Link className="mobile-auth-link" to="/register" onClick={() => setOpen(false)}>
            Register
          </Link>
          <Link to="/register" className="mobile-get-started" onClick={() => setOpen(false)}>
            Get Started
          </Link>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="nav-link-btn">
            Login
          </Link>
          <Link to="/register" className="nav-link-btn">
            Register
          </Link>
          <Link to="/register" className="btn btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
