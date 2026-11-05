import {
  ChannelDriver,
  PivotCell,
  PivotData,
  ProductDriver,
  RegionQ2Q3Variance,
  SalesOrder,
} from '../types';

export function computePivotData(orders: SalesOrder[]): PivotData {
  const quarterSet = new Set<string>();
  const regionSet = new Set<string>();
  const channelSet = new Set<string>();
  const productSet = new Set<string>();

  // Gather unique values
  for (const o of orders) {
    quarterSet.add(o.quarter);
    regionSet.add(o.region);
    channelSet.add(o.channel);
    productSet.add(o.product);
  }

  // Natural chronological sorting for quarters
  const quarters = Array.from(quarterSet).sort((a, b) => {
    const qA = a.match(/Q?(\d)/i);
    const qB = b.match(/Q?(\d)/i);
    if (qA && qB) return parseInt(qA[1]) - parseInt(qB[1]);
    return a.localeCompare(b);
  });

  const regions = Array.from(regionSet).sort();
  const channels = Array.from(channelSet).sort();
  const products = Array.from(productSet).sort();

  // Matrix [region][quarter]
  const matrix: Record<string, Record<string, PivotCell>> = {};
  const quarterTotals: Record<string, PivotCell> = {};
  const regionTotals: Record<string, PivotCell> = {};

  const emptyCell = (): PivotCell => ({
    revenue: 0,
    units: 0,
    orderCount: 0,
    avgDiscount: 0,
  });

  for (const r of regions) {
    matrix[r] = {};
    regionTotals[r] = emptyCell();
    for (const q of quarters) {
      matrix[r][q] = emptyCell();
    }
  }

  for (const q of quarters) {
    quarterTotals[q] = emptyCell();
  }

  const grandTotal = emptyCell();

  // Temporary accumulators for discount weighting
  const discountWeight: Record<string, number> = {};

  for (const o of orders) {
    const cell = matrix[o.region][o.quarter];
    const qTot = quarterTotals[o.quarter];
    const rTot = regionTotals[o.region];

    cell.revenue += o.revenue;
    cell.units += o.units;
    cell.orderCount += 1;

    qTot.revenue += o.revenue;
    qTot.units += o.units;
    qTot.orderCount += 1;

    rTot.revenue += o.revenue;
    rTot.units += o.units;
    rTot.orderCount += 1;

    grandTotal.revenue += o.revenue;
    grandTotal.units += o.units;
    grandTotal.orderCount += 1;
  }

  // Calculate weighted average discounts
  // Cell discount = sum(revenue * discount) / sum(revenue)
  for (const r of regions) {
    for (const q of quarters) {
      const ordersInCell = orders.filter((o) => o.region === r && o.quarter === q);
      const totalRev = matrix[r][q].revenue;
      if (totalRev > 0) {
        const weightedDisc = ordersInCell.reduce((acc, curr) => acc + curr.revenue * curr.discount_pct, 0);
        matrix[r][q].avgDiscount = weightedDisc / totalRev;
      } else if (ordersInCell.length > 0) {
        matrix[r][q].avgDiscount = ordersInCell.reduce((acc, c) => acc + c.discount_pct, 0) / ordersInCell.length;
      }
    }
  }

  // Quarter total discounts
  for (const q of quarters) {
    const qOrders = orders.filter((o) => o.quarter === q);
    const tot = quarterTotals[q].revenue;
    if (tot > 0) {
      quarterTotals[q].avgDiscount = qOrders.reduce((acc, c) => acc + c.revenue * c.discount_pct, 0) / tot;
    }
  }

  // Region total discounts
  for (const r of regions) {
    const rOrders = orders.filter((o) => o.region === r);
    const tot = regionTotals[r].revenue;
    if (tot > 0) {
      regionTotals[r].avgDiscount = rOrders.reduce((acc, c) => acc + c.revenue * c.discount_pct, 0) / tot;
    }
  }

  // Grand total discount
  if (grandTotal.revenue > 0) {
    grandTotal.avgDiscount = orders.reduce((acc, c) => acc + c.revenue * c.discount_pct, 0) / grandTotal.revenue;
  }

  return {
    quarters,
    regions,
    channels,
    products,
    matrix,
    quarterTotals,
    regionTotals,
    grandTotal,
  };
}

export interface VarianceAnalysisResult {
  hasQ2AndQ3: boolean;
  regionsAnalyzed: RegionQ2Q3Variance[];
  topChangedRegionByDollar: RegionQ2Q3Variance | null;
  topChangedRegionByPct: RegionQ2Q3Variance | null;
  overallQ2Revenue: number;
  overallQ3Revenue: number;
  overallDollarChange: number;
  overallPctChange: number;
}

export function computeQ2Q3Variance(orders: SalesOrder[]): VarianceAnalysisResult {
  const quarters = Array.from(new Set(orders.map((o) => o.quarter.toUpperCase())));
  const hasQ2 = quarters.includes('Q2');
  const hasQ3 = quarters.includes('Q3');

  if (!hasQ2 || !hasQ3) {
    return {
      hasQ2AndQ3: false,
      regionsAnalyzed: [],
      topChangedRegionByDollar: null,
      topChangedRegionByPct: null,
      overallQ2Revenue: 0,
      overallQ3Revenue: 0,
      overallDollarChange: 0,
      overallPctChange: 0,
    };
  }

  const q2Orders = orders.filter((o) => o.quarter.toUpperCase() === 'Q2');
  const q3Orders = orders.filter((o) => o.quarter.toUpperCase() === 'Q3');

  const allRegions = Array.from(new Set([...q2Orders.map((o) => o.region), ...q3Orders.map((o) => o.region)]));

  const variances: RegionQ2Q3Variance[] = [];

  for (const region of allRegions) {
    const regQ2 = q2Orders.filter((o) => o.region === region);
    const regQ3 = q3Orders.filter((o) => o.region === region);

    const q2Revenue = regQ2.reduce((acc, o) => acc + o.revenue, 0);
    const q3Revenue = regQ3.reduce((acc, o) => acc + o.revenue, 0);
    const dollarChange = q3Revenue - q2Revenue;
    const absDollarChange = Math.abs(dollarChange);
    const pctChange = q2Revenue > 0 ? ((q3Revenue - q2Revenue) / q2Revenue) * 100 : q3Revenue > 0 ? 100 : 0;

    const q2Units = regQ2.reduce((acc, o) => acc + o.units, 0);
    const q3Units = regQ3.reduce((acc, o) => acc + o.units, 0);
    const unitsChange = q3Units - q2Units;
    const pctChangeUnits = q2Units > 0 ? ((q3Units - q2Units) / q2Units) * 100 : 0;

    const q2AvgDiscount =
      q2Revenue > 0
        ? regQ2.reduce((acc, o) => acc + o.revenue * o.discount_pct, 0) / q2Revenue
        : regQ2.length > 0
        ? regQ2.reduce((acc, o) => acc + o.discount_pct, 0) / regQ2.length
        : 0;

    const q3AvgDiscount =
      q3Revenue > 0
        ? regQ3.reduce((acc, o) => acc + o.revenue * o.discount_pct, 0) / q3Revenue
        : regQ3.length > 0
        ? regQ3.reduce((acc, o) => acc + o.discount_pct, 0) / regQ3.length
        : 0;

    const discountDiffPts = (q3AvgDiscount - q2AvgDiscount) * 100;

    // Calculate product breakdown in this region
    const productNames = Array.from(new Set([...regQ2.map((o) => o.product), ...regQ3.map((o) => o.product)]));
    const productDrivers: ProductDriver[] = productNames
      .map((p) => {
        const pQ2 = regQ2.filter((o) => o.product === p);
        const pQ3 = regQ3.filter((o) => o.product === p);
        const pQ2Rev = pQ2.reduce((acc, o) => acc + o.revenue, 0);
        const pQ3Rev = pQ3.reduce((acc, o) => acc + o.revenue, 0);
        const pQ2Units = pQ2.reduce((acc, o) => acc + o.units, 0);
        const pQ3Units = pQ3.reduce((acc, o) => acc + o.units, 0);
        const diff = pQ3Rev - pQ2Rev;
        const pctDiff = pQ2Rev > 0 ? ((pQ3Rev - pQ2Rev) / pQ2Rev) * 100 : 0;
        return {
          product: p,
          q2Rev: pQ2Rev,
          q3Rev: pQ3Rev,
          diff,
          pctDiff,
          q2Units: pQ2Units,
          q3Units: pQ3Units,
          unitsDiff: pQ3Units - pQ2Units,
        };
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    // Calculate channel breakdown in this region
    const channelNames = Array.from(new Set([...regQ2.map((o) => o.channel), ...regQ3.map((o) => o.channel)]));
    const channelDrivers: ChannelDriver[] = channelNames
      .map((c) => {
        const cQ2 = regQ2.filter((o) => o.channel === c);
        const cQ3 = regQ3.filter((o) => o.channel === c);
        const cQ2Rev = cQ2.reduce((acc, o) => acc + o.revenue, 0);
        const cQ3Rev = cQ3.reduce((acc, o) => acc + o.revenue, 0);
        const diff = cQ3Rev - cQ2Rev;
        const pctDiff = cQ2Rev > 0 ? ((cQ3Rev - cQ2Rev) / cQ2Rev) * 100 : 0;
        return {
          channel: c,
          q2Rev: cQ2Rev,
          q3Rev: cQ3Rev,
          diff,
          pctDiff,
          q2Units: cQ2.reduce((acc, o) => acc + o.units, 0),
          q3Units: cQ3.reduce((acc, o) => acc + o.units, 0),
        };
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    variances.push({
      region,
      q2Revenue,
      q3Revenue,
      dollarChange,
      absDollarChange,
      pctChange,
      q2Units,
      q3Units,
      unitsChange,
      pctChangeUnits,
      q2AvgDiscount,
      q3AvgDiscount,
      discountDiffPts,
      productDrivers,
      channelDrivers,
    });
  }

  // Sort variances by largest absolute dollar change
  const sortedByDollar = [...variances].sort((a, b) => b.absDollarChange - a.absDollarChange);
  const sortedByPct = [...variances].sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));

  const overallQ2Revenue = q2Orders.reduce((acc, o) => acc + o.revenue, 0);
  const overallQ3Revenue = q3Orders.reduce((acc, o) => acc + o.revenue, 0);
  const overallDollarChange = overallQ3Revenue - overallQ2Revenue;
  const overallPctChange = overallQ2Revenue > 0 ? ((overallQ3Revenue - overallQ2Revenue) / overallQ2Revenue) * 100 : 0;

  return {
    hasQ2AndQ3: true,
    regionsAnalyzed: sortedByDollar,
    topChangedRegionByDollar: sortedByDollar[0] || null,
    topChangedRegionByPct: sortedByPct[0] || null,
    overallQ2Revenue,
    overallQ3Revenue,
    overallDollarChange,
    overallPctChange,
  };
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}K`;
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, includeSign = false): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
