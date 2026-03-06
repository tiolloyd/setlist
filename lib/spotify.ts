import type { SpotifyTokens, SpotifyTrack, FallbackTrack } from "@/types";

const SPOTIFY_SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-private",
].join(" ");

const TOKEN_KEY = "spotify_tokens";
const VERIFIER_KEY = "spotify_code_verifier";

// ─── PKCE Helpers ────────────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let result = "";
  for (let i = 0; i < array.length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ─── Auth Flow ───────────────────────────────────────────────────────────────

export async function initiateSpotifyAuth(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ?? `${window.location.origin}/spotify-callback`;

  if (!clientId) {
    // Caller's catch block will handle this and show the fallback
    throw new Error("Spotify is not configured");
  }

  try {
    const verifier = generateRandomString(64);
    const challenge = base64urlEncode(await sha256(verifier));

    sessionStorage.setItem(VERIFIER_KEY, verifier);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: SPOTIFY_SCOPES,
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  } catch (err) {
    throw err;
  }
}

export async function exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ?? `${window.location.origin}/spotify-callback`;

  let verifier: string | null = null;
  try {
    verifier = sessionStorage.getItem(VERIFIER_KEY);
  } catch {
    throw new Error("Spotify connection failed");
  }

  if (!verifier) throw new Error("Spotify connection failed");

  // Exchange via server-side route so the client secret stays hidden
  let res: Response;
  try {
    res = await fetch("/api/spotify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, codeVerifier: verifier, redirectUri }),
    });
  } catch {
    throw new Error("Spotify connection failed");
  }

  // The route always returns 200 — a non-ok status means a server-level failure
  if (!res.ok) {
    throw new Error("Spotify connection failed");
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error("Spotify connection failed");
  }

  // Route returns { error: true } when token exchange fails for any reason
  if (data.error) {
    throw new Error("Spotify connection failed");
  }

  const tokens: SpotifyTokens = {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: Date.now() + (data.expires_in as number) * 1000,
  };

  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    sessionStorage.removeItem(VERIFIER_KEY);
  } catch {
    // sessionStorage failure is non-fatal — tokens still returned
  }

  return tokens;
}

export function getStoredTokens(): SpotifyTokens | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const tokens: SpotifyTokens = JSON.parse(raw);
    if (tokens.expiresAt < Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
}

// ─── Spotify API Calls ───────────────────────────────────────────────────────

async function spotifyFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    // Do NOT include Spotify's raw error body — it may contain INVALID_CLIENT etc.
    throw new Error(`Spotify API error ${res.status}`);
  }
  return res;
}

export async function getSpotifyUserId(accessToken: string): Promise<string> {
  const res = await spotifyFetch("/me", accessToken);
  const data = await res.json();
  return data.id;
}

export async function createSpotifyPlaylist(
  accessToken: string,
  userId: string,
  name: string
): Promise<string> {
  const res = await spotifyFetch(`/me/playlists`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      name,
      description: "Artists playing near you — created by Concert Playlist App",
      public: true,
    }),
  });
  const data = await res.json();
  return data.id;
}

export async function searchSpotifyTracks(
  accessToken: string,
  artistName: string,
  limit = 5
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: `artist:${artistName}`,
    type: "track",
    limit: String(limit),
  });
  const res = await spotifyFetch(`/search?${params}`, accessToken);
  const data = await res.json();
  const items = data.tracks?.items ?? [];
  return items.map((t: { uri: string; name: string; artists: Array<{ name: string }> }) => ({
    uri: t.uri,
    name: t.name,
    artistName: t.artists?.[0]?.name ?? artistName,
  }));
}

export async function addTracksToSpotifyPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  const chunks: string[][] = [];
  for (let i = 0; i < trackUris.length; i += 100) {
    chunks.push(trackUris.slice(i, i + 100));
  }
  for (const chunk of chunks) {
    const res = await fetch("/api/spotify-tracks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId, accessToken, uris: chunk }),
    });
    if (!res.ok) {
      throw new Error(`Failed to add tracks (${res.status})`);
    }
  }
}

// ─── Orchestration ───────────────────────────────────────────────────────────

export async function buildSpotifyPlaylist(params: {
  accessToken: string;
  artistNames: string[];
  playlistName: string;
  onProgress?: (msg: string) => void;
}): Promise<{
  playlistId: string | null;
  trackCount: number;
  url: string | null;
  fallbackTracks?: FallbackTrack[];
}> {
  const { accessToken, artistNames, playlistName, onProgress } = params;

  let playlistId: string | null = null;
  let url: string | null = null;

  // Step 1: get user profile
  let userId: string | null = null;
  try {
    onProgress?.("Getting your Spotify profile…");
    userId = await getSpotifyUserId(accessToken);
  } catch {
    // Auth or network failure — still attempt track search below
  }

  // Step 2: create playlist (requires valid userId)
  if (userId) {
    try {
      onProgress?.("Creating playlist…");
      playlistId = await createSpotifyPlaylist(accessToken, userId, playlistName);
      url = `https://open.spotify.com/playlist/${playlistId}`;
    } catch {
      // Fall through — still search for tracks
    }
  }

  // Step 3: search for tracks (keep full SpotifyTrack internally for URI-based adding)
  const allTracks: SpotifyTrack[] = [];
  const batch = artistNames.slice(0, 20);
  for (const artist of batch) {
    onProgress?.(`Finding tracks for ${artist}…`);
    try {
      const tracks = await searchSpotifyTracks(accessToken, artist);
      allTracks.push(...tracks);
    } catch {
      // Skip this artist
    }
  }

  // Step 4: add tracks to playlist
  if (playlistId && allTracks.length > 0) {
    onProgress?.(`Adding ${allTracks.length} tracks to playlist…`);
    try {
      await addTracksToSpotifyPlaylist(accessToken, playlistId, allTracks.map((t) => t.uri));
      return { playlistId, trackCount: allTracks.length, url };
    } catch {
      // Couldn't add tracks — surface them as a fallback list
      return {
        playlistId,
        url,
        trackCount: 0,
        fallbackTracks: allTracks.map((t) => ({ name: t.name, artistName: t.artistName })),
      };
    }
  }

  // Tracks found but no playlist (auth partially worked)
  if (allTracks.length > 0) {
    return {
      playlistId: null,
      url: null,
      trackCount: 0,
      fallbackTracks: allTracks.map((t) => ({ name: t.name, artistName: t.artistName })),
    };
  }

  // No tracks — either empty playlist was created or total failure
  return {
    playlistId,
    url,
    trackCount: 0,
    fallbackTracks: playlistId ? undefined : [],
  };
}
