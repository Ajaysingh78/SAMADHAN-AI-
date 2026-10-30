import React from 'react';
import {
  FilePlus2,
  Cpu,
  GitCompare,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export function WorkflowFlowDiagram({ counters = {} }) {
  const steps = [
    {
      id: 1,
      title: 'Intake & Scrutiny',
      statusKey: 'RECEIVED',
      count: counters.pendingCases || 0,
      icon: FilePlus2,
      color: 'border-sky-300 bg-sky-50/80 text-sky-700',
      badgeColor: 'bg-sky-100 text-sky-800',
      description: 'AICTE ID lookup & CSV ingestion'
    },
    {
      id: 2,
      title: 'AI Intelligence Match',
      statusKey: 'VALIDATION',
      count: counters.pendingMatchReviewsCount || 0,
      icon: Cpu,
      color: 'border-purple-300 bg-purple-50/80 text-purple-700',
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'TF-IDF candidate overlap detection'
    },
    {
      id: 3,
      title: 'Coordinated Inquiry',
      statusKey: 'UNDER_PROCESS',
      count: counters.underProcessCases || 0,
      icon: GitCompare,
      color: 'border-indigo-300 bg-indigo-50/80 text-indigo-700',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      description: 'Cross-bureau committee investigation'
    },
    {
      id: 4,
      title: 'Supervisor 4-Eyes Gate',
      statusKey: 'REVIEW',
      count: counters.dueSoonCases || 0,
      icon: ShieldCheck,
      color: 'border-amber-300 bg-amber-50/80 text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Closure review & SLA adherence audit'
    },
    {
      id: 5,
      title: 'Disposal & Audit Trail',
      statusKey: 'DISPOSED',
      count: counters.disposedCases || 0,
      icon: CheckCircle2,
      color: 'border-emerald-300 bg-emerald-50/80 text-emerald-700',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Immutable record & resolution notice'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              System Architecture Flow
            </span>
            <span className="text-xs text-slate-400">SIH26264 Core Pipeline</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            AICTE Cross-Bureau Case Coordination Pipeline
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
            Traceable 5-stage lifecycle ensuring multi-cell complaints are linked, analyzed, and audited without duplicate effort.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-800/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Total Pipeline Cases:</span>
          <span className="text-white font-bold">{counters.totalComplaints || 0}</span>
        </div>
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-3.5">
        {steps.map((step, idx) => {
          const IconComponent = step.icon;
          return (
            <div key={step.id} className="relative group flex flex-col">
              <div
                className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between h-full bg-slate-800/60 border-slate-700/80 hover:border-primary-500/50`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      STAGE 0{step.id}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${step.badgeColor}`}>
                      {step.count} Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-white/10 text-white shrink-0">
                      <IconComponent className="w-4 h-4 text-amber-300" />
                    </div>
                    <h4 className="font-bold text-xs text-white leading-tight">
                      {step.title}
                    </h4>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                    {step.description}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Audit Logged</span>
                  <span className="text-emerald-400 font-semibold">Active ✓</span>
                </div>
              </div>

              {/* Connecting arrow for larger screens */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-500">
                  <ArrowRight className="w-4 h-4 text-slate-500/70" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorkflowFlowDiagram;
