/**
 * Deploys firebase/database/rules.json to the live Realtime Database via REST API.
 * Uses service account credentials from .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvFile(path.join(ROOT, ".env.local"));

const { cert } = await import("firebase-admin/app");

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (!projectId || !clientEmail || !privateKey || !databaseURL) {
  console.error("Missing Firebase credentials in .env.local");
  process.exit(1);
}

const credential = cert({ projectId, clientEmail, privateKey });
const tokenObj = await credential.getAccessToken();

const rulesPath = path.join(ROOT, "firebase/database/rules.json");
const rulesContent = fs.readFileSync(rulesPath, "utf8");

console.log(`Deploying ${rulesPath} to ${databaseURL}…`);

const res = await fetch(`${databaseURL}/.settings/rules.json?access_token=${tokenObj.access_token}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: rulesContent,
});

if (!res.ok) {
  const err = await res.text();
  console.error(`Failed to deploy rules: ${res.status} ${res.statusText}`, err);
  process.exit(1);
}

console.log("Successfully deployed Realtime Database security rules & indexes!");
