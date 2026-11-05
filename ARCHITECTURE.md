# Application Architecture

## Executive Overview
The **Sales Revenue Analytics & Quarterly Variance AI** application is an executive financial intelligence dashboard designed to give business leaders instant visibility into regional sales performance, quarterly revenue shifts, and underlying operational drivers. By ingesting raw transaction CSV files or curated sample datasets, the platform automatically cleanses human data-entry errors (such as misspelled regions or inconsistent quarter formatting) and computes multi-dimensional revenue pivot matrices and quarter-over-quarter variance metrics. At the center of the experience is an AI-powered executive summary engine that analyzes the crucial Q2-to-Q3 performance inflection point, synthesizing complex changes in revenue, product mix, distribution channels, unit volumes, and discounting behavior into a strictly grounded, three-sentence brief tailored for boardroom review.

---

## File Inventory & Responsibilities

| File | Business & Architectural Purpose |
| :--- | :--- |
| `ARCHITECTURE.md` | Documents the system overview and file-by-file operational responsibilities for business stakeholders and technical teams. |
| `.env.example` | Defines the template and documentation for necessary server environment variables, including port configuration and Gemini API access keys. |
| `.gitignore` | Specifies directories and sensitive local files—such as dependencies, build outputs, and secret files—that must remain excluded from version control. |
| `bun.lock` | Preserves deterministic package resolution metadata for the project dependencies. |
| `index.html` | Serves as the primary HTML entry point for the browser application, establishing page title, SEO metadata, and the root mounting node. |
| `metadata.json` | Configures the platform application manifest, specifying capabilities such as server-side Gemini AI integration. |
| `package.json` | Declares project dependencies, runtime libraries, and build scripts for both the Express backend and React frontend. |
| `server.ts` | Hosts the Node.js Express backend server that serves the frontend, integrates Vite development middleware, and exposes the secure API endpoint for generating grounded executive variance summaries. |
| `src/App.tsx` | Serves as the master dashboard container, coordinating application state for file uploads, automated data cleansing, analytics processing, and sub-component rendering. |
| `src/components/AiSummaryCard.tsx` | Presents the AI-generated three-sentence executive summary explaining which region experienced the largest Q2-to-Q3 revenue change and the business drivers behind it. |
| `src/components/CsvUploader.tsx` | Provides an intuitive file upload interface with sample dataset presets, drag-and-drop ingestion, and an automatic human-error cleansing toggle. |
| `src/components/DataCleaningAuditModal.tsx` | Displays a transparent audit trail modal detailing all automated corrections applied to malformed or misspelled entries in uploaded CSV data. |
| `src/components/Header.tsx` | Renders the top navigation header featuring corporate branding, active dataset indicators, and total processed record counts. |
| `src/components/MetricsOverview.tsx` | Renders executive KPI summary cards highlighting total annual revenue, peak financial quarters, average transaction size, and overall variance trends. |
| `src/components/RevenueChart.tsx` | Visualizes regional revenue performance across all four financial quarters using an interactive, color-coded comparative bar chart. |
| `src/components/RevenueTable.tsx` | Displays a detailed pivot matrix table that aggregates revenue and volume by territory and quarter with drill-down transaction capabilities. |
| `src/index.css` | Implements the global stylesheet by loading Tailwind CSS utilities and defining baseline typography and color schemes. |
| `src/main.tsx` | Bootstraps the React runtime by mounting the root application component into the DOM. |
| `src/types.ts` | Defines TypeScript data interfaces and contracts for sales transactions, matrix aggregations, variance calculations, and audit logs. |
| `src/utils/analytics.ts` | Executes the core mathematical and business calculation algorithms for revenue pivots, quarterly growth deltas, volume shifts, and product/channel driver attributions. |
| `src/utils/csvParser.ts` | Parses raw CSV inputs into structured sales records while applying automated fuzzy normalization algorithms to remediate typos in geographic and quarter labels. |
| `src/utils/sampleData.ts` | Supplies realistic pre-configured enterprise sales datasets for immediate demonstration and testing. |
| `tsconfig.json` | Specifies TypeScript compilation settings, type-checking rules, and path alias configurations. |
| `vite.config.ts` | Configures the Vite build system, integrating plugins for React and Tailwind CSS along with root alias resolution. |
