import React, { useState } from 'react';
import { PieChart, Filter } from 'lucide-react';

const PALETTE = [
  { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' }, // Blue
  { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }, // Emerald
  { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }, // Amber
  { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' }, // Purple
  { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' }, // Pink
  { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },  // Cyan
  { fill: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' }  // Orange
];

export function CategoryDonutChart({ categoryBreakdown = {} }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const entries = Object.entries(categoryBreakdown);
  const total = entries.reduce((acc, [, val]) => acc + val, 0);

  // If no data, show a friendly placeholder
  if (total === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-primary-600" /> Complaint Classification Distribution
          </h3>
        </div>
        <div className="py-12 text-center text-xs text-slate-400">
          No categorized complaints in current scope.
        </div>
      </div>
    );
  }

  // Calculate slice angles for SVG donut
  let cumulativeAngle = 0;
  const radius = 64;
  const innerRadius = 44;
  const cx = 90;
  const cy = 90;

  const slices = entries.map(([category, count], idx) => {
    const fraction = count / total;
    const angle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix1} ${iy1}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}
      Z
    `;

    const color = PALETTE[idx % PALETTE.length];
    const percentage = Math.round(fraction * 100);

    return {
      category: category.replace(/_/g, ' '),
      rawCategory: category,
      count,
      percentage,
      pathData,
      color,
      idx
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-primary-600" /> Complaint Category Distribution
          </h3>
          <p className="text-[11px] text-slate-500">Breakdown by statutory violation and subject type</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
          {entries.length} Classes
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around py-2 gap-4">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-44 h-44 drop-shadow-xs" viewBox="0 0 180 180">
            {slices.map((slice) => {
              const isHovered = hoveredIdx === slice.idx;
              return (
                <path
                  key={slice.idx}
                  d={slice.pathData}
                  fill={slice.color.fill}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200 cursor-pointer transform origin-center hover:opacity-95"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 6px ${slice.color.glow})` : 'none',
                    transform: isHovered ? 'scale(1.04)' : 'scale(1)'
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {activeSlice ? (
              <>
                <span className="text-xl font-extrabold text-slate-900 font-mono leading-none">
                  {activeSlice.percentage}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium max-w-[80px] truncate mt-0.5">
                  {activeSlice.count} Cases
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-slate-900 font-mono leading-none">
                  {total}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                  Total
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 w-full sm:max-w-[210px]">
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            return (
              <div
                key={slice.idx}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color.fill }}
                  />
                  <span className="text-slate-700 truncate capitalize text-[11px]">
                    {slice.category.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                  <span className="font-bold text-slate-900">{slice.count}</span>
                  <span className="text-slate-400">({slice.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CategoryDonutChart;
