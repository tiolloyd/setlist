import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, codeVerifier, redirectUri } = await req.json();

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  if (!clientSecret) {
    return NextResponse.json({ error: "SPOTIFY_CLIENT_SECRET not configured" }, { status: 500 });
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
