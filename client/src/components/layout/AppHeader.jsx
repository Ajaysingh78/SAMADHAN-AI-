import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'SENIOR_OFFICIAL': return 'warning';
      case 'BUREAU_OFFICER': return 'primary';
      default: return 'info';
    }
  };

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
        {user?.role && (
          <Badge variant={getRoleBadgeVariant(user.role)} size="sm" className="hidden md:inline-flex uppercase">
            {user.role.replace('_', ' ')}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
        </button>

        <span className="h-4 w-px bg-slate-200" />

        {/* Live Authenticated User Profile */}
        <div className="flex items-center gap-2.5 pl-1 text-left">
          <div className="w-8 h-8 rounded-full bg-gov-100 text-gov-800 flex items-center justify-center font-bold text-xs border border-gov-200">
            {user?.fullName?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="hidden lg:block text-xs">
            <div className="font-semibold text-slate-900 leading-none">
              {user?.fullName || 'Authenticated Officer'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              {user?.primaryBureau || user?.region || user?.username}
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          title="Sign Out & Invalidate Session"
          className="p-2 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
