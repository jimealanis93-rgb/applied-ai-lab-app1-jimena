import React, { useState, useMemo } from 'react';
import { PivotData } from '../types';
import { formatCurrency } from '../utils/analytics';
import { BarChart3, TrendingUp, Layers, Info } from 'lucide-react';

interface RevenueChartProps {
  pivotData: PivotData;
}

const REGION_PALETTE = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const QUARTER_PALETTE = [
  '#64748b', // Slate for Q1
  '#0284c7', // Sky for Q2
  '#059669', // Emerald for Q3
  '#d97706', // Amber for Q4
];

export const RevenueChart: React.FC<RevenueChartProps> = ({ pivotData }) => {
  const [groupBy, setGroupBy] = useState<'region' | 'quarter'>('region');
  const [chartType, setChartType] = useState<'grouped' | 'stacked' | 'line'>('grouped');
  const [hoveredItem, setHoveredItem] = useState<{
    groupKey: string;
    subKey: string;
    revenue: number;
    units: number;
    avgDiscount: number;
    x: number;
    y: number;
  } | null>(null);

  const { quarters, regions, matrix } = pivotData;

  // Chart dimensions
  const svgWidth = 900;
  const svgHeight = 420;
  const padding = { top: 40, right: 30, bottom: 65, left: 90 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Compute maximum values based on view
  const { maxVal, groups, subKeys, getColor } = useMemo(() => {
    if (groupBy === 'region') {
      const groups = regions;
      const subKeys = quarters;
      const getColor = (subIdx: number) => QUARTER_PALETTE[subIdx % QUARTER_PALETTE.length];

      if (chartType === 'stacked') {
        const stackedMax = Math.max(
          ...regions.map((r) => quarters.reduce((sum, q) => sum + (matrix[r]?.[q]?.revenue || 0), 0)),
          1
        );
        return { maxVal: stackedMax * 1.12, groups, subKeys, getColor };
      }

      const singleMax = Math.max(
        ...regions.flatMap((r) => quarters.map((q) => matrix[r]?.[q]?.revenue || 0)),
        1
      );
      return { maxVal: singleMax * 1.15, groups, subKeys, getColor };
    } else {
      const groups = quarters;
      const subKeys = regions;
      const getColor = (subIdx: number) => REGION_PALETTE[subIdx % REGION_PALETTE.length];

      if (chartType === 'stacked') {
        const stackedMax = Math.max(
          ...quarters.map((q) => regions.reduce((sum, r) => sum + (matrix[r]?.[q]?.revenue || 0), 0)),
          1
        );
        return { maxVal: stackedMax * 1.12, groups, subKeys, getColor };
      }

      const singleMax = Math.max(
        ...quarters.flatMap((q) => regions.map((r) => matrix[r]?.[q]?.revenue || 0)),
        1
      );
      return { maxVal: singleMax * 1.15, groups, subKeys, getColor };
    }
  }, [groupBy, chartType, regions, quarters, matrix]);

  // Generate 5 nice Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      ticks.push((maxVal / count) * i);
    }
    return ticks;
  }, [maxVal]);

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxVal) * chartHeight;
  };

  const groupWidth = groups.length > 0 ? chartWidth / groups.length : chartWidth;
  const groupInnerPadding = groupWidth * 0.18;
  const availableGroupWidth = groupWidth - groupInnerPadding * 2;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100 tracking-tight">Total Revenue by Region & Quarter</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">Interactive Chart</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual comparison of revenue performance across territorial markets and fiscal quarters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Grouping switch */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setGroupBy('region')}
              className={`px-2.5 py-1 rounded transition-colors ${
                groupBy === 'region'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              By Region
            </button>
            <button
              onClick={() => setGroupBy('quarter')}
              className={`px-2.5 py-1 rounded transition-colors ${
                groupBy === 'quarter'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              By Quarter
            </button>
          </div>

          {/* Chart Type switch */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setChartType('grouped')}
              title="Grouped Bars"
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                chartType === 'grouped'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Grouped</span>
            </button>
            <button
              onClick={() => setChartType('stacked')}
              title="Stacked Bars"
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                chartType === 'stacked'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stacked</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Trend Lines"
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                chartType === 'line'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trend</span>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[700px] select-none"
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Background Grid Lines & Ticks */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={`ytick-${i}`} className="text-slate-700">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray={i === 0 ? 'none' : '3 3'}
                  strokeWidth={i === 0 ? 1.5 : 1}
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="sans-serif"
                >
                  {formatCurrency(tick, true)}
                </text>
              </g>
            );
          })}

          {/* Grouped Bar Chart */}
          {chartType === 'grouped' && (
            <g>
              {groups.map((groupKey, gIdx) => {
                const groupStartX = padding.left + gIdx * groupWidth + groupInnerPadding;
                const barWidth = subKeys.length > 0 ? availableGroupWidth / subKeys.length : availableGroupWidth;

                return (
                  <g key={`group-${groupKey}`}>
                    {subKeys.map((subKey, sIdx) => {
                      const rKey = groupBy === 'region' ? groupKey : subKey;
                      const qKey = groupBy === 'region' ? subKey : groupKey;
                      const cell = matrix[rKey]?.[qKey] || { revenue: 0, units: 0, avgDiscount: 0 };
                      const val = cell.revenue;
                      const barH = (val / maxVal) * chartHeight;
                      const x = groupStartX + sIdx * barWidth;
                      const y = getY(val);
                      const barFill = getColor(sIdx);
                      const isHovered =
                        hoveredItem?.groupKey === groupKey && hoveredItem?.subKey === subKey;

                      return (
                        <rect
                          key={`bar-${groupKey}-${subKey}`}
                          x={x + 1}
                          y={y}
                          width={Math.max(barWidth - 2, 2)}
                          height={Math.max(barH, 0)}
                          fill={barFill}
                          rx={3}
                          opacity={hoveredItem ? (isHovered ? 1 : 0.45) : 0.88}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredItem({
                              groupKey,
                              subKey,
                              revenue: val,
                              units: cell.units,
                              avgDiscount: cell.avgDiscount,
                              x: x + barWidth / 2,
                              y,
                            });
                          }}
                        />
                      );
                    })}

                    {/* Group Label on X Axis */}
                    <text
                      x={padding.left + gIdx * groupWidth + groupWidth / 2}
                      y={svgHeight - padding.bottom + 22}
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="12"
                      fontWeight="500"
                    >
                      {groupKey}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Stacked Bar Chart */}
          {chartType === 'stacked' && (
            <g>
              {groups.map((groupKey, gIdx) => {
                const barX = padding.left + gIdx * groupWidth + groupInnerPadding;
                const barW = availableGroupWidth;
                let currentYVal = 0;

                return (
                  <g key={`stacked-group-${groupKey}`}>
                    {subKeys.map((subKey, sIdx) => {
                      const rKey = groupBy === 'region' ? groupKey : subKey;
                      const qKey = groupBy === 'region' ? subKey : groupKey;
                      const cell = matrix[rKey]?.[qKey] || { revenue: 0, units: 0, avgDiscount: 0 };
                      const val = cell.revenue;
                      const segH = (val / maxVal) * chartHeight;
                      currentYVal += val;
                      const segY = getY(currentYVal);
                      const barFill = getColor(sIdx);
                      const isHovered =
                        hoveredItem?.groupKey === groupKey && hoveredItem?.subKey === subKey;

                      return (
                        <rect
                          key={`seg-${groupKey}-${subKey}`}
                          x={barX}
                          y={segY}
                          width={barW}
                          height={Math.max(segH - 1, 0)}
                          fill={barFill}
                          opacity={hoveredItem ? (isHovered ? 1 : 0.5) : 0.88}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => {
                            setHoveredItem({
                              groupKey,
                              subKey,
                              revenue: val,
                              units: cell.units,
                              avgDiscount: cell.avgDiscount,
                              x: barX + barW / 2,
                              y: segY,
                            });
                          }}
                        />
                      );
                    })}

                    {/* Group Label on X Axis */}
                    <text
                      x={padding.left + gIdx * groupWidth + groupWidth / 2}
                      y={svgHeight - padding.bottom + 22}
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="12"
                      fontWeight="500"
                    >
                      {groupKey}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Line Trend Chart */}
          {chartType === 'line' && (
            <g>
              {/* Draw lines for each subKey */}
              {subKeys.map((subKey, sIdx) => {
                const strokeColor = getColor(sIdx);
                const points = groups.map((groupKey, gIdx) => {
                  const rKey = groupBy === 'region' ? groupKey : subKey;
                  const qKey = groupBy === 'region' ? subKey : groupKey;
                  const cell = matrix[rKey]?.[qKey] || { revenue: 0, units: 0, avgDiscount: 0 };
                  const x = padding.left + gIdx * groupWidth + groupWidth / 2;
                  const y = getY(cell.revenue);
                  return { x, y, revenue: cell.revenue, cell, groupKey, subKey };
                });

                const pathData = points
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                return (
                  <g key={`line-sub-${subKey}`}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={2.5}
                      opacity={hoveredItem?.subKey === subKey || !hoveredItem ? 1 : 0.3}
                    />
                    {points.map((pt, pIdx) => {
                      const isHovered =
                        hoveredItem?.groupKey === pt.groupKey && hoveredItem?.subKey === pt.subKey;
                      return (
                        <circle
                          key={`pt-${pIdx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 4}
                          fill={strokeColor}
                          stroke="#0f172a"
                          strokeWidth={2}
                          className="cursor-pointer"
                          onMouseEnter={() => {
                            setHoveredItem({
                              groupKey: pt.groupKey,
                              subKey: pt.subKey,
                              revenue: pt.revenue,
                              units: pt.cell.units,
                              avgDiscount: pt.cell.avgDiscount,
                              x: pt.x,
                              y: pt.y,
                            });
                          }}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* X Axis Group Labels */}
              {groups.map((groupKey, gIdx) => (
                <text
                  key={`line-group-${groupKey}`}
                  x={padding.left + gIdx * groupWidth + groupWidth / 2}
                  y={svgHeight - padding.bottom + 22}
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="12"
                  fontWeight="500"
                >
                  {groupKey}
                </text>
              ))}
            </g>
          )}

          {/* Hover Tooltip Overlay */}
          {hoveredItem && (
            <g transform={`translate(${Math.min(Math.max(hoveredItem.x, 100), svgWidth - 140)}, ${Math.max(hoveredItem.y - 85, 10)})`}>
              <rect
                x={-90}
                y={0}
                width={180}
                height={78}
                rx={6}
                fill="#020617"
                stroke="#475569"
                strokeWidth={1}
                className="shadow-xl"
              />
              <text x={0} y={18} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="500">
                {groupBy === 'region'
                  ? `${hoveredItem.groupKey} • ${hoveredItem.subKey}`
                  : `${hoveredItem.subKey} • ${hoveredItem.groupKey}`}
              </text>
              <text x={0} y={38} textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="bold">
                {formatCurrency(hoveredItem.revenue)}
              </text>
              <text x={0} y={55} textAnchor="middle" fill="#cbd5e1" fontSize="10">
                {hoveredItem.units.toLocaleString()} units sold
              </text>
              <text x={0} y={69} textAnchor="middle" fill="#a7f3d0" fontSize="10">
                Avg. Discount: {(hoveredItem.avgDiscount * 100).toFixed(1)}%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Legend ({groupBy === 'region' ? 'Quarters' : 'Regions'}):</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {subKeys.map((subKey, idx) => (
            <div key={`legend-${subKey}`} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-xs shrink-0"
                style={{ backgroundColor: getColor(idx) }}
              />
              <span className="text-slate-300 font-medium">{subKey}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
