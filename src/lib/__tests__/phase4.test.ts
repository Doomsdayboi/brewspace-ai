import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleGroupTableConflict, respondToCircle } from "../services/circles";
import { getSeat, listSeats, resetMemoryState, saveSeat, saveVisit } from "../store";
import type { Visit } from "../types";

describe("Phase 4 — Staff Conflict Resolution & Clean Cancellation", () => {
  beforeEach(() => {
    process.env.BREWSPACE_STORE_MODE = "memory";
    resetMemoryState();
  });

  it("cancels a Coffee Circle cleanly when NO alternative GROUP table is available (Journey D edge case)", async () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const alex: Visit = {
      visitId: "test-visit-alex-p4",
      cafeId: "roastery-co",
      userId: "test-user-alex-p4",
      alias: "Alex",
      startedAt: nowIso,
      expiresAt: new Date(now.getTime() + 180 * 60_000).toISOString(),
      intents: ["CIRCLES"],
      interests: ["AI"],
      spacePreferences: {
        preferredZone: "GROUP",
        needsOutlet: false,
        minCapacity: 1,
        quietPreferred: false,
      },
      availabilityWindows: [{ startAt: nowIso, endAt: new Date(now.getTime() + 120 * 60_000).toISOString() }],
      connectOptIn: false,
      circlesOptIn: true,
      currentMode: "AVAILABLE",
      seatId: null,
      activeMatchId: null,
      activeCircleId: null,
      version: 1,
      updatedAt: nowIso,
    };
    await saveVisit(alex);

    const joined = await respondToCircle(alex, "circle-ai-builders", "JOIN");
    assert.equal(joined.ok, true);
    const heldTable = joined.circle!.seatId!;

    // Staff marks ALL other GROUP tables occupied first
    const seats = await listSeats("roastery-co");
    for (const s of seats) {
      if (s.zone === "GROUP" && s.seatId !== heldTable) {
        await saveSeat({ ...s, status: "OCCUPIED", version: s.version + 1 });
      }
    }

    // Now staff marks the held group table occupied -> must cancel cleanly, never double-book
    const held = await getSeat(heldTable);
    await saveSeat({ ...held!, status: "OCCUPIED", heldByCircleId: null });

    const res = await handleGroupTableConflict("roastery-co", heldTable);
    assert.equal(res.relocated, false);
    assert.equal(res.canceled, true);
    assert.equal(res.circle?.status, "CANCELED");
    assert.equal(res.circle?.seatId, null);
  });
});
