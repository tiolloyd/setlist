import { NextRequest, NextResponse } from "next/server";
import { fetchConcerts } from "@/lib/ticketmaster";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseInt(searchParams.get("radius") ?? "50", 10);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required query parameters" },
      { status: 400 }
    );
  }

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required query parameters" },
      { status: 400 }
    );
  }

  try {
    const artists = await fetchConcerts({ lat, lng, radius, startDate, endDate });
    return NextResponse.json({ artists });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/concerts] Error:", message);

    if (message.includes("not configured")) {
      return NextResponse.json(
        { error: "Ticketmaster API key not configured. See .env.local." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch concert data", details: message },
      { status: 502 }
    );
  }
}
