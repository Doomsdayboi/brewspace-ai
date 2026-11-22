import { NextResponse } from "next/server";
import { isFirestoreEnabled } from "@/lib/store";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "brewspace-web",
    store: isFirestoreEnabled() ? "firestore" : "memory",
    timestamp: new Date().toISOString(),
  });
}
