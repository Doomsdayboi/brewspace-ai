import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, setSessionCookie } from "@/lib/auth-server";

const StaffLoginSchema = z
  .object({
    accessKey: z.string().min(4).max(128),
    role: z.enum(["staff", "demo_admin"]).default("staff"),
  })
  .strict();

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user || (user.role !== "staff" && user.role !== "demo_admin")) {
    return NextResponse.json({ authorized: false, role: user?.role ?? null });
  }
  return NextResponse.json({ authorized: true, user });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = StaffLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid staff access key." },
        { status: 400 }
      );
    }

    const expectedSecret =
      process.env.BREWSPACE_DEMO_ADMIN_SECRET || "local-dev-only-change-me";

    if (!safeEqual(parsed.data.accessKey.trim(), expectedSecret)) {
      return NextResponse.json(
        { error: "You don't have access to this café console." },
        { status: 403 }
      );
    }

    const staffUser = {
      userId: `staff-${parsed.data.role}`,
      alias: parsed.data.role === "demo_admin" ? "Demo Admin" : "Café Operator",
      role: parsed.data.role,
    } as const;

    setSessionCookie(staffUser);
    return NextResponse.json({ authorized: true, user: staffUser });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
