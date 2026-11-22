#!/usr/bin/env node
/**
 * One-time Firebase Auth custom-claim seeder for Staff & Demo Admin roles.
 *
 * Usage:
 *   GOOGLE_CLOUD_PROJECT=brewspace-ai-mvp-2026 node scripts/seed-staff-claims.mjs staff@roastery.example staff
 *   GOOGLE_CLOUD_PROJECT=brewspace-ai-mvp-2026 node scripts/seed-staff-claims.mjs demo@roastery.example demo_admin
 *
 * Prerequisites:
 *   - ADC configured (`gcloud auth application-default login`) or Workload Identity
 *   - User already created in Firebase Authentication (Email/Password)
 */
import admin from "firebase-admin";

const [email, role] = process.argv.slice(2);
if (!email || !["staff", "demo_admin"].includes(role)) {
  console.error(
    "Usage: node scripts/seed-staff-claims.mjs <email> <staff|demo_admin>"
  );
  process.exit(1);
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  console.error("Set GOOGLE_CLOUD_PROJECT before running this script.");
  process.exit(1);
}

admin.initializeApp({ projectId });

const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { role });
console.log(`Assigned custom claim { role: "${role}" } to ${email} (${user.uid}).`);
