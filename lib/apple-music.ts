/**
 * Apple Music integration using MusicKit JS (client-side).
 * The developer token is fetched server-side from /api/apple-music-token.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MusicKit: any;
  }
}

let musicKitLoaded = false;

export async function loadMusicKit(): Promise<void> {
  if (musicKitLoaded || typeof window === "undefined") return;
  if (window.MusicKit) {
    musicKitLoaded = true;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    script.async = true;
    script.onload = () => {
      musicKitLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load MusicKit JS"));
    document.head.appendChild(script);
  });

  // Wait for MusicKit to be ready
  await new Promise<void>((resolve) => {
    if (window.MusicKit) return resolve();
    document.addEventListener("musickitloaded", () => resolve(), { once: true });
  });
}

export async function getDeveloperToken(): Promise<string> {
  const res = await fetch("/api/apple-music-token");
  if (!res.ok) {
    throw new Error("Failed to fetch Apple Music developer token");
  }
  const data = await res.json();
  return data.token;
}

export async function configureMusicKit(developerToken: string): Promise<void> {
  const appName = process.env.NEXT_PUBLIC_APPLE_APP_NAME ?? "ConcertPlaylist";
  await window.MusicKit.configure({
    developerToken,
    app: {
      name: appName,
      build: "1.0.0",
    },
  });
}

export async function authorizeMusicKit(): Promise<string> {
  const music = window.MusicKit.getInstance();
  const userToken = await music.authorize();
  if (!userToken) throw new Error("Apple Music authorization failed or was cancelled");
  return userToken;
}

export async function searchAppleMusicTracks(
  musicInstance: unknown,
  artistName: string,
  limit = 5
): Promise<Array<{ id: string; type: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const music = musicInstance as any;
  const storefront = music.storefrontId ?? "us";

  const params = new URLSearchParams({
    term: artistName,
    types: "songs",
    limit: String(limit),
  });

  const result = await music.api.music(`/v1/catalog/${storefront}/search?${params}`);
  const songs = result?.data?.results?.songs?.data ?? [];
  return songs.map((s: { id: string }) => ({ id: s.id, type: "songs" })) as Array<{ id: string; type: string }>;
}

export async function createAppleMusicPlaylist(
  musicInstance: unknown,
  name: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const music = musicInstance as any;
  const result = await music.api.music("/v1/me/library/playlists", {
    fetchOptions: {
      method: "POST",
      body: JSON.stringify({
        attributes: {
          name,
          description: "Artists playing near you — created by Concert Playlist App",
        },
      }),
    },
  });
  const playlist = result?.data?.data?.[0];
  if (!playlist?.id) throw new Error("Failed to create Apple Music playlist");
  return playlist.id;
}

export async function addTracksToAppleMusicPlaylist(
  musicInstance: unknown,
  playlistId: string,
  tracks: Array<{ id: string; type: string }>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const music = musicInstance as any;
  const chunks: Array<Array<{ id: string; type: string }>> = [];
  for (let i = 0; i < tracks.length; i += 25) {
    chunks.push(tracks.slice(i, i + 25));
  }
  for (const chunk of chunks) {
    await music.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {
      fetchOptions: {
        method: "POST",
        body: JSON.stringify({ data: chunk }),
      },
    });
  }
}

export async function buildAppleMusicPlaylist(params: {
  artistNames: string[];
  playlistName: string;
  onProgress?: (msg: string) => void;
}): Promise<{ playlistId: string; trackCount: number }> {
  const { artistNames, playlistName, onProgress } = params;

  onProgress?.("Loading MusicKit JS…");
  await loadMusicKit();

  onProgress?.("Fetching developer token…");
  const developerToken = await getDeveloperToken();

  onProgress?.("Configuring Apple Music…");
  await configureMusicKit(developerToken);

  onProgress?.("Authorizing with Apple Music…");
  await authorizeMusicKit();

  const music = window.MusicKit.getInstance();

  onProgress?.("Creating playlist…");
  const playlistId = await createAppleMusicPlaylist(music, playlistName);

  const allTracks: Array<{ id: string; type: string }> = [];
  const batch = artistNames.slice(0, 20);

  for (const artist of batch) {
    onProgress?.(`Finding tracks for ${artist}…`);
    try {
      const tracks = await searchAppleMusicTracks(music, artist);
      allTracks.push(...tracks);
    } catch (err) {
      console.warn(`Could not find tracks for ${artist}:`, err);
    }
  }

  if (allTracks.length > 0) {
    onProgress?.(`Adding ${allTracks.length} tracks to playlist…`);
    await addTracksToAppleMusicPlaylist(music, playlistId, allTracks);
  }

  return { playlistId, trackCount: allTracks.length };
}
