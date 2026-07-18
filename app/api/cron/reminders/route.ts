import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Recurring/scheduled reminders were removed by request. Reminders are sent
// manually from the app (in-app nudges + one-tap WhatsApp). This endpoint is
// intentionally disabled and does nothing.
export async function GET() {
  return NextResponse.json({ disabled: true }, { status: 410 });
}
