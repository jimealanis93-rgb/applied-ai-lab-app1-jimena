import React from 'react';
import { PivotData } from '../types';
import { formatCurrency, formatPercent, VarianceAnalysisResult } from '../utils/analytics';
import { DollarSign, Globe, ArrowUpRight, ArrowDownRight, Activity, TrendingUp } from 'lucide-react';

interface MetricsOverviewProps {
  pivotData: PivotData;
  varianceAnalysis: VarianceAnalysisResult;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ pivotData, varianceAnalysis }) => {
  const { grandTotal, regions, regionTotals } = pivotData;
  const {
    hasQ2AndQ3,
    topChangedRegionByDollar,
    overallDollarChange,
    overallPctChange,
    overallQ2Revenue,
    overallQ3Revenue,
  } = varianceAnalysis;

  // Find top revenue region
  const topRegion = regions.reduce(
    (max, r) => ((regionTotals[r]?.revenue || 0) > (regionTotals[max]?.revenue || 0) ? r : max),
    regions[0] || 'N/A'
  );
  const topRegionRev = regionTotals[topRegion]?.revenue || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Revenue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Sales Revenue</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold font-mono text-slate-100">{formatCurrency(grandTotal.revenue)}</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
          <span>{grandTotal.units.toLocaleString()} total units</span>
          <span className="text-amber-400">{(grandTotal.avgDiscount * 100).toFixed(1)}% avg disc.</span>
        </div>
      </div>

      {/* Top Revenue Region */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Leading Regional Market</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-100 truncate">{topRegion}</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
          <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(topRegionRev, true)}</span>
          <span>
            {grandTotal.revenue > 0 ? ((topRegionRev / grandTotal.revenue) * 100).toFixed(1) : 0}% share
          </span>
        </div>
      </div>

      {/* Macro Q2 to Q3 Overall Delta */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Overall Q2 → Q3 Shift</span>
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        {hasQ2AndQ3 ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold font-mono text-slate-100">
                {overallDollarChange >= 0 ? '+' : ''}
                {formatCurrency(overallDollarChange, true)}
              </span>
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  overallDollarChange >= 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {formatPercent(overallPctChange, true)}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {formatCurrency(overallQ2Revenue, true)} (Q2) → {formatCurrency(overallQ3Revenue, true)} (Q3)
            </div>
          </>
        ) : (
          <div className="text-xs text-slate-400 mt-2">Requires Q2 & Q3 records</div>
        )}
      </div>

      {/* Greatest Regional Variance */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-4 shadow-sm bg-blue-500/[0.02]">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-400">
            Max Regional Shift (Q2→Q3)
          </span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        {hasQ2AndQ3 && topChangedRegionByDollar ? (
          <>
            <div className="text-xl font-bold text-slate-100 truncate">
              {topChangedRegionByDollar.region}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span
                className={
                  topChangedRegionByDollar.dollarChange >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                }
              >
                {topChangedRegionByDollar.dollarChange >= 0 ? '+' : ''}
                {formatCurrency(topChangedRegionByDollar.dollarChange, true)}
              </span>
              <span className="text-slate-300">
                {formatPercent(topChangedRegionByDollar.pctChange, true)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-xs text-slate-400 mt-2">No Q2/Q3 variance data</div>
        )}
      </div>
    </div>
  );
};
