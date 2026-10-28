import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowLeft, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AlertBanner from '../../components/common/AlertBanner';
import Badge from '../../components/common/Badge';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [username, setUsername] = useState('officer_rb');
  const [password, setPassword] = useState('Password@123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Target route to redirect after login
  const from = location.state?.from?.pathname || '/app';

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-left relative overflow-hidden">
      {/* Background Pattern */}
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
            <p className="text-xs text-slate-400">AICTE Case Intelligence & Governance Portal</p>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 border border-slate-200">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sign In to Console</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter authorized Bureau credentials</p>
            </div>
            <Badge variant="primary" size="sm">
              SIH26264
            </Badge>
          </div>

          {errorMessage && (
            <AlertBanner
              variant="danger"
              className="mb-5 text-xs"
              onDismiss={() => setErrorMessage('')}
            >
              {errorMessage}
            </AlertBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                icon={Lock}
              >
                Authenticate & Access Console
              </Button>
            </div>
          </form>

          {/* Quick-Fill Development Test Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <KeyRound className="w-3.5 h-3.5 text-gov-600" />
              <span>Development Seed Accounts (Quick Fill):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoCredentials('officer_rb', 'Password@123')}
                className="p-2 text-left rounded bg-slate-50 border border-slate-200 hover:bg-gov-50 hover:border-gov-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">RB Officer</div>
                <div className="text-[10px] text-slate-500 font-mono">officer_rb</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('officer_pgrc', 'Password@123')}
                className="p-2 text-left rounded bg-slate-50 border border-slate-200 hover:bg-gov-50 hover:border-gov-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">PGRC Officer</div>
                <div className="text-[10px] text-slate-500 font-mono">officer_pgrc</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('official_senior', 'Password@123')}
                className="p-2 text-left rounded bg-slate-50 border border-slate-200 hover:bg-gov-50 hover:border-gov-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">Senior Official</div>
                <div className="text-[10px] text-slate-500 font-mono">official_senior</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin_sys', 'Password@123')}
                className="p-2 text-left rounded bg-slate-50 border border-slate-200 hover:bg-gov-50 hover:border-gov-300 transition-colors"
              >
                <div className="font-semibold text-slate-800">System Admin</div>
                <div className="text-[10px] text-slate-500 font-mono">admin_sys</div>
              </button>
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => setDemoCredentials('officer_disabled', 'Password@123')}
                className="text-[10px] text-rose-600 hover:underline"
              >
                Test Disabled Account Rejection (officer_disabled)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
