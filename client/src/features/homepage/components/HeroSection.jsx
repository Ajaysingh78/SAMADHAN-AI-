import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Building2, GitFork, ClockAlert, CheckCircle2 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Subtle Grid Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center space-y-6">
        {/* Hackathon PS Badge */}
        <div className="inline-flex items-center gap-2">
          <Badge variant="primary" className="bg-gov-950/80 text-gov-300 border-gov-700/60 py-1 px-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SIH 2026 Problem Statement ID: SIH26264
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          Single Source of Truth for <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-300 via-gov-200 to-sky-300">Technical Education</span> Complaint Cases
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          An integrated institution case-monitoring dashboard engineered to eliminate jurisdictional silos between 
          <strong className="text-white font-semibold"> Regulation Bureau (RB)</strong>, 
          <strong className="text-white font-semibold"> Public Grievance Redressal Cell (PGRC)</strong>, and Regional Offices.
        </p>

        {/* CTA Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <Button variant="primary" size="lg" icon={ArrowRight} className="bg-gov-600 hover:bg-gov-500 border-gov-500 shadow-md w-full sm:w-auto">
              Access Officer Portal
            </Button>
          </Link>
          <a href="#differentiator">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700">
              Explore Governance Architecture
            </Button>
          </a>
        </div>

        {/* Key Metrics / Highlights Strip */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 text-gov-400 mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Identity</span>
            </div>
            <div className="text-lg font-bold text-white">AICTE Permanent ID</div>
            <div className="text-xs text-slate-400 mt-0.5">Unified 360° campus dossier</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <GitFork className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Intelligence</span>
            </div>
            <div className="text-lg font-bold text-white">Cross-Bureau Overlap</div>
            <div className="text-xs text-slate-400 mt-0.5">TF-IDF & rule-based detection</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Integrity</span>
            </div>
            <div className="text-lg font-bold text-white">Human-in-the-Loop</div>
            <div className="text-xs text-slate-400 mt-0.5">Zero destructive auto-merging</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <ClockAlert className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">SLA Tracking</span>
            </div>
            <div className="text-lg font-bold text-white">Ageing & Overdue</div>
            <div className="text-xs text-slate-400 mt-0.5">Proactive timeline alerts</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
