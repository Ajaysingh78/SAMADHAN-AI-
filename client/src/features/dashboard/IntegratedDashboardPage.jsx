import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  GitFork,
  ShieldCheck,
  FileText,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import AlertBanner from '../../components/common/AlertBanner';

// Modern Visual Architecture Charts
import SlaHealthGauge from './components/SlaHealthGauge';
import CategoryDonutChart from './components/CategoryDonutChart';
import TrendAreaChart from './components/TrendAreaChart';
import BureauWorkloadBarChart from './components/BureauWorkloadBarChart';
import WorkflowFlowDiagram from './components/WorkflowFlowDiagram';

export function IntegratedDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/reports/metrics');
      if (res?.success) {
        setMetrics(res.data);
      } else if (res?.data?.success) {
        setMetrics(res.data.data);
      } else {
        setError(res?.error?.message || res?.data?.error?.message || 'Failed to load dashboard metrics.');
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching metrics:', err);
      setError(err.message || 'Network error retrieving analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-7xl mx-auto py-4">
        <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-44 bg-slate-900/10 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-72 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8 text-left">
        <AlertBanner variant="danger" title="Dashboard Data Error">
          {error || 'Unable to connect to reports service.'}
        </AlertBanner>
        <Button variant="secondary" onClick={fetchMetrics} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry Fetching Metrics
        </Button>
      </div>
    );
  }

  const { counters, distributions, topInstitutions, recentEscalations, recentActions, scope, meta } = metrics;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner & Scope Notice */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
              AICTE National Oversight Platform
            </span>
            <Badge variant="primary" size="sm">
              Phase 6 Enterprise
            </Badge>
            <Badge variant={scope.isFiltered ? 'warning' : 'success'} size="sm" dot>
              {scope.isFiltered ? `Jurisdiction: ${scope.jurisdiction}` : 'Apex Executive System Overview'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Integrated Operations & SLA Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Consolidated real-time institutional grievance tracking, explainable cross-bureau matching, and statutory SLA compliance monitoring across AICTE Cells.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          >
            Sync Live
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/app/reports')}
            leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600" />}
          >
            Reports & CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/workflow')}
            leftIcon={<BarChart3 className="w-3.5 h-3.5 text-white" />}
          >
            Workflow Manager
          </Button>
        </div>
      </div>

      {/* 2. Modern Visual Architecture Pipeline Flow */}
      <WorkflowFlowDiagram counters={counters} />

      {/* 3. Top-Level KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Cases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Cases</span>
            <FileText className="w-4 h-4 text-primary-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{counters.totalComplaints}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>In active scope</span>
          </div>
        </div>

        {/* Pending Scrutiny */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-700 font-mono">{counters.pendingCases}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Intake & Scrutiny</span>
          </div>
        </div>

        {/* Under Process */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Process</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-mono">{counters.underProcessCases}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Active Inquiry</span>
          </div>
        </div>

        {/* Overdue Cases */}
        <div className={`p-4 rounded-xl border shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5 ${
          counters.overdueCases > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Overdue SLA</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-700 font-mono">{counters.overdueCases}</div>
          <div className="text-[11px] text-red-600 mt-1 font-medium">
            <span>{counters.dueSoonCases} nearing target</span>
          </div>
        </div>

        {/* Disposed Cases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disposed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">{counters.disposedCases}</div>
          <div className="text-[11px] font-medium text-emerald-600 mt-1">
            <span>{counters.disposalRatePercentage}% resolution rate</span>
          </div>
        </div>

        {/* Cross-Bureau Linked */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Coordinated</span>
            <GitFork className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-mono">{counters.crossBureauLinkedCount}</div>
          <div className="text-[11px] text-purple-600 mt-1 font-medium">
            <span>{counters.pendingMatchReviewsCount} match reviews</span>
          </div>
        </div>
      </div>

      {/* 4. Advanced Visual Analytics Grid: Row 1 (SLA Gauge + Category Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <SlaHealthGauge
          totalCases={counters.totalComplaints}
          overdueCases={counters.overdueCases}
          dueSoonCases={counters.dueSoonCases}
          disposedCases={counters.disposedCases}
        />
        <CategoryDonutChart categoryBreakdown={distributions.categoryBreakdown} />
      </div>

      {/* 5. Advanced Visual Analytics Grid: Row 2 (Influx Trend + Bureau Multi-Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <TrendAreaChart
          totalCases={counters.totalComplaints}
          disposedCases={counters.disposedCases}
        />
        <BureauWorkloadBarChart
          bureauWorkload={distributions.bureauWorkload}
          totalComplaints={counters.totalComplaints}
        />
      </div>

      {/* 6. Institutional Hotspots & Critical Escalations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Institutional Complaint Volumes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Institutional Complaint Concentrations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutions with highest concurrent grievance volume across Bureaus.
                </p>
              </div>
              <Building2 className="w-4 h-4 text-primary-600" />
            </div>
          </CardHeader>
          <CardContent>
            {topInstitutions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No institutional complaint records found in current scope.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topInstitutions.map((inst, idx) => (
                  <div key={inst.institutionId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900 truncate">{inst.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 ml-7 mt-0.5">
                        <span className="font-mono">AICTE: {inst.aicteId}</span>
                        <span>•</span>
                        <span>{inst.region} Region</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="neutral" size="sm" className="font-bold">
                        {inst.count} {inst.count === 1 ? 'case' : 'cases'}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/institutions/${inst.institutionId}`)}
                        className="text-primary-700 hover:text-primary-900 p-1 hover:bg-slate-100 rounded"
                        title="Open 360° Institution Dossier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Escalations & Critical Inquiries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Urgent Escalations & Critical Cases</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cases elevated to CRITICAL priority requiring prioritized committee action.
                </p>
              </div>
              <Flame className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            {recentEscalations.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                No critical escalations currently active in this scope.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentEscalations.map(esc => (
                  <div
                    key={esc.id}
                    onClick={() => navigate(`/app/complaints/${esc.id}`)}
                    className="p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="danger" size="sm">
                          CRITICAL
                        </Badge>
                        <span className="font-mono font-bold text-slate-900">{esc.caseId}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-medium">{esc.bureau.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="font-medium text-slate-800 line-clamp-1">{esc.subject}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{esc.institutionName}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7. Recent Chronological Audit Trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Case Operations & Audit Trail</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Live stream of verifiable status transitions, transfers, and escalations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/workflow')}
              className="text-xs"
            >
              Full Operational Timeline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {recentActions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No recent actions recorded.</p>
            ) : (
              recentActions.map(action => (
                <div key={action.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="neutral" size="sm" className="font-mono text-[10px] flex-shrink-0">
                      {action.action_type}
                    </Badge>
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 mr-2">{action.case_id}</span>
                      <span className="text-slate-600">{action.remarks || 'Standard workflow progression'}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex-shrink-0 flex items-center gap-2">
                    <span>{action.performed_by_name || 'Officer'}</span>
                    <span>•</span>
                    <span>{new Date(action.performed_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IntegratedDashboardPage;
