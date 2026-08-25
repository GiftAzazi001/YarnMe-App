import { NextResponse } from "next/server";
import { handleAudioRequest } from "@/lib/server-audio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const result = await handleAudioRequest(await request.json().catch(() => null));

    if (result.ok === false) {
      return NextResponse.json(result.data, { status: result.status });
    }

    return new Response(result.audio, {
      status: result.status,
      headers: result.headers,
    });
  } catch (error) {
    console.error("[YarnMe] Unhandled error in /api/audio route:", error);
    return NextResponse.json(
      {
        error: "Audio isn't available right now.",
      },
      { status: 500 },
    );
  }
}
