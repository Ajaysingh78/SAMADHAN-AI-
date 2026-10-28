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
  Lock,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

export function AppSidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { label: 'Role Workspace', icon: LayoutDashboard, path: '/app', phase: 'Active (P2)', enabled: true },
    { label: 'System Administration', icon: Settings, path: '/app/admin', phase: 'Active (P2)', enabled: isAdmin, adminOnly: true },
    { label: 'Institution Registry (360°)', icon: Building2, path: '/app/institutions', phase: 'Phase 3', enabled: false },
    { label: 'Complaint Case Tracking', icon: FileText, path: '/app/complaints', phase: 'Phase 3', enabled: false },
    { label: 'Case Intelligence & Overlaps', icon: GitFork, path: '/app/case-intelligence', phase: 'Phase 4', enabled: false },
    { label: 'Workflow & Audit History', icon: History, path: '/app/workflow', phase: 'Phase 5', enabled: false },
    { label: 'Reports & SLA Analytics', icon: BarChart3, path: '/app/reports', phase: 'Phase 6', enabled: false },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 text-left">
      <div className="p-4 border-b border-slate-800">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Authorized Environment
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-white truncate">
            {user?.primaryBureau || (user?.role === 'ADMIN' ? 'All Bureaus (Admin)' : 'Executive Oversight')}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.adminOnly && !isAdmin) return null;

          if (item.enabled) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-gov-700 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-gov-400" />
                  <span>{item.label}</span>
                </div>
                <Badge variant="success" size="sm" className="bg-emerald-950/80 text-[10px] text-emerald-300 border-emerald-700/60 py-0 px-1.5">
                  Ready
                </Badge>
              </NavLink>
            );
          }

          return (
            <div
              key={item.path}
              className="flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors group cursor-not-allowed opacity-80"
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
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Role: {user?.role}</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Backend JWT token verified. Scopes enforced on all API endpoints.
        </p>
      </div>
    </aside>
  );
}

export default AppSidebar;
