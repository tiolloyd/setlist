export type MusicService = "spotify" | "apple-music" | "qobuz";

export interface LocationData {
  lat: number;
  lng: number;
  displayName: string;
}

export interface AppSettings {
  location: LocationData | null;
  radiusMiles: number;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  service: MusicService | null;
}

export interface ConcertDate {
  localDate: string;
  localTime?: string;
  venueName: string;
  venueCity?: string;
}

export interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
  concertCount: number;
  dates: ConcertDate[];
}

export interface Concert {
  id: string;
  name: string;
  artists: Artist[];
  venueName: string;
  venueCity: string;
  venueState: string;
  date: string;
  time?: string;
  imageUrl?: string;
}

export interface Track {
  id: string;
  name: string;
  artistName: string;
  uri: string; // spotify:track:xxx or Apple Music catalog ID
}

export interface SpotifyTrack {
  uri: string;
  name: string;
  artistName: string;
}

export interface FallbackTrack {
  name: string;
  artistName: string;
}

export interface PlaylistResult {
  id: string | null;
  name: string;
  url: string | null;
  trackCount: number;
  service: MusicService;
  fallbackTracks?: FallbackTrack[]; // present when any part of playlist creation fails
}

export type PlaylistStep =
  | "idle"
  | "authenticating"
  | "fetching-artists"
  | "searching-tracks"
  | "building-playlist"
  | "done"
  | "error";

export interface SpotifyTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}
