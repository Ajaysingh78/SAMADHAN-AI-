import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export function AlertBanner({
  title,
  children,
  variant = 'info',
  onDismiss,
  className = ''
}) {
  const configs = {
    info: {
      bg: 'bg-gov-50 border-gov-200 text-gov-900',
      icon: Info,
      iconColor: 'text-gov-700'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600'
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600'
    },
    danger: {
      bg: 'bg-red-50 border-red-200 text-red-900',
      icon: AlertCircle,
      iconColor: 'text-red-600'
    }
  };

  const current = configs[variant] || configs.info;
  const Icon = current.icon;

  return (
    <div
      className={`rounded-lg border p-4 text-left flex items-start gap-3 text-sm ${current.bg} ${className}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="text-sm opacity-95">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 rounded p-0.5 focus:outline-none"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default AlertBanner;
