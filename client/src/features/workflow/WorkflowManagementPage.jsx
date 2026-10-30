import React, { useState, useEffect } from 'react';
import { History, ArrowRightLeft, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck, Clock, FileText, Send, Settings, Check } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

export function WorkflowManagementPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);

  // Transfer form
  const [destBureau, setDestBureau] = useState('PGRC');
  const [transferReason, setTransferReason] = useState('');

  // Escalate form
  const [escalateReason, setEscalateReason] = useState('');

  // Transition form
  const [targetStatus, setTargetStatus] = useState('UNDER_PROCESS');
  const [transitionRemarks, setTransitionRemarks] = useState('');

  // Reopen form
  const [reopenReason, setReopenReason] = useState('');

  // Action status feedback
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // SLA Cron Scanner state
  const [slaScanResult, setSlaScanResult] = useState(null);
  const [slaScanning, setSlaScanning] = useState(false);

  // Workflow Config state
  const [workflowConfig, setWorkflowConfig] = useState({});
  const [configSaving, setConfigSaving] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch('/api/v1/complaints?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setComplaints(data.data || []);
        if (data.data && data.data.length > 0 && !selectedComplaint) {
          setSelectedComplaint(data.data[0]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (complaintId) => {
    if (!complaintId) return;
    try {
      setTimelineLoading(true);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch(`/api/v1/workflow/complaints/${complaintId}/actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTimeline(data.data.actions || []);
      }
    } catch (err) {
      console.warn('Could not fetch timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch('/api/v1/workflow/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWorkflowConfig(data.data || {});
      }
    } catch (err) {
      console.warn('Could not fetch config:', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (selectedComplaint) {
      fetchTimeline(selectedComplaint.id);
    }
  }, [selectedComplaint]);

  const handleRunSlaScan = async () => {
    try {
      setSlaScanning(true);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch('/api/v1/workflow/cron/check-slas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSlaScanResult(data.data);
      }
    } catch (err) {
      console.error('Error running SLA scan:', err);
    } finally {
      setSlaScanning(false);
    }
  };

  const handleToggleClosureReview = async () => {
    try {
      setConfigSaving(true);
      const token = localStorage.getItem('samadhanX_token');
      const currentVal = workflowConfig.REQUIRE_CLOSURE_REVIEW === 'true';
      const newVal = (!currentVal).toString();

      const res = await fetch('/api/v1/workflow/config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          key: 'REQUIRE_CLOSURE_REVIEW',
          value: newVal
        })
      });

      if (res.ok) {
        setWorkflowConfig(prev => ({ ...prev, REQUIRE_CLOSURE_REVIEW: newVal }));
      }
    } catch (err) {
      console.error('Error saving config:', err);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionSubmitting(true);
      setActionError(null);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch(`/api/v1/workflow/complaints/${selectedComplaint.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destinationBureau: destBureau,
          transferReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Transfer failed');

      setActionSuccess(data.message);
      setIsTransferModalOpen(false);
      setTransferReason('');
      fetchComplaints();
      fetchTimeline(selectedComplaint.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionSubmitting(true);
      setActionError(null);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch(`/api/v1/workflow/complaints/${selectedComplaint.id}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          escalationReason: escalateReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Escalation failed');

      setActionSuccess(data.message);
      setIsEscalateModalOpen(false);
      setEscalateReason('');
      fetchComplaints();
      fetchTimeline(selectedComplaint.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleTransitionSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionSubmitting(true);
      setActionError(null);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch(`/api/v1/workflow/complaints/${selectedComplaint.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newStatus: targetStatus,
          remarks: transitionRemarks
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Transition failed');

      setActionSuccess(data.message);
      setIsTransitionModalOpen(false);
      setTransitionRemarks('');
      fetchComplaints();
      fetchTimeline(selectedComplaint.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionSubmitting(true);
      setActionError(null);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch(`/api/v1/workflow/complaints/${selectedComplaint.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          newStatus: 'REOPENED',
          remarks: reopenReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Reopening failed');

      setActionSuccess(data.message);
      setIsReopenModalOpen(false);
      setReopenReason('');
      fetchComplaints();
      fetchTimeline(selectedComplaint.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionSubmitting(false);
    }
  };

  const getActionBadgeColor = (actionType) => {
    switch (actionType) {
      case 'CASE_TRANSFERRED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200';
      case 'CASE_ESCALATED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200';
      case 'CASE_DISPOSED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
      case 'CASE_REOPENED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
      case 'CASE_COORDINATION_LINKED':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200';
      case 'CLOSURE_REVIEW_REQUESTED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operational Workflow & Action History
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Traceable case transitions, cross-bureau transfers, priority escalations, and automated SLA reminder monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunSlaScan}
            disabled={slaScanning}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            <Clock className={`w-4 h-4 ${slaScanning ? 'animate-spin' : ''}`} />
            {slaScanning ? 'Scanning Active Cases...' : 'Trigger SLA Deadline Scan'}
          </button>
        </div>
      </div>

      {/* Global Alerts / Feedback */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* SLA Cron Scan Banner */}
      {slaScanResult && (
        <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Scheduled SLA Due-Date Scan Results
              </div>
              <div className="text-sm text-slate-300">
                Processed {slaScanResult.scannedCount} active cases across all AICTE Bureaus
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-slate-400">Overdue Alerts</div>
              <div className="text-base font-bold text-rose-400">{slaScanResult.overdueAlertsCreated}</div>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-slate-400">Due Soon Reminders</div>
              <div className="text-base font-bold text-amber-400">{slaScanResult.dueSoonAlertsCreated}</div>
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-slate-400">Deduplicated (Past 24h)</div>
              <div className="text-base font-bold text-blue-400">{slaScanResult.deduplicatedCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Case Selector & Action Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Selector & Actions */}
        <div className="space-y-4 lg:col-span-1">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Complaints Queue
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {complaints.map((c) => {
                const isSelected = selectedComplaint?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{c.case_id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {c.bureau.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1 truncate font-medium">
                      {c.subject}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Status: <strong className="text-slate-700 dark:text-slate-300">{c.status}</strong></span>
                      <span className={c.severity === 'CRITICAL' ? 'text-rose-600 font-bold' : ''}>{c.severity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions for Selected Case */}
          {selectedComplaint && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lifecycle Operations: {selectedComplaint.case_id}
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => setIsTransitionModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Advance Case Status
                </button>

                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  Transfer to Another Bureau
                </button>

                <button
                  onClick={() => setIsEscalateModalOpen(true)}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Escalate Case Priority
                </button>

                {selectedComplaint.status === 'DISPOSED' && (
                  <button
                    onClick={() => setIsReopenModalOpen(true)}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    Authorized Reopen
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Workflow Config Card (System Admin) */}
          {user?.role === 'ADMIN' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Settings className="w-4 h-4 text-slate-500" />
                Workflow Policies (Admin)
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Require Closure Review</div>
                  <div className="text-[11px] text-slate-500">Require Senior Official approval before disposal</div>
                </div>
                <button
                  onClick={handleToggleClosureReview}
                  disabled={configSaving}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${workflowConfig.REQUIRE_CLOSURE_REVIEW === 'true'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  {workflowConfig.REQUIRE_CLOSURE_REVIEW === 'true' ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Case Action Timeline */}
        <div className="lg:col-span-2">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Chronological Action History
                </h2>
              </div>
              {selectedComplaint && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedComplaint.case_id}
                </span>
              )}
            </div>

            {timelineLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading action history...</div>
            ) : timeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Select a case to inspect its chronological action history.
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 py-2">
                {timeline.map((action, idx) => (
                  <div key={action.id || idx} className="relative pl-6">
                    {/* Timeline bullet icon */}
                    <div className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getActionBadgeColor(action.action_type)}`}>
                          {action.action_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(action.performed_at).toLocaleString()}
                        </span>
                      </div>

                      {action.previous_status && action.new_status && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          Status Transition: <strong className="text-slate-800 dark:text-slate-200">{action.previous_status}</strong> → <strong className="text-blue-600 dark:text-blue-400">{action.new_status}</strong>
                        </div>
                      )}

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        {action.remarks}
                      </p>

                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span>Actor: <strong>{action.performed_by_name || action.performed_by || 'Authorized Officer'}</strong></span>
                        {action.document_reference && (
                          <span>Doc Ref: {action.document_reference}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && selectedComplaint && (
        <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title={`Transfer Case: ${selectedComplaint.case_id}`}>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Destination Bureau
              </label>
              <select
                value={destBureau}
                onChange={(e) => setDestBureau(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="REGULATION_BUREAU">Regulation Bureau (RB)</option>
                <option value="PGRC">Public Grievance Redressal Cell (PGRC)</option>
                <option value="APPROVAL_BUREAU">Approval Bureau</option>
                <option value="REGIONAL_OFFICE">Regional Office</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transfer Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Explain why jurisdiction should be transferred to this bureau (minimum 10 characters)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                {actionSubmitting ? 'Transferring...' : 'Execute Transfer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Escalate Modal */}
      {isEscalateModalOpen && selectedComplaint && (
        <Modal isOpen={isEscalateModalOpen} onClose={() => setIsEscalateModalOpen(false)} title={`Escalate Case: ${selectedComplaint.case_id}`}>
          <form onSubmit={handleEscalateSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
              Escalating sets the priority to <strong>CRITICAL</strong> and dispatches an urgent alert to Senior Officials.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Escalation Ground & Urgency Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Document critical safety, legal, or policy urgency (minimum 10 characters)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {actionSubmitting ? 'Escalating...' : 'Confirm Escalation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Advance Status Modal */}
      {isTransitionModalOpen && selectedComplaint && (
        <Modal isOpen={isTransitionModalOpen} onClose={() => setIsTransitionModalOpen(false)} title={`Advance Status: ${selectedComplaint.case_id}`}>
          <form onSubmit={handleTransitionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="UNDER_PROCESS">Under Process</option>
                <option value="REVIEW_COORDINATION">Review & Coordination</option>
                <option value="DISPOSED">Disposed / Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Substantive Remarks / Resolution Findings <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={transitionRemarks}
                onChange={(e) => setTransitionRemarks(e.target.value)}
                placeholder="Document official findings or inquiry actions taken (minimum 5 characters)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTransitionModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                {actionSubmitting ? 'Advancing...' : 'Submit Status Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reopen Modal */}
      {isReopenModalOpen && selectedComplaint && (
        <Modal isOpen={isReopenModalOpen} onClose={() => setIsReopenModalOpen(false)} title={`Authorize Reopening: ${selectedComplaint.case_id}`}>
          <form onSubmit={handleReopenSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
              Reopening a closed complaint restores its active lifecycle and requires Senior Official or Administrator authorization.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reopening Justification & New Facts <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="State fresh evidence or legal grounds for reopening (minimum 10 characters)..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                {actionSubmitting ? 'Reopening...' : 'Authorize Reopening'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default WorkflowManagementPage;
