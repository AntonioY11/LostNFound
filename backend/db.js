const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = process.env.DB_PATH || path.join(__dirname, 'lostnfound.db');
const db = new sqlite3.Database(dbPath);

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS LostItems (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      image_url TEXT,
      category TEXT,
      color TEXT,
      description TEXT,
      location TEXT,
      date_lost TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS FoundItems (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      image_url TEXT,
      category TEXT,
      color TEXT,
      description TEXT,
      location TEXT,
      date_found TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Matches (
      id TEXT PRIMARY KEY,
      lost_item_id TEXT,
      found_item_id TEXT,
      match_score REAL,
      notification_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      message TEXT,
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('Database initialized at', dbPath);
  });
}

if (require.main === module) {
  init();
}

// Ensure existing DB has `phone` column in Users (safe migration)
function ensurePhoneColumn() {
  db.serialize(() => {
    db.all("PRAGMA table_info('Users')", (err, rows) => {
      if (err) return;
      const hasPhone = rows && rows.some(r => r.name === 'phone');
      if (!hasPhone) {
        try {
          db.run("ALTER TABLE Users ADD COLUMN phone TEXT", () => {
            console.log('Added phone column to Users table');
          });
        } catch (e) {
          // ignore
        }
      }
    });
  });
}

ensurePhoneColumn();

module.exports = { db, init };
