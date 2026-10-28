import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, AlertCircle, ArrowLeft, Info } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import AlertBanner from '../../components/common/AlertBanner';
import Badge from '../../components/common/Badge';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('officer_rb');
  const [password, setPassword] = useState('Password@123');
  const [bureau, setBureau] = useState('REGULATION_BUREAU');
  const [noticeVisible, setNoticeVisible] = useState(true);

  const bureauOptions = [
    { value: 'REGULATION_BUREAU', label: 'Regulation Bureau (RB)' },
    { value: 'PGRC', label: 'Public Grievance Redressal Cell (PGRC)' },
    { value: 'APPROVAL_BUREAU', label: 'Approval Bureau' },
    { value: 'REGIONAL_OFFICE', label: 'Regional Office' },
    { value: 'ADMIN', label: 'System Administration' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Prompt 1 rule: Do not pretend authentication works before Prompt 2 implements it
    alert(
      'Notice: Prompt 1 establishes the design system and shell foundation. Interactive JWT session issuance, database-backed credential verification, and RBAC enforcement will be activated in Prompt 2.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left relative overflow-hidden">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Homepage</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <ShieldCheck className="w-6 h-6 text-gov-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">SAMADHAN</h1>
            <p className="text-xs text-slate-400">Authorized AICTE Officer Portal</p>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 border border-slate-200">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sign In to Workspace</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter authorized Bureau credentials</p>
            </div>
            <Badge variant="primary" size="sm">
              SIH26264
            </Badge>
          </div>

          {noticeVisible && (
            <AlertBanner
              variant="info"
              className="mb-6 text-xs"
              onDismiss={() => setNoticeVisible(false)}
            >
              <strong>Phase 1 Security Notice:</strong> Active credential authentication and backend JWT session issuance will be activated in <strong>Prompt 2</strong>. Direct unauthenticated bypass to internal case records is blocked.
            </AlertBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Designated Bureau / Role"
              id="bureau"
              value={bureau}
              onChange={(e) => setBureau(e.target.value)}
              options={bureauOptions}
              required
            />

            <Input
              label="Username / Official ID"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leadingIcon={User}
              placeholder="e.g. officer_rb"
              required
            />

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={Lock}
              placeholder="••••••••••••"
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" icon={Lock}>
                Sign In to Console
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Access is restricted strictly to authorized AICTE Regulation Bureau, PGRC, Regional Officers, and Administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
