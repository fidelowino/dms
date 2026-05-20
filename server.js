// ═══════════════════════════════════════════════════════════════
//  DAWAMU SCHOOL MANAGEMENT SYSTEM — SERVER v2.0
//  Express + better-sqlite3 + ws + nodemailer
// ═══════════════════════════════════════════════════════════════
require('dotenv').config();
const express  = require('express');
const Database = require('better-sqlite3');
const http     = require('http');
const { WebSocketServer } = require('ws');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });
const db     = new Database(path.join(__dirname, 'database.db'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── EMAIL TRANSPORTER ────────────────────────────────────────
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'fidelowino8@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  }
});

// ══════════════════════════════════════════════════════════════
//  SCHEMA
// ══════════════════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    role       TEXT UNIQUE NOT NULL,
    title      TEXT NOT NULL,
    password   TEXT NOT NULL,
    email      TEXT DEFAULT '',
    active     INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otp_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── REQUISITIONS (all sections) ──
  CREATE TABLE IF NOT EXISTS requisitions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ref         TEXT UNIQUE NOT NULL,
    from_role   TEXT NOT NULL,
    category    TEXT DEFAULT 'general',
    item        TEXT NOT NULL,
    quantity    TEXT NOT NULL,
    unit        TEXT DEFAULT '',
    unit_cost   REAL DEFAULT 0,
    urgency     TEXT DEFAULT 'normal',
    purpose     TEXT DEFAULT '',
    notes       TEXT DEFAULT '',
    status      TEXT DEFAULT 'pending',
    admin_note  TEXT DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── FARM INPUTS (store) ──
  CREATE TABLE IF NOT EXISTS farm_inputs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    ref              TEXT UNIQUE NOT NULL,
    item_name        TEXT NOT NULL,
    unit             TEXT DEFAULT '',
    quantity         REAL DEFAULT 0,
    remaining        REAL DEFAULT 0,
    unit_cost        REAL DEFAULT 0,
    supplier         TEXT DEFAULT '',
    delivery_date    TEXT DEFAULT '',
    batch_number     TEXT DEFAULT '',
    expiry_date      TEXT DEFAULT '',
    condition        TEXT DEFAULT 'good',
    storage_location TEXT DEFAULT '',
    date_issued      TEXT DEFAULT '',
    reorder_level    REAL DEFAULT 0,
    received_by      TEXT DEFAULT '',
    notes            TEXT DEFAULT '',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── FARM OUTPUTS ──
  CREATE TABLE IF NOT EXISTS farm_outputs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    ref              TEXT UNIQUE NOT NULL,
    product_name     TEXT NOT NULL,
    category         TEXT DEFAULT '',
    date_harvested   TEXT DEFAULT '',
    total_produced   REAL DEFAULT 0,
    unit             TEXT DEFAULT '',
    destination      TEXT DEFAULT 'catering',
    quantity_delivered REAL DEFAULT 0,
    date_delivered   TEXT DEFAULT '',
    remaining        REAL DEFAULT 0,
    unit_cost        REAL DEFAULT 0,
    total_value      REAL DEFAULT 0,
    notes            TEXT DEFAULT '',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── FARM WORKERS ──
  CREATE TABLE IF NOT EXISTS farm_workers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    role       TEXT DEFAULT '',
    attendance TEXT DEFAULT 'present',
    notes      TEXT DEFAULT '',
    date       TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── FARM EQUIPMENT ──
  CREATE TABLE IF NOT EXISTS farm_equipment (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    condition       TEXT DEFAULT 'good',
    assigned_to     TEXT DEFAULT '',
    last_serviced   TEXT DEFAULT '',
    next_service    TEXT DEFAULT '',
    notes           TEXT DEFAULT '',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── FARM-TO-CATERING REQUESTS ──
  CREATE TABLE IF NOT EXISTS farm_requests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    ref          TEXT UNIQUE NOT NULL,
    requested_by TEXT NOT NULL,
    produce      TEXT NOT NULL,
    quantity     REAL DEFAULT 0,
    unit         TEXT DEFAULT '',
    needed_by    TEXT DEFAULT '',
    notes        TEXT DEFAULT '',
    status       TEXT DEFAULT 'pending',
    admin_note   TEXT DEFAULT '',
    farm_note    TEXT DEFAULT '',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── CATERING STORE ──
  CREATE TABLE IF NOT EXISTS catering_store (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    ref              TEXT UNIQUE NOT NULL,
    item_name        TEXT NOT NULL,
    unit             TEXT DEFAULT '',
    quantity         REAL DEFAULT 0,
    remaining        REAL DEFAULT 0,
    unit_cost        REAL DEFAULT 0,
    delivery_date    TEXT DEFAULT '',
    expiry_date      TEXT DEFAULT '',
    storage_location TEXT DEFAULT '',
    supplier         TEXT DEFAULT '',
    received_by      TEXT DEFAULT '',
    reorder_level    REAL DEFAULT 0,
    notes            TEXT DEFAULT '',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── CATERING USAGE ──
  CREATE TABLE IF NOT EXISTS catering_usage (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name   TEXT NOT NULL,
    quantity    REAL DEFAULT 0,
    unit        TEXT DEFAULT '',
    date_used   TEXT DEFAULT '',
    meal        TEXT DEFAULT '',
    used_by     TEXT DEFAULT '',
    notes       TEXT DEFAULT '',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── MEAL TIMETABLE ──
  CREATE TABLE IF NOT EXISTS meal_timetable (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_type     TEXT NOT NULL,
    date          TEXT NOT NULL,
    menu_items    TEXT DEFAULT '',
    portion_size  TEXT DEFAULT '',
    dietary_notes TEXT DEFAULT '',
    number_served INTEGER DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── OUTGOING GROUP CATERING ──
  CREATE TABLE IF NOT EXISTS group_catering (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ref             TEXT UNIQUE NOT NULL,
    group_name      TEXT NOT NULL,
    num_people      INTEGER DEFAULT 0,
    date            TEXT DEFAULT '',
    destination     TEXT DEFAULT '',
    meal_instruction TEXT DEFAULT '',
    equipment_notes TEXT DEFAULT '',
    meal_prepared   TEXT DEFAULT '',
    qty_prepared    TEXT DEFAULT '',
    equipment_given TEXT DEFAULT '',
    dispatched_by   TEXT DEFAULT '',
    status          TEXT DEFAULT 'pending',
    expected_return TEXT DEFAULT '',
    qty_returned    TEXT DEFAULT '',
    missing_items   TEXT DEFAULT '',
    admin_note      TEXT DEFAULT '',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── TRANSPORT VEHICLES ──
  CREATE TABLE IF NOT EXISTS vehicles (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    plate                TEXT UNIQUE NOT NULL,
    name                 TEXT DEFAULT '',
    type                 TEXT DEFAULT 'bus',
    condition            TEXT DEFAULT 'ready',
    assigned_driver      TEXT DEFAULT '',
    insurance_expiry     TEXT DEFAULT '',
    roadworthy_expiry    TEXT DEFAULT '',
    registration_expiry  TEXT DEFAULT '',
    notes                TEXT DEFAULT '',
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── TRIPS ──
  CREATE TABLE IF NOT EXISTS trips (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ref           TEXT UNIQUE NOT NULL,
    requested_by  TEXT NOT NULL,
    purpose       TEXT NOT NULL,
    destination   TEXT NOT NULL,
    date          TEXT NOT NULL,
    departure     TEXT DEFAULT '',
    return_time   TEXT DEFAULT '',
    passengers    INTEGER DEFAULT 0,
    vehicle       TEXT DEFAULT '',
    driver        TEXT DEFAULT '',
    mileage_before REAL DEFAULT 0,
    mileage_after  REAL DEFAULT 0,
    fuel_used      REAL DEFAULT 0,
    incidents      TEXT DEFAULT '',
    catering_req   INTEGER DEFAULT 0,
    meal_notes     TEXT DEFAULT '',
    status         TEXT DEFAULT 'pending',
    admin_note     TEXT DEFAULT '',
    cancel_reason  TEXT DEFAULT '',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── FUEL LOG ──
  CREATE TABLE IF NOT EXISTS fuel_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ref        TEXT UNIQUE NOT NULL,
    vehicle    TEXT NOT NULL,
    litres     REAL DEFAULT 0,
    cost_litre REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    date       TEXT DEFAULT '',
    supplier   TEXT DEFAULT '',
    notes      TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── HOUSEKEEPING STORE ──
  CREATE TABLE IF NOT EXISTS hk_store (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    ref              TEXT UNIQUE NOT NULL,
    item_name        TEXT NOT NULL,
    unit             TEXT DEFAULT '',
    quantity         REAL DEFAULT 0,
    remaining        REAL DEFAULT 0,
    unit_cost        REAL DEFAULT 0,
    delivery_date    TEXT DEFAULT '',
    expiry_date      TEXT DEFAULT '',
    storage_location TEXT DEFAULT '',
    supplier         TEXT DEFAULT '',
    received_by      TEXT DEFAULT '',
    reorder_level    REAL DEFAULT 0,
    notes            TEXT DEFAULT '',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── HOUSEKEEPING USAGE ──
  CREATE TABLE IF NOT EXISTS hk_usage (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name  TEXT NOT NULL,
    quantity   REAL DEFAULT 0,
    unit       TEXT DEFAULT '',
    date_used  TEXT DEFAULT '',
    used_by    TEXT DEFAULT '',
    area       TEXT DEFAULT '',
    notes      TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── HOUSEKEEPING SCHEDULE ──
  CREATE TABLE IF NOT EXISTS hk_schedule (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    area         TEXT NOT NULL,
    assigned_to  TEXT DEFAULT '',
    frequency    TEXT DEFAULT 'daily',
    time_of_day  TEXT DEFAULT '',
    status       TEXT DEFAULT 'pending',
    supervisor   TEXT DEFAULT '',
    date         TEXT DEFAULT '',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── DAMAGE REPORTS (housekeeping → maintenance) ──
  CREATE TABLE IF NOT EXISTS damage_reports (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    ref          TEXT UNIQUE NOT NULL,
    area         TEXT NOT NULL,
    description  TEXT NOT NULL,
    reported_by  TEXT NOT NULL,
    date_reported TEXT DEFAULT '',
    status       TEXT DEFAULT 'forwarded',
    admin_note   TEXT DEFAULT '',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── MAINTENANCE STORE ──
  CREATE TABLE IF NOT EXISTS maint_store (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    ref              TEXT UNIQUE NOT NULL,
    item_name        TEXT NOT NULL,
    unit             TEXT DEFAULT '',
    quantity         REAL DEFAULT 0,
    remaining        REAL DEFAULT 0,
    unit_cost        REAL DEFAULT 0,
    delivery_date    TEXT DEFAULT '',
    expiry_date      TEXT DEFAULT '',
    storage_location TEXT DEFAULT '',
    supplier         TEXT DEFAULT '',
    received_by      TEXT DEFAULT '',
    reorder_level    REAL DEFAULT 0,
    notes            TEXT DEFAULT '',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── MAINTENANCE JOBS ──
  CREATE TABLE IF NOT EXISTS maintenance_jobs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ref            TEXT UNIQUE NOT NULL,
    reported_by    TEXT NOT NULL,
    location       TEXT NOT NULL,
    category       TEXT DEFAULT 'general',
    description    TEXT NOT NULL,
    assigned_worker TEXT DEFAULT '',
    priority       TEXT DEFAULT 'normal',
    status         TEXT DEFAULT 'pending',
    date_completed TEXT DEFAULT '',
    materials_used TEXT DEFAULT '',
    admin_note     TEXT DEFAULT '',
    resolved_note  TEXT DEFAULT '',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── MAINTENANCE WORKERS ──
  CREATE TABLE IF NOT EXISTS maint_workers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    specialization TEXT DEFAULT '',
    attendance   TEXT DEFAULT 'present',
    tasks_today  TEXT DEFAULT '',
    date         TEXT DEFAULT '',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── ANNOUNCEMENTS ──
  CREATE TABLE IF NOT EXISTS announcements (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    from_role  TEXT NOT NULL,
    to_roles   TEXT DEFAULT 'all',
    subject    TEXT NOT NULL,
    message    TEXT NOT NULL,
    priority   TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── ACTIVITY LOG ──
  CREATE TABLE IF NOT EXISTS activity_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    role       TEXT NOT NULL,
    action     TEXT NOT NULL,
    details    TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- ── SEED USERS ──
  INSERT OR IGNORE INTO users (role,title,password,email) VALUES
    ('admin',        'Administrator',     'admin123', 'fidelowino8@gmail.com'),
    ('catering',     'Catering Manager',  'cater123', ''),
    ('farm',         'Farm Manager',      'farm123',  ''),
    ('transport',    'Transport Manager', 'trans123', ''),
    ('housekeeping', 'Housekeeping Lead', 'house123', ''),
    ('maintenance',  'Maintenance Lead',  'maint123', '');
`);

// ══════════════════════════════════════════════════════════════
//  WEBSOCKET
// ══════════════════════════════════════════════════════════════
const clients = new Map(); // role -> Set of ws

wss.on('connection', (ws, req) => {
  ws.role = null;
  ws.send(JSON.stringify({ event: 'connected' }));
  ws.on('message', msg => {
    try {
      const { event, role } = JSON.parse(msg);
      if (event === 'register' && role) {
        ws.role = role;
        if (!clients.has(role)) clients.set(role, new Set());
        clients.get(role).add(ws);
      }
    } catch(e) {}
  });
  ws.on('close', () => {
    if (ws.role && clients.has(ws.role)) {
      clients.get(ws.role).delete(ws);
    }
  });
});

// Send to specific roles only
function sendTo(roles, event, data) {
  const msg = JSON.stringify({ event, data, ts: Date.now() });
  const targets = roles === 'all'
    ? [...clients.values()].flatMap(s => [...s])
    : roles.split(',').flatMap(r => [...(clients.get(r.trim()) || [])]);
  targets.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

function logActivity(role, action, details = '') {
  db.prepare('INSERT INTO activity_log (role,action,details) VALUES (?,?,?)').run(role, action, details);
  // send activity only to the role that did it + admin
  sendTo(`${role},admin`, 'activity', { role, action, details, ts: new Date().toISOString() });
}

function genRef(prefix) {
  return prefix.toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
}

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════
app.post('/api/login', (req, res) => {
  const { role, password } = req.body;
  if (!role || !password) return res.status(400).json({ error: 'Role and password required.' });
  const user = db.prepare('SELECT id,role,title FROM users WHERE role=? AND password=? AND active=1').get(role, password);
  if (!user) return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  logActivity(role, 'login', `${user.title} logged in`);
  res.json({ success: true, user });
});

// Admin changes any user password
app.post('/api/admin/change-password', (req, res) => {
  const { admin_password, target_role, new_password } = req.body;
  if (!admin_password || !target_role || !new_password) return res.status(400).json({ error: 'All fields required.' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Min 6 characters.' });
  const admin = db.prepare("SELECT id FROM users WHERE role='admin' AND password=?").get(admin_password);
  if (!admin) return res.status(401).json({ error: 'Admin password incorrect.' });
  db.prepare('UPDATE users SET password=? WHERE role=?').run(new_password, target_role);
  logActivity('admin', 'password_changed', `Password updated for ${target_role}`);
  res.json({ success: true });
});

// Admin forgot password — sends OTP to email
app.post('/api/admin/forgot-password', async (req, res) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 900000).toISOString(); // 15 min
  db.prepare('INSERT INTO otp_codes (code,expires_at) VALUES (?,?)').run(code, expires);

  const adminEmail = process.env.GMAIL_USER || 'fidelowino8@gmail.com';
  console.log(`\n🔑 OTP CODE: ${code} (also sending to ${adminEmail})\n`);

  try {
    await mailer.sendMail({
      from: `"Dawamu System" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: '🔐 Dawamu Admin Password Reset Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#0B2E0D;font-size:22px;margin-bottom:8px;">Dawamu School System</h2>
          <p style="color:#374151;font-size:15px;">Your admin password reset code is:</p>
          <div style="background:#0B2E0D;color:#fff;font-size:36px;font-weight:bold;letter-spacing:10px;text-align:center;padding:24px;border-radius:10px;margin:20px 0;">${code}</div>
          <p style="color:#6b7280;font-size:13px;">This code expires in <strong>15 minutes</strong>.<br>If you did not request this, ignore this email.</p>
        </div>`
    });
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch(e) {
    console.error('Email error:', e.message);
    res.json({ success: true, message: `Email failed — use console code: ${code}` });
  }
});

// Verify OTP and reset password
app.post('/api/admin/reset-password', (req, res) => {
  const { code, new_password } = req.body;
  if (!code || !new_password) return res.status(400).json({ error: 'Code and password required.' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Min 6 characters.' });
  const rec = db.prepare("SELECT * FROM otp_codes WHERE code=? AND used=0 AND expires_at > datetime('now')").get(code);
  if (!rec) return res.status(400).json({ error: 'Invalid or expired code.' });
  db.prepare("UPDATE users SET password=? WHERE role='admin'").run(new_password);
  db.prepare('UPDATE otp_codes SET used=1 WHERE id=?').run(rec.id);
  logActivity('admin', 'password_reset', 'Password reset via OTP');
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
//  STATS (role-filtered)
// ══════════════════════════════════════════════════════════════
app.get('/api/stats', (req, res) => {
  const { role } = req.query;
  const isAdmin = role === 'admin';
  const s = {
    pending_requisitions:  db.prepare(`SELECT COUNT(*) c FROM requisitions WHERE status='pending'${!isAdmin?` AND from_role='${role}'`:''}`).get().c,
    pending_farm_requests: (role==='admin'||role==='farm'||role==='catering') ? db.prepare(`SELECT COUNT(*) c FROM farm_requests WHERE status='pending'${role==='catering'?` AND requested_by='catering'`:''}`).get().c : 0,
    pending_trips:         (isAdmin||role==='transport') ? db.prepare(`SELECT COUNT(*) c FROM trips WHERE status='pending'`).get().c : 0,
    pending_maintenance:   (isAdmin||role==='maintenance') ? db.prepare(`SELECT COUNT(*) c FROM maintenance_jobs WHERE status='pending'`).get().c : 0,
    pending_housekeeping:  (isAdmin||role==='housekeeping') ? db.prepare(`SELECT COUNT(*) c FROM damage_reports WHERE status='forwarded'`).get().c : 0,
    low_stock_alerts:      0,
    announcements:         db.prepare(`SELECT * FROM announcements WHERE to_roles='all' OR to_roles LIKE ? ORDER BY created_at DESC LIMIT 5`).all(`%${role}%`),
    recent_activity:       db.prepare(`SELECT * FROM activity_log WHERE role=? OR role='admin' ORDER BY created_at DESC LIMIT 10`).all(role),
  };
  s.total_pending = s.pending_requisitions + s.pending_farm_requests + s.pending_trips + s.pending_maintenance + s.pending_housekeeping;
  res.json(s);
});

// ══════════════════════════════════════════════════════════════
//  REQUISITIONS
// ══════════════════════════════════════════════════════════════
app.get('/api/requisitions', (req, res) => {
  const { role, status } = req.query;
  let q = 'SELECT * FROM requisitions WHERE 1=1';
  const p = [];
  if (role !== 'admin') { q += ' AND from_role=?'; p.push(role); }
  if (status) { q += ' AND status=?'; p.push(status); }
  res.json(db.prepare(q + ' ORDER BY created_at DESC').all(...p));
});
app.post('/api/requisitions', (req, res) => {
  const { from_role, category, item, quantity, unit, unit_cost, urgency, purpose, notes } = req.body;
  if (!from_role || !item || !quantity) return res.status(400).json({ error: 'Missing required fields.' });
  const r = genRef('REQ');
  db.prepare('INSERT INTO requisitions (ref,from_role,category,item,quantity,unit,unit_cost,urgency,purpose,notes) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(r, from_role, category||'general', item, quantity, unit||'', unit_cost||0, urgency||'normal', purpose||'', notes||'');
  const rec = db.prepare('SELECT * FROM requisitions WHERE ref=?').get(r);
  logActivity(from_role, 'requisition_submitted', `${item} x${quantity}`);
  sendTo('admin', 'requisition_new', rec);
  sendTo(from_role, 'requisition_new', rec);
  res.json({ success: true, requisition: rec });
});
app.patch('/api/requisitions/:id', (req, res) => {
  const { status, admin_note } = req.body;
  db.prepare("UPDATE requisitions SET status=?,admin_note=?,updated_at=datetime('now') WHERE id=?").run(status, admin_note||'', req.params.id);
  const rec = db.prepare('SELECT * FROM requisitions WHERE id=?').get(req.params.id);
  logActivity('admin', `requisition_${status}`, `${rec?.item}`);
  sendTo(rec.from_role, 'requisition_updated', rec);
  sendTo('admin', 'requisition_updated', rec);
  res.json({ success: true, requisition: rec });
});
app.delete('/api/requisitions/:id', (req, res) => {
  const rec = db.prepare('SELECT * FROM requisitions WHERE id=?').get(req.params.id);
  db.prepare('DELETE FROM requisitions WHERE id=?').run(req.params.id);
  if (rec) sendTo(rec.from_role, 'requisition_deleted', { id: req.params.id });
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
//  FARM INPUTS (STORE)
// ══════════════════════════════════════════════════════════════
app.get('/api/farm/inputs', (req, res) => res.json(db.prepare('SELECT * FROM farm_inputs ORDER BY created_at DESC').all()));
app.post('/api/farm/inputs', (req, res) => {
  const f = req.body;
  const r = genRef('FIN');
  db.prepare('INSERT INTO farm_inputs (ref,item_name,unit,quantity,remaining,unit_cost,supplier,delivery_date,batch_number,expiry_date,condition,storage_location,reorder_level,received_by,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(r,f.item_name,f.unit||'',f.quantity||0,f.quantity||0,f.unit_cost||0,f.supplier||'',f.delivery_date||'',f.batch_number||'',f.expiry_date||'',f.condition||'good',f.storage_location||'',f.reorder_level||0,f.received_by||'',f.notes||'');
  const rec = db.prepare('SELECT * FROM farm_inputs WHERE ref=?').get(r);
  logActivity('farm','store_item_added',f.item_name);
  sendTo('farm,admin','farm_input_new',rec);
  res.json({ success:true, item:rec });
});
app.patch('/api/farm/inputs/:id', (req, res) => {
  const f = req.body;
  db.prepare('UPDATE farm_inputs SET remaining=?,date_issued=?,notes=? WHERE id=?').run(f.remaining,f.date_issued||'',f.notes||'',req.params.id);
  const rec = db.prepare('SELECT * FROM farm_inputs WHERE id=?').get(req.params.id);
  logActivity('farm','store_updated',rec?.item_name);
  sendTo('farm,admin','farm_input_updated',rec);
  res.json({ success:true, item:rec });
});

// ══════════════════════════════════════════════════════════════
//  FARM OUTPUTS
// ══════════════════════════════════════════════════════════════
app.get('/api/farm/outputs', (req, res) => res.json(db.prepare('SELECT * FROM farm_outputs ORDER BY created_at DESC').all()));
app.post('/api/farm/outputs', (req, res) => {
  const f = req.body;
  const r = genRef('FOUT');
  const tv = (f.total_produced||0) * (f.unit_cost||0);
  db.prepare('INSERT INTO farm_outputs (ref,product_name,category,date_harvested,total_produced,unit,destination,quantity_delivered,date_delivered,remaining,unit_cost,total_value,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(r,f.product_name,f.category||'',f.date_harvested||'',f.total_produced||0,f.unit||'',f.destination||'catering',f.quantity_delivered||0,f.date_delivered||'',(f.total_produced||0)-(f.quantity_delivered||0),f.unit_cost||0,tv,f.notes||'');
  const rec = db.prepare('SELECT * FROM farm_outputs WHERE ref=?').get(r);
  logActivity('farm','output_recorded',f.product_name);
  sendTo('farm,admin','farm_output_new',rec);
  res.json({ success:true, output:rec });
});

// ══════════════════════════════════════════════════════════════
//  FARM REQUESTS (farm-to-catering)
// ══════════════════════════════════════════════════════════════
app.get('/api/farm-requests', (req, res) => {
  const { role, status } = req.query;
  let q = 'SELECT * FROM farm_requests WHERE 1=1';
  const p = [];
  if (role === 'catering') { q += ' AND requested_by=?'; p.push('catering'); }
  if (status) { q += ' AND status=?'; p.push(status); }
  res.json(db.prepare(q + ' ORDER BY created_at DESC').all(...p));
});
app.post('/api/farm-requests', (req, res) => {
  const { requested_by, produce, quantity, unit, needed_by, notes } = req.body;
  if (!requested_by || !produce || !quantity) return res.status(400).json({ error: 'Missing fields.' });
  const r = genRef('FARM');
  db.prepare('INSERT INTO farm_requests (ref,requested_by,produce,quantity,unit,needed_by,notes) VALUES (?,?,?,?,?,?,?)').run(r,requested_by,produce,quantity,unit||'',needed_by||'',notes||'');
  const rec = db.prepare('SELECT * FROM farm_requests WHERE ref=?').get(r);
  logActivity(requested_by,'farm_request_submitted',`${produce} x${quantity}`);
  sendTo('admin','farm_request_new',rec);
  sendTo(requested_by,'farm_request_new',rec);
  res.json({ success:true, request:rec });
});
app.patch('/api/farm-requests/:id', (req, res) => {
  const { status, admin_note, farm_note } = req.body;
  db.prepare("UPDATE farm_requests SET status=?,admin_note=?,farm_note=?,updated_at=datetime('now') WHERE id=?").run(status,admin_note||'',farm_note||'',req.params.id);
  const rec = db.prepare('SELECT * FROM farm_requests WHERE id=?').get(req.params.id);
  logActivity('admin',`farm_request_${status}`,rec?.produce);
  sendTo(rec.requested_by,'farm_request_updated',rec);
  sendTo('farm,admin','farm_request_updated',rec);
  res.json({ success:true, request:rec });
});

// ══════════════════════════════════════════════════════════════
//  CATERING STORE
// ══════════════════════════════════════════════════════════════
app.get('/api/catering/store', (req, res) => res.json(db.prepare('SELECT * FROM catering_store ORDER BY created_at DESC').all()));
app.post('/api/catering/store', (req, res) => {
  const f = req.body;
  const r = genRef('CST');
  db.prepare('INSERT INTO catering_store (ref,item_name,unit,quantity,remaining,unit_cost,delivery_date,expiry_date,storage_location,supplier,received_by,reorder_level,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(r,f.item_name,f.unit||'',f.quantity||0,f.quantity||0,f.unit_cost||0,f.delivery_date||'',f.expiry_date||'',f.storage_location||'',f.supplier||'',f.received_by||'',f.reorder_level||0,f.notes||'');
  const rec = db.prepare('SELECT * FROM catering_store WHERE ref=?').get(r);
  logActivity('catering','store_item_added',f.item_name);
  sendTo('catering,admin','catering_store_new',rec);
  res.json({ success:true, item:rec });
});
app.patch('/api/catering/store/:id', (req, res) => {
  const f = req.body;
  db.prepare('UPDATE catering_store SET remaining=?,notes=? WHERE id=?').run(f.remaining,f.notes||'',req.params.id);
  const rec = db.prepare('SELECT * FROM catering_store WHERE id=?').get(req.params.id);
  logActivity('catering','store_updated',rec?.item_name);
  sendTo('catering,admin','catering_store_updated',rec);
  res.json({ success:true, item:rec });
});

// ══════════════════════════════════════════════════════════════
//  CATERING USAGE
// ══════════════════════════════════════════════════════════════
app.get('/api/catering/usage', (req, res) => res.json(db.prepare('SELECT * FROM catering_usage ORDER BY created_at DESC').all()));
app.post('/api/catering/usage', (req, res) => {
  const f = req.body;
  db.prepare('INSERT INTO catering_usage (item_name,quantity,unit,date_used,meal,used_by,notes) VALUES (?,?,?,?,?,?,?)').run(f.item_name,f.quantity||0,f.unit||'',f.date_used||'',f.meal||'',f.used_by||'',f.notes||'');
  logActivity('catering','usage_logged',`${f.item_name} for ${f.meal}`);
  res.json({ success:true });
});

// ══════════════════════════════════════════════════════════════
//  MEAL TIMETABLE
// ══════════════════════════════════════════════════════════════
app.get('/api/catering/timetable', (req, res) => res.json(db.prepare('SELECT * FROM meal_timetable ORDER BY date DESC, created_at DESC').all()));
app.post('/api/catering/timetable', (req, res) => {
  const f = req.body;
  db.prepare('INSERT INTO meal_timetable (meal_type,date,menu_items,portion_size,dietary_notes,number_served) VALUES (?,?,?,?,?,?)').run(f.meal_type,f.date,f.menu_items||'',f.portion_size||'',f.dietary_notes||'',f.number_served||0);
  logActivity('catering','timetable_added',`${f.meal_type} on ${f.date}`);
  res.json({ success:true });
});

// ══════════════════════════════════════════════════════════════
//  GROUP CATERING
// ══════════════════════════════════════════════════════════════
app.get('/api/catering/groups', (req, res) => res.json(db.prepare('SELECT * FROM group_catering ORDER BY created_at DESC').all()));
app.post('/api/catering/groups', (req, res) => {
  const f = req.body;
  const r = genRef('GRP');
  db.prepare('INSERT INTO group_catering (ref,group_name,num_people,date,destination,meal_instruction,equipment_notes) VALUES (?,?,?,?,?,?,?)').run(r,f.group_name,f.num_people||0,f.date||'',f.destination||'',f.meal_instruction||'',f.equipment_notes||'');
  const rec = db.prepare('SELECT * FROM group_catering WHERE ref=?').get(r);
  logActivity('admin','group_catering_created',f.group_name);
  sendTo('catering,admin','group_catering_new',rec);
  res.json({ success:true, group:rec });
});
app.patch('/api/catering/groups/:id', (req, res) => {
  const f = req.body;
  db.prepare("UPDATE group_catering SET status=?,meal_prepared=?,qty_prepared=?,equipment_given=?,dispatched_by=?,expected_return=?,qty_returned=?,missing_items=?,admin_note=?,updated_at=datetime('now') WHERE id=?")
    .run(f.status,f.meal_prepared||'',f.qty_prepared||'',f.equipment_given||'',f.dispatched_by||'',f.expected_return||'',f.qty_returned||'',f.missing_items||'',f.admin_note||'',req.params.id);
  const rec = db.prepare('SELECT * FROM group_catering WHERE id=?').get(req.params.id);
  logActivity('catering','group_catering_updated',rec?.group_name);
  sendTo('catering,admin','group_catering_updated',rec);
  res.json({ success:true, group:rec });
});

// ══════════════════════════════════════════════════════════════
//  VEHICLES
// ══════════════════════════════════════════════════════════════
app.get('/api/vehicles', (req, res) => res.json(db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all()));
app.post('/api/vehicles', (req, res) => {
  const f = req.body;
  db.prepare('INSERT INTO vehicles (plate,name,type,condition,assigned_driver,insurance_expiry,roadworthy_expiry,registration_expiry,notes) VALUES (?,?,?,?,?,?,?,?,?)').run(f.plate,f.name||'',f.type||'bus',f.condition||'ready',f.assigned_driver||'',f.insurance_expiry||'',f.roadworthy_expiry||'',f.registration_expiry||'',f.notes||'');
  logActivity('transport','vehicle_added',f.plate);
  res.json({ success:true });
});
app.patch('/api/vehicles/:id', (req, res) => {
  const f = req.body;
  db.prepare('UPDATE vehicles SET condition=?,assigned_driver=?,notes=? WHERE id=?').run(f.condition,f.assigned_driver||'',f.notes||'',req.params.id);
  res.json({ success:true });
});

// ══════════════════════════════════════════════════════════════
//  TRIPS
// ══════════════════════════════════════════════════════════════
app.get('/api/trips', (req, res) => {
  const { role, status } = req.query;
  let q = 'SELECT * FROM trips WHERE 1=1';
  const p = [];
  if (role !== 'admin') { q += ' AND (requested_by=? OR 1=1)'; p.push(role); }
  if (status) { q += ' AND status=?'; p.push(status); }
  res.json(db.prepare(q + ' ORDER BY created_at DESC').all(...p));
});
app.post('/api/trips', (req, res) => {
  const f = req.body;
  if (!f.purpose||!f.destination||!f.date) return res.status(400).json({ error: 'Missing fields.' });
  const r = genRef('TRIP');
  db.prepare('INSERT INTO trips (ref,requested_by,purpose,destination,date,departure,return_time,passengers,catering_req,meal_notes) VALUES (?,?,?,?,?,?,?,?,?,?)').run(r,f.requested_by||'admin',f.purpose,f.destination,f.date,f.departure||'',f.return_time||'',f.passengers||0,f.catering_req?1:0,f.meal_notes||'');
  const rec = db.prepare('SELECT * FROM trips WHERE ref=?').get(r);
  logActivity(f.requested_by||'admin','trip_requested',`${f.purpose} → ${f.destination}`);
  sendTo('admin,transport','trip_new',rec);
  res.json({ success:true, trip:rec });
});
app.patch('/api/trips/:id', (req, res) => {
  const f = req.body;
  db.prepare("UPDATE trips SET status=?,admin_note=?,driver=COALESCE(NULLIF(?,''),driver),vehicle=COALESCE(NULLIF(?,''),vehicle),mileage_before=COALESCE(NULLIF(?,0),mileage_before),mileage_after=COALESCE(NULLIF(?,0),mileage_after),fuel_used=COALESCE(NULLIF(?,0),fuel_used),incidents=COALESCE(NULLIF(?,''),incidents),cancel_reason=?,updated_at=datetime('now') WHERE id=?")
    .run(f.status,f.admin_note||'',f.driver||'',f.vehicle||'',f.mileage_before||0,f.mileage_after||0,f.fuel_used||0,f.incidents||'',f.cancel_reason||'',req.params.id);
  const rec = db.prepare('SELECT * FROM trips WHERE id=?').get(req.params.id);
  logActivity('admin',`trip_${f.status}`,rec?.purpose);
  sendTo('admin,transport','trip_updated',rec);
  res.json({ success:true, trip:rec });
});

// ══════════════════════════════════════════════════════════════
//  FUEL LOG
// ══════════════════════════════════════════════════════════════
app.get('/api/fuel', (req, res) => res.json(db.prepare('SELECT * FROM fuel_log ORDER BY created_at DESC').all()));
app.post('/api/fuel', (req, res) => {
  const f = req.body;
  const r = genRef('FUEL');
  const total = (f.litres||0)*(f.cost_litre||0);
  db.prepare('INSERT INTO fuel_log (ref,vehicle,litres,cost_litre,total_cost,date,supplier,notes) VALUES (?,?,?,?,?,?,?,?)').run(r,f.vehicle,f.litres||0,f.cost_litre||0,total,f.date||'',f.supplier||'',f.notes||'');
  logActivity('transport','fuel_logged',`${f.vehicle} — ${f.litres}L`);
  res.json({ success:true });
});

// ══════════════════════════════════════════════════════════════
//  HOUSEKEEPING STORE
// ══════════════════════════════════════════════════════════════
app.get('/api/hk/store', (req, res) => res.json(db.prepare('SELECT * FROM hk_store ORDER BY created_at DESC').all()));
app.post('/api/hk/store', (req, res) => {
  const f = req.body;
  const r = genRef('HKS');
  db.prepare('INSERT INTO hk_store (ref,item_name,unit,quantity,remaining,unit_cost,delivery_date,expiry_date,storage_location,supplier,received_by,reorder_level,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(r,f.item_name,f.unit||'',f.quantity||0,f.quantity||0,f.unit_cost||0,f.delivery_date||'',f.expiry_date||'',f.storage_location||'',f.supplier||'',f.received_by||'',f.reorder_level||0,f.notes||'');
  const rec = db.prepare('SELECT * FROM hk_store WHERE ref=?').get(r);
  logActivity('housekeeping','store_item_added',f.item_name);
  sendTo('housekeeping,admin','hk_store_new',rec);
  res.json({ success:true, item:rec });
});
app.patch('/api/hk/store/:id', (req, res) => {
  const f = req.body;
  db.prepare('UPDATE hk_store SET remaining=?,notes=? WHERE id=?').run(f.remaining,f.notes||'',req.params.id);
  const rec = db.prepare('SELECT * FROM hk_store WHERE id=?').get(req.params.id);
  logActivity('housekeeping','store_updated',rec?.item_name);
  sendTo('housekeeping,admin','hk_store_updated',rec);
  res.json({ success:true, item:rec });
});


// ══════════════════════════════════════════════════════════════
//  HOUSEKEEPING USAGE
// ══════════════════════════════════════════════════════════════
app.get('/api/hk/usage', (req, res) => res.json(db.prepare('SELECT * FROM hk_usage ORDER BY created_at DESC').all()));
app.post('/api/hk/usage', (req, res) => {
  const f = req.body;
  db.prepare('INSERT INTO hk_usage (item_name,quantity,unit,date_used,used_by,area,notes) VALUES (?,?,?,?,?,?,?)')
    .run(f.item_name,f.quantity||0,f.unit||'',f.date_used||'',f.used_by||'',f.area||'',f.notes||'');
  logActivity('housekeeping','usage_logged',`${f.item_name} in ${f.area||'—'}`);
  sendTo('housekeeping,admin','hk_usage_new',{});
  res.json({ success:true });
});

// ══════════════════════════════════════════════════════════════
//  HOUSEKEEPING SCHEDULE
// ══════════════════════════════════════════════════════════════
app.get('/api/hk/schedule', (req, res) => res.json(db.prepare('SELECT * FROM hk_schedule ORDER BY date DESC').all()));
app.post('/api/hk/schedule', (req, res) => {
  const f = req.body;
  db.prepare('INSERT INTO hk_schedule (area,assigned_to,frequency,time_of_day,status,supervisor,date) VALUES (?,?,?,?,?,?,?)').run(f.area,f.assigned_to||'',f.frequency||'daily',f.time_of_day||'',f.status||'pending',f.supervisor||'',f.date||'');
  logActivity('housekeeping','schedule_added',f.area);
  res.json({ success:true });
});
app.patch('/api/hk/schedule/:id', (req, res) => {
  db.prepare('UPDATE hk_schedule SET status=?,supervisor=? WHERE id=?').run(req.body.status,req.body.supervisor||'',req.params.id);
  res.json({ success:true });
});

// ══════════════════════════════════════════════════════════════
//  DAMAGE REPORTS
// ══════════════════════════════════════════════════════════════
app.get('/api/damage-reports', (req, res) => res.json(db.prepare('SELECT * FROM damage_reports ORDER BY created_at DESC').all()));
app.post('/api/damage-reports', (req, res) => {
  const f = req.body;
  const r = genRef('DMG');
  db.prepare('INSERT INTO damage_reports (ref,area,description,reported_by,date_reported) VALUES (?,?,?,?,?)').run(r,f.area,f.description,f.reported_by||'housekeeping',f.date_reported||'');
  const rec = db.prepare('SELECT * FROM damage_reports WHERE ref=?').get(r);
  logActivity('housekeeping','damage_reported',f.area);
  sendTo('admin,maintenance','damage_report_new',rec);
  res.json({ success:true, report:rec });
});

// ══════════════════════════════════════════════════════════════
//  MAINTENANCE STORE
// ══════════════════════════════════════════════════════════════
app.get('/api/maint/store', (req, res) => res.json(db.prepare('SELECT * FROM maint_store ORDER BY created_at DESC').all()));
app.post('/api/maint/store', (req, res) => {
  const f = req.body;
  const r = genRef('MNS');
  db.prepare('INSERT INTO maint_store (ref,item_name,unit,quantity,remaining,unit_cost,delivery_date,expiry_date,storage_location,supplier,received_by,reorder_level,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(r,f.item_name,f.unit||'',f.quantity||0,f.quantity||0,f.unit_cost||0,f.delivery_date||'',f.expiry_date||'',f.storage_location||'',f.supplier||'',f.received_by||'',f.reorder_level||0,f.notes||'');
  const rec = db.prepare('SELECT * FROM maint_store WHERE ref=?').get(r);
  logActivity('maintenance','store_item_added',f.item_name);
  sendTo('maintenance,admin','maint_store_new',rec);
  res.json({ success:true, item:rec });
});
app.patch('/api/maint/store/:id', (req, res) => {
  const f = req.body;
  db.prepare('UPDATE maint_store SET remaining=?,notes=? WHERE id=?').run(f.remaining,f.notes||'',req.params.id);
  const rec = db.prepare('SELECT * FROM maint_store WHERE id=?').get(req.params.id);
  logActivity('maintenance','store_updated',rec?.item_name);
  sendTo('maintenance,admin','maint_store_updated',rec);
  res.json({ success:true, item:rec });
});

// ══════════════════════════════════════════════════════════════
//  MAINTENANCE JOBS
// ══════════════════════════════════════════════════════════════
app.get('/api/maintenance', (req, res) => {
  const { role, status } = req.query;
  let q = 'SELECT * FROM maintenance_jobs WHERE 1=1';
  const p = [];
  if (status) { q += ' AND status=?'; p.push(status); }
  res.json(db.prepare(q + ' ORDER BY created_at DESC').all(...p));
});
app.post('/api/maintenance', (req, res) => {
  const f = req.body;
  if (!f.reported_by||!f.location||!f.description) return res.status(400).json({ error: 'Missing fields.' });
  const r = genRef('MNT');
  db.prepare('INSERT INTO maintenance_jobs (ref,reported_by,location,category,description,priority) VALUES (?,?,?,?,?,?)').run(r,f.reported_by,f.location,f.category||'general',f.description,f.priority||'normal');
  const rec = db.prepare('SELECT * FROM maintenance_jobs WHERE ref=?').get(r);
  logActivity(f.reported_by,'maintenance_reported',`${f.category} at ${f.location}`);
  sendTo('admin,maintenance','maintenance_new',rec);
  res.json({ success:true, job:rec });
});
app.patch('/api/maintenance/:id', (req, res) => {
  const f = req.body;
  db.prepare("UPDATE maintenance_jobs SET status=?,admin_note=?,assigned_worker=?,resolved_note=?,date_completed=?,materials_used=?,updated_at=datetime('now') WHERE id=?")
    .run(f.status,f.admin_note||'',f.assigned_worker||'',f.resolved_note||'',f.date_completed||'',f.materials_used||'',req.params.id);
  const rec = db.prepare('SELECT * FROM maintenance_jobs WHERE id=?').get(req.params.id);
  logActivity('admin',`maintenance_${f.status}`,rec?.location);
  sendTo('admin,maintenance',`maintenance_updated`,rec);
  // notify reporter
  if (rec?.reported_by) sendTo(rec.reported_by,'maintenance_updated',rec);
  res.json({ success:true, job:rec });
});

// ══════════════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════
app.get('/api/announcements', (req, res) => {
  const { role } = req.query;
  let q = "SELECT * FROM announcements WHERE to_roles='all'";
  const p = [];
  if (role && role !== 'admin') { q += ' OR to_roles LIKE ?'; p.push(`%${role}%`); }
  else if (role === 'admin') q = 'SELECT * FROM announcements WHERE 1=1';
  res.json(db.prepare(q + ' ORDER BY created_at DESC LIMIT 30').all(...p));
});
app.post('/api/announcements', (req, res) => {
  const f = req.body;
  if (!f.subject||!f.message) return res.status(400).json({ error: 'Subject and message required.' });
  db.prepare('INSERT INTO announcements (from_role,to_roles,subject,message,priority) VALUES (?,?,?,?,?)').run(f.from_role||'admin',f.to_roles||'all',f.subject,f.message,f.priority||'normal');
  const rec = db.prepare('SELECT * FROM announcements ORDER BY id DESC LIMIT 1').get();
  logActivity(f.from_role||'admin','announcement_posted',f.subject);
  sendTo(f.to_roles||'all','announcement_new',rec);
  res.json({ success:true, announcement:rec });
});
app.delete('/api/announcements/:id', (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id);
  sendTo('all','announcement_deleted',{ id:req.params.id });
  res.json({ success:true });
});

// ══════════════════════════════════════════════════════════════
//  ACTIVITY LOG
// ══════════════════════════════════════════════════════════════
app.get('/api/activity', (req, res) => {
  const { role, limit } = req.query;
  let q = 'SELECT * FROM activity_log WHERE 1=1';
  const p = [];
  if (role && role !== 'admin') { q += ' AND (role=? OR role=\'admin\')'; p.push(role); }
  res.json(db.prepare(q + ' ORDER BY created_at DESC LIMIT ?').all(...p, parseInt(limit)||20));
});

// ══════════════════════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   DAWAMU SCHOOL MANAGEMENT SYSTEM  v2.0          ║');
  console.log(`║   http://localhost:${PORT}                          ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('Default passwords:');
  console.log('  admin → admin123  |  catering → cater123');
  console.log('  farm → farm123    |  transport → trans123');
  console.log('  housekeeping → house123  |  maintenance → maint123\n');
});
