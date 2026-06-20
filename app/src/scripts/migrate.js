/**
 * migrate.js — SQL migration runner
 *
 * Execution order:
 *   1. Schema migrations: files matching /^\d+_.+\.sql$/ (001_..., 002_..., etc.)
 *      sorted lexicographically by filename (ascending).
 *   2. Seed files: seed_001_... then seed_002_... in filename order.
 *
 * Works with both local Docker (DB_HOST/PORT) and cloud deployments
 * (DATABASE_URL on Render / Neon) — the existing db.js config handles
 * both paths transparently.
 *
 * Usage:
 *   npm run migrate
 *   node src/scripts/migrate.js
 */

'use strict';

require('dotenv').config();

const fs   = require('fs');
const path = require('path');

// Import the pool after dotenv so env vars are loaded before env.js runs.
const { pool } = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// ── File classification ────────────────────────────────────────────────────────

/**
 * Returns true for numbered schema migration files: 001_..., 002_..., etc.
 * Excludes seed files.
 */
const isSchemaFile = (name) => /^\d+_.+\.sql$/.test(name);

/**
 * Returns true for seed files: seed_001_..., seed_002_..., etc.
 */
const isSeedFile = (name) => /^seed_\d+_.+\.sql$/.test(name);

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Read all .sql filenames in the migrations directory, sorted ascending.
 */
const listSqlFiles = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // lexicographic sort — 001 < 002 < ... < seed_001 < seed_002

/**
 * Execute a single SQL file against the database.
 * Uses a dedicated client from the pool so each file runs in its own
 * connection, making it safe to call multiple times.
 *
 * @param {string} filename  — e.g. '001_create_users_table.sql'
 */
const runFile = async (filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql      = fs.readFileSync(filePath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
};

// ── Main ───────────────────────────────────────────────────────────────────────

const run = async () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  IRCTC Tatkal — Migration Runner');
  console.log('═══════════════════════════════════════════');

  const allFiles    = listSqlFiles();
  const schemaFiles = allFiles.filter(isSchemaFile);
  const seedFiles   = allFiles.filter(isSeedFile);

  // ── Phase 1: Schema migrations ─────────────────────────────────────────────
  if (schemaFiles.length === 0) {
    console.log('\n[Schema] No schema migration files found — skipping.');
  } else {
    console.log(`\n[Schema] Running ${schemaFiles.length} schema migration(s)...\n`);

    for (const file of schemaFiles) {
      // Pretty label: strip .sql extension for readability
      const label = file.replace('.sql', '');
      process.stdout.write(`  ▶ Running migration ${label}... `);

      try {
        await runFile(file);
        console.log('✓ done');
      } catch (err) {
        console.log('✗ FAILED');
        console.error('\n[Error] Migration failed on file:', file);
        console.error('[SQL Error]', err.message);
        process.exit(1);
      }
    }
  }

  // ── Phase 2: Seed files ────────────────────────────────────────────────────
  if (seedFiles.length === 0) {
    console.log('\n[Seed] No seed files found — skipping.');
  } else {
    console.log(`\n[Seed] Running ${seedFiles.length} seed file(s)...\n`);

    for (const file of seedFiles) {
      const label = file.replace('.sql', '');
      process.stdout.write(`  ▶ Running ${label}... `);

      try {
        await runFile(file);
        console.log('✓ done');
      } catch (err) {
        console.log('✗ FAILED');
        console.error('\n[Error] Seed failed on file:', file);
        console.error('[SQL Error]', err.message);
        process.exit(1);
      }
    }
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  Migration completed successfully.');
  console.log('═══════════════════════════════════════════');
  console.log('');

  // Release the pool so the process exits cleanly.
  await pool.end();
};

run().catch((err) => {
  console.error('[migrate.js] Unexpected error:', err.message);
  process.exit(1);
});
