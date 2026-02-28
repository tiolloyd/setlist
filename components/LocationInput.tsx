"use client";

import { useState } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocodeQuery } from "@/lib/geocoding";
import type { LocationData } from "@/types";

// "Portland, Multnomah County, Oregon, United States" → "Portland, Oregon"
function formatDisplayName(raw: string): string {
  const parts = raw.split(", ");
  if (parts.length >= 3) {
    return `${parts[0]}, ${parts[parts.length - 2]}`;
  }
  return raw;
}

interface LocationInputProps {
  value: LocationData | null;
  onChange: (location: LocationData) => void;
}

export function LocationInput({ value, onChange }: LocationInputProps) {
  const [query, setQuery] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useMyLocation() {
    setError(null);
    setGeoLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          maximumAge: 60_000,
        })
      );
      const { latitude: lat, longitude: lng } = position.coords;

      // Reverse geocode to get display name
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "User-Agent": "ConcertPlaylistApp/1.0 (tiolloyd@gmail.com)",
            "Accept-Language": "en",
          },
        }
      );
      const data = await res.json();
      const city =
        data.address?.city ?? data.address?.town ?? data.address?.village;
      const state = data.address?.state;
      const displayName =
        city && state
          ? `${city}, ${state}`
          : city ?? data.address?.county ?? data.display_name ?? `${lat.toFixed(3)}, ${lng.toFixed(3)}`;

      onChange({ lat, lng, displayName });
    } catch (err) {
      const msg =
        err instanceof GeolocationPositionError
          ? err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Please enter a city or ZIP code manually."
            : "Could not determine your location. Please enter it manually."
          : "Location lookup failed. Please enter a city or ZIP code.";
      setError(msg);
    } finally {
      setGeoLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setSearchLoading(true);
    try {
      const result = await geocodeQuery(query.trim());
      if (!result) {
        setError(`Could not find "${query}". Try a different city or ZIP code.`);
      } else {
        onChange({ ...result, displayName: formatDisplayName(result.displayName) });
        setQuery("");
      }
    } catch {
      setError("Geocoding failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={useMyLocation}
          disabled={geoLoading || searchLoading}
          className="shrink-0"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          Use My Location
        </Button>

        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="City or ZIP code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={geoLoading || searchLoading}
          />
          <Button type="submit" disabled={!query.trim() || geoLoading || searchLoading}>
            {searchLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {value && (
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{value.displayName}</span>
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </p>
      )}
    </div>
  );
}
