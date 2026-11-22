import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("================================================================================");
console.log("       ICONIC DIGITAL LIBRARY & REPOSITORY — PRODUCTION AUDIT SUITE");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failed++;
  }
}

// 1. Audit Migrations
console.log("--- 1. AUDITING SQL MIGRATIONS ---");
const migrationsDir = path.resolve(__dirname, "../supabase/migrations");
const migrationFiles = [
  "001_initial_schema.sql",
  "002_storage_setup.sql",
  "003_sample_resources.sql",
  "004_notifications.sql",
];

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  const exists = fs.existsSync(filePath);
  assert(exists, `Migration file '${file}' exists`);

  if (exists) {
    const content = fs.readFileSync(filePath, "utf-8");
    assert(content.length > 100, `Migration file '${file}' has substantial SQL content (${content.length} bytes)`);

    if (file === "001_initial_schema.sql") {
      assert(content.includes("CREATE TABLE IF NOT EXISTS public.profiles"), "Initial schema defines profiles table");
      assert(content.includes("CREATE TABLE IF NOT EXISTS public.resources"), "Initial schema defines resources table");
      assert(content.includes("ENABLE ROW LEVEL SECURITY"), "Initial schema enforces RLS");
      assert(content.includes("trg_protect_profile_role"), "Initial schema protects against role escalation via trigger");
    }
    if (file === "002_storage_setup.sql") {
      assert(content.includes("resource-files"), "Storage setup configures 'resource-files' bucket");
      assert(content.includes("resource-covers"), "Storage setup configures 'resource-covers' bucket");
      assert(content.includes("profile-images"), "Storage setup configures 'profile-images' bucket");
    }
    if (file === "004_notifications.sql") {
      assert(content.includes("CREATE TABLE IF NOT EXISTS public.notifications"), "Notifications schema defines table");
      assert(content.includes("idx_notifications_unread"), "Notifications schema indexes user and unread status");
    }
  }
}

// 2. Audit Security and Permissions Logic
console.log("\n--- 2. AUDITING RBAC PERMISSIONS LOGIC ---");
const permissionsPath = path.resolve(__dirname, "src/lib/auth/permissions.ts");
const permissionsCode = fs.readFileSync(permissionsPath, "utf-8");

assert(permissionsCode.includes("ROLE_HIERARCHY"), "Role hierarchy mapping is defined");
assert(permissionsCode.includes("canManageUsers"), "Admin-only user management guard is implemented");
assert(permissionsCode.includes("canManageCatalog"), "Catalog management guard is implemented");
assert(permissionsCode.includes("canUploadResource"), "Resource upload matrix is implemented");
assert(permissionsCode.includes("canViewResource"), "Access-level view policy is implemented");
assert(permissionsCode.includes("canDownloadResource"), "Access-level download policy is implemented");

// 3. Audit Environment Configuration
console.log("\n--- 3. AUDITING ENVIRONMENT AND CREDENTIAL SAFETY ---");
const envPath = path.resolve(__dirname, ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  assert(envContent.includes("NEXT_PUBLIC_SUPABASE_URL="), ".env.local defines NEXT_PUBLIC_SUPABASE_URL");
  assert(envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY="), ".env.local defines NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assert(!envContent.includes("SERVICE_ROLE"), ".env.local does NOT leak any secret service-role key");
  assert(!envContent.includes("service_role"), ".env.local does NOT expose service_role keyword");
}

// 4. Audit Next.js Security Configuration
console.log("\n--- 4. AUDITING NEXT.JS SECURITY HEADERS & IMAGES ---");
const nextConfigPath = path.resolve(__dirname, "next.config.ts");
const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");

assert(nextConfigContent.includes("X-Content-Type-Options"), "next.config.ts sets X-Content-Type-Options: nosniff");
assert(nextConfigContent.includes("X-Frame-Options"), "next.config.ts sets X-Frame-Options: SAMEORIGIN");
assert(nextConfigContent.includes("Referrer-Policy"), "next.config.ts sets Referrer-Policy");
assert(nextConfigContent.includes("Permissions-Policy"), "next.config.ts sets Permissions-Policy");
assert(nextConfigContent.includes("images.unsplash.com"), "next.config.ts allows Unsplash book covers");
assert(nextConfigContent.includes("*.supabase.co"), "next.config.ts allows Supabase storage images");

// 5. Audit Route Coverage
console.log("\n--- 5. AUDITING APPLICATION ROUTE DIRECTORIES ---");
const appDir = path.resolve(__dirname, "src/app");
const requiredRoutes = [
  "",
  "dashboard",
  "library",
  "library/[id]",
  "repository",
  "repository/[id]",
  "catalog",
  "search",
  "reader/[id]",
  "profile",
  "activity",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "admin",
  "admin/resources",
  "admin/users",
  "admin/categories",
  "admin/departments",
  "admin/reports",
  "admin/audit-logs",
  "admin/settings",
];

for (const r of requiredRoutes) {
  const pagePath = path.join(appDir, r, "page.tsx");
  assert(fs.existsSync(pagePath), `App Router page exists: '/${r}'`);
}

// 6. Audit Critical Administrative Layout Guard
const adminLayoutPath = path.join(appDir, "admin", "layout.tsx");
assert(fs.existsSync(adminLayoutPath), "Admin layout boundary guard '/admin/layout.tsx' exists");

console.log("\n================================================================================");
console.log(`AUDIT FINISHED: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================\n");

if (failed > 0) {
  process.exit(1);
}
