const { db } = require('./db');

console.log('🌱 Seeding initial sample data for China Sourcing Accounts...');

// 1. Seed Sample Customers
const insertCust = db.prepare(`
  INSERT OR REPLACE INTO customers (id, name, company, mobile, address, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertCust.run('CUST-0001', 'Alexander Vance', 'Apex Global Trade Ltd', '+86 138 0011 2233', 'Suite 402, Yiwu International Trade City', 'Sep 2, 2026');
insertCust.run('CUST-0002', 'Sarah Jenkins', 'Nordic Sourcing Hub', '+44 7911 123456', '74 King Street, Manchester, UK', 'Sep 2, 2026');
insertCust.run('CUST-0003', 'Tariq Mehmood', 'Al-Rayan Imports LLC', '+971 50 123 4567', 'Deira Business Center, Dubai, UAE', 'Sep 3, 2026');

// 2. Seed Sample Orders
const insertOrder = db.prepare(`
  INSERT OR REPLACE INTO orders (id, name, customer_id, customer_name, details, invoice_amount, received_to_date, receivable_balance, expenses_so_far, profit, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertOrder.run(
  'ORD-0001',
  'Yiwu Kitchenware Sourcing #104',
  'CUST-0001',
  'Alexander Vance',
  '5,000 sets stainless steel lunchboxes + food-grade silicone lids. Direct factory packing.',
  65000,
  45000,
  20000,
  48000,
  17000,
  'Sep 2, 2026'
);

insertOrder.run(
  'ORD-0002',
  'Shenzhen Bluetooth ANC Headphones Batch A',
  'CUST-0002',
  'Sarah Jenkins',
  '2,000 units over-ear active noise canceling headsets with customized brand packaging and CE/FCC certs.',
  120000,
  120000,
  0,
  92000,
  28000,
  'Sep 2, 2026'
);

// 3. Seed Sample Quote
const insertQuote = db.prepare(`
  INSERT OR REPLACE INTO quotes (
    id, date, order_id, order_name, customer_id, customer_name,
    products_json, prod_currency, prod_rate, prod_total,
    services_json, serv_currency, serv_rate, serv_total,
    packing_json, total_boxes, total_weight, total_cbm, grand_total, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleProducts = [
  { id: 1, name: 'Double-wall Vacuum Tumbler 500ml', pic: '☕', qty: 2500, price: 14.50, amount: 36250, includesShipping: true },
  { id: 2, name: 'Silicone Straw Cleaning Set', pic: '📦', qty: 2500, price: 2.20, amount: 5500, includesShipping: false }
];

const sampleServices = [
  { id: 1, name: 'Pre-Shipment Inspection (QC)', type: 'fixed', value: 1800, amount: 1800 },
  { id: 2, name: 'Sourcing Commission Fee', type: 'percent', value: 5, amount: 2087.50 }
];

const samplePacking = [
  { id: 1, w: 45, l: 55, d: 35, unit: 'cm', weight: 14.5, boxes: 50, totalWeight: 725, totalCbm: 4.3313 }
];

insertQuote.run(
  'QUO-0001',
  '2026-09-02',
  'ORD-0001',
  'Yiwu Kitchenware Sourcing #104',
  'CUST-0001',
  'Alexander Vance',
  JSON.stringify(sampleProducts),
  'RMB',
  1,
  41750,
  JSON.stringify(sampleServices),
  'RMB',
  1,
  3887.50,
  JSON.stringify(samplePacking),
  50,
  725,
  4.3313,
  45637.50,
  'Sep 2, 2026'
);

// Update counters
db.prepare('UPDATE counters SET next_serial = 4 WHERE name = ?').run('customer');
db.prepare('UPDATE counters SET next_serial = 3 WHERE name = ?').run('order');
db.prepare('UPDATE counters SET next_serial = 2 WHERE name = ?').run('quote');

console.log('✅ Seed completed successfully! Database now has 3 customers, 2 orders, and 1 quotation.');
