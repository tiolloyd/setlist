import { NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";

export async function GET() {
  const keyId = process.env.APPLE_MUSIC_KEY_ID;
  const teamId = process.env.APPLE_MUSIC_TEAM_ID;
  const privateKeyPem = process.env.APPLE_MUSIC_PRIVATE_KEY;

  if (!keyId || !teamId || !privateKeyPem) {
    return NextResponse.json(
      {
        error:
          "Apple Music credentials not configured. Set APPLE_MUSIC_KEY_ID, APPLE_MUSIC_TEAM_ID, and APPLE_MUSIC_PRIVATE_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  try {
    // Support both real newlines and escaped \n from environment variables
    const pem = privateKeyPem.replace(/\\n/g, "\n");
    const privateKey = await importPKCS8(pem, "ES256");

    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .setExpirationTime(now + 15 * 60) // 15 minutes
      .sign(privateKey);

    return NextResponse.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "JWT signing failed";
    console.error("[/api/apple-music-token] Error:", message);
    return NextResponse.json(
      {
        error: "Failed to generate Apple Music developer token",
        details: message,
      },
      { status: 500 }
    );
  }
}
