import React, { useState, useEffect } from 'react';
import AlertReviewModal from './AlertReviewModal';
import LinkCasesModal from './LinkCasesModal';
import Modal from '../../components/common/Modal';

export function CaseIntelligencePage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classificationFilter, setClassificationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Benchmark metrics state
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);

  // Review & link modals state
  const [selectedAlertForReview, setSelectedAlertForReview] = useState(null);
  const [selectedAlertForLink, setSelectedAlertForLink] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('samadhanX_token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (classificationFilter) params.append('classification', classificationFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/v1/intelligence/alerts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch match alerts');
      setAlerts(data.data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBenchmark = async () => {
    try {
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch('/api/v1/intelligence/evaluation/benchmark', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBenchmarkData(data.data);
      }
    } catch (err) {
      console.warn('Could not load benchmark report:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchBenchmark();
  }, [classificationFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlerts();
  };

  const handleAlertReviewed = (updatedAlert) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === updatedAlert.id ? { ...a, ...updatedAlert } : a))
    );
  };

  const handleCasesLinked = () => {
    fetchAlerts();
  };

  const getClassificationBadge = (cls) => {
    switch (cls) {
      case 'POTENTIAL_OPERATIONAL_OVERLAP':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            Operational Overlap Alert
          </span>
        );
      case 'POTENTIALLY_RELATED_COMPLAINTS':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            Pattern Correlation
          </span>
        );
      case 'SAME_INSTITUTION':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            Same Institution History
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {cls}
          </span>
        );
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PENDING_REVIEW':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            Pending Human Review
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Confirmed
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cross-Bureau Case Intelligence Engine
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Explainable decision-support detecting concurrent investigations, allegation similarities, and multi-bureau operational overlaps.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBenchmarkModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Benchmark Quality Report
          </button>
        </div>
      </div>

      {/* Benchmark Summary Banner */}
      {benchmarkData && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg">
              AI
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                Pure Node.js TF-IDF Vector & Rule Engine Evaluation
              </div>
              <div className="text-sm font-medium text-slate-200 mt-0.5">
                Evaluated against {benchmarkData.totalTestPairs} labelled realistic multi-bureau test pairs
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-center">
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400">Precision</div>
              <div className="text-base font-bold text-emerald-400">{benchmarkData.metrics.precisionPercent}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400">Recall</div>
              <div className="text-base font-bold text-emerald-400">{benchmarkData.metrics.recallPercent}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400">F1-Score</div>
              <div className="text-base font-bold text-indigo-300">{benchmarkData.metrics.f1ScorePercent}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-slate-400">False-Positive Rate</div>
              <div className="text-base font-bold text-emerald-400">{benchmarkData.metrics.falsePositiveRatePercent}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search explanation text or case reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classifications</option>
              <option value="POTENTIAL_OPERATIONAL_OVERLAP">Operational Overlap Only</option>
              <option value="POTENTIALLY_RELATED_COMPLAINTS">Pattern Correlation Only</option>
              <option value="SAME_INSTITUTION">Same Institution Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Review Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DISMISSED">Dismissed</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Alerts Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <div>Loading cross-bureau intelligence alerts...</div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Intelligence Alerts Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            No cross-bureau overlaps match your search parameters. Run an intelligence scan from a complaint detail view to analyze active cases.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const ruleFlags = Array.isArray(alert.rule_flags) ? alert.rule_flags : [];
            const evidence = alert.evidence_breakdown || {};
            const textEv = evidence.textEvidence || {};
            const sharedTerms = textEv.sharedTerms || [];

            return (
              <div
                key={alert.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {getClassificationBadge(alert.relationship_classification)}
                    {getStatusBadge(alert.status)}
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Score: {(Number(alert.confidence_score) * 100).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Flagged: {new Date(alert.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Case Pair Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                  <div>
                    <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center justify-between">
                      <span>Source Case: {alert.source_case_id || 'Case A'}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-normal">{(alert.source_bureau || '').replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                      {alert.source_subject}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                      <span>Candidate Overlap: {alert.candidate_case_id || 'Case B'}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-normal">{(alert.candidate_bureau || '').replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                      {alert.candidate_subject}
                    </div>
                  </div>
                </div>

                {/* Narrative Explanation */}
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>{alert.explanation}</p>
                </div>

                {/* Rule flags and shared keywords */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {ruleFlags.map((flag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    >
                      {flag}
                    </span>
                  ))}
                  {sharedTerms.map((term, idx) => (
                    <span
                      key={`term-${idx}`}
                      className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900"
                    >
                      #{term}
                    </span>
                  ))}
                </div>

                {/* Footer action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {alert.reviewed_at ? (
                      <span>
                        Reviewed on {new Date(alert.reviewed_at).toLocaleDateString()}
                        {alert.decision_reason && ` — "${alert.decision_reason}"`}
                      </span>
                    ) : (
                      <span>Requires authorized officer verification</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedAlertForReview(alert)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 shadow-sm"
                    >
                      Review Decision
                    </button>
                    <button
                      onClick={() =>
                        setSelectedAlertForLink({
                          sourceComplaint: {
                            id: alert.source_complaint_id,
                            case_id: alert.source_case_id,
                            bureau: alert.source_bureau,
                            subject: alert.source_subject
                          },
                          candidateComplaint: {
                            id: alert.candidate_complaint_id,
                            case_id: alert.candidate_case_id,
                            bureau: alert.candidate_bureau,
                            subject: alert.candidate_subject
                          },
                          matchAlertId: alert.id
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      Link for Coordination
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedAlertForReview && (
        <AlertReviewModal
          alert={selectedAlertForReview}
          isOpen={Boolean(selectedAlertForReview)}
          onClose={() => setSelectedAlertForReview(null)}
          onReviewed={handleAlertReviewed}
        />
      )}

      {/* Case Link Modal */}
      {selectedAlertForLink && (
        <LinkCasesModal
          sourceComplaint={selectedAlertForLink.sourceComplaint}
          candidateComplaint={selectedAlertForLink.candidateComplaint}
          matchAlertId={selectedAlertForLink.matchAlertId}
          isOpen={Boolean(selectedAlertForLink)}
          onClose={() => setSelectedAlertForLink(null)}
          onLinked={handleCasesLinked}
        />
      )}

      {/* Benchmark Report Modal */}
      {benchmarkData && (
        <Modal
          isOpen={isBenchmarkModalOpen}
          onClose={() => setIsBenchmarkModalOpen(false)}
          title="Synthetic Benchmark Evaluation Dossier"
          size="lg"
        >
          <div className="space-y-5 text-slate-800 dark:text-slate-200">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Confusion Matrix (14 Multi-Bureau Test Scenarios)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">True Positives (TP)</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {benchmarkData.confusionMatrix.truePositives}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Genuine overlaps correctly flagged</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">False Positives (FP)</div>
                  <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {benchmarkData.confusionMatrix.falsePositives}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Disjoint cases incorrectly alerted</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">True Negatives (TN)</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {benchmarkData.confusionMatrix.trueNegatives}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Disjoint cases correctly identified</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">False Negatives (FN)</div>
                  <div className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {benchmarkData.confusionMatrix.falseNegatives}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Missed genuine overlaps</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Evaluated Test Scenarios
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {benchmarkData.caseResults.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{r.scenario}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {r.categoryType} • Score: {(Number(r.confidenceScore) * 100).toFixed(1)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 font-bold rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {r.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsBenchmarkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                Close Report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CaseIntelligencePage;
