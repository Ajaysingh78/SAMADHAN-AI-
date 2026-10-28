import React, { useState } from 'react';
import Modal from '../../components/common/Modal';

export function LinkCasesModal({ sourceComplaint, candidateComplaint, matchAlertId, isOpen, onClose, onLinked }) {
  const [linkType, setLinkType] = useState('CROSS_BUREAU_COORDINATION');
  const [linkReason, setLinkReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!sourceComplaint || !candidateComplaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!linkReason || linkReason.trim().length < 10) {
      setError('Please provide a substantive coordination justification (minimum 10 characters).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('samadhan_token');
      const res = await fetch('/api/v1/intelligence/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceComplaintId: sourceComplaint.id,
          targetComplaintId: candidateComplaint.id,
          matchAlertId: matchAlertId || null,
          linkType,
          linkReason: linkReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to establish case coordination link.');
      }

      onLinked(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Establish Cross-Bureau Coordination Link" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-200">
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {/* Governance Guarantee Banner */}
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs leading-relaxed">
          <div className="font-semibold text-sm flex items-center gap-1.5 mb-1">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Independent Record Integrity Guarantee
          </div>
          Linking these cases creates a synchronized cross-bureau coordination relationship. It does <strong>NOT</strong> merge records, transfer jurisdiction, or alter either case’s independent lifecycle status or accountability timeline.
        </div>

        {/* Cases Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Case</div>
            <div className="font-bold text-slate-900 dark:text-white mt-1">{sourceComplaint.case_id}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{sourceComplaint.bureau.replace(/_/g, ' ')}</div>
            <div className="text-xs text-slate-700 dark:text-slate-300 mt-2 truncate font-medium">{sourceComplaint.subject}</div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coordinated Case</div>
            <div className="font-bold text-slate-900 dark:text-white mt-1">{candidateComplaint.case_id}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{candidateComplaint.bureau.replace(/_/g, ' ')}</div>
            <div className="text-xs text-slate-700 dark:text-slate-300 mt-2 truncate font-medium">{candidateComplaint.subject}</div>
          </div>
        </div>

        {/* Link Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Coordination Relationship Type
          </label>
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="CROSS_BUREAU_COORDINATION">Cross-Bureau Coordination (Simultaneous Bureau Inquiries)</option>
            <option value="COMMON_INSTITUTION_CORRELATION">Common Institution Correlation (Systemic College Pattern)</option>
            <option value="POLICY_SYSTEMIC_ISSUE">Policy & Regulatory Issue (National Norm Violation)</option>
          </select>
        </div>

        {/* Justification */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Linking Justification & Shared Investigation Strategy <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="3"
            required
            value={linkReason}
            onChange={(e) => setLinkReason(e.target.value)}
            placeholder="Explain why joint cross-bureau visibility is required for these two complaints (minimum 10 characters)..."
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
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
          >
            {loading ? 'Creating Coordination Link...' : 'Establish Official Link'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default LinkCasesModal;
