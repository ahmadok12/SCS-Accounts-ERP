const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize Database Tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      next_serial INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO counters (name, next_serial) VALUES 
      ('customer', 1),
      ('order', 1),
      ('quote', 1),
      ('invoice', 1),
      ('product', 1),
      ('service', 1),
      ('bank', 1),
      ('receipt', 1),
      ('expense', 1),
      ('voucher', 1),
      ('supplier', 1),
      ('purchase', 1),
      ('cash_purchase', 1),
      ('payment', 1),
      ('media', 1),
      ('transfer', 1),
      ('overhead_expense', 1),
      ('partner', 1),
      ('banam', 1),
      ('shipping_status', 1),
      ('order_task', 1),
      ('overhead_category', 1),
      ('shipping_bill', 1),
      ('shipping_payment', 1);

    CREATE TABLE IF NOT EXISTS currencies (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      rate_type TEXT NOT NULL, -- 'base', 'greater', 'smaller'
      default_rate REAL NOT NULL,
      is_base INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      mobile TEXT,
      address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      details TEXT,
      invoice_amount REAL DEFAULT 0,
      received_to_date REAL DEFAULT 0,
      receivable_balance REAL DEFAULT 0,
      expenses_so_far REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pic TEXT DEFAULT '📦',
      details TEXT,
      opening_qty REAL DEFAULT 0,
      opening_rate REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      details TEXT,
      default_type TEXT DEFAULT 'fixed', -- 'fixed', 'percent'
      default_rate REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      order_id TEXT NOT NULL,
      order_name TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      products_json TEXT,
      prod_currency TEXT,
      prod_rate REAL DEFAULT 1,
      prod_total REAL DEFAULT 0,
      services_json TEXT,
      serv_currency TEXT,
      serv_rate REAL DEFAULT 1,
      serv_total REAL DEFAULT 0,
      shipping_json TEXT,
      shipping_currency TEXT,
      shipping_rate REAL DEFAULT 1,
      shipping_total REAL DEFAULT 0,
      packing_json TEXT,
      total_boxes INTEGER DEFAULT 0,
      total_weight REAL DEFAULT 0,
      total_cbm REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      customer_currency TEXT DEFAULT 'RMB',
      customer_rate REAL DEFAULT 1,
      customer_total REAL DEFAULT 0,
      status TEXT DEFAULT 'Draft',
      invoice_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      quote_id TEXT,
      date TEXT NOT NULL,
      order_id TEXT NOT NULL,
      order_name TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      products_json TEXT,
      prod_currency TEXT,
      prod_rate REAL DEFAULT 1,
      prod_total REAL DEFAULT 0,
      services_json TEXT,
      serv_currency TEXT,
      serv_rate REAL DEFAULT 1,
      serv_total REAL DEFAULT 0,
      shipping_json TEXT,
      shipping_currency TEXT,
      shipping_json TEXT,
      shipping_currency TEXT DEFAULT 'RMB',
      shipping_rate REAL DEFAULT 1,
      shipping_total REAL DEFAULT 0,
      customer_currency TEXT DEFAULT 'RMB',
      customer_rate REAL DEFAULT 1,
      customer_total REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'product', 'service', 'packing'
      name TEXT NOT NULL,
      details TEXT,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      price REAL DEFAULT 0,
      price_rmb REAL DEFAULT 0,
      qty REAL DEFAULT 1,
      total_rmb REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      details TEXT,
      cost_price REAL DEFAULT 0,
      currency TEXT DEFAULT 'RMB',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      details TEXT,
      service_fee REAL DEFAULT 0,
      currency TEXT DEFAULT 'RMB',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shipping_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'from' or 'to'
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_name TEXT,
      account_number TEXT,
      currency TEXT DEFAULT 'RMB',
      opening_balance REAL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      order_id TEXT,
      order_name TEXT,
      customer_id TEXT,
      customer_name TEXT,
      bank_id TEXT,
      bank_name TEXT,
      bank_account TEXT,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      amount REAL DEFAULT 0,
      amount_rmb REAL DEFAULT 0,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charged_expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      expense_id TEXT,
      expense_name TEXT NOT NULL,
      order_id TEXT,
      order_name TEXT,
      bank_id TEXT,
      bank_name TEXT,
      bank_account TEXT,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      amount REAL DEFAULT 0,
      amount_rmb REAL DEFAULT 0,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      opening_balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'RMB',
      exchange_rate REAL DEFAULT 1,
      opening_balance_rmb REAL DEFAULT 0,
      vendor_type TEXT DEFAULT 'goods', -- 'goods' or 'shipping'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shipping_bills (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      vendor_id TEXT,
      vendor_name TEXT NOT NULL,
      order_id TEXT,
      order_name TEXT,
      customer_name TEXT,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      service_id TEXT,
      service_name TEXT NOT NULL,
      qty REAL DEFAULT 1,
      cost REAL DEFAULT 0,
      cost_rmb REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      amount_rmb REAL DEFAULT 0,
      details TEXT,
      attachment_name TEXT,
      attachment_data TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      supplier_id TEXT,
      supplier_name TEXT NOT NULL,
      order_id TEXT,
      order_name TEXT,
      customer_name TEXT,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      product_id TEXT,
      product_name TEXT NOT NULL,
      qty REAL DEFAULT 1,
      cost REAL DEFAULT 0,
      cost_rmb REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      amount_rmb REAL DEFAULT 0,
      details TEXT,
      attachment_name TEXT,
      attachment_data TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cash_purchases (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      supplier_id TEXT,
      supplier_name TEXT NOT NULL,
      order_id TEXT,
      order_name TEXT,
      customer_name TEXT,
      product_id TEXT,
      product_name TEXT NOT NULL,
      qty REAL DEFAULT 1,
      cost REAL DEFAULT 0,
      cost_rmb REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      amount_rmb REAL DEFAULT 0,
      details TEXT,
      attachment_name TEXT,
      attachment_data TEXT,
      bank_id TEXT,
      bank_name TEXT,
      bank_account TEXT,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplier_payments (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      supplier_id TEXT,
      supplier_name TEXT NOT NULL,
      bank_id TEXT,
      bank_name TEXT,
      bank_account TEXT,
      amount REAL DEFAULT 0,
      amount_rmb REAL DEFAULT 0,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_media (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      order_id TEXT,
      order_name TEXT,
      customer_name TEXT,
      photos_videos TEXT, -- JSON array of { name, type, data, size }
      files TEXT,         -- JSON array of { name, type, data, size }
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bank_transfers (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL, -- 'bank_to_bank', 'rmb_to_pkr', 'pkr_to_rmb'
      from_bank_id TEXT NOT NULL,
      from_bank_name TEXT NOT NULL,
      from_bank_account TEXT,
      to_bank_id TEXT NOT NULL,
      to_bank_name TEXT NOT NULL,
      to_bank_account TEXT,
      from_amount REAL NOT NULL,
      from_currency TEXT NOT NULL,
      to_amount REAL NOT NULL,
      to_currency TEXT NOT NULL,
      exchange_rate REAL DEFAULT 1,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS overhead_expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      expense_id TEXT,
      expense_name TEXT NOT NULL,
      bank_id TEXT,
      bank_name TEXT,
      bank_account TEXT,
      amount REAL NOT NULL,
      amount_rmb REAL NOT NULL,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS overhead_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banam_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      partner_id TEXT,
      partner_name TEXT NOT NULL,
      bank_id TEXT,
      bank_name TEXT,
      bank_account TEXT,
      currency TEXT DEFAULT 'RMB',
      rate REAL DEFAULT 1,
      amount REAL NOT NULL,
      amount_rmb REAL NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shipment_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      default_pct INTEGER NOT NULL,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_shipping_statuses (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_name TEXT NOT NULL,
      customer_name TEXT,
      stage_name TEXT NOT NULL,
      completion_pct INTEGER DEFAULT 0,
      company_notes TEXT,
      customer_notes TEXT,
      notes_history TEXT, -- JSON array of { type: 'company'|'customer', date: string, text: string }
      origin TEXT DEFAULT '',
      destination TEXT DEFAULT '',
      route TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS master_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      default_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_tasks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_name TEXT NOT NULL,
      customer_name TEXT,
      date TEXT NOT NULL,
      tasks_json TEXT NOT NULL, -- JSON array of { id, text, date, completed, order_index }
      created_at TEXT NOT NULL
    );
  `);

  try { db.exec(`ALTER TABLE quotes ADD COLUMN customer_currency TEXT DEFAULT 'RMB';`); } catch (e) {}
  try { db.exec(`ALTER TABLE quotes ADD COLUMN customer_rate REAL DEFAULT 1;`); } catch (e) {}
  try { db.exec(`ALTER TABLE quotes ADD COLUMN customer_total REAL DEFAULT 0;`); } catch (e) {}
  try { db.exec(`ALTER TABLE quotes ADD COLUMN status TEXT DEFAULT 'Draft';`); } catch (e) {}
  try { db.exec(`ALTER TABLE quotes ADD COLUMN invoice_id TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE suppliers ADD COLUMN opening_balance REAL DEFAULT 0;`); } catch (e) {}
  try { db.exec(`ALTER TABLE suppliers ADD COLUMN currency TEXT DEFAULT 'RMB';`); } catch (e) {}
  try { db.exec(`ALTER TABLE suppliers ADD COLUMN exchange_rate REAL DEFAULT 1;`); } catch (e) {}
  try { db.exec(`ALTER TABLE suppliers ADD COLUMN opening_balance_rmb REAL DEFAULT 0;`); } catch (e) {}
  try { db.exec(`ALTER TABLE suppliers ADD COLUMN vendor_type TEXT DEFAULT 'goods';`); } catch (e) {}
  try { db.exec(`ALTER TABLE supplier_payments ADD COLUMN payment_type TEXT DEFAULT 'supplier';`); } catch (e) {}
  try { db.exec(`INSERT OR IGNORE INTO counters (name, next_serial) VALUES ('shipping_bill', 1), ('shipping_payment', 1);`); } catch (e) {}
  try { db.exec(`ALTER TABLE order_shipping_statuses ADD COLUMN route TEXT DEFAULT '';`); } catch (e) {}
  try { db.exec(`ALTER TABLE order_shipping_statuses ADD COLUMN origin TEXT DEFAULT '';`); } catch (e) {}
  try { db.exec(`ALTER TABLE order_shipping_statuses ADD COLUMN destination TEXT DEFAULT '';`); } catch (e) {}
  try {
    db.prepare("UPDATE order_shipping_statuses SET origin = 'Yiwu Warehouse', destination = 'Karachi Port', route = 'Yiwu Warehouse ➔ Karachi Port' WHERE id = 'SHIP-0001'").run();
    db.prepare("UPDATE order_shipping_statuses SET origin = 'Shenzhen Factory', destination = 'Rotterdam Port', route = 'Shenzhen Factory ➔ Rotterdam Port' WHERE id = 'SHIP-0002'").run();
    const allStatuses = db.prepare('SELECT id, route, origin, destination FROM order_shipping_statuses').all();
    allStatuses.forEach(s => {
      if ((!s.origin || !s.destination) && s.route) {
        const parts = s.route.split(/[➔→\->]/);
        if (parts.length >= 2) {
          db.prepare('UPDATE order_shipping_statuses SET origin = ?, destination = ? WHERE id = ?').run(parts[0].trim(), parts[1].trim(), s.id);
        }
      }
    });
  } catch (e) {}

  // Seed sample shipping vendors if none exist
  try {
    const shipVendCount = db.prepare("SELECT COUNT(*) as cnt FROM suppliers WHERE vendor_type = 'shipping'").get().cnt;
    if (shipVendCount === 0) {
      const insertVend = db.prepare(`
        INSERT INTO suppliers (id, name, address, opening_balance, currency, exchange_rate, opening_balance_rmb, vendor_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      insertVend.run('VEND-0001', 'Sinotrans Logistics Ningbo', 'Beilun Port Logistics Zone, Ningbo', 0, 'RMB', 1.0, 0, 'shipping', now);
      insertVend.run('VEND-0002', 'Yiwu Speed Freight Forwarding Ltd', 'Chouzhou North Rd, Yiwu, Zhejiang', 500, 'USD', 7.20, 3600, 'shipping', now);
    }
  } catch (e) {
    console.error('Vendor seed error:', e.message);
  }

  // Seed default shipping locations if not exists
  const countLoc = db.prepare('SELECT COUNT(*) as cnt FROM shipping_locations').get().cnt;
  if (countLoc === 0) {
    const insertLoc = db.prepare(`
      INSERT OR IGNORE INTO shipping_locations (type, name, created_at)
      VALUES (?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    // From locations
    insertLoc.run('from', 'Yiwu', now);
    insertLoc.run('from', 'Guangzhou', now);
    // To locations
    insertLoc.run('to', 'Karachi Warehouse', now);
    insertLoc.run('to', 'Lahore Warehouse', now);
    insertLoc.run('to', 'Faisalabad Warehouse', now);
  }

  // Seed default currencies if not exists
  const countCur = db.prepare('SELECT COUNT(*) as cnt FROM currencies').get().cnt;
  if (countCur === 0) {
    const insertCur = db.prepare(`
      INSERT INTO currencies (code, name, symbol, rate_type, default_rate, is_base, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertCur.run('RMB', 'Chinese Yuan', '¥', 'base', 1.0, 1, now);
    insertCur.run('USD', 'US Dollar', '$', 'greater', 7.20, 0, now);
    insertCur.run('EUR', 'Euro', '€', 'greater', 7.80, 0, now);
    insertCur.run('GBP', 'British Pound', '£', 'greater', 9.15, 0, now);
    insertCur.run('PKR', 'Pakistani Rupee', 'Rs', 'smaller', 39.00, 0, now);
  }

  // Seed sample products if empty
  const countProd = db.prepare('SELECT COUNT(*) as cnt FROM products').get().cnt;
  if (countProd === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (id, name, pic, details, opening_qty, opening_rate, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertProd.run('PROD-0001', 'Double-wall Vacuum Tumbler 500ml', '☕', 'SUS304 Stainless Steel, powder coated, leakproof lid', 2500, 14.50, now);
    insertProd.run('PROD-0002', 'Silicone Straw Cleaning Set', '🥤', 'Food-grade silicone with nylon brush, polybag packed', 5000, 2.20, now);
    insertProd.run('PROD-0003', 'Ceramic Coffee Mug with Bamboo Lid', '🏺', 'Nordic matte glaze, gift box packaging', 1200, 8.80, now);
    insertProd.run('PROD-0004', 'USB-C Fast Charging Cable 2M', '📱', 'Braided nylon, 60W Power Delivery', 3000, 4.50, now);
    db.prepare("UPDATE counters SET next_serial = 5 WHERE name = 'product'").run();
  }

  // Seed sample services if empty
  const countServ = db.prepare('SELECT COUNT(*) as cnt FROM services').get().cnt;
  if (countServ === 0) {
    const insertServ = db.prepare(`
      INSERT INTO services (id, name, details, default_type, default_rate, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertServ.run('SERV-0001', 'Pre-Shipment Inspection (QC)', 'Factory on-site AQL standard quality inspection & photo report', 'fixed', 1800.00, now);
    insertServ.run('SERV-0002', 'Sourcing Commission Fee', 'Full China sourcing, sample validation & factory negotiation fee', 'percent', 5.00, now);
    insertServ.run('SERV-0003', 'Custom Packaging & Barcoding', 'Custom color gift box, FNSKU labeling & palletizing', 'fixed', 650.00, now);
    insertServ.run('SERV-0004', 'Warehouse Consolidation Storage', 'Free 30-day container loading dock consolidation in Yiwu', 'fixed', 0.00, now);
    db.prepare("UPDATE counters SET next_serial = 5 WHERE name = 'service'").run();
  }

  // Seed sample banks if empty
  const countBank = db.prepare('SELECT COUNT(*) as cnt FROM banks').get().cnt;
  if (countBank === 0) {
    const insertBank = db.prepare(`
      INSERT INTO banks (id, name, account_name, account_number, currency, opening_balance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertBank.run('BANK-0001', 'Bank of China (Yiwu Chouzhou Sub-Branch)', 'China Sourcing Ltd', '6217 8520 1948 3012', 'RMB', 50000.00, now);
    insertBank.run('BANK-0002', 'Meezan Bank Ltd (Karachi Corporate)', 'CS Global Logistics PK', '0102 9948 2210 01', 'PKR', 1500000.00, now);
    insertBank.run('BANK-0003', 'Standard Chartered Bank (Hong Kong)', 'China Sourcing International', '448-2-093847-1', 'USD', 25000.00, now);
    db.prepare("UPDATE counters SET next_serial = 4 WHERE name = 'bank'").run();
  }

  // Seed sample receipts if empty
  const countReceipt = db.prepare('SELECT COUNT(*) as cnt FROM receipts').get().cnt;
  if (countReceipt === 0) {
    const insertReceipt = db.prepare(`
      INSERT INTO receipts (
        id, date, order_id, order_name, customer_id, customer_name,
        bank_id, bank_name, bank_account, currency, rate,
        amount, amount_rmb, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertReceipt.run(
      'REC-0001', '2026-09-02', 'ORD-0001', 'Yiwu Kitchenware Sourcing #104', 'CUST-0001', 'Ahmed Al-Mansoor',
      'BANK-0001', 'Bank of China (Yiwu Chouzhou Sub-Branch)', '6217 8520 1948 3012', 'USD', 7.20,
      6250.00, 45000.00, 'Buyer 98% TT deposit received via Bank of China SWIFT MT103 #BOC99281', now
    );
    insertReceipt.run(
      'REC-0002', '2026-09-03', 'ORD-0002', 'Shenzhen Bluetooth ANC Headphones Batch A', 'CUST-0002', 'Fatima Zahra',
      'BANK-0002', 'Meezan Bank Ltd (Karachi Corporate)', '0102 9948 2210 01', 'PKR', 39.00,
      4680000.00, 120000.00, 'Full container order settlement received in PKR corporate account', now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'receipt'").run();
    db.prepare("UPDATE orders SET received_to_date = 45000, receivable_balance = 637.5 WHERE id = 'ORD-0001'").run();
    db.prepare("UPDATE orders SET received_to_date = 120000, receivable_balance = 0 WHERE id = 'ORD-0002'").run();
    db.prepare("UPDATE orders SET received_to_date = 0, receivable_balance = 0 WHERE id = 'ORD-0003'").run();
  }

  // Seed sample expense definitions if empty
  const countExp = db.prepare('SELECT COUNT(*) as cnt FROM expenses').get().cnt;
  if (countExp === 0) {
    const insertExp = db.prepare(`
      INSERT INTO expenses (id, name, details, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertExp.run('EXP-0001', 'Pre-Shipment Factory Inspection (QC)', 'Factory on-site quality check, defect verification & photo audit report', now);
    insertExp.run('EXP-0002', 'China Customs Clearance & Export Docs', 'Export declaration, bill of lading documentation & customs inspection fees', now);
    insertExp.run('EXP-0003', 'Inland Trucking & Loading Dock Labor', 'Factory to Yiwu/Ningbo warehouse transport and container staging', now);
    insertExp.run('EXP-0004', 'Packaging, Palletizing & Barcode Labels', 'Export pallet wrapping, strapping and carton FNSKU barcode application', now);
    db.prepare("UPDATE counters SET next_serial = 5 WHERE name = 'expense'").run();
  }

  // Seed sample charged expenses if empty
  const countCharged = db.prepare('SELECT COUNT(*) as cnt FROM charged_expenses').get().cnt;
  if (countCharged === 0) {
    const insertCharged = db.prepare(`
      INSERT INTO charged_expenses (
        id, date, expense_id, expense_name, order_id, order_name,
        bank_id, bank_name, bank_account, currency, rate,
        amount, amount_rmb, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertCharged.run(
      'VOUCH-0001', '2026-09-02', 'EXP-0001', 'Pre-Shipment Factory Inspection (QC)',
      'ORD-0001', 'Yiwu Kitchenware Sourcing #104',
      'BANK-0001', 'Bank of China (Yiwu Chouzhou Sub-Branch)', '6217 8520 1948 3012',
      'RMB', 1.0, 1800.00, 1800.00, 'QC Engineer factory visit fee to Yongkang cookware plant', now
    );
    insertCharged.run(
      'VOUCH-0002', '2026-09-03', 'EXP-0002', 'China Customs Clearance & Export Docs',
      'ORD-0002', 'Shenzhen Bluetooth ANC Headphones Batch A',
      'BANK-0003', 'Standard Chartered Bank (Hong Kong)', '448-2-093847-1',
      'USD', 7.20, 350.00, 2520.00, 'Shenzhen Yantian port export declaration & customs brokerage fee', now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'voucher'").run();
    db.prepare("UPDATE orders SET expenses_so_far = 1800, profit = 45637.5 - 1800 WHERE id = 'ORD-0001'").run();
    db.prepare("UPDATE orders SET expenses_so_far = 2520, profit = 120000 - 2520 WHERE id = 'ORD-0002'").run();
  }

  // Seed sample suppliers if empty
  const countSuppliers = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get().cnt;
  if (countSuppliers === 0) {
    const insertSup = db.prepare(`
      INSERT INTO suppliers (id, name, address, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertSup.run('SUP-0001', 'Shenzhen Opto-Electronics Co., Ltd.', 'Building 4, Fuyong Industrial Park, Baoan District, Shenzhen, Guangdong, China', now);
    insertSup.run('SUP-0002', 'Yiwu Green Horizon Commodity Factory', 'No. 388 Chouzhou North Road, International Trade City Area, Yiwu, Zhejiang, China', now);
    insertSup.run('SUP-0003', 'Guangzhou Apex Hardware & Tools Ltd.', 'Panyu Modern Industrial Zone, Guangzhou, Guangdong, China', now);
    db.prepare("UPDATE counters SET next_serial = 4 WHERE name = 'supplier'").run();
  }

  // Seed sample purchases if empty
  const countPurchases = db.prepare('SELECT COUNT(*) as cnt FROM purchases').get().cnt;
  if (countPurchases === 0) {
    const insertPur = db.prepare(`
      INSERT INTO purchases (
        id, date, supplier_id, supplier_name, order_id, order_name, customer_name,
        currency, rate, product_id, product_name, qty, cost, cost_rmb, amount, amount_rmb,
        details, attachment_name, attachment_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertPur.run(
      'PUR-0001', '2026-08-15', 'SUP-0001', 'Shenzhen Opto-Electronics Co., Ltd.',
      'ORD-0001', 'Yiwu Kitchenware Sourcing #104', 'Global Retail Direct (US)',
      'RMB', 1.0, 'PROD-0001', 'Smart LED Bulb 12W E27 Base',
      2500, 12.50, 12.50, 31250.00, 31250.00,
      'Production batch #1. Factory PI #SOE-2026-088. 30% deposit paid, 70% upon B/L copy.',
      'PI_Shenzhen_Opto_LED.pdf', null, now
    );
    insertPur.run(
      'PUR-0002', '2026-08-20', 'SUP-0002', 'Yiwu Green Horizon Commodity Factory',
      'ORD-0002', 'Shenzhen Bluetooth ANC Headphones Batch A', 'Nordic Home Concepts (EU)',
      'USD', 7.20, 'PROD-0002', 'Stainless Steel Insulated Tumbler 500ml',
      1000, 2.80, 20.16, 2800.00, 20160.00,
      'Laser logo engraving and custom white tuck box packing included.',
      'Factory_Invoice_Tumbler_Yiwu.jpg', null, now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'purchase'").run();
  }

  // Seed sample cash purchases if empty
  const countCashPur = db.prepare('SELECT COUNT(*) as cnt FROM cash_purchases').get().cnt;
  if (countCashPur === 0) {
    const insertCPur = db.prepare(`
      INSERT INTO cash_purchases (
        id, date, supplier_id, supplier_name,
        order_id, order_name, customer_name,
        product_id, product_name, qty, cost, cost_rmb,
        amount, amount_rmb, details, attachment_name, attachment_data,
        bank_id, bank_name, bank_account, currency, rate, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertCPur.run(
      'CPUR-0001', '2026-08-25', 'SUP-0003', 'Guangzhou Apex Hardware & Tools Ltd.',
      'ORD-0001', 'Yiwu Kitchenware Sourcing #104', 'Global Retail Direct (US)',
      'PROD-0001', 'Smart LED Bulb 12W E27 Base', 200, 11.80, 11.80,
      2360.00, 2360.00, 'Urgent spot replacement modules, market buy with cash receipt.',
      'Receipt_Apex_CashBuy.jpg', null,
      'BANK-0001', 'Agricultural Bank of China (ABC)', '6228 4804 9283 1029',
      'RMB', 1.0, now
    );
    insertCPur.run(
      'CPUR-0002', '2026-08-28', 'SUP-0002', 'Yiwu Green Horizon Commodity Factory',
      'ORD-0002', 'Shenzhen Bluetooth ANC Headphones Batch A', 'Nordic Home Concepts (EU)',
      'PROD-0002', 'Stainless Steel Insulated Tumbler 500ml', 300, 2.50, 18.00,
      750.00, 5400.00, 'Direct Yiwu District 2 market buy, paid from Standard Chartered USD account.',
      'Cash_Tumblers_PO_Invoice.pdf', null,
      'BANK-0003', 'Standard Chartered (HK)', '012-872-901823-1',
      'USD', 7.20, now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'cash_purchase'").run();
  }

  // Seed sample supplier payments if empty
  const countPay = db.prepare('SELECT COUNT(*) as cnt FROM supplier_payments').get().cnt;
  if (countPay === 0) {
    const insertPay = db.prepare(`
      INSERT INTO supplier_payments (
        id, date, supplier_id, supplier_name,
        bank_id, bank_name, bank_account,
        amount, amount_rmb, currency, rate, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertPay.run(
      'PAY-0001', '2026-08-18', 'SUP-0001', 'Shenzhen Opto-Electronics Co., Ltd.',
      'BANK-0001', 'Agricultural Bank of China (ABC)', '6228 4804 9283 1029',
      10000.00, 10000.00, 'RMB', 1.0,
      'Advance 30% deposit for LED production run batch #1.', now
    );
    insertPay.run(
      'PAY-0002', '2026-08-22', 'SUP-0002', 'Yiwu Green Horizon Commodity Factory',
      'BANK-0003', 'Standard Chartered (HK)', '012-872-901823-1',
      1500.00, 10800.00, 'USD', 7.20,
      'Material procurement deposit via telegraphic transfer (T/T).', now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'payment'").run();
  }

  // Seed sample order media if empty
  const countMedia = db.prepare('SELECT COUNT(*) as cnt FROM order_media').get().cnt;
  if (countMedia === 0) {
    const insertMedia = db.prepare(`
      INSERT INTO order_media (
        id, date, order_id, order_name, customer_name,
        photos_videos, files, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertMedia.run(
      'MED-0001', '2026-08-16', 'ORD-0001', 'Yiwu Kitchenware Sourcing #104', 'Global Retail Direct (US)',
      JSON.stringify([
        { name: 'LED_Bulb_Front_Sample.jpg', type: 'image/jpeg', size: 345210, preview: '💡' },
        { name: 'LED_Bulb_Packaging_Tuckbox.jpg', type: 'image/jpeg', size: 412800, preview: '📦' },
        { name: 'Factory_Assembly_Line_QC.mp4', type: 'video/mp4', size: 2489000, preview: '🎥' }
      ]),
      JSON.stringify([
        { name: 'Factory_Product_Datasheet.pdf', type: 'application/pdf', size: 124500 },
        { name: 'CE_RoHS_Certification.pdf', type: 'application/pdf', size: 214800 },
        { name: 'Color_Master_Artwork.pdf', type: 'application/pdf', size: 584000 }
      ]),
      'Pre-production golden samples approved. High resolution product shots and CE RoHS test reports from manufacturer.',
      now
    );
    insertMedia.run(
      'MED-0002', '2026-08-21', 'ORD-0002', 'Shenzhen Bluetooth ANC Headphones Batch A', 'Nordic Home Concepts (EU)',
      JSON.stringify([
        { name: 'Tumbler_Matte_Black_Engraving.jpg', type: 'image/jpeg', size: 520100, preview: '🥤' },
        { name: 'Thermal_Insulation_Test_Video.mp4', type: 'video/mp4', size: 3890100, preview: '🎥' },
        { name: 'Bulk_Carton_Palletizing.jpg', type: 'image/jpeg', size: 480200, preview: '📦' }
      ]),
      JSON.stringify([
        { name: 'FDA_Food_Grade_Certificate.pdf', type: 'application/pdf', size: 189000 },
        { name: 'Factory_Packing_List_Draft.xlsx', type: 'application/vnd.ms-excel', size: 45000 }
      ]),
      'Laser engraving sample approved by EU buyer. Drop test and thermal retention videos recorded.',
      now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'media'").run();
  }

  // Seed default shipment status stages if empty
  const countStages = db.prepare('SELECT COUNT(*) as cnt FROM shipment_stages').get().cnt;
  if (countStages === 0) {
    const defaultStages = [
      { name: 'Approved', default_pct: 10, order_index: 1 },
      { name: 'Payment', default_pct: 20, order_index: 2 },
      { name: 'Production', default_pct: 35, order_index: 3 },
      { name: 'Received in China Warehouse', default_pct: 50, order_index: 4 },
      { name: 'Quality Check', default_pct: 65, order_index: 5 },
      { name: 'Shipping', default_pct: 80, order_index: 6 },
      { name: 'Customs', default_pct: 90, order_index: 7 },
      { name: 'Delivered', default_pct: 100, order_index: 8 }
    ];
    const insertStage = db.prepare('INSERT INTO shipment_stages (name, default_pct, order_index) VALUES (?, ?, ?)');
    defaultStages.forEach(s => insertStage.run(s.name, s.default_pct, s.order_index));
  }

  // Seed default partners if empty
  const countPartners = db.prepare('SELECT COUNT(*) as cnt FROM partners').get().cnt;
  if (countPartners === 0) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const insertPartner = db.prepare('INSERT INTO partners (id, name, mobile, created_at) VALUES (?, ?, ?, ?)');
    insertPartner.run('PART-0001', 'Asim Khan', '+86 138 2910 8821', now);
    insertPartner.run('PART-0002', 'Tariq Mahmood', '+92 300 4892019', now);
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'partner'").run();
  }

  // Seed banam entries if empty
  const countBanam = db.prepare('SELECT COUNT(*) as cnt FROM banam_entries').get().cnt;
  if (countBanam === 0) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const insertBanam = db.prepare(`
      INSERT INTO banam_entries (
        id, date, partner_id, partner_name, bank_id, bank_name, bank_account,
        currency, rate, amount, amount_rmb, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertBanam.run(
      'BAN-0001', '2026-08-20', 'PART-0001', 'Asim Khan',
      'BANK-0001', 'Agricultural Bank of China (ABC)', '6228 4804 9283 1029',
      'RMB', 1.0, 5000.00, 5000.00,
      'Personal living & business advance draw.', now
    );
    db.prepare("UPDATE counters SET next_serial = 2 WHERE name = 'banam'").run();
  }

  // Seed overhead expenses if empty
  const countOverheads = db.prepare('SELECT COUNT(*) as cnt FROM overhead_expenses').get().cnt;
  if (countOverheads === 0) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const insertOverhead = db.prepare(`
      INSERT INTO overhead_expenses (
        id, date, expense_id, expense_name, bank_id, bank_name, bank_account,
        amount, amount_rmb, currency, rate, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertOverhead.run(
      'OVHD-0001', '2026-08-15', 'EXP-0001', 'Office Rent & Utilities',
      'BANK-0001', 'Agricultural Bank of China (ABC)', '6228 4804 9283 1029',
      3500.00, 3500.00, 'RMB', 1.0,
      'Yiwu representative office rent & high-speed broadband monthly lease.', now
    );
    insertOverhead.run(
      'OVHD-0002', '2026-08-22', 'EXP-0002', 'Cloud Server & ERP Subscription',
      'BANK-0003', 'Standard Chartered (HK)', '012-872-901823-1',
      150.00, 1080.00, 'USD', 7.20,
      'Monthly cloud server backup and VoIP telecom hosting.', now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'overhead_expense'").run();
  }

  // Seed bank transfers if empty
  const countTransfers = db.prepare('SELECT COUNT(*) as cnt FROM bank_transfers').get().cnt;
  if (countTransfers === 0) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const insertTransfer = db.prepare(`
      INSERT INTO bank_transfers (
        id, date, type, from_bank_id, from_bank_name, from_bank_account,
        to_bank_id, to_bank_name, to_bank_account,
        from_amount, from_currency, to_amount, to_currency, exchange_rate, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTransfer.run(
      'TRF-0001', '2026-08-19', 'bank_to_bank',
      'BANK-0001', 'Agricultural Bank of China (ABC)', '6228 4804 9283 1029',
      'BANK-0002', 'Industrial and Commercial Bank of China (ICBC)', '6212 2612 0200 4821',
      20000.00, 'RMB', 20000.00, 'RMB', 1.0,
      'Treasury rebalancing transfer to primary operating account.', now
    );
    insertTransfer.run(
      'TRF-0002', '2026-08-25', 'rmb_to_pkr',
      'BANK-0001', 'Agricultural Bank of China (ABC)', '6228 4804 9283 1029',
      'BANK-0004', 'Habib Bank Limited (HBL Pakistan)', '0042 7901 8234 03',
      5000.00, 'RMB', 195000.00, 'PKR', 39.00,
      'Remittance to Lahore warehouse operating expenses at 39.00 PKR/RMB.', now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'transfer'").run();
  }

  // Repair any transfers that have blank or null bank names
  try {
    db.prepare(`
      UPDATE bank_transfers 
      SET from_bank_name = (SELECT name FROM banks WHERE banks.id = bank_transfers.from_bank_id)
      WHERE (from_bank_name IS NULL OR TRIM(from_bank_name) = '')
        AND EXISTS (SELECT 1 FROM banks WHERE banks.id = bank_transfers.from_bank_id)
    `).run();
    db.prepare(`
      UPDATE bank_transfers 
      SET to_bank_name = (SELECT name FROM banks WHERE banks.id = bank_transfers.to_bank_id)
      WHERE (to_bank_name IS NULL OR TRIM(to_bank_name) = '')
        AND EXISTS (SELECT 1 FROM banks WHERE banks.id = bank_transfers.to_bank_id)
    `).run();
  } catch (e) {
    console.error('Error repairing bank transfers:', e.message);
  }

  // Seed shipping statuses if empty
  const countShipping = db.prepare('SELECT COUNT(*) as cnt FROM order_shipping_statuses').get().cnt;
  if (countShipping === 0) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const insertShipping = db.prepare(`
      INSERT INTO order_shipping_statuses (
        id, order_id, order_name, customer_name,
        stage_name, completion_pct, company_notes, customer_notes, notes_history, route, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertShipping.run(
      'SHIP-0001', 'ORD-0001', 'Yiwu Kitchenware Sourcing #104', 'Global Retail Direct (US)',
      'Shipping', 80,
      'Container MSKU-908123 loaded on COSCO Rotterdam voyage #44E. Bill of lading draft verified.',
      'Your container has successfully departed Ningbo Port and is on the water. Estimated arrival: 18 days.',
      JSON.stringify([
        { type: 'company', date: '2026-08-16', text: 'Factory completed packaging and passed QC with 0 defects.' },
        { type: 'customer', date: '2026-08-16', text: 'Goods received in Yiwu warehouse. Quality report attached.' },
        { type: 'company', date: '2026-08-23', text: 'Container MSKU-908123 loaded on COSCO Rotterdam voyage #44E.' },
        { type: 'customer', date: '2026-08-23', text: 'Your container has departed Ningbo Port. Tracking activated.' }
      ]),
      'Yiwu Warehouse ➔ Karachi Port',
      now
    );
    insertShipping.run(
      'SHIP-0002', 'ORD-0002', 'Shenzhen Bluetooth ANC Headphones Batch A', 'Nordic Home Concepts (EU)',
      'Quality Check', 65,
      'Full AQL 2.5 sampling conducted. Battery cycles and ANC response curves verified within spec.',
      'Your order has completed manufacturing and is currently in final QA testing before packaging.',
      JSON.stringify([
        { type: 'company', date: '2026-08-18', text: 'PCB assembly line completed batch run.' },
        { type: 'customer', date: '2026-08-18', text: 'Production has finished ahead of schedule.' },
        { type: 'company', date: '2026-08-24', text: 'Full AQL 2.5 sampling conducted. Battery cycles OK.' },
        { type: 'customer', date: '2026-08-24', text: 'Quality check in progress at factory.' }
      ]),
      'Shenzhen Factory ➔ Rotterdam Port',
      now
    );
    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'shipping_status'").run();
  }

  // Seed default master tasks if empty
  const countMasterTasks = db.prepare('SELECT COUNT(*) as cnt FROM master_tasks').get().cnt;
  if (countMasterTasks === 0) {
    const defaultMasterTasks = [
      { title: 'Golden Sample approval & specification sign-off', default_order: 1 },
      { title: 'Confirm Proforma Invoice (PI) & terms with factory', default_order: 2 },
      { title: 'Verify deposit transfer & schedule production kick-off', default_order: 3 },
      { title: 'Conduct mid-production raw materials inspection', default_order: 4 },
      { title: 'Final Pre-Shipment Inspection (PSI) per AQL 2.5', default_order: 5 },
      { title: 'Verify export packaging, barcode & carton labeling', default_order: 6 },
      { title: 'Book shipping space & issue Bill of Lading / AWB draft', default_order: 7 },
      { title: 'Confirm customs clearance & final destination handover', default_order: 8 }
    ];
    const insertMTask = db.prepare('INSERT INTO master_tasks (title, default_order) VALUES (?, ?)');
    defaultMasterTasks.forEach(t => insertMTask.run(t.title, t.default_order));
  }

  // Seed sample order tasks if empty
  const countOrderTasks = db.prepare('SELECT COUNT(*) as cnt FROM order_tasks').get().cnt;
  if (countOrderTasks === 0) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const fmt = (offsetDays = 0) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const insertOrderTask = db.prepare(`
      INSERT INTO order_tasks (id, order_id, order_name, customer_name, date, tasks_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrderTask.run(
      'TSK-0001', 'ORD-0001', 'Yiwu Kitchenware Sourcing #104', 'Global Retail Direct (US)',
      fmt(0),
      JSON.stringify([
        { id: 't1', text: 'Golden Sample approval & specification sign-off', date: fmt(-5), completed: true, order_index: 1 },
        { id: 't2', text: 'Confirm Proforma Invoice (PI) & terms with factory', date: fmt(-3), completed: true, order_index: 2 },
        { id: 't3', text: 'Verify deposit transfer & schedule production kick-off', date: fmt(-1), completed: true, order_index: 3 },
        { id: 't4', text: 'Conduct mid-production raw materials inspection', date: fmt(0), completed: false, order_index: 4 },
        { id: 't5', text: 'Final Pre-Shipment Inspection (PSI) per AQL 2.5', date: fmt(1), completed: false, order_index: 5 },
        { id: 't6', text: 'Verify export packaging, barcode & carton labeling', date: fmt(3), completed: false, order_index: 6 },
        { id: 't7', text: 'Book shipping space & issue Bill of Lading / AWB draft', date: fmt(7), completed: false, order_index: 7 },
        { id: 't8', text: 'Confirm customs clearance & final destination handover', date: fmt(14), completed: false, order_index: 8 }
      ]),
      now
    );

    insertOrderTask.run(
      'TSK-0002', 'ORD-0002', 'Shenzhen Bluetooth ANC Headphones Batch A', 'Nordic Home Concepts (EU)',
      fmt(0),
      JSON.stringify([
        { id: 't1', text: 'Golden Sample approval & specification sign-off', date: fmt(-4), completed: true, order_index: 1 },
        { id: 't2', text: 'Confirm Proforma Invoice (PI) & terms with factory', date: fmt(-2), completed: true, order_index: 2 },
        { id: 't3', text: 'Verify deposit transfer & schedule production kick-off', date: fmt(0), completed: false, order_index: 3 },
        { id: 't4', text: 'Conduct mid-production raw materials inspection', date: fmt(1), completed: false, order_index: 4 },
        { id: 't5', text: 'Final Pre-Shipment Inspection (PSI) per AQL 2.5', date: fmt(4), completed: false, order_index: 5 },
        { id: 't6', text: 'Verify export packaging, barcode & carton labeling', date: fmt(8), completed: false, order_index: 6 }
      ]),
      now
    );

    db.prepare("UPDATE counters SET next_serial = 3 WHERE name = 'order_task'").run();
  }

  // Seed default overhead categories if empty
  const countOHC = db.prepare('SELECT COUNT(*) as cnt FROM overhead_categories').get().cnt;
  if (countOHC === 0) {
    const insertOHC = db.prepare('INSERT INTO overhead_categories (id, name, details, created_at) VALUES (?, ?, ?, ?)');
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    insertOHC.run('OHC-0001', 'Office Rent', 'Office space lease and building maintenance', now);
    insertOHC.run('OHC-0002', 'Staff Salaries & Wages', 'Employee monthly salaries and team compensation', now);
    insertOHC.run('OHC-0003', 'Utilities & Electricity', 'Warehouse & office electricity, water, and heating bills', now);
    insertOHC.run('OHC-0004', 'Internet, Phone & Telecom', 'Broadband internet, mobile packages and cloud software', now);
    insertOHC.run('OHC-0005', 'Office Supplies & Refreshments', 'Stationery, printer supplies, tea and office consumables', now);
    insertOHC.run('OHC-0006', 'Legal, Audit & Professional Fees', 'Accounting, tax filing and trade legal advisory', now);
    db.prepare("UPDATE counters SET next_serial = 7 WHERE name = 'overhead_category'").run();
  }

  // Non-destructive migrations for orders table (completion & closure status)
  try {
    db.exec('ALTER TABLE orders ADD COLUMN is_completed INTEGER DEFAULT 0;');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE orders ADD COLUMN is_closed INTEGER DEFAULT 0;');
  } catch (e) {}
  try {
    db.exec("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'active';");
  } catch (e) {}
}

initDb();

function getNextSerial(counterName) {
  const row = db.prepare('SELECT next_serial FROM counters WHERE name = ?').get(counterName);
  const current = row ? row.next_serial : 1;
  db.prepare('UPDATE counters SET next_serial = ? WHERE name = ?').run(current + 1, counterName);
  return current;
}

module.exports = {
  db,
  getNextSerial
};
