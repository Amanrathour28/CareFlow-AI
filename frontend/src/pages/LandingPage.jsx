import '../styles/landing.css';
import Navbar from '../components/home/Navbar';
import Hero from '../components/home/Hero';
import PlatformCapabilities from '../components/home/PlatformCapabilities';
import ProblemSolution from '../components/home/ProblemSolution';
import Workflow from '../components/home/Workflow';
import AIIntelligence from '../components/home/AIIntelligence';
import FeatureGrid from '../components/home/FeatureGrid';
import ArchitectureVisualization from '../components/home/ArchitectureVisualization';
import TechnologyStack from '../components/home/TechnologyStack';
import FinalCTA from '../components/home/FinalCTA';
import Footer from '../components/home/Footer';

export default function LandingPage() {
  return (
    <div className="landing-body">
      {/* Background glow Orbs */}
      <div className="bg-glow-orb" style={{ width: 600, height: 600, background: '#6366f1', top: -150, left: -150 }} />
      <div className="bg-glow-orb" style={{ width: 500, height: 500, background: '#06b6d4', top: '30%', right: -150 }} />
      <div className="bg-glow-orb" style={{ width: 500, height: 500, background: '#8b5cf6', bottom: 100, left: '20%' }} />

      <Navbar />
      <main>
        <Hero />
        <PlatformCapabilities />
        <ProblemSolution />
        <Workflow />
        <AIIntelligence />
        <FeatureGrid />
        <ArchitectureVisualization />
        <TechnologyStack />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
