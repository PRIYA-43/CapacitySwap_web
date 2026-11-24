import {
  Building2,
  Download,
  FileText,
  RefreshCw,
  Search,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';
import '../../styles/sections.css';

const features = [
  { icon: Search, title: 'Machine Discovery', text: 'Find suitable machines by capability, machine type, and location.' },
  { icon: SlidersHorizontal, title: 'Capacity Sharing', text: 'Publish machine listings, set indicative rates, and update availability.' },
  { icon: Building2, title: 'Provider Profiles', text: 'Review provider and company details alongside machine listings.' },
  { icon: FileText, title: 'RFQ Management', text: 'Submit manufacturing requirements and follow incoming quotations.' },
  { icon: Scale, title: 'Quotation Comparison', text: 'Review provider pricing and delivery options side by side.' },
  { icon: RefreshCw, title: 'Live Updates', text: 'See RFQ and quotation changes as they are saved.' },
  { icon: Download, title: 'Downloadable Documents', text: 'Download RFQs and quotations as PDF documents.' },
];

function FeaturesSection() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <span className="kicker">Platform features</span>
          <h2>Everything You Need to Connect Manufacturing Businesses</h2>
        </div>

        <div className="features-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="feature-card site-card">
              <div className="icon-wrap">
                <Icon size={22} />
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

export default FeaturesSection;
