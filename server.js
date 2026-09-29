const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { db, getNextSerial } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper configuration for Sequential IDs & Collision Prevention
const typeEntityConfig = {
  customer: { table: 'customers', prefix: 'CUST', col: 'id' },
  order: { table: 'orders', prefix: 'ORD', col: 'id' },
  quote: { table: 'quotes', prefix: 'QUO', col: 'id' },
  invoice: { table: 'invoices', prefix: 'INV', col: 'id' },
  product: { table: 'products', prefix: 'PROD', col: 'id' },
  service: { table: 'services', prefix: 'SERV', col: 'id' },
  bank: { table: 'banks', prefix: 'BANK', col: 'id' },
  receipt: { table: 'receipts', prefix: 'REC', col: 'id' },
  expense: { table: 'expenses', prefix: 'EXP', col: 'id' },
  voucher: { table: 'charged_expenses', prefix: 'VOUCH', col: 'id' },
  supplier: { table: 'suppliers', prefix: 'SUP', col: 'id' },
  shipping_vendor: { table: 'suppliers', prefix: 'VEND', col: 'id' },
  'shipping-vendor': { table: 'suppliers', prefix: 'VEND', col: 'id' },
  purchase: { table: 'purchases', prefix: 'PUR', col: 'id' },
  shipping_bill: { table: 'shipping_bills', prefix: 'SBILL', col: 'id' },
  'shipping-bill': { table: 'shipping_bills', prefix: 'SBILL', col: 'id' },
  cash_purchase: { table: 'cash_purchases', prefix: 'CPUR', col: 'id' },
  payment: { table: 'supplier_payments', prefix: 'PAY', col: 'id' },
  shipping_payment: { table: 'supplier_payments', prefix: 'SPAY', col: 'id' },
  'shipping-payment': { table: 'supplier_payments', prefix: 'SPAY', col: 'id' },
  media: { table: 'order_media', prefix: 'MED', col: 'id' },
  transfer: { table: 'bank_transfers', prefix: 'TRF', col: 'id' },
  overhead_expense: { table: 'overhead_expenses', prefix: 'OVHD', col: 'id' },
  'overhead-expense': { table: 'overhead_expenses', prefix: 'OVHD', col: 'id' },
  partner: { table: 'partners', prefix: 'PART', col: 'id' },
  banam: { table: 'banam_entries', prefix: 'BAN', col: 'id' },
  'banam-entry': { table: 'banam_entries', prefix: 'BAN', col: 'id' },
  'banam_entry': { table: 'banam_entries', prefix: 'BAN', col: 'id' },
  shipping_status: { table: 'order_shipping_statuses', prefix: 'SHIP', col: 'id' },
  order_task: { table: 'order_tasks', prefix: 'TSK', col: 'id' },
  overhead_category: { table: 'overhead_categories', prefix: 'OHC', col: 'id' },
  'overhead-category': { table: 'overhead_categories', prefix: 'OHC', col: 'id' }
};

function getNextUniqueId(type) {
  const cfg = typeEntityConfig[type];
  const prefix = cfg ? cfg.prefix : 'PUR';
  const row = db.prepare('SELECT next_serial FROM counters WHERE name = ?').get(type);
  let nextNum = row ? row.next_serial : 1;

  if (cfg) {
    try {
      const rows = db.prepare(`SELECT ${cfg.col} as id FROM ${cfg.table}`).all();
      for (const r of rows) {
        if (!r.id) continue;
        const m = String(r.id).match(/\d+$/);
        if (m) {
          const val = parseInt(m[0], 10);
          if (val >= nextNum) {
            nextNum = val + 1;
          }
        }
      }
    } catch (e) {}
  }

  db.prepare('UPDATE counters SET next_serial = ? WHERE name = ?').run(nextNum, type);
  return { nextId: `${prefix}-${String(nextNum).padStart(4, '0')}`, serial: nextNum };
}

app.get('/api/next-id/:type', (req, res) => {
  const { type } = req.params;
  const result = getNextUniqueId(type);
  res.json(result);
});

function ensureCounterAtLeast(counterName, id) {
  if (!id) return;
  const match = String(id).match(/\d+$/);
  if (match) {
    const num = parseInt(match[0], 10);
    const row = db.prepare('SELECT next_serial FROM counters WHERE name = ?').get(counterName);
    if (!row || row.next_serial <= num) {
      db.prepare('UPDATE counters SET next_serial = ? WHERE name = ?').run(num + 1, counterName);
    }
  }
}

// ================= CURRENCIES API =================
app.get('/api/currencies', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM currencies ORDER BY is_base DESC, code ASC').all();
    const formatted = rows.map(r => ({
      code: r.code,
      name: r.name,
      symbol: r.symbol,
      rateType: r.rate_type, // 'base', 'greater', 'smaller'
      defaultRate: Number(r.default_rate),
      isBase: Boolean(r.is_base),
      createdAt: r.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/currencies', (req, res) => {
  try {
    let { code, name, symbol, rateType, defaultRate } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'Currency code and name are required' });

    code = String(code).trim().toUpperCase();
    name = String(name).trim();
    symbol = symbol ? String(symbol).trim() : code;
    rateType = (rateType === 'smaller') ? 'smaller' : (rateType === 'base' ? 'base' : 'greater');
    const rate = Math.max(0.000001, parseFloat(defaultRate) || 1);

    const exists = db.prepare('SELECT code FROM currencies WHERE code = ?').get(code);
    if (exists) {
      return res.status(400).json({ error: `Currency ${code} already exists.` });
    }

    const createdAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stmt = db.prepare(`
      INSERT INTO currencies (code, name, symbol, rate_type, default_rate, is_base, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);
    stmt.run(code, name, symbol, rateType, rate, createdAt);

    const created = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code);
    res.status(201).json({
      code: created.code,
      name: created.name,
      symbol: created.symbol,
      rateType: created.rate_type,
      defaultRate: Number(created.default_rate),
      isBase: Boolean(created.is_base),
      createdAt: created.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/currencies/:code', (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    let { name, symbol, rateType, defaultRate } = req.body;
    if (!name) return res.status(400).json({ error: 'Currency name is required' });

    const isBase = (code === 'RMB');
    if (isBase) {
      rateType = 'base';
      defaultRate = 1.0;
    } else {
      rateType = (rateType === 'smaller') ? 'smaller' : 'greater';
      defaultRate = Math.max(0.000001, parseFloat(defaultRate) || 1);
    }

    symbol = symbol ? String(symbol).trim() : code;

    const stmt = db.prepare(`
      UPDATE currencies
      SET name = ?, symbol = ?, rate_type = ?, default_rate = ?
      WHERE code = ?
    `);
    stmt.run(name, symbol, rateType, defaultRate, code);

    const updated = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code);
    res.json({
      code: updated.code,
      name: updated.name,
      symbol: updated.symbol,
      rateType: updated.rate_type,
      defaultRate: Number(updated.default_rate),
      isBase: Boolean(updated.is_base),
      createdAt: updated.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/currencies/:code', (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    if (code === 'RMB') {
      return res.status(400).json({ error: 'Cannot delete RMB base currency.' });
    }
    db.prepare('DELETE FROM currencies WHERE code = ?').run(code);
    res.json({ success: true, deletedCode: code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CUSTOMERS API =================
app.get('/api/customers', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM customers ORDER BY rowid DESC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const { name, company, mobile, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    let { id } = req.body;
    const exists = id ? db.prepare('SELECT id FROM customers WHERE id = ?').get(id) : null;
    if (!id || exists) {
      id = getNextUniqueId('customer').nextId;
    }

    const createdAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stmt = db.prepare(`
      INSERT INTO customers (id, name, company, mobile, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, company || '—', mobile || '—', address || '—', createdAt);
    ensureCounterAtLeast('customer', id);

    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, mobile, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    const stmt = db.prepare(`
      UPDATE customers 
      SET name = ?, company = ?, mobile = ?, address = ?
      WHERE id = ?
    `);
    stmt.run(name, company || '—', mobile || '—', address || '—', id);

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= ORDERS API =================
function formatOrder(r) {
  if (!r) return null;
  const isCompleted = Boolean(r.is_completed);
  const isClosed = Boolean(r.is_closed);
  const status = r.status || (isClosed ? 'closed' : (isCompleted ? 'completed' : 'active'));
  return {
    id: r.id,
    name: r.name,
    customerId: r.customer_id,
    customer_id: r.customer_id,
    customerName: r.customer_name,
    customer_name: r.customer_name,
    details: r.details,
    invoiceAmount: Number(r.invoice_amount || 0),
    invoice_amount: Number(r.invoice_amount || 0),
    receivedToDate: Number(r.received_to_date || 0),
    received_to_date: Number(r.received_to_date || 0),
    receivableBalance: Number(r.receivable_balance || 0),
    receivable_balance: Number(r.receivable_balance || 0),
    expensesSoFar: Number(r.expenses_so_far || 0),
    expenses_so_far: Number(r.expenses_so_far || 0),
    profit: Number(r.profit || 0),
    isCompleted,
    is_completed: isCompleted ? 1 : 0,
    isClosed,
    is_closed: isClosed ? 1 : 0,
    status,
    createdAt: r.created_at,
    created_at: r.created_at
  };
}

app.get('/api/orders', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM orders ORDER BY rowid DESC').all();
    res.json(rows.map(formatOrder));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const r = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!r) return res.status(404).json({ error: 'Order not found' });
    res.json(formatOrder(r));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { name, customerId, customerName, details, invoiceAmount, receivedToDate, expensesSoFar, isCompleted, isClosed } = req.body;
    if (!name) return res.status(400).json({ error: 'Order name is required' });

    let { id } = req.body;
    const exists = id ? db.prepare('SELECT id FROM orders WHERE id = ?').get(id) : null;
    if (!id || exists) {
      id = getNextUniqueId('order').nextId;
    }

    const inv = parseFloat(invoiceAmount) || 0;
    const rec = parseFloat(receivedToDate) || 0;
    const exp = parseFloat(expensesSoFar) || 0;
    const balance = inv - rec;
    const profit = inv - exp;
    const comp = isCompleted ? 1 : 0;
    const closed = isClosed ? 1 : 0;
    const status = closed ? 'closed' : (comp ? 'completed' : 'active');
    const createdAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const stmt = db.prepare(`
      INSERT INTO orders (id, name, customer_id, customer_name, details, invoice_amount, received_to_date, receivable_balance, expenses_so_far, profit, is_completed, is_closed, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, customerId || null, customerName || null, details || '—', inv, rec, balance, exp, profit, comp, closed, status, createdAt);
    ensureCounterAtLeast('order', id);

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.status(201).json(formatOrder(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, customerId, customerName, details, invoiceAmount, receivedToDate, expensesSoFar } = req.body;
    if (!name) return res.status(400).json({ error: 'Order name is required' });

    const inv = parseFloat(invoiceAmount) || 0;
    const rec = parseFloat(receivedToDate) || 0;
    const exp = parseFloat(expensesSoFar) || 0;
    const balance = inv - rec;
    const profit = inv - exp;

    const current = db.prepare('SELECT is_completed, is_closed, status FROM orders WHERE id = ?').get(id);
    const comp = req.body.isCompleted !== undefined ? (req.body.isCompleted ? 1 : 0) : (current ? current.is_completed : 0);
    const closed = req.body.isClosed !== undefined ? (req.body.isClosed ? 1 : 0) : (current ? current.is_closed : 0);
    const status = closed ? 'closed' : (comp ? 'completed' : 'active');

    const stmt = db.prepare(`
      UPDATE orders 
      SET name = ?, customer_id = ?, customer_name = ?, details = ?, invoice_amount = ?, received_to_date = ?, receivable_balance = ?, expenses_so_far = ?, profit = ?,
          is_completed = ?, is_closed = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(name, customerId || null, customerName || null, details || '—', inv, rec, balance, exp, profit, comp, closed, status, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(formatOrder(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted, isClosed } = req.body;
    const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Order not found' });

    const comp = isCompleted !== undefined ? (isCompleted ? 1 : 0) : (current.is_completed || 0);
    const closed = isClosed !== undefined ? (isClosed ? 1 : 0) : (current.is_closed || 0);
    const status = closed ? 'closed' : (comp ? 'completed' : 'active');

    db.prepare(`
      UPDATE orders 
      SET is_completed = ?, is_closed = ?, status = ?
      WHERE id = ?
    `).run(comp, closed, status, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    res.json(formatOrder(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ================= PRODUCTS API =================
app.get('/api/products', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM products ORDER BY rowid DESC').all();
    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      pic: r.pic || '📦',
      details: r.details || '—',
      openingQty: Number(r.opening_qty || 0),
      openingRate: Number(r.opening_rate || 0),
      createdAt: r.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, pic, details, openingQty, openingRate } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    let { id } = req.body;
    const exists = id ? db.prepare('SELECT id FROM products WHERE id = ?').get(id) : null;
    if (!id || exists) {
      id = getNextUniqueId('product').nextId;
    }

    const createdAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stmt = db.prepare(`
      INSERT INTO products (id, name, pic, details, opening_qty, opening_rate, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, pic || '📦', details || '—', parseFloat(openingQty) || 0, parseFloat(openingRate) || 0, createdAt);
    ensureCounterAtLeast('product', id);

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.status(201).json({
      id: created.id,
      name: created.name,
      pic: created.pic,
      details: created.details,
      openingQty: Number(created.opening_qty),
      openingRate: Number(created.opening_rate),
      createdAt: created.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, pic, details, openingQty, openingRate } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, pic = ?, details = ?, opening_qty = ?, opening_rate = ?
      WHERE id = ?
    `);
    stmt.run(name, pic || '📦', details || '—', parseFloat(openingQty) || 0, parseFloat(openingRate) || 0, id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({
      id: updated.id,
      name: updated.name,
      pic: updated.pic,
      details: updated.details,
      openingQty: Number(updated.opening_qty),
      openingRate: Number(updated.opening_rate),
      createdAt: updated.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SERVICES API =================
app.get('/api/services', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM services ORDER BY rowid DESC').all();
    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      details: r.details || '—',
      defaultType: r.default_type || 'fixed',
      defaultRate: Number(r.default_rate || 0),
      createdAt: r.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', (req, res) => {
  try {
    const { name, details, defaultType, defaultRate } = req.body;
    if (!name) return res.status(400).json({ error: 'Service name is required' });

    let { id } = req.body;
    const exists = id ? db.prepare('SELECT id FROM services WHERE id = ?').get(id) : null;
    if (!id || exists) {
      id = getNextUniqueId('service').nextId;
    }

    const createdAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stmt = db.prepare(`
      INSERT INTO services (id, name, details, default_type, default_rate, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, details || '—', defaultType || 'fixed', parseFloat(defaultRate) || 0, createdAt);
    ensureCounterAtLeast('service', id);

    const created = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.status(201).json({
      id: created.id,
      name: created.name,
      details: created.details,
      defaultType: created.default_type,
      defaultRate: Number(created.default_rate),
      createdAt: created.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, details, defaultType, defaultRate } = req.body;
    if (!name) return res.status(400).json({ error: 'Service name is required' });

    const stmt = db.prepare(`
      UPDATE services
      SET name = ?, details = ?, default_type = ?, default_rate = ?
      WHERE id = ?
    `);
    stmt.run(name, details || '—', defaultType || 'fixed', parseFloat(defaultRate) || 0, id);

    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    res.json({
      id: updated.id,
      name: updated.name,
      details: updated.details,
      defaultType: updated.default_type,
      defaultRate: Number(updated.default_rate),
      createdAt: updated.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM services WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SHIPPING LOCATIONS API =================
app.get('/api/shipping-locations', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM shipping_locations ORDER BY id ASC').all();
    res.json(rows.map(r => ({
      id: r.id,
      type: r.type,
      name: r.name,
      createdAt: r.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shipping-locations', (req, res) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) return res.status(400).json({ error: 'Type and Name are required' });
    const cleanType = type.toLowerCase() === 'from' ? 'from' : 'to';
    const cleanName = name.trim();
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const stmt = db.prepare('INSERT INTO shipping_locations (type, name, created_at) VALUES (?, ?, ?)');
    const result = stmt.run(cleanType, cleanName, now);
    const created = db.prepare('SELECT * FROM shipping_locations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      id: created.id,
      type: created.type,
      name: created.name,
      createdAt: created.created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shipping-locations/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM shipping_locations WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatQuote(r) {
  if (!r) return null;
  return {
    id: r.id,
    date: r.date,
    orderId: r.order_id,
    orderName: r.order_name,
    customerId: r.customer_id,
    customerName: r.customer_name,
    products: r.products_json ? JSON.parse(r.products_json) : [],
    prodCurrency: r.prod_currency || 'RMB',
    prodRate: Number(r.prod_rate || 1),
    prodTotal: Number(r.prod_total || 0),
    services: r.services_json ? JSON.parse(r.services_json) : [],
    servCurrency: r.serv_currency || 'RMB',
    servRate: Number(r.serv_rate || 1),
    servTotal: Number(r.serv_total || 0),
    shipping: r.shipping_json ? JSON.parse(r.shipping_json) : null,
    shippingCurrency: r.shipping_currency || 'RMB',
    shippingRate: Number(r.shipping_rate || 1),
    shippingTotal: Number(r.shipping_total || 0),
    packing: r.packing_json ? JSON.parse(r.packing_json) : [],
    totalBoxes: Number(r.total_boxes || 0),
    totalWeight: Number(r.total_weight || 0),
    totalCbm: Number(r.total_cbm || 0),
    grandTotal: Number(r.grand_total || 0),
    customerCurrency: r.customer_currency || 'RMB',
    customerRate: Number(r.customer_rate || 1),
    customerTotal: Number(r.customer_total || 0),
    status: r.status || 'Draft',
    invoiceId: r.invoice_id || null,
    createdAt: r.created_at
  };
}

function formatInvoice(r) {
  if (!r) return null;
  return {
    id: r.id,
    quoteId: r.quote_id || null,
    date: r.date,
    orderId: r.order_id,
    orderName: r.order_name,
    customerId: r.customer_id,
    customerName: r.customer_name,
    products: r.products_json ? JSON.parse(r.products_json) : [],
    prodCurrency: r.prod_currency || 'RMB',
    prodRate: Number(r.prod_rate || 1),
    prodTotal: Number(r.prod_total || 0),
    services: r.services_json ? JSON.parse(r.services_json) : [],
    servCurrency: r.serv_currency || 'RMB',
    servRate: Number(r.serv_rate || 1),
    servTotal: Number(r.serv_total || 0),
    shipping: r.shipping_json ? JSON.parse(r.shipping_json) : null,
    shippingCurrency: r.shipping_currency || 'RMB',
    shippingRate: Number(r.shipping_rate || 1),
    shippingTotal: Number(r.shipping_total || 0),
    packing: r.packing_json ? JSON.parse(r.packing_json) : [],
    totalBoxes: Number(r.total_boxes || 0),
    totalWeight: Number(r.total_weight || 0),
    totalCbm: Number(r.total_cbm || 0),
    grandTotal: Number(r.grand_total || 0),
    customerCurrency: r.customer_currency || 'RMB',
    customerRate: Number(r.customer_rate || 1),
    customerTotal: Number(r.customer_total || 0),
    status: r.status || 'Issued',
    createdAt: r.created_at
  };
}

// ================= QUOTES API =================
app.get('/api/quotes', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM quotes ORDER BY rowid DESC').all();
    res.json(rows.map(formatQuote));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotes', (req, res) => {
  try {
    const { 
      date, orderId, orderName, customerId, customerName,
      products, prodCurrency, prodRate, prodTotal,
      services, servCurrency, servRate, servTotal,
      shipping, shippingCurrency, shippingRate, shippingTotal,
      packing, totalBoxes, totalWeight, totalCbm, grandTotal,
      customerCurrency, customerRate, customerTotal,
      status, invoiceId
    } = req.body;

    let { id } = req.body;
    if (!id) {
      const serial = getNextSerial('quote');
      id = `QUO-${String(serial).padStart(4, '0')}`;
    }

    const createdAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stmt = db.prepare(`
      INSERT INTO quotes (
        id, date, order_id, order_name, customer_id, customer_name,
        products_json, prod_currency, prod_rate, prod_total,
        services_json, serv_currency, serv_rate, serv_total,
        shipping_json, shipping_currency, shipping_rate, shipping_total,
        packing_json, total_boxes, total_weight, total_cbm, grand_total,
        customer_currency, customer_rate, customer_total, status, invoice_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, date || new Date().toISOString().split('T')[0],
      orderId || 'ORD-0000', orderName || 'General Sourcing',
      customerId || null, customerName || null,
      JSON.stringify(products || []), prodCurrency || 'RMB', parseFloat(prodRate) || 1, parseFloat(prodTotal) || 0,
      JSON.stringify(services || []), servCurrency || 'RMB', parseFloat(servRate) || 1, parseFloat(servTotal) || 0,
      JSON.stringify(shipping || null), shippingCurrency || 'RMB', parseFloat(shippingRate) || 1, parseFloat(shippingTotal) || 0,
      JSON.stringify(packing || []), parseInt(totalBoxes) || 0, parseFloat(totalWeight) || 0, parseFloat(totalCbm) || 0,
      parseFloat(grandTotal) || 0,
      customerCurrency || 'RMB', parseFloat(customerRate) || 1, parseFloat(customerTotal) || 0,
      status || 'Draft', invoiceId || null,
      createdAt
    );

    const created = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
    res.status(201).json(formatQuote(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/quotes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      date, orderId, orderName, customerId, customerName,
      products, prodCurrency, prodRate, prodTotal,
      services, servCurrency, servRate, servTotal,
      shipping, shippingCurrency, shippingRate, shippingTotal,
      packing, totalBoxes, totalWeight, totalCbm, grandTotal,
      customerCurrency, customerRate, customerTotal,
      status, invoiceId
    } = req.body;

    const stmt = db.prepare(`
      UPDATE quotes SET
        date = ?, order_id = ?, order_name = ?, customer_id = ?, customer_name = ?,
        products_json = ?, prod_currency = ?, prod_rate = ?, prod_total = ?,
        services_json = ?, serv_currency = ?, serv_rate = ?, serv_total = ?,
        shipping_json = ?, shipping_currency = ?, shipping_rate = ?, shipping_total = ?,
        packing_json = ?, total_boxes = ?, total_weight = ?, total_cbm = ?, grand_total = ?,
        customer_currency = ?, customer_rate = ?, customer_total = ?,
        status = coalesce(?, status), invoice_id = coalesce(?, invoice_id)
      WHERE id = ?
    `);

    stmt.run(
      date || new Date().toISOString().split('T')[0],
      orderId || 'ORD-0000', orderName || 'General Sourcing',
      customerId || null, customerName || null,
      JSON.stringify(products || []), prodCurrency || 'RMB', parseFloat(prodRate) || 1, parseFloat(prodTotal) || 0,
      JSON.stringify(services || []), servCurrency || 'RMB', parseFloat(servRate) || 1, parseFloat(servTotal) || 0,
      JSON.stringify(shipping || null), shippingCurrency || 'RMB', parseFloat(shippingRate) || 1, parseFloat(shippingTotal) || 0,
      JSON.stringify(packing || []), parseInt(totalBoxes) || 0, parseFloat(totalWeight) || 0, parseFloat(totalCbm) || 0,
      parseFloat(grandTotal) || 0,
      customerCurrency || 'RMB', parseFloat(customerRate) || 1, parseFloat(customerTotal) || 0,
      status || null, invoiceId || null,
      id
    );

    const updated = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
    res.json(formatQuote(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotes/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const q = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
    if (!q) return res.status(404).json({ error: 'Quote not found' });

    let invoiceId = q.invoice_id;
    let existingInv = invoiceId ? db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) : null;

    if (!existingInv) {
      const serial = getNextSerial('invoice');
      invoiceId = `INV-${String(serial).padStart(4, '0')}`;
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const stmt = db.prepare(`
        INSERT INTO invoices (
          id, quote_id, date, order_id, order_name, customer_id, customer_name,
          products_json, prod_currency, prod_rate, prod_total,
          services_json, serv_currency, serv_rate, serv_total,
          shipping_json, shipping_currency, shipping_rate, shipping_total,
          packing_json, total_boxes, total_weight, total_cbm, grand_total,
          customer_currency, customer_rate, customer_total, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        invoiceId, q.id, q.date, q.order_id, q.order_name, q.customer_id, q.customer_name,
        q.products_json, q.prod_currency, q.prod_rate, q.prod_total,
        q.services_json, q.serv_currency, q.serv_rate, q.serv_total,
        q.shipping_json, q.shipping_currency, q.shipping_rate, q.shipping_total,
        q.packing_json, q.total_boxes, q.total_weight, q.total_cbm, q.grand_total,
        q.customer_currency, q.customer_rate, q.customer_total, 'Issued', now
      );
    }

    // Mark quote as Approved
    db.prepare("UPDATE quotes SET status = 'Approved', invoice_id = ? WHERE id = ?").run(invoiceId, id);

    // Update linked order invoice_amount and receivable_balance if order exists
    if (q.order_id) {
      const ord = db.prepare('SELECT * FROM orders WHERE id = ?').get(q.order_id);
      if (ord) {
        const invAmt = parseFloat(q.grand_total) || 0;
        const recToDate = parseFloat(ord.received_to_date) || 0;
        const recBal = Math.max(0, invAmt - recToDate);
        const expSoFar = parseFloat(ord.expenses_so_far) || 0;
        const profit = invAmt - expSoFar;
        db.prepare(`
          UPDATE orders SET invoice_amount = ?, receivable_balance = ?, profit = ? WHERE id = ?
        `).run(invAmt, recBal, profit, q.order_id);
      }
    }

    const updatedQuote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);

    res.json({
      success: true,
      quote: formatQuote(updatedQuote),
      invoice: formatInvoice(invoice)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/quotes/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= INVOICES API =================
app.get('/api/invoices', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM invoices ORDER BY rowid DESC').all();
    res.json(rows.map(formatInvoice));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    res.json(formatInvoice(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      date, orderId, orderName, customerId, customerName,
      products, prodCurrency, prodRate, prodTotal,
      services, servCurrency, servRate, servTotal,
      shipping, shippingCurrency, shippingRate, shippingTotal,
      packing, totalBoxes, totalWeight, totalCbm, grandTotal,
      customerCurrency, customerRate, customerTotal, status
    } = req.body;

    const stmt = db.prepare(`
      UPDATE invoices SET
        date = ?, order_id = ?, order_name = ?, customer_id = ?, customer_name = ?,
        products_json = ?, prod_currency = ?, prod_rate = ?, prod_total = ?,
        services_json = ?, serv_currency = ?, serv_rate = ?, serv_total = ?,
        shipping_json = ?, shipping_currency = ?, shipping_rate = ?, shipping_total = ?,
        packing_json = ?, total_boxes = ?, total_weight = ?, total_cbm = ?, grand_total = ?,
        customer_currency = ?, customer_rate = ?, customer_total = ?, status = coalesce(?, status)
      WHERE id = ?
    `);

    stmt.run(
      date || new Date().toISOString().split('T')[0],
      orderId || 'ORD-0000', orderName || 'General Sourcing',
      customerId || null, customerName || null,
      JSON.stringify(products || []), prodCurrency || 'RMB', parseFloat(prodRate) || 1, parseFloat(prodTotal) || 0,
      JSON.stringify(services || []), servCurrency || 'RMB', parseFloat(servRate) || 1, parseFloat(servTotal) || 0,
      JSON.stringify(shipping || null), shippingCurrency || 'RMB', parseFloat(shippingRate) || 1, parseFloat(shippingTotal) || 0,
      JSON.stringify(packing || []), parseInt(totalBoxes) || 0, parseFloat(totalWeight) || 0, parseFloat(totalCbm) || 0,
      parseFloat(grandTotal) || 0,
      customerCurrency || 'RMB', parseFloat(customerRate) || 1, parseFloat(customerTotal) || 0,
      status || null,
      id
    );

    // Update linked order invoice_amount and receivable_balance if order exists
    if (orderId) {
      const ord = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (ord) {
        const invAmt = parseFloat(grandTotal) || 0;
        const recToDate = parseFloat(ord.received_to_date) || 0;
        const recBal = Math.max(0, invAmt - recToDate);
        const expSoFar = parseFloat(ord.expenses_so_far) || 0;
        const profit = invAmt - expSoFar;
        db.prepare(`
          UPDATE orders SET invoice_amount = ?, receivable_balance = ?, profit = ? WHERE id = ?
        `).run(invAmt, recBal, profit, orderId);
      }
    }

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    res.json(formatInvoice(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (inv && inv.quote_id) {
      db.prepare("UPDATE quotes SET status = 'Draft', invoice_id = NULL WHERE id = ?").run(inv.quote_id);
    }
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= BANKS API =================
function formatBank(r) {
  let totalReceipts = 0;
  let totalExpenses = 0;
  let incomingTransfers = 0;
  let outgoingTransfers = 0;
  let cashPurchasesTotal = 0;
  let supplierPaymentsTotal = 0;
  let overheadExpensesTotal = 0;
  let banamTotal = 0;

  try {
    const sumRow = db.prepare('SELECT SUM(amount) as total FROM receipts WHERE bank_id = ?').get(r.id);
    totalReceipts = sumRow && sumRow.total ? Number(sumRow.total) : 0;

    const inTrfRow = db.prepare('SELECT SUM(to_amount) as total FROM bank_transfers WHERE to_bank_id = ?').get(r.id);
    incomingTransfers = inTrfRow && inTrfRow.total ? Number(inTrfRow.total) : 0;

    const expRow = db.prepare('SELECT SUM(amount) as total FROM charged_expenses WHERE bank_id = ?').get(r.id);
    totalExpenses = expRow && expRow.total ? Number(expRow.total) : 0;

    const cpRow = db.prepare('SELECT SUM(amount) as total FROM cash_purchases WHERE bank_id = ?').get(r.id);
    cashPurchasesTotal = cpRow && cpRow.total ? Number(cpRow.total) : 0;

    const payRow = db.prepare('SELECT SUM(amount) as total FROM supplier_payments WHERE bank_id = ?').get(r.id);
    supplierPaymentsTotal = payRow && payRow.total ? Number(payRow.total) : 0;

    const ovhdRow = db.prepare('SELECT SUM(amount) as total FROM overhead_expenses WHERE bank_id = ?').get(r.id);
    overheadExpensesTotal = ovhdRow && ovhdRow.total ? Number(ovhdRow.total) : 0;

    const outTrfRow = db.prepare('SELECT SUM(from_amount) as total FROM bank_transfers WHERE from_bank_id = ?').get(r.id);
    outgoingTransfers = outTrfRow && outTrfRow.total ? Number(outTrfRow.total) : 0;

    const banRow = db.prepare('SELECT SUM(amount) as total FROM banam_entries WHERE bank_id = ?').get(r.id);
    banamTotal = banRow && banRow.total ? Number(banRow.total) : 0;
  } catch (e) {}

  const opening = Number(r.opening_balance || 0);
  const totalIn = totalReceipts + incomingTransfers;
  const totalOut = totalExpenses + cashPurchasesTotal + supplierPaymentsTotal + overheadExpensesTotal + outgoingTransfers + banamTotal;

  return {
    id: r.id,
    name: r.name,
    accountName: r.account_name || '',
    accountNumber: r.account_number || '',
    currency: r.currency || 'RMB',
    openingBalance: opening,
    totalReceipts,
    totalExpenses: totalOut,
    incomingTransfers,
    outgoingTransfers,
    cashPurchasesTotal,
    supplierPaymentsTotal,
    overheadExpensesTotal,
    banamTotal,
    currentBalance: opening + totalIn - totalOut,
    createdAt: r.created_at
  };
}

app.get('/api/banks', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM banks ORDER BY id ASC').all();
    res.json(rows.map(formatBank));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/banks/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM banks WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Bank not found' });
    res.json(formatBank(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/banks', (req, res) => {
  try {
    let { id, name, accountName, accountNumber, currency, openingBalance } = req.body;
    if (!name) return res.status(400).json({ error: 'Bank name is required' });

    if (!id) {
      const serial = getNextSerial('bank');
      id = `BANK-${String(serial).padStart(4, '0')}`;
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stmt = db.prepare(`
      INSERT INTO banks (id, name, account_name, account_number, currency, opening_balance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, accountName || '', accountNumber || '', currency || 'RMB', Number(openingBalance || 0), now);
    const row = db.prepare('SELECT * FROM banks WHERE id = ?').get(id);
    res.status(201).json(formatBank(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/banks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, accountName, accountNumber, currency, openingBalance } = req.body;
    if (!name) return res.status(400).json({ error: 'Bank name is required' });

    const stmt = db.prepare(`
      UPDATE banks 
      SET name = ?, account_name = ?, account_number = ?, currency = ?, opening_balance = ?
      WHERE id = ?
    `);
    stmt.run(name, accountName || '', accountNumber || '', currency || 'RMB', Number(openingBalance || 0), id);
    const row = db.prepare('SELECT * FROM banks WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Bank not found' });
    res.json(formatBank(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/banks/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM banks WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= RECEIPTS API =================
function formatReceipt(r) {
  return {
    id: r.id,
    date: r.date,
    orderId: r.order_id || '',
    orderName: r.order_name || '',
    customerId: r.customer_id || '',
    customerName: r.customer_name || '',
    bankId: r.bank_id || '',
    bankName: r.bank_name || '',
    bankAccount: r.bank_account || '',
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    details: r.details || '',
    createdAt: r.created_at
  };
}

function syncOrderReceipts(orderId) {
  if (!orderId) return;
  try {
    const sumRow = db.prepare('SELECT SUM(amount_rmb) as totalReceived FROM receipts WHERE order_id = ?').get(orderId);
    const received = sumRow && sumRow.totalReceived ? Number(sumRow.totalReceived) : 0;
    const order = db.prepare('SELECT invoice_amount, expenses_so_far FROM orders WHERE id = ?').get(orderId);
    if (order) {
      const invAmount = Number(order.invoice_amount || 0);
      const balance = Math.max(0, invAmount - received);
      db.prepare('UPDATE orders SET received_to_date = ?, receivable_balance = ? WHERE id = ?').run(received, balance, orderId);
    }
  } catch (e) {
    console.error('Error syncing order receipts:', e);
  }
}

app.get('/api/receipts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM receipts ORDER BY id DESC').all();
    res.json(rows.map(formatReceipt));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/receipts/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Receipt not found' });
    res.json(formatReceipt(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/receipts', (req, res) => {
  try {
    let { id, date, orderId, orderName, customerId, customerName, bankId, bankName, bankAccount, currency, rate, amount, amountRmb, details } = req.body;
    if (!id) {
      const serial = getNextSerial('receipt');
      id = `REC-${String(serial).padStart(4, '0')}`;
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const receiptDate = date || now;

    const stmt = db.prepare(`
      INSERT INTO receipts (
        id, date, order_id, order_name, customer_id, customer_name,
        bank_id, bank_name, bank_account, currency, rate,
        amount, amount_rmb, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, receiptDate, orderId || '', orderName || '', customerId || '', customerName || '',
      bankId || '', bankName || '', bankAccount || '', currency || 'RMB', Number(rate || 1),
      Number(amount || 0), Number(amountRmb || 0), details || '', now
    );

    if (orderId) {
      syncOrderReceipts(orderId);
    }

    const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id);
    res.status(201).json(formatReceipt(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/receipts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const oldRow = db.prepare('SELECT order_id FROM receipts WHERE id = ?').get(id);
    const { date, orderId, orderName, customerId, customerName, bankId, bankName, bankAccount, currency, rate, amount, amountRmb, details } = req.body;

    const stmt = db.prepare(`
      UPDATE receipts SET
        date = ?, order_id = ?, order_name = ?, customer_id = ?, customer_name = ?,
        bank_id = ?, bank_name = ?, bank_account = ?, currency = ?, rate = ?,
        amount = ?, amount_rmb = ?, details = ?
      WHERE id = ?
    `);

    stmt.run(
      date, orderId || '', orderName || '', customerId || '', customerName || '',
      bankId || '', bankName || '', bankAccount || '', currency || 'RMB', Number(rate || 1),
      Number(amount || 0), Number(amountRmb || 0), details || '', id
    );

    if (oldRow && oldRow.order_id) syncOrderReceipts(oldRow.order_id);
    if (orderId && orderId !== (oldRow && oldRow.order_id)) syncOrderReceipts(orderId);

    const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Receipt not found' });
    res.json(formatReceipt(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/receipts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const oldRow = db.prepare('SELECT order_id FROM receipts WHERE id = ?').get(id);
    db.prepare('DELETE FROM receipts WHERE id = ?').run(id);

    if (oldRow && oldRow.order_id) {
      syncOrderReceipts(oldRow.order_id);
    }

    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EXPENSES & CHARGED EXPENSES API =================
function formatExpense(r) {
  let totalCharged = 0;
  let chargesCount = 0;
  try {
    const sumRow = db.prepare('SELECT SUM(amount_rmb) as total, COUNT(*) as cnt FROM charged_expenses WHERE expense_id = ?').get(r.id);
    totalCharged = sumRow && sumRow.total ? Number(sumRow.total) : 0;
    chargesCount = sumRow && sumRow.cnt ? Number(sumRow.cnt) : 0;
  } catch (e) {}

  return {
    id: r.id,
    name: r.name,
    details: r.details || '',
    totalCharged,
    chargesCount,
    createdAt: r.created_at
  };
}

function formatChargedExpense(r) {
  return {
    id: r.id,
    date: r.date,
    expenseId: r.expense_id || '',
    expenseName: r.expense_name || '',
    orderId: r.order_id || '',
    orderName: r.order_name || '',
    bankId: r.bank_id || '',
    bankName: r.bank_name || '',
    bankAccount: r.bank_account || '',
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    details: r.details || '',
    createdAt: r.created_at
  };
}

function syncOrderExpenses(orderId) {
  if (!orderId) return;
  try {
    const sumRow = db.prepare('SELECT SUM(amount_rmb) as total FROM charged_expenses WHERE order_id = ?').get(orderId);
    const totalExp = sumRow && sumRow.total ? Number(sumRow.total) : 0;
    const order = db.prepare('SELECT invoice_amount FROM orders WHERE id = ?').get(orderId);
    if (order) {
      const inv = Number(order.invoice_amount || 0);
      const profit = inv - totalExp;
      db.prepare('UPDATE orders SET expenses_so_far = ?, profit = ? WHERE id = ?').run(totalExp, profit, orderId);
    }
  } catch (e) {
    console.error('Error in syncOrderExpenses:', e.message);
  }
}

// 1. Expense Definitions CRUD
app.get('/api/expenses', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM expenses ORDER BY id ASC').all();
    res.json(rows.map(formatExpense));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/expenses/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Expense not found' });
    res.json(formatExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    let { id, name, details } = req.body;
    if (!name) return res.status(400).json({ error: 'Expense name is required' });

    if (!id) {
      const serial = getNextSerial('expense');
      id = `EXP-${String(serial).padStart(4, '0')}`;
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const stmt = db.prepare('INSERT INTO expenses (id, name, details, created_at) VALUES (?, ?, ?, ?)');
    stmt.run(id, name, details || '', now);

    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.status(201).json(formatExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, details } = req.body;
    if (!name) return res.status(400).json({ error: 'Expense name is required' });

    const stmt = db.prepare('UPDATE expenses SET name = ?, details = ? WHERE id = ?');
    stmt.run(name, details || '', id);

    // Also update expense_name in charged_expenses if changed
    db.prepare('UPDATE charged_expenses SET expense_name = ? WHERE expense_id = ?').run(name, id);

    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Expense not found' });
    res.json(formatExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Charged Expenses CRUD
app.get('/api/charged-expenses', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM charged_expenses ORDER BY date DESC, id DESC').all();
    res.json(rows.map(formatChargedExpense));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/charged-expenses/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM charged_expenses WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Charged expense not found' });
    res.json(formatChargedExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/charged-expenses', (req, res) => {
  try {
    let { id, date, expenseId, expenseName, orderId, orderName, bankId, bankName, bankAccount, currency, rate, amount, amountRmb, details } = req.body;
    const exists = id ? db.prepare('SELECT id FROM charged_expenses WHERE id = ?').get(id) : null;
    if (!id || exists) {
      id = getNextUniqueId('voucher').nextId;
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const voucherDate = date || now;

    const stmt = db.prepare(`
      INSERT INTO charged_expenses (
        id, date, expense_id, expense_name, order_id, order_name,
        bank_id, bank_name, bank_account, currency, rate,
        amount, amount_rmb, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, voucherDate, expenseId || '', expenseName || 'General Expense',
      orderId || '', orderName || '', bankId || '', bankName || '', bankAccount || '',
      currency || 'RMB', Number(rate || 1), Number(amount || 0), Number(amountRmb || 0),
      details || '', now
    );
    ensureCounterAtLeast('voucher', id);

    if (orderId) {
      syncOrderExpenses(orderId);
    }

    const row = db.prepare('SELECT * FROM charged_expenses WHERE id = ?').get(id);
    res.status(201).json(formatChargedExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/charged-expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    let { date, expenseId, expenseName, orderId, orderName, bankId, bankName, bankAccount, currency, rate, amount, amountRmb, details } = req.body;

    const oldRow = db.prepare('SELECT order_id FROM charged_expenses WHERE id = ?').get(id);

    const stmt = db.prepare(`
      UPDATE charged_expenses SET
        date = ?, expense_id = ?, expense_name = ?, order_id = ?, order_name = ?,
        bank_id = ?, bank_name = ?, bank_account = ?, currency = ?, rate = ?,
        amount = ?, amount_rmb = ?, details = ?
      WHERE id = ?
    `);

    stmt.run(
      date, expenseId || '', expenseName || 'General Expense',
      orderId || '', orderName || '', bankId || '', bankName || '', bankAccount || '',
      currency || 'RMB', Number(rate || 1), Number(amount || 0), Number(amountRmb || 0),
      details || '', id
    );

    if (oldRow && oldRow.order_id && oldRow.order_id !== orderId) {
      syncOrderExpenses(oldRow.order_id);
    }
    if (orderId) {
      syncOrderExpenses(orderId);
    }

    const row = db.prepare('SELECT * FROM charged_expenses WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Charged expense not found' });
    res.json(formatChargedExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/charged-expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const oldRow = db.prepare('SELECT order_id FROM charged_expenses WHERE id = ?').get(id);
    db.prepare('DELETE FROM charged_expenses WHERE id = ?').run(id);

    if (oldRow && oldRow.order_id) {
      syncOrderExpenses(oldRow.order_id);
    }

    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SUPPLIERS API =================
function formatSupplier(r) {
  const purchaseStats = db.prepare(`
    SELECT COUNT(*) as count, SUM(amount_rmb) as totalAmount
    FROM purchases WHERE supplier_id = ?
  `).get(r.id);

  const currency = r.currency || 'RMB';
  const exchangeRate = Number(r.exchange_rate || 1);
  const openingBalance = Number(r.opening_balance || 0);
  let openingBalanceRmb = Number(r.opening_balance_rmb || 0);
  if (openingBalance > 0 && openingBalanceRmb === 0) {
    openingBalanceRmb = currency === 'RMB' ? openingBalance : (openingBalance * exchangeRate);
  }

  return {
    id: r.id,
    name: r.name,
    address: r.address || '',
    currency: currency,
    exchangeRate: exchangeRate,
    openingBalance: openingBalance,
    openingBalanceRmb: openingBalanceRmb,
    vendorType: r.vendor_type || 'goods',
    vendor_type: r.vendor_type || 'goods',
    createdAt: r.created_at,
    purchasesCount: purchaseStats ? purchaseStats.count : 0,
    totalPurchasesRmb: purchaseStats ? (purchaseStats.totalAmount || 0) : 0
  };
}

app.get('/api/suppliers', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM suppliers ORDER BY id DESC').all();
    res.json(rows.map(formatSupplier));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/suppliers/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Supplier not found' });
    res.json(formatSupplier(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', (req, res) => {
  try {
    const { id, name, address, openingBalance, currency, exchangeRate, openingBalanceRmb, vendorType, vendor_type } = req.body;
    const vType = vendorType || vendor_type || 'goods';
    let finalId = id;
    if (!finalId) {
      const serialName = vType === 'shipping' ? 'shipping_vendor' : 'supplier';
      const prefix = vType === 'shipping' ? 'VEND' : 'SUP';
      const serial = getNextSerial(serialName);
      finalId = `${prefix}-${String(serial).padStart(4, '0')}`;
    } else {
      const match = finalId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        const counterName = vType === 'shipping' ? 'shipping_vendor' : 'supplier';
        db.prepare('UPDATE counters SET next_serial = MAX(next_serial, ?) WHERE name = ?').run(num + 1, counterName);
      }
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const opBal = parseFloat(openingBalance) || 0;
    const cur = String(currency || 'RMB').trim().toUpperCase();
    const exRate = parseFloat(exchangeRate) || 1.0;
    let opBalRmb = parseFloat(openingBalanceRmb);
    if (isNaN(opBalRmb)) {
      opBalRmb = cur === 'RMB' ? opBal : (opBal * exRate);
    }

    db.prepare(`
      INSERT INTO suppliers (id, name, address, opening_balance, currency, exchange_rate, opening_balance_rmb, vendor_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(finalId, name, address || '', opBal, cur, exRate, opBalRmb, vType, now);

    const created = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(finalId);
    res.status(201).json(formatSupplier(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, openingBalance, currency, exchangeRate, openingBalanceRmb, vendorType, vendor_type } = req.body;
    const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Supplier not found' });

    const opBal = parseFloat(openingBalance !== undefined ? openingBalance : existing.opening_balance) || 0;
    const cur = String(currency || existing.currency || 'RMB').trim().toUpperCase();
    const exRate = parseFloat(exchangeRate !== undefined ? exchangeRate : existing.exchange_rate) || 1.0;
    let opBalRmb = parseFloat(openingBalanceRmb);
    if (isNaN(opBalRmb)) {
      opBalRmb = cur === 'RMB' ? opBal : (opBal * exRate);
    }
    const vType = vendorType || vendor_type || existing.vendor_type || 'goods';

    db.prepare(`
      UPDATE suppliers
      SET name = ?, address = ?, opening_balance = ?, currency = ?, exchange_rate = ?, opening_balance_rmb = ?, vendor_type = ?
      WHERE id = ?
    `).run(name || existing.name, address !== undefined ? address : existing.address, opBal, cur, exRate, opBalRmb, vType, id);

    // Sync supplier_name in purchases if updated
    db.prepare('UPDATE purchases SET supplier_name = ? WHERE supplier_id = ?').run(name, id);

    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    res.json(formatSupplier(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= PURCHASES API =================
function formatPurchase(r) {
  return {
    id: r.id,
    date: r.date,
    supplierId: r.supplier_id || '',
    supplierName: r.supplier_name,
    orderId: r.order_id || '',
    orderName: r.order_name || '',
    customerName: r.customer_name || '',
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    productId: r.product_id || '',
    productName: r.product_name,
    qty: Number(r.qty || 1),
    cost: Number(r.cost || 0),
    costRmb: Number(r.cost_rmb || 0),
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    details: r.details || '',
    attachmentName: r.attachment_name || '',
    attachmentData: r.attachment_data || null,
    createdAt: r.created_at
  };
}

app.get('/api/purchases', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM purchases ORDER BY id DESC').all();
    res.json(rows.map(formatPurchase));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/purchases/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Purchase not found' });
    res.json(formatPurchase(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', (req, res) => {
  try {
    const {
      id, date, supplierId, supplierName, orderId, orderName, customerName,
      currency, rate, productId, productName, qty, cost, costRmb, amount, amountRmb,
      details, attachmentName, attachmentData
    } = req.body;

    let finalId = id;
    if (!finalId) {
      const serial = getNextSerial('purchase');
      finalId = `PUR-${String(serial).padStart(4, '0')}`;
    } else {
      const match = finalId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        db.prepare('UPDATE counters SET next_serial = MAX(next_serial, ?) WHERE name = ?').run(num + 1, 'purchase');
      }
    }

    const cur = currency || 'RMB';
    const numRate = parseFloat(rate) || 1.0;
    const numQty = parseFloat(qty) || 1.0;
    const numCost = parseFloat(cost) || 0.0;
    const numAmount = parseFloat(amount) || (numQty * numCost);

    let calcCostRmb = numCost;
    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcCostRmb = isSmaller ? (numCost / numRate) : (numCost * numRate);
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    db.prepare(`
      INSERT INTO purchases (
        id, date, supplier_id, supplier_name, order_id, order_name, customer_name,
        currency, rate, product_id, product_name, qty, cost, cost_rmb, amount, amount_rmb,
        details, attachment_name, attachment_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalId, date || new Date().toISOString().split('T')[0],
      supplierId || '', supplierName || 'Supplier',
      orderId || '', orderName || '', customerName || '',
      cur, numRate, productId || '', productName || 'Product',
      numQty, numCost, calcCostRmb, numAmount, calcAmountRmb,
      details || '', attachmentName || '', attachmentData || null, now
    );

    const created = db.prepare('SELECT * FROM purchases WHERE id = ?').get(finalId);
    res.status(201).json(formatPurchase(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, supplierId, supplierName, orderId, orderName, customerName,
      currency, rate, productId, productName, qty, cost, costRmb, amount, amountRmb,
      details, attachmentName, attachmentData
    } = req.body;

    const cur = currency || 'RMB';
    const numRate = parseFloat(rate) || 1.0;
    const numQty = parseFloat(qty) || 1.0;
    const numCost = parseFloat(cost) || 0.0;
    const numAmount = parseFloat(amount) || (numQty * numCost);

    let calcCostRmb = numCost;
    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcCostRmb = isSmaller ? (numCost / numRate) : (numCost * numRate);
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    db.prepare(`
      UPDATE purchases
      SET date = ?, supplier_id = ?, supplier_name = ?, order_id = ?, order_name = ?, customer_name = ?,
          currency = ?, rate = ?, product_id = ?, product_name = ?, qty = ?, cost = ?, cost_rmb = ?,
          amount = ?, amount_rmb = ?, details = ?, attachment_name = ?, attachment_data = ?
      WHERE id = ?
    `).run(
      date || new Date().toISOString().split('T')[0],
      supplierId || '', supplierName || 'Supplier',
      orderId || '', orderName || '', customerName || '',
      cur, numRate, productId || '', productName || 'Product',
      numQty, numCost, calcCostRmb, numAmount, calcAmountRmb,
      details || '', attachmentName || '', attachmentData || null, id
    );

    const updated = db.prepare('SELECT * FROM purchases WHERE id = ?').get(id);
    res.json(formatPurchase(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SHIPPING BILLS API =================
function formatShippingBill(r) {
  if (!r) return null;
  return {
    id: r.id,
    date: r.date,
    vendorId: r.vendor_id || '',
    vendorName: r.vendor_name,
    orderId: r.order_id || '',
    orderName: r.order_name || '',
    customerName: r.customer_name || '',
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    serviceId: r.service_id || '',
    serviceName: r.service_name,
    qty: Number(r.qty || 1),
    cost: Number(r.cost || 0),
    costRmb: Number(r.cost_rmb || 0),
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    details: r.details || '',
    attachmentName: r.attachment_name || '',
    attachmentData: r.attachment_data || '',
    createdAt: r.created_at
  };
}

app.get('/api/shipping-bills', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM shipping_bills ORDER BY date DESC, id DESC').all();
    res.json(rows.map(formatShippingBill));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shipping-bills/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM shipping_bills WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Shipping bill not found' });
    res.json(formatShippingBill(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shipping-bills', (req, res) => {
  try {
    const {
      id, date, vendorId, vendorName, orderId, orderName, customerName,
      currency, rate, serviceId, serviceName, qty, cost, costRmb, amount, amountRmb,
      details, attachmentName, attachmentData
    } = req.body;

    let finalId = id;
    if (!finalId) {
      const serial = getNextSerial('shipping_bill');
      finalId = `SBILL-${String(serial).padStart(4, '0')}`;
    } else {
      const match = finalId.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        db.prepare('UPDATE counters SET next_serial = MAX(next_serial, ?) WHERE name = ?').run(num + 1, 'shipping_bill');
      }
    }

    const cur = currency || 'RMB';
    const numRate = parseFloat(rate) || 1.0;
    const numQty = parseFloat(qty) || 1.0;
    const numCost = parseFloat(cost) || 0.0;
    const numAmount = parseFloat(amount) || (numQty * numCost);

    let calcCostRmb = numCost;
    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcCostRmb = isSmaller ? (numCost / numRate) : (numCost * numRate);
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    db.prepare(`
      INSERT INTO shipping_bills (
        id, date, vendor_id, vendor_name, order_id, order_name, customer_name,
        currency, rate, service_id, service_name, qty, cost, cost_rmb, amount, amount_rmb,
        details, attachment_name, attachment_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalId, date || now, vendorId || '', vendorName || '', orderId || '', orderName || '', customerName || '',
      cur, numRate, serviceId || '', serviceName || 'Shipping Service', numQty, numCost, calcCostRmb, numAmount, calcAmountRmb,
      details || '', attachmentName || '', attachmentData || '', now
    );

    const created = db.prepare('SELECT * FROM shipping_bills WHERE id = ?').get(finalId);
    res.status(201).json(formatShippingBill(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shipping-bills/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, vendorId, vendorName, orderId, orderName, customerName,
      currency, rate, serviceId, serviceName, qty, cost, costRmb, amount, amountRmb,
      details, attachmentName, attachmentData
    } = req.body;

    const existing = db.prepare('SELECT * FROM shipping_bills WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Shipping bill not found' });

    const cur = currency || existing.currency || 'RMB';
    const numRate = parseFloat(rate !== undefined ? rate : existing.rate) || 1.0;
    const numQty = parseFloat(qty !== undefined ? qty : existing.qty) || 1.0;
    const numCost = parseFloat(cost !== undefined ? cost : existing.cost) || 0.0;
    const numAmount = parseFloat(amount !== undefined ? amount : (numQty * numCost));

    let calcCostRmb = numCost;
    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcCostRmb = isSmaller ? (numCost / numRate) : (numCost * numRate);
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    db.prepare(`
      UPDATE shipping_bills SET
        date = ?, vendor_id = ?, vendor_name = ?, order_id = ?, order_name = ?, customer_name = ?,
        currency = ?, rate = ?, service_id = ?, service_name = ?, qty = ?, cost = ?, cost_rmb = ?,
        amount = ?, amount_rmb = ?, details = ?, attachment_name = ?, attachment_data = ?
      WHERE id = ?
    `).run(
      date || existing.date,
      vendorId !== undefined ? vendorId : existing.vendor_id,
      vendorName !== undefined ? vendorName : existing.vendor_name,
      orderId !== undefined ? orderId : existing.order_id,
      orderName !== undefined ? orderName : existing.order_name,
      customerName !== undefined ? customerName : existing.customer_name,
      cur, numRate,
      serviceId !== undefined ? serviceId : existing.service_id,
      serviceName !== undefined ? serviceName : existing.service_name,
      numQty, numCost, calcCostRmb, numAmount, calcAmountRmb,
      details !== undefined ? details : existing.details,
      attachmentName !== undefined ? attachmentName : existing.attachment_name,
      attachmentData !== undefined ? attachmentData : existing.attachment_data,
      id
    );

    const updated = db.prepare('SELECT * FROM shipping_bills WHERE id = ?').get(id);
    res.json(formatShippingBill(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shipping-bills/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM shipping_bills WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CASH PURCHASES API =================
function formatCashPurchase(r) {
  if (!r) return null;
  return {
    id: r.id,
    date: r.date,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    orderId: r.order_id,
    orderName: r.order_name,
    customerName: r.customer_name,
    productId: r.product_id,
    productName: r.product_name,
    qty: Number(r.qty || 1),
    cost: Number(r.cost || 0),
    costRmb: Number(r.cost_rmb || 0),
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    details: r.details || '',
    attachmentName: r.attachment_name || '',
    attachmentData: r.attachment_data || null,
    bankId: r.bank_id || '',
    bankName: r.bank_name || '',
    bankAccount: r.bank_account || '',
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    createdAt: r.created_at
  };
}

app.get('/api/cash-purchases', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cash_purchases ORDER BY date DESC, rowid DESC').all();
    res.json(rows.map(formatCashPurchase));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cash-purchases/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM cash_purchases WHERE id = ?').get(req.params.id);
    if (!row) return res.status(400).json({ error: 'Cash purchase not found' });
    res.json(formatCashPurchase(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cash-purchases', (req, res) => {
  try {
    const {
      id, date, supplierId, supplierName, orderId, orderName, customerName,
      productId, productName, qty, cost, amount,
      details, attachmentName, attachmentData,
      bankId, bankName, bankAccount, currency, rate
    } = req.body;

    let finalId = id;
    if (!finalId) {
      const serial = getNextSerial('cash_purchase');
      finalId = `CPUR-${String(serial).padStart(4, '0')}`;
    }

    const cur = currency || 'RMB';
    const numRate = parseFloat(rate) || 1.0;
    const numQty = parseFloat(qty) || 1.0;
    const numCost = parseFloat(cost) || 0.0;
    const numAmount = parseFloat(amount) || (numQty * numCost);

    let calcCostRmb = numCost;
    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcCostRmb = isSmaller ? (numCost / numRate) : (numCost * numRate);
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    db.prepare(`
      INSERT INTO cash_purchases (
        id, date, supplier_id, supplier_name, order_id, order_name, customer_name,
        product_id, product_name, qty, cost, cost_rmb, amount, amount_rmb,
        details, attachment_name, attachment_data,
        bank_id, bank_name, bank_account, currency, rate, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalId, date || new Date().toISOString().split('T')[0],
      supplierId || '', supplierName || 'Supplier',
      orderId || '', orderName || '', customerName || '',
      productId || '', productName || 'Product',
      numQty, numCost, calcCostRmb, numAmount, calcAmountRmb,
      details || '', attachmentName || '', attachmentData || null,
      bankId || '', bankName || '', bankAccount || '',
      cur, numRate, now
    );

    const created = db.prepare('SELECT * FROM cash_purchases WHERE id = ?').get(finalId);
    res.status(201).json(formatCashPurchase(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cash-purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, supplierId, supplierName, orderId, orderName, customerName,
      productId, productName, qty, cost, amount,
      details, attachmentName, attachmentData,
      bankId, bankName, bankAccount, currency, rate
    } = req.body;

    const cur = currency || 'RMB';
    const numRate = parseFloat(rate) || 1.0;
    const numQty = parseFloat(qty) || 1.0;
    const numCost = parseFloat(cost) || 0.0;
    const numAmount = parseFloat(amount) || (numQty * numCost);

    let calcCostRmb = numCost;
    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcCostRmb = isSmaller ? (numCost / numRate) : (numCost * numRate);
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    db.prepare(`
      UPDATE cash_purchases
      SET date = ?, supplier_id = ?, supplier_name = ?, order_id = ?, order_name = ?, customer_name = ?,
          product_id = ?, product_name = ?, qty = ?, cost = ?, cost_rmb = ?, amount = ?, amount_rmb = ?,
          details = ?, attachment_name = ?, attachment_data = ?,
          bank_id = ?, bank_name = ?, bank_account = ?, currency = ?, rate = ?
      WHERE id = ?
    `).run(
      date || new Date().toISOString().split('T')[0],
      supplierId || '', supplierName || 'Supplier',
      orderId || '', orderName || '', customerName || '',
      productId || '', productName || 'Product',
      numQty, numCost, calcCostRmb, numAmount, calcAmountRmb,
      details || '', attachmentName || '', attachmentData || null,
      bankId || '', bankName || '', bankAccount || '',
      cur, numRate, id
    );

    const updated = db.prepare('SELECT * FROM cash_purchases WHERE id = ?').get(id);
    res.json(formatCashPurchase(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cash-purchases/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM cash_purchases WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SUPPLIER PAYMENTS API =================
function formatSupplierPayment(r) {
  if (!r) return null;
  return {
    id: r.id,
    date: r.date,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    bankId: r.bank_id || '',
    bankName: r.bank_name || '',
    bankAccount: r.bank_account || '',
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    details: r.details || '',
    paymentType: r.payment_type || 'supplier',
    payment_type: r.payment_type || 'supplier',
    createdAt: r.created_at
  };
}

app.get('/api/supplier-payments', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM supplier_payments ORDER BY date DESC, rowid DESC').all();
    res.json(rows.map(formatSupplierPayment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/supplier-payments/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(req.params.id);
    if (!row) return res.status(400).json({ error: 'Supplier payment not found' });
    res.json(formatSupplierPayment(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/supplier-payments', (req, res) => {
  try {
    const {
      id, date, supplierId, supplierName, bankId, bankName, bankAccount,
      amount, currency, rate, details, paymentType, payment_type
    } = req.body;

    const pType = paymentType || payment_type || 'supplier';
    let finalId = id;
    if (!finalId) {
      const serialName = pType === 'shipping' ? 'shipping_payment' : 'payment';
      const prefix = pType === 'shipping' ? 'SPAY' : 'PAY';
      const serial = getNextSerial(serialName);
      finalId = `${prefix}-${String(serial).padStart(4, '0')}`;
    }

    const cur = currency || 'RMB';
    const numRate = parseFloat(rate) || 1.0;
    const numAmount = parseFloat(amount) || 0.0;

    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    db.prepare(`
      INSERT INTO supplier_payments (
        id, date, supplier_id, supplier_name, bank_id, bank_name, bank_account,
        amount, amount_rmb, currency, rate, details, payment_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalId, date || new Date().toISOString().split('T')[0],
      supplierId || '', supplierName || 'Supplier',
      bankId || '', bankName || '', bankAccount || '',
      numAmount, calcAmountRmb, cur, numRate, details || '', pType, now
    );

    const created = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(finalId);
    res.status(201).json(formatSupplierPayment(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/supplier-payments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, supplierId, supplierName, bankId, bankName, bankAccount,
      amount, currency, rate, details, paymentType, payment_type
    } = req.body;

    const existing = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Supplier payment not found' });
    const pType = paymentType || payment_type || existing.payment_type || 'supplier';

    const cur = currency || existing.currency || 'RMB';
    const numRate = parseFloat(rate !== undefined ? rate : existing.rate) || 1.0;
    const numAmount = parseFloat(amount !== undefined ? amount : existing.amount) || 0.0;

    let calcAmountRmb = numAmount;
    if (cur !== 'RMB' && numRate > 0) {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const isSmaller = curRow && curRow.rate_type === 'smaller';
      calcAmountRmb = isSmaller ? (numAmount / numRate) : (numAmount * numRate);
    }

    db.prepare(`
      UPDATE supplier_payments
      SET date = ?, supplier_id = ?, supplier_name = ?, bank_id = ?, bank_name = ?, bank_account = ?,
          amount = ?, amount_rmb = ?, currency = ?, rate = ?, details = ?, payment_type = ?
      WHERE id = ?
    `).run(
      date || existing.date || new Date().toISOString().split('T')[0],
      supplierId !== undefined ? supplierId : existing.supplier_id,
      supplierName !== undefined ? supplierName : existing.supplier_name,
      bankId !== undefined ? bankId : existing.bank_id,
      bankName !== undefined ? bankName : existing.bank_name,
      bankAccount !== undefined ? bankAccount : existing.bank_account,
      numAmount, calcAmountRmb, cur, numRate,
      details !== undefined ? details : existing.details,
      pType, id
    );

    const updated = db.prepare('SELECT * FROM supplier_payments WHERE id = ?').get(id);
    res.json(formatSupplierPayment(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/supplier-payments/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM supplier_payments WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ORDER MEDIA API =================
function formatMedia(r) {
  if (!r) return null;
  let photosVideos = [];
  let files = [];
  try { photosVideos = JSON.parse(r.photos_videos || '[]'); } catch (e) {}
  try { files = JSON.parse(r.files || '[]'); } catch (e) {}
  return {
    id: r.id,
    date: r.date,
    orderId: r.order_id || '',
    orderName: r.order_name || '',
    customerName: r.customer_name || '',
    photosVideos,
    files,
    notes: r.notes || '',
    createdAt: r.created_at
  };
}

app.get('/api/media', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM order_media ORDER BY date DESC, rowid DESC').all();
    res.json(rows.map(formatMedia));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM order_media WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Media record not found' });
    res.json(formatMedia(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media/by-order/:orderId', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM order_media WHERE order_id = ? ORDER BY date DESC, rowid DESC').all(req.params.orderId);
    res.json(rows.map(formatMedia));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/media', (req, res) => {
  try {
    const { id, date, orderId, orderName, customerName, photosVideos, files, notes } = req.body;
    let finalId = id;
    if (!finalId) {
      finalId = getNextUniqueId('media').nextId;
    } else {
      const existing = db.prepare('SELECT id FROM order_media WHERE id = ?').get(finalId);
      if (existing) {
        finalId = getNextUniqueId('media').nextId;
      }
    }
    ensureCounterAtLeast('media', finalId);

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const pvJson = JSON.stringify(Array.isArray(photosVideos) ? photosVideos : []);
    const fJson = JSON.stringify(Array.isArray(files) ? files : []);

    db.prepare(`
      INSERT INTO order_media (
        id, date, order_id, order_name, customer_name,
        photos_videos, files, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalId, date || new Date().toISOString().split('T')[0],
      orderId || '', orderName || '', customerName || '',
      pvJson, fJson, notes || '', now
    );

    const created = db.prepare('SELECT * FROM order_media WHERE id = ?').get(finalId);
    res.status(201).json(formatMedia(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/media/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, orderId, orderName, customerName, photosVideos, files, notes } = req.body;
    const pvJson = JSON.stringify(Array.isArray(photosVideos) ? photosVideos : []);
    const fJson = JSON.stringify(Array.isArray(files) ? files : []);

    db.prepare(`
      UPDATE order_media
      SET date = ?, order_id = ?, order_name = ?, customer_name = ?,
          photos_videos = ?, files = ?, notes = ?
      WHERE id = ?
    `).run(
      date || new Date().toISOString().split('T')[0],
      orderId || '', orderName || '', customerName || '',
      pvJson, fJson, notes || '', id
    );

    const updated = db.prepare('SELECT * FROM order_media WHERE id = ?').get(id);
    res.json(formatMedia(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/media/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM order_media WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= BANK TRANSFERS API =================
function formatTransfer(r) {
  if (!r) return null;
  let fromBankName = r.from_bank_name;
  let toBankName = r.to_bank_name;
  let fromCurrency = r.from_currency;
  let toCurrency = r.to_currency;
  let fromBankAccount = r.from_bank_account;
  let toBankAccount = r.to_bank_account;

  if ((!fromBankName || !fromBankName.trim()) && r.from_bank_id) {
    try {
      const b = db.prepare('SELECT name, currency, account_number FROM banks WHERE id = ?').get(r.from_bank_id);
      if (b) {
        fromBankName = b.name;
        if (!fromCurrency) fromCurrency = b.currency;
        if (!fromBankAccount) fromBankAccount = b.account_number;
      }
    } catch (e) {}
  }
  if ((!toBankName || !toBankName.trim()) && r.to_bank_id) {
    try {
      const b = db.prepare('SELECT name, currency, account_number FROM banks WHERE id = ?').get(r.to_bank_id);
      if (b) {
        toBankName = b.name;
        if (!toCurrency) toCurrency = b.currency;
        if (!toBankAccount) toBankAccount = b.account_number;
      }
    } catch (e) {}
  }

  const fromAmt = Number(r.from_amount || 0);
  const toAmt = Number(r.to_amount || 0);
  const exRate = Number(r.exchange_rate || 1);

  return {
    id: r.id,
    date: r.date,
    type: r.type,
    fromBankId: r.from_bank_id,
    from_bank_id: r.from_bank_id,
    fromBankName: fromBankName || 'Unknown Bank',
    from_bank_name: fromBankName || 'Unknown Bank',
    fromBankAccount: fromBankAccount || '',
    from_bank_account: fromBankAccount || '',
    toBankId: r.to_bank_id,
    to_bank_id: r.to_bank_id,
    toBankName: toBankName || 'Unknown Bank',
    to_bank_name: toBankName || 'Unknown Bank',
    toBankAccount: toBankAccount || '',
    to_bank_account: toBankAccount || '',
    fromAmount: fromAmt,
    from_amount: fromAmt,
    fromCurrency: fromCurrency || 'RMB',
    from_currency: fromCurrency || 'RMB',
    toAmount: toAmt,
    to_amount: toAmt,
    toCurrency: toCurrency || 'RMB',
    to_currency: toCurrency || 'RMB',
    exchangeRate: exRate,
    exchange_rate: exRate,
    details: r.details || '',
    createdAt: r.created_at,
    created_at: r.created_at
  };
}

app.get('/api/transfers', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bank_transfers ORDER BY date DESC, rowid DESC').all();
    res.json(rows.map(formatTransfer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transfers/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM bank_transfers WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Transfer not found' });
    res.json(formatTransfer(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transfers', (req, res) => {
  try {
    let {
      id, date, type, fromBankId, fromBankName, fromBankAccount,
      toBankId, toBankName, toBankAccount,
      fromAmount, fromCurrency, toAmount, toCurrency, exchangeRate, details
    } = req.body;

    fromBankId = fromBankId || req.body.from_bank_id;
    fromBankName = fromBankName || req.body.from_bank_name;
    fromBankAccount = fromBankAccount || req.body.from_bank_account;
    toBankId = toBankId || req.body.to_bank_id;
    toBankName = toBankName || req.body.to_bank_name;
    toBankAccount = toBankAccount || req.body.to_bank_account;
    fromAmount = fromAmount !== undefined ? fromAmount : req.body.from_amount;
    fromCurrency = fromCurrency || req.body.from_currency;
    toAmount = toAmount !== undefined ? toAmount : req.body.to_amount;
    toCurrency = toCurrency || req.body.to_currency;
    exchangeRate = exchangeRate !== undefined ? exchangeRate : req.body.exchange_rate;

    if (!fromBankId || !toBankId || !fromAmount || Number(fromAmount) <= 0) {
      return res.status(400).json({ error: 'Valid From Bank, To Bank, and Amount are required' });
    }

    if ((!fromBankName || !fromBankName.trim()) && fromBankId) {
      const b = db.prepare('SELECT name, currency, account_number FROM banks WHERE id = ?').get(fromBankId);
      if (b) {
        fromBankName = b.name;
        if (!fromCurrency) fromCurrency = b.currency;
        if (!fromBankAccount) fromBankAccount = b.account_number;
      }
    }
    if ((!toBankName || !toBankName.trim()) && toBankId) {
      const b = db.prepare('SELECT name, currency, account_number FROM banks WHERE id = ?').get(toBankId);
      if (b) {
        toBankName = b.name;
        if (!toCurrency) toCurrency = b.currency;
        if (!toBankAccount) toBankAccount = b.account_number;
      }
    }

    if (!id) {
      const serial = getNextSerial('transfer');
      id = `TRF-${String(serial).padStart(4, '0')}`;
    }
    ensureCounterAtLeast('transfer', id);

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const fAmt = parseFloat(fromAmount) || 0;
    const rate = parseFloat(exchangeRate) || 1.0;
    let tAmt = parseFloat(toAmount);
    if (isNaN(tAmt) || tAmt <= 0) {
      if (type === 'rmb_to_pkr') {
        tAmt = fAmt * rate;
      } else if (type === 'pkr_to_rmb') {
        tAmt = fAmt / rate;
      } else {
        tAmt = fAmt;
      }
    }

    db.prepare(`
      INSERT INTO bank_transfers (
        id, date, type, from_bank_id, from_bank_name, from_bank_account,
        to_bank_id, to_bank_name, to_bank_account,
        from_amount, from_currency, to_amount, to_currency, exchange_rate, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, date || new Date().toISOString().split('T')[0], type || 'bank_to_bank',
      fromBankId, fromBankName || '', fromBankAccount || '',
      toBankId, toBankName || '', toBankAccount || '',
      fAmt, fromCurrency || 'RMB', tAmt, toCurrency || 'RMB', rate, details || '', now
    );

    const created = db.prepare('SELECT * FROM bank_transfers WHERE id = ?').get(id);
    res.status(201).json(formatTransfer(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transfers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM bank_transfers WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= OVERHEAD EXPENSES API =================
function formatOverheadExpense(r) {
  if (!r) return null;
  return {
    id: r.id,
    date: r.date,
    expenseId: r.expense_id || '',
    expense_id: r.expense_id || '',
    expenseName: r.expense_name || '',
    expense_name: r.expense_name || '',
    bankId: r.bank_id || '',
    bank_id: r.bank_id || '',
    bankName: r.bank_name || '',
    bank_name: r.bank_name || '',
    bankAccount: r.bank_account || '',
    bank_account: r.bank_account || '',
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    amount_rmb: Number(r.amount_rmb || 0),
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    details: r.details || '',
    createdAt: r.created_at,
    created_at: r.created_at
  };
}

app.get('/api/overhead-expenses', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM overhead_expenses ORDER BY date DESC, rowid DESC').all();
    res.json(rows.map(formatOverheadExpense));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/overhead-expenses/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM overhead_expenses WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Overhead expense not found' });
    res.json(formatOverheadExpense(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/overhead-expenses', (req, res) => {
  try {
    let { id, date, expenseId, expenseName, bankId, bankName, bankAccount, amount, currency, rate, details } = req.body;
    expenseId = expenseId || req.body.expense_id;
    expenseName = expenseName || req.body.expense_name;
    bankId = bankId || req.body.bank_id;
    bankName = bankName || req.body.bank_name;
    bankAccount = bankAccount || req.body.bank_account;
    if (!expenseName || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Expense category and valid amount are required' });
    }

    if (!id) {
      const serial = getNextSerial('overhead_expense');
      id = `OVHD-${String(serial).padStart(4, '0')}`;
    }
    ensureCounterAtLeast('overhead_expense', id);

    const cur = currency || 'RMB';
    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(rate) || 1.0;
    let amountRmb = numAmount;

    if (cur !== 'RMB') {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const rateType = curRow ? curRow.rate_type : 'greater';
      if (rateType === 'greater') {
        amountRmb = numAmount * numRate;
      } else if (rateType === 'smaller') {
        amountRmb = numAmount / numRate;
      }
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    db.prepare(`
      INSERT INTO overhead_expenses (
        id, date, expense_id, expense_name, bank_id, bank_name, bank_account,
        amount, amount_rmb, currency, rate, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, date || new Date().toISOString().split('T')[0],
      expenseId || '', expenseName, bankId || '', bankName || '', bankAccount || '',
      numAmount, amountRmb, cur, numRate, details || '', now
    );

    const created = db.prepare('SELECT * FROM overhead_expenses WHERE id = ?').get(id);
    res.status(201).json(formatOverheadExpense(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/overhead-expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    let { date, expenseId, expenseName, bankId, bankName, bankAccount, amount, currency, rate, details } = req.body;

    const cur = currency || 'RMB';
    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(rate) || 1.0;
    let amountRmb = numAmount;

    if (cur !== 'RMB') {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const rateType = curRow ? curRow.rate_type : 'greater';
      if (rateType === 'greater') {
        amountRmb = numAmount * numRate;
      } else if (rateType === 'smaller') {
        amountRmb = numAmount / numRate;
      }
    }

    db.prepare(`
      UPDATE overhead_expenses
      SET date = ?, expense_id = ?, expense_name = ?, bank_id = ?, bank_name = ?, bank_account = ?,
          amount = ?, amount_rmb = ?, currency = ?, rate = ?, details = ?
      WHERE id = ?
    `).run(
      date || new Date().toISOString().split('T')[0],
      expenseId || '', expenseName || '', bankId || '', bankName || '', bankAccount || '',
      numAmount, amountRmb, cur, numRate, details || '', id
    );

    const updated = db.prepare('SELECT * FROM overhead_expenses WHERE id = ?').get(id);
    res.json(formatOverheadExpense(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/overhead-expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM overhead_expenses WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= OVERHEAD CATEGORIES API =================
function formatOverheadCategory(r) {
  return {
    id: r.id,
    name: r.name,
    details: r.details || '',
    createdAt: r.created_at
  };
}

app.get('/api/overhead-categories', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM overhead_categories ORDER BY id ASC').all();
    res.json(rows.map(formatOverheadCategory));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/overhead-categories', (req, res) => {
  try {
    let { id, name, details } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

    if (!id) {
      const serial = getNextSerial('overhead_category');
      id = `OHC-${String(serial).padStart(4, '0')}`;
    }
    ensureCounterAtLeast('overhead_category', id);

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    db.prepare('INSERT INTO overhead_categories (id, name, details, created_at) VALUES (?, ?, ?, ?)').run(id, name.trim(), details || '', now);

    const created = db.prepare('SELECT * FROM overhead_categories WHERE id = ?').get(id);
    res.status(201).json(formatOverheadCategory(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/overhead-categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, details } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

    db.prepare('UPDATE overhead_categories SET name = ?, details = ? WHERE id = ?').run(name.trim(), details || '', id);
    const updated = db.prepare('SELECT * FROM overhead_categories WHERE id = ?').get(id);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(formatOverheadCategory(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/overhead-categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM overhead_categories WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= PARTNERS & BANAM ENTRIES API =================
function formatPartner(r) {
  if (!r) return null;
  let totalWithdrawn = 0;
  let totalWithdrawnRmb = 0;
  try {
    const row = db.prepare('SELECT SUM(amount) as amt, SUM(amount_rmb) as amtRmb FROM banam_entries WHERE partner_id = ?').get(r.id);
    if (row) {
      totalWithdrawn = Number(row.amt || 0);
      totalWithdrawnRmb = Number(row.amtRmb || 0);
    }
  } catch (e) {}

  return {
    id: r.id,
    name: r.name,
    mobile: r.mobile || '',
    totalWithdrawn,
    totalWithdrawnRmb,
    createdAt: r.created_at
  };
}

app.get('/api/partners', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM partners ORDER BY id ASC').all();
    res.json(rows.map(formatPartner));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/partners/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM partners WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Partner not found' });
    res.json(formatPartner(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/partners', (req, res) => {
  try {
    let { id, name, mobile } = req.body;
    if (!name) return res.status(400).json({ error: 'Partner name is required' });

    if (!id) {
      const serial = getNextSerial('partner');
      id = `PART-${String(serial).padStart(4, '0')}`;
    }
    ensureCounterAtLeast('partner', id);

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    db.prepare('INSERT INTO partners (id, name, mobile, created_at) VALUES (?, ?, ?, ?)').run(id, name, mobile || '', now);

    const created = db.prepare('SELECT * FROM partners WHERE id = ?').get(id);
    res.status(201).json(formatPartner(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/partners/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile } = req.body;
    db.prepare('UPDATE partners SET name = ?, mobile = ? WHERE id = ?').run(name, mobile || '', id);
    const updated = db.prepare('SELECT * FROM partners WHERE id = ?').get(id);
    res.json(formatPartner(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/partners/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM partners WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatBanamEntry(r) {
  if (!r) return null;
  return {
    id: r.id,
    date: r.date,
    partnerId: r.partner_id || '',
    partner_id: r.partner_id || '',
    partnerName: r.partner_name || '',
    partner_name: r.partner_name || '',
    bankId: r.bank_id || '',
    bank_id: r.bank_id || '',
    bankName: r.bank_name || '',
    bank_name: r.bank_name || '',
    bankAccount: r.bank_account || '',
    bank_account: r.bank_account || '',
    currency: r.currency || 'RMB',
    rate: Number(r.rate || 1),
    amount: Number(r.amount || 0),
    amountRmb: Number(r.amount_rmb || 0),
    amount_rmb: Number(r.amount_rmb || 0),
    details: r.details || '',
    createdAt: r.created_at,
    created_at: r.created_at
  };
}

app.get('/api/banam-entries', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM banam_entries ORDER BY date DESC, rowid DESC').all();
    res.json(rows.map(formatBanamEntry));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/banam-entries/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM banam_entries WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Banam entry not found' });
    res.json(formatBanamEntry(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/banam-entries', (req, res) => {
  try {
    let { id, date, partnerId, partnerName, bankId, bankName, bankAccount, currency, rate, amount, details } = req.body;
    partnerId = partnerId || req.body.partner_id;
    partnerName = partnerName || req.body.partner_name;
    bankId = bankId || req.body.bank_id;
    bankName = bankName || req.body.bank_name;
    bankAccount = bankAccount || req.body.bank_account;
    if (!partnerName || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Partner name and valid withdrawal amount are required' });
    }

    if (!id) {
      const serial = getNextSerial('banam');
      id = `BAN-${String(serial).padStart(4, '0')}`;
    }
    ensureCounterAtLeast('banam', id);

    const cur = currency || 'RMB';
    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(rate) || 1.0;
    let amountRmb = numAmount;

    if (cur !== 'RMB') {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const rateType = curRow ? curRow.rate_type : 'greater';
      if (rateType === 'greater') {
        amountRmb = numAmount * numRate;
      } else if (rateType === 'smaller') {
        amountRmb = numAmount / numRate;
      }
    }

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    db.prepare(`
      INSERT INTO banam_entries (
        id, date, partner_id, partner_name, bank_id, bank_name, bank_account,
        currency, rate, amount, amount_rmb, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, date || new Date().toISOString().split('T')[0],
      partnerId || '', partnerName, bankId || '', bankName || '', bankAccount || '',
      cur, numRate, numAmount, amountRmb, details || '', now
    );

    const created = db.prepare('SELECT * FROM banam_entries WHERE id = ?').get(id);
    res.status(201).json(formatBanamEntry(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/banam-entries/:id', (req, res) => {
  try {
    const { id } = req.params;
    let { date, partnerId, partnerName, bankId, bankName, bankAccount, currency, rate, amount, details } = req.body;
    partnerId = partnerId || req.body.partner_id;
    partnerName = partnerName || req.body.partner_name;
    bankId = bankId || req.body.bank_id;
    bankName = bankName || req.body.bank_name;
    bankAccount = bankAccount || req.body.bank_account;

    const cur = currency || 'RMB';
    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(rate) || 1.0;
    let amountRmb = numAmount;

    if (cur !== 'RMB') {
      const curRow = db.prepare('SELECT rate_type FROM currencies WHERE code = ?').get(cur);
      const rateType = curRow ? curRow.rate_type : 'greater';
      if (rateType === 'greater') {
        amountRmb = numAmount * numRate;
      } else if (rateType === 'smaller') {
        amountRmb = numAmount / numRate;
      }
    }

    db.prepare(`
      UPDATE banam_entries
      SET date = ?, partner_id = ?, partner_name = ?, bank_id = ?, bank_name = ?, bank_account = ?,
          currency = ?, rate = ?, amount = ?, amount_rmb = ?, details = ?
      WHERE id = ?
    `).run(
      date || new Date().toISOString().split('T')[0],
      partnerId || '', partnerName || '', bankId || '', bankName || '', bankAccount || '',
      cur, numRate, numAmount, amountRmb, details || '', id
    );

    const updated = db.prepare('SELECT * FROM banam_entries WHERE id = ?').get(id);
    res.json(formatBanamEntry(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/banam-entries/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM banam_entries WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SHIPMENT STAGES API =================
app.get('/api/shipment-stages', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM shipment_stages ORDER BY order_index ASC, id ASC').all();
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      defaultPct: Number(r.default_pct || 0),
      default_pct: Number(r.default_pct || 0),
      orderIndex: Number(r.order_index || 0),
      order_index: Number(r.order_index || 0)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shipment-stages', (req, res) => {
  try {
    const { name, defaultPct, default_pct, orderIndex, order_index } = req.body;
    if (!name) return res.status(400).json({ error: 'Stage name is required' });
    const pct = parseInt(defaultPct !== undefined ? defaultPct : default_pct) || 0;
    const idx = parseInt(orderIndex !== undefined ? orderIndex : order_index) || 0;
    const result = db.prepare('INSERT INTO shipment_stages (name, default_pct, order_index) VALUES (?, ?, ?)').run(name, pct, idx);
    const created = db.prepare('SELECT * FROM shipment_stages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      id: created.id,
      name: created.name,
      defaultPct: Number(created.default_pct),
      default_pct: Number(created.default_pct),
      orderIndex: Number(created.order_index),
      order_index: Number(created.order_index)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shipment-stages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, defaultPct, default_pct, orderIndex, order_index } = req.body;
    const pct = parseInt(defaultPct !== undefined ? defaultPct : default_pct) || 0;
    const idx = parseInt(orderIndex !== undefined ? orderIndex : order_index) || 0;
    db.prepare('UPDATE shipment_stages SET name = ?, default_pct = ?, order_index = ? WHERE id = ?').run(name, pct, idx, id);
    const updated = db.prepare('SELECT * FROM shipment_stages WHERE id = ?').get(id);
    res.json({
      id: updated.id,
      name: updated.name,
      defaultPct: Number(updated.default_pct),
      default_pct: Number(updated.default_pct),
      orderIndex: Number(updated.order_index),
      order_index: Number(updated.order_index)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shipment-stages/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM shipment_stages WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ORDER SHIPPING STATUSES API =================
function formatShippingStatus(r) {
  if (!r) return null;
  let notesHistory = [];
  try { notesHistory = JSON.parse(r.notes_history || '[]'); } catch (e) {}

  let orderName = r.order_name || '';
  let customerName = r.customer_name || '';
  if (!orderName || orderName === 'undefined') {
    const ord = db.prepare('SELECT name, customer_name FROM orders WHERE id = ?').get(r.order_id);
    if (ord) {
      orderName = ord.name || '';
      if (!customerName || customerName === 'Customer') customerName = ord.customer_name || '';
    }
  }

  const completionPct = Number(r.completion_pct || 0);

  return {
    id: r.id,
    orderId: r.order_id,
    order_id: r.order_id,
    orderName,
    order_name: orderName,
    customerName,
    customer_name: customerName,
    stageName: r.stage_name || '',
    stage_name: r.stage_name || '',
    completionPct,
    completion_pct: completionPct,
    companyNotes: r.company_notes || '',
    company_notes: r.company_notes || '',
    customerNotes: r.customer_notes || '',
    customer_notes: r.customer_notes || '',
    notesHistory,
    notes_history: notesHistory,
    route: r.route || '',
    origin: r.origin || (r.route ? (r.route.split(/[➔→\->]/)[0] || '').trim() : ''),
    destination: r.destination || (r.route ? (r.route.split(/[➔→\->]/)[1] || '').trim() : ''),
    createdAt: r.created_at,
    created_at: r.created_at
  };
}

app.get('/api/shipping-statuses', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM order_shipping_statuses ORDER BY rowid DESC').all();
    res.json(rows.map(formatShippingStatus));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shipping-statuses/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM order_shipping_statuses WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Shipping status not found' });
    res.json(formatShippingStatus(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/shipping-statuses/by-order/:orderId', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM order_shipping_statuses WHERE order_id = ? ORDER BY rowid DESC').get(req.params.orderId);
    if (!row) return res.json(null);
    res.json(formatShippingStatus(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shipping-statuses', (req, res) => {
  try {
    let { id, orderId, orderName, customerName, stageName, completionPct, companyNotes, customerNotes, notesHistory, route, origin, destination } = req.body;
    orderId = orderId || req.body.order_id;
    orderName = orderName || req.body.order_name;
    customerName = customerName || req.body.customer_name;
    stageName = stageName || req.body.stage_name;
    completionPct = completionPct !== undefined ? completionPct : req.body.completion_pct;
    companyNotes = companyNotes || req.body.company_notes;
    customerNotes = customerNotes || req.body.customer_notes;
    origin = origin !== undefined ? origin : (req.body.origin || '');
    destination = destination !== undefined ? destination : (req.body.destination || '');
    route = route !== undefined ? route : (req.body.route || '');

    if (!route && (origin || destination)) {
      route = (origin && destination) ? `${origin} ➔ ${destination}` : (origin || destination);
    } else if (route && (!origin || !destination)) {
      const parts = route.split(/[➔→\->]/);
      if (parts.length >= 2) {
        if (!origin) origin = parts[0].trim();
        if (!destination) destination = parts[1].trim();
      }
    }

    const companyNotesDate = req.body.company_notes_date || req.body.companyNotesDate;
    const customerNotesDate = req.body.customer_notes_date || req.body.customerNotesDate;

    if (!orderId || !stageName) {
      return res.status(400).json({ error: 'Order and Shipping stage are required' });
    }

    if (!orderName || orderName === 'undefined') {
      const ord = db.prepare('SELECT name, customer_name FROM orders WHERE id = ?').get(orderId);
      if (ord) {
        orderName = ord.name;
        if (!customerName || customerName === 'Customer' || customerName === 'undefined') customerName = ord.customer_name;
      }
    }

    if (!id) {
      const serial = getNextSerial('shipping_status');
      id = `SHIP-${String(serial).padStart(4, '0')}`;
    }
    ensureCounterAtLeast('shipping_status', id);

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const today = new Date().toISOString().split('T')[0];

    // Build cumulative notes history
    const existing = db.prepare('SELECT * FROM order_shipping_statuses WHERE order_id = ? ORDER BY rowid DESC').get(orderId);
    let history = [];
    if (existing && existing.notes_history) {
      try { history = JSON.parse(existing.notes_history); } catch (e) {}
    } else if (Array.isArray(notesHistory)) {
      history = [...notesHistory];
    }

    if (companyNotes && companyNotes.trim()) {
      history.push({
        type: 'company',
        stage: stageName,
        text: companyNotes.trim(),
        date: companyNotesDate || today
      });
    }

    if (customerNotes && customerNotes.trim()) {
      history.push({
        type: 'customer',
        stage: stageName,
        text: customerNotes.trim(),
        date: customerNotesDate || today
      });
    }

    const historyJson = JSON.stringify(history);

    if (existing) {
      // Update existing order milestone
      db.prepare(`
        UPDATE order_shipping_statuses
        SET order_name = ?, customer_name = ?, stage_name = ?, completion_pct = ?,
            company_notes = ?, customer_notes = ?, notes_history = ?, route = ?, origin = ?, destination = ?
        WHERE id = ?
      `).run(
        orderName || existing.order_name || '',
        customerName || existing.customer_name || '',
        stageName, parseInt(completionPct) || 0,
        companyNotes || existing.company_notes || '',
        customerNotes || existing.customer_notes || '',
        historyJson,
        route !== undefined && route !== '' ? route : (existing.route || ''),
        origin !== undefined && origin !== '' ? origin : (existing.origin || ''),
        destination !== undefined && destination !== '' ? destination : (existing.destination || ''),
        existing.id
      );
      const updated = db.prepare('SELECT * FROM order_shipping_statuses WHERE id = ?').get(existing.id);
      return res.status(201).json(formatShippingStatus(updated));
    }

    db.prepare(`
      INSERT INTO order_shipping_statuses (
        id, order_id, order_name, customer_name,
        stage_name, completion_pct, company_notes, customer_notes, notes_history, route, origin, destination, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, orderId, orderName || '', customerName || '',
      stageName, parseInt(completionPct) || 0,
      companyNotes || '', customerNotes || '', historyJson, route || '', origin || '', destination || '', now
    );

    const created = db.prepare('SELECT * FROM order_shipping_statuses WHERE id = ?').get(id);
    res.status(201).json(formatShippingStatus(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shipping-statuses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM order_shipping_statuses WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Shipping status not found' });

    let { orderId, orderName, customerName, stageName, completionPct, companyNotes, customerNotes, notesHistory, route, origin, destination } = req.body;
    orderId = orderId !== undefined ? orderId : (req.body.order_id !== undefined ? req.body.order_id : existing.order_id);
    orderName = orderName !== undefined ? orderName : (req.body.order_name !== undefined ? req.body.order_name : existing.order_name);
    customerName = customerName !== undefined ? customerName : (req.body.customer_name !== undefined ? req.body.customer_name : existing.customer_name);
    stageName = stageName !== undefined ? stageName : (req.body.stage_name !== undefined ? req.body.stage_name : existing.stage_name);
    completionPct = completionPct !== undefined ? parseInt(completionPct, 10) : (req.body.completion_pct !== undefined ? parseInt(req.body.completion_pct, 10) : existing.completion_pct);
    companyNotes = companyNotes !== undefined ? companyNotes : (req.body.company_notes !== undefined ? req.body.company_notes : existing.company_notes);
    customerNotes = customerNotes !== undefined ? customerNotes : (req.body.customer_notes !== undefined ? req.body.customer_notes : existing.customer_notes);
    origin = origin !== undefined ? origin : (req.body.origin !== undefined ? req.body.origin : (existing.origin || ''));
    destination = destination !== undefined ? destination : (req.body.destination !== undefined ? req.body.destination : (existing.destination || ''));
    route = route !== undefined ? route : (req.body.route !== undefined ? req.body.route : (existing.route || ''));

    if (!route && (origin || destination)) {
      route = (origin && destination) ? `${origin} ➔ ${destination}` : (origin || destination);
    } else if (route && (!origin || !destination)) {
      const parts = route.split(/[➔→\->]/);
      if (parts.length >= 2) {
        if (!origin) origin = parts[0].trim();
        if (!destination) destination = parts[1].trim();
      }
    }

    let historyJson;
    if (notesHistory !== undefined || req.body.notes_history !== undefined) {
      const arr = notesHistory !== undefined ? notesHistory : req.body.notes_history;
      historyJson = JSON.stringify(Array.isArray(arr) ? arr : []);
    } else {
      historyJson = existing.notes_history || '[]';
    }

    db.prepare(`
      UPDATE order_shipping_statuses
      SET order_id = ?, order_name = ?, customer_name = ?,
          stage_name = ?, completion_pct = ?, company_notes = ?, customer_notes = ?, notes_history = ?, route = ?, origin = ?, destination = ?
      WHERE id = ?
    `).run(
      orderId || '', orderName || '', customerName || '',
      stageName || '', completionPct || 0,
      companyNotes || '', customerNotes || '', historyJson, route || '', origin || '', destination || '', id
    );

    const updated = db.prepare('SELECT * FROM order_shipping_statuses WHERE id = ?').get(id);
    res.json(formatShippingStatus(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/shipping-statuses/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM order_shipping_statuses WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= MASTER TASKS API =================
app.get('/api/master-tasks', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM master_tasks ORDER BY default_order ASC, id ASC').all();
    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      defaultOrder: Number(r.default_order || 0)
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/master-tasks', (req, res) => {
  try {
    const { title, defaultOrder } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
    const maxOrderRow = db.prepare('SELECT MAX(default_order) as max_ord FROM master_tasks').get();
    const orderIdx = defaultOrder !== undefined ? parseInt(defaultOrder) : ((maxOrderRow?.max_ord || 0) + 1);
    const result = db.prepare('INSERT INTO master_tasks (title, default_order) VALUES (?, ?)').run(title.trim(), orderIdx);
    const created = db.prepare('SELECT * FROM master_tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      id: created.id,
      title: created.title,
      defaultOrder: Number(created.default_order)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/master-tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, defaultOrder } = req.body;
    db.prepare('UPDATE master_tasks SET title = ?, default_order = ? WHERE id = ?')
      .run(title ? title.trim() : '', parseInt(defaultOrder) || 0, id);
    const updated = db.prepare('SELECT * FROM master_tasks WHERE id = ?').get(id);
    if (!updated) return res.status(404).json({ error: 'Master task not found' });
    res.json({
      id: updated.id,
      title: updated.title,
      defaultOrder: Number(updated.default_order)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/master-tasks-reorder', (req, res) => {
  try {
    const { items } = req.body;
    if (Array.isArray(items)) {
      const stmt = db.prepare('UPDATE master_tasks SET default_order = ? WHERE id = ?');
      const transaction = db.transaction((taskList) => {
        for (const t of taskList) {
          stmt.run(parseInt(t.defaultOrder) || 0, t.id);
        }
      });
      transaction(items);
    }
    const rows = db.prepare('SELECT * FROM master_tasks ORDER BY default_order ASC, id ASC').all();
    res.json(rows.map(r => ({ id: r.id, title: r.title, defaultOrder: Number(r.default_order || 0) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/master-tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM master_tasks WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ORDER TASKS API =================
function formatOrderTasks(r) {
  if (!r) return null;
  let tasks = [];
  try { tasks = JSON.parse(r.tasks_json || '[]'); } catch (e) {}
  return {
    id: r.id,
    orderId: r.order_id,
    orderName: r.order_name,
    customerName: r.customer_name || '',
    date: r.date,
    tasks,
    createdAt: r.created_at
  };
}

app.get('/api/order-tasks', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM order_tasks ORDER BY date DESC, rowid DESC').all();
    res.json(rows.map(formatOrderTasks));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/order-tasks/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM order_tasks WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Order tasks not found' });
    res.json(formatOrderTasks(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/order-tasks/by-order/:orderId', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM order_tasks WHERE order_id = ? ORDER BY rowid DESC').get(req.params.orderId);
    if (!row) return res.json(null);
    res.json(formatOrderTasks(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/order-tasks', (req, res) => {
  try {
    let { id, orderId, orderName, customerName, date, tasks } = req.body;
    orderId = orderId || req.body.order_id;
    orderName = orderName || req.body.order_name;
    customerName = customerName || req.body.customer_name;

    if (!orderId) return res.status(400).json({ error: 'Order is required' });

    if (!orderName) {
      const ord = db.prepare('SELECT name, customer_name FROM orders WHERE id = ?').get(orderId);
      if (ord) {
        orderName = ord.name;
        if (!customerName) customerName = ord.customer_name;
      }
    }

    if (!id) {
      const serial = getNextSerial('order_task');
      id = `TSK-${String(serial).padStart(4, '0')}`;
    }

    const tasksJson = JSON.stringify(Array.isArray(tasks) ? tasks : []);
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const taskDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO order_tasks (id, order_id, order_name, customer_name, date, tasks_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, orderId, orderName || '', customerName || '', taskDate, tasksJson, now);

    const created = db.prepare('SELECT * FROM order_tasks WHERE id = ?').get(id);
    res.status(201).json(formatOrderTasks(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/order-tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    let { orderId, orderName, customerName, date, tasks } = req.body;
    orderId = orderId || req.body.order_id;
    orderName = orderName || req.body.order_name;
    customerName = customerName || req.body.customer_name;

    const existing = db.prepare('SELECT * FROM order_tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Order tasks not found' });

    const tasksJson = tasks !== undefined ? JSON.stringify(Array.isArray(tasks) ? tasks : []) : existing.tasks_json;

    db.prepare(`
      UPDATE order_tasks
      SET order_id = ?, order_name = ?, customer_name = ?, date = ?, tasks_json = ?
      WHERE id = ?
    `).run(
      orderId || existing.order_id,
      orderName || existing.order_name,
      customerName !== undefined ? customerName : existing.customer_name,
      date || existing.date,
      tasksJson,
      id
    );

    const updated = db.prepare('SELECT * FROM order_tasks WHERE id = ?').get(id);
    res.json(formatOrderTasks(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/order-tasks/:id/toggle-task', (req, res) => {
  try {
    const { id } = req.params;
    const { taskItemId, completed } = req.body;
    const existing = db.prepare('SELECT * FROM order_tasks WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Order tasks not found' });

    let tasks = [];
    try { tasks = JSON.parse(existing.tasks_json || '[]'); } catch (e) {}

    let matched = false;
    tasks = tasks.map(t => {
      if (t.id === taskItemId || String(t.order_index) === String(taskItemId)) {
        matched = true;
        return { ...t, completed: completed !== undefined ? Boolean(completed) : !t.completed };
      }
      return t;
    });

    if (!matched && tasks.length > 0) {
      const idx = parseInt(taskItemId);
      if (!isNaN(idx) && tasks[idx]) {
        tasks[idx].completed = completed !== undefined ? Boolean(completed) : !tasks[idx].completed;
      }
    }

    db.prepare('UPDATE order_tasks SET tasks_json = ? WHERE id = ?').run(JSON.stringify(tasks), id);
    const updated = db.prepare('SELECT * FROM order_tasks WHERE id = ?').get(id);
    res.json(formatOrderTasks(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/order-tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM order_tasks WHERE id = ?').run(id);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= STATS & OVERVIEW API =================
app.get('/api/stats', (req, res) => {
  try {
    const custCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const quotesCount = db.prepare('SELECT COUNT(*) as count FROM quotes').get().count;
    const invoicesCount = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count;
    const banksCount = db.prepare('SELECT COUNT(*) as count FROM banks').get().count;
    const receiptsCount = db.prepare('SELECT COUNT(*) as count FROM receipts').get().count;
    const expensesCount = db.prepare('SELECT COUNT(*) as count FROM expenses').get().count;
    const chargedExpensesCount = db.prepare('SELECT COUNT(*) as count FROM charged_expenses').get().count;
    const suppliersCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
    const purchasesCount = db.prepare('SELECT COUNT(*) as count FROM purchases').get().count;
    const cashPurchasesCount = db.prepare('SELECT COUNT(*) as count FROM cash_purchases').get().count;
    const supplierPaymentsCount = db.prepare('SELECT COUNT(*) as count FROM supplier_payments').get().count;
    const mediaCount = db.prepare('SELECT COUNT(*) as count FROM order_media').get().count;
    const transfersCount = db.prepare('SELECT COUNT(*) as count FROM bank_transfers').get().count;
    const overheadExpensesCount = db.prepare('SELECT COUNT(*) as count FROM overhead_expenses').get().count;
    const partnersCount = db.prepare('SELECT COUNT(*) as count FROM partners').get().count;
    const banamEntriesCount = db.prepare('SELECT COUNT(*) as count FROM banam_entries').get().count;
    const shipmentStagesCount = db.prepare('SELECT COUNT(*) as count FROM shipment_stages').get().count;
    const shippingStatusesCount = db.prepare('SELECT COUNT(*) as count FROM order_shipping_statuses').get().count;
    const masterTasksCount = db.prepare('SELECT COUNT(*) as count FROM master_tasks').get().count;
    const orderTasksCount = db.prepare('SELECT COUNT(*) as count FROM order_tasks').get().count;

    const orderTotals = db.prepare(`
      SELECT 
        SUM(invoice_amount) as totalInvoice,
        SUM(received_to_date) as totalReceived,
        SUM(receivable_balance) as totalBalance,
        SUM(expenses_so_far) as totalExpenses,
        SUM(profit) as totalProfit
      FROM orders
    `).get();

    const overheadTotalRow = db.prepare('SELECT SUM(amount_rmb) as total FROM overhead_expenses').get();
    const banamTotalRow = db.prepare('SELECT SUM(amount_rmb) as total FROM banam_entries').get();

    res.json({
      customers: custCount,
      orders: ordersCount,
      quotes: quotesCount,
      invoices: invoicesCount,
      banks: banksCount,
      receipts: receiptsCount,
      expenses: expensesCount,
      chargedExpenses: chargedExpensesCount,
      suppliers: suppliersCount,
      purchases: purchasesCount,
      cashPurchases: cashPurchasesCount,
      supplierPayments: supplierPaymentsCount,
      media: mediaCount,
      transfers: transfersCount,
      overheadExpenses: overheadExpensesCount,
      partners: partnersCount,
      banamEntries: banamEntriesCount,
      shipmentStages: shipmentStagesCount,
      shippingStatuses: shippingStatusesCount,
      masterTasks: masterTasksCount,
      orderTasks: orderTasksCount,
      totalOverheadRmb: Number(overheadTotalRow?.total || 0),
      totalBanamRmb: Number(banamTotalRow?.total || 0),
      financials: {
        totalInvoice: orderTotals.totalInvoice || 0,
        totalReceived: orderTotals.totalReceived || 0,
        totalBalance: orderTotals.totalBalance || 0,
        totalExpenses: orderTotals.totalExpenses || 0,
        totalProfit: orderTotals.totalProfit || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 China Sourcing Accounts server running on http://localhost:${PORT}`);
});
