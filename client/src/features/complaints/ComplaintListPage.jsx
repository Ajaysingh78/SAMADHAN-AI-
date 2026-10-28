import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  ArrowRight, 
  ClockAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import AlertBanner from '../../components/common/AlertBanner';

export function ComplaintListPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [bureauFilter, setBureauFilter] = useState(
    user?.role === 'BUREAU_OFFICER' ? user.primaryBureau : (searchParams.get('bureau') || '')
  );
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const institutionIdParam = searchParams.get('institutionId') || '';

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    institutionId: '',
    bureau: user?.primaryBureau || 'REGULATION_BUREAU',
    category: 'CAPITATION_FEE',
    severity: 'STANDARD',
    complainantType: 'STUDENT',
    subject: '',
    description: '',
    receivedDate: new Date().toISOString().split('T')[0],
    slaDays: 30
  });

  // CSV Import Wizard State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [isParsingPreview, setIsParsingPreview] = useState(false);
  const [isCommittingImport, setIsCommittingImport] = useState(false);

  const fetchInstitutionsList = async () => {
    try {
      const res = await apiClient.get('/institutions?limit=50');
      if (res.success) {
        setInstitutions(res.data);
        if (res.data.length > 0 && !newComplaint.institutionId) {
          setNewComplaint(prev => ({ ...prev, institutionId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.warn('Could not load institution list for picker:', err.message);
    }
  };

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchTerm) q.append('search', searchTerm);
      if (bureauFilter) q.append('bureau', bureauFilter);
      if (statusFilter) q.append('status', statusFilter);
      if (categoryFilter) q.append('category', categoryFilter);
      if (institutionIdParam) q.append('institutionId', institutionIdParam);

      const res = await apiClient.get(`/complaints?${q.toString()}`);
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: `Failed to load complaints: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutionsList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, bureauFilter, statusFilter, categoryFilter, institutionIdParam]);

  const handleRegisterComplaint = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    setStatusMessage(null);

    try {
      const res = await apiClient.post('/complaints', newComplaint);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: `Complaint '${res.data.case_id}' registered successfully in ${res.data.bureau}.`
        });
        setIsRegisterOpen(false);
        setNewComplaint({
          institutionId: institutions[0]?.id || '',
          bureau: user?.primaryBureau || 'REGULATION_BUREAU',
          category: 'CAPITATION_FEE',
          severity: 'STANDARD',
          complainantType: 'STUDENT',
          subject: '',
          description: '',
          receivedDate: new Date().toISOString().split('T')[0],
          slaDays: 30
        });
        fetchComplaints();
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: err.message });
    } finally {
      setIsRegistering(false);
    }
  };

  // Sample CSV Template Generator
  const loadSampleCsv = () => {
    const sample = `aictePermanentId,bureau,category,severity,complainantType,subject,description
1-109283741,REGULATION_BUREAU,CAPITATION_FEE,HIGH,STUDENT,"Capitation fee demand for lab access","Students asked to pay cash penalty of Rs 15000 before accessing hardware lab."
1-283910294,REGULATION_BUREAU,FACULTY_GRIEVANCE,CRITICAL,FACULTY,"Withholding of faculty salaries","Assistant professors report arbitrary termination and non-payment."
1-384910295,REGULATION_BUREAU,INFRASTRUCTURE_DEFICIT,STANDARD,PARENT,"Inadequate library computer systems","Computers in campus digital library are non-operational."`;
    setCsvText(sample);
  };

  const handlePreviewCsv = async () => {
    if (!csvText.trim()) return;
    setIsParsingPreview(true);
    setPreviewResult(null);

    try {
      // Parse CSV text into rows
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV must contain a header row and at least one data row.');

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        // Simple regex to handle quoted commas
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const rowObj = {};
        headers.forEach((h, idx) => {
          let val = values[idx] ? values[idx].trim() : '';
          val = val.replace(/^"|"$/g, '').trim();
          rowObj[h] = val;
        });
        parsedRows.push(rowObj);
      }

      const res = await apiClient.post('/complaints/import/preview', { rows: parsedRows });
      if (res.success) {
        setPreviewResult(res.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: `CSV Parsing error: ${err.message}` });
    } finally {
      setIsParsingPreview(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewResult || !previewResult.summary.canCommit) return;
    setIsCommittingImport(true);

    try {
      const rowsToCommit = previewResult.preview.map(p => ({
        institutionId: p.resolvedInstitution.id,
        bureau: p.data.bureau,
        category: p.data.category,
        severity: p.data.severity,
        complainantType: p.data.complainantType,
        subject: p.data.subject,
        description: p.data.description,
        receivedDate: p.data.receivedDate
      }));

      const res = await apiClient.post('/complaints/import/commit', {
        rows: rowsToCommit,
        confirm: true
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          message: `Batch import complete: ${res.data.totalImported} cases registered into central database.`
        });
        setIsImportOpen(false);
        setCsvText('');
        setPreviewResult(null);
        fetchComplaints();
      }
    } catch (err) {
      setStatusMessage({ type: 'danger', message: err.message });
    } finally {
      setIsCommittingImport(false);
    }
  };

  const getSlaBadge = (sla) => {
    if (!sla) return null;
    if (sla.isDisposed) {
      return <Badge variant="success" size="sm">Disposed</Badge>;
    }
    if (sla.isOverdue) {
      return (
        <Badge variant="danger" size="sm" dot>
          Overdue ({sla.daysOverdue}d)
        </Badge>
      );
    }
    if (sla.slaState === 'APPROACHING_DEADLINE') {
      return (
        <Badge variant="warning" size="sm" dot>
          {sla.daysRemaining}d left
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        {sla.daysRemaining}d left
      </Badge>
    );
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gov-700">Case Intake & Scrutiny</span>
            <Badge variant="primary" size="sm">
              {user?.role === 'BUREAU_OFFICER' ? `${user.primaryBureau} Queue` : 'All AICTE Bureaus'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Complaint Case Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of institutional grievances, regulatory show-cause notices, and SLA timelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => setIsImportOpen(true)}
          >
            Import CSV Batch
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsRegisterOpen(true)}
          >
            Register Complaint
          </Button>
        </div>
      </div>

      {statusMessage && (
        <AlertBanner variant={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
          {statusMessage.message}
        </AlertBanner>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by Case ID, Subject, Institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leadingIcon={Search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bureau filter (disabled if user is Bureau Officer) */}
          <Select
            value={bureauFilter}
            onChange={(e) => setBureauFilter(e.target.value)}
            disabled={user?.role === 'BUREAU_OFFICER'}
            options={[
              { value: '', label: 'All Bureaus / Cells' },
              { value: 'REGULATION_BUREAU', label: 'Regulation Bureau' },
              { value: 'PGRC', label: 'PGRC' },
              { value: 'APPROVAL_BUREAU', label: 'Approval Bureau' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'VALIDATION_ASSIGNMENT', label: 'Validation & Assignment' },
              { value: 'UNDER_PROCESS', label: 'Under Process' },
              { value: 'REVIEW_COORDINATION', label: 'Review & Coordination' },
              { value: 'DISPOSED', label: 'Disposed / Closed' },
              { value: 'REOPENED', label: 'Reopened' },
            ]}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'CAPITATION_FEE', label: 'Capitation Fee' },
              { value: 'FACULTY_GRIEVANCE', label: 'Faculty Grievance' },
              { value: 'INFRASTRUCTURE_DEFICIT', label: 'Infrastructure Deficit' },
              { value: 'EXAMINATION_MALPRACTICE', label: 'Exam Malpractice' },
              { value: 'RAGGING', label: 'Ragging' },
            ]}
          />

          <Button variant="secondary" size="md" onClick={fetchComplaints} title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Complaints Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5 text-left">Case ID & Institution</th>
                <th className="px-6 py-3.5 text-left">Bureau</th>
                <th className="px-6 py-3.5 text-left">Category & Subject</th>
                <th className="px-6 py-3.5 text-left">Received Date</th>
                <th className="px-6 py-3.5 text-left">Status</th>
                <th className="px-6 py-3.5 text-left">SLA Countdown</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gov-600" />
                    <span>Loading case records...</span>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No complaints found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or register a new case.</p>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-gov-800">{c.case_id}</div>
                      <div className="text-[11px] text-slate-600 truncate max-w-xs">{c.institution_name}</div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={c.bureau === 'REGULATION_BUREAU' ? 'primary' : 'warning'}
                        size="sm"
                      >
                        {c.bureau === 'REGULATION_BUREAU' ? 'Regulation' : c.bureau}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 max-w-md truncate">{c.subject}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{c.category.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                      {c.received_date}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        c.status === 'DISPOSED' ? 'text-emerald-700' :
                        c.status === 'UNDER_PROCESS' ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          c.status === 'DISPOSED' ? 'bg-emerald-500' :
                          c.status === 'UNDER_PROCESS' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {getSlaBadge(c.sla)}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right">
                      <Link to={`/app/complaints/${c.id}`}>
                        <Button variant="outline" size="sm" icon={ArrowRight}>
                          Details & Timeline
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register Complaint Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Technical Institution Complaint"
        description="Log a verified grievance or regulatory proceeding against an approved campus."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRegisterComplaint} className="space-y-3 text-left">
          <Select
            label="Target Technical Institution"
            value={newComplaint.institutionId}
            onChange={(e) => setNewComplaint({ ...newComplaint, institutionId: e.target.value })}
            options={institutions.map(i => ({
              value: i.id,
              label: `${i.name} (ID: ${i.aicte_permanent_id || 'Pending'})`
            }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assigned AICTE Bureau"
              value={newComplaint.bureau}
              onChange={(e) => setNewComplaint({ ...newComplaint, bureau: e.target.value })}
              disabled={user?.role === 'BUREAU_OFFICER'}
              options={[
                { value: 'REGULATION_BUREAU', label: 'Regulation Bureau (RB)' },
                { value: 'PGRC', label: 'Public Grievance Redressal Cell (PGRC)' },
                { value: 'APPROVAL_BUREAU', label: 'Approval Bureau' },
              ]}
              required
            />

            <Select
              label="Grievance Category"
              value={newComplaint.category}
              onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
              options={[
                { value: 'CAPITATION_FEE', label: 'Capitation / Mandatory Fee' },
                { value: 'FACULTY_GRIEVANCE', label: 'Faculty Salary / Resignation' },
                { value: 'INFRASTRUCTURE_DEFICIT', label: 'Lab & Infrastructure Deficit' },
                { value: 'EXAMINATION_MALPRACTICE', label: 'Exam Malpractice' },
                { value: 'RAGGING', label: 'Ragging Complaint' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Complainant Type"
              value={newComplaint.complainantType}
              onChange={(e) => setNewComplaint({ ...newComplaint, complainantType: e.target.value })}
              options={[
                { value: 'STUDENT', label: 'Student' },
                { value: 'FACULTY', label: 'Faculty Member' },
                { value: 'PARENT', label: 'Parent / Guardian' },
                { value: 'CITIZEN', label: 'Citizen / Stakeholder' },
                { value: 'ANONYMOUS', label: 'Confidential / Whistleblower' },
              ]}
              required
            />

            <Select
              label="Severity"
              value={newComplaint.severity}
              onChange={(e) => setNewComplaint({ ...newComplaint, severity: e.target.value })}
              options={[
                { value: 'STANDARD', label: 'Standard Priority' },
                { value: 'HIGH', label: 'High Priority' },
                { value: 'CRITICAL', label: 'Critical / Urgent Notice' },
              ]}
              required
            />
          </div>

          <Input
            label="Subject / Matter of Inquiry"
            value={newComplaint.subject}
            onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
            placeholder="e.g. Demand for Rs 25,000 unapproved fee prior to semester exam admit cards"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Complaint Narrative <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={4}
              value={newComplaint.description}
              onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-gov-600 focus:border-gov-600"
              placeholder="State the facts, dates, academic departments, and specific regulatory violations..."
              required
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isRegistering}>
              Register Case
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Batch Import Wizard Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Validated CSV Batch Import Wizard"
        description="Safely import verified complaint records with automatic duplicate detection and identity resolution."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4 text-left">
          {!previewResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Paste Raw CSV Content
                </span>
                <button
                  type="button"
                  onClick={loadSampleCsv}
                  className="text-xs text-gov-700 font-semibold hover:underline"
                >
                  Load Sample Batch Template
                </button>
              </div>

              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="aictePermanentId,bureau,category,severity,complainantType,subject,description..."
                className="w-full font-mono text-xs border border-slate-300 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-gov-600"
              />

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                <strong>Validation Safeguard:</strong> Rows are checked for valid technical institutions, duplicate Case IDs, and mandatory fields prior to any database write.
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <Button variant="secondary" onClick={() => setIsImportOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePreviewCsv}
                  disabled={!csvText.trim() || isParsingPreview}
                  isLoading={isParsingPreview}
                  icon={ArrowRight}
                >
                  Validate & Preview Rows
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Validation Report: </span>
                  <span>{previewResult.summary.totalRows} rows evaluated. </span>
                  <span className="text-emerald-700 font-bold">{previewResult.summary.validRows} Valid. </span>
                  <span className="text-rose-700 font-bold">{previewResult.summary.invalidRows} Invalid.</span>
                </div>
                <Badge variant={previewResult.summary.canCommit ? 'success' : 'danger'}>
                  {previewResult.summary.canCommit ? 'Ready to Commit' : 'Errors Must Be Fixed'}
                </Badge>
              </div>

              {/* Preview Table */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-semibold uppercase text-[10px] text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Row #</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Resolved College</th>
                      <th className="px-3 py-2 text-left">Subject</th>
                      <th className="px-3 py-2 text-left">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {previewResult.preview.map((p) => (
                      <tr key={p.rowNumber} className={p.isValid ? '' : 'bg-rose-50/50'}>
                        <td className="px-3 py-2 font-mono">{p.rowNumber}</td>
                        <td className="px-3 py-2">
                          {p.isValid ? (
                            <Badge variant="success" size="sm">Valid</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">Error</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 truncate max-w-xs">
                          {p.resolvedInstitution?.name || <span className="text-rose-600 font-mono">Unresolved</span>}
                        </td>
                        <td className="px-3 py-2 truncate max-w-xs">{p.data.subject}</td>
                        <td className="px-3 py-2 text-[11px] text-rose-600">
                          {p.errors.join('; ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setPreviewResult(null)}>
                  Edit CSV Content
                </Button>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsImportOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!previewResult.summary.canCommit || isCommittingImport}
                    isLoading={isCommittingImport}
                    onClick={handleCommitImport}
                    icon={Upload}
                  >
                    Commit {previewResult.summary.validRows} Records
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ComplaintListPage;
