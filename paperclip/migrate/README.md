# Moving the Paperclip instance to another host

Used for the Mac to EC2 move on 13 Nov 2026. Run from `paperclip/` with Node 24
and the instance stopped; `<dataDir>` is `~/.paperclip-sen/instances/default/db`.

1. On the old host: `paperclipai db:backup`, then stop the service so nothing
   runs on two hosts at once.
2. Copy the instance folder without `db/`, `runtime/` and `logs/` (keep `.env`,
   `secrets/`, `companies/`, `skills/`, `data/`), plus the newest backup.
3. Rewrite paths in `config.json`.
4. `node migrate/pg_restore_run.mjs <dataDir> 54329 <backup.sql.gz> --init`:
   creates the database and restores the dump.
5. `node migrate/pg_fix_paths.mjs <dataDir> 54329`: rewrites old-host paths in
   the live tables (agent configs, workspaces, skills). Edit its path map first.
   `pg_scan.mjs` lists every column that still holds an old path.
6. Start the service and check the AI connection still reads "connected".
