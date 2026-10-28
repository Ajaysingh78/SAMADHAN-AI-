import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import Badge from '../common/Badge';

export function AppHeader({ onToggleSidebar }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-gov-800 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <ShieldCheck className="w-5 h-5 text-gov-300" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-sm font-extrabold text-slate-900 tracking-tight leading-none">
              SAMADHAN
            </span>
            <span className="block text-[9px] uppercase font-semibold tracking-wider text-slate-400 mt-0.5">
              Cross-Bureau Portal
            </span>
          </div>
        </Link>
        <span className="h-4 w-px bg-slate-200 mx-2 hidden sm:block" />
        <Badge variant="primary" size="sm" className="hidden md:inline-flex">
          Shell Scaffold (Phase 1)
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Icon Placeholder */}
        <button
          className="relative p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
          title="Notifications (Available in Phase 5)"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
        </button>

        <span className="h-4 w-px bg-slate-200" />

        {/* User preview placeholder */}
        <div className="flex items-center gap-2 pl-1 text-left">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-xs">
            <div className="font-semibold text-slate-800 leading-none">Dealing Officer</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Regulation Bureau</div>
          </div>
        </div>

        <Link to="/" title="Return to Public Homepage">
          <button className="p-2 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </header>
  );
}

export default AppHeader;
