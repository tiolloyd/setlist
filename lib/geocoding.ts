import type { LocationData } from "@/types";

/**
 * Geocode a city name or ZIP code to lat/lng using Nominatim (OpenStreetMap).
 * Rate limit: 1 request/second max — acceptable for user-initiated searches.
 */
export async function geocodeQuery(query: string): Promise<LocationData | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    addressdetails: "1",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        // Nominatim requires a valid User-Agent
        "User-Agent": "ConcertPlaylistApp/1.0 (tiolloyd@gmail.com)",
        "Accept-Language": "en",
      },
    }
  );

  if (!res.ok) {
    console.error("Nominatim error:", res.status, res.statusText);
    return null;
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    return null;
  }

  const result = data[0];
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name,
  };
}
