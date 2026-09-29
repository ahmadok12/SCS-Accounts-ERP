# Shaikh China Sourcing (SCS) Accounts ERP

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-emerald?style=for-the-badge&logo=github)](https://ahmadok12.github.io/SCS-Accounts-ERP/)
[![Architecture](https://img.shields.io/badge/Architecture-Standalone%20%2F%20Zero--DB-blue?style=for-the-badge)](https://ahmadok12.github.io/SCS-Accounts-ERP/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-purple?style=for-the-badge)](https://ahmadok12.github.io/SCS-Accounts-ERP/)

A modern, high-performance, mobile-first Enterprise Resource Planning (ERP) and financial management application built for **Shaikh China Sourcing**. Designed for tracking cross-border procurement orders, currency exchanges (RMB, PKR, USD, AED, EUR), multi-stage shipment milestones, task checklists, banking operations, and supplier accounting.

---

## 🚀 Live Web App

The application is deployed directly on GitHub Pages with **zero external database dependencies**:
👉 **[Launch SCS Accounts ERP](https://ahmadok12.github.io/SCS-Accounts-ERP/)**

---

## ⚡ Zero Database & Standalone Architecture

This ERP runs completely standalone without requiring any external database (e.g., Supabase or cloud SQL servers):
- **Client-Side Storage Engine (`js/standalone-storage.js`)**: Intercepts REST API requests seamlessly in the browser and persists all records (orders, quotes, invoices, banking, tasks, FX rates) to `localStorage`.
- **Instant Offline Operation**: Works directly from GitHub Pages or locally via `file://`.
- **Backup & Portability**: Export full JSON backups anytime from **Settings > Data & Backup**, or restore your database on any machine with one click.
- **Privacy & Security**: Zero client business data is stored on third-party servers.

---

## 📦 Key Functional Modules

1. **Orders & Procurement Tracking**
   - End-to-end procurement order cards with items, supplier details, delivery tracking, and balance status.
   - Stage progression tracker (e.g., Factory Order, Warehousing, Customs Clearance, Transit, Delivered).
   - Order-specific task checklist templates with completion tracking.

2. **Quotations & Invoicing**
   - Create multi-currency quotations with real-time RMB/PKR/USD conversions.
   - One-click quote approval to invoice conversion.
   - Clean, professional A4 printable quote & proforma invoice sheets with company branding.

3. **Multi-Currency & Exchange Rates**
   - Configurable base currency (RMB / Chinese Yuan) and automated conversion across PKR, USD, AED, EUR, GBP.
   - Dynamic currency rate adjustments with instantaneous recalculation across all active quotes and transactions.

4. **Banking, Cash & Receipts**
   - Multiple bank accounts & cash ledgers with real-time balance tracking.
   - Record customer payment receipts with automatic order balance deduction.
   - Inter-account balance transfers with audit logs.

5. **Purchases & Supplier Accounting**
   - Cash purchases and credit purchase journals.
   - Supplier ledger accounts, payments, and payable tracking.

6. **Order Expense Charging & Overhead Accounting**
   - Track order-specific direct expenses (shipping, customs, duties, handling).
   - Monthly business overhead expenses categorization (rent, utilities, salaries, marketing).

7. **Media Vault**
   - Attach photos, shipment documents, bill-of-lading (BL), and inspection reports directly to orders.

---

## 💻 Running the App

### Option A: Static Host / Direct Browser (Zero Setup)
Simply open `index.html` in any modern web browser or deploy the root directory to GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

### Option B: Local Node.js Development Server (Optional)
If you wish to run the app with local Node.js and SQLite:
```bash
# 1. Install dependencies
npm install

# 2. Start server
npm start
# Server starts on http://localhost:3000
```

---

## 📄 License
Internal proprietary software developed for Shaikh China Sourcing.
