import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-gov-400" />
              <span>SAMADHAN</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Cross-Bureau Case Intelligence & Coordination Platform engineered for Smart India Hackathon 2026 (SIH26264). 
              Provides single-source-of-truth monitoring, explainable cross-bureau overlap detection, and traceable administrative coordination across AICTE cells.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] text-amber-300">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>SIH 2026 Prototype • Synthetic Data Demonstration Only</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">
              Key Capabilities
            </h4>
            <ul className="space-y-2">
              <li>Unified Institution 360° Profile</li>
              <li>Explainable Case Intelligence</li>
              <li>Cross-Bureau Overlap Alerts</li>
              <li>Chronological Action History</li>
              <li>SLA Overdue Analytics</li>
            </ul>
          </div>

          {/* Target Stakeholders */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">
              Target Bureaus & Roles
            </h4>
            <ul className="space-y-2">
              <li>Regulation Bureau (RB)</li>
              <li>Public Grievance Redressal Cell (PGRC)</li>
              <li>Approval Bureau</li>
              <li>Regional Offices / Centres</li>
              <li>Senior AICTE Leadership</li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 SAMADHAN Team. All rights reserved.</p>
          <p>
            Independent Academic & Hackathon Innovation Project. Not an official AICTE deployment.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;
