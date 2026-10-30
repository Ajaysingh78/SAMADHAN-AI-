import React, { useState } from 'react';
import Modal from '../../components/common/Modal';

export function AlertReviewModal({ alert, isOpen, onClose, onReviewed }) {
  const [status, setStatus] = useState('CONFIRMED');
  const [decisionReason, setDecisionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!alert) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decisionReason || decisionReason.trim().length < 5) {
      setError('Please provide a substantive decision reason (minimum 5 characters).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('samadhanX_token');
      const res = await fetch(`/api/v1/intelligence/alerts/${alert.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          decisionReason: decisionReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to record decision');
      }

      onReviewed(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const evidence = alert.evidence_breakdown || {};
  const textEv = evidence.textEvidence || {};
  const sharedTerms = textEv.sharedTerms || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Cross-Bureau Intelligence Alert" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-200">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
              Source Case
            </span>
            <h4 className="font-semibold text-base mt-2 text-slate-900 dark:text-white">
              {alert.source_case_id || 'Case A'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bureau: <span className="font-medium text-slate-700 dark:text-slate-300">{(alert.source_bureau || '').replace(/_/g, ' ')}</span>
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 font-medium">
              {alert.source_subject || 'Allegation subject'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
              Candidate Overlap Case
            </span>
            <h4 className="font-semibold text-base mt-2 text-slate-900 dark:text-white">
              {alert.candidate_case_id || 'Case B'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bureau: <span className="font-medium text-slate-700 dark:text-slate-300">{(alert.candidate_bureau || '').replace(/_/g, ' ')}</span>
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 font-medium">
              {alert.candidate_subject || 'Allegation subject'}
            </p>
          </div>
        </div>

        {/* Evidence Highlights */}
        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300">
            Explainable Decision-Support Evidence
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
            {alert.explanation}
          </p>
          {sharedTerms.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">Key Overlapping Terms:</span>
              {sharedTerms.map((term, i) => (
                <span key={i} className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-md">
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Decision Action Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Human Review Decision
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('CONFIRMED')}
              className={`p-3 rounded-lg border text-left transition-all ${status === 'CONFIRMED'
                  ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <div className="font-semibold text-sm">Confirm Relationship</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify that these complaints represent genuine related allegations or operational overlap.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatus('DISMISSED')}
              className={`p-3 rounded-lg border text-left transition-all ${status === 'DISMISSED'
                  ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <div className="font-semibold text-sm">Dismiss Match</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deem this candidate false-positive or operationally disjoint.
              </div>
            </button>
          </div>
        </div>

        {/* Reason capture */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Official Reason & Decision Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="3"
            required
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
            placeholder="Document official findings and rationale for confirming or dismissing this intelligence signal..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm"
          >
            {loading ? 'Recording Decision...' : 'Submit Official Review'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AlertReviewModal;
