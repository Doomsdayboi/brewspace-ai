import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  claimSeatAtomic,
  rankAvailableSeats,
  updateFocusState,
} from "../services/flow";
import {
  createMatchProposal,
  getConnectSuggestions,
  respondToMatch,
} from "../services/connect";
import { handleGroupTableConflict, respondToCircle } from "../services/circles";
import { endVisitAtomic } from "../services/visit-lifecycle";
import {
  getSeat,
  listSeats,
  resetMemoryState,
  saveVisit,
} from "../store";
import type { Visit } from "../types";

function makeTestVisit(overrides: Partial<Visit> = {}): Visit {
  const now = new Date();
  const nowIso = now.toISOString();
  return {
    visitId: "test-visit-alex",
    cafeId: "roastery-co",
    userId: "test-user-alex",
    alias: "Alex",
    startedAt: nowIso,
    expiresAt: new Date(now.getTime() + 180 * 60_000).toISOString(),
    intents: ["FOCUS", "CONNECT", "CIRCLES"],
    interests: ["AI", "startups"],
    meetingGoal: "exchange_ideas",
    spacePreferences: {
      preferredZone: "QUIET",
      needsOutlet: true,
      minCapacity: 1,
      quietPreferred: true,
    },
    plannedDepartureAt: new Date(now.getTime() + 120 * 60_000).toISOString(),
    focusDurationMinutes: 60,
    focusUntil: null,
    availabilityWindows: [
      {
        startAt: nowIso,
        endAt: new Date(now.getTime() + 120 * 60_000).toISOString(),
      },
    ],
    connectOptIn: true,
    circlesOptIn: true,
    currentMode: "PLANNING",
    seatId: null,
    activeMatchId: null,
    activeCircleId: null,
    version: 1,
    updatedAt: nowIso,
    ...overrides,
  };
}

describe("Phase 3 — Flow, Connect, Circles & Cross-Module Orchestration", () => {
  beforeEach(() => {
    process.env.BREWSPACE_STORE_MODE = "memory";
    resetMemoryState();
  });

  it("ranks quiet seat with outlet above quiet seat without outlet (PRD FR-102)", async () => {
    const seats = await listSeats("roastery-co");
    const ranked = rankAvailableSeats(seats, {
      preferredZone: "QUIET",
      needsOutlet: true,
      minCapacity: 1,
      quietPreferred: true,
    });
    assert.ok(ranked.length >= 2);
    assert.equal(ranked[0].seat.seatId, "Q3");
    assert.equal(ranked[0].seat.hasOutlet, true);
  });

  it("prevents double-booking under concurrent seat claims (PRD FR-103)", async () => {
    const alex = await saveVisit(makeTestVisit());
    const jordan = await saveVisit(
      makeTestVisit({
        visitId: "test-visit-jordan",
        userId: "test-user-jordan",
        alias: "Jordan",
      })
    );

    const first = await claimSeatAtomic(alex.visitId, "Q3");
    assert.equal(first.ok, true);
    assert.equal(first.visit?.seatId, "Q3");
    assert.equal(first.visit?.currentMode, "FOCUSING");

    const second = await claimSeatAtomic(jordan.visitId, "Q3");
    assert.equal(second.ok, false);
    assert.equal(second.conflict, true);
    assert.ok((second.alternatives?.length ?? 0) > 0);
  });

  it("suppresses Connect suggestions during FOCUSING and unlocks after finishing focus (PRD FR-104)", async () => {
    const alex = await saveVisit(makeTestVisit({ currentMode: "FOCUSING" }));
    const duringFocus = await getConnectSuggestions(alex);
    assert.equal(duringFocus.suppressedReason, "FOCUSING");
    assert.equal(duringFocus.candidates.length, 0);

    const afterFocus = await updateFocusState(alex.visitId, "finish");
    assert.equal(afterFocus?.currentMode, "AVAILABLE");

    const suggestions = await getConnectSuggestions(afterFocus!);
    assert.equal(suggestions.suppressedReason, undefined);
    assert.ok(suggestions.candidates.length >= 1);
  });

  it("enforces mutual acceptance before disclosing alias or meetup instructions (PRD FR-204)", async () => {
    const alex = await saveVisit(makeTestVisit({ currentMode: "AVAILABLE" }));
    const proposed = await createMatchProposal(alex, "seed-visit-sam");
    assert.equal(proposed.ok, true);
    assert.equal(proposed.match?.status, "PENDING_OTHER");
    assert.equal(proposed.match?.partnerAlias, null);
    assert.equal(proposed.match?.meetupInstructions, null);

    // Sam accepts
    const sam = makeTestVisit({
      visitId: "seed-visit-sam",
      userId: "seed-user-sam",
      alias: "Sam",
      currentMode: "AVAILABLE",
    });
    const accepted = await respondToMatch(sam, proposed.match!.matchId, "ACCEPT");
    assert.equal(accepted.ok, true);
    assert.equal(accepted.match?.status, "MUTUALLY_CONFIRMED");
    assert.equal(accepted.match?.partnerAlias, "Alex");
    assert.ok(accepted.match?.meetupInstructions?.includes("Front Tasting Counter"));
  });

  it("activates Coffee Circle at quorum (3), holds a GROUP table, and relocates on table conflict (PRD FR-303 & Journey D)", async () => {
    const alex = await saveVisit(makeTestVisit({ currentMode: "AVAILABLE" }));
    const joined = await respondToCircle(alex, "circle-ai-builders", "JOIN");
    assert.equal(joined.ok, true);
    assert.equal(joined.circle?.status, "CONFIRMED");
    assert.ok(joined.circle?.seatId);
    const initialTable = joined.circle!.seatId!;

    const heldSeat = await getSeat(initialTable);
    assert.equal(heldSeat?.status, "HELD_FOR_CIRCLE");

    // Staff marks held group table unavailable -> relocates automatically to another GROUP table
    const conflict = await handleGroupTableConflict("roastery-co", initialTable);
    assert.equal(conflict.relocated, true);
    assert.ok(conflict.newSeatId);
    assert.notEqual(conflict.newSeatId, initialTable);
  });

  it("releases seat and circle holds cleanly on End Visit (IA S05)", async () => {
    const alex = await saveVisit(makeTestVisit());
    await claimSeatAtomic(alex.visitId, "Q3");
    const ended = await endVisitAtomic(alex.visitId);
    assert.equal(ended?.currentMode, "ENDED");
    const seatAfter = await getSeat("Q3");
    assert.equal(seatAfter?.status, "AVAILABLE");
  });
});
