import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, AlertTriangle, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import AlertBanner from '../../components/common/AlertBanner';

export function RoleWorkspaceHome() {
  const { user } = useAuth();
  const [scopeTestResult, setScopeTestResult] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState('');

  const testEndpoint = async (endpoint, label) => {
    setTestingEndpoint(endpoint);
    setScopeTestResult(null);

    try {
      const res = await apiClient.get(endpoint);
      setScopeTestResult({
        success: true,
        endpoint: label,
        data: res.data
      });
    } catch (err) {
      setScopeTestResult({
        success: false,
        endpoint: label,
        error: err
      });
    } finally {
      setTestingEndpoint('');
    }
  };

  const getRoleDescription = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'System Administrator with full access to user management, account provisioning, security audit logs, and global platform configuration.';
      case 'BUREAU_OFFICER':
        return `Dealing Officer for ${user.primaryBureau || 'Assigned Bureau'}. Authorized to scrutinize cases, review cross-bureau overlap alerts, and manage institutional complaints within this jurisdiction.`;
      case 'REGIONAL_OFFICER':
        return `Regional Officer assigned to the ${user.region || 'Assigned'} Region. Authorized to inspect and follow up on regional technical institutions and assigned inquiries.`;
      case 'SENIOR_OFFICIAL':
        return 'Senior AICTE Official / Executive Leadership. Granted overarching cross-bureau visibility, SLA compliance oversight, and conflict escalation review.';
      default:
        return 'Authorized platform user.';
    }
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gov-700">
              Authenticated Session
            </span>
            <Badge variant="success" size="sm" dot>
              JWT Active & Verified
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            {getRoleDescription()}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-400 font-mono text-[10px]">USERNAME</div>
            <div className="font-semibold text-slate-800">{user?.username}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="text-slate-400 font-mono text-[10px]">JURISDICTION</div>
            <div className="font-semibold text-slate-800">{user?.primaryBureau || user?.region || 'ALL'}</div>
          </div>
        </div>
      </div>

      {/* Scope Proof & Security Verification Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backend Scope Verification Suite</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Test and verify backend RBAC and bureau-scoping enforcement live against the Express API.
              </p>
            </div>
            <Badge variant="primary" size="sm">
              Live API Probe
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-600">
            Click any protected endpoint below to test how the backend evaluates your current token (<strong>{user?.role}</strong>):
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              isLoading={testingEndpoint === '/cases/rb-scoped'}
              onClick={() => testEndpoint('/cases/rb-scoped', 'Regulation Bureau Scope (/cases/rb-scoped)')}
            >
              Test Regulation Bureau (RB) Endpoint
            </Button>

            <Button
              variant="secondary"
              size="sm"
              isLoading={testingEndpoint === '/cases/pgrc-scoped'}
              onClick={() => testEndpoint('/cases/pgrc-scoped', 'PGRC Scope (/cases/pgrc-scoped)')}
            >
              Test PGRC Endpoint
            </Button>

            <Button
              variant="secondary"
              size="sm"
              isLoading={testingEndpoint === '/cases/oversight'}
              onClick={() => testEndpoint('/cases/oversight', 'Executive Oversight (/cases/oversight)')}
            >
              Test Senior Oversight Endpoint
            </Button>
          </div>

          {/* Test Feedback Box */}
          {scopeTestResult && (
            <div className="pt-2">
              {scopeTestResult.success ? (
                <AlertBanner variant="success" title={`Authorized (200 OK): ${scopeTestResult.endpoint}`}>
                  <p>{scopeTestResult.data.message}</p>
                  <div className="text-[11px] font-mono mt-1 opacity-90">
                    Jurisdiction validated: {JSON.stringify(scopeTestResult.data)}
                  </div>
                </AlertBanner>
              ) : (
                <AlertBanner
                  variant="danger"
                  title={`Access Denied (${scopeTestResult.error.status} ${scopeTestResult.error.code}): ${scopeTestResult.endpoint}`}
                >
                  <p>{scopeTestResult.error.message}</p>
                  <div className="text-[11px] font-mono mt-1 opacity-90">
                    Backend rejection enforced: Your assigned role/bureau ({user?.role} / {user?.primaryBureau || 'None'}) lacks jurisdiction.
                  </div>
                </AlertBanner>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phased Roadmap Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-gov-600">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Phase 2 Verified Capabilities</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Backend-enforced JWT signing & verification (HMAC-SHA256).</li>
              <li>Bcrypt password verification with constant-time non-enumeration.</li>
              <li>Deactivated account rejection & rate limiting.</li>
              <li>Backend-backed session revocation upon logout.</li>
              <li>Bureau and regional scoping middleware.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Next: Phase 3 Prerequisites Ready</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              With authenticated sessions and bureau scoping verified, the foundation is primed for 
              <strong> Institution Registry & Complaint Case Management (Phase 3)</strong>, including AICTE Permanent ID resolution and validated CSV imports.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RoleWorkspaceHome;
