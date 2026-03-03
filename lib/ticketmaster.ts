import type { ConcertDate } from "@/types";

interface TicketmasterClassification {
  primary?: boolean;
  segment?: { id: string; name: string };
  genre?: { id: string; name: string };
  subGenre?: { id: string; name: string };
}

interface TicketmasterEvent {
  id: string;
  name: string;
  classifications?: TicketmasterClassification[];
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    attractions?: Array<{
      id: string;
      name: string;
      images?: Array<{ url: string; ratio: string; width: number }>;
    }>;
    venues?: Array<{
      name: string;
      city?: { name: string };
      state?: { name: string };
    }>;
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

export interface GenreItem {
  id: string;
  name: string;
  subGenres: { id: string; name: string }[];
}

export interface ArtistWithConcerts {
  id: string;
  name: string;
  imageUrl?: string;
  concertCount: number;
  dates: ConcertDate[];
  genreIds: string[];
  subGenreIds: string[];
}

export interface ConcertResults {
  artists: ArtistWithConcerts[];
  genreTree: GenreItem[];
}

export async function fetchConcerts(params: {
  lat: number;
  lng: number;
  radius: number;
  startDate: string;
  endDate: string;
}): Promise<ConcertResults> {
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
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Ticketmaster API error:", res.status, errorText);
    throw new Error(`Ticketmaster API returned ${res.status}`);
  }

  const data: TicketmasterResponse = await res.json();
  const events = data._embedded?.events ?? [];

  // genre id → { ...GenreItem, subGenreIds: Set } for dedup
  const genreMap = new Map<
    string,
    { id: string; name: string; subGenres: { id: string; name: string }[]; subGenreSet: Set<string> }
  >();

  const artistMap = new Map<string, ArtistWithConcerts>();

  for (const event of events) {
    // Use primary classification, fall back to first
    const classification =
      event.classifications?.find((c) => c.primary) ??
      event.classifications?.[0];

    const rawGenre = classification?.genre;
    const rawSubGenre = classification?.subGenre;

    // Ticketmaster uses "Undefined" as a null placeholder
    const genre =
      rawGenre?.id && rawGenre.name && rawGenre.name !== "Undefined"
        ? rawGenre
        : null;
    const subGenre =
      rawSubGenre?.id && rawSubGenre.name && rawSubGenre.name !== "Undefined"
        ? rawSubGenre
        : null;

    // Build genre tree
    if (genre) {
      if (!genreMap.has(genre.id)) {
        genreMap.set(genre.id, {
          id: genre.id,
          name: genre.name,
          subGenres: [],
          subGenreSet: new Set(),
        });
      }
      if (subGenre) {
        const entry = genreMap.get(genre.id)!;
        if (!entry.subGenreSet.has(subGenre.id)) {
          entry.subGenreSet.add(subGenre.id);
          entry.subGenres.push({ id: subGenre.id, name: subGenre.name });
        }
      }
    }

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
        if (genre && !existing.genreIds.includes(genre.id)) {
          existing.genreIds.push(genre.id);
        }
        if (subGenre && !existing.subGenreIds.includes(subGenre.id)) {
          existing.subGenreIds.push(subGenre.id);
        }
      } else {
        const image = attraction.images?.find(
          (img) => img.ratio === "16_9" && img.width >= 640
        );
        artistMap.set(attraction.id, {
          id: attraction.id,
          name: attraction.name,
          imageUrl: image?.url,
          concertCount: 1,
          dates: [concertDate],
          genreIds: genre ? [genre.id] : [],
          subGenreIds: subGenre ? [subGenre.id] : [],
        });
      }
    }
  }

  // Sort artists by earliest concert date
  const artists = Array.from(artistMap.values()).sort((a, b) =>
    (a.dates[0]?.localDate ?? "").localeCompare(b.dates[0]?.localDate ?? "")
  );

  // Build final genre tree: sort genres and subGenres alphabetically, strip internal Set
  const genreTree: GenreItem[] = Array.from(genreMap.values())
    .map(({ subGenreSet: _set, ...g }) => ({
      ...g,
      subGenres: g.subGenres.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { artists, genreTree };
}
