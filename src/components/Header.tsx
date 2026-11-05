import React from 'react';
import { BarChart2, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentDataset: string;
  totalOrders: number;
}

export const Header: React.FC<HeaderProps> = ({ currentDataset, totalOrders }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Sales Revenue Analytics & Quarterly Variance AI
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Gemini 3.8 Flash</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive regional revenue breakdown with strictly grounded Q2-to-Q3 variance synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Active Data:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[180px]">{currentDataset}</span>
            <span className="text-slate-400 font-mono">({totalOrders} orders)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
