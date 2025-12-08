// cleanup_refresh_tokens.js
// Deletes expired refresh tokens from the database.
// Run with: node backend/scripts/cleanup_refresh_tokens.js

require('dotenv').config();
const pool = require('../db');

async function main() {
  try {
    // Delete refresh tokens that have expired
    const res = await pool.query("DELETE FROM refresh_tokens WHERE expires_at < NOW() RETURNING id");
    console.log(new Date().toISOString(), `Deleted ${res.rowCount} expired refresh tokens`);

    // Optionally: remove revoked tokens older than X days (e.g., 30 days)
    // const res2 = await pool.query("DELETE FROM refresh_tokens WHERE revoked = true AND revoked_at < NOW() - INTERVAL '30 days' RETURNING id");
    // console.log(new Date().toISOString(), `Deleted ${res2.rowCount} old revoked tokens`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed', err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
}

main();
