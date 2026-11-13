import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
const [dataDir, port] = process.argv.slice(2);
const pg = new EmbeddedPostgres({ databaseDir: dataDir, port: Number(port), user: "paperclip", password: "paperclip", persistent: true });
await pg.start();
const sql = postgres(`postgres://paperclip:paperclip@127.0.0.1:${port}/paperclip`, { max: 1 });
const cols = await sql`select table_name, column_name from information_schema.columns where table_schema='public' and data_type in ('text','jsonb','json','character varying')`;
for (const c of cols) {
  const [r] = await sql.unsafe(`select count(*)::int n from "${c.table_name}" where "${c.column_name}"::text like '%/Users/carlosm%'`);
  if (r.n) console.log(c.table_name + "." + c.column_name, r.n);
}
await sql.end(); await pg.stop();
