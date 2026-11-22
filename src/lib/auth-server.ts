import crypto from "crypto";
import { cookies } from "next/headers";
import type { SessionUser } from "./types";

const SESSION_COOKIE = "brewspace_sid";

function getSigningSecret(): string {
  return (
    process.env.BREWSPACE_DEMO_ADMIN_SECRET ||
    "brewspace-local-dev-ephemeral-secret"
  );
}

export function signSessionPayload(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");

  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as SessionUser;
    if (!parsed.userId || !parsed.alias || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Resolves the authenticated session from either:
 * 1. Firebase ID Token (`Authorization: Bearer <token>`) verified by Firebase Admin SDK
 * 2. Signed httpOnly guest session cookie (`brewspace_sid`)
 */
export async function getSessionUser(
  request?: Request
): Promise<SessionUser | null> {
  const authHeader = request?.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.slice(7).trim();
    if (idToken) {
      try {
        const admin = await import("firebase-admin");
        if (!admin.apps.length && process.env.GOOGLE_CLOUD_PROJECT) {
          admin.initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
        }
        if (admin.apps.length) {
          const decoded = await admin.auth().verifyIdToken(idToken);
          const role =
            decoded.role === "staff" || decoded.role === "demo_admin"
              ? decoded.role
              : "visitor";
          return {
            userId: decoded.uid,
            alias:
              (typeof decoded.name === "string" && decoded.name) ||
              (typeof decoded.email === "string" && decoded.email.split("@")[0]) ||
              "Guest",
            role,
          };
        }
      } catch {
        // Fall through to cookie check
      }
    }
  }

  const cookieStore = cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

export function setSessionCookie(user: SessionUser): void {
  const token = signSessionPayload(user);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}
