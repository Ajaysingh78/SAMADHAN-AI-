import React from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, Layers, ArrowRight } from 'lucide-react';
import Card, { CardContent } from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';

export function GovernanceCard() {
  return (
    <section id="differentiator" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <Badge variant="primary" className="mb-3">
          Primary SIH Architectural Differentiator
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Three Distinct Concepts — Never Conflated
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Generic service desks dangerously auto-merge tickets. In government technical regulation, 
          conflating independent grievances can compromise legal proceedings and complainant confidentiality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Concept 1 */}
        <Card className="border-t-4 border-t-gov-600 bg-white">
          <CardContent className="space-y-4">
            <div className="w-10 h-10 rounded-md bg-gov-50 text-gov-700 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Same Institution</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Resolved via AICTE Permanent ID</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multiple complaints filed against the same college (e.g. a student fee grievance and an independent faculty resignation grievance) may be completely valid and entirely unrelated.
            </p>
            <div className="p-3 bg-slate-50 rounded text-xs text-slate-700 border border-slate-200">
              <strong>System Action:</strong> Mapped to the same institution 360° timeline; handled independently without merging.
            </div>
          </CardContent>
        </Card>

        {/* Concept 2 */}
        <Card className="border-t-4 border-t-amber-500 bg-white">
          <CardContent className="space-y-4">
            <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Related Complaints</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Evidence-Backed Semantic Relationship</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multiple students reporting identical capitation fee collection or multiple faculty reporting uncredited provident funds for the same department semester.
            </p>
            <div className="p-3 bg-amber-50/60 rounded text-xs text-amber-900 border border-amber-200">
              <strong>System Action:</strong> Match engine surfaces evidence keywords for authorized officer review and joint notice coordination.
            </div>
          </CardContent>
        </Card>

        {/* Concept 3 */}
        <Card className="border-t-4 border-t-rose-600 bg-white">
          <CardContent className="space-y-4">
            <div className="w-10 h-10 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Operational Overlap</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Cross-Bureau Concurrent Inquiries</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Regulation Bureau (RB)</strong> is initiating show-cause proceedings while <strong>PGRC</strong> is actively hearing an identical complaint for the same college.
            </p>
            <div className="p-3 bg-rose-50/60 rounded text-xs text-rose-900 border border-rose-200">
              <strong>System Action:</strong> Critical Overlap Alert dispatched to both bureau officers to prevent contradictory directives.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Banner */}
      <div className="mt-8 p-4 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Decision-Support Guarantee:</strong> Match scores never auto-close, auto-merge, or reassign cases. Linked complaints preserve distinct IDs, ownership, and audit trails.
          </span>
        </div>
        <span className="font-mono text-gov-300 text-xs flex-shrink-0">
          Zero Data Destruction
        </span>
      </div>
    </section>
  );
}

export default GovernanceCard;
