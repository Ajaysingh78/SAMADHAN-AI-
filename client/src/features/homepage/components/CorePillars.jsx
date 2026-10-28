import React from 'react';
import { Building, Sparkles, History, BarChart3, Search, ShieldCheck } from 'lucide-react';
import Card, { CardContent } from '../../../components/common/Card';

export function CorePillars() {
  const pillars = [
    {
      icon: Building,
      title: 'Centralized Institution 360° Profile',
      tag: 'Identity Resolution',
      description: 'Resolves technical institutions via their unique AICTE Permanent ID, maintaining an immutable chronological registry of all past and current complaints, regulatory inspections, and approval statuses.'
    },
    {
      icon: Sparkles,
      title: 'Explainable Cross-Bureau Intelligence',
      tag: 'Core Innovation',
      description: 'Lightweight Node.js TF-IDF vectorization and cosine similarity combined with deterministic category and institution matching to flag potential duplicate proceedings with transparent evidence cards.'
    },
    {
      icon: History,
      title: 'End-to-End Traceable Action History',
      tag: 'Accountability',
      description: 'Every status transition, show-cause notice, inquiry committee hearing, and case-linking decision is timestamped and attributed to the dealing officer and bureau in an immutable audit trail.'
    },
    {
      icon: BarChart3,
      title: 'Proactive SLA & Workload Analytics',
      tag: 'Executive Visibility',
      description: 'Automated 30-day resolution tracking with color-coded ageing indicators (Normal, Approaching Due Date, Overdue). Regional heatmaps and bureau workload metrics for Senior AICTE Officials.'
    }
  ];

  return (
    <section id="overview" className="py-16 bg-slate-100/70 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-700">
            System Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Engineered to Solve Regulatory Fragmentation
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Addressing the lack of real-time visibility across independent AICTE cells to prevent conflicting directives and eliminate repetitive investigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gov-50 text-gov-700 flex items-center justify-center flex-shrink-0 border border-gov-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gov-700 bg-gov-100/60 px-2 py-0.5 rounded">
                          {pillar.tag}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 pt-1">
                        {pillar.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CorePillars;
