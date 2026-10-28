import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft, Plus, ShieldCheck, MapPin, Calendar, FileText, CheckCircle2, ClockAlert, AlertCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import AlertBanner from '../../components/common/AlertBanner';

export function InstitutionDossierPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchDossier() {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/institutions/${id}`);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load institution 360° dossier.');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchDossier();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <AlertBanner variant="danger" title="Dossier Unavailable">
          {errorMessage || 'Institution details could not be found.'}
        </AlertBanner>
        <div className="mt-4">
          <Link to="/app/institutions">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to Institution Registry
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { institution, metrics, complaintHistory } = data;

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div>
        <Link to="/app/institutions" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-gov-700 transition-colors mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Institution Registry</span>
        </Link>
      </div>

      {/* Campus 360 Header Profile */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                AICTE Permanent Master
              </Badge>
              {institution.identity_flag === 'VERIFIED' ? (
                <Badge variant="success" size="sm" dot>Verified AICTE ID</Badge>
              ) : (
                <Badge variant="warning" size="sm" dot>{institution.identity_flag}</Badge>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {institution.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{institution.address}, {institution.city}, {institution.state} - {institution.pin_code}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="font-semibold text-slate-700 uppercase">
                {institution.region} Region
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">AICTE Permanent ID</div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {institution.aicte_permanent_id || 'NOT_ASSIGNED'}
              </div>
            </div>

            <Link to={`/app/complaints?institutionId=${institution.id}`}>
              <Button variant="secondary" size="sm" icon={FileText}>
                Filter All Cases
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Breakdown Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-gov-700">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Cases Filed</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalComplaints}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all AICTE Bureaus</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active / Under Scrutiny</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{metrics.activeComplaints}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Currently unresolved</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Regulation Bureau (RB)</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.bureauBreakdown.REGULATION_BUREAU}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Regulatory & Show-Cause</div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">PGRC Cell</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.bureauBreakdown.PGRC}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Public & Student Grievances</div>
        </Card>
      </div>

      {/* Consolidated 360-Degree Cross-Bureau Case History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consolidated Complaint & Inquiry History</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified cross-bureau record of all complaints logged against {institution.name}.
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Single Source of Truth
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5 text-left">Case ID</th>
                  <th className="px-6 py-3.5 text-left">Handling Bureau</th>
                  <th className="px-6 py-3.5 text-left">Category & Subject</th>
                  <th className="px-6 py-3.5 text-left">Received Date</th>
                  <th className="px-6 py-3.5 text-left">Current Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {complaintHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                      No complaints or show-cause inquiries recorded for this technical institution.
                    </td>
                  </tr>
                ) : (
                  complaintHistory.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 whitespace-nowrap font-mono font-bold text-gov-800">
                        {c.case_id}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={c.bureau === 'REGULATION_BUREAU' ? 'primary' : 'warning'}
                          size="sm"
                        >
                          {c.bureau === 'REGULATION_BUREAU' ? 'Regulation Bureau' : c.bureau}
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
                      <td className="px-6 py-3.5 whitespace-nowrap text-right">
                        <Link to={`/app/complaints/${c.id}`}>
                          <Button variant="outline" size="sm">
                            Inspect Case
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InstitutionDossierPage;
