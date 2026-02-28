"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConcertList } from "@/components/ConcertList";
import { PlaylistBuilder } from "@/components/PlaylistBuilder";
import type { MusicService } from "@/types";
import type { ArtistWithConcerts } from "@/lib/ticketmaster";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radius = parseInt(searchParams.get("radius") ?? "50", 10);
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const service = (searchParams.get("service") ?? null) as MusicService | null;
  const locationName = searchParams.get("locationName") ?? "your area";

  const [artists, setArtists] = useState<ArtistWithConcerts[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function loadConcerts() {
    if (isNaN(lat) || isNaN(lng) || !startDate || !endDate) {
      setFetchError("Invalid search parameters. Please go back and try again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
        startDate,
        endDate,
      });

      const res = await fetch(`/api/concerts?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setArtists(data.artists ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConcerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serviceLabel =
    service === "spotify"
      ? "Spotify"
      : service === "apple-music"
      ? "Apple Music"
      : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        onClick={() => router.push(`/?${searchParams.toString()}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Search
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar: playlist builder */}
        {service && (
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">
                  Create {serviceLabel} Playlist
                </CardTitle>
                <CardDescription>
                  {loading
                    ? "Loading artists…"
                    : `${artists.length} artist${artists.length !== 1 ? "s" : ""} found`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!loading && artists.length > 0 && (
                  <PlaylistBuilder service={service} artists={artists} />
                )}
                {!loading && artists.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No artists found. Try adjusting your search.
                  </p>
                )}
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finding concerts…
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main content: concert list */}
        <div
          className={`order-1 lg:order-2 ${service ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          <div className="mb-4">
            <h2 className="text-2xl font-bold">
              Concerts near{" "}
              <span className="text-primary">
                {locationName.split(",")[0]}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {radius} mile radius · {startDate} → {endDate}
            </p>
          </div>

          <Separator className="mb-6" />

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Searching for concerts via Ticketmaster…
              </p>
            </div>
          )}

          {fetchError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-red-700 font-medium">
                  Failed to load concerts
                </p>
                <p className="text-sm text-red-600">{fetchError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadConcerts}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !fetchError && <ConcertList artists={artists} />}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
