import React, { useRef, useState } from 'react';
import { parseCSV } from '../utils/csvParser';
import { ParseResult, TextCleaningAuditEntry } from '../types';
import {
  CSV_TEMPLATE,
  downloadCSV,
  SAMPLE_TECH_HARDWARE_CSV,
  SAMPLE_RETAIL_CSV,
  SAMPLE_SAAS_CSV,
  SAMPLE_WITH_HUMAN_ERRORS_CSV,
} from '../utils/sampleData';
import { DataCleaningAuditModal } from './DataCleaningAuditModal';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  X,
  Sparkles,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

interface CsvUploaderProps {
  onDataParsed: (result: ParseResult, filename: string, rawCsvText?: string) => void;
  currentFilename: string;
  rowCount: number;
  cleaningAudit: TextCleaningAuditEntry[];
  cleanedCount: number;
  autoCleanEnabled: boolean;
  onToggleAutoClean: (enabled: boolean) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onDataParsed,
  currentFilename,
  rowCount,
  cleaningAudit,
  cleanedCount,
  autoCleanEnabled,
  onToggleAutoClean,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setErrorMessage('Please upload a valid .csv file.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const result = parseCSV(text, autoCleanEnabled);

        if (result.errors.length > 0 && result.data.length === 0) {
          setErrorMessage(result.errors.join(' | '));
        } else {
          onDataParsed(result, file.name, text);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to parse CSV file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error reading uploaded file.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const loadSample = (name: string, csvContent: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setTimeout(() => {
      const result = parseCSV(csvContent, autoCleanEnabled);
      onDataParsed(result, `${name}.csv`, csvContent);
      setIsProcessing(false);
    }, 50);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-950'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">
                {isProcessing ? 'Processing CSV file...' : 'Upload Sales Orders CSV'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                drag & drop or click
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Columns: <code className="text-blue-300">quarter, region, channel, product, units, discount_pct, revenue</code>
            </p>
          </div>

          {currentFilename && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentFilename}</span>
              <span className="text-emerald-500 font-mono">({rowCount} rows)</span>
            </div>
          )}
        </div>

        {/* Quick Sample Datasets & Template */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-1">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Sample:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => loadSample('Global Tech Hardware FY24', SAMPLE_TECH_HARDWARE_CSV)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
            >
              Tech Hardware
            </button>
            <button
              onClick={() => loadSample('Retail & Apparel 2024', SAMPLE_RETAIL_CSV)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
            >
              Retail & Apparel
            </button>
            <button
              onClick={() => loadSample('Enterprise SaaS Subscriptions', SAMPLE_SAAS_CSV)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
            >
              Enterprise SaaS
            </button>
            <button
              onClick={() => loadSample('Mixed Casing Human Error Demo', SAMPLE_WITH_HUMAN_ERRORS_CSV)}
              title="Dataset with mixed 'west' and 'West', 'emea', '2024-Q2', extra whitespace to demonstrate automated text cleaning"
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Messy Casing (&quot;west&quot; / &quot;West&quot;)</span>
            </button>
            <button
              onClick={() => downloadCSV('sales_orders_template.csv', CSV_TEMPLATE)}
              title="Download empty CSV template with exact required columns"
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Intelligent Data Cleansing & Normalization Banner */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-blue-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart Text Cleaning:</span>
          </div>

          {autoCleanEnabled ? (
            cleanedCount > 0 ? (
              <span className="text-slate-300">
                Resolved <strong className="text-emerald-400">{cleanedCount}</strong> human text inconsistencies (e.g. unified{' '}
                <code className="text-amber-300">&quot;west&quot;</code> and <code className="text-amber-300">&quot;West&quot;</code> into{' '}
                <code className="text-emerald-300 font-bold">&quot;West&quot;</code>, standardized quarters, trimmed hidden spaces)
              </span>
            ) : (
              <span className="text-slate-400">All text entries in current dataset are clean and uniform</span>
            )
          ) : (
            <span className="text-rose-400">
              Auto-clean disabled. Raw text used as-is (e.g. &quot;west&quot; and &quot;West&quot; will be treated as separate regions).
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {cleanedCount > 0 && autoCleanEnabled && (
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Cleaning Log ({cleanedCount})</span>
            </button>
          )}

          {/* Toggle Auto Clean */}
          <button
            onClick={() => onToggleAutoClean(!autoCleanEnabled)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
              autoCleanEnabled
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Auto-Clean: {autoCleanEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">CSV Validation Error:</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-400 hover:text-rose-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Audit Modal */}
      <DataCleaningAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditEntries={cleaningAudit}
        totalCleaned={cleanedCount}
      />
    </div>
  );
};
