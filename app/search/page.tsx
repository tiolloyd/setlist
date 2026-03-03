"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LocationInput } from "@/components/LocationInput";
import { RadiusSlider } from "@/components/RadiusSlider";
import { DateRangePicker } from "@/components/DateRangePicker";
import { useMusicService } from "@/contexts/MusicServiceContext";
import { useConcerts } from "@/contexts/ConcertsContext";
import type { LocationData } from "@/types";

const today = format(new Date(), "yyyy-MM-dd");
const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM-dd");

interface SearchSettings {
  location: LocationData | null;
  radiusMiles: number;
  startDate: string;
  endDate: string;
}

const SERVICE_LABELS: Record<string, string> = {
  spotify: "Spotify",
  "apple-music": "Apple Music",
  qobuz: "Qobuz",
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedService } = useMusicService();
  const { setResults } = useConcerts();

  const [settings, setSettings] = useState<SearchSettings>(() => {
    const lat = parseFloat(searchParams.get("lat") ?? "");
    const lng = parseFloat(searchParams.get("lng") ?? "");
    const locationName = searchParams.get("locationName") ?? "";
    const radius = parseInt(searchParams.get("radius") ?? "", 10);
    const startDate = searchParams.get("startDate") ?? today;
    const endDate = searchParams.get("endDate") ?? nextMonth;

    return {
      location:
        !isNaN(lat) && !isNaN(lng) && locationName
          ? { lat, lng, displayName: locationName }
          : null,
      radiusMiles: !isNaN(radius) ? radius : 50,
      startDate,
      endDate,
    };
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  function patch<K extends keyof SearchSettings>(
    key: K,
    value: SearchSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!settings.location) {
      setValidationError("Please select a location before searching.");
      return;
    }

    if (!selectedService) {
      router.push("/");
      return;
    }

    setFetching(true);
    setValidationError(null);

    const concertParams = new URLSearchParams({
      lat: String(settings.location.lat),
      lng: String(settings.location.lng),
      locationName: settings.location.displayName,
      radius: String(settings.radiusMiles),
      startDate: settings.startDate,
      endDate: settings.endDate,
      service: selectedService,
    });

    try {
      const res = await fetch(`/api/concerts?${concertParams}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const paramString = concertParams.toString();
      setResults(data.artists ?? [], data.genreTree ?? [], paramString);

      // Skip genre picker if there's no usable genre data
      if ((data.genreTree ?? []).length === 0) {
        router.push(`/results?${paramString}`);
      } else {
        router.push("/genres");
      }
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Search failed. Please try again."
      );
      setFetching(false);
    }
  }

  const serviceLabel = selectedService
    ? SERVICE_LABELS[selectedService] ?? selectedService
    : null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">

      {/* Service indicator */}
      {serviceLabel && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Searching with{" "}
            <span className="text-brand-white font-semibold">{serviceLabel}</span>
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xs text-brand-red hover:text-brand-red-dark underline underline-offset-2"
          >
            Change service
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Settings</CardTitle>
            <CardDescription>
              Tell us where you are and what you&apos;re looking for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Location</p>
              <LocationInput
                value={settings.location}
                onChange={(loc) => patch("location", loc)}
              />
            </div>

            <Separator />

            {/* Radius */}
            <RadiusSlider
              value={settings.radiusMiles}
              onChange={(v) => patch("radiusMiles", v)}
            />

            <Separator />

            {/* Date range */}
            <DateRangePicker
              startDate={settings.startDate}
              endDate={settings.endDate}
              onStartChange={(d) => patch("startDate", d)}
              onEndChange={(d) => patch("endDate", d)}
            />

            {validationError && (
              <p className="text-sm text-brand-red bg-brand-gray border border-brand-red px-3 py-2 rounded-sm">
                {validationError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={fetching}
            >
              {fetching ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              {fetching ? "Searching…" : "Find Concerts"}
            </Button>
          </CardContent>
        </Card>
      </form>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
        <div>
          <div className="text-2xl font-bold text-foreground mb-1">Free</div>
          <div>No account required to search</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground mb-1">50mi</div>
          <div>Default search radius</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground mb-1">50+</div>
          <div>Concerts per search</div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
