import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import HeroSection from './components/HeroSection';
import GovernanceCard from './components/GovernanceCard';
import CorePillars from './components/CorePillars';
import WorkflowSection from './components/WorkflowSection';
import SecuritySection from './components/SecuritySection';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <PublicNavbar />
      <main className="flex-1">
        <HeroSection />
        <GovernanceCard />
        <CorePillars />
        <WorkflowSection />
        <SecuritySection />
      </main>
      <PublicFooter />
    </div>
  );
}

export default HomePage;
