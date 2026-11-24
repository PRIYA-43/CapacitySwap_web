import { ClipboardList, Network, Scale, UserRoundPlus } from 'lucide-react';
import '../../styles/sections.css';

const steps = [
  {
    icon: UserRoundPlus,
    title: 'Register Your Company',
    text: 'Set up your manufacturing profile and define your company capabilities.',
  },
  {
    icon: ClipboardList,
    title: 'List Available Machine Capacity or Submit Manufacturing Requirements',
    text: 'Share available machine time or describe the manufacturing support you need.',
  },
  {
    icon: Network,
    title: 'Find a Suitable Provider',
    text: 'Browse machine listings and compare provider and company details.',
  },
  {
    icon: Scale,
    title: 'Review Provider Quotations',
    text: 'Compare pricing, delivery details, and terms before making a decision.',
  },
];

function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <span className="kicker">How it works</span>
          <h2>How CapacitySwap Works</h2>
        </div>

        <div className="steps-grid">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="step-card site-card">
              <div className="step-count">{String(index + 1).padStart(2, '0')}</div>
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

export default HowItWorks;
