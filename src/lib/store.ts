import type {
  BrewSpaceEvent,
  Cafe,
  Circle,
  CircleRsvp,
  Match,
  Seat,
  Visit,
} from "./types";
import {
  createSeedCafe,
  createSeedCircles,
  createSeedDemoVisits,
  createSeedSeats,
  DEFAULT_CAFE_ID,
} from "./seed-data";

export interface MemoryState {
  cafes: Map<string, Cafe>;
  seats: Map<string, Seat>;
  visits: Map<string, Visit>;
  matches: Map<string, Match>;
  circles: Map<string, Circle>;
  rsvps: Map<string, CircleRsvp>;
  events: BrewSpaceEvent[];
}

declare global {
  // eslint-disable-next-line no-var
  var __brewspaceMemoryState: MemoryState | undefined;
}

function buildSeededMemoryState(): MemoryState {
  const now = new Date();
  const nowIso = now.toISOString();
  const cafe = createSeedCafe();
  const seats = createSeedSeats(nowIso);
  const visits = createSeedDemoVisits(now);
  const circles = createSeedCircles(now);

  const state: MemoryState = {
    cafes: new Map([[cafe.cafeId, cafe]]),
    seats: new Map(seats.map((s) => [s.seatId, s])),
    visits: new Map(visits.map((v) => [v.visitId, v])),
    matches: new Map(),
    circles: new Map(circles.map((c) => [c.circleId, c])),
    rsvps: new Map(),
    events: [
      {
        eventId: "evt-seed-init",
        cafeId: DEFAULT_CAFE_ID,
        type: "VISIT_STARTED",
        entityId: DEFAULT_CAFE_ID,
        version: 1,
        summary: "Seeded Roastery & Co. floor plan and 4 consenting demo visitors.",
        occurredAt: nowIso,
      },
    ],
  };

  for (const circle of circles) {
    for (const userId of circle.participantUserIds) {
      const visit = visits.find((v) => v.userId === userId);
      if (visit) {
        const rsvpId = `${circle.circleId}__${userId}`;
        state.rsvps.set(rsvpId, {
          rsvpId,
          circleId: circle.circleId,
          cafeId: circle.cafeId,
          userId,
          visitId: visit.visitId,
          status: "ACCEPTED",
          respondedAt: nowIso,
        });
      }
    }
  }

  return state;
}

export function getMemoryState(): MemoryState {
  if (!globalThis.__brewspaceMemoryState) {
    globalThis.__brewspaceMemoryState = buildSeededMemoryState();
  }
  return globalThis.__brewspaceMemoryState;
}

export function resetMemoryState(): MemoryState {
  globalThis.__brewspaceMemoryState = buildSeededMemoryState();
  return globalThis.__brewspaceMemoryState;
}

export function isFirestoreEnabled(): boolean {
  if (process.env.BREWSPACE_STORE_MODE === "memory") return false;
  if (process.env.BREWSPACE_STORE_MODE === "firestore") return true;
  return Boolean(process.env.K_SERVICE && process.env.GOOGLE_CLOUD_PROJECT);
}

let firestoreInstance: FirebaseFirestore.Firestore | null = null;

export async function getFirestoreDb(): Promise<FirebaseFirestore.Firestore> {
  if (firestoreInstance) return firestoreInstance;
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  }
  firestoreInstance = admin.firestore();
  return firestoreInstance;
}

// ============================================================================
// Cafes & Seats
// ============================================================================

export async function getCafe(cafeId: string): Promise<Cafe | null> {
  if (!isFirestoreEnabled()) {
    return getMemoryState().cafes.get(cafeId) ?? null;
  }
  const db = await getFirestoreDb();
  const snap = await db.collection("cafes").doc(cafeId).get();
  if (!snap.exists) {
    if (cafeId === DEFAULT_CAFE_ID) {
      const seed = createSeedCafe();
      await db.collection("cafes").doc(cafeId).set(seed);
      return seed;
    }
    return null;
  }
  return snap.data() as Cafe;
}

export async function listSeats(cafeId: string): Promise<Seat[]> {
  if (!isFirestoreEnabled()) {
    return Array.from(getMemoryState().seats.values()).filter(
      (s) => s.cafeId === cafeId
    );
  }
  const db = await getFirestoreDb();
  const snap = await db.collection("seats").where("cafeId", "==", cafeId).get();
  if (snap.empty && cafeId === DEFAULT_CAFE_ID) {
    const seeded = createSeedSeats(new Date().toISOString());
    const batch = db.batch();
    for (const s of seeded) {
      batch.set(db.collection("seats").doc(s.seatId), s);
    }
    await batch.commit();
    return seeded;
  }
  return snap.docs.map((d) => d.data() as Seat);
}

export async function getSeat(seatId: string): Promise<Seat | null> {
  if (!isFirestoreEnabled()) {
    return getMemoryState().seats.get(seatId) ?? null;
  }
  const db = await getFirestoreDb();
  const snap = await db.collection("seats").doc(seatId).get();
  return snap.exists ? (snap.data() as Seat) : null;
}

export async function saveSeat(seat: Seat): Promise<Seat> {
  if (!isFirestoreEnabled()) {
    getMemoryState().seats.set(seat.seatId, seat);
    return seat;
  }
  const db = await getFirestoreDb();
  await db.collection("seats").doc(seat.seatId).set(seat, { merge: true });
  return seat;
}

// ============================================================================
// Visits
// ============================================================================

export async function getActiveVisitForUser(
  userId: string,
  cafeId?: string
): Promise<Visit | null> {
  if (!isFirestoreEnabled()) {
    const now = Date.now();
    for (const v of getMemoryState().visits.values()) {
      if (
        v.userId === userId &&
        v.currentMode !== "ENDED" &&
        new Date(v.expiresAt).getTime() > now &&
        (!cafeId || v.cafeId === cafeId)
      ) {
        return v;
      }
    }
    return null;
  }
  const db = await getFirestoreDb();
  let q = db
    .collection("visits")
    .where("userId", "==", userId)
    .where("currentMode", "!=", "ENDED");
  if (cafeId) {
    q = q.where("cafeId", "==", cafeId);
  }
  const snap = await q.limit(5).get();
  const now = Date.now();
  for (const doc of snap.docs) {
    const v = doc.data() as Visit;
    if (new Date(v.expiresAt).getTime() > now) return v;
  }
  return null;
}

export async function listActiveVisits(cafeId: string): Promise<Visit[]> {
  const now = Date.now();
  if (!isFirestoreEnabled()) {
    return Array.from(getMemoryState().visits.values()).filter(
      (v) =>
        v.cafeId === cafeId &&
        v.currentMode !== "ENDED" &&
        new Date(v.expiresAt).getTime() > now
    );
  }
  const db = await getFirestoreDb();
  const snap = await db
    .collection("visits")
    .where("cafeId", "==", cafeId)
    .where("currentMode", "!=", "ENDED")
    .get();
  return snap.docs
    .map((d) => d.data() as Visit)
    .filter((v) => new Date(v.expiresAt).getTime() > now);
}

export async function getVisitById(visitId: string): Promise<Visit | null> {
  if (!isFirestoreEnabled()) {
    return getMemoryState().visits.get(visitId) ?? null;
  }
  const db = await getFirestoreDb();
  const snap = await db.collection("visits").doc(visitId).get();
  return snap.exists ? (snap.data() as Visit) : null;
}

export async function saveVisit(visit: Visit): Promise<Visit> {
  if (!isFirestoreEnabled()) {
    getMemoryState().visits.set(visit.visitId, visit);
    return visit;
  }
  const db = await getFirestoreDb();
  await db.collection("visits").doc(visit.visitId).set(visit, { merge: true });
  return visit;
}

// ============================================================================
// Matches (Café Connect)
// ============================================================================

export async function listMatchesForUser(
  cafeId: string,
  userId: string
): Promise<Match[]> {
  if (!isFirestoreEnabled()) {
    return Array.from(getMemoryState().matches.values()).filter(
      (m) => m.cafeId === cafeId && m.participantIds.includes(userId)
    );
  }
  const db = await getFirestoreDb();
  const snap = await db
    .collection("matches")
    .where("cafeId", "==", cafeId)
    .where("participantIds", "array-contains", userId)
    .get();
  return snap.docs.map((d) => d.data() as Match);
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  if (!isFirestoreEnabled()) {
    return getMemoryState().matches.get(matchId) ?? null;
  }
  const db = await getFirestoreDb();
  const snap = await db.collection("matches").doc(matchId).get();
  return snap.exists ? (snap.data() as Match) : null;
}

export async function saveMatch(match: Match): Promise<Match> {
  if (!isFirestoreEnabled()) {
    getMemoryState().matches.set(match.matchId, match);
    return match;
  }
  const db = await getFirestoreDb();
  await db.collection("matches").doc(match.matchId).set(match, { merge: true });
  return match;
}

// ============================================================================
// Circles & RSVPs (Coffee Circles)
// ============================================================================

export async function listCircles(cafeId: string): Promise<Circle[]> {
  if (!isFirestoreEnabled()) {
    return Array.from(getMemoryState().circles.values()).filter(
      (c) => c.cafeId === cafeId
    );
  }
  const db = await getFirestoreDb();
  const snap = await db
    .collection("circles")
    .where("cafeId", "==", cafeId)
    .get();
  if (snap.empty && cafeId === DEFAULT_CAFE_ID) {
    const seeded = createSeedCircles(new Date());
    const batch = db.batch();
    for (const c of seeded) {
      batch.set(db.collection("circles").doc(c.circleId), c);
    }
    await batch.commit();
    return seeded;
  }
  return snap.docs.map((d) => d.data() as Circle);
}

export async function getCircleById(circleId: string): Promise<Circle | null> {
  if (!isFirestoreEnabled()) {
    return getMemoryState().circles.get(circleId) ?? null;
  }
  const db = await getFirestoreDb();
  const snap = await db.collection("circles").doc(circleId).get();
  return snap.exists ? (snap.data() as Circle) : null;
}

export async function saveCircle(circle: Circle): Promise<Circle> {
  if (!isFirestoreEnabled()) {
    getMemoryState().circles.set(circle.circleId, circle);
    return circle;
  }
  const db = await getFirestoreDb();
  await db.collection("circles").doc(circle.circleId).set(circle, { merge: true });
  return circle;
}

export async function saveRsvp(rsvp: CircleRsvp): Promise<CircleRsvp> {
  if (!isFirestoreEnabled()) {
    getMemoryState().rsvps.set(rsvp.rsvpId, rsvp);
    return rsvp;
  }
  const db = await getFirestoreDb();
  await db.collection("rsvps").doc(rsvp.rsvpId).set(rsvp, { merge: true });
  return rsvp;
}

// ============================================================================
// Operational Events
// ============================================================================

export async function recordEvent(event: BrewSpaceEvent): Promise<void> {
  if (!isFirestoreEnabled()) {
    const state = getMemoryState();
    state.events.unshift(event);
    if (state.events.length > 100) state.events.length = 100;
    return;
  }
  const db = await getFirestoreDb();
  await db.collection("events").doc(event.eventId).set(event);
}

export async function listEvents(
  cafeId: string,
  limitCount = 25
): Promise<BrewSpaceEvent[]> {
  if (!isFirestoreEnabled()) {
    return getMemoryState()
      .events.filter((e) => e.cafeId === cafeId)
      .slice(0, limitCount);
  }
  const db = await getFirestoreDb();
  const snap = await db
    .collection("events")
    .where("cafeId", "==", cafeId)
    .orderBy("occurredAt", "desc")
    .limit(limitCount)
    .get();
  return snap.docs.map((d) => d.data() as BrewSpaceEvent);
}
