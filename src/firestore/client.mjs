/**
 * Maverick Hunter — Firebase Admin Client
 * Initializes the firebase-admin SDK using a Service Account.
 * Reuses the same pattern as QuestLog's migrate_agent_labels.mjs.
 */
import admin from 'firebase-admin';
import { log } from '../logger/logger.mjs';

let db = null;

/**
 * Initialize the Firebase Admin SDK.
 * Must be called once before any Firestore operations.
 * @returns {import('firebase-admin').firestore.Firestore}
 */
export function initFirestore() {
  if (db) return db;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!saJson) {
    log.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    log.error('Set it in your .env file or via PowerShell:');
    log.error('  $env:FIREBASE_SERVICE_ACCOUNT = Get-Content path\\to\\serviceAccountKey.json -Raw');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(saJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    log.info('🔥 Firebase Admin initialized successfully');
    return db;
  } catch (error) {
    log.error(`❌ Failed to parse FIREBASE_SERVICE_ACCOUNT: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Get the Firestore database instance.
 * @returns {import('firebase-admin').firestore.Firestore}
 */
export function getDb() {
  if (!db) {
    throw new Error('Firestore not initialized. Call initFirestore() first.');
  }
  return db;
}
