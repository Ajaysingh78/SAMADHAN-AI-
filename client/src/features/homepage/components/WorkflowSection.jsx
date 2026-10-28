import React from 'react';
import { FileInput, Cpu, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';

export function WorkflowSection() {
  const steps = [
    {
      step: '01',
      icon: FileInput,
      title: 'Ingestion & Identity Resolution',
      desc: 'Complaints received via manual registration or validated CSV batches are mapped to the college’s unique AICTE Permanent ID.'
    },
    {
      step: '02',
      icon: Cpu,
      title: 'Automated Overlap Detection',
      desc: 'Case Intelligence evaluates candidate cases in active bureaus (RB vs PGRC) using exact IDs, category rules, and TF-IDF semantic similarity.'
    },
    {
      step: '03',
      icon: UserCheck,
      title: 'Authorized Officer Scrutiny',
      desc: 'Dealing officers review side-by-side evidence and confirm link, request joint committee review, or dismiss alert with mandatory reasons.'
    },
    {
      step: '04',
      icon: ShieldAlert,
      title: 'Coordinated Disposal & Audit',
      desc: 'Both bureaus progress cases with full visibility. Actions, show-cause notices, and timeline status are recorded in an immutable audit log.'
    }
  ];

  return (
    <section id="workflow" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-gov-700">
          Operational Lifecycle
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          How SAMADHAN Coordinates Action
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          A closed-loop, accountable workflow ensuring no grievance falls through bureaucratic cracks or triggers redundant inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm relative space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-200 font-mono">
                  {s.step}
                </span>
                <div className="w-9 h-9 rounded-md bg-gov-50 text-gov-700 flex items-center justify-center border border-gov-100">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900 pt-1">
                {s.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default WorkflowSection;
