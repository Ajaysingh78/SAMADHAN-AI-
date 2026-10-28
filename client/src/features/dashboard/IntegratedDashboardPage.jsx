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
  ArrowUpRight,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import AlertBanner from '../../components/common/AlertBanner';

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
      if (res.data?.success) {
        setMetrics(res.data.data);
      } else {
        setError(res.data?.error?.message || 'Failed to load dashboard metrics.');
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
        <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-72 bg-slate-100 rounded-lg animate-pulse" />
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
  const isSuperUser = user?.role === 'ADMIN' || user?.role === 'SENIOR_OFFICIAL';

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner & Scope Notice */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gov-700">
              AICTE Beta Intelligence Platform
            </span>
            <Badge variant="primary" size="sm">
              Phase 6 Integrated
            </Badge>
            <Badge variant={scope.isFiltered ? 'warning' : 'success'} size="sm" dot>
              {scope.isFiltered ? `Scoped: ${scope.jurisdiction}` : 'Executive System Overview'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Integrated Operations & SLA Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Consolidated real-time case tracking, SLA compliance monitoring, and cross-bureau coordination intelligence across AICTE Bureaus.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          >
            Sync Data
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/app/reports')}
            leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600" />}
          >
            Advanced Search
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

      {/* Demonstration Data Alert Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Demonstration Prototype Environment:</strong> Metrics reflect real database queries over synthetic benchmark cases. AICTE SLA thresholds are configurable demo policies.
          </span>
        </div>
        <span className="text-[11px] font-mono text-amber-700 flex-shrink-0">
          Last Synced: {new Date(meta.generatedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* 2. Top-Level KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Cases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Cases</span>
            <FileText className="w-4 h-4 text-gov-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{counters.totalComplaints}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>In current jurisdiction</span>
          </div>
        </div>

        {/* Pending Scrutiny */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-700">{counters.pendingCases}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Intake & assignment</span>
          </div>
        </div>

        {/* Under Process */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Process</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700">{counters.underProcessCases}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Active inquiry</span>
          </div>
        </div>

        {/* Overdue Cases */}
        <div className={`p-4 rounded-xl border shadow-2xs hover:shadow-sm transition-shadow ${
          counters.overdueCases > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700">Overdue SLA</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-700">{counters.overdueCases}</div>
          <div className="text-[11px] text-red-600 mt-1 font-medium">
            <span>{counters.dueSoonCases} due within 3 days</span>
          </div>
        </div>

        {/* Disposed Cases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disposed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{counters.disposedCases}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium text-emerald-600">
            <span>{counters.disposalRatePercentage}% resolution rate</span>
          </div>
        </div>

        {/* Cross-Bureau Linked */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coordinated</span>
            <GitFork className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">{counters.crossBureauLinkedCount}</div>
          <div className="text-[11px] text-purple-600 mt-1 font-medium">
            <span>{counters.pendingMatchReviewsCount} pending review</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Analysis: Bureau Workload & Ageing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bureau Workload Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bureau & Cell Workload Distribution</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time inquiry allocation across AICTE handling divisions.
                </p>
              </div>
              <Badge variant="outline" size="sm">
                Live Counts
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(distributions.bureauWorkload).map(([bureauKey, data]) => {
              const formattedName = bureauKey.replace(/_/g, ' ');
              const percentage = counters.totalComplaints > 0
                ? Math.round((data.total / counters.totalComplaints) * 100)
                : 0;

              return (
                <div key={bureauKey} className="space-y-1.5 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{formattedName}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500">Pending: <strong>{data.pending}</strong></span>
                      <span className="text-indigo-600">Active: <strong>{data.underProcess}</strong></span>
                      <span className="text-emerald-600">Disposed: <strong>{data.disposed}</strong></span>
                      {data.overdue > 0 && (
                        <span className="text-red-600 font-bold">Overdue: {data.overdue}</span>
                      )}
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Total: {data.total} ({percentage}%)
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden flex">
                    <div
                      className="bg-sky-500 h-full"
                      style={{ width: `${data.total > 0 ? (data.pending / data.total) * 100 : 0}%` }}
                      title={`Pending: ${data.pending}`}
                    />
                    <div
                      className="bg-indigo-500 h-full"
                      style={{ width: `${data.total > 0 ? (data.underProcess / data.total) * 100 : 0}%` }}
                      title={`Under Process: ${data.underProcess}`}
                    />
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${data.total > 0 ? (data.disposed / data.total) * 100 : 0}%` }}
                      title={`Disposed: ${data.disposed}`}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Pending Intake
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Active Inquiry
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Disposed
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Case Ageing Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Case Ageing Distribution</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Elapsed time since complaint registration.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">&lt; 15 Days (Fresh Intake)</span>
                  <span className="font-semibold text-slate-900">{distributions.ageingDistribution.under15Days}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${counters.totalComplaints > 0 ? (distributions.ageingDistribution.under15Days / counters.totalComplaints) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">15 – 30 Days (Active Review)</span>
                  <span className="font-semibold text-slate-900">{distributions.ageingDistribution.between15And30Days}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full"
                    style={{
                      width: `${counters.totalComplaints > 0 ? (distributions.ageingDistribution.between15And30Days / counters.totalComplaints) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">30 – 60 Days (Approaching SLA)</span>
                  <span className="font-semibold text-slate-900">{distributions.ageingDistribution.between30And60Days}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${counters.totalComplaints > 0 ? (distributions.ageingDistribution.between30And60Days / counters.totalComplaints) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">&gt; 60 Days (Requires Escalation)</span>
                  <span className="font-semibold text-red-600">{distributions.ageingDistribution.over60Days}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full"
                    style={{
                      width: `${counters.totalComplaints > 0 ? (distributions.ageingDistribution.over60Days / counters.totalComplaints) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gov-600" /> SLA Governance Notice
              </div>
              <p className="text-[11px] leading-relaxed">
                Standard grievances target 30-day disposal. Inquiries exceeding 60 days are automatically surfaced for Senior Official review.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Institutional Hotspots & Critical Escalations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Institutional Complaint Volumes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Institutional Complaint Concentrations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutions with highest concurrent grievance volume across all Bureaus.
                </p>
              </div>
              <Building2 className="w-4 h-4 text-gov-600" />
            </div>
          </CardHeader>
          <CardContent>
            {topInstitutions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No institutional complaint records found.</p>
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
                        onClick={() => navigate(`/app/institutions/${inst.institutionId}`)}
                        className="text-gov-700 hover:text-gov-900 p-1 hover:bg-slate-100 rounded"
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
                No critical escalations currently active.
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

      {/* 5. Recent Chronological Timeline Actions */}
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
              View Full Timeline
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
