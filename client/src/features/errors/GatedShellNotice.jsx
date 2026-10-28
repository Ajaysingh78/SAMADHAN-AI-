import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, KeyRound } from 'lucide-react';
import Button from '../../components/common/Button';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export function GatedShellNotice({ title = 'Module Gated for Phase 2' }) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-left">
      <Card className="border-t-4 border-t-amber-500 shadow-sm">
        <CardContent className="p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="warning" size="sm">
                  Access Guard Active
                </Badge>
                <span className="text-xs text-slate-500 font-mono">Acceptance Criterion 2</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{title}</h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            In accordance with the <strong>SAMADHAN Master Foundation Rules</strong>, internal operational dashboards, 
            complaint case registries, and cross-bureau intelligence are protected and will not be displayed unauthenticated.
          </p>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-gov-600" />
              <span>Target Implementation Roadmap</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>Prompt 2:</strong> JWT Authentication, RBAC middleware, secure user seeds, and session guards.</li>
              <li><strong>Prompt 3:</strong> Institution Registry & Complaint Case Management.</li>
              <li><strong>Prompt 4:</strong> Explainable Cross-Bureau Case Intelligence.</li>
              <li><strong>Prompt 5:</strong> Chronological Action Timeline & Overdue Reminders.</li>
              <li><strong>Prompt 6:</strong> Role-aware Operational Dashboard & Analytics.</li>
            </ul>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Link to="/">
              <Button variant="primary" icon={ArrowLeft}>
                Return to Public Homepage
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" icon={Lock}>
                View Officer Sign-In Portal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GatedShellNotice;
