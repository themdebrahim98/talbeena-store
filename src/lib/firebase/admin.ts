import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getDatabase,
  getDatabaseWithUrl,
  type Database,
} from "firebase-admin/database";

/**
 * SERVER-ONLY Firebase Admin SDK singleton. Never import this from a client
 * component — it holds service-account credentials and bypasses Realtime
 * Database security rules. Used by server actions, route handlers and the
 * data-access layer (`src/queries/*`).
 */

interface AdminHandles {
  auth: Auth;
  db: Database;
}

let cached: AdminHandles | null = null;

function projectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

function initApp(): App {
  if (getApps().length > 0) return getApp();

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const pid = projectId();

  if (!pid || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin configuration. Set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local " +
        "(see .env.example).",
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId: pid,
    clientEmail,
    privateKey,
  };

  return initializeApp({
    credential: cert(serviceAccount),
    ...(databaseURL ? { databaseURL } : {}),
  });
}

function initAdmin(): AdminHandles {
  if (cached) return cached;

  const app = initApp();
  const databaseURL =
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const db = databaseURL ? getDatabaseWithUrl(databaseURL, app) : getDatabase(app);

  cached = { auth: getAuth(app), db };
  return cached;
}

export function getAdminAuth(): Auth {
  return initAdmin().auth;
}

export function getAdminDb(): Database {
  return initAdmin().db;
}

/** True when server-side Firebase operations can run. */
export function isAdminConfigured(): boolean {
  try {
    initAdmin();
    return true;
  } catch {
    return false;
  }
}