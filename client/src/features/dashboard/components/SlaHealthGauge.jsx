import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export function SlaHealthGauge({ totalCases = 0, overdueCases = 0, dueSoonCases = 0, disposedCases = 0 }) {
  const activeCases = Math.max(0, totalCases - disposedCases);
  const compliantCases = Math.max(0, activeCases - overdueCases);
  const complianceRate = activeCases > 0 ? Math.round((compliantCases / activeCases) * 100) : 100;

  // Arc calculation for 220 degree radial gauge
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (220 / 360);
  const strokeDashoffset = arcLength - (arcLength * complianceRate) / 100;

  const getStatusColor = (rate) => {
    if (rate >= 90) return { text: 'text-emerald-600', fill: '#10b981', label: 'Optimal SLA Health', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (rate >= 70) return { text: 'text-amber-600', fill: '#f59e0b', label: 'Attention Required', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { text: 'text-rose-600', fill: '#ef4444', label: 'Critical SLA Breaches', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const status = getStatusColor(complianceRate);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary-600" /> SLA Governance & Compliance Index
          </h3>
          <p className="text-[11px] text-slate-500">Real-time operational adherence across AICTE statutory timelines</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${status.bg}`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around py-3 gap-6">
        {/* Radial SVG Gauge */}
        <div className="relative flex items-center justify-center">
          <svg className="w-44 h-44 -rotate-110 transform" viewBox="0 0 180 180">
            {/* Background Track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="14"
              strokeDasharray={arcLength}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Value Arc with Gradient */}
            <defs>
              <linearGradient id="slaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="65%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={complianceRate > 85 ? '#10b981' : complianceRate > 65 ? '#f59e0b' : '#ef4444'}
              strokeWidth="14"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Centered Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {complianceRate}%
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Adherence
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Metrics */}
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> On-Schedule
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{compliantCases}</div>
            <div className="text-[10px] text-slate-400">Within 30-day window</div>
          </div>

          <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-700 uppercase">
              <Clock className="w-3 h-3 text-amber-600" /> Warning (≤7d)
            </div>
            <div className="text-lg font-bold text-amber-700 mt-0.5 font-mono">{dueSoonCases}</div>
            <div className="text-[10px] text-amber-600/80">Action deadline near</div>
          </div>

          <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100 min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-rose-700 uppercase">
              <AlertTriangle className="w-3 h-3 text-rose-600" /> Overdue
            </div>
            <div className="text-lg font-bold text-rose-700 mt-0.5 font-mono">{overdueCases}</div>
            <div className="text-[10px] text-rose-600/80">SLA threshold breached</div>
          </div>

          <div className="bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 min-w-[130px]">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-700 uppercase">
              <TrendingUp className="w-3 h-3 text-indigo-600" /> Disposed
            </div>
            <div className="text-lg font-bold text-indigo-700 mt-0.5 font-mono">{disposedCases}</div>
            <div className="text-[10px] text-indigo-600/80">Officially closed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlaHealthGauge;
