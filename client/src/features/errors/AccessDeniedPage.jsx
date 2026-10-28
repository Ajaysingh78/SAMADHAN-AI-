import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldBan, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-100">
          <ShieldBan className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">403 — Access Restricted</h1>
        <p className="text-sm text-slate-600">
          Your current bureau role does not have authorization to view or act upon this regulatory jurisdiction.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="secondary" icon={ArrowLeft}>
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
