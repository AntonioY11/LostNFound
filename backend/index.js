require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const { db, init } = require('./db');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
// Ensure uploads directory exists (EB instances may need this)
try {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
} catch (e) {
  // ignore
}

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// configure S3 if credentials present
let s3 = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION && process.env.S3_BUCKET) {
  AWS.config.update({ region: process.env.AWS_REGION });
  s3 = new AWS.S3();
}

// Configure CORS to allow requests from the frontend URL set in environment
// Accept several common env names so build/CI variations work (FRONTEND_URL, VITE_API_BASE_URL, VITE_API_BASE)
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_API_BASE_URL || process.env.VITE_API_BASE || '';
const corsOptions = {
  origin: function (origin, callback) {
    // allow server-to-server or tools with no origin
    if (!origin) return callback(null, true);
    if (!FRONTEND_URL || FRONTEND_URL === '*' || origin === FRONTEND_URL) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helpers
function uploadToS3(buffer, key, contentType) {
  return new Promise((resolve, reject) => {
    if (!s3) return reject(new Error('S3 not configured'));
    // Do not set ACL here to avoid failures when the bucket blocks public ACLs.
    // Use bucket policy or CloudFront for public access instead.
    const params = { Bucket: process.env.S3_BUCKET, Key: key, Body: buffer };
    if (contentType) params.ContentType = contentType;
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      resolve(data.Location);
    });
  });
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
}

// Init DB if needed
init();

// Auth
app.post('/api/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO Users (id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)`, [id, name || '', email, hash, phone || null], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const token = jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id, name, email, phone } });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get(`SELECT * FROM Users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  });
});

// Create lost item
app.post('/api/lost', requireAuth, upload.single('image'), async (req, res) => {
  const id = uuidv4();
  let imageUrl = null;
  if (req.file) {
    if (!s3) return res.status(500).json({ error: 'S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION and S3_BUCKET.' });
    const key = `lost/${id}-${req.file.originalname}`;
    try {
      const s3Url = await uploadToS3(req.file.buffer, key, req.file.mimetype);
      imageUrl = s3Url;
    } catch (err) {
      return res.status(500).json({ error: 'Failed to upload image to S3' });
    }
  }
  const { category, color, description, location, date_lost } = req.body;
  db.run(`INSERT INTO LostItems (id, user_id, image_url, category, color, description, location, date_lost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, imageUrl, category, color, description, location, date_lost], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, image_url: imageUrl });
    });
});

// Create found item
app.post('/api/found', requireAuth, upload.single('image'), async (req, res) => {
  const id = uuidv4();
  let imageUrl = null;
  if (req.file) {
    if (!s3) return res.status(500).json({ error: 'S3 not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION and S3_BUCKET.' });
    const key = `found/${id}-${req.file.originalname}`;
    try {
      const s3Url = await uploadToS3(req.file.buffer, key, req.file.mimetype);
      imageUrl = s3Url;
    } catch (err) {
      return res.status(500).json({ error: 'Failed to upload image to S3' });
    }
  }
  const { category, color, description, location, date_found } = req.body;
  db.run(`INSERT INTO FoundItems (id, user_id, image_url, category, color, description, location, date_found) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, imageUrl, category, color, description, location, date_found], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, image_url: imageUrl });
    });
});

// List lost items with simple filters
app.get('/api/lost', (req, res) => {
  const { category, location, q } = req.query;
  let sql = `SELECT li.*, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
             FROM LostItems li
             LEFT JOIN Users u ON li.user_id = u.id
             WHERE 1=1`;
  const params = [];
  if (category) { sql += ` AND category = ?`; params.push(category); }
  if (location) { sql += ` AND location LIKE ?`; params.push('%' + location + '%'); }
  if (q) { sql += ` AND (description LIKE ? OR color LIKE ?)`; params.push('%' + q + '%', '%'+q+'%'); }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// List found items with simple filters
app.get('/api/found', (req, res) => {
  const { category, location, q } = req.query;
  let sql = `SELECT fi.*, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
             FROM FoundItems fi
             LEFT JOIN Users u ON fi.user_id = u.id
             WHERE 1=1`;
  const params = [];
  if (category) { sql += ` AND category = ?`; params.push(category); }
  if (location) { sql += ` AND location LIKE ?`; params.push('%' + location + '%'); }
  if (q) { sql += ` AND (description LIKE ? OR color LIKE ?)`; params.push('%' + q + '%', '%'+q+'%'); }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update lost item (only by owner)
app.put('/api/lost/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { category, color, description, location, date_lost } = req.body;
  
  // Verify ownership
  db.get(`SELECT user_id FROM LostItems WHERE id = ?`, [id], (err, item) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to edit this item' });
    
    db.run(`UPDATE LostItems SET category = ?, color = ?, description = ?, location = ?, date_lost = ? WHERE id = ?`,
      [category, color, description, location, date_lost, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
  });
});

// Delete lost item (only by owner)
app.delete('/api/lost/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // Verify ownership
  db.get(`SELECT user_id FROM LostItems WHERE id = ?`, [id], (err, item) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to delete this item' });
    
    db.run(`DELETE FROM LostItems WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Update found item (only by owner)
app.put('/api/found/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { category, color, description, location, date_found } = req.body;
  
  // Verify ownership
  db.get(`SELECT user_id FROM FoundItems WHERE id = ?`, [id], (err, item) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to edit this item' });
    
    db.run(`UPDATE FoundItems SET category = ?, color = ?, description = ?, location = ?, date_found = ? WHERE id = ?`,
      [category, color, description, location, date_found, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
  });
});

// Delete found item (only by owner)
app.delete('/api/found/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // Verify ownership
  db.get(`SELECT user_id FROM FoundItems WHERE id = ?`, [id], (err, item) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to delete this item' });
    
    db.run(`DELETE FROM FoundItems WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Simple notifications fetch
app.get('/api/notifications', requireAuth, (req, res) => {
  db.all(`SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Basic user profile
app.get('/api/profile', requireAuth, (req, res) => {
  db.get(`SELECT id, name, email, phone, created_at FROM Users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(user);
  });
});

// Update profile (name, phone)
app.put('/api/profile', requireAuth, (req, res) => {
  const { name, phone } = req.body;
  db.run(`UPDATE Users SET name = ?, phone = ? WHERE id = ?`, [name || '', phone || null, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT id, name, email, phone, created_at FROM Users WHERE id = ?`, [req.user.id], (err2, user) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(user);
    });
  });
});

// Health endpoint for Elastic Beanstalk / load balancer
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root: redirect to frontend (if configured) or show a minimal API landing page
app.get('/', (req, res) => {
  if (FRONTEND_URL) return res.redirect(FRONTEND_URL);
  res.send(`
    <html>
      <head><title>LostNFound API</title></head>
      <body style="font-family:Arial,Helvetica,sans-serif;padding:24px;">
        <h1>LostNFound API</h1>
        <p>This server exposes the API under <code>/api/*</code>.</p>
        <p>Health: <a href="/health">/health</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`LostNFound backend running on port ${PORT}`);
  console.log(`Use POST /api/register and /api/login to create user and get token.`);
  console.log(`CORS allowed origin: ${FRONTEND_URL || 'none configured (allowing non-browser requests only)'}`);
});

module.exports = app;
