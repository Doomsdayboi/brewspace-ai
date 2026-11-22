import { z } from "zod";

export function sanitizeText(input: string, maxLen = 500): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export const IntentTypeSchema = z.enum(["FOCUS", "CONNECT", "CIRCLES", "RELAX"]);
export const SeatZoneSchema = z.enum(["QUIET", "GENERAL", "SOCIAL", "GROUP"]);
export const MeetingGoalSchema = z.enum([
  "learn",
  "exchange_ideas",
  "network",
  "casual",
]);

export const SpacePreferencesSchema = z
  .object({
    preferredZone: SeatZoneSchema.optional(),
    needsOutlet: z.boolean().default(false),
    minCapacity: z.number().int().min(1).max(8).default(1),
    quietPreferred: z.boolean().default(false),
  })
  .strict();

export const ParsedIntentSchema = z
  .object({
    intents: z.array(IntentTypeSchema).min(1).max(4),
    focusDurationMinutes: z.number().int().min(10).max(240).nullable(),
    totalStayMinutes: z.number().int().min(15).max(480).nullable(),
    interests: z.array(z.string().min(1).max(40)).max(8),
    meetingGoal: MeetingGoalSchema.nullable(),
    spacePreferences: SpacePreferencesSchema,
    wantsSocialLater: z.boolean(),
    summary: z.string().min(1).max(280),
    clarificationNeeded: z.string().max(180).nullable(),
  })
  .strict();

export const IntentParseInputSchema = z
  .object({
    cafeId: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
    message: z.string().min(2).max(500),
  })
  .strict();

export const SessionCreateSchema = z
  .object({
    alias: z.string().min(1).max(32),
  })
  .strict();

export const CreateVisitSchema = z
  .object({
    cafeId: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
    alias: z.string().min(1).max(32).optional(),
    intents: z.array(IntentTypeSchema).min(1).max(4),
    interests: z.array(z.string().min(1).max(40)).max(8).default([]),
    meetingGoal: MeetingGoalSchema.optional(),
    spacePreferences: SpacePreferencesSchema,
    focusDurationMinutes: z.number().int().min(10).max(240).nullable().optional(),
    totalStayMinutes: z.number().int().min(15).max(480).nullable().optional(),
    // Explicit separate consents — default OFF (PRD FR-006)
    connectOptIn: z.boolean().default(false),
    circlesOptIn: z.boolean().default(false),
  })
  .strict();

export const UpdateVisitSchema = z
  .object({
    intents: z.array(IntentTypeSchema).min(1).max(4).optional(),
    interests: z.array(z.string().min(1).max(40)).max(8).optional(),
    meetingGoal: MeetingGoalSchema.optional(),
    spacePreferences: SpacePreferencesSchema.optional(),
    focusDurationMinutes: z.number().int().min(10).max(240).nullable().optional(),
    connectOptIn: z.boolean().optional(),
    circlesOptIn: z.boolean().optional(),
    proactiveMuted: z.boolean().optional(),
  })
  .strict();
