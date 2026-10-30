import React, { useState } from 'react';
import { BarChart3, Layers, Table } from 'lucide-react';

export function BureauWorkloadBarChart({ bureauWorkload = {}, totalComplaints = 0 }) {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'

  const entries = Object.entries(bureauWorkload);

  // Maximum value for scaling bars
  const maxVal = Math.max(
    ...entries.map(([, data]) => Math.max(data.pending, data.underProcess, data.disposed, data.overdue, 3))
  );

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-primary-600" /> Bureau & Division Workload Analytics
          </h3>
          <p className="text-[11px] text-slate-500">
            Real-time case allocation across AICTE Regulation, PGRC, Approval, and Regional Cells
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'chart'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Bar View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Grid Table
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map(([bureauKey, data]) => {
              const formattedName = bureauKey === 'REGULATION_BUREAU' ? 'Regulation Bureau (RB)' :
                                    bureauKey === 'PGRC' ? 'Public Grievance Redressal (PGRC)' :
                                    bureauKey === 'APPROVAL_BUREAU' ? 'Approval Bureau (APP)' : 'Regional Offices';
              const percentOfTotal = totalComplaints > 0 ? Math.round((data.total / totalComplaints) * 100) : 0;

              return (
                <div key={bureauKey} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-slate-800">{formattedName}</span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                      {data.total} Cases ({percentOfTotal}%)
                    </span>
                  </div>

                  {/* 4 Grouped Mini Bars */}
                  <div className="grid grid-cols-4 gap-2 items-end h-24 pt-2 border-b border-slate-200 pb-1">
                    {/* 1. Pending */}
                    <div className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-sky-700">{data.pending}</span>
                      <div
                        className="w-full bg-sky-500 rounded-t-md transition-all duration-500 hover:opacity-90"
                        style={{ height: `${(data.pending / maxVal) * 60 + 4}px` }}
                        title={`Pending: ${data.pending}`}
                      />
                      <span className="text-[9px] text-slate-500 font-medium">Pending</span>
                    </div>

                    {/* 2. Active In Process */}
                    <div className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-indigo-700">{data.underProcess}</span>
                      <div
                        className="w-full bg-indigo-500 rounded-t-md transition-all duration-500 hover:opacity-90"
                        style={{ height: `${(data.underProcess / maxVal) * 60 + 4}px` }}
                        title={`Under Process: ${data.underProcess}`}
                      />
                      <span className="text-[9px] text-slate-500 font-medium">Active</span>
                    </div>

                    {/* 3. Disposed */}
                    <div className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-emerald-700">{data.disposed}</span>
                      <div
                        className="w-full bg-emerald-500 rounded-t-md transition-all duration-500 hover:opacity-90"
                        style={{ height: `${(data.disposed / maxVal) * 60 + 4}px` }}
                        title={`Disposed: ${data.disposed}`}
                      />
                      <span className="text-[9px] text-slate-500 font-medium">Disposed</span>
                    </div>

                    {/* 4. Overdue */}
                    <div className="flex flex-col items-center gap-1 h-full justify-end">
                      <span className={`text-[10px] font-mono font-bold ${data.overdue > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                        {data.overdue}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${data.overdue > 0 ? 'bg-red-500' : 'bg-slate-200'}`}
                        style={{ height: `${(data.overdue / maxVal) * 60 + 4}px` }}
                        title={`Overdue: ${data.overdue}`}
                      />
                      <span className="text-[9px] text-slate-500 font-medium">Overdue</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Pending Intake
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Under Process
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Disposed
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> SLA Overdue
            </span>
          </div>
        </div>
      ) : (
        /* Matrix Grid Table View */
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">AICTE Bureau / Division</th>
                <th className="py-2.5 px-3 text-right">Pending Intake</th>
                <th className="py-2.5 px-3 text-right">Active Inquiry</th>
                <th className="py-2.5 px-3 text-right">Disposed</th>
                <th className="py-2.5 px-3 text-right">Overdue</th>
                <th className="py-2.5 px-3 text-right">Total Cases</th>
                <th className="py-2.5 px-3 text-right">Resolution %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {entries.map(([bureauKey, data]) => {
                const resolutionRate = data.total > 0 ? Math.round((data.disposed / data.total) * 100) : 0;
                return (
                  <tr key={bureauKey} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {bureauKey.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-700 font-bold">{data.pending}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-700 font-bold">{data.underProcess}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">{data.disposed}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${data.overdue > 0 ? 'text-red-600 bg-red-50/50' : 'text-slate-400'}`}>
                      {data.overdue}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{data.total}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{resolutionRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BureauWorkloadBarChart;
