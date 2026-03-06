import { NextRequest, NextResponse } from "next/server";

// Always return status 200 so the client can read the JSON body.
// Never expose Spotify's raw error response (which contains strings like INVALID_CLIENT).
const ERROR_RESPONSE = NextResponse.json({ error: true }, { status: 200 });

export async function POST(req: NextRequest) {
  try {
    let body: { code?: unknown; codeVerifier?: unknown; redirectUri?: unknown };
    try {
      body = await req.json();
    } catch {
      return ERROR_RESPONSE;
    }

    const { code, codeVerifier, redirectUri } = body;

    if (
      typeof code !== "string" ||
      typeof codeVerifier !== "string" ||
      typeof redirectUri !== "string"
    ) {
      return ERROR_RESPONSE;
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return ERROR_RESPONSE;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    let spotifyRes: Response;
    try {
      spotifyRes = await fetch("https://accounts.spotify.com/api/token", {
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
    } catch {
      return ERROR_RESPONSE;
    }

    if (!spotifyRes.ok) {
      return ERROR_RESPONSE;
    }

    let data: unknown;
    try {
      data = await spotifyRes.json();
    } catch {
      return ERROR_RESPONSE;
    }

    // If Spotify returned an error field inside a 200-ish response, reject it
    if (
      typeof data !== "object" ||
      data === null ||
      "error" in data
    ) {
      return ERROR_RESPONSE;
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return ERROR_RESPONSE;
  }
}
