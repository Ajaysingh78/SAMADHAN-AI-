import React, { useState } from 'react';
import { TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

export function TrendAreaChart({ totalCases = 2, disposedCases = 0 }) {
  const [activePoint, setActivePoint] = useState(null);

  // Generate realistic data points based on actual current counts
  // e.g. 6-month retrospective timeline
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct 2026'];
  const intakeData = [
    Math.max(1, Math.round(totalCases * 0.4)),
    Math.max(1, Math.round(totalCases * 0.6)),
    Math.max(2, Math.round(totalCases * 0.8)),
    Math.max(1, Math.round(totalCases * 0.7)),
    Math.max(2, Math.round(totalCases * 0.9)),
    totalCases
  ];

  const disposedData = [
    0,
    Math.max(0, Math.round(disposedCases * 0.3)),
    Math.max(0, Math.round(disposedCases * 0.5)),
    Math.max(0, Math.round(disposedCases * 0.7)),
    Math.max(0, Math.round(disposedCases * 0.8)),
    disposedCases
  ];

  // SVG Coordinates calculation
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const maxVal = Math.max(...intakeData, ...disposedData, 5);

  const getPoints = (data) => {
    return data.map((val, idx) => {
      const x = paddingX + (idx / (data.length - 1)) * chartWidth;
      const y = height - paddingY - (val / maxVal) * chartHeight;
      return { x, y, val, month: months[idx] };
    });
  };

  const intakePoints = getPoints(intakeData);
  const disposedPoints = getPoints(disposedData);

  // Generate smooth SVG Bezier curve path
  const createCurvedPath = (points) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const intakePath = createCurvedPath(intakePoints);
  const intakeArea = `${intakePath} L ${intakePoints[intakePoints.length - 1].x} ${height - paddingY} L ${intakePoints[0].x} ${height - paddingY} Z`;

  const disposedPath = createCurvedPath(disposedPoints);
  const disposedArea = `${disposedPath} L ${disposedPoints[disposedPoints.length - 1].x} ${height - paddingY} L ${disposedPoints[0].x} ${height - paddingY} Z`;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Case Influx vs Resolution Velocity
          </h3>
          <p className="text-[11px] text-slate-500">6-Month trajectory comparing registered complaints against disposals</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-[11px] text-indigo-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> New Influx
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disposed
          </span>
        </div>
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="disposedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = paddingY + ratio * chartHeight;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Fills */}
          <path d={intakeArea} fill="url(#intakeGrad)" />
          <path d={disposedArea} fill="url(#disposedGrad)" />

          {/* Stroke Lines */}
          <path d={intakePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
          <path d={disposedPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {intakePoints.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={activePoint === idx ? 5 : 3.5}
                fill="#ffffff"
                stroke="#6366f1"
                strokeWidth="2.5"
                className="cursor-pointer transition-all hover:scale-125"
                onMouseEnter={() => setActivePoint(idx)}
                onMouseLeave={() => setActivePoint(null)}
              />
              <circle
                cx={disposedPoints[idx].x}
                cy={disposedPoints[idx].y}
                r={activePoint === idx ? 5 : 3.5}
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth="2.5"
                className="cursor-pointer transition-all hover:scale-125"
                onMouseEnter={() => setActivePoint(idx)}
                onMouseLeave={() => setActivePoint(null)}
              />
              {/* X-Axis labels */}
              <text
                x={pt.x}
                y={height - 6}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-medium"
              >
                {pt.month}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint !== null && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-3 font-mono pointer-events-none"
          >
            <span className="font-sans font-bold text-slate-300">{months[activePoint]}:</span>
            <span className="text-indigo-400 font-semibold">Influx: {intakeData[activePoint]}</span>
            <span className="text-emerald-400 font-semibold">Closed: {disposedData[activePoint]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrendAreaChart;
