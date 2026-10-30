import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Menu, X, ArrowRight, Lock, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-lg bg-gov-800 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-gov-900 transition-colors">
                <ShieldCheck className="w-6 h-6 text-gov-300" />
              </div>
              <div className="text-left">
                <span className="block text-base font-extrabold tracking-tight text-slate-900">
                  samadhanX
                </span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-500 -mt-1">
                  AICTE Case Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-gov-700 transition-colors">Overview</a>
            <a href="#differentiator" className="hover:text-gov-700 transition-colors">Governance Model</a>
            <a href="#workflow" className="hover:text-gov-700 transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-gov-700 transition-colors">Architecture</a>
            <a href="#safeguards" className="hover:text-gov-700 transition-colors">Safeguards</a>
          </nav>

          {/* Desktop Right Action */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/app">
                <Button variant="primary" size="sm" icon={LayoutDashboard}>
                  Open Console ({user?.username})
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" icon={Lock}>
                  Officer Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <a
            href="#overview"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-gov-700"
          >
            Overview
          </a>
          <a
            href="#differentiator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-gov-700"
          >
            Governance Model
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-gov-700"
          >
            How It Works
          </a>
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-gov-700"
          >
            Architecture
          </a>
          <a
            href="#safeguards"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-gov-700"
          >
            Safeguards
          </a>
          <div className="pt-2">
            {isAuthenticated ? (
              <Link to="/app" onClick={() => setMobileMenuOpen(false)} className="w-full block">
                <Button variant="primary" className="w-full" icon={LayoutDashboard}>
                  Open Console ({user?.username})
                </Button>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full block">
                <Button variant="primary" className="w-full" icon={Lock}>
                  Authorized Officer Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicNavbar;
