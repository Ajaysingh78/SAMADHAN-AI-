import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import Button from '../../components/common/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">404 — Page Not Found</h1>
        <p className="text-sm text-slate-600">
          The requested route does not exist or has been moved within the SAMADHAN portal.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" icon={Home}>
              Back to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
