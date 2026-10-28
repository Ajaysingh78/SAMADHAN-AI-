import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  ClockAlert, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  History, 
  GitBranch, 
  Building2,
  Calendar,
  Send,
  RefreshCw
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import AlertBanner from '../../components/common/AlertBanner';
import Skeleton from '../../components/common/Skeleton';

export function ComplaintDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Status transition modal
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [transitionRemarks, setTransitionRemarks] = useState('');

  // Officer assignment state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [officersList, setOfficersList] = useState([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cmpRes, timeRes] = await Promise.all([
        apiClient.get(`/complaints/${id}`),
        apiClient.get(`/complaints/${id}/timeline`)
      ]);

      if (cmpRes.success) {
        setComplaint(cmpRes.data);
      }
      if (timeRes.success) {
        setTimeline(timeRes.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: `Failed to load complaint: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await apiClient.get('/admin/users');
      if (res.success) {
        const officers = res.data.filter(u => u.role === 'BUREAU_OFFICER' || u.role === 'ADMIN');
        setOfficersList(officers);
      }
    } catch {
      // Optional if not admin
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
      fetchOfficers();
    }
  }, [id]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!targetStatus || !transitionRemarks.trim()) return;
    setIsTransitioning(true);
    setStatusMessage(null);

    try {
      const res = await apiClient.patch(`/complaints/${id}/status`, {
        newStatus: targetStatus,
        remarks: transitionRemarks
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: `Status successfully updated to '${targetStatus.replace('_', ' ')}'.`
        });
        setIsTransitionOpen(false);
        setTransitionRemarks('');
        fetchData();
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: err.message });
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    setIsAssigning(true);
    setStatusMessage(null);

    try {
      const res = await apiClient.patch(`/complaints/${id}/assign`, {
        officerId: selectedOfficerId,
        remarks: 'Officer reassigned via Case Detail Console.'
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: 'Handling officer updated successfully.'
        });
        setIsAssignOpen(false);
        fetchData();
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: err.message });
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertBanner variant="danger" title="Complaint Not Found">
          The requested complaint does not exist or you do not have permission to view it.
        </AlertBanner>
        <div className="mt-4">
          <Link to="/app/complaints">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to Complaints List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Legal transitions based on current status
  const getPossibleTransitions = (current) => {
    switch (current) {
      case 'RECEIVED':
        return [
          { value: 'VALIDATION_ASSIGNMENT', label: 'Move to Validation & Assignment' },
          { value: 'DISPOSED', label: 'Dispose / Summary Rejection' }
        ];
      case 'VALIDATION_ASSIGNMENT':
        return [
          { value: 'UNDER_PROCESS', label: 'Initiate Formal Inquiry (Under Process)' },
          { value: 'RECEIVED', label: 'Return to Received for Clarification' }
        ];
      case 'UNDER_PROCESS':
        return [
          { value: 'REVIEW_COORDINATION', label: 'Request Cross-Bureau Review & Coordination' },
          { value: 'DISPOSED', label: 'Mark Disposed / Compliance Undertaken' }
        ];
      case 'REVIEW_COORDINATION':
        return [
          { value: 'UNDER_PROCESS', label: 'Resume Under Process' },
          { value: 'DISPOSED', label: 'Dispose Case' }
        ];
      case 'DISPOSED':
        return [
          { value: 'REOPENED', label: 'Authorized Reopen with Audit Justification' }
        ];
      case 'REOPENED':
        return [
          { value: 'UNDER_PROCESS', label: 'Move to Under Process' },
          { value: 'DISPOSED', label: 'Dispose Case' }
        ];
      default:
        return [];
    }
  };

  const possibleTransitions = getPossibleTransitions(complaint.status);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Navigation */}
      <div>
        <Link to="/app/complaints" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-gov-700 transition-colors mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Complaints Queue</span>
        </Link>
      </div>

      {statusMessage && (
        <AlertBanner variant={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
          {statusMessage.message}
        </AlertBanner>
      )}

      {/* Case Header Dossier */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-lg text-gov-800 bg-gov-50 border border-gov-200 px-3 py-0.5 rounded">
                {complaint.case_id}
              </span>
              <Badge
                variant={complaint.bureau === 'REGULATION_BUREAU' ? 'primary' : 'warning'}
                size="sm"
              >
                {complaint.bureau === 'REGULATION_BUREAU' ? 'Regulation Bureau' : complaint.bureau}
              </Badge>
              <Badge variant="neutral" size="sm">
                {complaint.category.replace('_', ' ')}
              </Badge>
              <Badge
                variant={complaint.severity === 'CRITICAL' ? 'danger' : complaint.severity === 'HIGH' ? 'warning' : 'neutral'}
                size="sm"
              >
                {complaint.severity} Severity
              </Badge>
            </div>

            <h1 className="text-xl font-bold text-slate-900 pt-2 tracking-tight">
              {complaint.subject}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Campus: </span>
              <Link to={`/app/institutions/${complaint.institution_id}`} className="font-semibold text-gov-700 hover:underline">
                {complaint.institution_name} ({complaint.aicte_permanent_id || 'ID Pending'})
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={UserCheck}
              onClick={() => setIsAssignOpen(true)}
            >
              Assign Officer
            </Button>

            {possibleTransitions.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                icon={GitBranch}
                onClick={() => {
                  setTargetStatus(possibleTransitions[0]?.value || '');
                  setIsTransitionOpen(true);
                }}
              >
                Update Case Status
              </Button>
            )}
          </div>
        </div>

        {/* Detailed Metadata Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Current Status</span>
            <span className="font-semibold text-slate-800 text-sm">{complaint.status.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Assigned Dealing Officer</span>
            <span className="font-semibold text-slate-800 text-sm">
              {complaint.assigned_officer_name || 'Unassigned Scrutiny Pool'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Date Received</span>
            <span className="font-semibold text-slate-800 text-sm">{complaint.received_date}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">SLA Target Resolution</span>
            <span className="font-semibold text-slate-800 text-sm">{complaint.expected_disposal_date}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Narrative Description */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Narrative</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">
                  Complainant Category
                </span>
                <span className="font-semibold text-slate-800">{complaint.complainant_type}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1">
                  Verified Statement
                </span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200 whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Chronological Action Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chronological Action History & Audit Log</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immutable sequence of regulatory orders, status transitions, and committee notices.
                  </p>
                </div>
                <Badge variant="primary" size="sm">
                  {timeline.length} Actions
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No actions logged yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {timeline.map((act) => (
                    <div key={act.id} className="relative group text-left">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-gov-600 group-hover:scale-125 transition-transform" />
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <span className="font-bold text-slate-900 uppercase tracking-wide">
                            {act.action_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(act.performed_at).toLocaleString()}
                          </span>
                        </div>

                        {act.previous_status && act.new_status && (
                          <div className="text-[11px] text-gov-800 font-medium">
                            Status transition: <span className="font-mono">{act.previous_status}</span> → <span className="font-mono font-bold">{act.new_status}</span>
                          </div>
                        )}

                        <p className="text-xs text-slate-700 pt-0.5">
                          {act.remarks}
                        </p>

                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                          Recorded by: <span className="font-semibold text-slate-700">{act.performed_by_name || 'System / Officer'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Transition Modal */}
      <Modal
        isOpen={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        title="Execute Workflow State Transition"
        description="Select the next allowed status in the AICTE grievance lifecycle and record mandatory findings."
      >
        <form onSubmit={handleStatusChange} className="space-y-4 text-left">
          <Select
            label="Target Workflow Status"
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
            options={possibleTransitions}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Remarks & Justification <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={3}
              value={transitionRemarks}
              onChange={(e) => setTransitionRemarks(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-gov-600"
              placeholder="Enter official rationale, notice dispatch reference, committee decision, or resolution summary..."
              required
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsTransitionOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isTransitioning}>
              Confirm Transition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Officer Assignment Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Assign Dealing Scrutiny Officer"
        description="Allocate this case to an authorized Bureau or Regulation Officer for inquiry."
      >
        <form onSubmit={handleAssignOfficer} className="space-y-4 text-left">
          <Select
            label="Assigned Officer"
            value={selectedOfficerId}
            onChange={(e) => setSelectedOfficerId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned / Return to General Pool' },
              ...officersList.map(o => ({
                value: o.id,
                label: `${o.full_name} (${o.username} • ${o.primary_bureau || o.role})`
              }))
            ]}
          />

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isAssigning}>
              Update Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ComplaintDetailPage;
