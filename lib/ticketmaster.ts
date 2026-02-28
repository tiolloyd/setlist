import type { Artist, ConcertDate } from "@/types";

interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    attractions?: Array<{ id: string; name: string; images?: Array<{ url: string; ratio: string; width: number }> }>;
    venues?: Array<{ name: string; city?: { name: string }; state?: { name: string } }>;
  };
}

interface TicketmasterResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  page?: {
    totalElements: number;
    totalPages: number;
  };
}

export interface ArtistWithConcerts {
  id: string;
  name: string;
  imageUrl?: string;
  concertCount: number;
  dates: ConcertDate[];
}

export async function fetchConcerts(params: {
  lat: number;
  lng: number;
  radius: number;
  startDate: string;
  endDate: string;
}): Promise<ArtistWithConcerts[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    throw new Error("TICKETMASTER_API_KEY is not configured");
  }

  const { lat, lng, radius, startDate, endDate } = params;

  const startDateTime = `${startDate}T00:00:00Z`;
  const endDateTime = `${endDate}T23:59:59Z`;

  const query = new URLSearchParams({
    apikey: apiKey,
    latlong: `${lat},${lng}`,
    radius: String(radius),
    unit: "miles",
    classificationName: "music",
    startDateTime,
    endDateTime,
    size: "50",
    sort: "date,asc",
  });

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${query}`,
    { next: { revalidate: 300 } } // Cache for 5 minutes
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Ticketmaster API error:", res.status, errorText);
    throw new Error(`Ticketmaster API returned ${res.status}`);
  }

  const data: TicketmasterResponse = await res.json();
  const events = data._embedded?.events ?? [];

  // Build a map of artist → concerts
  const artistMap = new Map<string, ArtistWithConcerts>();

  for (const event of events) {
    const attractions = event._embedded?.attractions ?? [];
    const venues = event._embedded?.venues ?? [];
    const venueName = venues[0]?.name ?? "Unknown Venue";
    const venueCity = venues[0]?.city?.name;

    const concertDate: ConcertDate = {
      localDate: event.dates.start.localDate,
      localTime: event.dates.start.localTime,
      venueName,
      venueCity,
    };

    for (const attraction of attractions) {
      const existing = artistMap.get(attraction.id);
      if (existing) {
        existing.concertCount++;
        existing.dates.push(concertDate);
      } else {
        const image = attraction.images?.find((img) => img.ratio === "16_9" && img.width >= 640);
        artistMap.set(attraction.id, {
          id: attraction.id,
          name: attraction.name,
          imageUrl: image?.url,
          concertCount: 1,
          dates: [concertDate],
        });
      }
    }
  }

  // Sort by earliest concert date
  const artists = Array.from(artistMap.values()).sort((a, b) => {
    const aDate = a.dates[0]?.localDate ?? "";
    const bDate = b.dates[0]?.localDate ?? "";
    return aDate.localeCompare(bDate);
  });

  return artists;
}
