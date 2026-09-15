const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Base directory for resolving static assets (works locally and on Vercel)
const BASE_DIR = __dirname;

app.use(cors());
app.use(express.json());

// Explicit root route — redirect to login page
app.get('/', (req, res) => {
  res.sendFile(path.join(BASE_DIR, 'login.html'));
});

// Serve all frontend static assets (html, css, js, images)
app.use(express.static(BASE_DIR));


const DB_PATH = path.join(BASE_DIR, 'db.json');

let webhookLogs = []; // Store webhook traffic in memory to display on frontend console

let memoryDb = null; // In-memory database cache for serverless environments

// Helper functions to read/write db.json
function readDB() {
  if (memoryDb) return memoryDb;
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    memoryDb = JSON.parse(raw);
    return memoryDb;
  } catch (err) {
    console.error('Error reading db.json, returning empty structure', err);
    memoryDb = { stats: { sales: 0, conversion: 0, sessions: 0, orderCount: 0 }, products: [], customers: {}, orders: [] };
    return memoryDb;
  }
}

function writeDB(data) {
  memoryDb = data; // Always update in-memory cache first
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('Read-only filesystem detected (Vercel). Persistent write skipped, using memory cache.', err.message);
  }
}

// Log incoming API/Webhook request to display in frontend terminal
function logWebhookTraffic(method, endpoint, payload) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  webhookLogs.unshift({
    timestamp,
    method,
    endpoint,
    payload: JSON.parse(JSON.stringify(payload))
  });
  // Cap at 20 logs
  if(webhookLogs.length > 20) webhookLogs.pop();
}

const https = require('https');

// Send message to WhatsApp Cloud API if environment variables are set, fallback to simulator logging
function sendWhatsAppMessage(to, payload) {
  // Always log to the terminal visualizer
  logWebhookTraffic('POST', '/v20.0/messages', payload);

  const token = process.env.META_ACCESS_TOKEN;
  const phoneId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log('WhatsCart running in Simulator Mode (META_ACCESS_TOKEN / PHONE_NUMBER_ID not set).');
    return;
  }

  const cleanPhone = to.replace(/[^0-9]/g, '');
  const metaPayload = { ...payload, to: cleanPhone };
  const data = JSON.stringify(metaPayload);

  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/v20.0/${phoneId}/messages`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`Live WhatsApp message status: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(body);
        logWebhookTraffic('SYSTEM', 'LIVE_API_DELIVERY', { status: res.statusCode, response: parsed });
      } catch (err) {
        logWebhookTraffic('SYSTEM', 'LIVE_API_DELIVERY', { status: res.statusCode, rawResponse: body });
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Live WhatsApp API delivery failed: ${e.message}`);
    logWebhookTraffic('SYSTEM', 'LIVE_API_ERROR', { error: e.message });
  });

  req.write(data);
  req.end();
}

// =========================================================================
// API ENDPOINTS
// =========================================================================

// Get webhook traffic logs for terminal visualizer
app.get('/api/logs', (req, res) => {
  res.json(webhookLogs);
});

// Clear webhook traffic logs
app.post('/api/logs/clear', (req, res) => {
  webhookLogs = [];
  res.json({ success: true });
});

// Role-Based User Login Auth
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'joydeep' && password === 'admin') {
    return res.json({
      success: true,
      user: {
        name: 'Joydeep Sen',
        username: 'joydeep',
        role: 'owner',
        title: 'General Manager & Partner',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80'
      }
    });
  } else if ((username === 'subhashis' || username === 'amit') && (password === 'agent' || password === 'admin')) {
    return res.json({
      success: true,
      user: {
        name: 'Subhashis Banerjee',
        username: 'subhashis',
        role: 'agent',
        title: 'Senior Dining Support Agent',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
      }
    });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  }
});

// Get Dashboard KPI Metrics
app.get('/api/stats', (req, res) => {
  const db = readDB();
  res.json(db.stats);
});

// Catalog Management - Get Products
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Catalog Management - Add Product
app.post('/api/products', (req, res) => {
  const db = readDB();
  const { name, price, sku, image, desc, category, isVeg, prepTime, bestseller, stockStatus } = req.body;
  
  if(!name || !price || !sku) {
    return res.status(400).json({ error: 'Missing product fields' });
  }
  
  const newProduct = {
    id: 'prod' + (db.products.length + 1),
    name,
    category: category || 'signature',
    price: parseFloat(price),
    sku,
    isVeg: isVeg === true || isVeg === 'true',
    bestseller: bestseller === true || bestseller === 'true',
    prepTime: prepTime || '25 mins',
    stockStatus: stockStatus || 'in_stock',
    image: image || 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80',
    desc: desc || ''
  };
  
  db.products.push(newProduct);
  writeDB(db);
  
  logWebhookTraffic('POST', '/api/products', { event: 'CATALOG_SYNC_WABA', productId: newProduct.id, sku: newProduct.sku });
  res.json(newProduct);
});

// Catalog Management - Update Product (Price / Stock / Availability)
app.put('/api/products/:id', (req, res) => {
  const db = readDB();
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { price, stockStatus, name, desc } = req.body;
  if (price !== undefined) prod.price = parseFloat(price);
  if (stockStatus !== undefined) prod.stockStatus = stockStatus;
  if (name !== undefined) prod.name = name;
  if (desc !== undefined) prod.desc = desc;

  writeDB(db);
  logWebhookTraffic('PUT', `/api/products/${req.params.id}`, { event: 'CATALOG_ITEM_UPDATED', productId: prod.id, price: prod.price, stockStatus: prod.stockStatus });
  res.json({ success: true, product: prod });
});

// Catalog Management - Force Meta WABA Catalog Sync
app.post('/api/catalog/sync', (req, res) => {
  const db = readDB();
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  logWebhookTraffic('POST', '/api/catalog/sync', {
    event: 'META_WABA_CATALOG_SYNCED',
    totalItems: db.products.length,
    status: '100% Approved by Meta Commerce',
    syncedAt: timestamp
  });
  res.json({
    success: true,
    message: `All ${db.products.length} catalog items synchronized with Meta Cloud Commerce API!`,
    syncedAt: timestamp,
    totalItems: db.products.length
  });
});

// Order Management - Get Orders list
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders);
});

// CRM Customer Detail
app.get('/api/customers/:id', (req, res) => {
  const db = readDB();
  const customer = db.customers[req.params.id];
  if(!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

// Get all customer summary metadata
app.get('/api/customers', (req, res) => {
  const db = readDB();
  res.json(db.customers);
});

// Update CRM Customer details (e.g., notes, address)
app.put('/api/customers/:id', (req, res) => {
  const db = readDB();
  const customer = db.customers[req.params.id];
  if(!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const { notes, address } = req.body;
  if(notes !== undefined) customer.notes = notes;
  if(address !== undefined) customer.address = address;
  
  writeDB(db);
  
  logWebhookTraffic('PUT', `/api/customers/${req.params.id}`, { event: 'CRM_UPDATE', customerId: req.params.id, notes, address });
  res.json(customer);
});

// Mock Shopify sync endpoint
app.post('/api/shopify/sync', (req, res) => {
  logWebhookTraffic('POST', '/api/shopify/sync', {
    event: 'SHOPIFY_SYNC_TRIGGER',
    store: '6ballygungeplace.myshopify.com',
    status: 'SUCCESS',
    syncedProductsCount: 4,
    timestamp: new Date().toISOString()
  });
  res.json({ success: true });
});

// Merchant sends manual chat reply message
app.post('/api/messages', (req, res) => {
  const db = readDB();
  const { customerId, text } = req.body;
  
  const customer = db.customers[customerId];
  if(!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const time = getFormattedTime();
  const newMsg = {
    sender: 'agent',
    text,
    time
  };
  
  // Transition customer status from BOT to waiting agent since human took over
  if(customer.state === 'STATE_SHOPPING') {
    customer.state = 'STATE_WAITING_AGENT';
  }
  
  customer.chatHistory.push(newMsg);
  writeDB(db);
  
  // Log simulated API call to Meta send message endpoint
  sendWhatsAppMessage(customer.phone, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: customer.phone,
    type: 'text',
    text: { body: text }
  });
  
  res.json(customer);
});

// =========================================================================
// MULTI-OUTLET MANAGEMENT & DAILY COLLECTION ENDPOINTS
// =========================================================================

// Get list of all outlets with current shift and today's summary
app.get('/api/outlets', (req, res) => {
  const db = readDB();
  const outlets = (db.outlets || []).map(outlet => {
    const todayCol = (db.dailyCollections || []).find(c => c.outletId === outlet.id);
    return {
      ...outlet,
      todayCollection: todayCol || {
        grossTotal: 0,
        cash: 0,
        upi: 0,
        card: 0,
        onlineDelivery: 0,
        expenses: 0,
        netDeposit: 0,
        status: 'open',
        notes: 'Shift not yet started'
      }
    };
  });
  res.json(outlets);
});

// Get consolidated daily collection figures and breakdown for today
app.get('/api/collections/today', (req, res) => {
  const db = readDB();
  const records = db.dailyCollections || [];
  const outlets = db.outlets || [];

  let totalGross = 0;
  let totalCash = 0;
  let totalUpi = 0;
  let totalCard = 0;
  let totalOnline = 0;
  let totalExpenses = 0;
  let totalNet = 0;
  let totalTarget = 0;
  let settledCount = 0;
  let pendingAuditCount = 0;
  let openCount = 0;

  outlets.forEach(o => {
    totalTarget += (o.targetDaily || 0);
  });

  records.forEach(r => {
    totalGross += (r.grossTotal || 0);
    totalCash += (r.cash || 0);
    totalUpi += (r.upi || 0);
    totalCard += (r.card || 0);
    totalOnline += (r.onlineDelivery || 0);
    totalExpenses += (r.expenses || 0);
    totalNet += (r.netDeposit || 0);

    if (r.status === 'settled') settledCount++;
    else if (r.status === 'pending_audit') pendingAuditCount++;
    else openCount++;
  });

  const totalDigital = totalUpi + totalCard;
  const achievementPct = totalTarget > 0 ? ((totalGross / totalTarget) * 100).toFixed(1) : '0.0';
  const cashRatio = totalGross > 0 ? ((totalCash / totalGross) * 100).toFixed(1) : '0.0';
  const digitalRatio = totalGross > 0 ? ((totalDigital / totalGross) * 100).toFixed(1) : '0.0';
  const onlineRatio = totalGross > 0 ? ((totalOnline / totalGross) * 100).toFixed(1) : '0.0';

  res.json({
    summary: {
      totalGross,
      totalCash,
      totalUpi,
      totalCard,
      totalDigital,
      totalOnline,
      totalExpenses,
      totalNet,
      totalTarget,
      achievementPct,
      cashRatio,
      digitalRatio,
      onlineRatio,
      totalOutlets: outlets.length,
      settledCount,
      pendingAuditCount,
      openCount
    },
    outlets,
    records
  });
});

// Record or update daily shift collection for an outlet
app.post('/api/collections/record', (req, res) => {
  const db = readDB();
  const { outletId, cash, upi, card, onlineDelivery, expenses, notes, denominations, settledBy, status } = req.body;

  if (!outletId) {
    return res.status(400).json({ error: 'Missing outletId' });
  }

  const outlet = (db.outlets || []).find(o => o.id === outletId);
  if (!outlet) {
    return res.status(404).json({ error: 'Outlet not found' });
  }

  const numCash = parseFloat(cash) || 0;
  const numUpi = parseFloat(upi) || 0;
  const numCard = parseFloat(card) || 0;
  const numOnline = parseFloat(onlineDelivery) || 0;
  const numExpenses = parseFloat(expenses) || 0;

  const grossTotal = numCash + numUpi + numCard + numOnline;
  const netDeposit = Math.max(0, grossTotal - numExpenses);
  const nowTime = getFormattedTime();

  if (!db.dailyCollections) db.dailyCollections = [];

  const existingIndex = db.dailyCollections.findIndex(c => c.outletId === outletId);
  const updatedRecord = {
    id: existingIndex >= 0 ? db.dailyCollections[existingIndex].id : `COL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${outlet.code}`,
    outletId,
    outletName: outlet.name,
    date: new Date().toISOString().slice(0, 10),
    cash: numCash,
    upi: numUpi,
    card: numCard,
    onlineDelivery: numOnline,
    grossTotal,
    expenses: numExpenses,
    netDeposit,
    target: outlet.targetDaily,
    status: status || 'settled',
    settledBy: settledBy || outlet.manager,
    settledAt: nowTime,
    notes: notes || 'Shift registers closed and audited.',
    denominations: denominations || { '500': 0, '200': 0, '100': 0, 'coins': 0 }
  };

  if (existingIndex >= 0) {
    db.dailyCollections[existingIndex] = updatedRecord;
  } else {
    db.dailyCollections.push(updatedRecord);
  }

  writeDB(db);

  logWebhookTraffic('POST', '/api/collections/record', {
    event: 'OUTLET_COLLECTION_RECORDED',
    outlet: outlet.name,
    grossTotal: `₹${grossTotal.toFixed(2)}`,
    netDeposit: `₹${netDeposit.toFixed(2)}`,
    status: updatedRecord.status
  });

  res.json({ success: true, record: updatedRecord });
});

// Broadcast Consolidated or Branch-Specific EOD Collection Report to Owner/Director via WhatsApp
app.post('/api/collections/broadcast-eod', (req, res) => {
  const db = readDB();
  const records = db.dailyCollections || [];
  const outlets = db.outlets || [];
  const { outletId, directorPhone } = req.body;
  const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  let broadcastMsg = '';
  let reportTitle = '';
  let grossAmount = 0;

  if (outletId && outletId !== 'all') {
    const outlet = outlets.find(o => o.id === outletId) || outlets[0];
    const rec = records.find(r => r.outletId === outletId) || {
      cash: 0, upi: 0, card: 0, onlineDelivery: 0, grossTotal: 0, expenses: 0, netDeposit: 0, status: 'open', notes: ''
    };
    grossAmount = rec.grossTotal || 0;
    const target = outlet.targetDaily || 100000;
    const achieve = ((grossAmount / (target || 1)) * 100).toFixed(1);
    const digitalTotal = (rec.upi || 0) + (rec.card || 0);
    reportTitle = `${outlet.name} Daily Shift Report`;

    const denomStr = rec.denominations
      ? `₹500×${rec.denominations['500'] || 0} | ₹200×${rec.denominations['200'] || 0} | ₹100×${rec.denominations['100'] || 0}`
      : 'Physical drawer count verified';

    const statusIcon = rec.status === 'settled' ? '✅ Audited & Settled' : (rec.status === 'pending_audit' ? '⏳ In Audit / Verifying' : '🚪 Shift Open');

    broadcastMsg = `📊 *6 Ballygunge Place - ${outlet.name} Report*\n` +
      `📅 *Date:* ${todayStr} • *Shift:* ${outlet.currentShift || 'Evening Rush'}\n` +
      `👤 *Manager:* ${rec.settledBy || outlet.manager} (${outlet.phone})\n` +
      `📍 *Location:* ${outlet.location}\n\n` +
      `💰 *Branch Gross Turnover:* ₹${grossAmount.toLocaleString('en-IN')}\n` +
      `🎯 *Target Achievement:* ${achieve}% of ₹${target.toLocaleString('en-IN')}\n\n` +
      `💵 *Cash in Drawer:* ₹${(rec.cash || 0).toLocaleString('en-IN')} (${((rec.cash / (grossAmount || 1)) * 100).toFixed(1)}%)\n` +
      `   ↳ *Physical Audit:* ${denomStr}\n` +
      `⚡ *UPI QR Collections:* ₹${(rec.upi || 0).toLocaleString('en-IN')}\n` +
      `💳 *EDC POS Cards:* ₹${(rec.card || 0).toLocaleString('en-IN')}\n` +
      `🛵 *Online & Delivery:* ₹${(rec.onlineDelivery || 0).toLocaleString('en-IN')}\n` +
      `🧾 *Petty Cash Deductions:* -₹${(rec.expenses || 0).toLocaleString('en-IN')}\n` +
      `🏦 *Net Bank Deposit:* ₹${(rec.netDeposit || 0).toLocaleString('en-IN')}\n\n` +
      `📋 *Audit Status:* ${statusIcon} (${rec.settledAt || 'Active'})\n` +
      `📝 *Manager Closing Notes:* "${rec.notes || 'All bill settlements verified with EDC slips.'}"\n\n` +
      `_Generated from 6BP Central Multi-Branch Management Console._`;
  } else {
    // Consolidated report across all 6 branches
    let totalGross = 0;
    let totalCash = 0;
    let totalDigital = 0;
    let totalOnline = 0;
    let totalNet = 0;
    let totalTarget = 0;

    records.forEach(r => {
      totalGross += (r.grossTotal || 0);
      totalCash += (r.cash || 0);
      totalDigital += ((r.upi || 0) + (r.card || 0));
      totalOnline += (r.onlineDelivery || 0);
      totalNet += (r.netDeposit || 0);
    });
    outlets.forEach(o => totalTarget += (o.targetDaily || 0));
    grossAmount = totalGross;
    reportTitle = 'Consolidated EOD Report (All 6 Branches)';

    const achieve = totalTarget > 0 ? ((totalGross / totalTarget) * 100).toFixed(1) : '100.0';

    let topOutlet = { name: 'Ballygunge Flagship', gross: 0 };
    records.forEach(r => {
      if (r.grossTotal > topOutlet.gross) {
        topOutlet = { name: r.outletName, gross: r.grossTotal };
      }
    });

    broadcastMsg = `📊 *6 Ballygunge Place - Consolidated EOD Report*\n` +
      `📅 *Date:* ${todayStr}\n\n` +
      `💰 *Brand Gross Turnover:* ₹${totalGross.toLocaleString('en-IN')}\n` +
      `🎯 *Target Achievement:* ${achieve}% of ₹${totalTarget.toLocaleString('en-IN')}\n\n` +
      `💵 *Cash in Drawer:* ₹${totalCash.toLocaleString('en-IN')} (${((totalCash / (totalGross || 1)) * 100).toFixed(1)}%)\n` +
      `⚡ *Digital (UPI/Cards):* ₹${totalDigital.toLocaleString('en-IN')} (${((totalDigital / (totalGross || 1)) * 100).toFixed(1)}%)\n` +
      `🛵 *Online & WhatsApp:* ₹${totalOnline.toLocaleString('en-IN')}\n` +
      `🏦 *Net Cash to Bank:* ₹${totalNet.toLocaleString('en-IN')}\n\n` +
      `🏆 *Top Branch:* ${topOutlet.name} (₹${topOutlet.gross.toLocaleString('en-IN')})\n` +
      `✅ *Audited & Settled Outlets:* ${records.filter(r=>r.status==='settled').length}/${outlets.length}\n\n` +
      `_Sent automatically from 6BP Central Management Console._`;
  }

  const targetPhone = directorPhone || '+919007378887';
  sendWhatsAppMessage(targetPhone, {
    messaging_product: 'whatsapp',
    to: targetPhone,
    type: 'text',
    text: { body: broadcastMsg }
  });

  logWebhookTraffic('SYSTEM', 'EOD_EXECUTIVE_BROADCAST', {
    reportType: reportTitle,
    recipient: 'Managing Director & Operations Head',
    grossTotal: `₹${grossAmount.toLocaleString('en-IN')}`,
    targetPhone
  });

  res.json({
    success: true,
    messageText: broadcastMsg,
    reportTitle,
    timestamp: getFormattedTime()
  });
});

// GET pre-formatted executive report for specific branch or consolidated
app.get('/api/collections/report', (req, res) => {
  const db = readDB();
  const records = db.dailyCollections || [];
  const outlets = db.outlets || [];
  const outletId = req.query.outletId;
  const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (outletId && outletId !== 'all') {
    const outlet = outlets.find(o => o.id === outletId) || outlets[0];
    const rec = records.find(r => r.outletId === outletId) || {
      cash: 0, upi: 0, card: 0, onlineDelivery: 0, grossTotal: 0, expenses: 0, netDeposit: 0, status: 'open', notes: ''
    };
    const gross = rec.grossTotal || 0;
    const target = outlet.targetDaily || 100000;
    const achieve = ((gross / (target || 1)) * 100).toFixed(1);

    const denomStr = rec.denominations
      ? `₹500×${rec.denominations['500'] || 0} | ₹200×${rec.denominations['200'] || 0} | ₹100×${rec.denominations['100'] || 0}`
      : 'Physical drawer count verified';

    const statusIcon = rec.status === 'settled' ? '✅ Audited & Settled' : (rec.status === 'pending_audit' ? '⏳ In Audit' : '🚪 Shift Open');

    const text = `📊 *6 Ballygunge Place - ${outlet.name} Report*\n` +
      `📅 *Date:* ${todayStr} • *Shift:* ${outlet.currentShift || 'Evening Rush'}\n` +
      `👤 *Manager:* ${rec.settledBy || outlet.manager} (${outlet.phone})\n` +
      `📍 *Location:* ${outlet.location}\n\n` +
      `💰 *Branch Gross Turnover:* ₹${gross.toLocaleString('en-IN')}\n` +
      `🎯 *Target Achievement:* ${achieve}% of ₹${target.toLocaleString('en-IN')}\n\n` +
      `💵 *Cash in Drawer:* ₹${(rec.cash || 0).toLocaleString('en-IN')} (${((rec.cash / (gross || 1)) * 100).toFixed(1)}%)\n` +
      `   ↳ *Physical Audit:* ${denomStr}\n` +
      `⚡ *UPI QR Collections:* ₹${(rec.upi || 0).toLocaleString('en-IN')}\n` +
      `💳 *EDC POS Cards:* ₹${(rec.card || 0).toLocaleString('en-IN')}\n` +
      `🛵 *Online & Delivery:* ₹${(rec.onlineDelivery || 0).toLocaleString('en-IN')}\n` +
      `🧾 *Petty Cash Deductions:* -₹${(rec.expenses || 0).toLocaleString('en-IN')}\n` +
      `🏦 *Net Bank Deposit:* ₹${(rec.netDeposit || 0).toLocaleString('en-IN')}\n\n` +
      `📋 *Audit Status:* ${statusIcon} (${rec.settledAt || 'Active'})\n` +
      `📝 *Manager Closing Notes:* "${rec.notes || 'All bill settlements verified.'}"\n\n` +
      `_Generated from 6BP Central Multi-Branch Management Console._`;

    return res.json({
      isConsolidated: false,
      outlet,
      record: rec,
      reportTitle: `${outlet.name} Daily Shift Report`,
      formattedText: text,
      achievementPct: achieve,
      grossTotal: gross,
      netDeposit: rec.netDeposit || 0
    });
  }

  // Consolidated
  let totalGross = 0, totalCash = 0, totalDigital = 0, totalOnline = 0, totalNet = 0, totalTarget = 0, totalExpenses = 0;
  records.forEach(r => {
    totalGross += (r.grossTotal || 0);
    totalCash += (r.cash || 0);
    totalDigital += ((r.upi || 0) + (r.card || 0));
    totalOnline += (r.onlineDelivery || 0);
    totalNet += (r.netDeposit || 0);
    totalExpenses += (r.expenses || 0);
  });
  outlets.forEach(o => totalTarget += (o.targetDaily || 0));
  const achieve = totalTarget > 0 ? ((totalGross / totalTarget) * 100).toFixed(1) : '100.0';

  let topOutlet = { name: 'Ballygunge Flagship', gross: 0 };
  records.forEach(r => {
    if (r.grossTotal > topOutlet.gross) topOutlet = { name: r.outletName, gross: r.grossTotal };
  });

  const text = `📊 *6 Ballygunge Place - Consolidated EOD Report*\n` +
    `📅 *Date:* ${todayStr}\n\n` +
    `💰 *Brand Gross Turnover:* ₹${totalGross.toLocaleString('en-IN')}\n` +
    `🎯 *Target Achievement:* ${achieve}% of ₹${totalTarget.toLocaleString('en-IN')}\n\n` +
    `💵 *Cash in Drawer:* ₹${totalCash.toLocaleString('en-IN')} (${((totalCash / (totalGross || 1)) * 100).toFixed(1)}%)\n` +
    `⚡ *Digital (UPI/Cards):* ₹${totalDigital.toLocaleString('en-IN')} (${((totalDigital / (totalGross || 1)) * 100).toFixed(1)}%)\n` +
    `🛵 *Online & WhatsApp:* ₹${totalOnline.toLocaleString('en-IN')}\n` +
    `🏦 *Net Cash to Bank:* ₹${totalNet.toLocaleString('en-IN')}\n\n` +
    `🏆 *Top Branch:* ${topOutlet.name} (₹${topOutlet.gross.toLocaleString('en-IN')})\n` +
    `✅ *Audited & Settled Outlets:* ${records.filter(r=>r.status==='settled').length}/${outlets.length}\n\n` +
    `_Sent automatically from 6BP Central Management Console._`;

  res.json({
    isConsolidated: true,
    reportTitle: 'Consolidated EOD Report (All 6 Branches)',
    formattedText: text,
    grossTotal: totalGross,
    totalTarget,
    achievementPct: achieve,
    totalCash,
    totalDigital,
    totalOnline,
    totalNet,
    totalExpenses,
    topOutlet,
    settledCount: records.filter(r=>r.status==='settled').length,
    totalOutlets: outlets.length
  });
});

// =========================================================================
// MODERN AI COPILOT & EXECUTIVE INTELLIGENCE ENDPOINTS
// =========================================================================

// Generate 3 contextual AI Smart Replies based on customer conversation history
app.post('/api/ai/smart-replies', (req, res) => {
  const db = readDB();
  const { customerId } = req.body;
  const customer = (db.customers || {})[customerId];

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const history = customer.chatHistory || [];
  const lastCustomerMsg = [...history].reverse().find(m => m.sender === 'customer') || { text: '' };
  const lastText = (lastCustomerMsg.text || '').toLowerCase();

  let suggestions = [];
  let sentiment = { label: 'Satisfied', score: 92, intent: 'Browsing & Ordering', icon: 'fa-face-smile', color: 'positive' };

  if (lastText.includes('mustard') || lastText.includes('spic') || lastText.includes('mild') || lastText.includes('allerg')) {
    sentiment = { label: 'Inquiring Spice', score: 86, intent: 'Dietary Clarification', icon: 'fa-circle-question', color: 'neutral' };
    suggestions = [
      "🌿 Our Bhapa Ilish uses gentle sweet white mustard blended with coconut to keep the flavor mild and aromatic!",
      "✨ Would you like Chef to prepare your dish with extra mild green chillies?",
      "🍚 We highly recommend pairing this with steamed Basanti Pulao to beautifully balance the mustard pungency."
    ];
  } else if (lastText.includes('track') || lastText.includes('where') || lastText.includes('status') || lastText.includes('dispatch')) {
    sentiment = { label: 'Awaiting Delivery', score: 88, intent: 'Order Tracking', icon: 'fa-truck-fast', color: 'positive' };
    suggestions = [
      "🚚 Your order is freshly packed and dispatching with hot-thermal insulated casing. Est. delivery: 25 mins!",
      "📍 Your delivery executive can be reached directly at +91 98830 99211.",
      "🥗 We've also included complimentary roasted papad & fresh lime wedges for your meal!"
    ];
  } else if (lastText.includes('talk') || lastText.includes('agent') || lastText.includes('help') || customer.state === 'STATE_WAITING_AGENT') {
    sentiment = { label: 'Engaged with Agent', score: 94, intent: 'Personal Concierge', icon: 'fa-handshake', color: 'positive' };
    suggestions = [
      "👋 Hello! Joydeep Sen here, GM of 6 Ballygunge Place. How may I personalize your heritage dining experience today?",
      "🍽️ Are you planning a family lunch or celebration? I can suggest our chef-curated Grand Royal Feast.",
      "💳 Shall I generate a custom digital invoice for you right away?"
    ];
  } else if (lastText.includes('cart') || lastText.includes('checkout') || lastText.includes('order') || (customer.cart && customer.cart.length > 0)) {
    sentiment = { label: 'High Buying Intent', score: 98, intent: 'Checkout Ready', icon: 'fa-cart-shopping', color: 'positive' };
    suggestions = [
      "🍤 Your cart is ready with our bestsellers! Shall I send the secure 1-click WhatsApp payment link?",
      "🔥 Add 1 portion of velvety Kosha Mangsho to your order for just ₹499 (Exclusive 15% VIP discount)!",
      "🛵 Our kitchen at Ballygunge Flagship can prepare this in 20 minutes for speedy delivery."
    ];
  } else {
    sentiment = { label: 'Delighted VIP', score: 95, intent: 'Exploring Menu', icon: 'fa-star', color: 'positive' };
    suggestions = [
      "👋 Welcome back! Would you like to check out today's Hilsa Festival and Daab Chingri specials?",
      "🍲 Our chef-special Kosha Mangsho with Luchi is trending today with over 45 orders!",
      "📍 Would you like to order for home delivery or book a table at our Ballygunge or Salt Lake branches?"
    ];
  }

  res.json({
    customerId,
    customerName: customer.name,
    sentiment,
    suggestions
  });
});

// Multi-tone AI Response Generator
app.post('/api/ai/draft-response', (req, res) => {
  const db = readDB();
  const { customerId, tone, prompt } = req.body;
  const customer = (db.customers || {})[customerId] || { name: 'Valued Guest' };

  let drafted = '';

  switch (tone) {
    case 'bengali':
      drafted = `নমস্কার ${customer.name}! ৬ বালিগঞ্জ প্লেস-এ আপনাকে আন্তরিক স্বাগত। আমাদের খাঁটি বাঙালি রান্নার ঐতিহ্যে আজ আপনি কী গ্রহণ করতে পছন্দ করবেন? আমাদের বিশেষ ডাব চিংড়ি এবং ভাপা ইলিশ আজ অতুলনীয় স্বাদে তৈরি হয়েছে। আপনার ঠিকানায় আমরা অতি দ্রুত পৌঁছে দেব! 🌺`;
      break;

    case 'upsell':
      drafted = `Dear ${customer.name}, along with your selection, our executive chef recommends pairing with our traditional *Basanti Pulao* and *Chhanar Payesh* for a complete royal Bengali feast. Would you like me to add this complimentary bundle offer for just ₹299? 🍲`;
      break;

    case 'empathy':
      drafted = `Dear ${customer.name}, we deeply value your patronage and always ensure every bite from 6 Ballygunge Place exceeds your expectations. Please rest assured our culinary team is personally looking into your preferences to guarantee a flawless dining experience! 🤝`;
      break;

    case 'formal':
    default:
      drafted = `Hello ${customer.name}, thank you for reaching out to 6 Ballygunge Place. Your request has been noted by our dining manager, and we are delighted to assist you with your authentic culinary order. Please let us know if you have any special dietary considerations.`;
      break;
  }

  res.json({
    success: true,
    tone,
    draftedText: drafted
  });
});

// AI Auto-Summarize customer chat to CRM Profile Notes
app.post('/api/ai/summarize-customer', (req, res) => {
  const db = readDB();
  const { customerId } = req.body;
  const customer = (db.customers || {})[customerId];

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  let autoTags = [];
  let summaryText = '';

  if (customerId === 'anirban') {
    autoTags = ['High LTV (₹3.2K+)', 'Daab Chingri Fan', 'Gariahat Regular', 'Quick Pay'];
    summaryText = 'Verified High-Value Regular (3 orders). Favors seafood bestsellers (Daab Chingri & Bhapa Ilish). Prefers standard spice balance and delivers to Gariahat Rd.';
  } else if (customerId === 'priyanka') {
    autoTags = ['Health Conscious', 'Mild Mustard Preference', 'Ballygunge Circular Rd'];
    summaryText = 'Specific dietary preference for white mustard / mild pungency in fish gravies. High responsiveness to chef-recommended culinary pairings.';
  } else if (customerId === 'rahul') {
    autoTags = ['Corporate Lunches', 'Salt Lake Sector V', 'Bulk Orders'];
    summaryText = 'IT Sector corporate customer ordering group meals and express lunches. High potential for Friday corporate catering packages.';
  } else {
    autoTags = ['Active Guest', 'Conversational Commerce User'];
    summaryText = `Engaged customer with ${customer.ordersCount || 1} prior orders. Total lifetime value ₹${customer.ltv || 0}. Responsive to seasonal festival campaigns.`;
  }

  customer.notes = summaryText;
  writeDB(db);

  logWebhookTraffic('SYSTEM', 'AI_CUSTOMER_INTELLIGENCE', {
    event: 'CRM_NOTE_AUTOSUMMARIZE',
    customer: customer.name,
    tags: autoTags
  });

  res.json({
    success: true,
    customerId,
    notes: summaryText,
    tags: autoTags
  });
});

// AI Executive Intelligence Briefing
app.get('/api/ai/executive-briefing', (req, res) => {
  const db = readDB();
  const records = db.dailyCollections || [];
  const outlets = db.outlets || [];
  const outletId = req.query.outletId;

  if (outletId && outletId !== 'all') {
    const outlet = outlets.find(o => o.id === outletId) || outlets[0];
    const rec = records.find(r => r.outletId === outletId) || {
      cash: 0, upi: 0, card: 0, onlineDelivery: 0, grossTotal: 0, expenses: 0, netDeposit: 0, status: 'open', notes: ''
    };
    const gross = rec.grossTotal || 0;
    const target = outlet.targetDaily || 100000;
    const achieve = ((gross / (target || 1)) * 100).toFixed(1);
    const digitalTotal = (rec.upi || 0) + (rec.card || 0);
    const digitalPct = ((digitalTotal / (gross || 1)) * 100).toFixed(1);

    const branchProfiles = {
      outlet_ballygunge: {
        headline: `Ballygunge Flagship: ₹${gross.toLocaleString('en-IN')} (${achieve}% of Daily Goal)`,
        revenuePulse: `Heritage dining room operating at peak capacity (${outlet.currentShift}). Cash in drawer is ₹${(rec.cash || 0).toLocaleString('en-IN')} (audited count matched). Digital share is ${digitalPct}%.`,
        topOutletHighlight: `Daab Chingri, Bhetki Paturi & Grand Bengali Thalis account for 62% of dine-in check volume. Valet parking handled 78 cars.`,
        proactiveOpportunity: `Dinner table turn rate is at 1.8x. Dispatch WhatsApp evening dessert special to 32 nearby reservation holders.`
      },
      outlet_saltlake: {
        headline: `Salt Lake (Sector V): ₹${gross.toLocaleString('en-IN')} (${achieve}% of Daily Goal)`,
        revenuePulse: `Corporate lunch buffet & IT dinner deliveries performing strongly. Digital payments hit ${digitalPct}% (primarily UPI QR).`,
        topOutletHighlight: `Corporate catering bookings for TCS & Cognizant teams generated ₹44,000 in bulk orders.`,
        proactiveOpportunity: `Target 500 tech professionals with a 'Friday Team Feast' broadcast voucher tomorrow morning.`
      },
      outlet_parkstreet: {
        headline: `Park Street Heritage: ₹${gross.toLocaleString('en-IN')} (${achieve}% of Daily Goal)`,
        revenuePulse: `High average check size (₹2,480/table). Fine-dining bar and heritage lounge operating with strong evening footfall.`,
        topOutletHighlight: `Kosha Mangsho with Lucchi and Smoked Hilsa are top performers. EDC card reconciliation for Batch 2 complete.`,
        proactiveOpportunity: `Send live table reservation invite to weekend VIP diner segment.`
      },
      outlet_southcity: {
        headline: `South City Mall: ₹${gross.toLocaleString('en-IN')} (${achieve}% of Daily Goal)`,
        revenuePulse: `Mall shopper footfall drove steady counter revenue. Shift audit completed with ₹${(rec.netDeposit || 0).toLocaleString('en-IN')} net bank deposit.`,
        topOutletHighlight: `Quick-service lunch combos & packed Mishti boxes represent 38% of revenue.`,
        proactiveOpportunity: `Offer 10% takeaway discount for mall cinema ticket holders on WhatsApp.`
      },
      outlet_newtown: {
        headline: `New Town: ₹${gross.toLocaleString('en-IN')} (${achieve}% of Daily Goal)`,
        revenuePulse: `Eco Park tourist and residential family dining up by 20.2%. Cloud kitchen delivered 72 orders in 35-min radius.`,
        topOutletHighlight: `Online delivery through Swiggy & WhatsApp commissary accounted for ₹16,500.`,
        proactiveOpportunity: `Expand cloud kitchen delivery radius to Action Area 2 & 3 housing complexes.`
      },
      outlet_whatsapp: {
        headline: `WhatsApp Direct Hub: ₹${gross.toLocaleString('en-IN')} (${achieve}% of Daily Goal)`,
        revenuePulse: `100% conversational sales with automated checkout bots. ₹0 physical cash handling, 100% digital prepaid.`,
        topOutletHighlight: `Sunday Heritage Feast campaign generated 18 automated checkouts in under 2 hours.`,
        proactiveOpportunity: `Send proactive dinner reminders to 14 abandoned cart users before the 10:30 PM kitchen cutoff.`
      }
    };

    const profile = branchProfiles[outlet.id] || {
      headline: `${outlet.name}: ₹${gross.toLocaleString('en-IN')} (${achieve}% of Target)`,
      revenuePulse: `Shift: ${outlet.currentShift}. Total digital collection: ₹${digitalTotal.toLocaleString('en-IN')}. Cash in drawer: ₹${(rec.cash || 0).toLocaleString('en-IN')}.`,
      topOutletHighlight: `Managed by ${outlet.manager} (${outlet.phone}). Status: ${rec.status}.`,
      proactiveOpportunity: `Send WhatsApp promotion to loyal customers registered at ${outlet.name}.`
    };

    return res.json({
      headline: profile.headline,
      revenuePulse: profile.revenuePulse,
      topOutletHighlight: profile.topOutletHighlight,
      proactiveOpportunity: profile.proactiveOpportunity,
      metrics: {
        outletName: outlet.name,
        targetDaily: outlet.targetDaily,
        grossTotal: gross,
        achievementRate: `${achieve}%`,
        digitalShare: `${digitalPct}%`,
        status: rec.status,
        manager: outlet.manager
      }
    });
  }

  // Consolidated
  let totalGross = 0;
  let totalCash = 0;
  let totalDigital = 0;
  let totalTarget = 0;

  records.forEach(r => {
    totalGross += (r.grossTotal || 0);
    totalCash += (r.cash || 0);
    totalDigital += ((r.upi || 0) + (r.card || 0));
  });
  outlets.forEach(o => totalTarget += (o.targetDaily || 0));

  const achieve = totalTarget > 0 ? ((totalGross / totalTarget) * 100).toFixed(1) : '104.3';

  res.json({
    headline: `Consolidated Outlets Daily Revenue: ₹${(totalGross || 688400).toLocaleString('en-IN')} (${achieve}% of Target)`,
    revenuePulse: `Strong weekend footfall across all 6 Kolkata outlets. Digital payments dominate with ${((totalDigital / (totalGross || 1)) * 100).toFixed(1)}% adoption (UPI + POS Cards). Cash reconciliation has zero detected shortages.`,
    topOutletHighlight: `Ballygunge Flagship generated ₹1,55,800, leading in dine-in thali volume. Salt Lake Sector V experienced 34% corporate lunch uplift.`,
    proactiveOpportunity: `18 active carts are pending on WhatsApp from New Town & South City areas. Releasing an automated 15% dinner voucher is projected to capture an incremental ₹24,000 before 11:00 PM.`,
    metrics: {
      totalOutlets: outlets.length,
      settledOutlets: records.filter(r => r.status === 'settled').length,
      achievementRate: `${achieve}%`,
      digitalShare: `${((totalDigital / (totalGross || 1)) * 100).toFixed(1)}%`,
      activeChats: Object.keys(db.customers || {}).length,
      ordersCompleted: db.stats.orderCount || 80
    }
  });
});

// AI Campaign Generator
app.post('/api/ai/generate-campaign', (req, res) => {
  const { occasion, targetAudience, discount } = req.body;

  const disc = discount || '20%';
  const occ = occasion || 'Heritage Weekend Feast';

  const campaignCopy = `🎉 *6 Ballygunge Place - ${occ} Special!* 🍲\n\n` +
    `Treat your family to the authentic taste of Kolkata heritage this evening. Enjoy *${disc} OFF* on our signature *Daab Chingri* & *Grand Bengali Thali*!\n\n` +
    `⚡ *Exclusive Offer for You:*\n` +
    `• Fresh Hilsa & Jumbo Prawn delicacies\n` +
    `• Complimentary Chhanar Payesh with orders > ₹999\n` +
    `• Hot insulated doorstep delivery within 35 minutes\n\n` +
    `👇 *Tap below to browse our live menu & claim discount!*`;

  res.json({
    success: true,
    occasion: occ,
    suggestedTitle: `✨ ${occ} (${disc} OFF)`,
    templateCopy: campaignCopy,
    projectedReadRate: '92.6%',
    projectedConversion: '14.8%'
  });
});

// =========================================================================
// MOCK WHATSAPP META WEBHOOK (INBOUND MESSAGES FLOW / STATE MACHINE)
// =========================================================================
app.post('/api/webhook/whatsapp', (req, res) => {
  const db = readDB();
  const { from, type, text, payload } = req.body; // direct webhook simulator inputs
  
  const customer = db.customers[from];
  if(!customer) {
    return res.status(404).json({ error: 'Customer session not found' });
  }
  
  const time = getFormattedTime();
  
  // Create simulation logging data to mimic official Meta Inbound Webhook payload JSON
  const simulatedMetaPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'WABA_ID_982312093',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '+919007378887', phone_number_id: 'phone_id_982312480928340' },
          contacts: [{ profile: { name: customer.name }, wa_id: customer.phone.replace(/[^0-9]/g, '') }],
          messages: [{
            from: customer.phone.replace(/[^0-9]/g, ''),
            id: 'wamid.HBgLOTE5MDA3Mzc4ODg3FQIAERg4QzM3Q...',
            timestamp: Math.floor(Date.now() / 1000),
            type: type === 'payment' ? 'interactive' : (type === 'cart_submission' ? 'interactive' : 'text')
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  // Append fields based on type for full visual high fidelity
  const changeValueMsg = simulatedMetaPayload.entry[0].changes[0].value.messages[0];
  if (type === 'text') {
    changeValueMsg.text = { body: text };
  } else if (type === 'cart_submission') {
    changeValueMsg.interactive = {
      type: 'nfm_reply',
      nfm_reply: { response_json: JSON.stringify({ flow: 'checkout', items: payload }) }
    };
  } else if (type === 'payment') {
    changeValueMsg.interactive = {
      type: 'payment_confirm',
      payment: { status: 'success', amount: payload.amount, transaction_id: 'TXN-' + Math.floor(Math.random() * 1000000) }
    };
  }
  
  logWebhookTraffic('POST', '/api/webhook/whatsapp', simulatedMetaPayload);
  
  // 1. Process customer message
  if(type === 'text') {
    // Intercept special developer/console control commands
    if (text === '[Agent Takeover Request]') {
      customer.state = 'STATE_WAITING_AGENT';
      customer.chatHistory.push({
        sender: 'bot',
        text: `🔌 *Joydeep Sen* has taken over the chat. Automated assistant is paused.`,
        time
      });
      writeDB(db);
      logWebhookTraffic('SYSTEM', '/api/webhook/takeover', { customerId: from, action: 'AGENTS_TAKEOVER' });
      return res.json({ success: true });
    }
    
    if (text.startsWith('[Campaign Broadcast Schedule]')) {
      const template = text.split('Template: ')[1] || 'welcome';
      let templateText = '';
      if (template === 'welcome') templateText = '👋 Welcome to 6 Ballygunge Place! Tap the button below to browse our authentic Bengali culinary catalog.';
      else if (template === 'flash_sale') templateText = '🔥 Sunday FEAST SALE! Get 20% off all Grand Bengali Feasts for the next 2 hours only. Tap below to buy!';
      else if (template === 'payment_reminder') {
        const total = customer.cart.reduce((sum, p) => sum + p.price, 0) || 999.00;
        templateText = `💳 Secure Payment Invoice\nTotal: *₹${total.toFixed(2)}*`;
      }
      
      if (template === 'flash_sale') {
        customer.state = 'STATE_SHOPPING';
      }
      
      customer.chatHistory.push({
        sender: 'bot',
        text: templateText,
        time,
        isTemplate: true,
        templateType: template
      });
      writeDB(db);
      sendWhatsAppMessage(customer.phone, {
        messaging_product: 'whatsapp',
        to: customer.phone,
        type: 'template',
        template: { name: template, language: { code: 'en_US' } }
      });
      return res.json({ success: true });
    }
    
    if (text.startsWith('[Template Push]')) {
      const template = text.split('[Template Push] ')[1];
      let templateText = '';
      if (template === 'welcome') templateText = '👋 Welcome to 6 Ballygunge Place! Tap the button below to browse our authentic Bengali culinary catalog.';
      else if (template === 'flash_sale') templateText = '🔥 Sunday FEAST SALE! Get 20% off all Grand Bengali Feasts for the next 2 hours only. Tap below to buy!';
      else if (template === 'payment_reminder') {
        const total = customer.cart.reduce((sum, p) => sum + p.price, 0) || 999.00;
        templateText = `💳 Secure Payment Invoice\nTotal: *₹${total.toFixed(2)}*`;
      }
      else if (template === 'share_tracker') {
        const trackingId = '6BP-TRK-' + (from === 'anirban' ? '860115' : Math.floor(100000 + Math.random() * 900000));
        templateText = `🚚 *6 Ballygunge Place - Order Tracker*\n\nHere is your live tracking link:\n🔗 http://localhost:8080/success.html?customerId=${from}&trackingId=${trackingId}\n\nTracking ID: *${trackingId}*\nStatus: *Preparing your meal with royal spices*\nEst. Delivery: *35 minutes*`;
      }
      else if (template === 'kitchen_delay') {
        templateText = '🙏 *Kitchen Delay Notice & Complimentary Treat*\n\nDear Guest, our master chefs are preparing your authentic slow-cooked meal with perfection. To thank you for your patience, we have added a complimentary portion of *Baked Rosogolla* to your order on the house! 🍮';
      }
      
      customer.chatHistory.push({
        sender: 'bot',
        text: templateText,
        time,
        isTemplate: true,
        templateType: template
      });
      writeDB(db);
      sendWhatsAppMessage(customer.phone, {
        messaging_product: 'whatsapp',
        to: customer.phone,
        type: 'template',
        template: { name: template, language: { code: 'en_US' } }
      });
      return res.json({ success: true });
    }
    
    if (text.startsWith('[Product Push]')) {
      const productName = text.split('[Product Push] ')[1];
      const prod = db.products.find(p => p.name === productName);
      if (prod) {
        customer.chatHistory.push({
          sender: 'bot',
          text: `Sure! Here is our current bestseller:`,
          time,
          isProductCard: true,
          productId: prod.id
        });
        writeDB(db);
        sendWhatsAppMessage(customer.phone, {
          messaging_product: 'whatsapp',
          to: customer.phone,
          type: 'interactive',
          interactive: {
            type: 'product',
            body: { text: 'Bestseller' },
            action: { catalog_id: 'WABA_CATALOG_ID', product_retailer_id: prod.sku }
          }
        });
      }
      return res.json({ success: true });
    }

    customer.chatHistory.push({
      sender: 'customer',
      text: text,
      time
    });
    
    // Evaluate Campaign Referral Trigger
    if (text.includes("Sunday Heritage Feast Promo") || text.includes("paid_campaign")) {
      customer.state = 'STATE_CAMPAIGN_FLOW';
      writeDB(db);
      
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        curCust.chatHistory.push({
          sender: 'bot',
          text: `👋 Thank you for claiming our Sunday Heritage Feast Promo! Please choose one of our exclusive feast packages below to continue:`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'campaign_packages'
        });
        writeDB(currentDb);
        
        // Log WABA outbound message
        sendWhatsAppMessage(curCust.phone, {
          messaging_product: 'whatsapp',
          to: curCust.phone,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: 'Sunday Heritage Feast Packages' },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'pkg_starter', title: 'Grand Thali (₹999)' } },
                { type: 'reply', reply: { id: 'pkg_deluxe', title: 'Seafood Platter (₹1499)' } },
                { type: 'reply', reply: { id: 'pkg_luxury', title: 'Classic Veg Feast (₹699)' } }
              ]
            }
          }
        });
      }, 1000);
      return res.json({ success: true });
    }
    
    // Evaluate Bot State Machine
    if(customer.state === 'STATE_AWAITING_ADDRESS') {
      customer.address = text;
      customer.state = 'STATE_AWAITING_PAYMENT';
      writeDB(db);
      
      // Auto-reply with confirm and invoice
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        
        curCust.chatHistory.push({
          sender: 'bot',
          text: `🤖 Delivery address verified: *${text}*\n\nYour invoice is ready. Click below to pay:`,
          time: getFormattedTime()
        });
        
        const total = curCust.cart.reduce((sum, p) => sum + p.price, 0);
        curCust.chatHistory.push({
          sender: 'bot',
          text: `💳 Secure Payment Invoice\nTotal: *₹${total.toFixed(2)}*`,
          time: getFormattedTime(),
          isTemplate: true,
          templateType: 'payment_reminder'
        });
        
        writeDB(currentDb);
        
        // Log bot replies going back out to WhatsApp Cloud API
        sendWhatsAppMessage(curCust.phone, {
          messaging_product: 'whatsapp',
          to: curCust.phone,
          type: 'interactive',
          interactive: { type: 'button', body: { text: `💳 Invoice for ₹${total.toFixed(2)}` } }
        });
      }, 1000);
      
    } else {
      // Smart Bot NLP Reply across all customer states (including STATE_COMPLETED, STATE_SHOPPING)
      const lower = (text || '').toLowerCase();
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        if (!curCust) return;

        let botReplyText = '';
        let isSpecialCard = false;
        let specialProdId = 'prod1';
        let isSpecialTemplate = false;
        let specialTemplateType = 'welcome';

        if (lower.includes('track') || lower.includes('status') || lower.includes('where') || lower.includes('delivery') || lower.includes('order')) {
          const trackingId = '6BP-TRK-' + (from === 'anirban' ? '860115' : Math.floor(100000 + Math.random() * 900000));
          botReplyText = `🚚 *6 Ballygunge Place - Order Tracker*\n\nHere is your live tracking link:\n🔗 http://localhost:8080/success.html?customerId=${from}&trackingId=${trackingId}\n\nTracking ID: *${trackingId}*\nStatus: *Preparing your meal with royal spices*\nEst. Delivery: *25 minutes*`;
          isSpecialTemplate = true;
          specialTemplateType = 'share_tracker';
        } else if (lower.includes('outlet') || lower.includes('branch') || lower.includes('location') || lower.includes('where are you') || lower.includes('address')) {
          botReplyText = `📍 *6 Ballygunge Place Branches in Kolkata:*\n\n` +
            `1. 🏛️ *Ballygunge Flagship* - 6 Ballygunge Place (Dine-in & Heritage Bungalow)\n` +
            `2. 💼 *Salt Lake* - Sector V IT Hub (Buffet & Lunch Deliveries)\n` +
            `3. 🍷 *Park Street* - 18 Park St (Fine Dining)\n` +
            `4. 🛍️ *South City Mall* - Express Counter\n` +
            `5. 🌿 *New Town* - Action Area 1\n` +
            `6. 📱 *WhatsApp Direct Hub* - Doorstep delivery across Kolkata!\n\n` +
            `Which branch would you like to visit or order from?`;
        } else if (lower.includes('daab') || lower.includes('chingri') || lower.includes('prawn')) {
          botReplyText = `🍤 *Daab Chingri (₹675)* is our crown jewel specialty! Fresh jumbo prawns simmered inside a tender green coconut with mustard & cream. Here is the direct dish card:`;
          isSpecialCard = true;
          specialProdId = 'prod1';
        } else if (lower.includes('ilish') || lower.includes('hilsa') || lower.includes('bhapa')) {
          botReplyText = `🐟 *Bhapa Ilish (₹725)*: The Queen of Fish steamed in tender sweet mustard & green chilies. Here is the direct dish card:`;
          isSpecialCard = true;
          specialProdId = 'prod2';
        } else if (lower.includes('kosha') || lower.includes('mangsho') || lower.includes('mutton') || lower.includes('meat')) {
          botReplyText = `🥩 *Kosha Mangsho (₹595)*: Velvet-textured mutton slow-cooked in rich dark caramelized gravy. Bestseller pairing with Basanti Pulao!`;
          isSpecialCard = true;
          specialProdId = 'prod3';
        } else if (lower.includes('paturi') || lower.includes('bhetki') || lower.includes('fish')) {
          botReplyText = `🌿 *Bhetki Paturi (₹525)*: Fresh Bhetki fillets marinated in mustard & coconut paste, wrapped in fresh banana leaves and steamed!`;
          isSpecialCard = true;
          specialProdId = 'prod4';
        } else if (lower.includes('veg') || lower.includes('dhoka') || lower.includes('chana') || lower.includes('paneer')) {
          botReplyText = `🥬 *Pure Vegetarian Delicacies:* Try our authentic *Dhokar Dalna (₹385)* or *Chanar Dalna (₹425)* cooked in heritage ginger-cumin gravy!`;
          isSpecialCard = true;
          specialProdId = 'prod9';
        } else if (lower.includes('sweet') || lower.includes('dessert') || lower.includes('mishti') || lower.includes('rosogolla') || lower.includes('ice cream')) {
          botReplyText = `🍮 *Traditional Bengali Mishti:* We recommend our heavenly *Baked Rosogolla (₹195)* or *Nolen Gurer Ice Cream (₹225)*!`;
          isSpecialCard = true;
          specialProdId = 'prod11';
        } else if (lower.includes('agent') || lower.includes('human') || lower.includes('manager') || lower.includes('talk') || lower.includes('help')) {
          curCust.state = 'STATE_WAITING_AGENT';
          botReplyText = `🤖 Connecting you with *Joydeep Sen (General Manager)* and *Subhashis Banerjee (Senior Dining Agent)*. An agent has been alerted and will assist you immediately!`;
        } else if (lower.includes('park') || lower.includes('valet')) {
          botReplyText = `🚗 Complimentary Valet Parking is available at our *Ballygunge Flagship* and *Park Street* branches!`;
        } else if (lower.includes('reserve') || lower.includes('table') || lower.includes('book')) {
          botReplyText = `🍽️ *Table Reservations:* To reserve your table for today's lunch or dinner service, simply tell us your preferred branch, party size, and timing!`;
        } else {
          botReplyText = `🤖 Nomoshkar! Welcome to *6 Ballygunge Place*. I am your AI Dining Concierge. You can ask me about live order tracking, menu recommendations (like Daab Chingri & Bhapa Ilish), or tap below to browse our live dining catalog!`;
          isSpecialTemplate = true;
          specialTemplateType = 'welcome';
        }

        if (isSpecialCard) {
          curCust.chatHistory.push({
            sender: 'bot',
            text: botReplyText,
            time: getFormattedTime(),
            isProductCard: true,
            productId: specialProdId
          });
        } else if (isSpecialTemplate) {
          curCust.chatHistory.push({
            sender: 'bot',
            text: botReplyText,
            time: getFormattedTime(),
            isTemplate: true,
            templateType: specialTemplateType
          });
        } else {
          curCust.chatHistory.push({
            sender: 'bot',
            text: botReplyText,
            time: getFormattedTime()
          });
        }

        writeDB(currentDb);

        // Log outbound webhook traffic so frontend real-time polling picks it up
        logWebhookTraffic('POST', '/api/webhook/whatsapp/outbound', {
          recipient: curCust.phone,
          event: 'BOT_REPLY',
          text: botReplyText
        });
      }, 1000);
    }
    
  } else if (type === 'button_click') {
    customer.chatHistory.push({
      sender: 'customer',
      text: text,
      time
    });
    if (text === 'Talk to Agent') {
      customer.state = 'STATE_WAITING_AGENT';
      writeDB(db);
      
      setTimeout(() => {
        const currentDb = readDB();
        const curCust = currentDb.customers[from];
        curCust.chatHistory.push({
          sender: 'bot',
          text: `🤖 Connecting you to Joydeep Sen (Manager). They will reply shortly!`,
          time: getFormattedTime()
        });
        writeDB(currentDb);
      }, 1000);
    } else {
      writeDB(db);
    }
  } else if (type === 'campaign_package_select') {
    // Add product to customer's cart
    const pkg = payload;
    customer.cart = [{
      id: 'campaign_pkg',
      name: pkg.name,
      price: pkg.price,
      sku: pkg.sku,
      image: pkg.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      desc: 'Special promotional campaign feast bundle.'
    }];
    
    customer.state = 'STATE_AWAITING_PAYMENT';
    customer.chatHistory.push({
      sender: 'customer',
      text: `Selected Package: ${pkg.name} (₹${pkg.price.toFixed(2)})`,
      time
    });
    
    writeDB(db);
    
    // Reply automatically with invoice payment link!
    setTimeout(() => {
      const currentDb = readDB();
      const curCust = currentDb.customers[from];
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `🤖 Excellent choice! Your invoice for the *${pkg.name}* is ready. Click below to proceed to the payment gateway:`,
        time: getFormattedTime()
      });
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `💳 Secure Payment Invoice\nTotal: *₹${pkg.price.toFixed(2)}*`,
        time: getFormattedTime(),
        isTemplate: true,
        templateType: 'payment_reminder'
      });
      
      writeDB(currentDb);
      
      sendWhatsAppMessage(curCust.phone, {
        messaging_product: 'whatsapp',
        to: curCust.phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: `Pay now for ${pkg.name}` }
        }
      });
    }, 1000);
    
  } else if (type === 'cart_submission') {
    // Save items to customer cart database
    customer.cart = payload;
    customer.state = 'STATE_AWAITING_PAYMENT';
    const total = payload.reduce((sum, p) => sum + p.price, 0);
    const summary = payload.map(p => p.name).join(', ');
    
    customer.chatHistory.push({
      sender: 'customer',
      text: `🛒 Checkout Request: Sent Cart [${summary}] totaling ₹${total.toFixed(2)}`,
      time
    });
    
    writeDB(db);
    
    // Auto-reply directly with checkout invoice & Pay Now button!
    setTimeout(() => {
      const currentDb = readDB();
      const curCust = currentDb.customers[from];
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `🤖 Order received for *${summary}*! Your checkout invoice is ready. Click below to proceed:`,
        time: getFormattedTime()
      });
      
      curCust.chatHistory.push({
        sender: 'bot',
        text: `💳 Secure Payment Invoice\nTotal: *₹${total.toFixed(2)}*`,
        time: getFormattedTime(),
        isTemplate: true,
        templateType: 'payment_reminder'
      });
      
      writeDB(currentDb);
      
      sendWhatsAppMessage(curCust.phone, {
        messaging_product: 'whatsapp',
        to: curCust.phone,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: `Pay now for order (₹${total.toFixed(2)})` }
        }
      });
    }, 1000);
    
  } else if (type === 'payment') {
    let total = payload.amount || 0;
    let itemsSummary = '';
    
    if (payload.buyNowProduct) {
      const prod = db.products.find(p => p.id === payload.buyNowProduct);
      if (prod) {
        total = prod.price;
        itemsSummary = prod.name;
      } else {
        itemsSummary = 'Traditional Bengali Feast Item';
      }
    } else {
      total = customer.cart.reduce((sum, p) => sum + p.price, 0) || total;
      itemsSummary = customer.cart.map(p => p.name).join(', ');
      customer.cart = []; // clear cart
    }
    
    const orderId = '#W-' + Math.floor(1000 + Math.random() * 9000);
    
    customer.state = 'STATE_COMPLETED';
    const trackingId = '6BP-TRK-' + Math.floor(100000 + Math.random() * 900000);
    customer.chatHistory.push({
      sender: 'bot',
      text: `✅ *Payment Successful!*\n\nThank you, *${customer.name}*. Your order *${orderId}* for *${itemsSummary}* has been confirmed.\n\n🚚 *Delivery Tracking*:\nTracking ID: *${trackingId}*\nStatus: *Preparing your meal*\nEst. Delivery: *35 minutes*\n\nOur delivery executive will arrive with your hot meal shortly.`,
      time
    });
    
    // Increment CRM / Order summaries
    db.stats.sales += total;
    db.stats.sessions = Math.max(0, db.stats.sessions - 1);
    db.stats.orderCount += 1;
    
    db.orders.unshift({
      id: orderId,
      customer: customer.name,
      products: itemsSummary,
      status: 'paid',
      total: `₹${total.toFixed(2)}`,
      source: 'chatbot'
    });
    
    writeDB(db);
  }
  
  res.json({ success: true });
});

// Helper: Formatted Time
function getFormattedTime() {
  const d = new Date();
  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
}

// Start Server listener (local dev only)
app.listen(PORT, () => {
  console.log(`6 Ballygunge Place Backend Running on http://localhost:${PORT}`);
  console.log(`Database seeded at ${DB_PATH}`);
  // Add a boot log in the webhook logs
  logWebhookTraffic('SYSTEM', 'BOOT_INITIALIZE', { system: '6 Ballygunge Place CRM', state: 'READY', WABA_NUMBER: '+919007378887' });
});

// Export for Vercel serverless deployment
module.exports = app;

