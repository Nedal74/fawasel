/**
 * One-command local run with NO external database service:
 *
 *   npm run local
 *
 * Starts a private PostgreSQL bundled through npm (embedded-postgres, binaries
 * for Windows/macOS/Linux), stores its data in ./storage/pgdata, applies the
 * migrations, seeds structural config, creates a local admin on first run and
 * starts the Next.js dev server. Ctrl+C stops both.
 *
 * For local preview only — production should use a managed/maintained PostgreSQL.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.LOCAL_PG_PORT || 5433);
const DATA_DIR = path.resolve("storage/pgdata");
const DATABASE_URL = `postgresql://postgres:password@localhost:${PORT}/aljafil`;
const ADMIN_EMAIL = "admin@aljafil.local";
const ADMIN_PASSWORD = "Aljafil12345";

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, DATABASE_URL, ...env } });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`))));
  });
}

function ensureEnvFile() {
  const file = path.resolve(".env");
  const content = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (!/^NEXT_PUBLIC_SITE_URL=/m.test(content)) {
    writeFileSync(file, `${content}${content && !content.endsWith("\n") ? "\n" : ""}NEXT_PUBLIC_SITE_URL=http://localhost:3000\n`);
  }
}

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  port: PORT,
  user: "postgres",
  password: "password",
  persistent: true,
  // UTF-8 is required for Arabic content (Windows would otherwise default to a legacy code page).
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  // Postgres refuses to run as root (only relevant inside containers).
  createPostgresUser: typeof process.getuid === "function" && process.getuid() === 0,
  onLog: () => {},
});

async function main() {
  ensureEnvFile();
  console.log("▶ Starting local PostgreSQL on port", PORT, "…");
  if (!existsSync(path.join(DATA_DIR, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  await pg.createDatabase("aljafil").catch(() => {}); // already exists

  console.log("▶ Applying database migrations …");
  await run("npx", ["prisma", "migrate", "deploy"]);
  await run("npx", ["tsx", "prisma/seed.ts"]);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  const users = await prisma.user.count();
  await prisma.$disconnect();
  if (users === 0) {
    await run("npx", ["tsx", "scripts/create-admin.ts", "--email", ADMIN_EMAIL, "--name", "Admin"], { ADMIN_PASSWORD });
    console.log(`\n  Local admin → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}  (change it from /admin/users)\n`);
  }

  console.log("▶ Starting the website → http://localhost:3000  (dashboard: /admin)\n");
  const next = spawn("npx", ["next", "dev", "-p", process.env.PORT || "3000"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, DATABASE_URL },
  });

  const shutdown = async () => {
    next.kill();
    await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  next.on("exit", shutdown);
}

main().catch(async (err) => {
  console.error("\n✖", err.message);
  await pg.stop().catch(() => {});
  process.exit(1);
});
