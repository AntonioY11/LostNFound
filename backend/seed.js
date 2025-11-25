require('dotenv').config();
const { db, init } = require('./db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

async function run() {
  init();
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  db.serialize(() => {
    db.run(`INSERT OR IGNORE INTO Users (id, name, email, password_hash) VALUES (?, ?, ?, ?)`, [userId, 'Demo User', 'demo@example.com', hash]);

    const lost1 = uuidv4();
    db.run(`INSERT OR IGNORE INTO LostItems (id, user_id, image_url, category, color, description, location, date_lost) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [lost1, userId, null, 'Wallet', 'Black', 'Leather wallet with ID', 'Central Station', '2025-11-10']);

    const found1 = uuidv4();
    db.run(`INSERT OR IGNORE INTO FoundItems (id, user_id, image_url, category, color, description, location, date_found) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [found1, userId, null, 'Wallet', 'Black', 'Found near entrance', 'Central Station', '2025-11-11']);

    console.log('Seed inserted: user', userId, 'lost', lost1, 'found', found1);
  });
}

if (require.main === module) run();

module.exports = { run };
