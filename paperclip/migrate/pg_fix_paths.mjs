// Rewrites Mac paths to Linux paths in the live Paperclip tables only
// (history such as run logs keeps the original text).
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
const [dataDir, port] = process.argv.slice(2);
const live = ["agents.adapter_config","projects.execution_workspace_policy","project_workspaces.cwd",
  "execution_workspaces.cwd","execution_workspaces.metadata","execution_workspaces.provider_ref",
  "company_skills.source_locator","agent_instruction_working_copies.local_root","agent_instruction_working_copies.execution_root"];
const maps = [["/Users/carlosm.kampff/Desktop/dev/agent-os-paperclip","/home/ec2-user/dev/agent-office/agent-os"],
  ["/Users/carlosm.kampff/Desktop/dev/space-exploration-news","/home/ec2-user/dev/space-exploration-news"],
  ["/Users/carlosm.kampff","/home/ec2-user"]];
const pg = new EmbeddedPostgres({ databaseDir: dataDir, port: Number(port), user: "paperclip", password: "paperclip", persistent: true });
await pg.start();
const sql = postgres(`postgres://paperclip:paperclip@127.0.0.1:${port}/paperclip`, { max: 1 });
try {
  for (const tc of live) {
    const [t, c] = tc.split(".");
    const [{ udt_name }] = await sql`select udt_name from information_schema.columns where table_schema='public' and table_name=${t} and column_name=${c}`;
    let expr = `"${c}"::text`;
    for (const [a, b] of maps) expr = `replace(${expr}, '${a}', '${b}')`;
    const r = await sql.unsafe(`update "${t}" set "${c}" = (${expr})::${udt_name} where "${c}"::text like '%/Users/carlosm%'`);
    console.log(tc, r.count);
  }
} finally { await sql.end(); await pg.stop(); }
