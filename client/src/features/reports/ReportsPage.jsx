import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GitFork,
  RotateCcw,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import AlertBanner from '../../components/common/AlertBanner';
import EmptyState from '../../components/common/EmptyState';

const BUREAUS = [
  { value: '', label: 'All Bureaus / Cells' },
  { value: 'REGULATION_BUREAU', label: 'Regulation Bureau (RB)' },
  { value: 'PGRC', label: 'Public Grievance Redressal Cell (PGRC)' },
  { value: 'APPROVAL_BUREAU', label: 'Approval Bureau' },
  { value: 'REGIONAL_OFFICE', label: 'Regional Office' }
];

const REGIONS = [
  { value: '', label: 'All Regions' },
  { value: 'Northern', label: 'Northern Region' },
  { value: 'Western', label: 'Western Region' },
  { value: 'Southern', label: 'Southern Region' },
  { value: 'Eastern', label: 'Eastern Region' },
  { value: 'South-Western', label: 'South-Western Region' }
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'RECEIVED', label: 'Grievance Intake (Received)' },
  { value: 'VALIDATION_ASSIGNMENT', label: 'Validation & Assignment' },
  { value: 'UNDER_PROCESS', label: 'Under Process (Inquiry)' },
  { value: 'REVIEW_COORDINATION', label: 'Review & Coordination' },
  { value: 'CLOSURE_REQUESTED', label: 'Closure Review Requested' },
  { value: 'DISPOSED', label: 'Disposed / Closed' },
  { value: 'REOPENED', label: 'Authorized Reopened' }
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'FACULTY_GRIEVANCE', label: 'Faculty Grievance (Salaries/Norms)' },
  { value: 'CAPITATION_FEE', label: 'Capitation / Arbitrary Fee' },
  { value: 'INFRASTRUCTURE_DEFICIENCY', label: 'Infrastructure Deficiency' },
  { value: 'ADMISSION_IRREGULARITY', label: 'Admission Irregularity' },
  { value: 'RAGGING_HARASSMENT', label: 'Ragging & Harassment' },
  { value: 'GOVERNANCE_DISPUTE', label: 'Governance / Management' },
  { value: 'OTHER', label: 'General / Miscellaneous' }
];

export function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [query, setQuery] = useState('');
  const [bureau, setBureau] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Results State
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchResults = async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: targetPage,
        limit: 15
      });

      if (query.trim()) params.append('query', query.trim());
      if (bureau) params.append('bureau', bureau);
      if (region) params.append('region', region);
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (severity) params.append('severity', severity);
      if (overdueOnly) params.append('overdueOnly', 'true');
      if (linkedOnly) params.append('linkedOnly', 'true');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await apiClient.get(`/reports/search?${params.toString()}`);
      const payload = res?.success ? res.data : (res?.data?.success ? res.data.data : null);
      if (payload) {
        setItems(payload.items || []);
        setTotal(payload.total || 0);
        setPage(payload.page || 1);
        setTotalPages(payload.totalPages || 1);
      } else {
        setError(res?.error?.message || res?.data?.error?.message || 'Failed to search records.');
      }
    } catch (err) {
      console.error('[Reports] Search error:', err);
      setError(err.message || 'Network error querying reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(1);
  }, [bureau, region, status, category, severity, overdueOnly, linkedOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResults(1);
  };

  const handleResetFilters = () => {
    setQuery('');
    setBureau('');
    setRegion('');
    setStatus('');
    setCategory('');
    setSeverity('');
    setOverdueOnly(false);
    setLinkedOnly(false);
    setStartDate('');
    setEndDate('');
    fetchResults(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      if (bureau) params.append('bureau', bureau);
      if (region) params.append('region', region);
      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (severity) params.append('severity', severity);
      if (overdueOnly) params.append('overdueOnly', 'true');
      if (linkedOnly) params.append('linkedOnly', 'true');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const token = localStorage.getItem('samadhanX_token');
      const response = await fetch(`/api/v1/reports/export-csv?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });


      if (!response.ok) {
        throw new Error('Failed to generate CSV export.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `samadhanX_cases_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[Reports] Export error:', err);
      alert('Error exporting CSV report: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const renderSlaBadge = (item) => {
    const sla = item.slaStatus;
    if (!sla) return null;

    if (sla.isDisposed) {
      return (
        <Badge variant="success" size="sm" dot>
          Disposed (SLA Met)
        </Badge>
      );
    }

    if (sla.isOverdue) {
      return (
        <Badge variant="danger" size="sm" dot>
          OVERDUE ({sla.daysOverdue}d)
        </Badge>
      );
    }

    if (sla.slaState === 'APPROACHING_DEADLINE') {
      return (
        <Badge variant="warning" size="sm" dot>
          Due Soon ({sla.daysRemaining}d)
        </Badge>
      );
    }

    return (
      <Badge variant="neutral" size="sm">
        Within SLA ({sla.daysRemaining}d left)
      </Badge>
    );
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* 1. Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gov-700">
              Institutional Reporting Suite
            </span>
            <Badge variant="primary" size="sm">
              Scope-Aware
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Advanced Case Search & Export Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Query across AICTE case IDs, colleges, categories, and dynamic SLA deadlines with formula-injection protected CSV generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            isLoading={exporting}
            leftIcon={<Download className="w-4 h-4 text-slate-600" />}
          >
            Export Filtered CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/app/dashboard')}
            leftIcon={<Clock className="w-4 h-4" />}
          >
            Dashboard
          </Button>
        </div>
      </div>

      {/* 2. Multi-Criteria Filter Controls */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by Case ID (e.g. CMP-2026-RB), institution name, AICTE ID, or allegations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gov-600"
              />
            </div>
            <Button variant="primary" size="sm" type="submit">
              Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            </Button>
          </form>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1 text-xs">
            {/* Bureau */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Bureau / Cell
              </label>
              <select
                value={bureau}
                onChange={(e) => setBureau(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
              >
                {BUREAUS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
              >
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="STANDARD">Standard</option>
              </select>
            </div>

            {/* Quick Toggle Checkboxes */}
            <div className="flex flex-col justify-end space-y-1.5 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="rounded border-slate-300 text-gov-700 focus:ring-gov-600"
                />
                <span className="text-red-700 font-semibold">Overdue SLA Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={linkedOnly}
                  onChange={(e) => setLinkedOnly(e.target.checked)}
                  className="rounded border-slate-300 text-gov-700 focus:ring-gov-600"
                />
                <span className="text-purple-700 font-semibold">Cross-Bureau Linked</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Matching Case Records ({total})</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized records matching search criteria.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No Complaint Cases Found"
                description="No complaint records matched your active filter combination. Try adjusting or clearing your filters."
                actionLabel="Reset All Filters"
                onAction={handleResetFilters}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Case ID</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Bureau</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">SLA Deadline</th>
                    <th className="py-3 px-4 text-center">Coordination</th>
                    <th className="py-3 px-4 text-right">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/app/complaints/${item.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {item.severity === 'CRITICAL' && (
                            <span className="w-2 h-2 rounded-full bg-red-600" title="Critical Priority" />
                          )}
                          <span>{item.case_id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">{item.institution_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          AICTE: {item.aicte_permanent_id || 'PENDING'}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.bureau.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {item.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            item.status === 'DISPOSED' ? 'success' :
                              item.status === 'CLOSURE_REQUESTED' ? 'warning' :
                                item.status === 'REOPENED' ? 'danger' : 'primary'
                          }
                          size="sm"
                        >
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderSlaBadge(item)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.linkedCasesCount > 0 ? (
                          <Badge variant="neutral" size="sm" className="bg-purple-50 text-purple-700 border-purple-200">
                            <GitFork className="w-3 h-3 inline mr-1" />
                            {item.linkedCasesCount} linked
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(item.received_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <strong>{(page - 1) * 15 + 1}</strong> – <strong>{Math.min(page * 15, total)}</strong> of <strong>{total}</strong> records
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchResults(page - 1)}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <span className="px-2 font-mono font-medium">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchResults(page + 1)}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportsPage;
