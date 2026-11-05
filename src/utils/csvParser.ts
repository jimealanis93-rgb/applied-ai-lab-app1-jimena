import { ParseResult, SalesOrder, TextCleaningAuditEntry } from '../types';

const KNOWN_ACRONYMS: Record<string, string> = {
  emea: 'EMEA',
  apac: 'APAC',
  latam: 'LATAM',
  na: 'NA',
  eu: 'EU',
  uk: 'UK',
  us: 'US',
  usa: 'USA',
  b2b: 'B2B',
  b2c: 'B2C',
  saas: 'SaaS',
  '5g': '5G',
  ai: 'AI',
  sku: 'SKU',
  id: 'ID',
  crm: 'CRM',
  erp: 'ERP',
  hq: 'HQ',
  it: 'IT',
};

// Common minor words kept lowercase in titles unless at start
const LOWERCASE_WORDS = new Set(['and', 'or', 'the', 'in', 'of', 'for', 'with', 'at', 'by', 'to', 'on']);

/**
 * Normalizes text to resolve common human entry mistakes:
 * - Inconsistent casing (e.g. "west" vs "West" vs "WEST")
 * - Surrounding / internal extra whitespace and unicode non-breaking spaces
 * - Stray quotation marks or accidental punctuation (e.g. "West.", "'West'")
 * - Industry acronym preservation (e.g. "emea" -> "EMEA", "saas" -> "SaaS")
 * - Compound hyphenated/slashed words (e.g. "e-commerce" -> "E-Commerce")
 */
export function cleanTextColumn(
  rawInput: string,
  columnType: 'quarter' | 'region' | 'channel' | 'product'
): { cleaned: string; changed: boolean; reason: string } {
  if (!rawInput) {
    return { cleaned: '', changed: false, reason: '' };
  }

  const reasons: string[] = [];
  let current = rawInput;

  // 1. Remove unicode non-breaking spaces (\u00A0), zero-width characters (\u200B), tabs, and CR
  const cleanedUnicode = current.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ').replace(/[\r\t\n]+/g, ' ');
  if (cleanedUnicode !== current) {
    reasons.push('Removed hidden/unicode whitespace');
    current = cleanedUnicode;
  }

  // 2. Strip surrounding whitespace
  const trimmed = current.trim();
  if (trimmed !== current) {
    reasons.push('Trimmed leading/trailing whitespace');
    current = trimmed;
  }

  // 3. Strip surrounding quotation marks or accidental wrapping punctuation
  const strippedQuotes = current.replace(/^['"`]+|['"`]+$/g, '').trim();
  if (strippedQuotes !== current) {
    reasons.push('Stripped surrounding quotes');
    current = strippedQuotes;
  }

  // 4. Strip accidental trailing commas, periods, semicolons (e.g. "West.")
  const strippedPunct = current.replace(/[.,;:]+$/, '').trim();
  if (strippedPunct !== current) {
    reasons.push('Removed trailing punctuation');
    current = strippedPunct;
  }

  // 5. Collapse multiple internal spaces
  const singleSpaced = current.replace(/\s{2,}/g, ' ');
  if (singleSpaced !== current) {
    reasons.push('Collapsed multiple consecutive spaces');
    current = singleSpaced;
  }

  // 6. Column-specific normalization
  if (columnType === 'quarter') {
    const normQ = normalizeQuarter(current);
    if (normQ !== current) {
      reasons.push(`Standardized quarter identifier to "${normQ}"`);
      current = normQ;
    }
  } else {
    // For Region, Channel, Product: apply smart title-casing & acronym preservation
    const titleCased = smartTitleCase(current, columnType);
    if (titleCased !== current) {
      reasons.push(`Standardized casing to "${titleCased}"`);
      current = titleCased;
    }
  }

  const isChanged = current !== rawInput;
  return {
    cleaned: current,
    changed: isChanged,
    reason: reasons.join(', ') || 'Normalized text format',
  };
}

/**
 * Intelligent Title Casing that preserves recognized acronyms and handles hyphenated words
 */
function smartTitleCase(text: string, columnType: 'region' | 'channel' | 'product'): string {
  // If the entire string matches an acronym (case-insensitively)
  const lowerWhole = text.toLowerCase();
  if (KNOWN_ACRONYMS[lowerWhole]) {
    return KNOWN_ACRONYMS[lowerWhole];
  }

  // Process words separated by spaces
  const words = text.split(' ');
  const transformedWords = words.map((word, wordIndex) => {
    if (!word) return '';

    // Handle compound words with hyphen or slash (e.g. "e-commerce", "direct/online")
    if (word.includes('-')) {
      return word
        .split('-')
        .map((sub, i) => capitalizeSubword(sub, i === 0 && wordIndex === 0))
        .join('-');
    }
    if (word.includes('/')) {
      return word
        .split('/')
        .map((sub, i) => capitalizeSubword(sub, i === 0 && wordIndex === 0))
        .join('/');
    }

    return capitalizeSubword(word, wordIndex === 0);
  });

  return transformedWords.join(' ');
}

function capitalizeSubword(word: string, isFirstWord: boolean): string {
  if (!word) return '';
  const lower = word.toLowerCase();

  // Check known acronym
  if (KNOWN_ACRONYMS[lower]) {
    return KNOWN_ACRONYMS[lower];
  }

  // If small conjunction/preposition and not first word
  if (!isFirstWord && LOWERCASE_WORDS.has(lower)) {
    return lower;
  }

  // Title case standard word (e.g. "west" -> "West", "WEST" -> "West", "lAtAm" -> "Latam")
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function normalizeQuarter(q: string): string {
  const clean = q.trim().toUpperCase();
  // Match patterns like "Q1", "Q 1", "QUARTER 1", "1ST QUARTER", "2024-Q1", "2024 Q1", "FY24 Q1", "1Q"
  const matchQ = clean.match(/(?:QUARTER|QTR|Q)\s*([1-4])/i);
  if (matchQ) {
    return `Q${matchQ[1]}`;
  }

  const matchOrd = clean.match(/([1-4])(?:ST|ND|RD|TH)?\s*(?:QUARTER|QTR|Q)/i);
  if (matchOrd) {
    return `Q${matchOrd[1]}`;
  }

  const matchSuffix = clean.match(/([1-4])Q/i);
  if (matchSuffix) {
    return `Q${matchSuffix[1]}`;
  }

  return clean;
}

export function parseCSV(csvText: string, enableAutoClean = true): ParseResult {
  const errors: string[] = [];
  const cleaningAudit: TextCleaningAuditEntry[] = [];
  const lines = csvText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      data: [],
      errors: ['The CSV file is empty or does not contain data rows.'],
      totalRows: 0,
      validRows: 0,
      headers: [],
      cleaningAudit: [],
      cleanedCount: 0,
    };
  }

  // Parse header line respecting quotes
  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));

  // Required columns: quarter, region, channel, product, units, discount_pct, revenue
  const findColIndex = (aliases: string[]) => {
    return headers.findIndex((h) => aliases.some((alias) => h === alias || h.includes(alias)));
  };

  const quarterIdx = findColIndex(['quarter', 'qtr', 'period']);
  const regionIdx = findColIndex(['region', 'territory', 'market', 'area', 'zone']);
  const channelIdx = findColIndex(['channel', 'saleschannel', 'route', 'segment']);
  const productIdx = findColIndex(['product', 'productname', 'item', 'sku', 'offering']);
  const unitsIdx = findColIndex(['units', 'unit', 'quantity', 'qty', 'volume', 'count']);
  const discountIdx = findColIndex(['discountpct', 'discount', 'discountpercentage', 'discountrate', 'disc', 'discpct']);
  const revenueIdx = findColIndex(['revenue', 'sales', 'salesrevenue', 'totalrevenue', 'amount', 'totalamount', 'rev']);

  const missing: string[] = [];
  if (quarterIdx === -1) missing.push('quarter');
  if (regionIdx === -1) missing.push('region');
  if (channelIdx === -1) missing.push('channel');
  if (productIdx === -1) missing.push('product');
  if (unitsIdx === -1) missing.push('units');
  if (discountIdx === -1) missing.push('discount_pct');
  if (revenueIdx === -1) missing.push('revenue');

  if (missing.length > 0) {
    return {
      data: [],
      errors: [
        `Missing required columns in CSV header: ${missing.join(', ')}. Required: quarter, region, channel, product, units, discount_pct, revenue`,
      ],
      totalRows: lines.length - 1,
      validRows: 0,
      headers: splitCSVLine(lines[0]),
      cleaningAudit: [],
      cleanedCount: 0,
    };
  }

  const data: SalesOrder[] = [];
  let rowId = 1;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = splitCSVLine(rawLine);
    if (cols.length < headers.length) {
      errors.push(`Row ${i + 1}: Line has fewer columns than header (${cols.length} vs ${headers.length})`);
      continue;
    }

    const rawQuarter = cols[quarterIdx] ?? '';
    const rawRegion = cols[regionIdx] ?? '';
    const rawChannel = cols[channelIdx] ?? '';
    const rawProduct = cols[productIdx] ?? '';
    const rawUnits = cols[unitsIdx] ?? '';
    const rawDiscount = cols[discountIdx] ?? '';
    const rawRevenue = cols[revenueIdx] ?? '';

    if (!rawQuarter.trim() || !rawRegion.trim() || !rawProduct.trim()) {
      errors.push(`Row ${i + 1}: Missing values for essential fields (quarter, region, or product)`);
      continue;
    }

    // Clean text columns if enabled, tracking audit
    let cleanedQuarter = rawQuarter.trim();
    let cleanedRegion = rawRegion.trim();
    let cleanedChannel = rawChannel.trim() || 'Direct';
    let cleanedProduct = rawProduct.trim();

    if (enableAutoClean) {
      const qRes = cleanTextColumn(rawQuarter, 'quarter');
      if (qRes.changed) {
        cleaningAudit.push({ row: i + 1, column: 'quarter', original: rawQuarter, cleaned: qRes.cleaned, reason: qRes.reason });
      }
      cleanedQuarter = qRes.cleaned;

      const rRes = cleanTextColumn(rawRegion, 'region');
      if (rRes.changed) {
        cleaningAudit.push({ row: i + 1, column: 'region', original: rawRegion, cleaned: rRes.cleaned, reason: rRes.reason });
      }
      cleanedRegion = rRes.cleaned;

      const cRes = cleanTextColumn(rawChannel, 'channel');
      if (cRes.changed) {
        cleaningAudit.push({ row: i + 1, column: 'channel', original: rawChannel, cleaned: cRes.cleaned, reason: cRes.reason });
      }
      cleanedChannel = cRes.cleaned || 'Direct';

      const pRes = cleanTextColumn(rawProduct, 'product');
      if (pRes.changed) {
        cleaningAudit.push({ row: i + 1, column: 'product', original: rawProduct, cleaned: pRes.cleaned, reason: pRes.reason });
      }
      cleanedProduct = pRes.cleaned;
    }

    // Clean numeric values
    const cleanNumber = (val: string): number => {
      if (!val) return 0;
      const cleaned = val.replace(/[$,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const units = Math.max(0, Math.round(cleanNumber(rawUnits)));
    let discount = cleanNumber(rawDiscount.replace(/%/g, ''));
    if (discount > 1) {
      discount = discount / 100; // e.g. 15% entered as 15 -> 0.15
    }
    discount = Math.max(0, Math.min(1, discount));

    const revenue = cleanNumber(rawRevenue);

    data.push({
      id: `order-${rowId++}`,
      quarter: cleanedQuarter,
      region: cleanedRegion,
      channel: cleanedChannel,
      product: cleanedProduct,
      units,
      discount_pct: discount,
      revenue,
    });
  }

  return {
    data,
    errors: errors.slice(0, 10),
    totalRows: lines.length - 1,
    validRows: data.length,
    headers: splitCSVLine(lines[0]),
    cleaningAudit,
    cleanedCount: cleaningAudit.length,
  };
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
