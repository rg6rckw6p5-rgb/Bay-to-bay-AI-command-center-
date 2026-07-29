import { NextResponse } from "next/server";
import { configurationStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const status = configurationStatus();
  return NextResponse.json(
    {
      status: status.configured ? "ready" : "configuration_required",
      configured: status.configured,
      missing: status.missing,
      timestamp: new Date().toISOString(),
    },
    { status: status.configured ? 200 : 503 },
  );
}
