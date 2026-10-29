import { NextResponse } from "next/server";
import {
  getCronSchedule,
  isDatabaseKeepAliveEnabled,
  pingDatabase,
  verifyCronSecret,
} from "@/lib/keep-alive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isDatabaseKeepAliveEnabled()) {
    return NextResponse.json(
      { ok: false, enabled: false, message: "Database keep-alive is disabled." },
      { status: 404 },
    );
  }

  if (!verifyCronSecret(request.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pingDatabase();
    return NextResponse.json({
      enabled: true,
      schedule: getCronSchedule(),
      ...result,
      at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database ping failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
