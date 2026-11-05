import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client strictly adhering to the gemini-api skill
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
  }
}

// AI summary endpoint
app.post('/api/summarize-q2-q3-change', async (req, res) => {
  try {
    const {
      topChangedRegion,
      topChangedRegionPct,
      basis, // 'dollar' | 'percent'
      allRegionChanges,
      calculatedDetails,
    } = req.body;

    if (!topChangedRegion) {
      return res.status(400).json({
        error: 'Missing calculated region change metrics. Please provide Q2 and Q3 data.',
      });
    }

    const targetRegion = basis === 'percent' ? topChangedRegionPct : topChangedRegion;

    const dataContext = `
App-Calculated Metrics (STRICT TRUTH SOURCE):
Target Focus Region with Largest Change: ${targetRegion.region} (Basis: ${basis === 'percent' ? 'Percentage Change' : 'Absolute Dollar Change'})
- Q2 Revenue: $${targetRegion.q2Revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Q3 Revenue: $${targetRegion.q3Revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Absolute Dollar Change: ${targetRegion.dollarChange >= 0 ? '+' : ''}$${targetRegion.dollarChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${targetRegion.dollarChange >= 0 ? 'increase' : 'decrease'})
- Percentage Change: ${targetRegion.pctChange >= 0 ? '+' : ''}${targetRegion.pctChange.toFixed(2)}%
- Q2 Units Sold: ${targetRegion.q2Units.toLocaleString()} units
- Q3 Units Sold: ${targetRegion.q3Units.toLocaleString()} units
- Net Units Change: ${targetRegion.unitsChange >= 0 ? '+' : ''}${targetRegion.unitsChange.toLocaleString()} units (${targetRegion.pctChangeUnits >= 0 ? '+' : ''}${targetRegion.pctChangeUnits.toFixed(2)}%)
- Q2 Average Discount: ${(targetRegion.q2AvgDiscount * 100).toFixed(2)}%
- Q3 Average Discount: ${(targetRegion.q3AvgDiscount * 100).toFixed(2)}%
- Discount Rate Shift: ${(targetRegion.discountDiffPts).toFixed(2)} percentage points

Top Product Revenue Drivers in ${targetRegion.region} from Q2 to Q3:
${targetRegion.productDrivers
  ?.map(
    (p: any) =>
      `* Product "${p.product}": Q2 revenue was $${p.q2Rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, Q3 revenue was $${p.q3Rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Net Change: ${p.diff >= 0 ? '+' : ''}$${p.diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, units: ${p.q2Units} -> ${p.q3Units})`
  )
  .join('\n') || 'None'}

Top Channel Revenue Drivers in ${targetRegion.region} from Q2 to Q3:
${targetRegion.channelDrivers
  ?.map(
    (c: any) =>
      `* Channel "${c.channel}": Q2 revenue $${c.q2Rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} vs Q3 revenue $${c.q3Rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Net Change: ${c.diff >= 0 ? '+' : ''}$${c.diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
  )
  .join('\n') || 'None'}

All Regions Q2 to Q3 Comparison Summary:
${allRegionChanges
  ?.map(
    (r: any) =>
      `* ${r.region}: Q2 $${r.q2Revenue.toFixed(2)} -> Q3 $${r.q3Revenue.toFixed(2)} (Delta: ${r.dollarChange >= 0 ? '+' : ''}$${r.dollarChange.toFixed(2)}, ${r.pctChange >= 0 ? '+' : ''}${r.pctChange.toFixed(2)}%)`
  )
  .join('\n')}
`;

    // Attempt Gemini API call with a 4-second timeout race
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Write an executive three-sentence summary of which region changed the most from Q2 to Q3 and why, strictly adhering to the calculated numbers provided below.

Strict Rules:
1. Length: MUST BE EXACTLY THREE (3) SENTENCES. Count your sentences carefully. Do not write two sentences, and do not write four sentences.
2. Content structure:
   - Sentence 1: Identify the region with the greatest change from Q2 to Q3, citing the exact revenue figures ($ from Q2 to Q3, the dollar change, and the percentage change) calculated by the app.
   - Sentence 2: Explain why this shift occurred by citing the specific top contributing product(s) or sales channel(s) and their exact calculated dollar or unit changes.
   - Sentence 3: Contextualize the underlying driver using the calculated unit sales volume and average discount percentage shifts.
3. Truthfulness: You MUST USE ONLY the numbers provided in the calculated data below. Do NOT make up any numbers, estimates, or external speculations.
4. Output: Plain text paragraph only (no markdown headers, no bullet points, no commentary).

${dataContext}`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.2,
          },
        });

        // 3.5 second timeout race
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API call timed out after 3.5s')), 3500)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const generatedText = response?.text?.trim();

        if (generatedText) {
          return res.json({
            summary: generatedText,
            isAiGenerated: true,
            model: 'gemini-3.8-flash',
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini call bypassed or timed out; utilizing strictly-grounded calculation engine:', geminiError.message);
      }
    }

    // High quality deterministic fallback matching the exact prompt requirements
    const reg = targetRegion;
    const topProd = reg.productDrivers?.[0];
    const topChannel = reg.channelDrivers?.[0];
    const direction = reg.dollarChange >= 0 ? 'increased' : 'decreased';
    const directionNoun = reg.dollarChange >= 0 ? 'growth' : 'contraction';

    const s1 = `Between Q2 and Q3, ${reg.region} experienced the greatest revenue change across all regions, shifting by ${reg.dollarChange >= 0 ? '+' : ''}$${Math.abs(reg.dollarChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${reg.pctChange >= 0 ? '+' : ''}${reg.pctChange.toFixed(2)}%) from $${reg.q2Revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to $${reg.q3Revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;

    const s2 = topProd
      ? `This ${directionNoun} was primarily driven by the "${topProd.product}" line, which shifted by ${topProd.diff >= 0 ? '+' : ''}$${Math.abs(topProd.diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from $${topProd.q2Rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in Q2 to $${topProd.q3Rev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in Q3${topChannel ? ` alongside a ${topChannel.diff >= 0 ? '+' : ''}$${Math.abs(topChannel.diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} change in the ${topChannel.channel} channel` : ''}.`
      : `This change was led by sales across regional channels moving from Q2 to Q3.`;

    const s3 = `Overall volume in ${reg.region} moved from ${reg.q2Units.toLocaleString()} units to ${reg.q3Units.toLocaleString()} units (${reg.unitsChange >= 0 ? '+' : ''}${reg.unitsChange.toLocaleString()} units), while the average discount rate moved from ${(reg.q2AvgDiscount * 100).toFixed(2)}% in Q2 to ${(reg.q3AvgDiscount * 100).toFixed(2)}% in Q3 (${reg.discountDiffPts >= 0 ? '+' : ''}${reg.discountDiffPts.toFixed(2)} percentage points).`;

    const fallbackSummary = `${s1} ${s2} ${s3}`;

    return res.json({
      summary: fallbackSummary,
      isAiGenerated: false,
      model: 'calculated-grounded-engine',
    });
  } catch (error: any) {
    console.error('Server error in summarize endpoint:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
