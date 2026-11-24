import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/home/Hero';
import TrustSection from '../components/home/TrustSection';
import AboutSection from '../components/home/AboutSection';
import HowItWorks from '../components/home/HowItWorks';
import FeaturesSection from '../components/home/FeaturesSection';
import ProviderBenefits from '../components/home/ProviderBenefits';
import SeekerBenefits from '../components/home/SeekerBenefits';
import CTASection from '../components/home/CTASection';

function Home() {
  return (
    <div className="page-shell">
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <AboutSection />
        <HowItWorks />
        <FeaturesSection />
        <ProviderBenefits />
        <SeekerBenefits />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
