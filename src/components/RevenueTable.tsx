import React, { useState, useMemo } from 'react';
import { PivotData, SalesOrder } from '../types';
import { formatCurrency, formatPercent } from '../utils/analytics';
import { downloadCSV } from '../utils/sampleData';
import { Table, Download, Search, ArrowUpDown, ChevronDown, ChevronUp, Layers, ListFilter } from 'lucide-react';

interface RevenueTableProps {
  pivotData: PivotData;
  orders: SalesOrder[];
}

export const RevenueTable: React.FC<RevenueTableProps> = ({ pivotData, orders }) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'records'>('matrix');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'units' | 'discount' | 'orders'>('revenue');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [quarterFilter, setQuarterFilter] = useState('ALL');
  const [sortField, setSortField] = useState<keyof SalesOrder>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { quarters, regions, matrix, quarterTotals, regionTotals, grandTotal } = pivotData;

  // Export Matrix Table to CSV
  const handleExportMatrixCSV = () => {
    let csv = `Region,${quarters.join(',')},Total Revenue,Total Units,Avg Discount\n`;
    for (const r of regions) {
      const qVals = quarters.map((q) => (matrix[r]?.[q]?.revenue || 0).toFixed(2));
      const totRev = (regionTotals[r]?.revenue || 0).toFixed(2);
      const totUnits = regionTotals[r]?.units || 0;
      const avgDisc = ((regionTotals[r]?.avgDiscount || 0) * 100).toFixed(2);
      csv += `"${r}",${qVals.join(',')},${totRev},${totUnits},${avgDisc}%\n`;
    }
    // Column totals row
    const qTotRev = quarters.map((q) => (quarterTotals[q]?.revenue || 0).toFixed(2));
    csv += `"Total",${qTotRev.join(',')},${grandTotal.revenue.toFixed(2)},${grandTotal.units},${((grandTotal.avgDiscount || 0) * 100).toFixed(2)}%\n`;

    downloadCSV('sales_revenue_by_region_and_quarter.csv', csv);
  };

  // Filter and sort raw orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchesSearch =
          searchQuery === '' ||
          o.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.region.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRegion = regionFilter === 'ALL' || o.region === regionFilter;
        const matchesQuarter = quarterFilter === 'ALL' || o.quarter === quarterFilter;
        return matchesSearch && matchesRegion && matchesQuarter;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [orders, searchQuery, regionFilter, quarterFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: keyof SalesOrder) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      {/* Table Header and Mode Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100 tracking-tight">Revenue Breakdown Table</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
              {viewMode === 'matrix' ? 'Quarterly Matrix' : `${filteredOrders.length} Order Rows`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {viewMode === 'matrix'
              ? 'Multi-dimensional pivot matrix showing revenue and units across all regions and quarters'
              : 'Detailed line-item record browser with full sales order attributes'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switch */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Region × Quarter Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('records')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                viewMode === 'records'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Line Item Orders</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportMatrixCSV}
            title="Download CSV Table"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700/80 text-xs font-medium text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Table CSV</span>
          </button>
        </div>
      </div>

      {/* MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div>
          {/* Metric selector chips */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-slate-400 font-medium">Display Metric:</span>
            {[
              { id: 'revenue', label: 'Revenue ($)' },
              { id: 'units', label: 'Units Sold' },
              { id: 'discount', label: 'Avg Discount (%)' },
              { id: 'orders', label: 'Order Count' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id as any)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  activeMetric === m.id
                    ? 'bg-slate-800 text-blue-400 border border-blue-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-300 bg-slate-950/60 border border-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Region</th>
                  {quarters.map((q) => (
                    <th key={`th-${q}`} className="py-3 px-4 text-right font-semibold">
                      {q}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right font-semibold text-slate-200 bg-slate-950/90 border-l border-slate-800">
                    Total Revenue
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-400">Total Units</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-400">Avg Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {regions.map((region, rIdx) => {
                  const rTotal = regionTotals[region];
                  return (
                    <tr
                      key={`tr-${region}`}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        rIdx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/80'
                      }`}
                    >
                      <td className="py-3 px-4 font-sans font-medium text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>{region}</span>
                        </div>
                      </td>

                      {quarters.map((q, qIdx) => {
                        const cell = matrix[region]?.[q] || { revenue: 0, units: 0, avgDiscount: 0, orderCount: 0 };
                        // Compare with previous quarter in row if available
                        const prevQ = qIdx > 0 ? quarters[qIdx - 1] : null;
                        const prevCell = prevQ ? matrix[region]?.[prevQ] : null;
                        const qoqPct =
                          prevCell && prevCell.revenue > 0
                            ? ((cell.revenue - prevCell.revenue) / prevCell.revenue) * 100
                            : null;

                        return (
                          <td key={`td-${region}-${q}`} className="py-3 px-4 text-right whitespace-nowrap">
                            {activeMetric === 'revenue' && (
                              <div>
                                <span className="text-slate-100 font-semibold">{formatCurrency(cell.revenue)}</span>
                                {qoqPct !== null && (
                                  <span
                                    className={`block text-[10px] ${
                                      qoqPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {qoqPct >= 0 ? '↑+' : '↓'}
                                    {qoqPct.toFixed(1)}% vs {prevQ}
                                  </span>
                                )}
                              </div>
                            )}
                            {activeMetric === 'units' && (
                              <span className="text-slate-200">{cell.units.toLocaleString()}</span>
                            )}
                            {activeMetric === 'discount' && (
                              <span className="text-amber-300">{(cell.avgDiscount * 100).toFixed(1)}%</span>
                            )}
                            {activeMetric === 'orders' && (
                              <span className="text-slate-300">{cell.orderCount}</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Region Totals */}
                      <td className="py-3 px-4 text-right font-semibold text-blue-400 bg-slate-950/40 border-l border-slate-800 whitespace-nowrap">
                        {formatCurrency(rTotal?.revenue || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 whitespace-nowrap">
                        {(rTotal?.units || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300 whitespace-nowrap">
                        {(((rTotal?.avgDiscount || 0) * 100)).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Quarter Summary Totals Row */}
              <tfoot className="bg-slate-950/95 font-mono border-t-2 border-slate-700 font-semibold text-slate-100">
                <tr>
                  <td className="py-3.5 px-4 font-sans uppercase tracking-wider text-[11px] text-slate-300">
                    Total
                  </td>
                  {quarters.map((q) => {
                    const qTot = quarterTotals[q];
                    return (
                      <td key={`foot-${q}`} className="py-3.5 px-4 text-right whitespace-nowrap">
                        {activeMetric === 'revenue' && formatCurrency(qTot?.revenue || 0)}
                        {activeMetric === 'units' && (qTot?.units || 0).toLocaleString()}
                        {activeMetric === 'discount' && `${(((qTot?.avgDiscount || 0) * 100)).toFixed(1)}%`}
                        {activeMetric === 'orders' && (qTot?.orderCount || 0)}
                      </td>
                    );
                  })}
                  <td className="py-3.5 px-4 text-right text-emerald-400 bg-slate-950 border-l border-slate-800 text-sm whitespace-nowrap">
                    {formatCurrency(grandTotal.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-200 whitespace-nowrap">
                    {grandTotal.units.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-200 whitespace-nowrap">
                    {((grandTotal.avgDiscount * 100)).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* LINE ITEM ORDERS VIEW */}
      {viewMode === 'records' && (
        <div>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product, channel, or region..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Regions</option>
              {regions.map((r) => (
                <option key={`opt-reg-${r}`} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={quarterFilter}
              onChange={(e) => {
                setQuarterFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Quarters</option>
              {quarters.map((q) => (
                <option key={`opt-q-${q}`} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <th
                    className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('quarter')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Quarter</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('region')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Region</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('channel')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Channel</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('product')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Product</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 text-right font-semibold cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('units')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Units</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 text-right font-semibold cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('discount_pct')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Discount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-2.5 px-3 text-right font-semibold cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('revenue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Revenue</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/70'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">{order.quarter}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-200">{order.region}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">{order.channel}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{order.product}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{order.units.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-amber-400">
                      {(order.discount_pct * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-400">
                      {formatCurrency(order.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
              >
                Previous
              </button>
              <span className="px-2 text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
