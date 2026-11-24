import { Link } from 'react-router-dom';

export function BrandMark() {
  return (
    <svg className="brand-symbol" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M4.5 26V13.5l7 4.2v-4.2l7 4.2V8.5h8V26h-22Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.5 22v-3M13 22v-3M22.5 12v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M19 11.5h3.5M23 17.5h2.5" stroke="#ff7ee3" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="18" cy="11.5" r="1.5" fill="#ff7ee3" />
      <circle cx="22" cy="17.5" r="1.5" fill="#ff7ee3" />
    </svg>
  );
}

function Brand({ className = '' }) {
  return (
    <Link to="/" className={`brand ${className}`} aria-label="CapacitySwap home">
      <span className="brand-mark"><BrandMark /></span>
      <span className="brand-name">CapacitySwap</span>
    </Link>
  );
}

export default Brand;
