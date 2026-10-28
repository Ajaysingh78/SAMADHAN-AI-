import React from 'react';
import { FolderSearch } from 'lucide-react';
import Button from './Button';

export function EmptyState({
  icon: Icon = FolderSearch,
  title = 'No records found',
  description = 'There are no active items matching your current filters or criteria.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div
      className={`p-12 text-center rounded-lg border-2 border-dashed border-slate-200 bg-white ${className}`}
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
