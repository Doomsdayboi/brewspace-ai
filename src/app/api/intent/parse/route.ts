import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-server";
import { parseVisitIntent } from "@/lib/gemini";
import { IntentParseInputSchema } from "@/lib/schemas";
import { getCafe } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Please start a guest session first." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = IntentParseInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please describe your café visit in 2–500 characters.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const cafe = await getCafe(parsed.data.cafeId);
    if (!cafe) {
      return NextResponse.json(
        { error: "This café link isn't available." },
        { status: 404 }
      );
    }

    const intent = await parseVisitIntent(parsed.data.message);
    return NextResponse.json({ intent });
  } catch {
    return NextResponse.json(
      { error: "Could not parse your request. You can fill in your plan manually." },
      { status: 400 }
    );
  }
}
