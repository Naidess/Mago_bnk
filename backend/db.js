// db.js
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Set a statement timeout (ms) on each new client to avoid hanging queries
const STATEMENT_TIMEOUT_MS = parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || "1000", 10); // default 1s

pool.on('connect', async (client) => {
    try {
        // apply statement_timeout for this session
        await client.query(`SET statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
    } catch (err) {
        console.error('Failed to set statement_timeout on new client', err);
    }
});

module.exports = pool;
