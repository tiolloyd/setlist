"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocodeQuery } from "@/lib/geocoding";
import type { LocationData } from "@/types";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

// "Portland, Multnomah County, Oregon, United States" → "Portland, Oregon"
function formatDisplayName(raw: string): string {
  const parts = raw.split(", ");
  if (parts.length >= 3) {
    return `${parts[0]}, ${parts[parts.length - 2]}`;
  }
  return raw;
}

function formatSuggestion(result: NominatimResult): { primary: string; secondary: string } {
  const addr = result.address;
  const city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? "";
  const state = addr?.state ?? "";
  const country = addr?.country ?? "";
  const primary = city || result.display_name.split(", ")[0];
  const secondary = [state, country].filter(Boolean).join(", ");
  return { primary, secondary };
}

function formatResultDisplayName(result: NominatimResult): string {
  const addr = result.address;
  if (addr) {
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county;
    const state = addr.state;
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
  }
  return formatDisplayName(result.display_name);
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
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef("");

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchSuggestions(q: string) {
    latestQueryRef.current = q;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "ConcertPlaylistApp/1.0 (tiolloyd@gmail.com)",
            "Accept-Language": "en",
          },
        }
      );
      const data: NominatimResult[] = await res.json();
      if (latestQueryRef.current === q) {
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      }
    } catch {
      // Fail silently — user can still submit manually
    }
  }

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(val.trim());
    }, 300);
  }

  function handleSuggestionSelect(result: NominatimResult) {
    onChange({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: formatResultDisplayName(result),
    });
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
  }

  async function useMyLocation() {
    setError(null);
    setGeoLoading(true);
    setShowDropdown(false);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          maximumAge: 60_000,
        })
      );
      const { latitude: lat, longitude: lng } = position.coords;

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

    // If suggestions are showing, select the first one
    if (showDropdown && suggestions.length > 0) {
      handleSuggestionSelect(suggestions[0]);
      return;
    }

    setError(null);
    setSearchLoading(true);
    setShowDropdown(false);
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
          <div className="relative flex-1" ref={containerRef}>
            <Input
              type="text"
              placeholder="City or ZIP code…"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowDropdown(false);
              }}
              disabled={geoLoading || searchLoading}
              autoComplete="off"
            />

            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-0.5 bg-brand-black border border-brand-gray-light shadow-lg divide-y divide-brand-gray-light">
                {suggestions.map((result, i) => {
                  const { primary, secondary } = formatSuggestion(result);
                  return (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent input blur so the click registers
                        e.preventDefault();
                        handleSuggestionSelect(result);
                      }}
                      className="w-full text-left px-3 py-2.5 border-l-2 border-transparent hover:border-brand-red hover:bg-brand-red/10 transition-colors flex flex-col gap-0.5"
                    >
                      <span className="text-sm text-brand-white font-medium">{primary}</span>
                      {secondary && (
                        <span className="text-xs text-muted-foreground">{secondary}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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
        <p className="text-sm text-green-400 bg-green-950 border border-green-700 px-3 py-2 rounded-sm flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{value.displayName}</span>
        </p>
      )}

      {error && (
        <p className="text-sm text-brand-red bg-brand-gray border border-brand-red px-3 py-2 rounded-sm">
          {error}
        </p>
      )}
    </div>
  );
}
