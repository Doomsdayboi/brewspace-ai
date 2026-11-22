export type VisitMode =
  | "PLANNING"
  | "FOCUSING"
  | "AVAILABLE"
  | "IN_CONNECTION"
  | "IN_CIRCLE"
  | "ENDED";

export type SeatZone = "QUIET" | "GENERAL" | "SOCIAL" | "GROUP";

export type SeatStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "HELD_FOR_CIRCLE"
  | "UNAVAILABLE";

export type IntentType = "FOCUS" | "CONNECT" | "CIRCLES" | "RELAX";

export type MeetingGoal = "learn" | "exchange_ideas" | "network" | "casual";

export interface SpacePreferences {
  preferredZone?: SeatZone;
  needsOutlet: boolean;
  minCapacity: number;
  quietPreferred: boolean;
}

export interface AvailabilityWindow {
  startAt: string; // ISO-8601
  endAt: string; // ISO-8601
}

export interface Cafe {
  cafeId: string;
  name: string;
  neighborhood: string;
  timezone: string;
  hours: string;
  zones: SeatZone[];
  meetupAreaLabel: string; // Public designated area for confirmed 1:1 meetups
  visitExpiryMinutes: number;
}

export interface Seat {
  seatId: string;
  cafeId: string;
  label: string;
  zone: SeatZone;
  capacity: number;
  hasOutlet: boolean;
  features: string[];
  status: SeatStatus;
  claimedByVisitId?: string | null;
  heldByCircleId?: string | null;
  version: number;
  updatedAt: string;
}

export interface Visit {
  visitId: string;
  cafeId: string;
  userId: string;
  alias: string;
  startedAt: string;
  expiresAt: string;
  intents: IntentType[];
  interests: string[];
  meetingGoal?: MeetingGoal;
  spacePreferences: SpacePreferences;
  plannedDepartureAt?: string | null;
  focusDurationMinutes?: number | null;
  focusUntil?: string | null;
  availabilityWindows: AvailabilityWindow[];
  // Separate explicit consents — ALWAYS defaulted false (PRD FR-006)
  connectOptIn: boolean;
  circlesOptIn: boolean;
  currentMode: VisitMode;
  seatId?: string | null;
  activeMatchId?: string | null;
  activeCircleId?: string | null;
  proactiveMuted?: boolean;
  version: number;
  updatedAt: string;
}

export type MatchStatus =
  | "PROPOSED"
  | "PENDING_OTHER"
  | "MUTUALLY_CONFIRMED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"
  | "COMPLETED";

export interface Match {
  matchId: string;
  cafeId: string;
  participantIds: [string, string];
  participantVisitIds: [string, string];
  sharedInterests: string[];
  reason: string;
  proposedWindow: AvailabilityWindow;
  responseByUser: Record<string, "PENDING" | "ACCEPTED" | "DECLINED">;
  status: MatchStatus;
  // Disclosed ONLY when status === "MUTUALLY_CONFIRMED"
  meetupInstructions?: string | null;
  conversationStarter?: string | null;
  createdAt: string;
  expiresAt: string;
  version: number;
}

export type CircleStatus =
  | "PROPOSED"
  | "AWAITING_CONFIRMATIONS"
  | "CONFIRMED"
  | "ACTIVE"
  | "FULL"
  | "RESCHEDULED"
  | "CANCELED"
  | "COMPLETED";

export interface Circle {
  circleId: string;
  cafeId: string;
  topic: string;
  description: string;
  interestTags: string[];
  startAt: string;
  endAt: string;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  status: CircleStatus;
  seatId?: string | null;
  generalArea: string;
  participantUserIds: string[];
  conversationStarters: string[];
  statusNote?: string | null;
  createdBy: "AI_PROPOSED" | "STAFF";
  version: number;
  updatedAt: string;
}

export interface CircleRsvp {
  rsvpId: string;
  circleId: string;
  cafeId: string;
  userId: string;
  visitId: string;
  status: "ACCEPTED" | "DECLINED" | "CANCELED";
  respondedAt: string;
}

export type EventType =
  | "VISIT_STARTED"
  | "INTENT_UPDATED"
  | "FOCUS_STARTED"
  | "FOCUS_ENDED"
  | "SEAT_CHANGED"
  | "MATCH_PROPOSED"
  | "MATCH_ACCEPTED"
  | "CIRCLE_PROPOSED"
  | "CIRCLE_JOINED"
  | "CIRCLE_CONFIRMED"
  | "CIRCLE_RELOCATED"
  | "CIRCLE_CANCELED"
  | "VISIT_ENDED";

export interface BrewSpaceEvent {
  eventId: string;
  cafeId: string;
  type: EventType;
  entityId: string;
  version: number;
  summary: string;
  occurredAt: string;
}

export interface ParsedIntent {
  intents: IntentType[];
  focusDurationMinutes: number | null;
  totalStayMinutes: number | null;
  interests: string[];
  meetingGoal: MeetingGoal | null;
  spacePreferences: SpacePreferences;
  wantsSocialLater: boolean;
  summary: string;
  clarificationNeeded: string | null;
  source: "gemini" | "fallback";
}

export interface SessionUser {
  userId: string;
  alias: string;
  role: "visitor" | "staff" | "demo_admin";
}
