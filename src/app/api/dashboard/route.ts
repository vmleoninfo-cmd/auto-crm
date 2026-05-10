import { NextResponse } from "next/server";
import { getDashboardPayload } from "@/lib/dashboard";

export async function GET() {
  try {
    const payload = await getDashboardPayload();
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json(
      { error: `Error al generar dashboard: ${err instanceof Error ? err.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
