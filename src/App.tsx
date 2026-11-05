/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SalesOrder, ParseResult, TextCleaningAuditEntry } from './types';
import { parseCSV } from './utils/csvParser';
import { SAMPLE_TECH_HARDWARE_CSV } from './utils/sampleData';
import { computePivotData, computeQ2Q3Variance } from './utils/analytics';
import { Header } from './components/Header';
import { CsvUploader } from './components/CsvUploader';
import { MetricsOverview } from './components/MetricsOverview';
import { AiSummaryCard } from './components/AiSummaryCard';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';

export default function App() {
  const [autoCleanEnabled, setAutoCleanEnabled] = useState(true);
  const [rawCsvText, setRawCsvText] = useState<string>(SAMPLE_TECH_HARDWARE_CSV);
  const [datasetName, setDatasetName] = useState<string>('Global Tech Hardware FY24.csv');

  // Initialize with initial parse
  const initialParse = useMemo(() => parseCSV(SAMPLE_TECH_HARDWARE_CSV, true), []);
  const [orders, setOrders] = useState<SalesOrder[]>(initialParse.data);
  const [cleaningAudit, setCleaningAudit] = useState<TextCleaningAuditEntry[]>(initialParse.cleaningAudit);
  const [cleanedCount, setCleanedCount] = useState<number>(initialParse.cleanedCount);

  // Compute pivot and variance calculations
  const pivotData = useMemo(() => computePivotData(orders), [orders]);
  const varianceAnalysis = useMemo(() => computeQ2Q3Variance(orders), [orders]);

  const handleDataParsed = (result: ParseResult, filename: string, rawText?: string) => {
    if (result.data.length > 0) {
      setOrders(result.data);
      setDatasetName(filename);
      setCleaningAudit(result.cleaningAudit);
      setCleanedCount(result.cleanedCount);
      if (rawText) {
        setRawCsvText(rawText);
      }
    }
  };

  const handleToggleAutoClean = (enabled: boolean) => {
    setAutoCleanEnabled(enabled);
    if (rawCsvText) {
      const reParsed = parseCSV(rawCsvText, enabled);
      if (reParsed.data.length > 0) {
        setOrders(reParsed.data);
        setCleaningAudit(reParsed.cleaningAudit);
        setCleanedCount(reParsed.cleanedCount);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#4169e1] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Sticky Header */}
      <Header currentDataset={datasetName} totalOrders={orders.length} />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* CSV Upload, Human-Error Cleansing & Sample Selectors */}
        <CsvUploader
          onDataParsed={handleDataParsed}
          currentFilename={datasetName}
          rowCount={orders.length}
          cleaningAudit={cleaningAudit}
          cleanedCount={cleanedCount}
          autoCleanEnabled={autoCleanEnabled}
          onToggleAutoClean={handleToggleAutoClean}
        />

        {/* Executive KPI Summary Cards */}
        <MetricsOverview
          pivotData={pivotData}
          varianceAnalysis={varianceAnalysis}
        />

        {/* AI Three-Sentence Grounded Summary */}
        <AiSummaryCard
          varianceAnalysis={varianceAnalysis}
        />

        {/* Revenue by Region and Quarter Chart */}
        <RevenueChart
          pivotData={pivotData}
        />

        {/* Revenue by Region and Quarter Table */}
        <RevenueTable
          pivotData={pivotData}
          orders={orders}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-400/20 bg-blue-950/60 py-4 mt-12 text-center text-xs text-blue-100/90">
        <p>Sales Revenue Analytics & Quarterly Variance Engine • Automatic human-error text normalization enabled</p>
      </footer>
    </div>
  );
}
