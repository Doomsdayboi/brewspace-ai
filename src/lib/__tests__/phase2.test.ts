import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deterministicFallbackParse } from "../gemini";
import { CreateVisitSchema, ParsedIntentSchema } from "../schemas";
import { signSessionPayload, verifySessionToken } from "../auth-server";

describe("Phase 2 — Schemas, Auth, and Intent Parsing", () => {
  it("parses mixed focus-then-connect request accurately in fallback mode", () => {
    const result = deterministicFallbackParse(
      "Work quietly for 45 minutes with an outlet, then meet AI developers"
    );
    assert.ok(result.intents.includes("FOCUS"));
    assert.ok(result.intents.includes("CONNECT"));
    assert.equal(result.focusDurationMinutes, 45);
    assert.ok(result.interests.includes("AI"));
    assert.equal(result.spacePreferences.needsOutlet, true);
    assert.equal(result.spacePreferences.preferredZone, "QUIET");
    assert.equal(result.wantsSocialLater, true);
  });

  it("rejects unknown fields in ParsedIntentSchema (PRD FR-003)", () => {
    const res = ParsedIntentSchema.safeParse({
      intents: ["FOCUS"],
      focusDurationMinutes: 60,
      totalStayMinutes: 90,
      interests: ["AI"],
      meetingGoal: null,
      spacePreferences: {
        preferredZone: "QUIET",
        needsOutlet: true,
        minCapacity: 1,
        quietPreferred: true,
      },
      wantsSocialLater: false,
      summary: "Focus for an hour.",
      clarificationNeeded: null,
      injectedAdminFlag: true,
    });
    assert.equal(res.success, false);
  });

  it("defaults social consents to false in CreateVisitSchema (PRD FR-006)", () => {
    const res = CreateVisitSchema.parse({
      cafeId: "roastery-co",
      intents: ["FOCUS"],
      spacePreferences: {
        preferredZone: "QUIET",
        needsOutlet: true,
        minCapacity: 1,
        quietPreferred: true,
      },
    });
    assert.equal(res.connectOptIn, false);
    assert.equal(res.circlesOptIn, false);
  });

  it("signs and verifies guest session tokens and rejects tampering (PRD FR-002)", () => {
    const token = signSessionPayload({
      userId: "guest-123",
      alias: "Alex",
      role: "visitor",
    });
    const verified = verifySessionToken(token);
    assert.deepEqual(verified, {
      userId: "guest-123",
      alias: "Alex",
      role: "visitor",
    });

    const tampered = `${token.slice(0, -2)}xx`;
    assert.equal(verifySessionToken(tampered), null);
  });
});
