import React, { useState, useEffect } from 'react';
import { AISummaryResponse, RegionQ2Q3Variance } from '../types';
import { formatCurrency, formatPercent, VarianceAnalysisResult } from '../utils/analytics';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  Calculator,
} from 'lucide-react';

interface AiSummaryCardProps {
  varianceAnalysis: VarianceAnalysisResult;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({ varianceAnalysis }) => {
  const [basis, setBasis] = useState<'dollar' | 'percent'>('dollar');
  const [summaryData, setSummaryData] = useState<AISummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showProof, setShowProof] = useState(false);

  const {
    hasQ2AndQ3,
    topChangedRegionByDollar,
    topChangedRegionByPct,
    regionsAnalyzed,
    overallDollarChange,
    overallPctChange,
  } = varianceAnalysis;

  const targetRegion = basis === 'percent' ? topChangedRegionByPct : topChangedRegionByDollar;

  // Request summary from server endpoint
  const fetchSummary = async (selectedBasis: 'dollar' | 'percent' = basis) => {
    if (!hasQ2AndQ3 || !topChangedRegionByDollar) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/summarize-q2-q3-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basis: selectedBasis,
          topChangedRegion: topChangedRegionByDollar,
          topChangedRegionPct: topChangedRegionByPct,
          allRegionChanges: regionsAnalyzed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data: AISummaryResponse = await response.json();
      setSummaryData(data);
    } catch (err: any) {
      console.error('Failed to fetch AI summary:', err);
      setError(err.message || 'Could not connect to AI summary service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch summary when data or basis changes
  useEffect(() => {
    if (hasQ2AndQ3 && topChangedRegionByDollar) {
      fetchSummary(basis);
    } else {
      setSummaryData(null);
    }
  }, [hasQ2AndQ3, topChangedRegionByDollar?.region, basis]);

  // Copy summary to clipboard
  const handleCopy = () => {
    if (summaryData?.summary) {
      navigator.clipboard.writeText(summaryData.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Text to Speech
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (summaryData?.summary) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(summaryData.summary);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Split summary into individual sentences for visual highlight
  const sentences = React.useMemo(() => {
    if (!summaryData?.summary) return [];
    // Match sentence boundaries ending with period, exclamation, or question mark followed by space or end
    const raw = summaryData.summary.match(/[^.!?]+[.!?]+(\s|$)/g);
    if (raw && raw.length > 0) {
      return raw.map((s) => s.trim()).filter(Boolean);
    }
    return [summaryData.summary];
  }, [summaryData?.summary]);

  if (!hasQ2AndQ3) {
    return (
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Q2 & Q3 Data Required for Variance AI</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              The AI variance summary requires sales order records for both <strong>Q2</strong> and{' '}
              <strong>Q3</strong> to calculate the shift. Please upload a CSV containing both quarters or select one of
              the pre-loaded sample datasets above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isGrowth = (targetRegion?.dollarChange || 0) >= 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-blue-500/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative subtle backdrop highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-100 tracking-tight">
                AI Executive Summary: Q2 to Q3 Shift
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Strictly Calculated Numbers</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Three-sentence analysis of the region that changed most and its operational drivers
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Basis Toggle */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => {
                setBasis('dollar');
                fetchSummary('dollar');
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                basis === 'dollar'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Absolute $ Change
            </button>
            <button
              onClick={() => {
                setBasis('percent');
                fetchSummary('percent');
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                basis === 'percent'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Percentage % Change
            </button>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={() => fetchSummary(basis)}
            disabled={isLoading}
            title="Regenerate Summary"
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target Region Highlight Snapshot */}
      {targetRegion && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Most Changed Region</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-slate-100 text-sm">{targetRegion.region}</span>
              <span className="text-[10px] text-slate-400">({basis === 'dollar' ? 'by $' : 'by %'})</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Q2 → Q3 Revenue</span>
            <div className="font-mono text-slate-200 font-medium mt-0.5">
              {formatCurrency(targetRegion.q2Revenue, true)} → {formatCurrency(targetRegion.q3Revenue, true)}
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Net Shift ($ & %)</span>
            <div
              className={`font-mono font-semibold flex items-center gap-1 mt-0.5 ${
                isGrowth ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isGrowth ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {formatCurrency(targetRegion.dollarChange)} ({formatPercent(targetRegion.pctChange, true)})
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block">Volume & Discount Shift</span>
            <div className="font-mono text-slate-300 mt-0.5">
              {targetRegion.unitsChange >= 0 ? '+' : ''}
              {targetRegion.unitsChange.toLocaleString()} units •{' '}
              <span className="text-amber-400">
                {targetRegion.discountDiffPts >= 0 ? '+' : ''}
                {targetRegion.discountDiffPts.toFixed(1)} pts disc.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Body */}
      <div className="relative min-h-[100px] mb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium">
              Generating grounded three-sentence executive summary with Gemini 3.8 Flash...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            <p className="font-semibold mb-1">Failed to generate AI summary</p>
            <p>{error}</p>
          </div>
        ) : summaryData ? (
          <div className="space-y-3">
            {sentences.length >= 3 ? (
              // Structured 3-sentence presentation
              <div className="space-y-2.5">
                {sentences.slice(0, 3).map((sentence, idx) => {
                  const labels = ['Region & Revenue Shift', 'Product & Channel Drivers', 'Volume & Pricing Mechanism'];
                  return (
                    <div
                      key={`sent-${idx}`}
                      className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 hover:border-blue-500/40 transition-colors flex items-start gap-3"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[11px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium mb-0.5">
                          {labels[idx]}
                        </span>
                        <p className="text-sm text-slate-200 leading-relaxed font-sans">{sentence}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single block if sentences couldn't be cleanly separated
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <p className="text-sm text-slate-200 leading-relaxed font-sans">{summaryData.summary}</p>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-400 border-t border-slate-800/60">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>

                {'speechSynthesis' in window && (
                  <button
                    onClick={handleToggleSpeak}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                      isSpeaking
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
                  </button>
                )}

                <span className="text-[11px] text-slate-400">
                  Engine: <span className="text-slate-300 font-mono">{summaryData.model}</span>
                </span>
              </div>

              {/* Toggle Proof Inspector */}
              <button
                onClick={() => setShowProof(!showProof)}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showProof ? 'Hide Calculated Math & Proof' : 'Inspect Calculated Math & Proof'}</span>
                {showProof ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* CALCULATED PROOF INSPECTOR DRAWER */}
      {showProof && targetRegion && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Mathematical Proof: All Calculations Feeding the AI</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Only these pre-calculated values were provided in the prompt context.
            </span>
          </div>

          {/* All Regions Comparison Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3 font-semibold">Region</th>
                  <th className="py-2 px-3 text-right font-semibold">Q2 Revenue</th>
                  <th className="py-2 px-3 text-right font-semibold">Q3 Revenue</th>
                  <th className="py-2 px-3 text-right font-semibold">Dollar Change ($)</th>
                  <th className="py-2 px-3 text-right font-semibold">Pct Change (%)</th>
                  <th className="py-2 px-3 text-right font-semibold">Q2 → Q3 Units</th>
                  <th className="py-2 px-3 text-right font-semibold">Discount Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {regionsAnalyzed.map((r) => {
                  const isTarget = r.region === targetRegion.region;
                  return (
                    <tr
                      key={`proof-${r.region}`}
                      className={`${
                        isTarget
                          ? 'bg-blue-500/10 font-bold border-l-2 border-blue-500'
                          : 'bg-slate-900/40 hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2 px-3 font-sans text-slate-200 flex items-center gap-1.5">
                        {isTarget && <span className="text-blue-400 text-[10px]">★ Focus</span>}
                        <span>{r.region}</span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(r.q2Revenue)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(r.q3Revenue)}</td>
                      <td
                        className={`py-2 px-3 text-right font-semibold ${
                          r.dollarChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {r.dollarChange >= 0 ? '+' : ''}
                        {formatCurrency(r.dollarChange)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-semibold ${
                          r.pctChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatPercent(r.pctChange, true)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {r.q2Units.toLocaleString()} → {r.q3Units.toLocaleString()} ({r.unitsChange >= 0 ? '+' : ''}
                        {r.unitsChange.toLocaleString()})
                      </td>
                      <td className="py-2 px-3 text-right text-amber-300">
                        {(r.q2AvgDiscount * 100).toFixed(1)}% → {(r.q3AvgDiscount * 100).toFixed(1)}% (
                        {r.discountDiffPts >= 0 ? '+' : ''}
                        {r.discountDiffPts.toFixed(1)} pts)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Product and Channel Drivers Breakdown for Target Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Product Drivers */}
            <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-200">
                  Product Drivers in {targetRegion.region} (Q2 vs Q3)
                </span>
                <span className="text-[10px] text-slate-400">Sorted by Delta Magnitude</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {targetRegion.productDrivers?.map((pd) => (
                  <div
                    key={`pd-${pd.product}`}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-900/60"
                  >
                    <span className="font-sans text-slate-300 truncate max-w-[140px]">{pd.product}</span>
                    <div className="text-right">
                      <span className={pd.diff >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                        {pd.diff >= 0 ? '+' : ''}
                        {formatCurrency(pd.diff)}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-2">
                        ({pd.q2Units} → {pd.q3Units} units)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Drivers */}
            <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
                <span className="font-semibold text-slate-200">
                  Channel Drivers in {targetRegion.region} (Q2 vs Q3)
                </span>
                <span className="text-[10px] text-slate-400">Sorted by Delta Magnitude</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {targetRegion.channelDrivers?.map((cd) => (
                  <div
                    key={`cd-${cd.channel}`}
                    className="flex items-center justify-between p-1.5 rounded bg-slate-900/60"
                  >
                    <span className="font-sans text-slate-300 truncate max-w-[140px]">{cd.channel}</span>
                    <div className="text-right">
                      <span className={cd.diff >= 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                        {cd.diff >= 0 ? '+' : ''}
                        {formatCurrency(cd.diff)}
                      </span>
                      <span className="text-slate-400 text-[10px] ml-2">({formatPercent(cd.pctDiff, true)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
