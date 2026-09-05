require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id           BIGSERIAL PRIMARY KEY,
  full_name    VARCHAR(150) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role         VARCHAR(50) NOT NULL DEFAULT 'accountant'
                 CHECK (role IN ('admin', 'accountant', 'contact_user')),
  contact_id   BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

pool.query(sql)
  .then(() => { console.log('users table created successfully.'); pool.end(); })
  .catch((e) => { console.error('Migration failed:', e.message); pool.end(); process.exit(1); });
