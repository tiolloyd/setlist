# Concert Playlist App

Discover upcoming concerts near you and generate a playlist of those artists on your streaming service of choice.

Enter a location (or use GPS), pick a date range and search radius, choose a music service, and the app finds concerts via Ticketmaster then builds a playlist automatically.

## What it does

1. **Concert discovery** — searches Ticketmaster for events within a configurable radius and date window, deduplicates by artist, and displays up to 50 results
2. **Playlist creation** — searches Spotify or Apple Music for each artist's top tracks and adds them to a new playlist in your library
3. **Graceful fallback** — if Spotify's API blocks automatic track-adding (see limitation below), the playlist is still created and the app shows a list of tracks you can add manually

## Tech stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: Tailwind CSS, Radix UI primitives, shadcn/ui-style components (hand-written), Lucide icons
- **Concert data**: Ticketmaster Discovery API v2 (server-side proxy)
- **Geocoding**: Nominatim / OpenStreetMap (no API key required)
- **Spotify**: OAuth 2.0 Authorization Code + PKCE, with a server-side token exchange route to keep the client secret off the browser
- **Apple Music**: MusicKit JS v3 (loaded from Apple CDN) + server-side JWT signing via `jose`

## Music service status

| Service | Status | Notes |
|---|---|---|
| **Spotify** | Partially working | Auth, playlist creation, and track search all work. Adding tracks to the playlist returns 403 for apps in development mode — see limitation below. |
| **Apple Music** | Built, untested | All integration code is written. Blocked on obtaining Apple Developer credentials (Key ID, Team ID, private key). Will work once credentials are added to `.env.local`. |
| **Qobuz** | Not implemented | UI placeholder only. Requires a Qobuz partner/API agreement before any integration can be built. |

### Spotify API limitation

Spotify's Web API restricts the `POST /playlists/{id}/tracks` endpoint for apps that have not been granted **Extended Quota Mode**. Extended quota requires an active user base and an organisation account — it is not available to individual developer apps.

In practice this means: the app successfully authenticates, creates the playlist, and finds all the tracks, but the final step of adding tracks to the playlist returns `403 Forbidden`. The app handles this gracefully by showing the playlist link alongside a scrollable list of tracks so they can be added manually.

There is no workaround for this within Spotify's current API policy for development-mode apps.

## Running locally

### Prerequisites

- Node.js 18+
- A [Ticketmaster developer account](https://developer.ticketmaster.com/) (free)
- A [Spotify developer app](https://developer.spotify.com/dashboard) registered with redirect URI `http://127.0.0.1:3000/spotify-callback`

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Ticketmaster
TICKETMASTER_API_KEY=your_ticketmaster_key

# Spotify
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/spotify-callback
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Apple Music (optional — app works without these, Apple Music button will fail)
APPLE_MUSIC_KEY_ID=your_key_id
APPLE_MUSIC_TEAM_ID=your_team_id
APPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
NEXT_PUBLIC_APPLE_APP_NAME=ConcertPlaylist
```

**Spotify note**: the redirect URI must use `127.0.0.1`, not `localhost`. Spotify's dashboard treats them differently and `localhost` will return `INVALID_CLIENT`.

### 3. Start the dev server

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Project structure

```
app/
  page.tsx                        Home — search form
  layout.tsx                      Root layout
  globals.css                     Tailwind + CSS variables
  results/page.tsx                Concert results + playlist builder
  spotify-callback/page.tsx       Spotify OAuth callback (PKCE)
  api/concerts/route.ts           Ticketmaster proxy
  api/spotify-token/route.ts      Spotify token exchange (keeps client secret server-side)
  api/spotify-tracks/route.ts     Spotify add-tracks proxy
  api/apple-music-token/route.ts  Apple Music JWT generator
components/
  ConcertList.tsx
  PlaylistBuilder.tsx
  LocationInput.tsx
  RadiusSlider.tsx
  DateRangePicker.tsx
  ServiceSelector.tsx
  ui/                             button, card, badge, input, label, slider, separator
lib/
  spotify.ts
  apple-music.ts
  ticketmaster.ts
  geocoding.ts
  utils.ts
types/
  index.ts
```
