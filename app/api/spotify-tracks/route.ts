import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { playlistId, accessToken, uris } = await req.json();

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data, { status: res.status });
}
