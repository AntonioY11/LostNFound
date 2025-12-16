const mysql = require('mysql2');

let pool = null;

function init() {
  if (pool) return;

  const host = process.env.RDS_HOST || process.env.DB_HOST;
  const port = process.env.RDS_PORT ? parseInt(process.env.RDS_PORT, 10) : 3306;
  const user = process.env.RDS_USER || process.env.DB_USER;
  const password = process.env.RDS_PASSWORD || process.env.DB_PASSWORD;
  const database = process.env.RDS_DATABASE || process.env.DB_DATABASE;
  const connectionLimit = process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : 10;

  if (!host || !user || !password || !database) {
    console.error('Missing RDS configuration. Please set RDS_HOST, RDS_USER, RDS_PASSWORD and RDS_DATABASE in environment.');
    return;
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
  });

  pool.getConnection((err, conn) => {
    if (err) {
      console.error('Unable to get connection from MySQL pool:', err.message || err);
    } else {
      conn.release();
      console.log('MySQL pool initialized');

      const schemaStatements = [
        `CREATE TABLE IF NOT EXISTS Users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255),
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          phone VARCHAR(50),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        `CREATE TABLE IF NOT EXISTS LostItems (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36),
          image_url VARCHAR(1024),
          category VARCHAR(100),
          color VARCHAR(50),
          description TEXT,
          location VARCHAR(255),
          date_lost DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_lost_user_id (user_id),
          FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        `CREATE TABLE IF NOT EXISTS FoundItems (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36),
          image_url VARCHAR(1024),
          category VARCHAR(100),
          color VARCHAR(50),
          description TEXT,
          location VARCHAR(255),
          date_found DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_found_user_id (user_id),
          FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        `CREATE TABLE IF NOT EXISTS Notifications (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36),
          message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_notifications_user_id (user_id),
          FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
      ];

      schemaStatements.forEach((sql) => {
        pool.query(sql, (err) => {
          if (err) console.error('Error creating table:', err.message || err);
        });
      });
    }
  });
}

function ensureInit() {
  if (!pool) init();
}

const db = {
  run(sql, params, cb) {
    ensureInit();
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params, (err, results) => {
      if (cb) cb(err, results);
    });
  },

  get(sql, params, cb) {
    ensureInit();
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params, (err, results) => {
      if (err) return cb && cb(err);
      const row = Array.isArray(results) && results.length ? results[0] : null;
      cb && cb(null, row);
    });
  },

  all(sql, params, cb) {
    ensureInit();
    if (typeof params === 'function') { cb = params; params = []; }
    pool.query(sql, params, (err, results) => {
      if (cb) cb(err, results);
    });
  }
};

module.exports = { db, init };
