import React from 'react';
import { ShieldCheck, Lock, UserCheck2, FileText, Database } from 'lucide-react';
import Card, { CardContent } from '../../../components/common/Card';

export function SecuritySection() {
  return (
    <section id="safeguards" className="py-16 bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-400">
            Security & Public Sector Governance
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Built with Enterprise Guardrails & Scoped Access
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Complaints often contain sensitive whistleblower statements or commercial data. samadhanX implements strict least-privilege scoping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-850 p-6 rounded-lg border border-slate-700/80 space-y-3">
            <div className="w-10 h-10 rounded-md bg-slate-800 text-gov-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Bureau-Scoped Authorization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bureau officers can only inspect and act upon complaints within their jurisdiction. Cross-bureau investigative remarks remain masked until an authorized link is approved.
            </p>
          </div>

          <div className="bg-slate-850 p-6 rounded-lg border border-slate-700/80 space-y-3">
            <div className="w-10 h-10 rounded-md bg-slate-800 text-amber-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Immutable Audit Logging</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every status update, case link, alert dismissal, and document dispatch is recorded with user identity, timestamp, and client IP in an append-only audit register.
            </p>
          </div>

          <div className="bg-slate-850 p-6 rounded-lg border border-slate-700/80 space-y-3">
            <div className="w-10 h-10 rounded-md bg-slate-800 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Synthetic Sandbox Integrity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with SIH prototype rules, this beta demonstrates capabilities solely on verified synthetic records without connecting to unconfirmed live government networks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SecuritySection;
