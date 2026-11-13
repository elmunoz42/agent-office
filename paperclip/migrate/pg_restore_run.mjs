// usage: node pg_restore_run.mjs <dataDir> <port> <dump.sql.gz> [--init]
// Starts embedded Postgres on dataDir (initialising it with --init), restores
// the Paperclip dump into database "paperclip", prints row counts, stops.
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import { runDatabaseRestore } from "../node_modules/@paperclipai/db/dist/backup-lib.js";
const [dataDir, port, dump, flag] = process.argv.slice(2);
const pg = new EmbeddedPostgres({ databaseDir: dataDir, port: Number(port), user: "paperclip", password: "paperclip", persistent: true });
if (flag === "--init") await pg.initialise();
await pg.start();
try {
  const admin = postgres(`postgres://paperclip:paperclip@127.0.0.1:${port}/postgres`, { max: 1 });
  const exists = await admin`select 1 from pg_database where datname='paperclip'`;
  if (!exists.length) await admin.unsafe("create database paperclip");
  await admin.end();
  const url = `postgres://paperclip:paperclip@127.0.0.1:${port}/paperclip`;
  await runDatabaseRestore({ connectionString: url, backupFile: dump });
  const sql = postgres(url, { max: 1 });
  for (const t of ["companies", "agents", "issues", "issue_comments", "routines", "company_secrets", "company_skills"]) {
    try { const [r] = await sql.unsafe(`select count(*)::int n from ${t}`); console.log(t, r.n); } catch (e) { console.log(t, "ERR", e.message); }
  }
  await sql.end();
} finally { await pg.stop(); }
