import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  GitFork, 
  History, 
  BarChart3, 
  Settings, 
  Lock
} from 'lucide-react';
import Badge from '../common/Badge';

export function AppSidebar() {
  const navItems = [
    { label: 'Operational Dashboard', icon: LayoutDashboard, path: '/app/dashboard', phase: 'Phase 6' },
    { label: 'Institution Registry (360°)', icon: Building2, path: '/app/institutions', phase: 'Phase 3' },
    { label: 'Complaint Case Tracking', icon: FileText, path: '/app/complaints', phase: 'Phase 3' },
    { label: 'Cross-Bureau Case Intelligence', icon: GitFork, path: '/app/case-intelligence', phase: 'Phase 4' },
    { label: 'Workflow & Audit History', icon: History, path: '/app/workflow', phase: 'Phase 5' },
    { label: 'Reports & SLA Analytics', icon: BarChart3, path: '/app/reports', phase: 'Phase 6' },
    { label: 'System Administration', icon: Settings, path: '/app/admin', phase: 'Phase 2' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 text-left">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Authorized Environment
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-white">AICTE Centralized Scrutiny</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.path}
              className="flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors group cursor-not-allowed"
              title={`Module targeted for ${item.phase}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-slate-500 group-hover:text-gov-400 transition-colors" />
                <span>{item.label}</span>
              </div>
              <Badge variant="neutral" size="sm" className="bg-slate-800 text-[10px] text-slate-400 border-slate-700 py-0 px-1.5">
                {item.phase}
              </Badge>
            </div>
          );
        })}
      </nav>

      {/* Security Scope Footer in Sidebar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-gov-400 font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>RBAC Scope Active</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Permissions enforced on backend Express API endpoints.
        </p>
      </div>
    </aside>
  );
}

export default AppSidebar;
