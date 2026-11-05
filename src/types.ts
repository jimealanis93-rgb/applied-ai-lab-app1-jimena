export interface SalesOrder {
  id: string;
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number; // 0 to 1 decimal (e.g. 0.15 for 15%)
  revenue: number;
}

export interface TextCleaningAuditEntry {
  row: number;
  column: 'quarter' | 'region' | 'channel' | 'product';
  original: string;
  cleaned: string;
  reason: string;
}

export interface ParseResult {
  data: SalesOrder[];
  errors: string[];
  totalRows: number;
  validRows: number;
  headers: string[];
  cleaningAudit: TextCleaningAuditEntry[];
  cleanedCount: number;
}

export interface ProductDriver {
  product: string;
  q2Rev: number;
  q3Rev: number;
  diff: number;
  pctDiff: number;
  q2Units: number;
  q3Units: number;
  unitsDiff: number;
}

export interface ChannelDriver {
  channel: string;
  q2Rev: number;
  q3Rev: number;
  diff: number;
  pctDiff: number;
  q2Units: number;
  q3Units: number;
}

export interface RegionQ2Q3Variance {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  dollarChange: number;
  absDollarChange: number;
  pctChange: number;
  q2Units: number;
  q3Units: number;
  unitsChange: number;
  pctChangeUnits: number;
  q2AvgDiscount: number;
  q3AvgDiscount: number;
  discountDiffPts: number;
  productDrivers: ProductDriver[];
  channelDrivers: ChannelDriver[];
}

export interface PivotCell {
  revenue: number;
  units: number;
  orderCount: number;
  avgDiscount: number;
}

export interface PivotData {
  quarters: string[];
  regions: string[];
  channels: string[];
  products: string[];
  matrix: Record<string, Record<string, PivotCell>>; // [region][quarter]
  quarterTotals: Record<string, PivotCell>;
  regionTotals: Record<string, PivotCell>;
  grandTotal: PivotCell;
}

export interface AISummaryResponse {
  summary: string;
  isAiGenerated: boolean;
  model: string;
}
