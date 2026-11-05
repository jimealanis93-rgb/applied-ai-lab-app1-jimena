import React, { useState } from 'react';
import { TextCleaningAuditEntry } from '../types';
import { Sparkles, CheckCircle2, X, Filter, Search, ArrowRight, ShieldCheck } from 'lucide-react';

interface DataCleaningAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditEntries: TextCleaningAuditEntry[];
  totalCleaned: number;
}

export const DataCleaningAuditModal: React.FC<DataCleaningAuditModalProps> = ({
  isOpen,
  onClose,
  auditEntries,
  totalCleaned,
}) => {
  const [filterCol, setFilterCol] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = auditEntries.filter((entry) => {
    const matchesCol = filterCol === 'ALL' || entry.column === filterCol;
    const matchesSearch =
      searchTerm === '' ||
      entry.original.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.cleaned.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCol && matchesSearch;
  });

  // Calculate breakdown by column
  const regionCount = auditEntries.filter((e) => e.column === 'region').length;
  const quarterCount = auditEntries.filter((e) => e.column === 'quarter').length;
  const channelCount = auditEntries.filter((e) => e.column === 'channel').length;
  const productCount = auditEntries.filter((e) => e.column === 'product').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Data Cleansing & Normalization Audit</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {totalCleaned} inconsistencies resolved
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically consolidated casing variances (e.g. &quot;west&quot; → &quot;West&quot;), trimmed hidden whitespace, and standardized quarters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Badges */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Categories:</span>
          <button
            onClick={() => setFilterCol('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCol === 'ALL'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Changes ({totalCleaned})
          </button>
          <button
            onClick={() => setFilterCol('region')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCol === 'region'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Region Casing & Merges ({regionCount})
          </button>
          <button
            onClick={() => setFilterCol('quarter')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCol === 'quarter'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Quarter Standardized ({quarterCount})
          </button>
          <button
            onClick={() => setFilterCol('channel')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCol === 'channel'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Channel Formatting ({channelCount})
          </button>
          <button
            onClick={() => setFilterCol('product')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCol === 'product'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Product Titles ({productCount})
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit entries by text, value or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Audit List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {auditEntries.length === 0
                ? 'No human text errors or inconsistencies were detected in this dataset!'
                : 'No entries match your search filter.'}
            </div>
          ) : (
            filtered.map((entry, idx) => (
              <div
                key={`audit-${idx}`}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 shrink-0">
                    Row {entry.row}
                  </span>
                  <span className="font-semibold text-blue-400 uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 shrink-0">
                    {entry.column}
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded line-through truncate max-w-[150px]">
                      &quot;{entry.original}&quot;
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded font-bold truncate max-w-[150px]">
                      &quot;{entry.cleaned}&quot;
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 italic shrink-0 sm:text-right">
                  {entry.reason}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Harmonized records ensure unified charts and accurate quarterly variances</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
